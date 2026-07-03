const mongoose = require('mongoose');

// Configuration for active scheduled test nodes
const ScheduledQuizSchema = new mongoose.Schema({
  quizId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  syllabusTopics: [{
    type: String
  }],
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  totalQuestions: {
    type: Number,
    default: 5
  },
  timeLimit: {
    type: Number, // duration inside minutes
    default: 10
  },
  quizType: {
    type: String,
    default: 'MCQ'
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ScheduledQuiz', ScheduledQuizSchema);