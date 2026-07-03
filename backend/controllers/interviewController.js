const mongoose = require('mongoose');
const { Course } = require('../models/schemas'); 
const { ScheduledInterview, InterviewSession, ProctoredLog } = require('../models/interviewSchemas');
const { callGeminiAPI } = require('../utils/geminiClient');

// SEPARATE DEDICATED INTERVIEW API KEY 
// Note: Agar aapne .env me GEMINI_INTERVIEW_KEY nahi banaya hai, toh ye secondary key par fallback karega automatically.
const INTERVIEW_API_KEY = process.env.GEMINI_INTERVIEW_KEY || process.env.GEMINI_SECONDARY_KEY;

const interviewCtrl = {

  // 1. Core Meta Aggregate Bridge
  getInterviewDashboardMeta: async (req, res) => {
    try {
      const uid = req.user.userId;
      const courses = await Course.find({ userId: uid });
      const totalScheduled = await ScheduledInterview.countDocuments({ userId: uid });
      const totalCompleted = await ScheduledInterview.countDocuments({ userId: uid, status: 'Completed' });
      const totalCheatingFlags = await ProctoredLog.countDocuments({ userId: uid, isFlaggedForCheating: true });

      return res.status(200).json({ 
        success: true, 
        courses: courses || [], 
        analytics: { totalScheduled, totalCompleted, totalCheatingFlags } 
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Telemetry fault: " + err.message });
    }
  },

  // 2. Schedule Execution Deployer
  scheduleInterview: async (req, res) => {
    try {
      const { courseId, dayId, selectedTopics, difficulty, language } = req.body;
      if (!courseId || dayId === undefined) {
        return res.status(400).json({ success: false, message: "Missing required references." });
      }

      const newInterview = new ScheduledInterview({
        userId: req.user.userId,
        courseId,
        dayId: Number(dayId),
        selectedTopics: selectedTopics || [],
        difficulty: difficulty || 'Beginner',
        language: language || 'English'
      });
      await newInterview.save();

      return res.status(201).json({ success: true, data: newInterview });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Scheduler crash: " + err.message });
    }
  },

  // 3. Initialize Interactive Communication Hub
  startInterviewSession: async (req, res) => {
    try {
      const { interviewId } = req.body;
      
      // Clear out older sessions for this specific interview to avoid data collision state
      await InterviewSession.deleteMany({ interviewId });

      const session = new InterviewSession({
        interviewId,
        userId: req.user.userId,
        currentQuestionIndex: 0,
        totalTargetQuestions: 6, // 6 target rounds mapping
        isCompleted: false,
        conversationContext: []
      });
      await session.save();

      await ProctoredLog.findOneAndUpdate(
        { interviewId },
        { userId: req.user.userId, tabSwitchesCount: 0, isFlaggedForCheating: false },
        { upsert: true, new: true }
      );

      return res.status(200).json({ success: true, sessionId: session._id });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Dialogue boot error: " + err.message });
    }
  },

  // 4. Processing Short Question Dialogue Turn Sequence
  processConversationStep: async (req, res) => {
    try {
      const { sessionId, userVerbalAnswer } = req.body;
      const session = await InterviewSession.findById(sessionId).populate('interviewId');
      if (!session) return res.status(404).json({ success: false, message: "Target token invalid." });

      const targetLanguage = session.interviewId.language || 'English';
      const topics = session.interviewId.selectedTopics.join(', ');
      
      // Force Random Dynamic Entropy Token
      const randomSalt = Math.random().toString(36).substring(7) + " - " + Date.now();

      // CASE A: Start Token Core Trigger
      if (userVerbalAnswer === "START_INITIALIZATION_TOKEN") {
        let questionTemplate = `Let's begin. What is the main purpose of ${topics.split(',')[0] || 'this concept'}?`;
        
        try {
          const schema = { type: "object", properties: { query: { type: "string" } }, required: ["query"] };
          const sysPrompt = `Act as an oral technical interviewer panel. Target topics: [${topics}]. Difficulty: ${session.interviewId.difficulty}.
          RULES:
          1. Random Seed: ${randomSalt}. Pick a random sub-topic from the array.
          2. Speak and ask strictly in "${targetLanguage}".
          3. Ask exactly ONE short conversational question under 15 words. No fluff text.`;
          
          const rawResponse = await callGeminiAPI(INTERVIEW_API_KEY, "Boot session workflow.", sysPrompt, schema);
          const parsed = JSON.parse(rawResponse.trim());
          if (parsed.query) questionTemplate = parsed.query;
        } catch (aiErr) { console.warn("Fallback hit for initial question."); }

        session.conversationContext.push({ role: 'interviewer', text: questionTemplate });
        await session.save();
        return res.status(200).json({ success: true, isCompleted: false, nextMessage: questionTemplate });
      }

      // CASE B: Silent Handling
      if (userVerbalAnswer === "USER_SILENT_REPROMPT_TOKEN") {
        let repromptMsg = "Please provide an answer, or say skip to move on.";
        try {
          const schema = { type: "object", properties: { query: { type: "string" } }, required: ["query"] };
          const sysPrompt = `The candidate was silent. Ask them politely to answer or skip. Language: "${targetLanguage}". Under 12 words.`;
          const rawResponse = await callGeminiAPI(INTERVIEW_API_KEY, "User remained silent.", sysPrompt, schema);
          const parsed = JSON.parse(rawResponse.trim());
          if (parsed.query) repromptMsg = parsed.query;
        } catch (e) {}
        return res.status(200).json({ success: true, isCompleted: false, nextMessage: repromptMsg });
      }

      // CASE C: Main Context Progression Loop
      let calculatedAccuracy = 0;
      const cleanAnswer = userVerbalAnswer.trim().toLowerCase();
      const isSkipIntent = cleanAnswer.includes("don't know") || cleanAnswer.includes("dont know") || cleanAnswer.includes("nahi pata") || cleanAnswer.includes("skip") || cleanAnswer.includes("pata nahi");

      if (!isSkipIntent) {
        try {
          const evaluationSchema = { type: "object", properties: { accuracyScore: { type: "number" } }, required: ["accuracyScore"] };
          const lastQuestion = session.conversationContext[session.conversationContext.length - 1]?.text || "";
          const evalPrompt = `Evaluate the candidate's technical response. Question: "${lastQuestion}". Candidate Response: "${userVerbalAnswer}". Award score 0 to 100 based on correctness.`;
          
          const evalRaw = await callGeminiAPI(INTERVIEW_API_KEY, "Evaluate answer.", evalPrompt, evaluationSchema);
          const evalParsed = JSON.parse(evalRaw.trim());
          if (evalParsed.accuracyScore !== undefined) calculatedAccuracy = evalParsed.accuracyScore;
        } catch (e) { calculatedAccuracy = 40; }
      }

      // Push Candidate Answer into Context Arrays
      session.conversationContext.push({ role: 'candidate', text: userVerbalAnswer, accuracyScore: calculatedAccuracy });
      
      // CRITICAL GUARANTEED GUARD: Count absolute total candidate replies inside the actual database log
      const totalUserRepliesCount = session.conversationContext.filter(item => item.role === 'candidate').length;

      // Check if limit has reached based on safe counter
      if (totalUserRepliesCount >= 5) { // 5 Full back-and-forth turns perfectly
        session.isCompleted = true;
        await session.save();
        await ScheduledInterview.findByIdAndUpdate(session.interviewId._id, { status: 'Completed' });
        return res.status(200).json({ success: true, isCompleted: true });
      }

      // --- GENERATE COMPLETELY NEW UNIQUE DYNAMIC CONTEXT QUESTION ---
      let dynamicQuery = "Can you outline the core lifecycle steps or standard methods used in this context?";
      try {
        const schema = { type: "object", properties: { query: { type: "string" } }, required: ["query"] };
        
        const sysPrompt = `You are a strict technical recruiter panel. 
        Current Chat Logs Context: ${JSON.stringify(session.conversationContext)}.
        
        STRICT RE-GENERATION MATRIX DIRECTIVES:
        1. **FORCE SEED ENTROPY**: ${randomSalt}. Move to a totally different perspective or question angle within topics [${topics}].
        2. **NEVER COPY** or rewrite any previous question. Do not hover on the same sub-topic block.
        3. **STRICT LENGTH**: Exactly ONE precise short question. Length MUST be under 15 words. No chat tokens or filler speech.
        4. Target Language Node: "${targetLanguage}".`;
        
        const rawResponse = await callGeminiAPI(INTERVIEW_API_KEY, `Next question index sequence tracking token: ${totalUserRepliesCount}`, sysPrompt, schema);
        const parsed = JSON.parse(rawResponse.trim());
        if (parsed.query) dynamicQuery = parsed.query;
      } catch (aiErr) { console.warn("Fallback hit for dynamic next question mapping."); }

      session.conversationContext.push({ role: 'interviewer', text: dynamicQuery });
      
      // Balance the internal tracker explicitly before persisting down 
      session.currentQuestionIndex = totalUserRepliesCount;
      await session.save();

      return res.status(200).json({ success: true, isCompleted: false, nextMessage: dynamicQuery });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Dialogue failure: " + err.message });
    }
  },

  // 5. Surveillance Synchronization Bridge
  syncProctorMetrics: async (req, res) => {
    try {
      const { interviewId, tabSwitchDetected } = req.body;
      const log = await ProctoredLog.findOne({ interviewId });
      if (log && tabSwitchDetected) {
        log.tabSwitchesCount += 1;
        if (log.tabSwitchesCount >= 3) log.isFlaggedForCheating = true;
        await log.save();
      }
      return res.status(200).json({ success: true, proctorStatus: log });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 6. Comprehensive History Logs Row Aggregations
  historyLogs: async (req, res) => {
    try {
      const uid = req.user.userId;
      const rawLogs = await ScheduledInterview.find({ userId: uid }).sort({ createdAt: -1 });
      
      const logsWithProctor = await Promise.all(rawLogs.map(async (interview) => {
        const proctorLog = await ProctoredLog.findOne({ interviewId: interview._id });
        return {
          _id: interview._id,
          courseId: interview.courseId.toString(),
          difficulty: interview.difficulty,
          status: interview.status,
          createdAt: interview.createdAt,
          proctorLog: proctorLog ? { tabSwitchesCount: proctorLog.tabSwitchesCount } : { tabSwitchesCount: 0 }
        };
      }));

      return res.status(200).json({ success: true, logs: logsWithProctor });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = interviewCtrl;