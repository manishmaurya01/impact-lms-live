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
      setPhrases(["Loading lesson guide..."]);
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', padding: '2rem', overflowY: 'auto', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', position: 'relative' }}>
      
      {/* 🚀 Dynamic Navigation Tabs Navbar Header Element */}
      <div className="canvas-tabs-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="canvas-tabs-buttons-row" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('video')} style={{ background: activeTab === 'video' ? 'rgba(var(--accent-primary-rgb), 0.08)' : 'transparent', border: 'none', color: activeTab === 'video' ? 'var(--accent-primary)' : 'var(--text-muted)', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px', fontSize: '0.85rem' }}>
            Lesson Guide
          </button>
          <button onClick={() => setActiveTab('quiz')} style={{ background: activeTab === 'quiz' ? 'rgba(245,158,11,0.08)' : 'transparent', border: 'none', color: activeTab === 'quiz' ? 'var(--accent-warning)' : 'var(--text-muted)', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px', fontSize: '0.85rem' }}>
            ⚡ Quiz
          </button>
          {assignment && assignment.assignmentObjective && assignment.assignmentObjective.trim() !== "" && assignment.assignmentObjective !== "Implement concepts learned today." && (
            <button onClick={() => setActiveTab('assignment')} style={{ background: activeTab === 'assignment' ? 'rgba(16,185,129,0.08)' : 'transparent', border: 'none', color: activeTab === 'assignment' ? 'var(--accent-success)' : 'var(--text-muted)', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px', fontSize: '0.85rem' }}>
              🛠️ Assignment
            </button>
          )}
        </div>

        {/* Workspace Notes trigger */}
        <button 
          onClick={() => setIsNotesPopupOpen(true)} 
          style={{ 
            background: 'rgba(var(--accent-primary-rgb), 0.1)', border: '1px solid rgba(var(--accent-primary-rgb), 0.3)', 
            color: 'var(--accent-primary)', padding: '0.45rem 1rem', cursor: 'pointer', 
            fontWeight: 'bold', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'all 200ms ease', fontSize: '0.85rem'
          }}
        >
          <BookOpen size={14} /> My Workspace Notes
        </button>
      </div>

      {/* Main Control Console Canvas Board */}
      <div style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '2rem', borderRadius: '1rem' }}>
        
        {/* 📺 TAB 1: SMART MASTERCLASS LECTURES */}
        {activeTab === 'video' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Active Topic: {topicName}
              </h2>
            </div>
            
            {/* AI Classroom Panel */}
            <div className="ai-classroom-panel" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', overflow: 'hidden', position: 'relative' }}>

              {/* Left Column: Avatar Graphic Box */}
              <div className="ai-avatar-column" style={{ width: '30%', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(var(--accent-primary-rgb), 0.02)', position: 'relative', padding: '1.5rem 1rem', boxSizing: 'border-box' }}>
                <div style={{ position: 'absolute', top: '10px', left: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', background: isPlaying ? 'var(--accent-success)' : 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animation: isPlaying ? 'pulse 1.5s infinite' : 'none' }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>{isPlaying ? 'READING' : 'PAUSED'}</span>
                </div>

                <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(var(--accent-primary-rgb), 0.15) 100%)', border: isPlaying ? '2px solid var(--accent-primary)' : '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', transform: avatarExpression !== 'idle' ? 'scale(1.04)' : 'scale(1)', transition: 'all 0.3s ease' }}>
                  <div style={{ width: '30px', height: '12px', border: '2px solid rgba(var(--accent-primary-rgb), 0.4)', borderRadius: '4px', position: 'absolute', top: '28px', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: '10px', height: '8px', background: isPlaying ? 'rgba(var(--accent-primary-rgb), 0.2)' : 'transparent' }} />
                    <div style={{ width: '10px', height: '8px', background: isPlaying ? 'rgba(var(--accent-primary-rgb), 0.2)' : 'transparent' }} />
                  </div>
                  <div style={{ 
                    width: avatarExpression === 'idle' ? '20px' : '26px', 
                    height: avatarExpression === 'idle' ? '4px' : avatarExpression === 'talking' ? '14px' : '8px', 
                    background: '#e11d48', 
                    borderRadius: '50%/40%', 
                    position: 'absolute', 
                    top: '55px', 
                    animation: isPlaying ? 'lipSyncAction 0.22s infinite alternate ease-in-out' : 'none'
                  }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.1) 100%)' }} />
                </div>

                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>AI Voice Guide</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Explanation Reader</div>
              </div>

              {/* Right Column: Audio Blackboard Display */}
              <div className="ai-blackboard-column" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--bg-secondary)', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.7rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>AI VOICE READOUT</span></div>
                  <div>Sentence {currentPhraseIndex + 1} / {phrases.length}</div>
                </div>
                
                {/* Active Sentence Visual Highlight Panel Box */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 0.5rem' }}>
                  <p style={{ fontSize: '1.05rem', color: isPlaying ? 'var(--text-main)' : 'var(--text-muted)', textAlign: 'center', fontWeight: '500', lineHeight: '1.5', margin: 0 }}>
                    "{phrases[currentPhraseIndex] || 'Loading explanation text...'}"
                  </p>
                </div>

                <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input 
                    type="range" 
                    min="0" 
                    max={phrases.length > 0 ? phrases.length - 1 : 0} 
                    value={currentPhraseIndex} 
                    onChange={handleProgressBarScrub}
                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-primary)', background: 'var(--bg-surface)', height: '6px', borderRadius: '4px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    <span>BACK</span>
                    <span>DRAG SLIDER TO REPEAT SECTION</span>
                    <span>NEXT</span>
                  </div>
                </div>

                {/* Deck Interactive Control Array Panel row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={handleSkipBackward} title="Peeche Jayein" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <SkipBack size={18}/>
                    </button>
                    
                    <button onClick={togglePlaybackPlayPause} style={{ background: 'var(--accent-primary)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                      {isPlaying ? <Pause size={16} fill="#fff"/> : <Play size={16} fill="#fff" style={{ marginLeft: '2px' }}/>}
                    </button>

                    <button onClick={handleSkipForward} title="Aage Jayein" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <SkipForward size={18}/>
                    </button>

                    <button onClick={() => setIsMuted(!isMuted)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '0.5rem' }}>
                      {isMuted ? <VolumeX size={20} style={{ color: 'var(--accent-danger)' }}/> : <Volume2 size={20} style={{ color: 'var(--accent-primary)' }}/>}
                    </button>
                  </div>
                  
                  {/* Visualizer audio graphics wave decibels line nodes arrays */}
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '20px' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(bar => (
                      <div key={bar} style={{ 
                        width: '3px', 
                        background: isPlaying ? 'var(--accent-primary)' : 'var(--border-color)', 
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
              <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={14}/> <span>Lesson Notes</span>
                </div>
                <div 
                  className="dynamic-rich-article" 
                  style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '1rem', boxSizing: 'border-box', width: '100%', overflowX: 'auto' }} 
                  dangerouslySetInnerHTML={{ __html: materialNotes.htmlContent }} 
                />
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-color)', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                📖 Loading lesson content...
              </div>
            )}

            {/* DYNAMIC VIDEO & DOC */}
            {materialNotes && (
              <div className="canvas-video-doc-grid">
                
                {/* Video References Column */}
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Play size={14}/> <span>Video Lectures</span>
                  </div>
                  
                  {materialNotes.videoReferences && materialNotes.videoReferences.length > 0 ? (
                    materialNotes.videoReferences.map((video, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: idx < materialNotes.videoReferences.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: idx < materialNotes.videoReferences.length - 1 ? '1rem' : '0' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>{video.title}</div>
                        
                        {/* Video Embed Player */}
                        {video.embedUrl && (
                          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '0.25rem' }}>
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
                        
                        <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-secondary)', fontSize: '0.75rem', fontWeight: '600', textDecoration: 'none', marginTop: '0.25rem' }}>
                          Watch on YouTube &rarr;
                        </a>
                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>Topic Demonstration</div>
                      
                      {materialNotes.videoLink && (materialNotes.videoLink.includes('youtube.com/embed') || materialNotes.videoLink.includes('youtube.com/watch') || materialNotes.videoLink.includes('youtu.be')) ? (
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <iframe 
                            src={materialNotes.videoLink.replace('watch?v=', 'embed/').split('&')[0]} 
                            title="YouTube Player" 
                            frameBorder="0" 
                            allowFullScreen 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                          ></iframe>
                        </div>
                      ) : (
                        <a href={materialNotes.videoLink || "https://www.youtube.com"} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-secondary)', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none' }}>
                          Search on YouTube &rarr;
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Documentation References Column */}
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={14}/> <span>Useful Reading Links</span>
                  </div>

                  {materialNotes.docReferences && materialNotes.docReferences.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {materialNotes.docReferences.map((doc, idx) => (
                        <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none', transition: 'all 0.2s' }}
                           onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--bg-surface-hover)'; }}
                           onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{doc.title}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', flexShrink: 0 }}>Read &rarr;</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#475569', fontSize: '0.8rem', textAlign: 'center', padding: '1.5rem 0' }}>
                      No additional links.
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

        {/* TAB 2: QUIZ */}
        {activeTab === 'quiz' && (
          <div style={{ maxWidth: '700px', width: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ color: 'var(--accent-warning)', fontSize: '1.2rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
              ⚡ Topic Quiz: {quiz?.name || "Concept Check Quiz"}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Test your understanding of the concepts covered in this topic.
            </p>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', marginTop: '1.5rem', position: 'relative', boxShadow: 'var(--shadow-md)', boxSizing: 'border-box', width: '100%' }}>
              {activeQuizResult && (
                <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: 'var(--accent-danger)', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase' }}>
                  <Lock size={12}/> LOCKED
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', width: '100%' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}><strong>📚 Topic Area:</strong> <span style={{ color: 'var(--accent-primary)' }}>{quiz?.quizTopic || "Module Concepts"}</span></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}><strong>⏳ Standard Duration:</strong> <span>{quiz?.duration || "10 minutes"}</span></div>
              </div>

              <button 
                onClick={onLaunchQuiz} 
                disabled={!!activeQuizResult} 
                style={{ 
                  background: activeQuizResult ? 'var(--bg-surface)' : 'linear-gradient(135deg, var(--accent-warning), #d97706)', 
                  color: activeQuizResult ? 'var(--text-muted)' : '#ffffff', 
                  border: activeQuizResult ? '1px solid var(--border-color)' : 'none',
                  padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem',
                  cursor: activeQuizResult ? 'not-allowed' : 'pointer', transition: 'all 200ms ease'
                }}
              >
                {activeQuizResult ? "Completed" : "Start Quiz"}
              </button>
              
              {activeQuizResult && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <div style={{ color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                    <BarChart3 size={14} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'text-bottom' }}/> Result Details
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>ACCURACY</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: accuracyPercentage >= 70 ? 'var(--accent-success)' : 'var(--accent-warning)', marginTop: '0.15rem', fontFamily: 'monospace' }}>{accuracyPercentage.toFixed(0)}%</div>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL QUESTIONS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-primary)', marginTop: '0.15rem', fontFamily: 'monospace' }}>{totalQuestions}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--accent-success)', fontWeight: '700' }}>CORRECT ANSWERS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-success)', marginTop: '0.15rem', fontFamily: 'monospace' }}>{correctAnswers}</div>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--accent-danger)', fontWeight: '700' }}>INCORRECT ANSWERS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-danger)', marginTop: '0.15rem', fontFamily: 'monospace' }}>{wrongAnswers}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ASSIGNMENT */}
        {activeTab === 'assignment' && (
          <div style={{ maxWidth: '750px', width: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ color: 'var(--accent-success)', fontSize: '1.2rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
              🛠️ Assignment Challenge
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: '1.4' }}>
              Complete the assignment task and get AI-powered feedback.
            </p>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', marginTop: '1.5rem', position: 'relative', boxShadow: 'var(--shadow-md)', boxSizing: 'border-box', width: '100%' }}>
              {activeAssignmentResult && (
                <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: 'var(--accent-success)', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase' }}>
                  <Lock size={12}/> LOCKED
                </div>
              )}
              
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', boxSizing: 'border-box', width: '100%' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>🎯 Assignment Objective:</strong> 
                  {assignment?.assignmentObjective || "Complete the practice exercise."}
                </div>
              </div>

              <button 
                onClick={onLaunchAssignment}
                disabled={!!activeAssignmentResult}
                style={{ 
                  background: activeAssignmentResult ? 'var(--bg-surface)' : 'linear-gradient(135deg, var(--accent-success), #059669)', 
                  color: activeAssignmentResult ? 'var(--text-muted)' : '#ffffff', 
                  border: activeAssignmentResult ? '1px solid var(--border-color)' : 'none',
                  padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem',
                  cursor: activeAssignmentResult ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <Terminal size={14}/> {activeAssignmentResult ? "Completed" : "Start Assignment"}
              </button>

              {activeAssignmentResult && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Sparkles size={14} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'text-bottom' }}/> AI Evaluation Results
                    </div>
                    <div style={{ background: 'var(--bg-primary)', padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                      SCORE: <span style={{ color: 'var(--accent-success)', fontWeight: '800' }}>{activeAssignmentResult.approachScore} / 100</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-main)', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', lineHeight: '1.5' }}>
                      <strong style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: '0.25rem', fontSize: '0.7rem', textTransform: 'uppercase' }}>📊 Complexity Analysis:</strong>
                      {activeAssignmentResult.complexityAnalysis}
                    </div>
                    
                    <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', lineHeight: '1.5' }}>
                      <strong style={{ color: 'var(--accent-warning)', display: 'block', marginBottom: '0.25rem', fontSize: '0.7rem', textTransform: 'uppercase' }}>💡 Review Feedback:</strong>
                      {activeAssignmentResult.architecturalCritique}
                    </div>
                    
                    <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', width: '100%', overflowX: 'hidden' }}>
                      <strong style={{ color: 'var(--accent-secondary)', display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase' }}>Alternative Solution:</strong>
                      <pre style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginTop: '0.5rem', overflowX: 'auto', lineHeight: '1.4', background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '6px', boxSizing: 'border-box', width: '100%' }}>
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

        /* Responsive Masterclass Adaptability styles */
        @media (max-width: 1024px) {
          .canvas-tabs-header-container {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
          }
          .canvas-tabs-buttons-row {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .canvas-tabs-buttons-row button {
            flex: 1 1 auto !important;
            text-align: center !important;
            font-size: 0.8rem !important;
            padding: 0.5rem !important;
          }
          .ai-classroom-panel {
            flex-direction: column !important;
            height: auto !important;
          }
          .ai-avatar-column {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(30, 41, 59, 0.5) !important;
            padding: 1.5rem !important;
          }
          .ai-blackboard-column {
            padding: 1.5rem !important;
          }
          .canvas-video-doc-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
      `}</style>

    </div>
  );
}