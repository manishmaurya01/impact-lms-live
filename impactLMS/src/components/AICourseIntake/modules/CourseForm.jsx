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
  Cpu,
  ArrowRight,
  User,
  ChevronLeft
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
  const [currentStep, setCurrentStep] = useState(1); // 1: Prompt Input, 2: Difficulty, 3: Confirmation
  
  // Stored details loaded from local profile
  const [studentName, setStudentName] = useState('Student');
  const [commitment, setCommitment] = useState('1 Hour');
  const [learningStyle, setLearningStyle] = useState('Videos');

  // Customize preferences displayed in Confirmation (Step 3)
  const [language, setLanguage] = useState('English');
  const [duration, setDuration] = useState('1 Month');

  // Load registration settings
  useEffect(() => {
    try {
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u.fullName) setStudentName(u.fullName);
        if (u.experience) setSelectedLevel(u.experience);
        if (u.commitment) setCommitment(u.commitment);
        if (u.learningStyle) setLearningStyle(u.learningStyle);
      }
    } catch (e) {
      console.error("Failed to load user profile in form:", e);
    }
  }, [setSelectedLevel]);

  // Submit trigger
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
    setCurrentStep(2);
  };

  const handleSelectDifficulty = (lvl) => {
    setSelectedLevel(lvl);
    setCurrentStep(3);
  };

  // Preview metrics logic
  const getPreviewMetrics = () => {
    let modules = 6;
    let hours = 20;
    let projects = 1;
    let assignments = 2;

    if (selectedLevel === 'Intermediate') {
      modules = 10;
      hours = 40;
      projects = 2;
      assignments = 4;
    } else if (selectedLevel === 'Advanced') {
      modules = 14;
      hours = 65;
      projects = 3;
      assignments = 6;
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

    return { modules, hours, projects, assignments };
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

      {errorLogs && (
        <div style={{ color: '#f87171', background: 'rgba(248,113,113,0.06)', padding: '15px', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '2rem' }}>
          <strong>⚠️ AI Generation Error:</strong> {errorLogs}
        </div>
      )}

      {/* STEP 1: CONVERSATIONAL SEARCH INPUT */}
      {currentStep === 1 && (
        <div>
          <div className="maskara-search-container">
            <h1 className="maskara-title">Describe your course</h1>
            <p className="maskara-sub">Create fully customized learning roadmaps for any subject with just a few prompts.</p>
            
            <div className="maskara-input-wrapper">
              <input 
                type="text" 
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputPrompt.trim()) {
                    e.preventDefault();
                    setCurrentStep(2);
                  }
                }}
                placeholder="What skill or topic do you want to master?"
                className="maskara-input"
                autoFocus
              />
              <button 
                type="button" 
                className="maskara-send-btn"
                disabled={!inputPrompt.trim()}
                onClick={() => setCurrentStep(2)}
              >
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="prompt-suggestions-row">
              <span className="prompt-suggest-pill" onClick={() => handleTemplateClick("React JS with Projects")}>React JS</span>
              <span className="prompt-suggest-pill" onClick={() => handleTemplateClick("Python Algorithms and Data Structures")}>Python DSA</span>
              <span className="prompt-suggest-pill" onClick={() => handleTemplateClick("Spring Boot Backend Developer")}>Spring Boot</span>
              <span className="prompt-suggest-pill" onClick={() => handleTemplateClick("Figma UI UX Design Fundamentals")}>UI UX Design</span>
            </div>
          </div>

          {/* Preset Templates Horizontal Scroll Row */}
          <div className="maskara-presets-section">
            <h3 className="maskara-presets-title">Try to create your own course</h3>
            <div className="maskara-presets-row">
              {[
                { title: 'Java Full Stack', icon: BookOpenCheck },
                { title: 'React JS', icon: Activity },
                { title: 'NodeJS Backend', icon: Layers },
                { title: 'Python Programming', icon: Award },
                { title: 'Java DSA', icon: Trophy },
                { title: 'AI Engineering', icon: Sparkles },
                { title: 'Machine Learning', icon: Cpu },
                { title: 'Cyber Security', icon: Globe },
                { title: 'UI UX Design', icon: Layers },
                { title: 'Flutter Developer', icon: Clock }
              ].map((temp, idx) => {
                const IconComp = temp.icon;
                return (
                  <div 
                    key={idx} 
                    className="maskara-preset-card"
                    onClick={() => handleTemplateClick(temp.title)}
                  >
                    <div className="maskara-preset-icon">
                      <IconComp size={16} />
                    </div>
                    <h4>{temp.title}</h4>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: DIFFICULTY SELECTOR */}
      {currentStep === 2 && (
        <div className="wizard-step-container animate-fadeIn">
          <h1 className="maskara-title">Select Difficulty Level</h1>
          <p className="maskara-sub">Choose the curriculum depth that matches your current skillset.</p>

          <div className="wizard-cards-grid">
            {[
              { lvl: 'Beginner', desc: 'Core Fundamentals', body: 'Start from absolute basics, syntax rules, and configuration steps.' },
              { lvl: 'Intermediate', desc: 'Practical Application', body: 'Deep-dive into core architecture designs and modular structural projects.' },
              { lvl: 'Advanced', desc: 'Mastery Depth', body: 'Expert patterns, scale diagnostics, code reviews, and optimization.' }
            ].map((item) => (
              <div 
                key={item.lvl}
                className={`wizard-choice-card ${selectedLevel === item.lvl ? 'is-active' : ''}`}
                onClick={() => handleSelectDifficulty(item.lvl)}
              >
                <div className="maskara-preset-icon" style={{ marginBottom: '0.5rem' }}>
                  <Layers size={18} />
                </div>
                <h4>{item.lvl}</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>{item.desc}</span>
                <p>{item.body}</p>
              </div>
            ))}
          </div>

          <div className="wizard-controls-row">
            <button type="button" className="wizard-btn-secondary" onClick={() => setCurrentStep(1)}>
              &larr; Back
            </button>
            <button type="button" className="wizard-btn-primary" onClick={() => setCurrentStep(3)}>
              Next &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SUMMARY CONFIRMATION */}
      {currentStep === 3 && (
        <div className="wizard-step-container animate-fadeIn">
          <h1 className="maskara-title">Confirm your AI syllabus</h1>
          <p className="maskara-sub">Verify your learning parameters before generating the syllabus.</p>

          <div className="wizard-summary-card">
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
              <User size={18} style={{ color: 'var(--accent-secondary)' }} /> Course Construction Details
            </h3>

            <div className="summary-detail-row">
              <span>Student Name</span>
              <strong>{studentName}</strong>
            </div>

            <div className="summary-detail-row">
              <span>Target Subject</span>
              <strong style={{ color: 'var(--accent-secondary)' }}>{inputPrompt}</strong>
            </div>

            <div className="summary-detail-row">
              <span>Difficulty Depth</span>
              <strong>{selectedLevel}</strong>
            </div>

            {/* In-Line Toggle: Language */}
            <div className="summary-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span>Preferred Language</span>
              <div className="studio-pills-row">
                {['English', 'Hindi', 'Gujarati', 'Hinglish'].map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`studio-pill-node ${language === l ? 'is-active' : ''}`}
                    onClick={() => setLanguage(l)}
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* In-Line Toggle: Duration */}
            <div className="summary-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span>Target Duration</span>
              <div className="studio-pills-row">
                {['1 Week', '2 Weeks', '1 Month', '2 Months'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`studio-pill-node ${duration === d ? 'is-active' : ''}`}
                    onClick={() => setDuration(d)}
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Forecast Metrics Box */}
            <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Estimated Syllabus Details</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                <div>📚 <strong>{previewMetrics.modules} Modules</strong></div>
                <div>⏱️ <strong>{previewMetrics.hours} Study Hours</strong></div>
                <div>🛠️ <strong>{previewMetrics.projects} Projects</strong></div>
                <div>🛡️ <strong>AI Quizzes Enabled</strong></div>
              </div>
            </div>
          </div>

          <div className="wizard-controls-row" style={{ width: '100%' }}>
            <button type="button" className="wizard-btn-secondary" onClick={() => setCurrentStep(2)}>
              Back
            </button>
            <button 
              type="button" 
              className="wizard-btn-primary" 
              style={{ flex: 1 }}
              onClick={handleLocalSubmit}
            >
              Construct My Course Roadmap &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Bottom section: Recently Generated Courses */}
      {currentStep === 1 && savedCoursesList.length > 0 && (
        <div className="studio-card-panel" style={{ marginTop: '3rem', padding: '1.5rem' }}>
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