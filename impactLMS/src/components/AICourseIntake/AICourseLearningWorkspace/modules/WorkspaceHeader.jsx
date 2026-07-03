import React from 'react';
import { ArrowLeft, Award, CheckCircle2 } from 'lucide-react';

export default function WorkspaceHeader({ courseTitle, modules = [], completedTracks = {}, onBack }) {
  
  // 🚀 DYNAMIC ACCURATE PROGRESS CALCULATOR
  // Pehle system total topics calculate karega pure modules me se
  let totalTopicsCount = 0;
  modules.forEach(mod => {
    if (mod?.topics) {
      totalTopicsCount += mod.topics.length;
    }
  });

  // Fir check karega completedTracks object me kitne keys dynamic validation true hain
  const completedTopicsCount = Object.keys(completedTracks).filter(key => completedTracks[key] === true).length;

  // Percentage safe mapping constraints bounds handle rules
  const progressPercent = totalTopicsCount > 0 
    ? Math.round((completedTopicsCount / totalTopicsCount) * 100) 
    : 0;

  return (
    <header style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '1rem 2rem', background: '#090d16', borderBottom: '1px solid rgba(255,255,255,0.05)',
      fontFamily: '"Inter", sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={onBack} 
          style={{ 
            padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', 
            color: '#94a3b8', background: 'transparent', border: '1px solid #1e293b', 
            borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 200ms ease' 
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            {courseTitle || "AI Specialization Track"}
          </h1>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Active Learning Matrix Workspace</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Real-time Visual Progress Shimmer Bar Container */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Curriculum Progress
          </div>
          <div style={{ width: '160px', height: '6px', background: '#1e293b', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ 
              width: `${progressPercent}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)', 
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}></div>
          </div>
        </div>

        {/* Dynamic Topics Metric Badges */}
        <span style={{ fontSize: '0.82rem', color: '#06b6d4', fontWeight: '800', background: 'rgba(6,182,212,0.04)', padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(6,182,212,0.15)', fontFamily: 'monospace' }}>
          TOPICS: {completedTopicsCount} / {totalTopicsCount} Completed ({progressPercent}%)
        </span>
      </div>
    </header>
  );
}