import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AICourseIntake.css';

import CourseForm from './modules/CourseForm';
import CourseList from './modules/CourseList';
import CourseTimeline from './modules/CourseTimeline';
import AICourseLearningWorkspace from './AICourseLearningWorkspace/AICourseLearningWorkspace';

export default function AICourseIntake() {
  const navigate = useNavigate();
  const { pathname, state: routingState } = useLocation();

  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errorLogs, setErrorLogs] = useState(null);
  const [savedCoursesList, setSavedCoursesList] = useState([]);
  const [activeViewportCourse, setActiveViewportCourse] = useState(null);
  const [isWorkspaceActive, setIsWorkspaceActive] = useState(false);

  const getApiUrl = (endpoint) => `${window.API_URL}${endpoint}`;

  useEffect(() => {
    fetchSavedCoursesFromDatabase();
  }, [pathname]);

  useEffect(() => {
    if (routingState?.courseId && savedCoursesList.length > 0) {
      const matchedCourse = savedCoursesList.find(c => c._id === routingState.courseId);
      if (matchedCourse) {
        const courseData = { ...matchedCourse };
        if (routingState.targetModuleId !== undefined) {
          courseData.lastActiveModuleId = routingState.targetModuleId;
        }
        if (routingState.targetTopicIndex !== undefined) {
          courseData.lastActiveTopicIndex = routingState.targetTopicIndex;
        }
        setActiveViewportCourse(courseData);
        if (routingState.autoLaunch) {
          setIsWorkspaceActive(true);
        }
      }
    }
  }, [savedCoursesList, routingState]);

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

  const handleGenerateSubmit = async (e, assembledPrompt) => {
    if (e) e.preventDefault();
    const promptToSend = assembledPrompt || inputPrompt;
    if (!promptToSend.trim() || isGenerating) return;
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
        body: JSON.stringify({ prompt: promptToSend, level: selectedLevel })
      });

      const serverPayload = await response.json();
      if (!response.ok || !serverPayload.success) throw new Error(serverPayload.error || "Generation error");

      clearInterval(progressInterval);
      setGenerationProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));

      setActiveViewportCourse(serverPayload.data);
      fetchSavedCoursesFromDatabase();
    } catch (err) {
      clearInterval(progressInterval);
      setGenerationProgress(0);
      setErrorLogs(err.message || "Failed to generate course. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCourseDeletionNode = async (courseId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      const activeSessionToken = localStorage.getItem('token');
      await fetch(getApiUrl(`/api/courses/${courseId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${activeSessionToken}` }
      });
      if (activeViewportCourse?._id === courseId) setActiveViewportCourse(null);
      fetchSavedCoursesFromDatabase();
    } catch (err) {
      alert("Failed to delete course.");
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
        <div className="generating-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '1rem', boxSizing: 'border-box' }}>
          <div className="generating-card" style={{ width: '100%', maxWidth: '450px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '2.5rem 2rem', borderRadius: '1rem', boxShadow: 'var(--shadow-lg)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid rgba(139, 92, 246, 0.1)', borderTop: '2px solid #8b5cf6', borderRadius: '50%', animation: 'workspaceCoreSpin 0.85s linear infinite' }} />
              <h3 style={{ margin: '0', color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: '800' }}>Building AI Course Path ({generationProgress}%)</h3>
            </div>
            
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden', margin: '1rem 0 1.5rem 0' }}>
              <div style={{ width: `${generationProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', transition: 'width 0.2s ease-out' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', textAlign: 'left', margin: '1.5rem 0', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px' }}>
              {[
                { label: "Analyzing Learning Goal...", min: 0 },
                { label: "Understanding Skill Level...", min: 15 },
                { label: "Planning Roadmap...", min: 30 },
                { label: "Creating Modules...", min: 45 },
                { label: "Generating Assignments...", min: 60 },
                { label: "Preparing Quizzes...", min: 75 },
                { label: "Designing AI Interviews...", min: 90 },
                { label: "Finalizing Personalized Course...", min: 98 }
              ].map((s, idx, arr) => {
                const nextMin = idx < arr.length - 1 ? arr[idx+1].min : 99;
                const isCompleted = generationProgress >= nextMin;
                const isActive = generationProgress >= s.min && !isCompleted;
                
                return (
                  <div key={idx} className={`progress-step-item-row ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: isCompleted ? 'var(--accent-secondary)' : (isActive ? 'var(--accent-primary)' : 'var(--text-muted)'), fontWeight: isActive ? '700' : '400' }}>
                    <div className="progress-step-icon-wrapper" style={{ width: '18px', display: 'flex', justifyContent: 'center' }}>
                      {isCompleted ? "✓" : isActive ? "⚡" : "○"}
                    </div>
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0', textAlign: 'center', lineHeight: '1.4' }}>Gemini AI is parsing course context and generating your nested syllabus modules...</p>
          </div>
          <style>{`@keyframes workspaceCoreSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* 🚀 REAL ROUTER MAPPED PLATFORM LINK ENGINE NAVBAR WITH DYNAMIC BACK TRACE LINK */}
      <div className="intake-nav-header" style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '76rem', margin: '0 auto 2rem auto', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        
        <button 
          onClick={() => navigate('/dashboard')} 
          className="pill-selector-item back-dash-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          &larr; Back to Dashboard
        </button>
 
        <div className="intake-nav-tabs" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => { navigate('/generate-course'); setActiveViewportCourse(null); }} 
            className={`pill-selector-item ${pathname === '/generate-course' && !activeViewportCourse ? 'is-active' : ''}`}
          >
            ✨ Generate New Course
          </button>
          <button 
            onClick={() => { navigate('/courses'); setActiveViewportCourse(null); }} 
            className={`pill-selector-item ${pathname === '/courses' && !activeViewportCourse ? 'is-active' : ''}`}
          >
            📂 My Courses ({savedCoursesList.length})
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
          savedCoursesList={savedCoursesList}
          onSelectCourse={(course) => setActiveViewportCourse(course)}
        />
      )}
    </div>
  );
}