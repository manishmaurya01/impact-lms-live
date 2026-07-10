const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User, Course, Material, QuizData, QuizResults, AssignmentSubmission, Note } = require('../models/schemas');
const { callGeminiAPI } = require('../utils/geminiClient');

const JWT_SECRET = process.env.JWT_SECRET;
const GEMINI_PRIMARY_KEY = process.env.GEMINI_API_KEY;
const GEMINI_SECONDARY_KEY = process.env.GEMINI_SECONDARY_KEY;

// 1. Core Auth Control Pipeline
const authCtrl = {
  register: async (req, res) => {
    try {
      const { fullName, email, password, role, domain, commitment, experience, learningStyle } = req.body;
      if (!fullName || !email || !password) return res.status(400).json({ success: false, message: 'Fields required.' });

      const userExists = await User.findOne({ email });
      if (userExists) return res.status(400).json({ success: false, message: 'Profile already registered.' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({ fullName, email, password: hashedPassword, role, domain, commitment, experience, learningStyle });
      await newUser.save();
      res.status(201).json({ success: true, message: 'Account deployed successfully.' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal signup fault.' });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials.' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials.' });

      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      res.status(200).json({ success: true, token, user: { id: user._id, fullName: user.fullName, email: user.email } });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Authentication engine process fault.' });
    }
  }
};

// 2. Metrics Analytics Engine Control
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
      res.status(500).json({ success: false, message: "Telemetry matrix generation failed." });
    }
  }
};

// 3. AI Dynamic Content Engine Control
const pedagogyCtrl = {
  generateCourse: async (req, res) => {
    const { prompt, level } = req.body;
    if (!prompt) return res.status(400).json({ success: false, error: 'Prompt is required.' });

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

    const sysPrompt = "You are LuminaLearn's core engine. Output strict Day-wise nested mapping frameworks aligned perfectly with the targeted schema constraints. If the topic/prompt is for a non-technical course (e.g. leadership, art, public speaking, drawing, management, history, meditation, etc.) where hands-on coding or technical assignments are not applicable, omit the 'assignment' block inside 'schedules' entirely.";
    try {
      const raw = await callGeminiAPI(GEMINI_PRIMARY_KEY, `Build roadmap context: ${prompt}. Mode Depth: ${level || 'Beginner'}`, sysPrompt, schema);
      const parsed = JSON.parse(raw.trim());
      const course = new Course({ userId: req.user.userId, ...parsed });
      await course.save();
      res.status(201).json({ success: true, data: course });
    } catch (err) {
      res.status(500).json({ success: false, error: 'AI synthesis architecture pipe failed.' });
    }
  },
  fetchMaterial: async (req, res) => {
    const { courseId, moduleId, topicName } = req.body;
    try {
      let existing = await Material.findOne({ courseId, moduleId, topicName });
      if (existing) {
        if (!existing.videoReferences || existing.videoReferences.length === 0) {
          try {
            const { getVerifiedVideos } = require('../utils/videoSearch');
            const realVideos = await getVerifiedVideos(topicName);
            if (realVideos && realVideos.length > 0) {
              existing.videoReferences = realVideos;
              existing.videoLink = realVideos[0].embedUrl || realVideos[0].url;
              await existing.save();
            }
          } catch (searchErr) {
            console.error("Failed to dynamically fill missing videos for existing content:", searchErr);
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
      For video references, suggest high-qualityrelevant YouTube video links. Provide standard watch URLs (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ) and their corresponding embed URLs (e.g., https://www.youtube.com/embed/dQw4w9WgXcQ).
      For documentation references, include official technology documentation links or high-quality articles like GeeksforGeeks (e.g., https://www.geeksforgeeks.org/topic-name/) with descriptive titles.`;

      const raw = await callGeminiAPI(GEMINI_SECONDARY_KEY, `Generate deep study guide block elements and references for topic: "${topicName}".`, sysPrompt, schema);
      
      const parsed = JSON.parse(raw.trim());

      try {
        const { getVerifiedVideos } = require('../utils/videoSearch');
        const realVideos = await getVerifiedVideos(topicName);
        if (realVideos && realVideos.length > 0) {
          parsed.videoReferences = realVideos;
          parsed.videoLink = realVideos[0].embedUrl || realVideos[0].url;
        }
      } catch (searchErr) {
        console.error("Dynamic video lookup failed:", searchErr);
      }

      const material = new Material({ courseId, moduleId, topicName, ...parsed });
      await material.save();
      res.status(200).json({ success: true, data: material });
    } catch (err) {
      res.status(500).json({ success: false, message: "Real-time content sync engine fault." });
    }
  },
  getCourses: async (req, res) => {
    try {
      const listings = await Course.find({ userId: req.user.userId }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: listings });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Cloud database registries engine down.' });
    }
  },
  deleteCourse: async (req, res) => {
    try {
      await Course.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
      res.status(200).json({ success: true, message: 'Roadmap node cleared successfully.' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Query engine execution error.' });
    }
  }
};

// 4. Learning Studio Notes System Control
const workspaceCtrl = {
  saveNote: async (req, res) => {
    const { noteId, courseId, moduleId, moduleName, title, contentHtml } = req.body;
    if (!courseId || moduleId === undefined || !contentHtml) return res.status(400).json({ success: false, message: "Missing note metadata." });

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
      res.status(500).json({ success: false, message: "Workspace note management fault." });
    }
  },
  getNotesByCourse: async (req, res) => {
    try {
      const notes = await Note.find({ userId: req.user.userId, courseId: req.params.courseId }).sort({ updatedAt: -1 });
      res.status(200).json({ success: true, data: notes });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed fetching note nodes." });
    }
  },
  deleteNote: async (req, res) => {
    try {
      const note = await Note.findById(req.params.noteId);
      if (!note) return res.status(404).json({ success: false, message: "Note record missing." });
      if (note.userId.toString() !== req.user.userId) return res.status(403).json({ success: false, message: "Unauthorized lifecycle access." });

      await Note.findByIdAndDelete(req.params.noteId);
      res.status(200).json({ success: true, message: "Note packet dropped successfully." });
    } catch (err) {
      res.status(500).json({ success: false, message: "Workspace internal engine crash." });
    }
  }
};

// 5. Practical Laboratory Evaluations Control (Assignments Engine)
const evaluationCtrl = {
  checkAssignmentLock: async (req, res) => {
    const { courseId, moduleId, topicName } = req.body;
    try {
      const sub = await AssignmentSubmission.findOne({ userId: req.user.userId, courseId, moduleId, topicName });
      res.status(200).json({ success: true, isLocked: !!sub, data: sub });
    } catch (err) {
      res.status(500).json({ success: false, message: "Database failure." });
    }
  },
  submitAssignment: async (req, res) => {
    const { courseId, moduleId, topicName, assignmentType, submittedCodeOrText, submissionUrl } = req.body;
    if (!submittedCodeOrText) return res.status(400).json({ success: false, message: "Content payload empty." });

    try {
      const sub = new AssignmentSubmission({ userId: req.user.userId, courseId, moduleId, topicName, assignmentType: assignmentType || 'CONCEPTUAL', submittedCodeOrText, submissionUrl: submissionUrl || "" });
      await sub.save();
      res.status(201).json({ success: true, message: "Assignment committed under cloud repository." });
    } catch (err) {
      res.status(500).json({ success: false, message: "Schema constraint failure on storage mapping." });
    }
  },
  evaluateAssignmentViaAI: async (req, res) => {
    const { courseId, moduleId, topicName, assignmentType, selectedLanguage, codeOrText } = req.body;
    if (!codeOrText) return res.status(400).json({ success: false, message: "No source payload for evaluation." });

    try {
      const schema = {
        type: "object",
        properties: { approachScore: { type: "integer" }, complexityAnalysis: { type: "string" }, architecturalCritique: { type: "string" }, betterAlternativeTemplate: { type: "string" } },
        required: ["approachScore", "complexityAnalysis", "architecturalCritique", "betterAlternativeTemplate"]
      };

      const sysPrompt = "You are core compiler critic evaluation review engine. Compute structural score outputs 1-100 analytics graphs patterns.";
      const raw = await callGeminiAPI(GEMINI_SECONDARY_KEY, `Evaluate runtime submission context: "${codeOrText}" for topic: "${topicName}"`, sysPrompt, schema);
      const parsed = JSON.parse(raw.trim());

      const record = new AssignmentSubmission({
        userId: req.user.userId, courseId, moduleId, topicName,
        assignmentType: assignmentType || 'CODING', selectedLanguage: selectedLanguage || 'Plain Text',
        submittedCodeOrText: codeOrText, aiEvaluationLog: parsed, status: "Evaluated"
      });
      await record.save();
      res.status(200).json({ success: true, submissionData: record });
    } catch (err) {
      res.status(500).json({ success: false, message: "AI Critic evaluation architecture line down." });
    }
  }
};

// 6. Testing Framework Track Engine Control (Quiz Arena)
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
      res.status(500).json({ success: false, message: "Database fault mapping." });
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

      const raw = await callGeminiAPI(GEMINI_SECONDARY_KEY, `Create 10 hard MCQs about: ${topicName}`, "You are automated test writer engine module.", schema);
      const parsed = JSON.parse(raw.trim());

      const newQuiz = new QuizData({ courseId, moduleId, topicName, quizName: quizName || "Sprint Evaluation Track", questions: parsed.questions });
      await newQuiz.save();
      res.status(200).json({ success: true, quizData: newQuiz, existingResults: null });
    } catch (err) {
      res.status(500).json({ success: false, message: "Internal tokens calculation fault." });
    }
  },
  recordQuizResults: async (req, res) => {
    const { quizDataId, totalQuestions, correctAnswers, scorePercentage, userSelections } = req.body;
    try {
      const node = new QuizResults({ userId: req.user.userId, quizDataId, totalQuestions, correctAnswers, scorePercentage, userSelections });
      await node.save();
      res.status(201).json({ success: true, message: "Performance telemetry data metrics locked down." });
    } catch (err) {
      res.status(500).json({ success: false, message: "Database metrics pipeline faulted transaction." });
    }
  }
};

const doubtCtrl = {
  askDoubt: async (req, res) => {
    const { courseId, moduleId, moduleName, topicName, doubtText, chatHistory } = req.body;
    if (!doubtText) {
      return res.status(400).json({ success: false, message: "Doubt payload is required." });
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

      const sysPrompt = `You are LuminaLearn's elite Academic Doubt Solver. Explain technical or non-technical doubts in clear, well-structured, clean HTML (styled matching dark mode text wrapper, no markdown blocks).
      Keep your answer engaging, highly accurate, and precise.
      
      CRITICAL INSTRUCTIONS FOR NOTES SAVING:
      If the user explicitly asks you to "save this to notes", "add to notes", "notes me save karo", or similar expressions:
      1. Set 'shouldSaveNote' to true.
      2. Construct a brief descriptive 'noteTitle' (e.g. "Doubt: [Topic Name]").
      3. Construct the clean HTML note content under 'noteContent' (summarizing the explanation).
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
          console.error("Doubt auto-save note error:", dbErr);
        }
      }

      res.status(200).json({
        success: true,
        answer: parsed.answer,
        autoSaved: !!autoSavedNote,
        note: autoSavedNote
      });

    } catch (err) {
      console.error("Doubt solver backend crash:", err);
      res.status(500).json({ success: false, message: "AI Doubt Solver pipeline failed." });
    }
  }
};

module.exports = { authCtrl, dashboardCtrl, pedagogyCtrl, workspaceCtrl, evaluationCtrl, quizCtrl, doubtCtrl };