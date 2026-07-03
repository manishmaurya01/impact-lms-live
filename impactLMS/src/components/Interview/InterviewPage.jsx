import React, { useState, useEffect, useRef } from 'react';
import { MessageSquareCode, Play, Square, Bot, User, RefreshCw, ArrowRight } from 'lucide-react';

export default function InterviewPage() {
  // --- 1. DATABASE STATE (Courses & Modules) ---
  const [coursesData, setCoursesData] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- 2. INTERVIEW ENGINE STATE ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [chatLog, setChatLog] = useState([]); 
  
  // Camera WebRTC References
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // डेटाबेस से कोर्सेस और मॉड्यूल्स लोड करने का सिमुलेशन
  useEffect(() => {
    setTimeout(() => {
      setCoursesData([
        {
          id: 'react-101',
          title: 'React Core Architecture',
          modules: ['Virtual DOM & Reconciliation', 'Hooks (useState, useEffect)', 'State Management', 'Performance Optimization']
        },
        {
          id: 'node-backend',
          title: 'Backend Engineering with Node',
          modules: ['Event Loop & Asynchronous JS', 'REST API Design', 'Database Indexing & SQL', 'Authentication & JWT']
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // यूजर का लाइव कैमरा और माइक्रोफोन स्टार्ट करने का फंक्शन
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("AI इंटरव्यू के लिए कैमरा और माइक्रोफ़ोन की अनुमति (Permission) देना आवश्यक है।");
    }
  };

  // कैमरा स्टॉप करने का फंक्शन
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // मॉड्यूल्स को सेलेक्ट/अनसेलेक्ट करने का हैंडलर
  const handleModuleToggle = (moduleName) => {
    if (selectedModules.includes(moduleName)) {
      setSelectedModules(selectedModules.filter(m => m !== moduleName));
    } else {
      setSelectedModules([...selectedModules, moduleName]);
    }
  };

  // इंटरव्यू सेशन शुरू करने का लॉजिक
  const startInterviewSession = async () => {
    if (selectedModules.length === 0) {
      return alert("कृपया इंटरव्यू शुरू करने के लिए कम से कम 1 मॉड्यूल ज़रूर चुनें!");
    }
    
    const questionsPool = {
      'Virtual DOM & Reconciliation': [
        "What is the difference between Shadow DOM and Virtual DOM?", 
        "How does React's diffing algorithm work during reconciliation?"
      ],
      'Hooks (useState, useEffect)': [
        "Why can't we call React hooks inside loops or nested functions?", 
        "How do you mimic componentWillUnmount using the useEffect hook?"
      ],
      'State Management': [
        "When should you prefer Context API over Redux or Zustand?", 
        "What is prop drilling, and how do modern libraries solve it?"
      ],
      'Event Loop & Asynchronous JS': [
        "Explain the role of Microtask queue vs Macrotask queue in Node.js.", 
        "What is the operational difference between setImmediate() and setTimeout()?"
      ],
      'REST API Design': [
        "What makes an API truly RESTful, and what do you mean by Idempotency?", 
        "Which HTTP status codes are best suited for validation errors vs server crashes?"
      ]
    };

    let questions = [];
    selectedModules.forEach(mod => {
      if (questionsPool[mod]) {
        questions = [...questions, ...questionsPool[mod]];
      }
    });

    if (questions.length === 0) {
      questions = ["Can you introduce yourself and tell me about your technical stack?"];
    }

    setGeneratedQuestions(questions);
    setCurrentQuestionIndex(0);
    setIsInterviewActive(true);
    
    setChatLog([{ sender: 'ai', text: questions[0] }]);
    
    setTimeout(async () => {
      await startCamera();
    }, 500);
  };

  // अगले सवाल पर जाने का लॉजिक
  const handleNextQuestion = () => {
    if (!userAnswer.trim()) return alert("कृपया अपना जवाब सबमिट करने के लिए कुछ टाइप करें!");

    const updatedLog = [...chatLog, { sender: 'user', text: userAnswer }];
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < generatedQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      setUserAnswer('');
      setChatLog([...updatedLog, { sender: 'ai', text: generatedQuestions[nextIndex] }]);
    } else {
      setChatLog([...updatedLog, { sender: 'ai', text: "Thank you Manish! Your interview is complete. Analyzing your skills matrix..." }]);
      setCurrentQuestionIndex(nextIndex);
      setUserAnswer('');
      stopCamera();
    }
  };

  if (loading) {
    return (
      <div style={{ color: '#fff', backgroundColor: '#020617', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', fontFamily: 'system-ui' }}>
        <RefreshCw size={32} style={{ color: '#06B6D4' }} />
        <p style={{ color: '#94a3b8' }}>Loading Modules & Database Tracks...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#020617', minHeight: '100vh', color: '#f8fafc', padding: '2.5rem', fontFamily: 'system-ui, sans-serif', width: '100%', boxSizing: 'border-box' }}>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes avatarPulse {
          0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); transform: scale(1); }
          100% { box-shadow: 0 0 30px 10px rgba(139, 92, 246, 0.2); transform: scale(1.03); }
        }
        .ai-avatar-animated {
          animation: avatarPulse 2s infinite alternate ease-in-out;
        }
      `}</style>

      {/* ─── SCENARIO ROUTER ─── */}
      {!isInterviewActive ? (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid rgba(30, 41, 59, 0.5)', paddingBottom: '1.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MessageSquareCode size={32} style={{ color: '#06B6D4' }} /> Custom AI Interview Panel
            </h1>
            <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0', fontSize: '1rem' }}>
              अपने कोर्सेस के विशिष्ट मॉड्यूल्स चुनें। AI केवल इन्हीं चुने हुए टॉपिक्स में से आपसे रियल-टाइम सवाल पूछेगा।
            </p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2.5rem' }}>
            {coursesData.map((course) => (
              <div key={course.id} style={{ background: '#0f172a', border: '1px solid rgba(30, 41, 59, 0.8)', borderRadius: '1rem', padding: '1.75rem' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', color: '#06B6D4', fontSize: '1.3rem', fontWeight: 700 }}>{course.title}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {course.modules.map((mod, i) => {
                    const isChecked = selectedModules.includes(mod);
                    return (
                      <div 
                        key={i} 
                        onClick={() => handleModuleToggle(mod)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.85rem', 
                          padding: '1rem', 
                          background: isChecked ? 'rgba(6, 182, 212, 0.04)' : '#020617', 
                          border: isChecked ? '2px solid #06B6D4' : '1px solid rgba(30, 41, 59, 0.6)', 
                          borderRadius: '0.75rem', 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isChecked ? (
                          <span style={{ color: '#06B6D4', fontWeight: 'bold', fontSize: '1.2rem', lineHeight: 1 }}>✓</span>
                        ) : (
                          <Square size={20} style={{ color: '#64748b' }} />
                        )}
                        <span style={{ fontSize: '0.95rem', fontWeight: 500, color: isChecked ? '#fff' : '#cbd5e1' }}>{mod}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={startInterviewSession}
            style={{ 
              width: '100%', 
              padding: '1.15rem', 
              border: 'none', 
              borderRadius: '0.75rem', 
              background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)', 
              color: '#fff', 
              fontSize: '1.1rem', 
              fontWeight: 700, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              boxShadow: '0 4px 20px rgba(6, 182, 212, 0.25)'
            }}
          >
            <Play size={18} fill="#fff" /> Start Live AI Video Interview
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(30, 41, 59, 0.5)', paddingBottom: '1rem' }}>
            <div>
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '0.375rem', letterSpacing: '0.05em' }}>LIVE ROOM</span>
              <h2 style={{ margin: '0.35rem 0 0 0', fontSize: '1.6rem', fontWeight: 800 }}>AI Technical Screening</h2>
            </div>
            <button 
              onClick={() => { stopCamera(); setIsInterviewActive(false); }}
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Terminate Interview
            </button>
          </header>

          {/* SPLIT SCREEN VIDEO FEEDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            
            {/* LEFT: AI INTERVIEWER */}
            <div style={{ background: '#0f172a', borderRadius: '1rem', border: '1px solid rgba(30, 41, 59, 0.8)', height: '380px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', background: 'rgba(2, 6, 23, 0.8)', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Bot size={16} style={{ color: '#06B6D4' }} /> AI Interviewer Bot (Online)
              </div>
              
              <div className="ai-avatar-animated" style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={50} style={{ color: '#fff' }} />
              </div>
              <p style={{ marginTop: '1.75rem', color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
                {currentQuestionIndex < generatedQuestions.length ? "Analyzing facial metrics & listening..." : "Evaluation Complete"}
              </p>
            </div>

            {/* RIGHT: USER LIVE CAMERA */}
            <div style={{ background: '#000', borderRadius: '1rem', border: '2px solid #06B6D4', height: '380px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', background: 'rgba(2, 6, 23, 0.8)', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                <User size={16} style={{ color: '#8B5CF6' }} /> Manish Maurya (Candidate)
              </div>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
              />
            </div>
          </div>

          {/* INTERACTIVE CONVERSATION TERMINAL */}
          <div style={{ background: '#0f172a', border: '1px solid rgba(30, 41, 59, 0.8)', borderRadius: '1rem', padding: '1.75rem' }}>
            
            <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
              {chatLog.map((chat, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', background: chat.sender === 'ai' ? 'rgba(6, 182, 212, 0.04)' : 'rgba(139, 92, 246, 0.04)', padding: '1rem', borderRadius: '0.75rem', borderLeft: chat.sender === 'ai' ? '4px solid #06B6D4' : '4px solid #8B5CF6' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: chat.sender === 'ai' ? '#06B6D4' : '#8B5CF6', textTransform: 'uppercase' }}>
                    {chat.sender === 'ai' ? '🤖 AI Interviewer' : '👤 Your Response'}
                  </span>
                  <p style={{ margin: 0, fontSize: '1rem', color: '#e2e8f0', lineHeight: '1.5' }}>{chat.text}</p>
                </div>
              ))}
            </div>

            {currentQuestionIndex < generatedQuestions.length ? (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="अपना तकनीकी उत्तर यहाँ विस्तार से लिखें..."
                  style={{ flexGrow: 1, background: '#020617', border: '1px solid rgba(30, 41, 59, 0.8)', padding: '1rem', color: '#fff', borderRadius: '0.75rem', fontSize: '1rem', outline: 'none' }}
                  onKeyDown={(e) => { if(e.key === 'Enter') handleNextQuestion(); }}
                />
                <button
                  onClick={handleNextQuestion}
                  style={{ background: '#06B6D4', border: 'none', padding: '0 1.75rem', borderRadius: '0.75rem', color: '#020617', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Submit Answer <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <h4 style={{ color: '#10B981', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>🎉 Assessment Completed Successfully!</h4>
                <p style={{ color: '#94a3b8', margin: '0 0 1.25rem 0', fontSize: '0.95rem' }}>AI आपकी रिपोर्ट तैयार कर रहा है। आप डैशबोर्ड पर वापस जा सकते हैं।</p>
                <button onClick={() => setIsInterviewActive(false)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                  Configure Another Session
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}