const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');
const { User, Course, Material, QuizData, QuizResults, AssignmentSubmission, Note, ActivityLog } = require('../models/schemas');
const { ScheduledInterview, InterviewSession, ProctoredLog } = require('../models/interviewSchemas');
const { logActivity, backfillUserActivities } = require('../utils/activityLogger');
const { callGeminiAPI } = require('../utils/geminiClient');
const { getVerifiedVideos } = require('../utils/videoSearch');

const JWT_SECRET = process.env.JWT_SECRET;
const GEMINI_PRIMARY_KEY = process.env.GEMINI_API_KEY;
const GEMINI_SECONDARY_KEY = process.env.GEMINI_SECONDARY_KEY;

// Email format validation helper
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// 1. Auth Controllers
const authCtrl = {
  register: async (req, res) => {
    try {
      const { fullName, email, password, role, domain, commitment, experience, learningStyle } = req.body;
      if (!fullName || !email || !password) return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
      if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });

      const userExists = await User.findOne({ email });
      if (userExists) return res.status(400).json({ success: false, message: 'An account with this email already exists.' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({ fullName, email, password: hashedPassword, role, domain, commitment, experience, learningStyle });
      await newUser.save();
      res.status(201).json({ success: true, message: 'Account created successfully.' });
    } catch (err) {
      console.error('Registration error:', err.message);
      res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });
      if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });

      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials.' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials.' });

      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      res.status(200).json({ success: true, token, user: { id: user._id, fullName: user.fullName, email: user.email } });
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
  },

  googleLogin: async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ success: false, message: 'Google token is required.' });

      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) return res.status(500).json({ success: false, message: 'Google OAuth is not configured on the server.' });

      // Use the access_token to fetch user info from Google
      const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!userInfoResponse.ok) {
        return res.status(401).json({ success: false, message: 'Invalid Google token.' });
      }

      const googleUser = await userInfoResponse.json();
      const { sub: googleId, name, email } = googleUser;

      if (!email) return res.status(400).json({ success: false, message: 'Could not retrieve email from Google account.' });

      // Check if user already exists
      let user = await User.findOne({ email });
      let isNewUser = false;

      if (!user) {
        // Create new user with Google credentials (no password needed)
        user = new User({
          fullName: name || 'Google User',
          email,
          googleId,
          role: 'Student',
          domain: 'Programming',
          commitment: '1 Hour',
          experience: 'Beginner',
          learningStyle: 'Videos'
        });
        await user.save();
        isNewUser = true;
      } else if (!user.googleId) {
        // Link Google account to existing user
        user.googleId = googleId;
        await user.save();
      }

      const jwtToken = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      res.status(200).json({
        success: true,
        token: jwtToken,
        isNewUser,
        user: { id: user._id, fullName: user.fullName, email: user.email, name: user.fullName }
      });
    } catch (err) {
      console.error('Google auth error:', err.message);
      res.status(500).json({ success: false, message: 'Google authentication failed.' });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const uid = req.user.userId;
      const { fullName, email, role, domain, commitment, experience, learningStyle, password } = req.body;

      if (!fullName || !email) {
        return res.status(400).json({ success: false, message: 'Full name and email are required.' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      }

      const existingUser = await User.findOne({ email, _id: { $ne: uid } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const updateData = {
        fullName,
        email,
        role,
        domain,
        commitment,
        experience,
        learningStyle
      };

      if (password && password.trim() !== '') {
        if (password.length < 6) {
          return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }

      const updatedUser = await User.findByIdAndUpdate(uid, { $set: updateData }, { new: true });
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user: {
          id: updatedUser._id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          role: updatedUser.role,
          domain: updatedUser.domain,
          commitment: updatedUser.commitment,
          experience: updatedUser.experience,
          learningStyle: updatedUser.learningStyle
        }
      });
    } catch (err) {
      console.error('Update profile error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to update profile. Please try again.' });
    }
  }
};

// 2. Dashboard Analytics
const dashboardCtrl = {
  getAnalytics: async (req, res) => {
    try {
      const uid = req.user.userId;

      // 1. Run backfill migration retroactively to align historic data
      await backfillUserActivities(uid);

      // 2. Parse request query filters
      const { courseId, timeRange, status, difficulty, activityType, startDate, endDate } = req.query;

      // 3. Construct the filter matches
      const query = { userId: new mongoose.Types.ObjectId(uid) };

      // Time Range Filter
      if (startDate && endDate) {
        query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
      } else if (timeRange && timeRange !== 'All') {
        const now = new Date();
        let startBound = new Date();
        if (timeRange === 'Today') {
          startBound.setHours(0, 0, 0, 0);
        } else if (timeRange === 'Yesterday') {
          const yesterdayStart = new Date();
          yesterdayStart.setDate(now.getDate() - 1);
          yesterdayStart.setHours(0, 0, 0, 0);
          const yesterdayEnd = new Date();
          yesterdayEnd.setDate(now.getDate() - 1);
          yesterdayEnd.setHours(23, 59, 59, 999);
          query.timestamp = { $gte: yesterdayStart, $lte: yesterdayEnd };
        } else if (timeRange === 'Last 7 Days') {
          startBound.setDate(now.getDate() - 7);
          startBound.setHours(0, 0, 0, 0);
        } else if (timeRange === 'Last 30 Days') {
          startBound.setDate(now.getDate() - 30);
          startBound.setHours(0, 0, 0, 0);
        } else if (timeRange === 'Last 90 Days') {
          startBound.setDate(now.getDate() - 90);
          startBound.setHours(0, 0, 0, 0);
        } else if (timeRange === 'This Year') {
          startBound = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        }
        if (timeRange !== 'Yesterday') {
          query.timestamp = { $gte: startBound, $lte: now };
        }
      }

      // Relational filters (Course, Status, Difficulty)
      let allowedCourseIds = null;

      // Filter by course status
      if (status && status !== 'All') {
        const allUserCourses = await Course.find({ userId: uid });
        const statusMatchedIds = [];
        allUserCourses.forEach(c => {
          let totalTopics = 0;
          c.modules.forEach(m => { totalTopics += m.topics ? m.topics.length : 0; });
          const completedCount = c.completedTopics ? c.completedTopics.length : 0;
          const progress = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

          let cStatus = 'Not Started';
          if (progress === 100) cStatus = 'Completed';
          else if (progress > 0) cStatus = 'In Progress';
          
          if (status === 'Completed' && cStatus === 'Completed') statusMatchedIds.push(c._id);
          else if ((status === 'In Progress' || status === 'Started') && cStatus === 'In Progress') statusMatchedIds.push(c._id);
          else if (status === 'Not Started' && cStatus === 'Not Started') statusMatchedIds.push(c._id);
        });
        allowedCourseIds = statusMatchedIds;
      }

      // Filter by course difficulty
      if (difficulty && difficulty !== 'All') {
        const levelCourses = await Course.find({ userId: uid, level: difficulty }).select('_id');
        const levelIds = levelCourses.map(c => c._id.toString());
        if (allowedCourseIds === null) {
          allowedCourseIds = levelIds;
        } else {
          allowedCourseIds = allowedCourseIds.filter(id => levelIds.includes(id.toString()));
        }
      }

      // Filter by specific courseId
      if (courseId && courseId !== 'All') {
        const selectedIds = courseId.split(',').map(id => id.trim());
        if (allowedCourseIds === null) {
          allowedCourseIds = selectedIds;
        } else {
          allowedCourseIds = allowedCourseIds.filter(id => selectedIds.includes(id.toString()));
        }
      }

      if (allowedCourseIds !== null) {
        query.courseId = { $in: allowedCourseIds.map(id => new mongoose.Types.ObjectId(id)) };
      }

      // Filter by activityType selector
      if (activityType && activityType !== 'All') {
        if (activityType === 'Modules') {
          query.activityType = { $in: ['Module Started', 'Module Completed'] };
        } else if (activityType === 'Notes') {
          query.activityType = { $in: ['Notes Saved', 'Notes Edited'] };
        } else if (activityType === 'Quizzes') {
          query.activityType = { $in: ['Quiz Started', 'Quiz Completed'] };
        } else if (activityType === 'Assignments') {
          query.activityType = { $in: ['Assignment Submitted', 'Assignment Reviewed'] };
        } else if (activityType === 'Interviews') {
          query.activityType = { $in: ['Interview Scheduled', 'Interview Completed'] };
        }
      }

      // 4. Fetch the dynamic filtered activity logs
      const logs = await ActivityLog.find(query).sort({ timestamp: -1 });

      // 5. Gather unique active dates to compute streaks
      const activeDates = new Set();
      logs.forEach(l => {
        if (l.timestamp) activeDates.add(new Date(l.timestamp).toISOString().split('T')[0]);
      });

      let currentStreak = 0;
      let longestStreak = 0;
      const today = new Date();

      if (activeDates.size > 0) {
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let checkDate = activeDates.has(todayStr) ? new Date() : (activeDates.has(yesterdayStr) ? yesterday : null);

        if (checkDate) {
          while (true) {
            const checkStr = checkDate.toISOString().split('T')[0];
            if (activeDates.has(checkStr)) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
        }

        let tempStreak = 0;
        let allDates = Array.from(activeDates).map(d => new Date(d)).sort((a, b) => a - b);
        if (allDates.length > 0) {
          tempStreak = 1;
          longestStreak = 1;
          for (let i = 1; i < allDates.length; i++) {
            const diffTime = Math.abs(allDates[i] - allDates[i - 1]);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              tempStreak++;
              if (tempStreak > longestStreak) longestStreak = tempStreak;
            } else if (diffDays > 1) {
              tempStreak = 1;
            }
          }
        }
      }
      longestStreak = Math.max(longestStreak, currentStreak);

      // 6. Calculate Quick Metrics
      const totalCourses = courseId && courseId !== 'All' 
        ? courseId.split(',').length 
        : await Course.countDocuments({ userId: uid });
      const totalNotes = logs.filter(l => l.activityType === 'Notes Saved').length;
      const evaluatedAssignments = logs.filter(l => l.activityType === 'Assignment Reviewed').length;
      const totalInterviewsScheduled = logs.filter(l => l.activityType === 'Interview Scheduled').length;
      const totalInterviewsCompleted = logs.filter(l => l.activityType === 'Interview Completed').length;
      const modulesCompletedCount = logs.filter(l => l.activityType === 'Module Completed').length;

      // Quiz and Interview Scores
      const quizLogs = logs.filter(l => l.activityType === 'Quiz Completed');
      const totalQuizScore = quizLogs.reduce((acc, curr) => acc + (curr.metadata?.scorePercentage || 0), 0);
      const averageQuizScore = quizLogs.length > 0 ? Math.round(totalQuizScore / quizLogs.length) : 0;

      const intLogs = logs.filter(l => l.activityType === 'Interview Completed');
      const totalIntScore = intLogs.reduce((acc, curr) => acc + (curr.metadata?.accuracyScore || 0), 0);
      const averageInterviewScore = intLogs.length > 0 ? Math.round(totalIntScore / intLogs.length) : 0;

      // Flagged Interviews
      const totalFlaggedInterviews = await ProctoredLog.countDocuments({ 
        userId: uid, 
        isFlaggedForCheating: true,
        interviewId: { $in: logs.filter(l => l.activityType === 'Interview Completed' || l.activityType === 'Interview Scheduled').map(l => l.metadata?.interviewId || l._id) }
      });

      // Calculate XP and study time dynamically from matching logs
      let xp = 0;
      let learningHours = 0;
      logs.forEach(l => {
        let xpWeight = 0;
        let hourWeight = 0;
        if (l.activityType === 'Course Generated') { xpWeight = 20; hourWeight = 0.2; }
        else if (l.activityType === 'Course Started') { xpWeight = 30; hourWeight = 0.5; }
        else if (l.activityType === 'Module Started') { xpWeight = 10; hourWeight = 0.5; }
        else if (l.activityType === 'Module Completed') { xpWeight = 50; hourWeight = 2.0; }
        else if (l.activityType === 'Notes Saved') { xpWeight = 15; hourWeight = 0.2; }
        else if (l.activityType === 'Notes Edited') { xpWeight = 5; hourWeight = 0.1; }
        else if (l.activityType === 'Quiz Started') { xpWeight = 5; hourWeight = 0.1; }
        else if (l.activityType === 'Quiz Completed') { xpWeight = 50; hourWeight = 0.25; }
        else if (l.activityType === 'Assignment Submitted') { xpWeight = 20; hourWeight = 1.0; }
        else if (l.activityType === 'Assignment Reviewed') { xpWeight = 80; hourWeight = 1.0; }
        else if (l.activityType === 'Interview Scheduled') { xpWeight = 10; hourWeight = 0.2; }
        else if (l.activityType === 'Interview Completed') { xpWeight = 100; hourWeight = 0.5; }
        else if (l.activityType === 'Certificate Generated') { xpWeight = 200; hourWeight = 0.5; }

        xp += xpWeight;
        learningHours += hourWeight;
      });
      learningHours = Math.round(learningHours * 10) / 10;

      const level = Math.floor(xp / 300) + 1;
      const xpToNextLevel = 300 - (xp % 300);
      const xpProgressPercent = Math.round(((xp % 300) / 300) * 100);

      // 7. Course Progress List (Filter user courses relationally)
      const allUserCourses = await Course.find({ userId: uid });
      const filteredCourses = allowedCourseIds !== null
        ? allUserCourses.filter(c => allowedCourseIds.map(id => id.toString()).includes(c._id.toString()))
        : allUserCourses;

      const courseProgressList = await Promise.all(filteredCourses.map(async (course) => {
        let totalTopics = 0;
        course.modules.forEach(m => { totalTopics += m.topics ? m.topics.length : 0; });
        const completedTopicsCount = course.completedTopics ? course.completedTopics.length : 0;
        const percentProgress = totalTopics > 0 ? Math.round((completedTopicsCount / totalTopics) * 100) : 0;

        let completedModules = 0;
        course.modules.forEach(m => {
          let moduleTopicsCount = m.topics ? m.topics.length : 0;
          let completedModuleTopics = 0;
          if (m.topics) {
            m.topics.forEach((t, idx) => {
              const key = `mod-${m.dayId}-topic-${idx}`;
              if (course.completedTopics && course.completedTopics.includes(key)) {
                completedModuleTopics++;
              }
            });
          }
          if (moduleTopicsCount > 0 && completedModuleTopics === moduleTopicsCount) {
            completedModules++;
          }
        });

        const notesCount = await Note.countDocuments({ userId: uid, courseId: course._id });
        const assignmentsCount = await AssignmentSubmission.countDocuments({ userId: uid, courseId: course._id, status: 'Evaluated' });
        
        // Quizzes
        const quizIds = await QuizData.find({ courseId: course._id }).select('_id');
        const courseQuizzes = await QuizResults.find({ userId: uid, quizDataId: { $in: quizIds } });
        const totalScore = courseQuizzes.reduce((acc, curr) => acc + curr.scorePercentage, 0);
        const avgQuizScore = courseQuizzes.length > 0 ? Math.round(totalScore / courseQuizzes.length) : 0;

        // Interviews
        const courseInterviews = await ScheduledInterview.find({ userId: uid, courseId: course._id });
        let totalIntAccuracy = 0;
        let completedInts = 0;
        for (const i of courseInterviews) {
          if (i.status === 'Completed') {
            completedInts++;
            const session = await InterviewSession.findOne({ interviewId: i._id });
            if (session && session.conversationContext) {
              const answers = session.conversationContext.filter(c => c.role === 'candidate');
              if (answers.length > 0) {
                totalIntAccuracy += Math.round(answers.reduce((acc, curr) => acc + (curr.accuracyScore || 0), 0) / answers.length);
              }
            }
          }
        }
        const avgInterviewScore = completedInts > 0 ? Math.round(totalIntAccuracy / completedInts) : 0;

        // Est Completion
        const diffTime = Math.abs(new Date() - new Date(course.createdAt));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        let estCompletionDays = 0;
        if (percentProgress > 0 && percentProgress < 100) {
          const rate = percentProgress / diffDays;
          estCompletionDays = Math.ceil((100 - percentProgress) / rate);
        } else if (percentProgress === 0) {
          estCompletionDays = course.modules.length * 2;
        }

        return {
          courseId: course._id,
          title: course.title,
          level: course.level,
          totalModules: course.modules.length,
          completedModules,
          remainingModules: course.modules.length - completedModules,
          percentProgress,
          notesCreated: notesCount,
          quizAverage: avgQuizScore,
          assignmentCompletion: assignmentsCount,
          interviewAccuracy: avgInterviewScore,
          totalStudyTime: completedTopicsCount * 0.5,
          lastActivity: course.createdAt,
          estimatedCompletion: estCompletionDays > 0 ? `${estCompletionDays} days` : 'Completed'
        };
      }));

      // 8. Certificates count
      const certificatesCount = courseProgressList.filter(c => c.percentProgress === 100).length;

      // 9. Heatmap Data (Last 112 days)
      const heatmapData = [];
      for (let i = 111; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const count = logs.filter(l => new Date(l.timestamp).toISOString().split('T')[0] === dateStr).length;
        heatmapData.push({ date: dateStr, count });
      }

      // 10. Weekly Study Hours (Dynamic based on selected timeframe)
      const weeklyStudyHours = [];
      const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        let hours = 0;
        const dayLogs = logs.filter(l => new Date(l.timestamp).toISOString().split('T')[0] === dateStr);
        dayLogs.forEach(l => {
          let hourWeight = 0;
          if (l.activityType === 'Course Generated') hourWeight = 0.2;
          else if (l.activityType === 'Course Started') hourWeight = 0.5;
          else if (l.activityType === 'Module Started') hourWeight = 0.5;
          else if (l.activityType === 'Module Completed') hourWeight = 2.0;
          else if (l.activityType === 'Notes Saved') hourWeight = 0.2;
          else if (l.activityType === 'Notes Edited') hourWeight = 0.1;
          else if (l.activityType === 'Quiz Started') hourWeight = 0.1;
          else if (l.activityType === 'Quiz Completed') hourWeight = 0.25;
          else if (l.activityType === 'Assignment Submitted') hourWeight = 1.0;
          else if (l.activityType === 'Assignment Reviewed') hourWeight = 1.0;
          else if (l.activityType === 'Interview Scheduled') hourWeight = 0.2;
          else if (l.activityType === 'Interview Completed') hourWeight = 0.5;
          else if (l.activityType === 'Certificate Generated') hourWeight = 0.5;
          hours += hourWeight;
        });

        weeklyStudyHours.push({
          day: weekdayNames[d.getDay()],
          date: dateStr,
          hours: Math.round(hours * 10) / 10
        });
      }

      // 11. Calendar Data Map YYYY-MM-DD
      const calendarData = {};
      logs.forEach(l => {
        const dateStr = new Date(l.timestamp).toISOString().split('T')[0];
        if (!calendarData[dateStr]) {
          calendarData[dateStr] = { studyHours: 0, completedModules: 0, quizAttempts: 0, assignments: 0 };
        }
        const cell = calendarData[dateStr];

        let hourWeight = 0;
        if (l.activityType === 'Course Generated') hourWeight = 0.2;
        else if (l.activityType === 'Course Started') hourWeight = 0.5;
        else if (l.activityType === 'Module Started') hourWeight = 0.5;
        else if (l.activityType === 'Module Completed') hourWeight = 2.0;
        else if (l.activityType === 'Notes Saved') hourWeight = 0.2;
        else if (l.activityType === 'Notes Edited') hourWeight = 0.1;
        else if (l.activityType === 'Quiz Started') hourWeight = 0.1;
        else if (l.activityType === 'Quiz Completed') hourWeight = 0.25;
        else if (l.activityType === 'Assignment Submitted') hourWeight = 1.0;
        else if (l.activityType === 'Assignment Reviewed') hourWeight = 1.0;
        else if (l.activityType === 'Interview Scheduled') hourWeight = 0.2;
        else if (l.activityType === 'Interview Completed') hourWeight = 0.5;
        else if (l.activityType === 'Certificate Generated') hourWeight = 0.5;
        
        cell.studyHours += hourWeight;
        if (l.activityType === 'Module Completed') cell.completedModules++;
        if (l.activityType === 'Quiz Completed') cell.quizAttempts++;
        if (l.activityType === 'Assignment Submitted') cell.assignments++;
      });
      Object.keys(calendarData).forEach(d => {
        calendarData[d].studyHours = Math.round(calendarData[d].studyHours * 10) / 10;
      });

      // 12. Quiz and Interview trends (chronological, max 6 items)
      const quizPerformance = logs
        .filter(l => l.activityType === 'Quiz Completed')
        .map(l => ({
          quizName: l.metadata?.quizName || 'Practice Assessment',
          scorePercentage: l.metadata?.scorePercentage || 0,
          evaluatedAt: l.timestamp
        }))
        .sort((a, b) => new Date(a.evaluatedAt) - new Date(b.evaluatedAt))
        .slice(-6);

      const interviewPerformance = logs
        .filter(l => l.activityType === 'Interview Completed')
        .map(l => ({
          avgAccuracy: l.metadata?.accuracyScore || 0,
          createdAt: l.timestamp
        }))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(-6);

      // 13. Chronological timeline activities
      const recentActivities = logs
        .map(l => {
          const matchedC = allUserCourses.find(c => c._id.toString() === l.courseId?.toString());
          const matchedM = matchedC?.modules?.find(m => m.dayId === l.moduleId);
          return {
            id: l._id,
            courseTitle: matchedC ? matchedC.title : 'General Study',
            moduleTitle: matchedM ? matchedM.title : `Module ${l.moduleId || 1}`,
            dayId: l.moduleId || 1,
            topic: l.topic || matchedM?.title || 'Core Syllabus',
            action: l.activityType,
            date: new Date(l.timestamp).toLocaleDateString(),
            time: new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: l.status || 'Completed',
            metadata: l.metadata || {}
          };
        })
        .slice(0, 30); // Return up to 30 items for timeline

      // 14. AI Insights & Predictions
      const weakestTopics = Array.from(new Set(logs.filter(l => l.activityType === 'Quiz Completed' && (l.metadata?.scorePercentage || 0) < 70).map(l => l.topic))).slice(0, 3);
      const strongestTopics = Array.from(new Set(logs.filter(l => l.activityType === 'Quiz Completed' && (l.metadata?.scorePercentage || 0) >= 85).map(l => l.topic))).slice(0, 3);

      const user = await User.findById(uid);
      const userDomain = user?.domain || 'Programming';
      const userExp = user?.experience || 'Beginner';

      const recommendedNextCourse = userExp === 'Beginner'
        ? `Intermediate ${userDomain} Masterclass`
        : `Advanced Masterclass in ${userDomain}`;

      const activeDaysCount = activeDates.size;
      const consistencyScore = Math.min(100, Math.round((activeDaysCount / 30) * 100)); // out of 30 days window

      const completionPrediction = courseProgressList.length > 0 && courseProgressList[0].percentProgress < 100
        ? `Completion of "${courseProgressList[0].title}" predicted in ${Math.ceil((100 - courseProgressList[0].percentProgress) / 10) || 1} days`
        : "Ready to generate another expert roadmap!";

      const learningConsistency = currentStreak > 0
        ? `Consistently learning! Streak count: ${currentStreak} days.`
        : "Complete a topic today to boot up a study streak!";

      // 15. Achievements Badge matrix
      const allBadges = [
        { id: 'first-course', title: 'First Course', desc: 'Generated your first learning roadmap', unlocked: allUserCourses.length >= 1, icon: 'Sparkles' },
        { id: 'quiz-master', title: 'Quiz Master', desc: 'Score 90%+ in any module quiz', unlocked: logs.some(l => l.activityType === 'Quiz Completed' && (l.metadata?.scorePercentage || 0) >= 90), icon: 'Trophy' },
        { id: 'streak-7', title: '7 Day Streak', desc: 'Maintain learning consistency for 7 days', unlocked: longestStreak >= 7, icon: 'Flame' },
        { id: 'streak-30', title: '30 Day Streak', desc: 'Maintain learning consistency for 30 days', unlocked: longestStreak >= 30, icon: 'Award' },
        { id: 'interview-done', title: 'Interview Master', desc: 'Completed oral AI proctored evaluation', unlocked: totalInterviewsCompleted >= 1, icon: 'MessageSquare' },
        { id: 'assignment-expert', title: 'Assignment Expert', desc: 'Code submitted and evaluated by AI', unlocked: evaluatedAssignments >= 1, icon: 'CheckCircle2' }
      ];

      res.status(200).json({
        success: true,
        analytics: {
          totalCourses,
          totalNotes,
          evaluatedAssignments,
          averageQuizScore,
          averageInterviewScore,
          totalInterviewsScheduled,
          totalInterviewsCompleted,
          totalFlaggedInterviews,
          xp,
          level,
          xpProgressPercent,
          xpToNextLevel,
          learningHours,
          currentStreak,
          longestStreak,
          certificatesCount,
          modulesCompletedCount
        },
        courseProgressList,
        quizPerformance,
        interviewPerformance,
        heatmapData,
        weeklyStudyHours,
        calendarData,
        recentActivities,
        allBadges,
        aiInsights: {
          weakestTopics,
          strongestTopics,
          suggestedRevisionTopics: weakestTopics.length > 0 ? weakestTopics : (filteredCourses[0]?.modules[0]?.topics || ['Core concepts']),
          recommendedNextCourse,
          completionPrediction,
          learningConsistency,
          consistencyScore
        }
      });

    } catch (err) {
      console.error('Analytics engine failure:', err.message);
      res.status(500).json({ success: false, message: "Failed to compile learning analytics." });
    }
  }
};

// 3. AI Course Generation & Material
const pedagogyCtrl = {
  generateCourse: async (req, res) => {
    const { prompt, level } = req.body;
    if (!prompt) return res.status(400).json({ success: false, error: 'Prompt is required.' });
    if (prompt.length > 5000) return res.status(400).json({ success: false, error: 'Prompt is too long (max 5000 characters).' });

    const schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        level: { type: "string" },
        modules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              dayId: { type: "integer" },
              title: { type: "string" },
              duration: { type: "string" },
              objective: { type: "string" },
              topics: { type: "array", items: { type: "string" } },
              curatedSearchQuery: { type: "string" },
              schedules: {
                type: "object",
                properties: {
                  quiz: { type: "object", properties: { name: { type: "string" }, quizTopic: { type: "string" }, duration: { type: "string" } }, required: ["name", "quizTopic", "duration"] },
                  assignment: { type: "object", properties: { name: { type: "string" }, assignmentObjective: { type: "string" }, complexity: { type: "string" } }, required: ["name", "assignmentObjective", "complexity"] }
                },
                required: ["quiz"]
              }
            },
            required: ["dayId", "title", "duration", "objective", "topics", "curatedSearchQuery", "schedules"]
          }
        }
      },
      required: ["title", "level", "modules"]
    };

    const sysPrompt = "You are LuminaLearn's core engine. Output strict Day-wise nested mapping frameworks aligned perfectly with the targeted schema constraints. If the topic/prompt is for a non-technical course (e.g. leadership, art, public speaking, drawing, management, history, meditation, etc.) where hands-on coding or technical assignments are not applicable, omit the 'assignment' block inside 'schedules' entirely. CRITICAL: Generate all content (titles, objectives, topics, quiz and assignment names) in the same language as the user's input prompt (e.g. if prompt is in Hindi, output text in Hindi; if Gujarati, output text in Gujarati; if Spanish, output text in Spanish). However, the JSON keys (title, level, modules, etc.) must remain exactly in English as specified in the schema.";
    try {
      const raw = await callGeminiAPI(GEMINI_PRIMARY_KEY, `Build roadmap context: ${prompt}. Mode Depth: ${level || 'Beginner'}`, sysPrompt, schema);
      const parsed = JSON.parse(raw.trim());
      const course = new Course({ userId: req.user.userId, ...parsed });
      await course.save();

      await logActivity({
        userId: req.user.userId,
        courseId: course._id,
        activityType: 'Course Generated',
        status: 'Success',
        metadata: { courseTitle: course.title, level: course.level }
      });

      res.status(201).json({ success: true, data: course });
    } catch (err) {
      console.error('Course generation error:', err.message);
      res.status(500).json({ success: false, error: 'Failed to generate course. Please try again.' });
    }
  },

  fetchMaterial: async (req, res) => {
    const { courseId, moduleId, topicName } = req.body;
    try {
      let existing = await Material.findOne({ courseId, moduleId, topicName });
      if (existing) {
        if (!existing.videoReferences || existing.videoReferences.length === 0) {
          try {
            const realVideos = await getVerifiedVideos(topicName);
            if (realVideos && realVideos.length > 0) {
              await Material.updateOne(
                { _id: existing._id },
                {
                  $set: {
                    videoReferences: realVideos,
                    videoLink: realVideos[0].embedUrl || realVideos[0].url
                  }
                }
              );
              existing.videoReferences = realVideos;
              existing.videoLink = realVideos[0].embedUrl || realVideos[0].url;
            }
          } catch (searchErr) {
            console.error("Video search failed for existing content:", searchErr.message);
          }
        }
        return res.status(200).json({ success: true, data: existing });
      }

      const target = await Course.findById(courseId);
      const currentLevel = target ? target.level : "Beginner";

      const schema = {
        type: "object",
        properties: {
          htmlContent: { type: "string" },
          videoLink: { type: "string" },
          videoReferences: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                url: { type: "string" },
                embedUrl: { type: "string" }
              },
              required: ["title", "url", "embedUrl"]
            }
          },
          docReferences: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                url: { type: "string" }
              },
              required: ["title", "url"]
            }
          }
        },
        required: ["htmlContent", "videoLink", "videoReferences", "docReferences"]
      };

      const sysPrompt = `You are an elite master educator. Explain the topic deeply inside clean HTML markup styles wrappers tailored for target experience layer: [${currentLevel}]. Avoid markdown syntax blocks.
      You must also provide exactly 1-2 relevant video references and 2 documentation references for the topic.
      For video references, suggest high-quality relevant YouTube video links. Provide standard watch URLs (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ) and their corresponding embed URLs (e.g., https://www.youtube.com/embed/dQw4w9WgXcQ).
      For documentation references, include official technology documentation links or high-quality articles like GeeksforGeeks (e.g., https://www.geeksforgeeks.org/topic-name/) with descriptive titles.`;

      const raw = await callGeminiAPI(GEMINI_SECONDARY_KEY, `Generate deep study guide block elements and references for topic: "${topicName}".`, sysPrompt, schema);
      
      const parsed = JSON.parse(raw.trim());

      try {
        const realVideos = await getVerifiedVideos(topicName);
        if (realVideos && realVideos.length > 0) {
          parsed.videoReferences = realVideos;
          parsed.videoLink = realVideos[0].embedUrl || realVideos[0].url;
        }
      } catch (searchErr) {
        console.error("Video search failed:", searchErr.message);
      }

      const material = new Material({ courseId, moduleId, topicName, ...parsed });
      await material.save();
      res.status(200).json({ success: true, data: material });
    } catch (err) {
      console.error('Material fetch error:', err.message);
      res.status(500).json({ success: false, message: "Failed to load study material." });
    }
  },

  getCourses: async (req, res) => {
    try {
      const listings = await Course.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(100);
      res.status(200).json({ success: true, data: listings });
    } catch (err) {
      console.error('Get courses error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to load courses.' });
    }
  },

  deleteCourse: async (req, res) => {
    try {
      await Course.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
      res.status(200).json({ success: true, message: 'Course deleted successfully.' });
    } catch (err) {
      console.error('Delete course error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to delete course.' });
    }
  },

  updateProgress: async (req, res) => {
    const { id } = req.params;
    const { completedTopics, lastActiveModuleId, lastActiveTopicIndex } = req.body;
    try {
      const oldCourse = await Course.findOne({ _id: id, userId: req.user.userId });
      if (!oldCourse) return res.status(404).json({ success: false, message: "Course not found." });

      const course = await Course.findOneAndUpdate(
        { _id: id, userId: req.user.userId },
        { $set: { completedTopics, lastActiveModuleId, lastActiveTopicIndex } },
        { new: true }
      );

      // 1. Detect Course Started
      const wasStarted = oldCourse.completedTopics && oldCourse.completedTopics.length > 0;
      const isStartedNow = completedTopics && completedTopics.length > 0;
      if (!wasStarted && isStartedNow) {
        await logActivity({
          userId: req.user.userId,
          courseId: course._id,
          activityType: 'Course Started',
          status: 'In Progress',
          metadata: { courseTitle: course.title }
        });
      }

      // 2. Detect Module Started vs Completed
      if (lastActiveModuleId) {
        const moduleObj = course.modules.find(m => m.dayId === lastActiveModuleId);
        if (moduleObj) {
          const oldModuleCompletedKeys = oldCourse.completedTopics.filter(t => t.startsWith(`mod-${lastActiveModuleId}-`));
          const newModuleCompletedKeys = completedTopics.filter(t => t.startsWith(`mod-${lastActiveModuleId}-`));
          
          if (oldModuleCompletedKeys.length === 0 && newModuleCompletedKeys.length > 0) {
            await logActivity({
              userId: req.user.userId,
              courseId: course._id,
              moduleId: lastActiveModuleId,
              activityType: 'Module Started',
              status: 'Started',
              metadata: { courseTitle: course.title, moduleTitle: moduleObj.title }
            });
          }

          const totalModuleTopics = moduleObj.topics ? moduleObj.topics.length : 0;
          if (totalModuleTopics > 0 && newModuleCompletedKeys.length === totalModuleTopics && oldModuleCompletedKeys.length < totalModuleTopics) {
            await logActivity({
              userId: req.user.userId,
              courseId: course._id,
              moduleId: lastActiveModuleId,
              activityType: 'Module Completed',
              status: 'Completed',
              metadata: { courseTitle: course.title, moduleTitle: moduleObj.title }
            });
          }
        }
      }

      // 3. Detect Course 100% Certificate Completed
      let totalSyllabusTopics = 0;
      course.modules.forEach(m => {
        totalSyllabusTopics += m.topics ? m.topics.length : 0;
      });
      const oldCompletedCount = oldCourse.completedTopics ? oldCourse.completedTopics.length : 0;
      const newCompletedCount = completedTopics ? completedTopics.length : 0;
      
      if (totalSyllabusTopics > 0 && newCompletedCount === totalSyllabusTopics && oldCompletedCount < totalSyllabusTopics) {
        await logActivity({
          userId: req.user.userId,
          courseId: course._id,
          activityType: 'Certificate Generated',
          status: 'Success',
          metadata: { courseTitle: course.title }
        });
      }

      res.status(200).json({ success: true, data: course });
    } catch (err) {
      console.error("Update progress error:", err.message);
      res.status(500).json({ success: false, message: "Failed to update course progress." });
    }
  }
};

// 4. Notes System
const workspaceCtrl = {
  saveNote: async (req, res) => {
    const { noteId, courseId, moduleId, moduleName, title, contentHtml } = req.body;
    if (!courseId || moduleId === undefined || !contentHtml) return res.status(400).json({ success: false, message: "Missing required note fields." });

    try {
      let note;
      let activityType = 'Notes Saved';
      if (noteId) {
        note = await Note.findOneAndUpdate({ _id: noteId, userId: req.user.userId }, { title, contentHtml, moduleName, updatedAt: Date.now() }, { new: true });
        activityType = 'Notes Edited';
      } else {
        note = new Note({ userId: req.user.userId, courseId, moduleId, moduleName, title: title || "Untitled Note", contentHtml });
        await note.save();
      }

      await logActivity({
        userId: req.user.userId,
        courseId: note.courseId,
        moduleId: note.moduleId,
        topic: note.title,
        activityType,
        status: 'Success',
        metadata: { noteTitle: note.title, moduleName: note.moduleName }
      });

      res.status(200).json({ success: true, data: note });
    } catch (err) {
      console.error('Save note error:', err.message);
      res.status(500).json({ success: false, message: "Failed to save note." });
    }
  },

  getNotesByCourse: async (req, res) => {
    try {
      const notes = await Note.find({ userId: req.user.userId, courseId: req.params.courseId }).sort({ updatedAt: -1 }).limit(200);
      res.status(200).json({ success: true, data: notes });
    } catch (err) {
      console.error('Get notes error:', err.message);
      res.status(500).json({ success: false, message: "Failed to load notes." });
    }
  },

  deleteNote: async (req, res) => {
    try {
      const note = await Note.findById(req.params.noteId);
      if (!note) return res.status(404).json({ success: false, message: "Note not found." });
      if (note.userId.toString() !== req.user.userId) return res.status(403).json({ success: false, message: "Unauthorized access." });

      await Note.findByIdAndDelete(req.params.noteId);
      res.status(200).json({ success: true, message: "Note deleted successfully." });
    } catch (err) {
      console.error('Delete note error:', err.message);
      res.status(500).json({ success: false, message: "Failed to delete note." });
    }
  },

  generateAINote: async (req, res) => {
    const { topicName, prompt, courseLevel } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required." });
    }
    if (prompt.length > 5000) {
      return res.status(400).json({ success: false, message: "Prompt is too long (max 5000 characters)." });
    }

    try {
      const schema = {
        type: "object",
        properties: {
          title: { type: "string" },
          contentHtml: { type: "string" }
        },
        required: ["title", "contentHtml"]
      };

      const sysPrompt = `You are an elite academic note writer. Create structured, high-quality, formatted study notes in clean HTML based on the user's prompt. 
      Use clean HTML tags like <h1>, <h2>, <p>, <ul>, <li>, <strong>, <em>, and tables if helpful.
      Avoid markdown syntax blocks or wrapper tags. Return the output in strict JSON conforming to the schema.
      CRITICAL: Write the note content (title and contentHtml) in the same language as the user's prompt or topicName (e.g. if user writes in Hindi or asks for Hindi, generate the content in Hindi).`;

      const raw = await callGeminiAPI(
        GEMINI_SECONDARY_KEY,
        `Generate comprehensive notes for the topic: "${topicName || 'General Topic'}". Specific instruction request: "${prompt}". Course depth level: "${courseLevel || 'Beginner'}".`,
        sysPrompt,
        schema
      );

      const parsed = JSON.parse(raw.trim());
      res.status(200).json({ success: true, note: parsed });
    } catch (err) {
      console.error("AI notes generation error:", err.message);
      res.status(500).json({ success: false, message: "Failed to generate notes via AI." });
    }
  }
};

// 5. Assignment Evaluation
const evaluationCtrl = {
  checkAssignmentLock: async (req, res) => {
    const { courseId, moduleId, topicName } = req.body;
    try {
      const sub = await AssignmentSubmission.findOne({ userId: req.user.userId, courseId, moduleId, topicName });
      res.status(200).json({ success: true, isLocked: !!sub, data: sub });
    } catch (err) {
      console.error('Assignment lock check error:', err.message);
      res.status(500).json({ success: false, message: "Failed to check assignment status." });
    }
  },

  submitAssignment: async (req, res) => {
    const { courseId, moduleId, topicName, assignmentType, submittedCodeOrText, submissionUrl } = req.body;
    if (!submittedCodeOrText) return res.status(400).json({ success: false, message: "Submission content is required." });

    try {
      const sub = new AssignmentSubmission({ userId: req.user.userId, courseId, moduleId, topicName, assignmentType: assignmentType || 'CONCEPTUAL', submittedCodeOrText, submissionUrl: submissionUrl || "" });
      await sub.save();

      await logActivity({
        userId: req.user.userId,
        courseId,
        moduleId,
        topic: topicName,
        activityType: 'Assignment Submitted',
        status: 'Success',
        metadata: { assignmentType }
      });

      res.status(201).json({ success: true, message: "Assignment submitted successfully." });
    } catch (err) {
      console.error('Assignment submit error:', err.message);
      res.status(500).json({ success: false, message: "Failed to submit assignment." });
    }
  },

  evaluateAssignmentViaAI: async (req, res) => {
    const { courseId, moduleId, topicName, assignmentType, selectedLanguage, codeOrText } = req.body;
    if (!codeOrText) return res.status(400).json({ success: false, message: "Submission content is required for evaluation." });

    try {
      const schema = {
        type: "object",
        properties: { approachScore: { type: "integer" }, complexityAnalysis: { type: "string" }, architecturalCritique: { type: "string" }, betterAlternativeTemplate: { type: "string" } },
        required: ["approachScore", "complexityAnalysis", "architecturalCritique", "betterAlternativeTemplate"]
      };

      const sysPrompt = "You are a code review and evaluation expert. Evaluate the submission and provide a score from 1-100, complexity analysis, architectural critique, and a better alternative approach. CRITICAL: Generate the critique, explanations, and reviews in the same language as the submission text (codeOrText) or topicName (e.g. if the submission or topic is in Hindi, Spanish, or Gujarati, write the feedback in that language).";
      const raw = await callGeminiAPI(GEMINI_SECONDARY_KEY, `Evaluate submission: "${codeOrText}" for topic: "${topicName}"`, sysPrompt, schema);
      const parsed = JSON.parse(raw.trim());

      const record = new AssignmentSubmission({
        userId: req.user.userId, courseId, moduleId, topicName,
        assignmentType: assignmentType || 'CODING', selectedLanguage: selectedLanguage || 'Plain Text',
        submittedCodeOrText: codeOrText, aiEvaluationLog: parsed, status: "Evaluated"
      });
      await record.save();

      await logActivity({
        userId: req.user.userId,
        courseId,
        moduleId,
        topic: topicName,
        activityType: 'Assignment Submitted',
        status: 'Success',
        metadata: { assignmentType, selectedLanguage }
      });

      await logActivity({
        userId: req.user.userId,
        courseId,
        moduleId,
        topic: topicName,
        activityType: 'Assignment Reviewed',
        status: 'Evaluated',
        metadata: { approachScore: parsed.approachScore || 0 }
      });

      res.status(200).json({ success: true, submissionData: record });
    } catch (err) {
      console.error('AI evaluation error:', err.message);
      res.status(500).json({ success: false, message: "AI evaluation failed. Please try again." });
    }
  }
};

// 6. Quiz System
const quizCtrl = {
  checkQuizLockState: async (req, res) => {
    const { courseId, moduleId, topicName } = req.body;
    try {
      const quiz = await QuizData.findOne({ courseId, moduleId, topicName });
      if (!quiz) return res.status(200).json({ success: true, isLocked: false, resultData: null });

      const result = await QuizResults.findOne({ userId: req.user.userId, quizDataId: quiz._id }).sort({ evaluatedAt: -1 });
      if (result) {
        return res.status(200).json({ success: true, isLocked: true, resultData: { total: result.totalQuestions, correct: result.correctAnswers, percentage: result.scorePercentage } });
      }
      res.status(200).json({ success: true, isLocked: false, resultData: null });
    } catch (err) {
      console.error('Quiz lock check error:', err.message);
      res.status(500).json({ success: false, message: "Failed to check quiz status." });
    }
  },

  generateAndSaveQuiz: async (req, res) => {
    const { courseId, moduleId, topicName, quizName } = req.body;
    try {
      let existingQuiz = await QuizData.findOne({ courseId, moduleId, topicName });
      if (existingQuiz) {
        let existingResults = await QuizResults.findOne({ userId: req.user.userId, quizDataId: existingQuiz._id }).sort({ evaluatedAt: -1 });
        return res.status(200).json({ success: true, quizData: existingQuiz, existingResults });
      }

      const schema = {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: { id: { type: "integer" }, questionText: { type: "string" }, options: { type: "array", items: { type: "string" } }, correctOptionIndex: { type: "integer" } },
              required: ["id", "questionText", "options", "correctOptionIndex"]
            }
          }
        },
        required: ["questions"]
      };

      const raw = await callGeminiAPI(GEMINI_SECONDARY_KEY, `Create 10 hard MCQs about: ${topicName}`, "You are an automated quiz generator. CRITICAL: Generate all quiz questions, options, and texts in the same language as the topicName (e.g., if the topicName is in Hindi/Gujarati/Spanish, the MCQs must be generated in that language).", schema);
      const parsed = JSON.parse(raw.trim());

      const newQuiz = new QuizData({ courseId, moduleId, topicName, quizName: quizName || "Practice Assessment", questions: parsed.questions });
      await newQuiz.save();

      await logActivity({
        userId: req.user.userId,
        courseId: newQuiz.courseId,
        moduleId: newQuiz.moduleId,
        topic: newQuiz.topicName,
        activityType: 'Quiz Started',
        status: 'Started',
        metadata: { quizName: newQuiz.quizName }
      });

      res.status(200).json({ success: true, quizData: newQuiz, existingResults: null });
    } catch (err) {
      console.error('Quiz generation error:', err.message);
      res.status(500).json({ success: false, message: "Failed to generate quiz." });
    }
  },

  recordQuizResults: async (req, res) => {
    const { quizDataId, totalQuestions, correctAnswers, scorePercentage, userSelections } = req.body;
    try {
      const node = new QuizResults({ userId: req.user.userId, quizDataId, totalQuestions, correctAnswers, scorePercentage, userSelections });
      await node.save();

      const quiz = await QuizData.findById(quizDataId);
      if (quiz) {
        await logActivity({
          userId: req.user.userId,
          courseId: quiz.courseId,
          moduleId: quiz.moduleId,
          topic: quiz.topicName,
          activityType: 'Quiz Completed',
          status: 'Completed',
          metadata: { 
            quizName: quiz.quizName, 
            scorePercentage, 
            correctAnswers, 
            totalQuestions 
          }
        });
      }

      res.status(201).json({ success: true, message: "Quiz results saved successfully." });
    } catch (err) {
      console.error('Quiz results error:', err.message);
      res.status(500).json({ success: false, message: "Failed to save quiz results." });
    }
  }
};

// 7. AI Doubt Solver
const doubtCtrl = {
  askDoubt: async (req, res) => {
    const { courseId, moduleId, moduleName, topicName, doubtText, chatHistory } = req.body;
    if (!doubtText) {
      return res.status(400).json({ success: false, message: "Question text is required." });
    }
    if (doubtText.length > 5000) {
      return res.status(400).json({ success: false, message: "Question is too long (max 5000 characters)." });
    }

    try {
      const schema = {
        type: "object",
        properties: {
          answer: { type: "string" },
          shouldSaveNote: { type: "boolean" },
          noteTitle: { type: "string" },
          noteContent: { type: "string" }
        },
        required: ["answer", "shouldSaveNote"]
      };

      const formattedHistory = (chatHistory || [])
        .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n");

      const sysPrompt = `You are LuminaLearn's Academic Doubt Solver. Explain technical or non-technical doubts in clear, well-structured, clean HTML (styled matching dark mode text wrapper, no markdown blocks).
      Keep your answer engaging, highly accurate, and precise.
      
      CRITICAL: Always answer the doubt in the same language as the user's query/doubtText (e.g. if user asks in Hindi/Hinglish/Gujarati/Spanish, respond in Hindi/Hinglish/Gujarati/Spanish using the appropriate script).
      
      CRITICAL INSTRUCTIONS FOR NOTES SAVING:
      If the user explicitly asks you to "save this to notes", "add to notes", "notes me save karo", or similar expressions:
      1. Set 'shouldSaveNote' to true.
      2. Construct a brief descriptive 'noteTitle' (e.g. "Doubt: [Topic Name]" in the query language).
      3. Construct the clean HTML note content under 'noteContent' (summarizing the explanation in the query language).
      Otherwise, set 'shouldSaveNote' to false and omit/empty noteTitle and noteContent.`;

      const promptText = `
Topic Context: "${topicName}"
Conversation Logs:
${formattedHistory}
User's New Question: "${doubtText}"
`;

      const raw = await callGeminiAPI(GEMINI_SECONDARY_KEY, promptText, sysPrompt, schema);
      const parsed = JSON.parse(raw.trim());

      let autoSavedNote = null;
      if (parsed.shouldSaveNote && parsed.noteContent) {
        try {
          const noteObj = new Note({
            userId: req.user.userId,
            courseId,
            moduleId: moduleId || 1,
            moduleName: moduleName || topicName || "General doubts",
            title: parsed.noteTitle || `Doubt: ${topicName || "Topic Overview"}`,
            contentHtml: parsed.noteContent
          });
          autoSavedNote = await noteObj.save();
        } catch (dbErr) {
          console.error("Doubt auto-save note error:", dbErr.message);
        }
      }

      res.status(200).json({
        success: true,
        answer: parsed.answer,
        autoSaved: !!autoSavedNote,
        note: autoSavedNote
      });

    } catch (err) {
      console.error("Doubt solver error:", err.message);
      res.status(500).json({ success: false, message: "Failed to process your question." });
    }
  }
};

module.exports = { authCtrl, dashboardCtrl, pedagogyCtrl, workspaceCtrl, evaluationCtrl, quizCtrl, doubtCtrl };