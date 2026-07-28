const mongoose = require('mongoose');
const { ActivityLog, Course, Note, QuizResults, AssignmentSubmission } = require('../models/schemas');
const { ScheduledInterview } = require('../models/interviewSchemas');

/**
 * Log a user activity entry dynamically
 */
const logActivity = async ({ userId, courseId, moduleId, topic, activityType, status, metadata = {} }) => {
  try {
    const log = new ActivityLog({
      userId,
      courseId,
      moduleId,
      topic,
      activityType,
      status,
      metadata
    });
    await log.save();
    return log;
  } catch (err) {
    console.error("Failed to log activity event:", err.message);
  }
};

/**
 * Scan database and backfill activity logs for a user if they have 0 logs
 */
const backfillUserActivities = async (userId) => {
  try {
    const existingCount = await ActivityLog.countDocuments({ userId });
    if (existingCount > 0) return; // Already has logs, skip backfill

    const logs = [];

    // 1. Courses Generated & Started
    const courses = await Course.find({ userId });
    for (const c of courses) {
      logs.push({
        userId,
        courseId: c._id,
        activityType: 'Course Generated',
        status: 'Success',
        timestamp: c.createdAt || new Date(),
        metadata: { courseTitle: c.title, level: c.level }
      });

      if (c.completedTopics && c.completedTopics.length > 0) {
        logs.push({
          userId,
          courseId: c._id,
          activityType: 'Course Started',
          status: 'In Progress',
          timestamp: c.createdAt || new Date(),
          metadata: { courseTitle: c.title }
        });

        // Group completed topic keys by module dayId
        const modTopicsMap = {};
        c.completedTopics.forEach(tKey => {
          const match = tKey.match(/mod-(\d+)-topic-(\d+)/);
          if (match) {
            const mId = Number(match[1]);
            if (!modTopicsMap[mId]) modTopicsMap[mId] = 0;
            modTopicsMap[mId]++;
          }
        });

        // Log completions
        Object.keys(modTopicsMap).forEach(mIdStr => {
          const mId = Number(mIdStr);
          const mod = c.modules.find(m => m.dayId === mId);
          if (mod && mod.topics && modTopicsMap[mId] === mod.topics.length) {
            logs.push({
              userId,
              courseId: c._id,
              moduleId: mId,
              activityType: 'Module Completed',
              status: 'Completed',
              timestamp: c.createdAt || new Date(),
              metadata: { moduleTitle: mod.title }
            });
          } else if (mod) {
            logs.push({
              userId,
              courseId: c._id,
              moduleId: mId,
              activityType: 'Module Started',
              status: 'Started',
              timestamp: c.createdAt || new Date(),
              metadata: { moduleTitle: mod.title }
            });
          }
        });

        // Check if course 100% completed
        let totalSyllabusTopics = 0;
        c.modules.forEach(m => {
          totalSyllabusTopics += m.topics ? m.topics.length : 0;
        });
        if (totalSyllabusTopics > 0 && c.completedTopics.length === totalSyllabusTopics) {
          logs.push({
            userId,
            courseId: c._id,
            activityType: 'Certificate Generated',
            status: 'Success',
            timestamp: new Date(),
            metadata: { courseTitle: c.title }
          });
        }
      }
    }

    // 2. Custom Notes Saved & Edited
    const notes = await Note.find({ userId });
    notes.forEach(n => {
      logs.push({
        userId,
        courseId: n.courseId,
        moduleId: n.moduleId,
        topic: n.title,
        activityType: 'Notes Saved',
        status: 'Success',
        timestamp: n.createdAt || new Date(),
        metadata: { noteTitle: n.title, moduleName: n.moduleName }
      });
    });

    // 3. Quiz Results Completed
    const quizResults = await QuizResults.find({ userId }).populate({
      path: 'quizDataId',
      select: 'quizName topicName moduleId courseId'
    });
    quizResults.forEach(q => {
      logs.push({
        userId,
        courseId: q.quizDataId?.courseId,
        moduleId: q.quizDataId?.moduleId,
        topic: q.quizDataId?.topicName,
        activityType: 'Quiz Completed',
        status: 'Completed',
        timestamp: q.evaluatedAt || new Date(),
        metadata: { 
          quizName: q.quizDataId?.quizName || 'Practice Assessment', 
          scorePercentage: q.scorePercentage, 
          correctAnswers: q.correctAnswers 
        }
      });
    });

    // 4. Assignments Submissions & AI Evaluations
    const assignments = await AssignmentSubmission.find({ userId });
    assignments.forEach(a => {
      logs.push({
        userId,
        courseId: a.courseId,
        moduleId: a.moduleId,
        topic: a.topicName,
        activityType: 'Assignment Submitted',
        status: 'Success',
        timestamp: a.submittedAt || new Date(),
        metadata: { assignmentType: a.assignmentType, selectedLanguage: a.selectedLanguage }
      });

      if (a.status === 'Evaluated') {
        logs.push({
          userId,
          courseId: a.courseId,
          moduleId: a.moduleId,
          topic: a.topicName,
          activityType: 'Assignment Reviewed',
          status: 'Evaluated',
          timestamp: a.submittedAt || new Date(),
          metadata: { approachScore: a.aiEvaluationLog?.approachScore || 0 }
        });
      }
    });

    // 5. Mock Interview Scheduled & Completed
    const interviews = await ScheduledInterview.find({ userId });
    interviews.forEach(i => {
      logs.push({
        userId,
        courseId: i.courseId,
        moduleId: i.dayId,
        activityType: i.status === 'Completed' ? 'Interview Completed' : 'Interview Scheduled',
        status: i.status,
        timestamp: i.createdAt || new Date(),
        metadata: { difficulty: i.difficulty, language: i.language, selectedTopics: i.selectedTopics }
      });
    });

    if (logs.length > 0) {
      await ActivityLog.insertMany(logs);
      console.log(`Successfully backfilled ${logs.length} activity records for user: ${userId}`);
    }
  } catch (err) {
    console.error("Backfill migration failed:", err.message);
  }
};

module.exports = {
  logActivity,
  backfillUserActivities
};
