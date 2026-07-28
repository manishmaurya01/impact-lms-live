import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  BookOpen, 
  Award, 
  Clock, 
  ArrowRight, 
  Play, 
  Trophy, 
  BookOpenCheck,
  Activity,
  FileText,
  MessageSquare,
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
  // Encapsulated studio states
  const [learningObjective, setLearningObjective] = useState('Skill Upgrade');
  const [commitment, setCommitment] = useState('2 Hours');
  const [language, setLanguage] = useState('English');
  const [learningStyle, setLearningStyle] = useState('Mixed');
  const [duration, setDuration] = useState('1 Month');
  const [customDuration, setCustomDuration] = useState('');
  const [focusAreas, setFocusAreas] = useState(['Projects', 'Practice']);

  // Quality score helper
  const promptLength = inputPrompt.length;
  let promptQuality = 'Empty';
  let qualityClass = '';
  if (promptLength > 0) {
    if (promptLength < 15) {
      promptQuality = 'Weak';
      qualityClass = 'weak';
    } else if (promptLength < 35) {
      promptQuality = 'Medium';
      qualityClass = 'medium';
    } else {
      promptQuality = 'Strong';
      qualityClass = 'strong';
    }
  }

  // Handle local submit assembly
  const handleLocalSubmit = (e) => {
    e.preventDefault();
    const durationText = duration === 'Custom' ? customDuration : duration;
    const finalAssembledPrompt = `
Goal: ${inputPrompt}
Objective: ${learningObjective}
Level: ${selectedLevel}
Time Commitment: ${commitment}
Language: ${language}
Style: ${learningStyle}
Duration: ${durationText}
Focus Areas: ${focusAreas.join(', ')}
`;
    onSubmit(e, finalAssembledPrompt);
  };

  const handleTemplateClick = (title) => {
    setInputPrompt(`I want to learn ${title} and build advanced real-world applications.`);
    if (title.includes('Full Stack') || title.includes('DSA') || title.includes('Engineering')) {
      setSelectedLevel('Intermediate');
      setLearningObjective('Job Ready');
      setFocusAreas(['Coding', 'Projects', 'Practice']);
    } else {
      setSelectedLevel('Beginner');
      setLearningObjective('Skill Upgrade');
      setFocusAreas(['Projects', 'Practice']);
    }
  };

  const handleFocusAreaToggle = (area) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter(a => a !== area));
    } else {
      setFocusAreas([...focusAreas, area]);
    }
  };

  // Live preview calculator helper
  const getPreviewMetrics = () => {
    let modules = 6;
    let hours = 20;
    let projects = 2;
    let assignments = 3;
    let quizzes = 6;
    let interviews = 1;

    // Adjust by level
    if (selectedLevel === 'Intermediate') {
      modules = 10;
      hours = 45;
      projects = 3;
      assignments = 5;
      quizzes = 10;
      interviews = 2;
    } else if (selectedLevel === 'Advanced') {
      modules = 14;
      hours = 75;
      projects = 4;
      assignments = 7;
      quizzes = 14;
      interviews = 3;
    }

    // Adjust by duration
    if (duration === '1 Week') {
      modules = Math.max(2, Math.round(modules * 0.35));
      hours = Math.max(8, Math.round(hours * 0.35));
    } else if (duration === '2 Weeks') {
      modules = Math.max(4, Math.round(modules * 0.6));
      hours = Math.max(15, Math.round(hours * 0.6));
    } else if (duration === '2 Months') {
      modules = Math.round(modules * 1.5);
      hours = Math.round(hours * 1.5);
      projects += 1;
      assignments += 2;
    }

    return { modules, hours, projects, assignments, quizzes, interviews };
  };

  const previewMetrics = getPreviewMetrics();

  return (
    <div className="roadmap-master-scaffold-container">
      {/* 1. Breadcrumb navigation */}
      <div className="studio-breadcrumb">
        <span>Workspace</span>
        <span>&gt;</span>
        <span className="active">AI Course Studio</span>
      </div>

      {/* 2. Premium Hero Banner */}
      <div className="studio-hero-banner">
        <div className="hero-glow-bubble-1" />
        <div className="hero-glow-bubble-2" />
        <div className="hero-text-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Sparkles size={16} style={{ color: 'var(--accent-secondary)' }} />
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '800', color: 'var(--accent-secondary)' }}>AI Course Studio</span>
          </div>
          <h1>Generate Your Personalized Roadmap</h1>
          <p>Provide your goal, preferences, and style. Gemini AI will instantly formulate a custom structured curriculum with quizzes, assignments, revision notes, and oral speech interviews.</p>
        </div>
        <div className="hero-time-badge">
          <span className="time-val">10-20s</span>
          <span className="time-lbl">Generation Time</span>
        </div>
      </div>

      {errorLogs && (
        <div style={{ color: '#f87171', background: 'rgba(248,113,113,0.06)', padding: '15px', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '2rem' }}>
          <strong>⚠️ AI Generation Error:</strong> {errorLogs}
        </div>
      )}

      {/* 3. Main layout grid */}
      <div className="studio-grid-layout">
        {/* LEFT COLUMN: STUDIO FORM */}
        <form onSubmit={handleLocalSubmit} className="studio-form-container">
          
          {/* SECTION 1: LEARNING GOAL */}
          <div className="studio-card-panel">
            <h3><Sparkles size={18} style={{ color: 'var(--accent-primary)' }} /> 1. What is your learning goal?</h3>
            <div className="textarea-wrapper">
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Describe what you want to master in detail... (e.g., I want to learn Node.js from scratch and build high-performance backend systems.)"
                required
                disabled={isGenerating}
              />
              <div className="textarea-footer-metrics">
                <span className="prompt-character-counter">{promptLength} characters</span>
                {promptLength > 0 && (
                  <span className="prompt-quality-meter">
                    Prompt quality: <span className={`quality-indicator-dot ${qualityClass}`} /> <strong style={{ textTransform: 'capitalize' }}>{promptQuality}</strong>
                  </span>
                )}
              </div>
            </div>
            
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Prompt suggestions</span>
            <div className="prompt-suggestions-row">
              <span className="prompt-suggest-pill" onClick={() => setInputPrompt("I want to become a Java Backend Developer and learn Spring Boot framework.")}>Java Backend Developer</span>
              <span className="prompt-suggest-pill" onClick={() => setInputPrompt("I want to crack Amazon SDE React coding interviews.")}>Amazon React Interview</span>
              <span className="prompt-suggest-pill" onClick={() => setInputPrompt("I want to learn Figma UI Design from absolute scratch.")}>Figma UI Design</span>
            </div>
          </div>

          {/* SECTION 2: EXPERIENCE LEVEL */}
          <div className="studio-card-panel">
            <h3><Layers size={18} style={{ color: 'var(--accent-secondary)' }} /> 2. Experience Level</h3>
            <div className="experience-cards-grid">
              {[
                { lvl: 'Beginner', desc: 'No prior background. Start from absolute core fundamentals and syntax.' },
                { lvl: 'Intermediate', desc: 'Familiar with concepts. Focus on building real-world projects and design patterns.' },
                { lvl: 'Advanced', desc: 'Experienced practitioner. Deep-dive into architecture, optimization, and system design.' }
              ].map((item) => (
                <div 
                  key={item.lvl} 
                  className={`experience-card-node ${selectedLevel === item.lvl ? 'is-active' : ''}`}
                  onClick={() => !isGenerating && setSelectedLevel(item.lvl)}
                >
                  <h4>{item.lvl}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: LEARNING OBJECTIVE */}
          <div className="studio-card-panel">
            <h3><Award size={18} style={{ color: 'var(--accent-primary)' }} /> 3. Learning Objective</h3>
            <div className="objectives-selection-grid">
              {['Interview Preparation', 'College Study', 'Job Ready', 'Freelancing', 'Career Switch', 'Skill Upgrade', 'Personal Interest'].map((obj) => (
                <div 
                  key={obj} 
                  className={`objective-item-card ${learningObjective === obj ? 'is-active' : ''}`}
                  onClick={() => !isGenerating && setLearningObjective(obj)}
                >
                  {obj}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: COMMITMENT */}
          <div className="studio-card-panel">
            <h3><Clock size={18} style={{ color: 'var(--accent-secondary)' }} /> 4. Daily Time Commitment</h3>
            <div className="studio-pills-row">
              {['30 Minutes', '1 Hour', '2 Hours', '3 Hours', '5 Hours'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`studio-pill-node ${commitment === t ? 'is-active' : ''}`}
                  onClick={() => !isGenerating && setCommitment(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 5: PREFERRED LANGUAGE */}
          <div className="studio-card-panel">
            <h3><Globe size={18} style={{ color: 'var(--accent-primary)' }} /> 5. Preferred Language</h3>
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

          {/* SECTION 6: LEARNING STYLE */}
          <div className="studio-card-panel">
            <h3><BookOpen size={18} style={{ color: 'var(--accent-secondary)' }} /> 6. Learning Style</h3>
            <div className="studio-pills-row">
              {['Videos', 'Documentation', 'Hands-on', 'Mixed'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`studio-pill-node ${learningStyle === s ? 'is-active' : ''}`}
                  onClick={() => !isGenerating && setLearningStyle(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 7: TARGET DURATION */}
          <div className="studio-card-panel">
            <h3><Clock size={18} style={{ color: 'var(--accent-primary)' }} /> 7. Target Duration</h3>
            <div className="studio-pills-row" style={{ marginBottom: duration === 'Custom' ? '1rem' : '0' }}>
              {['1 Week', '2 Weeks', '1 Month', '2 Months', 'Custom'].map((d) => (
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
            {duration === 'Custom' && (
              <input 
                type="text"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="e.g., 3 Weeks, 45 Days"
                className="navbar-search-input"
                style={{ width: '100%', maxWidth: '300px', boxSizing: 'border-box' }}
                required
              />
            )}
          </div>

          {/* SECTION 8: FOCUS AREAS */}
          <div className="studio-card-panel">
            <h3><Layers size={18} style={{ color: 'var(--accent-secondary)' }} /> 8. Focus Areas</h3>
            <div className="studio-pills-row">
              {['Projects', 'Theory', 'Coding', 'Assignments', 'Interview', 'Practice'].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`studio-pill-node ${focusAreas.includes(f) ? 'is-active' : ''}`}
                  onClick={() => !isGenerating && handleFocusAreaToggle(f)}
                >
                  {f} {focusAreas.includes(f) ? '✓' : '+'}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="prompt-matrix-submit-btn" 
            disabled={isGenerating || !inputPrompt.trim()}
            style={{ width: '100%', padding: '1.2rem', fontSize: '0.95rem', borderRadius: '12px' }}
          >
            {isGenerating ? 'AI Engine Working...' : 'Construct Personalized Course'}
          </button>
        </form>

        {/* RIGHT COLUMN: AI PREVIEW */}
        <div className="studio-preview-container">
          
          {/* AI STATUS INDICATOR CARD */}
          <div className="ai-status-card">
            <h4><Cpu size={14} style={{ color: 'var(--accent-secondary)', verticalAlign: 'middle', marginRight: '0.5rem' }} /> AI Engine Diagnostics</h4>
            <div className="status-grid">
              <div className="status-row-item">
                <div className="status-indicator-dot-green" />
                <span>Gemini API Connected</span>
              </div>
              <div className="status-row-item">
                <div className="status-indicator-dot-green" />
                <span>Database Sync Active</span>
              </div>
              <div className="status-row-item">
                <div className="status-indicator-dot-green" />
                <span>Course Engine Ready</span>
              </div>
              <div className="status-row-item">
                <div className="status-indicator-dot-green" />
                <span>Roadmap Generator</span>
              </div>
              <div className="status-row-item">
                <div className="status-indicator-dot-green" />
                <span>Assignment Engine</span>
              </div>
              <div className="status-row-item">
                <div className="status-indicator-dot-green" />
                <span>Oral Interview AI</span>
              </div>
            </div>
          </div>

          {/* LIVE SCORECARD PREVIEW */}
          <div className="live-preview-scorecard">
            <h3>
              <Activity size={18} style={{ color: 'var(--accent-primary)' }} /> Syllabus Forecast
              <span className="scorecard-header-badge">Live Preview</span>
            </h3>
            
            <div className="preview-grid-stats">
              <div className="preview-stat-box">
                <span className="lbl">Est. Modules</span>
                <span className="val">{previewMetrics.modules} Modules</span>
              </div>
              <div className="preview-stat-box">
                <span className="lbl">Est. Study Hours</span>
                <span className="val">{previewMetrics.hours} Hrs</span>
              </div>
              <div className="preview-stat-box">
                <span className="lbl">Syllabus Projects</span>
                <span className="val">{previewMetrics.projects} Projects</span>
              </div>
              <div className="preview-stat-box">
                <span className="lbl">AI Assignments</span>
                <span className="val">{previewMetrics.assignments} Tasks</span>
              </div>
              <div className="preview-stat-box">
                <span className="lbl">Evaluation Quizzes</span>
                <span className="val">{previewMetrics.quizzes} Quizzes</span>
              </div>
              <div className="preview-stat-box">
                <span className="lbl">Mock Interviews</span>
                <span className="val">{previewMetrics.interviews} Sessions</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Difficulty Depth</span>
                <strong style={{ color: 'var(--accent-secondary)' }}>{selectedLevel}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Duration</span>
                <strong style={{ color: 'var(--text-main)' }}>{duration === 'Custom' ? customDuration || 'Custom' : duration}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Certificate Access</span>
                <strong style={{ color: 'var(--accent-secondary)' }}>Free Unlocked</strong>
              </div>
            </div>

            <div className="skills-preview-list">
              <span className="skill-preview-pill">Goal Mapping</span>
              <span className="skill-preview-pill">Syllabus Build</span>
              <span className="skill-preview-pill">Oral Speech</span>
              <span className="skill-preview-pill">Coding Practice</span>
            </div>
          </div>

          {/* AI SPOTLIGHT BANNER */}
          <div className="ai-spotlight-banner">
            <h4><Sparkles size={16} style={{ color: '#c084fc' }} /> LuminaLearn AI Features</h4>
            <div className="spotlight-features-row">
              <span className="spotlight-badge">Personalized Roadmap</span>
              <span className="spotlight-badge">AI Notes</span>
              <span className="spotlight-badge">AI Quiz</span>
              <span className="spotlight-badge">Oral Interview</span>
              <span className="spotlight-badge">AI Assignments</span>
              <span className="spotlight-badge">Certificates</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Popular templates */}
      <div className="studio-card-panel" style={{ marginTop: '2.5rem' }}>
        <h3 style={{ borderBottom: 'none', paddingBottom: '0' }}><TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} /> Popular Course Templates</h3>
        <div className="studio-templates-grid">
          {[
            { title: 'Java Full Stack', icon: BookOpenCheck },
            { title: 'React framework', icon: Activity },
            { title: 'NodeJS API Developer', icon: Layers },
            { title: 'Python Programming', icon: Award },
            { title: 'Java DSA', icon: Trophy },
            { title: 'AI Engineering', icon: Sparkles },
            { title: 'Machine Learning', icon: Cpu },
            { title: 'Cyber Security', icon: FileText },
            { title: 'UI UX Design', icon: Layers },
            { title: 'Flutter Developer', icon: Play }
          ].map((temp, idx) => {
            const IconComp = temp.icon;
            return (
              <div 
                key={idx} 
                className="template-card-node"
                onClick={() => handleTemplateClick(temp.title)}
              >
                <div className="icon-ring">
                  <IconComp size={16} />
                </div>
                <h4>{temp.title}</h4>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Recently generated courses */}
      {savedCoursesList.length > 0 && (
        <div className="studio-card-panel" style={{ marginTop: '2.5rem' }}>
          <h3 style={{ borderBottom: 'none', paddingBottom: '0' }}><BookOpenCheck size={18} style={{ color: 'var(--accent-secondary)' }} /> Recently Generated Courses</h3>
          <div className="historical-courses-matrix-grid">
            {savedCoursesList.slice(0, 3).map((course) => {
              // Calculate progress percent
              let totalTopics = 0;
              course.modules?.forEach(m => { totalTopics += m.topics ? m.topics.length : 0; });
              const completedCount = course.completedTopics ? course.completedTopics.length : 0;
              const progress = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

              return (
                <div key={course._id} className="matrix-course-item-card">
                  <div className="matrix-course-meta-header">
                    <h3>{course.title}</h3>
                    <span className="matrix-level-badge">{course.level}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Syllabus Progress</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="progress-bar-bg" style={{ height: '6px' }}>
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="matrix-course-footer">
                    <span>Generated on {new Date(course.createdAt).toLocaleDateString()}</span>
                    <button 
                      className="btn-open-matrix"
                      onClick={() => onSelectCourse(course)}
                    >
                      Resume Study &rarr;
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