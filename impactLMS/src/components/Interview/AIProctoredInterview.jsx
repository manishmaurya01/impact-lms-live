import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const AIProctoredInterview = () => {
  const { interviewId, sessionId } = useParams();
  const navigate = useNavigate();

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [liveSpeechBuffer, setLiveSpeechBuffer] = useState('');
  const [botSpeakingState, setBotSpeakingState] = useState(false);
  const [processingPipeline, setProcessingPipeline] = useState(false);
  const [violations, setViolations] = useState(0);

  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const internalSilenceWarningTimerRef = useRef(null);

  const BACKEND_URL = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    enforceFullscreenAndHardwareAccess();
    
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setViolations(prev => {
          const nextCount = prev + 1;
          fetch(`${BACKEND_URL}/interview/sync-proctor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ interviewId, tabSwitchDetected: true })
          });
          alert("⚠️ WATCHDOG PROCTOR FLAG: Tab blur detected and logged into database matrix node.");
          if (nextCount >= 3) terminateSessionForCheating();
          return nextCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearAllTimers();
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const clearAllTimers = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (internalSilenceWarningTimerRef.current) clearTimeout(internalSilenceWarningTimerRef.current);
  };

  const enforceFullscreenAndHardwareAccess = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      triggerInitialQuestionFetch();
    } catch (err) {
      alert("Hardware pipeline blocked! Microphone and camera data required to execute panel.");
      cleanlyExitToMainDashboard();
    }
  };

  const triggerInitialQuestionFetch = async () => {
    try {
      setProcessingPipeline(true);
      const res = await fetch(`${BACKEND_URL}/interview/conversation-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ sessionId, userVerbalAnswer: "START_INITIALIZATION_TOKEN" })
      });
      const data = await res.json();
      setProcessingPipeline(false);

      if (data.success) {
        setCurrentQuestion(data.nextMessage);
        executeSpeechSynthesisOutput(data.nextMessage);
      }
    } catch (err) {
      setProcessingPipeline(false);
      console.error("Initialization loop crash down line reference:", err);
    }
  };

  const executeSpeechSynthesisOutput = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (/[\u0900-\u097F]/.test(text)) {
        utterance.lang = 'hi-IN';
      } else if (/[\u0A80-\u0AFF]/.test(text)) {
        utterance.lang = 'gu-IN';
      } else if (/[áéíóúñÁÉÍÓÚÑ]/.test(text)) {
        utterance.lang = 'es-ES';
      } else {
        utterance.lang = 'en-US';
      }
      
      utterance.rate = 1.0;
      
      utterance.onstart = () => {
        setBotSpeakingState(true);
        clearAllTimers();
        if (recognitionRef.current) recognitionRef.current.stop();
      };

      utterance.onend = () => {
        setBotSpeakingState(false);
        activateMicrophoneSpeechStream();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      activateMicrophoneSpeechStream();
    }
  };

  const activateMicrophoneSpeechStream = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (processingPipeline) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    
    rec.lang = 'en-US';
    if (currentQuestion) {
      if (/[\u0900-\u097F]/.test(currentQuestion)) rec.lang = 'hi-IN';
      else if (/[\u0A80-\u0AFF]/.test(currentQuestion)) rec.lang = 'gu-IN';
      else if (/[áéíóúñÁÉÍÓÚÑ]/.test(currentQuestion)) rec.lang = 'es-ES';
    }

    let localSpeechAccumulator = '';
    clearAllTimers();

    // 8-Second Silence Warning Switch
    internalSilenceWarningTimerRef.current = setTimeout(() => {
      if (!localSpeechAccumulator.trim()) {
        rec.stop();
        dispatchAudioPayloadToBackend("USER_SILENT_REPROMPT_TOKEN");
      }
    }, 8000);

    rec.onstart = () => { 
      setIsListening(true); 
      setLiveSpeechBuffer(''); 
    };
    
    rec.onresult = (event) => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (internalSilenceWarningTimerRef.current) clearTimeout(internalSilenceWarningTimerRef.current);
      
      let speechSlice = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) speechSlice += event.results[i][0].transcript + ' ';
      }

      if (speechSlice) {
        setLiveSpeechBuffer(prev => {
          const joinedData = prev + speechSlice;
          localSpeechAccumulator = joinedData;
          
          // --- STRICT 3 SECONDS SILENCE AUTO-SUBMIT DETECTOR ---
          silenceTimeoutRef.current = setTimeout(() => {
            rec.stop();
            dispatchAudioPayloadToBackend(joinedData);
          }, 3000);

          return joinedData;
        });
      }
    };

    rec.onend = () => { setIsListening(false); };
    recognitionRef.current = rec;
    rec.start();
  };

  const dispatchAudioPayloadToBackend = async (payload) => {
    if (!payload.trim()) {
      activateMicrophoneSpeechStream(); 
      return;
    }

    try {
      setProcessingPipeline(true);
      const res = await fetch(`${BACKEND_URL}/interview/conversation-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ sessionId, userVerbalAnswer: payload })
      });
      const data = await res.json();
      setProcessingPipeline(false);

      if (data.success) {
        if (data.isCompleted) {
          executeSpeechSynthesisOutput("Assessment completely extracted. Re-directing back to main console panel.");
          setTimeout(() => { cleanlyExitToMainDashboard(); }, 4000);
        } else {
          setCurrentQuestion(data.nextMessage);
          setLiveSpeechBuffer('');
          executeSpeechSynthesisOutput(data.nextMessage);
        }
      }
    } catch (err) {
      setProcessingPipeline(false);
      console.error("Payload computation step array error mapping:", err);
      activateMicrophoneSpeechStream();
    }
  };

  const terminateSessionForCheating = () => {
    alert("🔴 ASSESSMENT LOCKED DOWN: Multiple visibility shifts tracking violation rules ceilings.");
    cleanlyExitToMainDashboard();
  };

  const cleanlyExitToMainDashboard = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    clearAllTimers();
    window.speechSynthesis?.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    navigate('/interview');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans flex flex-col justify-between relative overflow-hidden">
      <script src="https://cdn.tailwindcss.com"></script>

      {processingPipeline && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-4 transition-all duration-300">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs tracking-widest text-blue-400 uppercase animate-pulse">AI_GENERATING_NEXT_SHORT_EVALUATION_QUESTION...</p>
        </div>
      )}

      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 px-6 py-4 rounded-xl shadow-2xl">
        <span className="text-xs font-mono font-bold tracking-widest text-red-500 animate-pulse flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" /> SECURE_SURVEILLANCE_GRID // ACTIVE
        </span>
        <span className="text-xs font-mono text-slate-400">FRAUD_FLAGS: <strong className="text-red-400">{violations}/3</strong></span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch flex-1 my-6">
        
        <div className={`p-8 rounded-2xl border transition-all flex flex-col justify-between shadow-2xl ${botSpeakingState ? 'bg-slate-900 border-blue-500/50 shadow-blue-900/10' : 'bg-slate-900/40 border-slate-800'}`}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-1.5 h-1.5 rounded-full ${botSpeakingState ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[10px] font-black font-mono tracking-widest text-slate-400 uppercase">AI INTERVIEW PANEL PANEL</span>
            </div>
            
            <p className="text-xl md:text-2xl font-medium leading-relaxed text-slate-100">
              {processingPipeline ? "Computing telemetry query array..." : (currentQuestion || "Formulating metrics context criteria...")}
            </p>
          </div>

          {botSpeakingState && !processingPipeline && (
            <div className="flex gap-1 h-6 items-end mt-6">
              {[0.4, 0.9, 0.3, 0.7, 0.5, 0.8, 0.2, 0.6, 0.9, 0.4].map((h, i) => (
                <div key={i} className="bg-blue-500 flex-1 rounded-full animate-pulse" style={{ height: `${h * 100}%`, animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          )}
        </div>

        <div className={`p-4 bg-slate-900 border rounded-2xl flex flex-col justify-between shadow-2xl ${isListening ? 'border-emerald-500/40' : 'border-slate-800'}`}>
          <div className="w-full aspect-video md:flex-1 bg-slate-950 rounded-xl overflow-hidden border border-slate-950">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          </div>
          
          <div className="mt-4 p-4 bg-slate-950 border border-slate-800/80 rounded-xl min-h-[72px] flex items-center">
            <div className="w-full">
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">
                {isListening ? '🎙️ CAPTURE STREAM ENGINE ACTIVE (TALK NOW):' : '🔒 PROCESS COGNITION SHIELD BLOCK (AI PROCESSING)'}
              </span>
              <p className="text-xs text-slate-300 italic font-medium leading-relaxed transition-all">
                {liveSpeechBuffer || (processingPipeline ? "Awaiting calculation cycle loops..." : "Speak freely, silence detection lock mapped...")}
              </p>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center text-xs text-slate-400 font-mono">
        <p>Telemetry Node Key Stream Sequence: #{sessionId?.slice(-6).toUpperCase()}</p>
        <button onClick={cleanlyExitToMainDashboard} className="px-4 py-1.5 bg-slate-950 hover:bg-red-950/30 border border-slate-800 rounded text-red-400 font-bold transition-all tracking-wide">ABORT SESSION</button>
      </div>
    </div>
  );
};

export default AIProctoredInterview;