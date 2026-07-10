import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, Lock, Cpu, Clock, BookOpen, CheckCircle2, 
  XCircle, HelpCircle, Terminal, Sparkles, Volume2, VolumeX, Play, Pause, Monitor, SkipForward, SkipBack
} from 'lucide-react';
import NotesPage from '../../../Notes/NotesPage'; // 👈 NotesPage ko yahan direct import kar liya

export default function MainResourceCanvas({ 
  topicName, 
  activeTab, 
  setActiveTab, 
  videoSearchQuery, 
  materialNotes, 
  quiz, 
  assignment, 
  onComplete, 
  onLaunchQuiz, 
  onLaunchAssignment, 
  courseId, 
  moduleId, 
  activeQuizResult,
  activeAssignmentResult 
}) {

  // --- POPUP OVERLAY STATE ---
  const [isNotesPopupOpen, setIsNotesPopupOpen] = useState(false); // 👈 Local Popup State Control

  // --- AI ANIMATED TEACHER NATURAL SPEECH STATES ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [phrases, setPhrases] = useState([]);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [avatarExpression, setAvatarExpression] = useState('idle'); 
  
  const currentUtteranceRef = useRef(null);
  const pauseTimeoutRef = useRef(null);

  // Extract text from HTML structure cleanly and slice it by natural breaks
  useEffect(() => {
    if (!materialNotes?.htmlContent) {
      setPhrases(["Initializing course telemetry board..."]);
      return;
    }
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = materialNotes.htmlContent;
    const rawText = tempDiv.innerText || tempDiv.textContent || "";
    
    const cleanPhrases = rawText
      .split(/[.!?;\n]+/)
      .map(p => p.trim())
      .filter(p => p.length > 2);

    setPhrases(cleanPhrases);
    setCurrentPhraseIndex(0);
  }, [materialNotes]);

  // Core natural speech generator function
  const playPhraseAtIndex = (index) => {
    window.speechSynthesis.cancel();
    clearTimeout(pauseTimeoutRef.current);

    if (index < 0 || index >= phrases.length) {
      setIsPlaying(false);
      setAvatarExpression('idle');
      return;
    }

    setCurrentPhraseIndex(index);
    const phraseText = phrases[index];

    const utterance = new SpeechSynthesisUtterance(phraseText);
    currentUtteranceRef.current = utterance;

    const voices = window.speechSynthesis.getVoices();
    const clearIndianEnglishVoice = voices.find(v => v.lang.includes('en-IN')) || 
                                   voices.find(v => v.lang.includes('en-GB')) || 
                                   voices.find(v => v.lang.includes('en-US'));

    if (clearIndianEnglishVoice) {
      utterance.voice = clearIndianEnglishVoice;
    }
    
    utterance.rate = 0.92; 
    utterance.pitch = 0.98; 
    utterance.volume = isMuted ? 0 : 1;

    utterance.onstart = () => {
      setIsPlaying(true);
      setAvatarExpression(index % 2 === 0 ? 'talking' : 'explaining');
    };

    utterance.onend = () => {
      setAvatarExpression('idle');
      pauseTimeoutRef.current = setTimeout(() => {
        const nextIndex = index + 1;
        if (nextIndex < phrases.length) {
          playPhraseAtIndex(nextIndex);
        } else {
          setIsPlaying(false);
        }
      }, 600); 
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setAvatarExpression('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  const togglePlaybackPlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setAvatarExpression('idle');
      clearTimeout(pauseTimeoutRef.current);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        setAvatarExpression('talking');
      } else {
        playPhraseAtIndex(currentPhraseIndex);
      }
    }
  };

  const handleSkipForward = () => {
    const nextIdx = Math.min(currentPhraseIndex + 1, phrases.length - 1);
    playPhraseAtIndex(nextIdx);
  };

  const handleSkipBackward = () => {
    const prevIdx = Math.max(currentPhraseIndex - 1, 0);
    playPhraseAtIndex(prevIdx);
  };

  const handleProgressBarScrub = (e) => {
    const targetedIdx = parseInt(e.target.value, 10);
    playPhraseAtIndex(targetedIdx);
  };

  useEffect(() => {
    window.speechSynthesis.cancel();
    clearTimeout(pauseTimeoutRef.current);
    setIsPlaying(false);
    setAvatarExpression('idle');
    return () => {
      window.speechSynthesis.cancel();
      clearTimeout(pauseTimeoutRef.current);
    };
  }, [topicName]);

  const totalQuestions = activeQuizResult?.total || 10;
  const correctAnswers = activeQuizResult?.correct || 0;
  const wrongAnswers = totalQuestions - correctAnswers;
  const accuracyPercentage = activeQuizResult?.percentage || 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#02040a', padding: '2rem', overflowY: 'auto', color: '#fff', fontFamily: '"Inter", sans-serif', position: 'relative' }}>
      
      {/* 🚀 Dynamic Navigation Tabs Navbar Header Element */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setActiveTab('video')} style={{ background: activeTab === 'video' ? 'rgba(6,182,212,0.05)' : 'transparent', border: 'none', color: activeTab === 'video' ? '#06b6d4' : '#64748b', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}>
            By-Topic Smart Lecture Masterclass
          </button>
          <button onClick={() => setActiveTab('quiz')} style={{ background: activeTab === 'quiz' ? 'rgba(245,158,11,0.05)' : 'transparent', border: 'none', color: activeTab === 'quiz' ? '#f59e0b' : '#64748b', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}>
            ⚡ Quiz Evaluation
          </button>
          {assignment && assignment.assignmentObjective && assignment.assignmentObjective.trim() !== "" && assignment.assignmentObjective !== "Implement concepts learned today." && (
            <button onClick={() => setActiveTab('assignment')} style={{ background: activeTab === 'assignment' ? 'rgba(16,185,129,0.05)' : 'transparent', border: 'none', color: activeTab === 'assignment' ? '#10b981' : '#64748b', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}>
              🛠️ Assignment Challenge
            </button>
          )}
        </div>

        {/* 📚 NEW POPUP TRIGGER: Is button par click karte hi popup open ho jayega */}
        <button 
          onClick={() => setIsNotesPopupOpen(true)} 
          style={{ 
            background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.4)', 
            color: '#06b6d4', padding: '0.5rem 1.2rem', cursor: 'pointer', 
            fontWeight: 'bold', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'all 200ms ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#06b6d4'; e.currentTarget.style.color = '#000'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(6,182,212,0.1)'; e.currentTarget.style.color = '#06b6d4'; }}
        >
          <BookOpen size={16} /> Open Workspace Notes
        </button>
      </div>

      {/* Main Control Console Canvas Board */}
      <div style={{ flex: 1, background: '#070a12', border: '1px solid rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '1rem' }}>
        
        {/* 📺 TAB 1: SMART MASTERCLASS LECTURES */}
        {activeTab === 'video' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Active Workspace Concept Node: {topicName}
              </h2>
            </div>
            
            {/* 🤖 NATURAL PROCTOR CLASSROOM INTERFACE MONITOR PANEL */}
            <div style={{ height: '380px', background: 'linear-gradient(180deg, #090d16 0%, #030509 100%)', border: '1px solid #1e293b', borderRadius: '12px', display: 'flex', overflow: 'hidden', position: 'relative' }}>
              
              {/* Left Column: Avatar Graphic Box */}
              <div style={{ width: '30%', borderRight: '1px solid rgba(30, 41, 59, 0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#040710', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '10px', left: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', background: isPlaying ? '#10b981' : '#64748b', borderRadius: '50%', display: 'inline-block', animation: isPlaying ? 'pulse 1.5s infinite' : 'none' }} />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>{isPlaying ? 'LECTURING' : 'PAUSED'}</span>
                </div>

                <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)', border: isPlaying ? '3px solid #06b6d4' : '3px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', transform: avatarExpression !== 'idle' ? 'scale(1.04)' : 'scale(1)', transition: 'all 0.3s ease' }}>
                  <div style={{ width: '40px', height: '15px', border: '2px solid rgba(6, 182, 212, 0.4)', borderRadius: '4px', position: 'absolute', top: '35px', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: '14px', height: '10px', background: isPlaying ? 'rgba(6,182,212,0.2)' : 'transparent' }} />
                    <div style={{ width: '14px', height: '10px', background: isPlaying ? 'rgba(6,182,212,0.2)' : 'transparent' }} />
                  </div>
                  <div style={{ 
                    width: avatarExpression === 'idle' ? '24px' : '30px', 
                    height: avatarExpression === 'idle' ? '4px' : avatarExpression === 'talking' ? '18px' : '10px', 
                    background: '#e11d48', 
                    borderRadius: '50%/40%', 
                    position: 'absolute', 
                    top: '65px', 
                    animation: isPlaying ? 'lipSyncAction 0.22s infinite alternate ease-in-out' : 'none'
                  }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 40%, rgba(2,4,10,0.4) 100%)' }} />
                </div>

                <div style={{ marginTop: '1rem', fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>Professor Lumina AI</div>
                <div style={{ fontSize: '0.7rem', color: '#06b6d4', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Technical Workspace Instructor</div>
              </div>

              {/* Right Column: Audio Blackboard Timeline Controller Display */}
              <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#020408' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.75rem', borderBottom: '1px solid rgba(30,41,59,0.4)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Monitor size={14}/> <span>AI ACTIVE BROADCAST MONITOR</span></div>
                  <div>Sentence Matrix: {currentPhraseIndex + 1} / {phrases.length}</div>
                </div>
                
                {/* Active Sentence Visual Highlight Panel Box */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                  <p style={{ fontSize: '1.25rem', color: isPlaying ? '#f8fafc' : '#94a3b8', textAlign: 'center', fontWeight: '500', lineHeight: '1.6' }}>
                    "{phrases[currentPhraseIndex] || 'Loading classroom script data structures...'}"
                  </p>
                </div>

                {/* 🎚️ RELIABLE SEEK PROGRESS CONTROL TIMELINE BAR */}
                <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input 
                    type="range" 
                    min="0" 
                    max={phrases.length > 0 ? phrases.length - 1 : 0} 
                    value={currentPhraseIndex} 
                    onChange={handleProgressBarScrub}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#06b6d4', background: '#1e293b', height: '6px', borderRadius: '4px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#475569', fontWeight: 'bold' }}>
                    <span>BACKWARD SEEK</span>
                    <span>DRAG TIMELINE KNOB TO REPEAT ANY SPECIFIC SECTION</span>
                    <span>FORWARD SEEK</span>
                  </div>
                </div>

                {/* Deck Interactive Control Array Panel row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#070a12', padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={handleSkipBackward} title="Peeche Jayein" style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                      <SkipBack size={18}/>
                    </button>
                    
                    <button onClick={togglePlaybackPlayPause} style={{ background: '#06b6d4', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#000' }}>
                      {isPlaying ? <Pause size={16} fill="#000"/> : <Play size={16} fill="#000" style={{ marginLeft: '2px' }}/>}
                    </button>

                    <button onClick={handleSkipForward} title="Aage Jayein" style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                      <SkipForward size={18}/>
                    </button>

                    <button onClick={() => setIsMuted(!isMuted)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', marginLeft: '0.5rem' }}>
                      {isMuted ? <VolumeX size={20} style={{ color: '#ef4444' }}/> : <Volume2 size={20} style={{ color: '#06b6d4' }}/>}
                    </button>
                  </div>
                  
                  {/* Visualizer audio graphics wave decibels line nodes arrays */}
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '20px' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(bar => (
                      <div key={bar} style={{ 
                        width: '3px', 
                        background: isPlaying ? '#06b6d4' : '#1e293b', 
                        borderRadius: '10px',
                        height: isPlaying ? '100%' : '4px',
                        animation: isPlaying ? `waveformAudioDance 0.5s infinite alternate ease-in-out` : 'none',
                        animationDelay: `${bar * 0.06}s`
                      }} />
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Reading Board Scripts Display Canvas */}
            {materialNotes?.htmlContent ? (
              <div style={{ background: '#04060a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #1e293b', position: 'relative' }}>
                <div style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={14}/> <span>Sync Reading Script Blueprint Notes</span>
                </div>
                <div 
                  className="dynamic-rich-article" 
                  style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.75', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} 
                  dangerouslySetInnerHTML={{ __html: materialNotes.htmlContent }} 
                />
              </div>
            ) : (
              <div style={{ color: '#475569', textAlign: 'center', padding: '4rem', border: '1px dashed #1e293b', borderRadius: '8px' }}>
                {"\uD83D\uDCC4"} Compiling raw concept blueprints logs from server mesh...
              </div>
            )}

            {/* 📚 DYNAMIC VIDEO & DOCUMENTATION REFERENCES PANEL */}
            {materialNotes && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                
                {/* Video References Column */}
                <div style={{ background: '#04060a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Play size={14}/> <span>Video Lectures & Masterclasses</span>
                  </div>
                  
                  {materialNotes.videoReferences && materialNotes.videoReferences.length > 0 ? (
                    materialNotes.videoReferences.map((video, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: idx < materialNotes.videoReferences.length - 1 ? '1px solid rgba(30, 41, 59, 0.5)' : 'none', paddingBottom: idx < materialNotes.videoReferences.length - 1 ? '1rem' : '0' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff' }}>{video.title}</div>
                        
                        {/* Video Embed Player */}
                        {video.embedUrl && (
                          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', borderRadius: '6px', border: '1px solid #1e293b', marginTop: '0.25rem' }}>
                            <iframe 
                              src={video.embedUrl} 
                              title={video.title} 
                              frameBorder="0" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                              allowFullScreen 
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            ></iframe>
                          </div>
                        )}
                        
                        <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none', marginTop: '0.25rem' }}>
                          Open Video on YouTube &rarr;
                        </a>
                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff' }}>Topic Demonstration</div>
                      
                      {/* Fallback Single Video embed */}
                      {materialNotes.videoLink && (materialNotes.videoLink.includes('youtube.com/embed') || materialNotes.videoLink.includes('youtube.com/watch') || materialNotes.videoLink.includes('youtu.be')) ? (
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', borderRadius: '6px', border: '1px solid #1e293b' }}>
                          <iframe 
                            src={materialNotes.videoLink.replace('watch?v=', 'embed/').split('&')[0]} 
                            title="YouTube Player" 
                            frameBorder="0" 
                            allowFullScreen 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                          ></iframe>
                        </div>
                      ) : (
                        <a href={materialNotes.videoLink || "https://www.youtube.com"} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none' }}>
                          Open Search Resources on YouTube &rarr;
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Documentation References Column */}
                <div style={{ background: '#04060a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={14}/> <span>Documentation & GeeksforGeeks Links</span>
                  </div>

                  {materialNotes.docReferences && materialNotes.docReferences.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {materialNotes.docReferences.map((doc, idx) => (
                        <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: '1px solid #1e293b', padding: '0.75rem 1rem', borderRadius: '8px', color: '#cbd5e1', textDecoration: 'none', transition: 'all 0.2s' }}
                           onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.background = 'rgba(139, 92, 246, 0.03)'; }}
                           onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{doc.title}</span>
                          <span style={{ fontSize: '0.75rem', color: '#8b5cf6' }}>Read Reference &rarr;</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#475569', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>
                      No additional reading links specified for this topic node.
                    </div>
                  )}
                </div>

              </div>
            )}

            <button onClick={onComplete} style={{ alignSelf: 'flex-end', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
              Mark Concept Finished
            </button>
          </div>
        )}

        {/* ⚡ TAB 2: SECURE SYSTEM QUIZ METRICS EVALUATOR */}
        {activeTab === 'quiz' && (
          <div style={{ maxWidth: '700px' }}>
            <h3 style={{ color: '#f59e0b', fontSize: '1.3rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
              ⚡ Module Quiz Evaluation: {quiz?.name || "Topic Verification Quiz"}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.25rem' }}>
              This dynamic quiz bounds test constraints mapped explicitly for your verified workspace modules.
            </p>

            <div style={{ background: '#020617', border: activeQuizResult ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid #1e293b', padding: '2rem', borderRadius: '12px', marginTop: '1.5rem', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              {activeQuizResult && (
                <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: '#f87171', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase' }}>
                  <Lock size={12}/> COMPLETED & LOCKED
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', background: '#070a12', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}><strong>📚 Core Scope Focus:</strong> <span style={{ color: '#06b6d4' }}>{quiz?.quizTopic || "Universal Module Concepts"}</span></div>
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}><strong>⏳ Expected Speed Cap:</strong> <span>{quiz?.duration || "10 Minutes standard allotment"}</span></div>
              </div>

              <button 
                onClick={onLaunchQuiz} 
                disabled={!!activeQuizResult} 
                style={{ 
                  background: activeQuizResult ? 'rgba(255,255,255,0.02)' : 'linear-gradient(135deg, #f59e0b, #d97706)', 
                  color: activeQuizResult ? '#475569' : '#000', 
                  border: activeQuizResult ? '1px solid #1e293b' : 'none',
                  padding: '0.8rem 1.75rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.9rem',
                  cursor: activeQuizResult ? 'not-allowed' : 'pointer', transition: 'all 200ms ease'
                }}
              >
                {activeQuizResult ? "Assessment Token Cleared" : "Proceed To Take Quiz Terminal"}
              </button>
              
              {activeQuizResult && (
                <div style={{ marginTop: '2.5rem', borderTop: '1px solid #1e293b', paddingTop: '2rem' }}>
                  <div style={{ color: '#06b6d4', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
                    <BarChart3 size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'text-bottom' }}/> Secure Verification Performance Output
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#070a12', padding: '1.25rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700' }}>ACCURACY RATIO</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '800', color: accuracyPercentage >= 70 ? '#10b981' : '#f59e0b', marginTop: '0.25rem', fontFamily: 'monospace' }}>{accuracyPercentage.toFixed(0)}%</div>
                    </div>
                    <div style={{ background: '#070a12', padding: '1.25rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700' }}>TOTAL MATRIX ITEMS</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#06b6d4', marginTop: '0.25rem', fontFamily: 'monospace' }}>{totalQuestions}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: '#070a12', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700' }}>CORRECT / VALID</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', marginTop: '0.25rem', fontFamily: 'monospace' }}>{correctAnswers}</div>
                    </div>
                    <div style={{ background: '#070a12', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: '700' }}>WRONG / FLAWED</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ef4444', marginTop: '0.25rem', fontFamily: 'monospace' }}>{wrongAnswers}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🛠️ TAB 3: AI-CRITIC INTEGRATED LABORATORY SANDBOX PANELS */}
        {activeTab === 'assignment' && (
          <div style={{ maxWidth: '750px' }}>
            <h3 style={{ color: '#10b981', fontSize: '1.3rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
              🛠️ Laboratory Assignment Challenge
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: '1.4' }}>
              Automated AI static compilation models will critique code structure metrics and design patterns live via proctor streams.
            </p>

            <div style={{ background: '#020617', border: activeAssignmentResult ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid #1e293b', padding: '2.5rem 2rem', borderRadius: '12px', marginTop: '1.5rem', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
              {activeAssignmentResult && (
                <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: '#10b981', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase' }}>
                  <Lock size={12}/> EVALUATED & LOCKED
                </div>
              )}
              
              <div style={{ background: '#070a12', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.01)', marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  <strong style={{ color: '#fff', display: 'block', marginBottom: '0.4rem', fontSize: '0.95rem' }}>🎯 Goal Instruction Objective:</strong> 
                  {assignment?.assignmentObjective || "Design an automated isolation architecture schema mapping local thread hooks loops constraints."}
                </div>
              </div>

              <button 
                onClick={onLaunchAssignment}
                disabled={!!activeAssignmentResult}
                style={{ 
                  background: activeAssignmentResult ? 'rgba(255,255,255,0.02)' : 'linear-gradient(135deg, #10b981, #059669)', 
                  color: activeAssignmentResult ? '#475569' : '#fff', 
                  border: activeAssignmentResult ? '1px solid #1e293b' : 'none',
                  padding: '0.8rem 1.75rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.88rem',
                  cursor: activeAssignmentResult ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: activeAssignmentResult ? 'none' : '0 8px 16px rgba(16, 185, 129, 0.15)'
                }}
              >
                <Terminal size={16}/> {activeAssignmentResult ? "Sandbox Vault Closed" : "Proceed To Take Assignment Terminal"}
              </button>

              {activeAssignmentResult && (
                <div style={{ marginTop: '2.5rem', borderTop: '1px solid #1e293b', paddingTop: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ color: '#06b6d4', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Sparkles size={14} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'text-bottom' }}/> Verified Engine Metrics Output
                    </div>
                    <div style={{ background: '#070a12', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #1e293b', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                      RATING: <span style={{ color: '#10b981', fontWeight: '800' }}>{activeAssignmentResult.approachScore} / 100</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.88rem', color: '#cbd5e1' }}>
                    <div style={{ background: '#070a12', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.01)', lineHeight: '1.5' }}>
                      <strong style={{ color: '#8b5cf6', display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>📊 Complexity Parameters Analysis:</strong>
                      {activeAssignmentResult.complexityAnalysis}
                    </div>
                    
                    <div style={{ background: '#070a12', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.01)', lineHeight: '1.5' }}>
                      <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>💡 Architectural Critique Node:</strong>
                      {activeAssignmentResult.architecturalCritique}
                    </div>
                    
                    <div style={{ background: '#02040a', padding: '1.25rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                      <strong style={{ color: '#34d399', display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>Refactored Ideal Template Alternative:</strong>
                      <pre style={{ color: '#a7f3d0', fontFamily: '"Fira Code", monospace', fontSize: '0.85rem', marginTop: '0.5rem', overflowX: 'auto', lineHeight: '1.5', background: '#070a12', padding: '1rem', borderRadius: '6px' }}>
                        {activeAssignmentResult.betterAlternativeTemplate}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* 🌌 MODAL POPUP PORTAL SYSTEM LINK */}
      {isNotesPopupOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(2, 4, 10, 0.85)', backdropFilter: 'blur(12px)',
          width: '100vw', height: '100vh'
        }}>
          <NotesPage 
            isModal={true} 
            onClose={() => setIsNotesPopupOpen(false)} // Close click handle loop
            activeCourseContext={{
              courseId: courseId,
              moduleId: moduleId
            }}
          />
        </div>
      )}
      
      {/* 🚀 CSS ANIMATIONS OVERLAYS */}
      <style>{`
        @keyframes lipSyncAction {
          0% { height: 4px; border-radius: 50%/10%; }
          100% { height: 18px; border-radius: 50%/40%; }
        }
        @keyframes waveformAudioDance {
          0% { transform: scaleY(0.2); }
          100% { transform: scaleY(1.3); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.08); }
        }
      `}</style>

    </div>
  );
}