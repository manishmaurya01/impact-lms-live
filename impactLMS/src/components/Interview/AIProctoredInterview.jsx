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

  // Dynamic Languages & Fallbacks
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [voices, setVoices] = useState([]);
  const [proctorLogs, setProctorLogs] = useState(["[INFO]: Secure proctoring initialized."]);
  const [model, setModel] = useState(null);
  const [faceDetected, setFaceDetected] = useState(true);

  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const internalSilenceWarningTimerRef = useRef(null);

  const BACKEND_URL = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  const addProctorLog = (msg) => {
    setProctorLogs(prev => [
      `[${new Date().toLocaleTimeString()}]: ${msg}`,
      ...prev.slice(0, 19)
    ]);
  };

  // Load voices & BlazeFace proctoring scripts dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    let active = true;
    const loadScripts = async () => {
      try {
        if (window.blazeface) {
          if (active) {
            addProctorLog("BlazeFace libraries detected. Loading weights...");
            const loadedModel = await window.blazeface.load();
            if (active) {
              setModel(loadedModel);
              addProctorLog("AI Face Detection compiled successfully.");
            }
          }
          return;
        }

        const tfScript = document.createElement('script');
        tfScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js";
        tfScript.async = true;
        
        tfScript.onload = () => {
          if (!active) return;
          const faceScript = document.createElement('script');
          faceScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7/dist/blazeface.min.js";
          faceScript.async = true;
          
          faceScript.onload = async () => {
            if (!active) return;
            addProctorLog("Webcam verification algorithms loaded. Checking camera feed...");
            try {
              const loadedModel = await window.blazeface.load();
              if (active) {
                setModel(loadedModel);
                addProctorLog("AI Face Detection model compiled.");
              }
            } catch (err) {
              console.error("BlazeFace load error:", err);
              if (active) addProctorLog("Error: Face tracking weight compilation failed.");
            }
          };
          document.head.appendChild(faceScript);
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

  // Real-time Face Detection Loop
  useEffect(() => {
    let intervalId;
    if (model && videoRef.current) {
      addProctorLog("Real-time facial surveillance grid active.");
      intervalId = setInterval(async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
        try {
          const predictions = await model.estimateFaces(videoRef.current, false, false, false);
          if (predictions && predictions.length > 0) {
            setFaceDetected(true);
          } else {
            setFaceDetected(false);
            addProctorLog("Proctor Alert: User face not detected in stream.");
          }
        } catch (err) {
          console.warn("Face proctor frame capture error:", err);
        }
      }, 1200);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [model]);

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
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
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
        if (data.language) {
          setSelectedLanguage(data.language);
        }
        setConversationHistory([{ role: 'interviewer', text: data.nextMessage, timestamp: new Date() }]);
        executeSpeechSynthesisOutput(data.nextMessage, data.language || selectedLanguage);
      }
    } catch (err) {
      setProcessingPipeline(false);
      console.error("Initialization loop crash down line reference:", err);
    }
  };

  const executeSpeechSynthesisOutput = (text, langName) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const langMap = {
        'English': 'en-US',
        'Hindi': 'hi-IN',
        'Hinglish': 'hi-IN',
        'Gujarati': 'gu-IN',
        'Spanish': 'es-ES',
        'French': 'fr-FR'
      };
      
      const targetLangLocale = langMap[langName || selectedLanguage] || 'en-US';
      utterance.lang = targetLangLocale;
      
      // Bind native high-quality voice packs
      const browserVoices = window.speechSynthesis.getVoices();
      const matchedVoice = browserVoices.find(v => v.lang.toLowerCase() === targetLangLocale.toLowerCase()) ||
                           browserVoices.find(v => v.lang.toLowerCase().startsWith(targetLangLocale.split('-')[0].toLowerCase()));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      
      utterance.rate = 1.0;
      
      utterance.onstart = () => {
        setBotSpeakingState(true);
        clearAllTimers();
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e) {}
        }
      };

      utterance.onend = () => {
        setBotSpeakingState(false);
        if (!keyboardMode) {
          activateMicrophoneSpeechStream();
        }
      };

      window.speechSynthesis.speak(utterance);
    } else {
      if (!keyboardMode) {
        activateMicrophoneSpeechStream();
      }
    }
  };

  const activateMicrophoneSpeechStream = () => {
    if (keyboardMode) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (processingPipeline) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    
    const langMap = {
      'English': 'en-US',
      'Hindi': 'hi-IN',
      'Hinglish': 'hi-IN',
      'Gujarati': 'gu-IN',
      'Spanish': 'es-ES',
      'French': 'fr-FR'
    };
    rec.lang = langMap[selectedLanguage] || 'en-US';

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
      if (!keyboardMode) activateMicrophoneSpeechStream(); 
      return;
    }

    // Append to local history log immediately
    setConversationHistory(prev => [...prev, { role: 'candidate', text: payload, timestamp: new Date() }]);

    try {
      setProcessingPipeline(true);
      const res = await fetch(`${BACKEND_URL}/interview/conversation-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ sessionId, userVerbalAnswer: payload, language: selectedLanguage })
      });
      const data = await res.json();
      setProcessingPipeline(false);

      if (data.success) {
        if (data.isCompleted) {
          executeSpeechSynthesisOutput("Assessment completely extracted. Re-directing back to main console panel.", selectedLanguage);
          setTimeout(() => { cleanlyExitToMainDashboard(); }, 4000);
        } else {
          setCurrentQuestion(data.nextMessage);
          setLiveSpeechBuffer('');
          setTypedAnswer('');
          // Append dynamic AI question to history
          setConversationHistory(prev => [...prev, { role: 'interviewer', text: data.nextMessage, timestamp: new Date() }]);
          executeSpeechSynthesisOutput(data.nextMessage, selectedLanguage);
        }
      }
    } catch (err) {
      setProcessingPipeline(false);
      console.error("Payload computation step array error mapping:", err);
      if (!keyboardMode) activateMicrophoneSpeechStream();
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
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
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
        
        {/* LEFT COLUMN: AI INTERVIEW PANEL */}
        <div className={`p-8 rounded-2xl border transition-all flex flex-col justify-between shadow-2xl ${botSpeakingState ? 'bg-slate-900 border-blue-500/50 shadow-blue-900/10' : 'bg-slate-900/40 border-slate-800'}`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-6 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${botSpeakingState ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-[10px] font-black font-mono tracking-widest text-slate-400 uppercase">AI INTERVIEWER CHANNEL</span>
              </div>
              
              {/* Language Switcher Selector */}
              <div className="flex items-center gap-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">LANG:</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    const nextLang = e.target.value;
                    setSelectedLanguage(nextLang);
                    addProctorLog(`Changed interviewer language target: ${nextLang}`);
                    window.speechSynthesis?.cancel();
                    setBotSpeakingState(false);
                    setTimeout(() => {
                      if (recognitionRef.current) {
                        try { recognitionRef.current.stop(); } catch(e) {}
                      }
                      if (!keyboardMode) {
                        activateMicrophoneSpeechStream();
                      }
                    }, 200);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] font-bold text-blue-400 focus:outline-none cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <option value="English">English (US)</option>
                  <option value="Hinglish">Hinglish (Hindi + English)</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                </select>
              </div>
            </div>
            
            <p className="text-xl md:text-2xl font-medium leading-relaxed text-slate-100 min-h-[140px]">
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

        {/* RIGHT COLUMN: CANDIDATE VIDEO FEED & SPEECH CONTROLLER */}
        <div className={`p-4 bg-slate-900 border rounded-2xl flex flex-col justify-between shadow-2xl ${isListening ? 'border-emerald-500/40' : 'border-slate-800'}`}>
          <div className="w-full aspect-video md:flex-1 bg-slate-950 rounded-xl overflow-hidden border border-slate-950 relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            
            {/* Ambient scanning indicators */}
            <div className="absolute top-3 left-3 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded text-[9px] font-bold text-slate-400 font-mono flex items-center gap-1.5 backdrop-blur-sm">
              <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'}`} />
              PROCTOR_STATUS: ACTIVE
            </div>

            {!faceDetected && (
              <div className="absolute inset-0 bg-red-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 animate-pulse z-20">
                <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg mb-2 shadow-lg shadow-red-900 animate-bounce">⚠️</span>
                <p className="text-xs font-mono font-black text-red-400 tracking-wider uppercase mb-1">Face Not Detected</p>
                <p className="text-[10px] text-slate-300 max-w-[200px] leading-relaxed">Face is not being detected. Please look directly at the screen to continue.</p>
              </div>
            )}
          </div>
          
          {/* Dual Input modes: Speech Recognition vs Fallback Text keyboard */}
          {keyboardMode ? (
            <div className="mt-4 p-4 bg-slate-950 border border-emerald-500/30 rounded-xl flex flex-col gap-2.5 shadow-lg">
              <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
                  ⌨️ Keyboard Response Mode Active
                </span>
                <button 
                  onClick={() => {
                    setKeyboardMode(false);
                    setTypedAnswer('');
                    setTimeout(() => activateMicrophoneSpeechStream(), 100);
                  }} 
                  className="text-[9px] bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 px-2 py-0.5 rounded uppercase font-bold hover:text-white transition-colors"
                >
                  Switch to Speech
                </button>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (typedAnswer.trim() && !processingPipeline) {
                    dispatchAudioPayloadToBackend(typedAnswer);
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  placeholder="Type your answer and press Enter..."
                  disabled={processingPipeline}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-sans transition-colors"
                />
                <button
                  type="submit"
                  disabled={processingPipeline || !typedAnswer.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  Send
                </button>
              </form>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-slate-950 border border-slate-800/80 rounded-xl min-h-[72px] flex items-center justify-between gap-4">
              <div className="flex-1">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block mb-1 font-mono">
                  {isListening ? '🎙️ Capture Stream Active (Speak Now):' : '🔒 System Muted (Interviewer Speaking)'}
                </span>
                <p className="text-xs text-slate-300 italic font-medium leading-relaxed transition-all">
                  {liveSpeechBuffer || (processingPipeline ? "Awaiting calculation cycle loops..." : "Silence detection initialized. Please speak...")}
                </p>
              </div>
              <button 
                onClick={() => {
                  setKeyboardMode(true);
                  if (recognitionRef.current) {
                    try { recognitionRef.current.stop(); } catch(e) {}
                  }
                  clearAllTimers();
                }}
                className="text-[9px] bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 px-3 py-2 rounded uppercase font-bold hover:text-white shrink-0 transition-colors"
              >
                Type Answer
              </button>
            </div>
          )}
        </div>

      </div>

      {/* TRANSCRIPT TIMELINE LOGS */}
      {conversationHistory.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 mb-4 flex flex-col gap-2 max-h-[140px] overflow-y-auto shadow-inner">
          <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase font-mono border-b border-slate-800/60 pb-1.5">Interview Dialogue Transcript Log</span>
          <div className="flex flex-col gap-2">
            {conversationHistory.map((item, index) => {
              const isAi = item.role === 'interviewer';
              return (
                <div key={index} className="flex items-start gap-2.5 text-xs animate-[fade-in_0.2s_ease-out]">
                  <span className={`font-mono text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${isAi ? 'bg-blue-950/80 text-blue-400 border border-blue-900/40' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/40'}`}>
                    {isAi ? 'AI' : 'YOU'}
                  </span>
                  <div className="flex-1 text-slate-300 font-sans leading-relaxed pt-0.5">
                    {item.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center text-xs text-slate-400 font-mono">
        <p>Telemetry Node Key Stream Sequence: #{sessionId?.slice(-6).toUpperCase()}</p>
        <button onClick={cleanlyExitToMainDashboard} className="px-4 py-1.5 bg-slate-950 hover:bg-red-950/30 border border-slate-800 rounded text-red-400 font-bold transition-all tracking-wide">ABORT SESSION</button>
      </div>
    </div>
  );
};

export default AIProctoredInterview;