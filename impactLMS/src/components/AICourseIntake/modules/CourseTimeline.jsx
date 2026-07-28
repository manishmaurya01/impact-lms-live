import React from 'react';
import { 
  BookOpen, 
  Layers, 
  Award, 
  Trophy, 
  ChevronLeft, 
  Play, 
  Calendar, 
  HelpCircle, 
  CheckSquare,
  FileCode,
  Flame
} from 'lucide-react';

export default function CourseTimeline({ activeViewportCourse, onLaunchWorkspace, onBack }) {
  const modules = activeViewportCourse?.modules || [];
  
  // Calculate total topics
  let totalTopicsCount = 0;
  modules.forEach(m => {
    totalTopicsCount += m.topics ? m.topics.length : 0;
  });

  return (
    <div className="roadmap-master-scaffold-container animate-fadeIn">
      {/* Upper Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', width: '100%' }}>
        <button 
          onClick={onBack} 
          className="pill-selector-item" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ChevronLeft size={16} /> Back to Courses
        </button>

        <button 
          onClick={onLaunchWorkspace} 
          className="btn-open-matrix" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', color: '#fff', fontSize: '0.85rem' }}
        >
          <Play size={15} fill="currentColor" /> Enter Study Workspace
        </button>
      </div>

      {/* Premium Course Header Card */}
      <div className="studio-card-panel" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="matrix-level-badge">{activeViewportCourse?.level || 'Beginner'}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={12} /> Generated: {new Date(activeViewportCourse?.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {activeViewportCourse?.title}
            </h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.25rem' }}>Duration</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{activeViewportCourse?.duration || '1 Month'}</strong>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.25rem' }}>Modules</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{modules.length} Chapters</strong>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.25rem' }}>Total Topics</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{totalTopicsCount} Topics</strong>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.25rem' }}>AI Quizzes</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Unlocked</strong>
          </div>
        </div>
      </div>

      {/* Main Roadmap Timeline */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Layers size={18} style={{ color: 'var(--accent-primary)' }} /> Learning Path Timeline
      </h3>

      <div className="timeline-roadmap-wrapper">
        <div className="timeline-connecting-line"></div>

        {modules.map((moduleItem, idx) => (
          <div key={moduleItem.dayId || idx} className="timeline-step-item">
            {/* Left side dot marker */}
            <div className="timeline-step-marker">
              <div className="timeline-step-marker-inner"></div>
            </div>

            {/* Right side glassmorphism content card */}
            <div className="timeline-step-content animate-fadeIn">
              <span className="timeline-module-badge">Chapter {idx + 1}</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
                {moduleItem.title}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: '0 0 1.25rem 0' }}>
                {moduleItem.objective}
              </p>

              {/* Topics Row */}
              <div style={{ margin: '1rem 0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>Topics Covered</span>
                <div className="timeline-topics-row">
                  {moduleItem.topics?.map((topic, tIdx) => {
                    const topicText = typeof topic === 'object' && topic !== null ? topic.name : topic;
                    return (
                      <span key={tIdx} className="timeline-topic-tag">
                        <BookOpen size={12} style={{ color: 'var(--accent-primary)', opacity: 0.8 }} /> {topicText}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Deliverables Grid */}
              <div style={{ marginTop: '1.25rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.75rem' }}>AI Assessments</span>
                <div className="timeline-deliverables-container">
                  {/* Quiz assessment */}
                  <div className="timeline-deliverable-card">
                    <div className="timeline-deliverable-icon-wrapper quiz">
                      <HelpCircle size={16} />
                    </div>
                    <div className="timeline-deliverable-info">
                      <h5>{moduleItem.schedules?.quiz?.name || "Practice Assessment Quiz"}</h5>
                      <span>Topic Validation Quiz</span>
                    </div>
                  </div>

                  {/* Assignment assessment */}
                  {moduleItem.schedules?.assignment?.name && (
                    <div className="timeline-deliverable-card">
                      <div className="timeline-deliverable-icon-wrapper assignment">
                        <FileCode size={16} />
                      </div>
                      <div className="timeline-deliverable-info">
                        <h5>{moduleItem.schedules?.assignment?.name}</h5>
                        <span>Hands-on Code Lab</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Bottom Start learning CTA */}
      <div style={{ textAlign: 'center', marginTop: '3.5rem', paddingBottom: '3rem' }}>
        <button 
          onClick={onLaunchWorkspace} 
          className="btn-open-matrix" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 2.5rem', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', color: '#fff', fontSize: '1rem', boxShadow: 'var(--shadow-md)' }}
        >
          <Play size={18} fill="currentColor" /> Launch Study Workspace &amp; Start Learning
        </button>
      </div>

    </div>
  );
}