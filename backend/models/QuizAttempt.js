const mongoose = require('mongoose');

// User details and score response telemetry tracking
const QuizAttemptSchema = new mongoose.Schema({
  attemptId: {
    type: String,
    required: true,
    unique: true
  },
  quizId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedQuestions: [{
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, required: true }
  }],
  userAnswers: {
    type: Map,
    of: String
  },
  score: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);