import React from 'react';
import { ArrowLeft, Menu } from 'lucide-react';

export default function WorkspaceHeader({ courseTitle, modules = [], completedTracks = {}, onBack, onToggleSidebar }) {
  
  // Dynamic Progress Calculation
  let totalTopicsCount = 0;
  modules.forEach(mod => {
    if (mod?.topics) {
      totalTopicsCount += mod.topics.length;
    }
  });

  const completedTopicsCount = Object.keys(completedTracks).filter(key => completedTracks[key] === true).length;

  const progressPercent = totalTopicsCount > 0 
    ? Math.round((completedTopicsCount / totalTopicsCount) * 100) 
    : 0;

  return (
    <header className="workspace-nav-header" style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.85rem 1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
      fontFamily: 'var(--font-sans)', flexWrap: 'wrap', gap: '1rem', width: '100%', boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={onToggleSidebar}
          className="workspace-sidebar-toggle-btn block lg:hidden"
          style={{
            padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border-color)',
            borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 200ms ease'
          }}
        >
          <Menu size={16} />
        </button>

        <button 
          onClick={onBack} 
          style={{ 
            padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', 
            color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border-color)', 
            borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 200ms ease', fontSize: '0.85rem'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--text-main)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {courseTitle || "Course Study Guide"}
          </h1>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Study Workspace</span>
        </div>
      </div>

      <div className="header-progress-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Course Progress
          </div>
          <div style={{ width: '120px', height: '5px', background: 'var(--bg-surface)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ 
              width: `${progressPercent}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--accent-secondary), var(--accent-primary))', 
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}></div>
          </div>
        </div>

        <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '700', background: 'rgba(var(--accent-primary-rgb), 0.08)', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(var(--accent-primary-rgb), 0.18)', fontFamily: 'monospace' }}>
          {completedTopicsCount} / {totalTopicsCount} Completed ({progressPercent}%)
        </span>
      </div>
    </header>
  );
}