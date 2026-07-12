import React from 'react';

export default function CourseTimeline({ activeViewportCourse, onLaunchWorkspace, onBack }) {
  return (
    <div className="roadmap-master-scaffold-container animate-fadeIn">
      <div className="interactive-glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Cloud Storage Engine Registry Identity Verified [Sync_OK]
            </span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '0.2rem 0 0 0' }}>
              {activeViewportCourse?.title}
            </h1>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={onLaunchWorkspace} 
              className="prompt-matrix-submit-btn" 
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}
            >
              📖 Enter Learning Workspace
            </button>
            <span style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 'bold', color: '#06b6d4', display: 'flex', alignItems: 'center' }}>
              Depth: {activeViewportCourse?.level}
            </span>
            <button onClick={onBack} className="pill-selector-item" style={{ color: '#fff', borderColor: '#374151' }}>Back</button>
          </div>
        </div>

        <div className="module-timeline-wrapper-node">
          {(activeViewportCourse?.modules || []).map((moduleItem, idx) => (
            <div key={moduleItem.dayId || idx} className="module-timeline-node-card">
              <div className="timeline-bullet-counter">{idx + 1}</div>
              <div className="node-card-inner-box">
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0' }}>{moduleItem.title}</h2>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af', lineHeight: '1.6', margin: '0 0 1.25rem 0' }}>{moduleItem.objective}</p>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {moduleItem.topics?.map((topic, tIdx) => {
                      const displayText = typeof topic === 'object' && topic !== null ? topic.name : topic;
                      return (
                        <span key={tIdx} style={{ fontSize: '0.75rem', background: '#0f172a', border: '1px solid #1e293b', padding: '0.35rem 0.75rem', borderRadius: '0.35rem', color: '#cbd5e1' }}>
                          {displayText}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="meta-packages-asymmetric-row">
                  <div className="package-pill-box">
                    <div className="pill-type-header quiz-theme">⚡ Scheduled Quiz Evaluation</div>
                    <h4>{moduleItem.schedules?.quiz?.name}</h4>
                  </div>
                  <div className="package-pill-box">
                    <div className="pill-type-header assignment-theme">🛠️ Core Module Assignment</div>
                    <h4>{moduleItem.schedules?.assignment?.name}</h4>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}