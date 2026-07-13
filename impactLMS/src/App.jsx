import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing/Landing.jsx';
import Login from './components/Authentication/Login/Login.jsx';
import Register from './components/Authentication/Register/Register.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import AICourseIntake from './components/AICourseIntake/AICourseIntake.jsx';
import NotesPage from './components/Notes/NotesPage.jsx';
import InterviewDashboard from './components/Interview/InterviewDashboard.jsx';
import AIProctoredInterview from './components/Interview/AIProctoredInterview.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes — require authentication */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/assignments" element={<ProtectedRoute><AICourseIntake /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><AICourseIntake /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><InterviewDashboard /></ProtectedRoute>} />
        <Route path="/interview/live/:interviewId/:sessionId" element={<ProtectedRoute><AIProctoredInterview /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;