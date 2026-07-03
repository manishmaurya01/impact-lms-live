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

function App() {
  return (
    <Router>
      <Routes>
        {/* Base / Onboarding Landing Configurations */}
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Core Control Center Hubs */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assignments" element={<AICourseIntake />} />
        <Route path="/courses" element={<AICourseIntake />} />
        <Route path="/notes" element={<NotesPage />} />
        
        {/* AI Voice-Driven Proctored Interview Matrix Engine Routes */}
        <Route path="/interview" element={<InterviewDashboard />} />
        <Route path="/interview/live/:interviewId/:sessionId" element={<AIProctoredInterview />} />
      </Routes>
    </Router>
  );
}

export default App;