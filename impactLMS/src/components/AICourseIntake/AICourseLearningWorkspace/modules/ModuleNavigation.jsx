import React from 'react';
import { Lock, Unlock, CheckCircle } from 'lucide-react';

export default function ModuleNavigation({ modules, activeDayId, onSelectDay }) {
  return (
    <div style={{
      width: '300px', background: '#070a12', borderRight: '1px solid rgba(255,255,255,0.03)',
      padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto'
    }}>
      <h3 style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>Syllabus Roadmap</h3>
      
      {modules.map((mod) => {
        const isLocked = mod.status === 'locked';
        const isActive = mod.dayId === activeDayId;

        return (
          <div
            key={mod.dayId}
            onClick={() => !isLocked && onSelectDay(mod.dayId)}
            style={{
              padding: '1rem', borderRadius: '0.75rem', cursor: isLocked ? 'not-allowed' : 'pointer',
              background: isActive ? 'rgba(255,255,255,0.02)' : 'transparent',
              border: '1px solid',
              borderColor: isActive ? 'rgba(6,182,212,0.2)' : isLocked ? 'transparent' : 'rgba(255,255,255,0.02)',
              opacity: isLocked ? 0.4 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: isActive ? '#06b6d4' : '#64748b', fontFamily: 'monospace' }}>
                DAY 0{mod.dayId}
              </span>
              {isLocked ? <Lock size={12} style={{ color: '#64748b' }} /> : <Unlock size={12} style={{ color: '#10b981' }} />}
            </div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: isActive ? '#fff' : '#cbd5e1' }}>{mod.title}</h4>
            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '0.4rem' }}>⏱️ {mod.duration}</span>
          </div>
        );
      })}
    </div>
  );
}