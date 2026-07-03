const mongoose = require('mongoose');

// Day-wise learning module mapping sub-schema with safe fallback defaults
const ModuleSchema = new mongoose.Schema({
  dayId: { type: Number, default: 1 },
  title: { type: String, default: "Untitled Topic Module" },
  status: { type: String, default: 'Not Started' },
  duration: { type: String, default: "2 Hours" },
  objective: { type: String, default: "Understand core concepts." },
  topics: [{ type: String }],
  curatedSearchQuery: { type: String, default: "" }, 
  shortNotes: { type: String, default: "" },         
  schedules: {
    quiz: {
      name: { type: String, default: "Practice Assessment" },
      quizTopic: { type: String, default: "Core Concepts Evaluation" },
      duration: { type: String, default: "10 min" }
    },
    assignment: {
      name: { type: String, default: "Symmetric Practice Assignment" },
      assignmentObjective: { type: String, default: "Implement concepts learned today." },
      complexity: { type: String, default: "Medium" }
    }
  }
});

// Base Course metadata layout
const CourseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  level: {
    type: String,
    required: true
  },
  modules: [ModuleSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Course', CourseSchema);