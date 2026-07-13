const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');
const { User, Course, Material, QuizData, QuizResults, AssignmentSubmission, Note } = require('../models/schemas');
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
  }
};

// 2. Dashboard Analytics
const dashboardCtrl = {
  getAnalytics: async (req, res) => {
    try {
      const uid = req.user.userId;
      const totalCourses = await Course.countDocuments({ userId: uid });
      const totalNotes = await Note.countDocuments({ userId: uid });
      const evaluatedAssignments = await AssignmentSubmission.countDocuments({ userId: uid, status: "Evaluated" });

      const quizAgg = await QuizResults.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(uid) } },
        { $group: { _id: null, avgScore: { $avg: "$scorePercentage" } } }
      ]);
      const averageQuizScore = quizAgg.length > 0 ? Math.round(quizAgg[0].avgScore) : 0;

      res.status(200).json({ success: true, analytics: { totalCourses, totalNotes, evaluatedAssignments, averageQuizScore } });
    } catch (err) {
      console.error('Analytics error:', err.message);
      res.status(500).json({ success: false, message: "Failed to load analytics." });
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
  }
};

// 4. Notes System
const workspaceCtrl = {
  saveNote: async (req, res) => {
    const { noteId, courseId, moduleId, moduleName, title, contentHtml } = req.body;
    if (!courseId || moduleId === undefined || !contentHtml) return res.status(400).json({ success: false, message: "Missing required note fields." });

    try {
      let note;
      if (noteId) {
        note = await Note.findOneAndUpdate({ _id: noteId, userId: req.user.userId }, { title, contentHtml, moduleName, updatedAt: Date.now() }, { new: true });
      } else {
        note = new Note({ userId: req.user.userId, courseId, moduleId, moduleName, title: title || "Untitled Note", contentHtml });
        await note.save();
      }
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