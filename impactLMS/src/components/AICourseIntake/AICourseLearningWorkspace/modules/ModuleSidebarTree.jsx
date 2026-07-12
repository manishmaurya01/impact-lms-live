import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Lock, BookOpen } from 'lucide-react';

export default function ModuleSidebarTree({ modules, activeModuleId, activeTopicIndex, completedTracks, onSelectTopic }) {
  const [expandedModules, setExpandedModules] = useState({ [activeModuleId]: true });

  const toggleModuleAccordion = (modId) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const verifyLockStatus = (currentModId, currentTopicIdx) => {
    if (currentModId === 1 && currentTopicIdx === 0) return false; 
    
    let targetPreviousTopicIdx = currentTopicIdx - 1;
    let targetPreviousModId = currentModId;

    if (targetPreviousTopicIdx < 0) {
      targetPreviousModId = currentModId - 1;
      const prevModObj = modules.find(m => m.dayId === targetPreviousModId);
      targetPreviousTopicIdx = prevModObj ? prevModObj.topics.length - 1 : 0;
    }

    const previousTokenValidationKey = `mod-${targetPreviousModId}-topic-${targetPreviousTopicIdx}`;
    return !completedTracks[previousTokenValidationKey];
  };

  return (
    <div className="workspace-sidebar-container" style={{ width: '320px', background: '#070a12', borderRight: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1rem' }}>
      <h3 style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Course Syllabus Directory</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {modules.map((mod, index) => {
          const isModuleExpanded = expandedModules[mod.dayId];

          return (
            <div key={mod._id || index} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', borderRadius: '0.5rem', overflow: 'hidden' }}>
              
              <div 
                onClick={() => toggleModuleAccordion(mod.dayId)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', cursor: 'pointer', background: activeModuleId === mod.dayId ? 'rgba(6,182,212,0.02)' : 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={14} style={{ color: activeModuleId === mod.dayId ? '#06B6D4' : '#64748b' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Module {index + 1}: {mod.title}</span>
                </div>
                {isModuleExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
              </div>

              {isModuleExpanded && (
                <div style={{ padding: '0.2rem 0.5rem 0.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '1px dashed #1e293b', marginLeft: '1.5rem' }}>
                  {(mod.topics || []).map((topic, idx) => {
                    const isLocked = verifyLockStatus(mod.dayId, idx);
                    const isActive = activeModuleId === mod.dayId && activeTopicIndex === idx;
                    const isFinished = completedTracks[`mod-${mod.dayId}-topic-${idx}`];

                    return (
                      <button
                        key={idx}
                        disabled={isLocked}
                        onClick={() => onSelectTopic(mod.dayId, idx)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem', width: '100%', border: 'none', borderRadius: '0.25rem',
                          background: isActive ? 'rgba(139,92,246,0.1)' : 'transparent',
                          color: isActive ? '#8B5CF6' : isLocked ? '#475569' : '#cbd5e1',
                          fontSize: '0.78rem', textAlign: 'left', cursor: isLocked ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                          {idx + 1}. {topic}
                        </span>
                        {isLocked ? <Lock size={11} /> : isFinished ? <CheckCircle2 size={11} style={{ color: '#10B981' }} /> : <div style={{ width: '4px', height: '4px', background: '#64748b', borderRadius: '50%' }}></div>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}