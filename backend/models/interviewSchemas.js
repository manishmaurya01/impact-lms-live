const mongoose = require('mongoose');

// 1. Scheduled Matrix Context Slot (Added Language Field)
const ScheduledInterviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  dayId: { type: Number, required: true },
  selectedTopics: [{ type: String }],
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  language: { type: String, default: 'English' }, // e.g., 'Hindi', 'English', 'Gujarati'
  status: { type: String, enum: ['Pending', 'Completed', 'Terminated'], default: 'Pending' }
}, { timestamps: true });

// 2. Realtime Conversation Feed Container (Added Accuracy tracking inside context)
const InterviewSessionSchema = new mongoose.Schema({
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScheduledInterview', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentQuestionIndex: { type: Number, default: 0 },
  totalTargetQuestions: { type: Number, default: 5 },
  isCompleted: { type: Boolean, default: false },
  conversationContext: [{
    role: { type: String, enum: ['interviewer', 'candidate'], required: true },
    text: { type: String, required: true },
    accuracyScore: { type: Number, default: null }, // Null for interviewer, 0-100 for candidate answers
    feedback: { type: String, default: "" },
    suggestions: { type: String, default: "" },
    keyPointsMissed: [{ type: String }],
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// 3. Proctor Surveillance Watchdog Flags Document
const ProctoredLogSchema = new mongoose.Schema({
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScheduledInterview', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tabSwitchesCount: { type: Number, default: 0 },
  isFlaggedForCheating: { type: Boolean, default: false },
  terminationReason: { type: String, default: "" }
}, { timestamps: true });

module.exports = {
  ScheduledInterview: mongoose.model('ScheduledInterview', ScheduledInterviewSchema),
  InterviewSession: mongoose.model('InterviewSession', InterviewSessionSchema),
  ProctoredLog: mongoose.model('ProctoredLog', ProctoredLogSchema)
};