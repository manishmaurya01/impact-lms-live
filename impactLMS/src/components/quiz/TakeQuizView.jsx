import React, { useState, useEffect } from 'react';
import { 
  Award, Clock, BookOpen, ChevronLeft, AlertTriangle, 
  Shield, HelpCircle, ArrowRight, Terminal, Cpu, Monitor, 
  CheckCircle, User, ArrowLeft, RefreshCw, Radio
} from 'lucide-react';

export default function TakeQuizView({ quiz, topicName, courseId, moduleId, onBackToWorkspace, onQuizSubmitFinished }) {
  // Navigation Tracking Phases: 'DETAILS' | 'STREAM_ENFORCE' | 'GENERATING' | 'ACTIVE_QUIZ'
  const [assessmentPhase, setAssessmentPhase] = useState('DETAILS');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizDataRecordId, setQuizDataRecordId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamError, setStreamError] = useState("");
  const [mediaStreamInstance, setMediaStreamInstance] = useState(null);

  // User Profile Telemetry Data
  const [userProfile, setUserProfile] = useState({
    name: "Manish Maurya",
    track: "Computer Applications / Software Engineering",
    nodeStatus: "VERIFIED_PROCTOR_ACCESS"
  });

  // 🚀 PHASE 1: SCREEN SHARE & REGISTER MEDIA STREAM REFERENCE
  const initiateSecureProctorStream = async () => {
    setStreamError("");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      setMediaStreamInstance(stream);
      const videoTrack = stream.getVideoTracks()[0];

      videoTrack.onended = () => {
        alert("🚨 CRITICAL TELEMETRY FAULT: Screen share connection terminated. Security rules active.");
        window.location.reload();
      };

      // Force proceed to bulk question synthesis pipeline
      compileAndPersistQuizMatrix();
    } catch (err) {
      setStreamError("⚠️ Pipeline initialization faulted. Grant desktop screen streaming parameters to proceed.");
    }
  };

  // 🚀 PHASE 2: AI COMPILER - CORES PERSISTENCE INTO MONGODB
  const compileAndPersistQuizMatrix = async () => {
    setAssessmentPhase('GENERATING');
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/quiz/generate-and-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseId, moduleId, topicName, quizName: quiz?.name || "Sprint Evaluation Matrix" })
      });

      const json = await response.json();
      if (json.success && json.quizData) {
        setGeneratedQuestions(json.quizData.questions);
        setQuizDataRecordId(json.quizData._id);
        
        // Fetch any existing intermediate progress from cache if previously attempted
        if (json.existingResults && json.existingResults.userSelections) {
          setSelectedAnswers(json.existingResults.userSelections);
        }
        
        setAssessmentPhase('ACTIVE_QUIZ');
      } else {
        setStreamError("Model tokens stream broken inside cluster. Retrying connection...");
        setAssessmentPhase('STREAM_ENFORCE');
      }
    } catch (err) {
      setStreamError("Network route failure during generation sequence.");
      setAssessmentPhase('STREAM_ENFORCE');
    } finally {
      setIsProcessing(false);
    }
  };

  // 🚀 PHASE 3: REALTIME DELAYLESS SILENT SELECTION STORAGE
  const handleAnswerSelection = async (questionId, optionIndex) => {
    // 1. Instantly render on client UI for ultimate tactile feedback (UX standard)
    const updatedAnswers = { ...selectedAnswers, [questionId]: optionIndex };
    setSelectedAnswers(updatedAnswers);

    // 2. Silent dispatch background thread hook straight into Database collections
    try {
      const token = localStorage.getItem('token');
      let correctCount = 0;
      
      generatedQuestions.forEach((q) => {
        const targetSelection = q.id === questionId ? optionIndex : selectedAnswers[q.id];
        if (targetSelection === q.correctOptionIndex) {
          correctCount++;
        }
      });

      // Overwrite current tracking logs dynamically on every user click gesture
      await fetch('http://localhost:5000/api/quiz/record-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          quizDataId: quizDataRecordId,
          totalQuestions: generatedQuestions.length,
          correctAnswers: correctCount,
          scorePercentage: (correctCount / generatedQuestions.length) * 100,
          userSelections: updatedAnswers
        })
      });
      console.log(`📡 [REALTIME_SYNC]: Locked choice index [${optionIndex}] for question instance ID [${questionId}]`);
    } catch (err) {
      console.warn("Telemetry stream latency detected. Background sync buffered.", err);
    }
  };

  // 🚀 PHASE 4: FINAL SYSTEM TRANSITION & AUDIO/VIDEO MEDIA TRACK CLOSURE
  const terminateAssessmentSession = () => {
    setIsProcessing(true);
    
    // Explicitly disconnect and close webRTC screen-sharing processes
    if (mediaStreamInstance) {
      mediaStreamInstance.getTracks().forEach(track => {
        track.stop();
        console.log(`🔒 [MEDIA_STREAM_CLEANUP]: Disconnected hardware track source: ${track.kind}`);
      });
    }

    let correctCount = 0;
    generatedQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const finalPayload = {
      total: generatedQuestions.length,
      correct: correctCount,
      percentage: (correctCount / generatedQuestions.length) * 100
    };

    setIsProcessing(false);
    // Forward score object back to parent workstation canvas view tab panel
    onQuizSubmitFinished(finalPayload);
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#020617', 
      color: '#f8fafc', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden', 
      fontFamily: '"Inter", sans-serif',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 99999
    }}>
      
      {/* 🚀 STUDIO HIGH-FIDELITY TELEMETRY HEADER ELEMENT */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2.5rem', borderBottom: '1px solid #1e293b', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '8px', height: '8px', background: assessmentPhase === 'ACTIVE_QUIZ' ? '#ef4444' : '#06B6D4', borderRadius: '50%', animation: assessmentPhase === 'ACTIVE_QUIZ' ? 'pulse 1.5s infinite' : 'none' }} />
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {assessmentPhase === 'ACTIVE_QUIZ' ? "LIVE TESTING STREAM ACTIVE" : "SECURE SHELL GATEWAY"}
            </span>
          </div>
          <div style={{ height: '20px', width: '1px', background: '#1e293b' }} />
          <div style={{ fontSize: '0.88rem', color: '#cbd5e1', fontWeight: '500' }}>
            Topic Architecture Profile: <span style={{ color: '#06B6D4', fontWeight: '700' }}>{topicName}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '0.4rem 0.9rem', borderRadius: '8px' }}>
            <Clock size={14} color="#06B6D4" />
            <span style={{ fontSize: '0.85rem', color: '#06B6D4', fontWeight: '700', fontFamily: 'monospace' }}>
              {quiz?.duration || "20 Mins"} BOUNDED
            </span>
          </div>
        </div>
      </div>

      {/* WORKSPACE MIDDLE SCREEN CONTROLLER RENDER SECTIONS */}
      <div style={{ flex: 1, display: 'flex', background: '#020617', overflow: 'hidden' }}>
        
        {/* VIEW A: INITIAL WELCOME DETAILS BANNER */}
        {assessmentPhase === 'DETAILS' && (
          <div style={{ margin: 'auto', width: '100%', maxWidth: '600px', background: '#0f172a', border: '1px solid #1e293b', padding: '3rem', borderRadius: '16px', textAlign: 'left', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.025em', color: '#f8fafc' }}>
              {quiz?.name || "Modular Assessment"}
            </h1>
            <p style={{ margin: '0 0 2rem 0', color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Studio engine will spin up persistent storage structures inside the cloud directory instantly upon screening authorization checks.
            </p>
            <button onClick={() => setAssessmentPhase('STREAM_ENFORCE')} style={{ width: '100%', background: 'linear-gradient(135deg, #06B6D4, #0891b2)', border: 'none', color: '#020617', padding: '1rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              Initialize Environmental Telemetry <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* VIEW B: FULL STREAM ENFORCER OVERLAY BUTTONS */}
        {assessmentPhase === 'STREAM_ENFORCE' && (
          <div style={{ margin: 'auto', width: '100%', maxWidth: '540px', background: '#0f172a', border: '1px solid rgba(139, 92, 246, 0.25)', padding: '3rem', borderRadius: '16px', textAlign: 'center' }}>
            <Monitor size={36} color="#8B5CF6" style={{ marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 1rem 0' }}>Stream Connection Allocation</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
              Confirm your video channel desktop display frame permissions. This transaction creates fallback matrices hooks.
            </p>
            {streamError && <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'left' }}>{streamError}</div>}
            <button onClick={initiateSecureProctorStream} style={{ width: '100%', background: 'linear-gradient(135deg, #8B5CF6, #7c3aed)', border: 'none', color: '#fff', padding: '1rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer' }}>
              Authorize Environment Connection
            </button>
          </div>
        )}

        {/* VIEW C: LOADER SPINNER STREAM */}
        {assessmentPhase === 'GENERATING' && (
          <div style={{ margin: 'auto', textAlign: 'center' }}>
            <RefreshCw size={36} color="#06B6D4" style={{ animation: 'spin 2s linear infinite', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '600' }}>Structuring Database Questions Matrices...</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>Writing indices into quizdata system nodes collection schemas layer.</p>
          </div>
        )}

        {/* VIEW D: NEXT LEVEL 10 MCQS LIVE EVALUATION DESK LAYOUT */}
        {assessmentPhase === 'ACTIVE_QUIZ' && generatedQuestions.length > 0 && (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%' }}>
            
            {/* LEFT COLUMN PANEL: DYNAMIC USER METADATA METRICS GRAPH */}
            <div style={{ background: '#0f172a', borderRight: '1px solid #1e293b', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', justifyBwteen: 'space-between', justifyContent: 'space-between' }}>
              <div>
                {/* User Telemetry Card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#020617', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '2rem' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#06B6D4' }}>
                    <User size={20} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userProfile.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginTop: '0.15rem' }}>Candidate Reference</div>
                  </div>
                </div>

                {/* Scope details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#8B5CF6', fontWeight: '700', letterSpacing: '0.05em' }}>REGISTERED DEPARTMENT TRACK</div>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.2rem', lineHeight: '1.4' }}>{userProfile.track}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700', letterSpacing: '0.05em' }}>SECURITY AUTHENTICATION CAP</div>
                    <div style={{ fontSize: '0.82rem', color: '#10b981', fontFamily: 'monospace', marginTop: '0.2rem' }}>{userProfile.nodeStatus}</div>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #1e293b', marginBottom: '2rem' }} />

                {/* Matrix Step Segments Map */}
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>Questions Array Monitor</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.6rem' }}>
                  {generatedQuestions.map((q, idx) => {
                    const isCurrent = idx === currentQuestionIndex;
                    const isAnswered = selectedAnswers[q.id] !== undefined;
                    return (
                      <button 
                        key={q.id} 
                        onClick={() => setCurrentQuestionIndex(idx)} 
                        style={{ 
                          height: '38px', 
                          borderRadius: '8px', 
                          border: isCurrent ? '1px solid #06B6D4' : '1px solid #1e293b', 
                          background: isCurrent ? 'rgba(6, 182, 212, 0.08)' : isAnswered ? 'rgba(139, 92, 246, 0.1)' : '#020617', 
                          color: isCurrent ? '#06B6D4' : isAnswered ? '#8B5CF6' : '#94a3b8', 
                          fontSize: '0.85rem', 
                          fontWeight: '700', 
                          cursor: 'pointer',
                          boxShadow: isCurrent ? '0 0 10px rgba(6, 182, 212, 0.2)' : 'none',
                          transition: 'all 200ms ease'
                        }}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secure Footprint Tracker Tag */}
              <div style={{ fontSize: '0.7rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Shield size={12} color="#10b981" /> Hot-sync cloud connection pipe active
              </div>
            </div>

            {/* RIGHT COLUMN PANEL: SINGLE ELEMENT ISOLATION VIEW WITH FORWARD ROUTING */}
            <div style={{ padding: '4rem 5rem', display: 'flex', flexDirection: 'column', justifyBwteen: 'space-between', justifyContent: 'space-between', overflowY: 'auto' }}>
              
              <div style={{ maxWidth: '780px', width: '100%', margin: '0 auto' }}>
                
                {/* Horizontal Progress Track Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#8B5CF6', fontWeight: '800', fontFamily: 'monospace', background: 'rgba(139, 92, 246, 0.08)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                    SEGMENT {currentQuestionIndex + 1} / 10
                  </span>
                  <div style={{ flex: 1, height: '3px', background: '#1e293b', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${((currentQuestionIndex + 1) / 10) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)', transition: 'width 250ms ease-out' }} />
                  </div>
                </div>

                {/* Target Isolated Active Question */}
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', lineHeight: '1.5', color: '#f8fafc', marginBottom: '3rem', letterSpacing: '-0.02em', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  <HelpCircle size={24} color="#06B6D4" style={{ marginTop: '3px', shrink: 0, flexShrink: 0 }} />
                  {generatedQuestions[currentQuestionIndex]?.questionText}
                </h2>

                {/* Tactile Response Buttons Grid Layout */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {generatedQuestions[currentQuestionIndex]?.options.map((option, idx) => {
                    const isSelected = selectedAnswers[generatedQuestions[currentQuestionIndex].id] === idx;
                    return (
                      <div 
                        key={idx}
                        onClick={() => handleAnswerSelection(generatedQuestions[currentQuestionIndex].id, idx)}
                        style={{
                          background: isSelected ? 'rgba(6, 182, 212, 0.03)' : '#0f172a',
                          border: isSelected ? '1px solid #06B6D4' : '1px solid #1e293b',
                          padding: '1.25rem 1.5rem',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1.25rem',
                          boxShadow: isSelected ? '0 0 15px rgba(6, 182, 212, 0.1)' : 'none',
                          transition: 'all 150ms ease-in-out'
                        }}
                      >
                        {/* Selector Alpha node container bubble */}
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: isSelected ? '#06B6D4' : 'rgba(255,255,255,0.02)',
                          color: isSelected ? '#020617' : '#64748b',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontSize: '0.8rem',
                          fontWeight: '800'
                        }}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span style={{ fontSize: '0.95rem', color: isSelected ? '#fff' : '#cbd5e1', fontWeight: isSelected ? '600' : '400' }}>
                          {option}
                        </span>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Multi-Directional Navigation Footer Toolbar */}
              <div style={{ maxWidth: '780px', width: '100%', margin: '3rem auto 0 auto', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: '1.5rem' }}>
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  style={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    color: currentQuestionIndex === 0 ? '#475569' : '#fff',
                    padding: '0.7rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <ArrowLeft size={16} /> Previous Segment Node
                </button>

                {currentQuestionIndex + 1 === generatedQuestions.length ? (
                  <button
                    onClick={terminateAssessmentSession}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: '#fff',
                      padding: '0.7rem 2rem',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    Submit Assessment Matrix
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    style={{
                      background: '#06B6D4',
                      border: 'none',
                      color: '#020617',
                      padding: '0.7rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    Next Segment Node <ArrowRight size={16} />
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
      
      {/* Absolute Component Keyframe Injection Blocks */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}