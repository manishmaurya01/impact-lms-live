import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AICourseIntake.css';

import CourseForm from './modules/CourseForm';
import CourseList from './modules/CourseList';
import CourseTimeline from './modules/CourseTimeline';
import AICourseLearningWorkspace from './AICourseLearningWorkspace/AICourseLearningWorkspace';

export default function AICourseIntake() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errorLogs, setErrorLogs] = useState(null);
  const [savedCoursesList, setSavedCoursesList] = useState([]);
  const [activeViewportCourse, setActiveViewportCourse] = useState(null);
  const [isWorkspaceActive, setIsWorkspaceActive] = useState(false);

  const getApiUrl = (endpoint) => `http://${window.location.hostname}:5000${endpoint}`;

  useEffect(() => {
    fetchSavedCoursesFromDatabase();
  }, [pathname]);

  const fetchSavedCoursesFromDatabase = async () => {
    try {
      const activeSessionToken = localStorage.getItem('token');
      if (!activeSessionToken) return;

      const response = await fetch(getApiUrl('/api/courses'), {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${activeSessionToken}` }
      });
      const dataPayload = await response.json();
      if (response.ok && dataPayload.success) {
        setSavedCoursesList(dataPayload.data);
      }
    } catch (err) {
      console.error("Historical cluster syncing error:", err);
    }
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenerationProgress(0);
    setErrorLogs(null);

    let progressVal = 0;
    const progressInterval = setInterval(() => {
      if (progressVal < 30) {
        progressVal += Math.floor(Math.random() * 6) + 3;
      } else if (progressVal < 60) {
        progressVal += Math.floor(Math.random() * 4) + 1;
      } else if (progressVal < 85) {
        progressVal += Math.floor(Math.random() * 2) + 1;
      } else if (progressVal < 98) {
        progressVal += 1;
      }
      setGenerationProgress(Math.min(progressVal, 98));
    }, 200);

    try {
      const activeSessionToken = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/courses/generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeSessionToken}`
        },
        body: JSON.stringify({ prompt: inputPrompt, level: selectedLevel })
      });

      const serverPayload = await response.json();
      if (!response.ok || !serverPayload.success) throw new Error(serverPayload.error);

      clearInterval(progressInterval);
      setGenerationProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));

      setActiveViewportCourse(serverPayload.data);
      fetchSavedCoursesFromDatabase();
    } catch (err) {
      clearInterval(progressInterval);
      setGenerationProgress(0);
      setErrorLogs(err.message || "Pipeline integration fault trace.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCourseDeletionNode = async (courseId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete roadmap node from cluster?")) return;
    try {
      const activeSessionToken = localStorage.getItem('token');
      await fetch(getApiUrl(`/api/courses/${courseId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${activeSessionToken}` }
      });
      if (activeViewportCourse?._id === courseId) setActiveViewportCourse(null);
      fetchSavedCoursesFromDatabase();
    } catch (err) {
      alert("Database mutation execution failed.");
    }
  };

  // Workspace active overrides layout context
  if (isWorkspaceActive && activeViewportCourse) {
    return (
      <AICourseLearningWorkspace 
        courseData={activeViewportCourse} 
        onBack={() => { setIsWorkspaceActive(false); navigate('/courses'); }} 
      />
    );
  }

  return (
    <div className="centralized-prompt-matrix-viewport">
      <div className="cyber-ambient-grid-underlay"></div>

      {isGenerating && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(2, 4, 10, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ width: '400px', background: '#070a12', border: '1px solid rgba(139, 92, 246, 0.25)', padding: '2.5rem 2rem', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', textAlign: 'center' }}>
            <div style={{ margin: '0 auto 1.5rem auto', width: '44px', height: '44px', border: '3px solid rgba(139, 92, 246, 0.1)', borderTop: '3px solid #8b5cf6', borderRadius: '50%', animation: 'workspaceCoreSpin 0.85s linear infinite' }} />
            <h3 style={{ margin: '0 0 0.6rem 0', color: '#fff', fontSize: '1.2rem', fontWeight: '600' }}>Architecting Learning Roadmap ({generationProgress}%)</h3>
            
            <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden', margin: '1rem 0 1.5rem 0' }}>
              <div style={{ width: `${generationProgress}%`, height: '100%', background: '#8b5cf6', transition: 'width 0.2s ease-out', boxShadow: '0 0 10px #8b5cf6' }} />
            </div>

            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0', lineHeight: '1.4' }}>Sifting through pedagogical indexes and compiling custom AI syllabus roadmaps...</p>
          </div>
          <style>{`@keyframes workspaceCoreSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* 🚀 REAL ROUTER MAPPED PLATFORM LINK ENGINE NAVBAR WITH DYNAMIC BACK TRACE LINK */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '76rem', margin: '0 auto 2rem auto', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>
        
        {/* Unified Back Action Controller Button */}
        <button 
          onClick={() => navigate('/dashboard')} 
          className="pill-selector-item"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', borderColor: '#1e293b', background: 'rgba(255,255,255,0.01)' }}
        >
          &larr; Back to Terminal Dashboard
        </button>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => { navigate('/assignments'); setActiveViewportCourse(null); }} 
            className={`pill-selector-item ${pathname === '/assignments' && !activeViewportCourse ? 'is-active' : ''}`}
          >
            ✨ Generate Course Path
          </button>
          <button 
            onClick={() => { navigate('/courses'); setActiveViewportCourse(null); }} 
            className={`pill-selector-item ${pathname === '/courses' && !activeViewportCourse ? 'is-active' : ''}`}
          >
            📂 Manage Courses ({savedCoursesList.length})
          </button>
        </div>
      </div>

      {/* CONDITION VIEWPORT MATRIX DISPATCHER */}
      {activeViewportCourse ? (
        <CourseTimeline 
          activeViewportCourse={activeViewportCourse}
          onLaunchWorkspace={() => setIsWorkspaceActive(true)}
          onBack={() => setActiveViewportCourse(null)}
        />
      ) : pathname === '/courses' ? (
        <CourseList 
          savedCoursesList={savedCoursesList}
          onSelectCourse={(course) => setActiveViewportCourse(course)}
          onDeleteCourse={handleCourseDeletionNode}
        />
      ) : (
        <CourseForm 
          inputPrompt={inputPrompt}
          setInputPrompt={setInputPrompt}
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
          isGenerating={isGenerating}
          errorLogs={errorLogs}
          onSubmit={handleGenerateSubmit}
        />
      )}
    </div>
  );
}