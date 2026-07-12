import React, { useState, useEffect, useRef } from 'react';
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
  
  // Dynamic Web Telemetry States (Webcam & AI Model)
  const [webcamStreamInstance, setWebcamStreamInstance] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [model, setModel] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [proctorStatus, setProctorStatus] = useState({ status: 'VERIFIED', message: 'Proctor core offline.' });
  const [proctorLogs, setProctorLogs] = useState(["[INFO]: Secure proctoring engine initializing..."]);
  const [isFullscreenOverlayActive, setIsFullscreenOverlayActive] = useState(false);
  const [detections, setDetections] = useState([]);

  // Store stream references in refs for robust cleanup on unmount/re-renders
  const screenStreamRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    screenStreamRef.current = mediaStreamInstance;
  }, [mediaStreamInstance]);

  useEffect(() => {
    webcamStreamRef.current = webcamStreamInstance;
  }, [webcamStreamInstance]);

  // User Profile Telemetry Data
  const [userProfile, setUserProfile] = useState({
    name: "Manish Maurya",
    track: "Computer Applications / Software Engineering",
    nodeStatus: "VERIFIED_PROCTOR_ACCESS"
  });

  const addProctorLog = (msg) => {
    setProctorLogs(prev => [
      `[${new Date().toLocaleTimeString()}]: ${msg}`,
      ...prev.slice(0, 19)
    ]);
  };

  // 🚀 AI MODULES DYNAMIC LOADER INTERCEPTOR (TFJS + COCO-SSD)
  useEffect(() => {
    let active = true;
    const loadScripts = async () => {
      try {
        if (window.cocoSsd) {
          if (active) {
            addProctorLog("Proctoring algorithms cached. Initializing weight loaders...");
            try {
              const loadedModel = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
              if (active) {
                setModel(loadedModel);
                setIsModelLoading(false);
                addProctorLog("AI proctoring model loaded successfully.");
              }
            } catch (err) {
              console.error("AI load error:", err);
              if (active) addProctorLog("Error: AI compilation failed.");
            }
          }
          return;
        }

        const tfScript = document.createElement('script');
        tfScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js";
        tfScript.async = true;
        
        tfScript.onload = () => {
          if (!active) return;
          const cocoScript = document.createElement('script');
          cocoScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js";
          cocoScript.async = true;
          
          cocoScript.onload = async () => {
            if (!active) return;
            addProctorLog("Security nodes initialized. Synthesizing network graph...");
            try {
              const loadedModel = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
              if (active) {
                setModel(loadedModel);
                setIsModelLoading(false);
                addProctorLog("AI proctoring model compiled successfully.");
              }
            } catch (err) {
              console.error("COCO load error:", err);
              if (active) addProctorLog("Error: Weight compilation faulted.");
            }
          };
          document.head.appendChild(cocoScript);
        };
        document.head.appendChild(tfScript);
      } catch (err) {
        console.error("TF script load error:", err);
      }
    };

    loadScripts();
    return () => {
      active = false;
    };
  }, []);

  // 🚀 PROGRAMMATIC FULLSCREEN REQUEST GATEWAY
  const enterFullscreen = () => {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().then(() => {
        setIsFullscreenOverlayActive(false);
      }).catch(err => {
        console.error("Fullscreen lock rejected by browser context:", err);
      });
    }
  };

  // 🚀 PHASE 1: SCREEN SHARE & WEBCAM ACCESS REGISTER REFERENCE
  const initiateSecureProctorStream = async () => {
    setStreamError("");
    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 900;
      
      // 1. Desktop Screen Capture Check (Skip on mobile)
      if (!isMobile && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        addProctorLog("Requesting hardware proctor desktop screen capture channel...");
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        setMediaStreamInstance(screenStream);
        
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrack.onended = () => {
          alert("🚨 CRITICAL TELEMETRY FAULT: Screen share connection terminated. Security rules active.");
          window.location.reload();
        };
      } else {
        addProctorLog("Mobile client or screen sharing unsupported. Skipping screen capture check.");
      }

      // 2. Front Webcam Camera Capture Check
      addProctorLog("Requesting hardware proctor camera channels...");
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false
      });
      setWebcamStreamInstance(cameraStream);
      addProctorLog("Webcam stream active. Identity scan complete.");

      // 3. Lock window to Fullscreen mode
      enterFullscreen();

      // Proceed directly to questions synthesis
      compileAndPersistQuizMatrix();
    } catch (err) {
      console.error("Telemetry streams startup failed:", err);
      setStreamError("⚠️ Hardware access denied. Please grant Camera permissions to authenticate.");
      addProctorLog("Error: Security environment initialization aborted.");
    }
  };

  // 🚀 PHASE 2: AI COMPILER - CORES PERSISTENCE INTO MONGODB
  const compileAndPersistQuizMatrix = async () => {
    setAssessmentPhase('GENERATING');
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${window.API_URL}/api/quiz/generate-and-save`, {
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
      await fetch(`${window.API_URL}/api/quiz/record-results`, {
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
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`🔒 [MEDIA_STREAM_CLEANUP]: Disconnected screen share track source: ${track.kind}`);
      });
    }

    // Explicitly disconnect webcam stream
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`🔒 [MEDIA_STREAM_CLEANUP]: Disconnected webcam track source: ${track.kind}`);
      });
    }

    // Programmatically release fullscreen lock
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log("Exit fullscreen failed:", err));
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

  // 🚀 PHASE 5: PROCTORING SECURITY POLICY VIOLATION INTERCEPTOR
  const handleSecurityViolation = (reason) => {
    addProctorLog(`VIOLATION EVENT: ${reason}`);
    
    setWarningCount(prev => {
      const next = prev + 1;
      if (next >= 2) {
        // Second Warning triggers immediate automatic lock and submission
        setShowWarningModal(false);
        alert(`🚨 SECURITY EXCLUSION TERMINATION:\nReason: ${reason}\n\nLimit exceeded (2/2 warnings). Quiz will submit automatically.`);
        terminateAssessmentSession();
      } else {
        // First Warning shows blocking dialog
        setWarningMessage(reason);
        setShowWarningModal(true);
      }
      return next;
    });
  };

  // 🚀 PHASE 6: COUNTDOWN TIMER PARSING & SECURE TICK ROUTINE
  const getQuizDurationInSeconds = () => {
    const duration = quiz?.duration;
    if (!duration) return 20 * 60;
    if (typeof duration === 'number') return duration * 60;
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1], 10) * 60 : 20 * 60;
  };

  useEffect(() => {
    if (assessmentPhase === 'ACTIVE_QUIZ') {
      setTimeLeft(getQuizDurationInSeconds());
    }
  }, [assessmentPhase]);

  useEffect(() => {
    let timerId;
    if (assessmentPhase === 'ACTIVE_QUIZ') {
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timerId);
            addProctorLog("TIMEOUT: Assessment timer expired. Auto-submitting...");
            alert("⏰ TIME EXPIRED: Assessment session duration reached. Auto-submitting answers.");
            terminateAssessmentSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [assessmentPhase]);

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 🚀 PHASE 7: ESCAPE KEY / FULLSCREEN INTERFERENCE LISTENER
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (assessmentPhase === 'ACTIVE_QUIZ') {
        if (!document.fullscreenElement) {
          setIsFullscreenOverlayActive(true);
          handleSecurityViolation("Exited fullscreen mode profile");
        } else {
          setIsFullscreenOverlayActive(false);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [assessmentPhase]);

  // 🚀 PHASE 8: WEBCAM FEED ATTACHMENT & AI DETECTION LOOP
  useEffect(() => {
    if (assessmentPhase === 'ACTIVE_QUIZ' && webcamStreamInstance && videoRef.current) {
      videoRef.current.srcObject = webcamStreamInstance;
      videoRef.current.play().catch(err => console.error("Proctor video stream attachment failure:", err));
    }
  }, [assessmentPhase, webcamStreamInstance]);

  useEffect(() => {
    let intervalId;
    let consecutiveViolationCount = 0;
    let violationReason = "";

    if (assessmentPhase === 'ACTIVE_QUIZ' && model && videoRef.current && webcamStreamInstance) {
      addProctorLog("Real-time telemetry analytics stream established.");
      
      intervalId = setInterval(async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

        try {
          const predictions = await model.detect(videoRef.current);
          setDetections(predictions);

          const hasPerson = predictions.some(p => p.class === 'person');
          const hasPhone = predictions.some(p => p.class === 'cell phone');
          const hasDisallowed = predictions.some(p => ['laptop', 'book', 'tablet'].includes(p.class));

          let currentViolation = null;
          if (!hasPerson) {
            currentViolation = "User face not detected in telemetry frame";
          } else if (hasPhone) {
            currentViolation = "Prohibited device (Cell Phone) detected";
          } else if (hasDisallowed) {
            currentViolation = "Disallowed reference object detected (Book/Laptop)";
          }

          if (currentViolation) {
            consecutiveViolationCount++;
            violationReason = currentViolation;
            setProctorStatus({ 
              status: 'ALERT', 
              message: `AI PENDING ALERT: ${currentViolation}...` 
            });
            
            // Allow 2 consecutive frames (3s window) of verification to eliminate noise/glitches
            if (consecutiveViolationCount >= 2) {
              handleSecurityViolation(violationReason);
              consecutiveViolationCount = 0; // reset
            }
          } else {
            consecutiveViolationCount = 0;
            setProctorStatus({ 
              status: 'VERIFIED', 
              message: 'Environment secure. User presence verified.' 
            });
          }
        } catch (err) {
          console.warn("Proctor frame capture warning:", err);
        }
      }, 1500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [assessmentPhase, model, webcamStreamInstance]);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'radial-gradient(circle at top right, #090d22, #020617)', 
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
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '1rem 2.5rem', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)', 
        background: 'rgba(10, 15, 30, 0.75)', 
        backdropFilter: 'blur(20px)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              background: assessmentPhase === 'ACTIVE_QUIZ' ? '#f43f5e' : '#06B6D4', 
              borderRadius: '50%', 
              animation: assessmentPhase === 'ACTIVE_QUIZ' ? 'pulse 1.5s infinite' : 'none' 
            }} />
            <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {assessmentPhase === 'ACTIVE_QUIZ' ? "LIVE TESTING STREAM ACTIVE" : "SECURE SHELL GATEWAY"}
            </span>
          </div>
          <div style={{ height: '20px', width: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
          <div style={{ fontSize: '0.88rem', color: '#cbd5e1', fontWeight: '500' }}>
            Topic Architecture Profile: <span style={{ color: '#06B6D4', fontWeight: '700' }}>{topicName}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Dynamic timer badge */}
          {assessmentPhase === 'ACTIVE_QUIZ' && timeLeft !== null && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: timeLeft < 60 ? 'rgba(244, 63, 94, 0.08)' : 'rgba(6, 182, 212, 0.05)', 
              border: timeLeft < 60 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(6, 182, 212, 0.2)', 
              padding: '0.45rem 0.9rem', 
              borderRadius: '8px',
              animation: timeLeft < 60 ? 'pulse 1s infinite' : 'none',
              boxShadow: timeLeft < 60 ? '0 0 10px rgba(244, 63, 94, 0.2)' : 'none'
            }}>
              <Clock size={14} color={timeLeft < 60 ? '#f43f5e' : '#06B6D4'} />
              <span style={{ fontSize: '0.85rem', color: timeLeft < 60 ? '#f43f5e' : '#06B6D4', fontWeight: '700', fontFamily: 'monospace' }}>
                {formatTime(timeLeft)} REMAINING
              </span>
            </div>
          )}

          {/* Warning count badge */}
          {assessmentPhase === 'ACTIVE_QUIZ' && warningCount > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              background: 'rgba(244, 63, 94, 0.1)', 
              border: '1px solid rgba(244, 63, 94, 0.3)', 
              padding: '0.45rem 0.9rem', 
              borderRadius: '8px' 
            }}>
              <AlertTriangle size={14} color="#f43f5e" />
              <span style={{ fontSize: '0.82rem', color: '#f43f5e', fontWeight: '700' }}>
                SECURITY EVENTS: {warningCount} / 2
              </span>
            </div>
          )}
        </div>
      </div>

      {/* WORKSPACE MIDDLE SCREEN CONTROLLER RENDER SECTIONS */}
      <div style={{ flex: 1, display: 'flex', background: '#020617', overflow: 'hidden', position: 'relative' }}>
        
        {/* VIEW A: INITIAL WELCOME DETAILS BANNER */}
        {assessmentPhase === 'DETAILS' && (
          <div style={{ 
            margin: 'auto', 
            width: '100%', 
            maxWidth: '600px', 
            background: 'rgba(15, 23, 42, 0.75)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            padding: '3rem', 
            borderRadius: '16px', 
            textAlign: 'left', 
            backdropFilter: 'blur(20px)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <Shield size={32} color="#06B6D4" />
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.025em', color: '#f8fafc' }}>
                {quiz?.name || "Modular Assessment"}
              </h1>
            </div>
            
            <p style={{ margin: '0 0 2rem 0', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Welcome to the Secure Testing Arena. This assessment is proctored in real-time by an automated AI model to verify identity and maintain evaluation integrity.
            </p>

            <div style={{ background: 'rgba(6, 182, 212, 0.02)', border: '1px solid rgba(6, 182, 212, 0.1)', padding: '1.25rem', borderRadius: '10px', marginBottom: '2.5rem' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', color: '#06B6D4', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Environment Checkpoints</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <div style={{ width: '6px', height: '6px', background: '#06B6D4', borderRadius: '50%' }} />
                  Screen Share Streaming Permission (Enforced)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <div style={{ width: '6px', height: '6px', background: '#06B6D4', borderRadius: '50%' }} />
                  Live Webcam Telemetry Feed (AI Monitored)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <div style={{ width: '6px', height: '6px', background: '#06B6D4', borderRadius: '50%' }} />
                  Locked Fullscreen Execution (Exiting triggers instant violation alert)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <div style={{ width: '6px', height: '6px', background: '#06B6D4', borderRadius: '50%' }} />
                  Dynamic AI Object Scanner (Cell phone & user presence check)
                </div>
              </div>
            </div>

            {isModelLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <RefreshCw size={20} color="#8B5CF6" style={{ animation: 'spin 2s linear infinite' }} />
                <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>Downloading security weights and compiling AI scanner...</span>
              </div>
            ) : (
              <button 
                onClick={() => setAssessmentPhase('STREAM_ENFORCE')} 
                style={{ 
                  width: '100%', 
                  background: 'linear-gradient(135deg, #06B6D4, #0891b2)', 
                  border: 'none', 
                  color: '#020617', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  fontSize: '0.95rem', 
                  fontWeight: '700', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  boxShadow: '0 4px 20px rgba(6, 182, 212, 0.3)'
                }}
              >
                Proceed to Environment Setup <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {/* VIEW B: FULL STREAM ENFORCER OVERLAY BUTTONS */}
        {assessmentPhase === 'STREAM_ENFORCE' && (
          <div style={{ 
            margin: 'auto', 
            width: '100%', 
            maxWidth: '540px', 
            background: 'rgba(15, 23, 42, 0.75)', 
            border: '1px solid rgba(139, 92, 246, 0.25)', 
            padding: '3rem', 
            borderRadius: '16px', 
            textAlign: 'center',
            backdropFilter: 'blur(20px)'
          }}>
            <Monitor size={48} color="#8B5CF6" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.4))' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 1rem 0', color: '#fff' }}>Establish Proctor Connection</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
              Authorize the screen-sharing stream and webcam feeds to setup your secure exam session context. Please grant both permissions when prompted.
            </p>
            {streamError && (
              <div style={{ 
                color: '#f87171', 
                fontSize: '0.85rem', 
                marginBottom: '1.5rem', 
                textAlign: 'left', 
                background: 'rgba(239, 68, 68, 0.08)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                padding: '0.8rem 1.2rem', 
                borderRadius: '8px' 
              }}>
                {streamError}
              </div>
            )}
            <button 
              onClick={initiateSecureProctorStream} 
              style={{ 
                width: '100%', 
                background: 'linear-gradient(135deg, #8B5CF6, #7c3aed)', 
                border: 'none', 
                color: '#fff', 
                padding: '1rem', 
                borderRadius: '8px', 
                fontSize: '0.95rem', 
                fontWeight: '700', 
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
              }}
            >
              Start Security Telemetry Verification
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
          <div className="quiz-workspace-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%' }}>
            
            {/* LEFT COLUMN PANEL: DYNAMIC USER METADATA METRICS GRAPH */}
            <div style={{ 
              background: 'rgba(15, 23, 42, 0.85)', 
              borderRight: '1px solid rgba(255, 255, 255, 0.06)', 
              padding: '2rem 1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.5rem', 
              overflowY: 'auto',
              height: '100%'
            }}>
              
              {/* User Telemetry Card */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                background: '#020617', 
                padding: '1rem', 
                borderRadius: '12px', 
                border: '1px solid rgba(255,255,255,0.06)' 
              }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  background: 'rgba(6, 182, 212, 0.08)', 
                  border: '1px solid rgba(6, 182, 212, 0.2)', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  color: '#06B6D4' 
                }}>
                  <User size={18} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userProfile.name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginTop: '0.15rem' }}>Candidate Reference</div>
                </div>
              </div>

              {/* Webcam Proctor Feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#06b6d4', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Proctor Stream</span>
                
                <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: '10px', overflow: 'hidden', background: '#020617', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  <video 
                    ref={videoRef}
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
                  />
                  
                  {/* Bounding box overlays */}
                  {detections.map((det, idx) => {
                    const videoWidth = videoRef.current ? videoRef.current.videoWidth || 320 : 320;
                    const videoHeight = videoRef.current ? videoRef.current.videoHeight || 240 : 240;
                    
                    const containerW = 272; // Width of sidebar is 320px minus 2*1.5rem padding (48px) = 272px
                    const containerH = 160;
                    const scaleX = containerW / videoWidth;
                    const scaleY = containerH / videoHeight;

                    const [x, y, width, height] = det.bbox;
                    const left = containerW - (x + width) * scaleX;
                    const top = y * scaleY;
                    const boxW = width * scaleX;
                    const boxH = height * scaleY;

                    const isViolation = det.class === 'cell phone' || ['laptop', 'book', 'tablet'].includes(det.class);

                    return (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          left: `${left}px`,
                          top: `${top}px`,
                          width: `${boxW}px`,
                          height: `${boxH}px`,
                          border: isViolation ? '2px solid #f43f5e' : '2px solid #10b981',
                          borderRadius: '4px',
                          pointerEvents: 'none',
                          zIndex: 10
                        }}
                      >
                        <span style={{
                          position: 'absolute',
                          top: '-18px',
                          left: 0,
                          background: isViolation ? '#f43f5e' : '#10b981',
                          color: '#fff',
                          fontSize: '0.6rem',
                          padding: '1px 3px',
                          borderRadius: '2px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap'
                        }}>
                          {det.class} ({Math.round(det.score * 100)}%)
                        </span>
                      </div>
                    );
                  })}

                  {/* Scan overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
                    backgroundSize: '100% 4px',
                    pointerEvents: 'none'
                  }} />
                  
                  {/* Pulsing scanline */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '2px',
                    background: 'rgba(6, 182, 212, 0.4)',
                    boxShadow: '0 0 6px rgba(6, 182, 212, 0.8)',
                    animation: 'scanline 3s linear infinite',
                    pointerEvents: 'none'
                  }} />
                </div>

                {/* Status Indicator */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  background: proctorStatus.status === 'VERIFIED' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)', 
                  border: proctorStatus.status === 'VERIFIED' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(244, 63, 94, 0.2)',
                  padding: '0.5rem 0.75rem', 
                  borderRadius: '6px' 
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    background: proctorStatus.status === 'VERIFIED' ? '#10b981' : '#f43f5e', 
                    borderRadius: '50%',
                    animation: 'pulse 1s infinite'
                  }} />
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: proctorStatus.status === 'VERIFIED' ? '#10b981' : '#f43f5e',
                    fontWeight: '700' 
                  }}>
                    {proctorStatus.message}
                  </span>
                </div>
              </div>

              {/* Scrolling Logs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#8B5CF6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telemetry Logs</span>
                <div style={{ 
                  background: '#020617', 
                  border: '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: '8px', 
                  padding: '0.6rem', 
                  height: '100px', 
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.68rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  color: '#64748b'
                }}>
                  {proctorLogs.map((log, i) => {
                    const isViolation = log.includes('VIOLATION');
                    const isWarning = log.includes('Warning') || log.includes('ALERT');
                    return (
                      <div key={i} style={{ color: isViolation ? '#f43f5e' : isWarning ? '#fbbf24' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Matrix Step Segments Map */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Questions Array Monitor</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                  {generatedQuestions.map((q, idx) => {
                    const isCurrent = idx === currentQuestionIndex;
                    const isAnswered = selectedAnswers[q.id] !== undefined;
                    return (
                      <button 
                        key={q.id} 
                        onClick={() => setCurrentQuestionIndex(idx)} 
                        style={{ 
                          height: '34px', 
                          borderRadius: '6px', 
                          border: isCurrent ? '1px solid #06B6D4' : '1px solid rgba(255, 255, 255, 0.06)', 
                          background: isCurrent ? 'rgba(6, 182, 212, 0.12)' : isAnswered ? 'rgba(139, 92, 246, 0.08)' : '#020617', 
                          color: isCurrent ? '#06B6D4' : isAnswered ? '#a78bfa' : '#94a3b8', 
                          fontSize: '0.8rem', 
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

              <div style={{ flex: 1 }} />

              {/* Secure Footprint Tracker Tag */}
              <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                <Shield size={12} color="#10b981" /> Hot-sync cloud connection active
              </div>
            </div>

            {/* RIGHT COLUMN PANEL: SINGLE ELEMENT ISOLATION VIEW WITH FORWARD ROUTING */}
            <div style={{ 
              padding: '3rem 4rem', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              overflowY: 'auto',
              background: 'radial-gradient(circle at bottom left, #050716, #020617)'
            }}>
              
              <div style={{ maxWidth: '780px', width: '100%', margin: '0 auto' }}>
                
                {/* Horizontal Progress Track Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#8B5CF6', fontWeight: '800', fontFamily: 'monospace', background: 'rgba(139, 92, 246, 0.08)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                    SEGMENT {currentQuestionIndex + 1} / {generatedQuestions.length}
                  </span>
                  <div style={{ flex: 1, height: '3px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${((currentQuestionIndex + 1) / generatedQuestions.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)', transition: 'width 250ms ease-out' }} />
                  </div>
                </div>

                {/* Target Isolated Active Question */}
                <h2 style={{ fontSize: '1.35rem', fontWeight: '700', lineHeight: '1.5', color: '#f8fafc', marginBottom: '2.5rem', letterSpacing: '-0.02em', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  <HelpCircle size={22} color="#06B6D4" style={{ marginTop: '3px', flexShrink: 0 }} />
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
                          background: isSelected ? 'rgba(6, 182, 212, 0.04)' : 'rgba(15, 23, 42, 0.65)',
                          border: isSelected ? '1px solid #06B6D4' : '1px solid rgba(255, 255, 255, 0.06)',
                          padding: '1.25rem 1.5rem',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1.25rem',
                          boxShadow: isSelected ? '0 0 15px rgba(6, 182, 212, 0.12)' : 'none',
                          transition: 'all 200ms ease',
                          transform: isSelected ? 'scale(1.005)' : 'scale(1)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.border = '1px solid rgba(6, 182, 212, 0.3)';
                            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.06)';
                            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.65)';
                          }
                        }}
                      >
                        {/* Selector Alpha node container bubble */}
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: isSelected ? '#06B6D4' : 'rgba(255, 255, 255, 0.04)',
                          color: isSelected ? '#020617' : '#cbd5e1',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontSize: '0.8rem',
                          fontWeight: '800',
                          transition: 'all 200ms ease'
                        }}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span style={{ 
                          fontSize: '0.95rem', 
                          color: isSelected ? '#fff' : '#cbd5e1', 
                          fontWeight: isSelected ? '600' : '400',
                          transition: 'all 200ms ease'
                        }}>
                          {option}
                        </span>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Multi-Directional Navigation Footer Toolbar */}
              <div style={{ maxWidth: '780px', width: '100%', margin: '3rem auto 0 auto', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
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

      {/* SECURITY VIOLATION ALERT MODAL */}
      {showWarningModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(2, 6, 23, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100000,
          animation: 'fade-in 0.2s ease-out'
        }}>
          <div style={{
            background: '#0f172a',
            border: '2px solid #ef4444',
            borderRadius: '16px',
            padding: '3rem',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)'
          }}>
            <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '1.5rem', animation: 'pulse 1s infinite' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f8fafc', margin: '0 0 0.5rem 0' }}>Security Warning</h2>
            <div style={{
              fontSize: '1rem',
              color: '#fca5a5',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              padding: '1rem',
              borderRadius: '8px',
              margin: '1.5rem 0',
              fontWeight: '600'
            }}>
              {warningMessage}
            </div>
            
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 2rem 0' }}>
              Warning count: <span style={{ color: '#ef4444', fontWeight: '800' }}>{warningCount} / 2</span>. 
              Please note that <span style={{ color: '#ef4444', fontWeight: '700' }}>a second warning will result in the immediate automatic submission</span> and closure of your assessment.
            </p>

            <button
              onClick={() => {
                setShowWarningModal(false);
                enterFullscreen();
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none',
                color: '#fff',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
              }}
            >
              I Understand, Resume Assessment
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN RE-ENTRY BLOCKER OVERLAY */}
      {isFullscreenOverlayActive && !showWarningModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(2, 6, 23, 0.95)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99998,
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '3rem',
            maxWidth: '480px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <Monitor size={56} color="#06b6d4" style={{ marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', margin: '0 0 1rem 0' }}>Fullscreen Mode Required</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 2rem 0' }}>
              Your environment stream was interrupted because you exited full screen mode. To resume the assessment, please re-enter full screen immediately.
            </p>
            
            <button
              onClick={enterFullscreen}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                border: 'none',
                color: '#020617',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)'
              }}
            >
              Re-enter Full Screen Mode
            </button>
          </div>
        </div>
      )}
      
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
        @keyframes scanline {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 900px) {
          .quiz-workspace-grid {
            grid-template-columns: 1fr !important;
            overflow-y: auto !important;
            height: auto !important;
          }
          .quiz-workspace-grid > div {
            height: auto !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
          }
        }
      `}</style>
    </div>
  );
}