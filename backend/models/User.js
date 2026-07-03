const mongoose = require('mongoose');

// User details ko database me mapping karne ka schema
const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    // Agar Google se login hai to password validation skip hoga
    required: function() { return !this.googleId; }
  },
  googleId: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['Student', 'Mentor/Teacher', 'Admin'],
    default: 'Student'
  },
  domain: {
    type: String,
    default: 'Programming'
  },
  commitment: {
    type: String,
    default: '1 Hour'
  },
  experience: {
    type: String,
    default: 'Beginner'
  },
  learningStyle: {
    type: String,
    default: 'Videos'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);