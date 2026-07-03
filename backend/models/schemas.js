const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return !this.googleId; } },
  googleId: { type: String, default: null },
  role: { type: String, enum: ['Student', 'Mentor/Teacher', 'Admin'], default: 'Student' },
  domain: { type: String, default: 'Programming' },
  commitment: { type: String, default: '1 Hour' },
  experience: { type: String, default: 'Beginner' },
  learningStyle: { type: String, default: 'Videos' },
  createdAt: { type: Date, default: Date.now }
});

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

const CourseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  level: { type: String, required: true },
  modules: [ModuleSchema],
  createdAt: { type: Date, default: Date.now }
});

const MaterialSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  moduleId: { type: Number, required: true },
  topicName: { type: String, required: true },
  htmlContent: { type: String, required: true }, 
  videoLink: { type: String, default: "https://www.youtube.com" },
  createdAt: { type: Date, default: Date.now }
});

const QuizDataSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  moduleId: { type: Number, required: true },
  topicName: { type: String, required: true },
  quizName: { type: String, required: true },
  questions: [{
    id: { type: Number, required: true },
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true }
  }],
  createdAt: { type: Date, default: Date.now }
});

const QuizResultsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizDataId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizData', required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  scorePercentage: { type: Number, required: true },
  userSelections: { type: Map, of: Number }, 
  evaluatedAt: { type: Date, default: Date.now }
});

const AssignmentSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  moduleId: { type: Number, required: true },
  topicName: { type: String, required: true },
  assignmentType: { type: String, enum: ['CODING', 'CONCEPTUAL'], required: true },
  selectedLanguage: { type: String, default: "Plain Text" }, 
  submittedCodeOrText: { type: String, required: true }, 
  submissionUrl: { type: String, default: "" }, 
  aiEvaluationLog: {
    approachScore: { type: Number, default: 0 },
    complexityAnalysis: { type: String, default: "" },
    architecturalCritique: { type: String, default: "" },
    betterAlternativeTemplate: { type: String, default: "" }
  },
  status: { type: String, enum: ['Submitted', 'Evaluated'], default: "Submitted" },
  submittedAt: { type: Date, default: Date.now }
});

const NoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  moduleId: { type: Number, required: true }, 
  moduleName: { type: String, required: true },
  title: { type: String, required: true, default: "Untitled Note" },
  contentHtml: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Course: mongoose.model('Course', CourseSchema),
  Material: mongoose.model('Material', MaterialSchema),
  QuizData: mongoose.model('QuizData', QuizDataSchema),
  QuizResults: mongoose.model('QuizResults', QuizResultsSchema),
  AssignmentSubmission: mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema),
  Note: mongoose.model('Note', NoteSchema)
};