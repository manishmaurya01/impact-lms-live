import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  Award, 
  Clock, 
  Trophy, 
  BookOpenCheck,
  Activity,
  Globe,
  TrendingUp,
  Cpu
} from 'lucide-react';

export default function CourseForm({ 
  inputPrompt, 
  setInputPrompt, 
  selectedLevel, 
  setSelectedLevel, 
  isGenerating, 
  errorLogs, 
  onSubmit,
  savedCoursesList = [],
  onSelectCourse
}) {
  // Option preferences loaded in background
  const [commitment, setCommitment] = useState('1 Hour');
  const [learningStyle, setLearningStyle] = useState('Videos');

  // Simple customization states displayed to the user
  const [language, setLanguage] = useState('English');
  const [duration, setDuration] = useState('1 Month');

  // Load user details from registration profile
  useEffect(() => {
    try {
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u.experience) {
          setSelectedLevel(u.experience);
        }
        if (u.commitment) {
          setCommitment(u.commitment);
        }
        if (u.learningStyle) {
          setLearningStyle(u.learningStyle);
        }
      }
    } catch (e) {
      console.error("Failed to load user profile in course form:", e);
    }
  }, [setSelectedLevel]);

  // Handle local submit assembly
  const handleLocalSubmit = (e) => {
    e.preventDefault();
    const finalAssembledPrompt = `
Goal: ${inputPrompt}
Level: ${selectedLevel}
Time Commitment: ${commitment} (Extracted from profile)
Language: ${language}
Style: ${learningStyle} (Extracted from profile)
Duration: ${duration}
Objective: Skill Upgrade
Focus Areas: Projects, Coding, Practice
`;
    onSubmit(e, finalAssembledPrompt);
  };

  const handleTemplateClick = (title) => {
    setInputPrompt(`I want to learn ${title} and build practical applications.`);
  };

  // Preview metrics calculations
  const getPreviewMetrics = () => {
    let modules = 6;
    let hours = 20;
    let projects = 1;
    let assignments = 2;
    let quizzes = 6;

    if (selectedLevel === 'Intermediate') {
      modules = 10;
      hours = 40;
      projects = 2;
      assignments = 4;
      quizzes = 10;
    } else if (selectedLevel === 'Advanced') {
      modules = 14;
      hours = 65;
      projects = 3;
      assignments = 6;
      quizzes = 14;
    }

    if (duration === '1 Week') {
      modules = Math.max(2, Math.round(modules * 0.4));
      hours = Math.max(8, Math.round(hours * 0.4));
    } else if (duration === '2 Weeks') {
      modules = Math.max(4, Math.round(modules * 0.65));
      hours = Math.max(15, Math.round(hours * 0.65));
    } else if (duration === '2 Months') {
      modules = Math.round(modules * 1.4);
      hours = Math.round(hours * 1.4);
    }

    return { modules, hours, projects, assignments, quizzes };
  };

  const previewMetrics = getPreviewMetrics();

  return (
    <div className="roadmap-master-scaffold-container">
      {/* Breadcrumb */}
      <div className="studio-breadcrumb">
        <span>Workspace</span>
        <span>&gt;</span>
        <span className="active">AI Course Studio</span>
      </div>

      {/* Simplified Hero Banner */}
      <div className="studio-hero-banner" style={{ padding: '2rem' }}>
        <div className="hero-glow-bubble-1" />
        <div className="hero-text-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Sparkles size={16} style={{ color: 'var(--accent-secondary)' }} />
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '800', color: 'var(--accent-secondary)' }}>LuminaLearn AI</span>
          </div>
          <h1>Create Your Custom Learning Path</h1>
          <p>Tell the AI what you want to learn. We will instantly construct a custom syllabus roadmap featuring practice quizzes, project tasks, and speech interviews tailored to your experience level.</p>
        </div>
        <div className="hero-time-badge">
          <span className="time-val">10-20s</span>
          <span className="time-lbl">Engine Time</span>
        </div>
      </div>

      {errorLogs && (
        <div style={{ color: '#f87171', background: 'rgba(248,113,113,0.06)', padding: '15px', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '2rem' }}>
          <strong>⚠️ AI Generation Error:</strong> {errorLogs}
        </div>
      )}

      {/* Double Column Layout */}
      <div className="studio-grid-layout">
        {/* LEFT COLUMN: SIMPLIFIED FORM */}
        <form onSubmit={handleLocalSubmit} className="studio-form-container">
          
          {/* Goal Prompt Input */}
          <div className="studio-card-panel">
            <h3><Sparkles size={18} style={{ color: 'var(--accent-primary)' }} /> What do you want to learn?</h3>
            <div className="textarea-wrapper">
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Enter a topic or skill... (e.g. Learn React from scratch, JavaScript Interview Prep, MERN Stack Developer)"
                required
                disabled={isGenerating}
                style={{ minHeight: '80px' }}
              />
              <div className="textarea-footer-metrics">
                <span>{inputPrompt.length} characters</span>
                {inputPrompt.length > 0 && (
                  <span style={{ color: inputPrompt.length > 25 ? 'var(--accent-secondary)' : 'var(--text-muted)', fontWeight: 700 }}>
                    {inputPrompt.length > 25 ? '✓ Detailed prompt' : 'Add details for better results'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="prompt-suggestions-row" style={{ marginTop: '0.25rem' }}>
              <span className="prompt-suggest-pill" onClick={() => handleTemplateClick("Java Backend Development with Spring Boot")}>Spring Boot Backend</span>
              <span className="prompt-suggest-pill" onClick={() => handleTemplateClick("React Interview Preparation")}>React Interview</span>
              <span className="prompt-suggest-pill" onClick={() => handleTemplateClick("Python DSA and Algorithms")}>Python DSA</span>
            </div>
          </div>

          {/* Simple Selections Grid */}
          <div className="studio-card-panel">
            <h3><Layers size={18} style={{ color: 'var(--accent-secondary)' }} /> Syllabus Preferences</h3>
            
            {/* Level Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Difficulty (Pre-filled from Profile)</span>
              <div className="studio-pills-row">
                {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={`studio-pill-node ${selectedLevel === lvl ? 'is-active' : ''}`}
                    onClick={() => !isGenerating && setSelectedLevel(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Preferred Language</span>
              <div className="studio-pills-row">
                {['English', 'Hindi', 'Gujarati', 'Hinglish'].map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`studio-pill-node ${language === l ? 'is-active' : ''}`}
                    onClick={() => !isGenerating && setLanguage(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Duration Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Duration</span>
              <div className="studio-pills-row">
                {['1 Week', '2 Weeks', '1 Month', '2 Months'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`studio-pill-node ${duration === d ? 'is-active' : ''}`}
                    onClick={() => !isGenerating && setDuration(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="prompt-matrix-submit-btn" 
            disabled={isGenerating || !inputPrompt.trim()}
            style={{ width: '100%', padding: '1.1rem', fontSize: '0.925rem', borderRadius: '10px' }}
          >
            {isGenerating ? 'AI Engine Working...' : 'Generate Roadmap Now'}
          </button>
        </form>

        {/* RIGHT COLUMN: AI PREVIEW & DIAGNOSTICS */}
        <div className="studio-preview-container">
          
          {/* AI Status Card */}
          <div className="ai-status-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}><Cpu size={12} style={{ verticalAlign: 'middle', marginRight: '0.4rem', color: 'var(--accent-secondary)' }} /> Engine Status</h4>
            <div className="status-grid" style={{ gridTemplateColumns: '1fr', gap: '0.5rem' }}>
              <div className="status-row-item">
                <div className="status-indicator-dot-green" />
                <span>Gemini Core Connected</span>
              </div>
              <div className="status-row-item">
                <div className="status-indicator-dot-green" />
                <span>Database Sync Active</span>
              </div>
              <div className="status-row-item">
                <div className="status-indicator-dot-green" />
                <span>Roadmap Engine Ready</span>
              </div>
            </div>
          </div>

          {/* Live Preview scorecard */}
          <div className="live-preview-scorecard" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>
              <Activity size={16} style={{ color: 'var(--accent-primary)' }} /> Dynamic Forecast
              <span className="scorecard-header-badge" style={{ padding: '0.15rem 0.4rem' }}>Live</span>
            </h3>
            
            <div className="preview-grid-stats" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="preview-stat-box" style={{ padding: '0.75rem' }}>
                <span className="lbl">Est. Modules</span>
                <span className="val" style={{ fontSize: '1.1rem' }}>{previewMetrics.modules} Modules</span>
              </div>
              <div className="preview-stat-box" style={{ padding: '0.75rem' }}>
                <span className="lbl">Est. Study Hours</span>
                <span className="val" style={{ fontSize: '1.1rem' }}>{previewMetrics.hours} Hours</span>
              </div>
              <div className="preview-stat-box" style={{ padding: '0.75rem' }}>
                <span className="lbl">Mock Projects</span>
                <span className="val" style={{ fontSize: '1.1rem' }}>{previewMetrics.projects} Projects</span>
              </div>
              <div className="preview-stat-box" style={{ padding: '0.75rem' }}>
                <span className="lbl">AI Quizzes</span>
                <span className="val" style={{ fontSize: '1.1rem' }}>{previewMetrics.quizzes} Quizzes</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Commitment (Profile)</span>
                <strong>{commitment} / day</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Learning Style (Profile)</span>
                <strong>{learningStyle}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Completion Certificate</span>
                <strong style={{ color: 'var(--accent-secondary)' }}>Free Unlocked</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Templates Grid */}
      <div className="studio-card-panel" style={{ marginTop: '2rem', padding: '1.5rem' }}>
        <h3 style={{ borderBottom: 'none', paddingBottom: '0', fontSize: '1.05rem', marginBottom: '1rem' }}><TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} /> Popular Course Templates</h3>
        <div className="studio-templates-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {[
            { title: 'Java Full Stack' },
            { title: 'React JS' },
            { title: 'NodeJS Backend' },
            { title: 'Python Programming' },
            { title: 'Java DSA' },
            { title: 'AI Engineering' },
            { title: 'Machine Learning' },
            { title: 'Cyber Security' },
            { title: 'UI UX Design' },
            { title: 'Flutter Developer' }
          ].map((temp, idx) => (
            <div 
              key={idx} 
              className="template-card-node"
              onClick={() => handleTemplateClick(temp.title)}
              style={{ padding: '0.85rem 1rem', gap: '0.5rem' }}
            >
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700 }}>{temp.title}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Generated Courses */}
      {savedCoursesList.length > 0 && (
        <div className="studio-card-panel" style={{ marginTop: '2rem', padding: '1.5rem' }}>
          <h3 style={{ borderBottom: 'none', paddingBottom: '0', fontSize: '1.05rem', marginBottom: '1rem' }}><BookOpenCheck size={16} style={{ color: 'var(--accent-secondary)' }} /> Recently Generated Courses</h3>
          <div className="historical-courses-matrix-grid" style={{ gap: '1rem' }}>
            {savedCoursesList.slice(0, 3).map((course) => {
              let totalTopics = 0;
              course.modules?.forEach(m => { totalTopics += m.topics ? m.topics.length : 0; });
              const completedCount = course.completedTopics ? course.completedTopics.length : 0;
              const progress = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

              return (
                <div key={course._id} className="matrix-course-item-card" style={{ padding: '1.25rem', gap: '1rem' }}>
                  <div className="matrix-course-meta-header">
                    <h3 style={{ fontSize: '1.05rem' }}>{course.title}</h3>
                    <span className="matrix-level-badge">{course.level}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>Progress</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="progress-bar-bg" style={{ height: '5px' }}>
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="matrix-course-footer" style={{ paddingTop: '0.85rem' }}>
                    <span style={{ fontSize: '0.7rem' }}>Created: {new Date(course.createdAt).toLocaleDateString()}</span>
                    <button 
                      className="btn-open-matrix"
                      onClick={() => onSelectCourse(course)}
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.72rem' }}
                    >
                      Resume &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}