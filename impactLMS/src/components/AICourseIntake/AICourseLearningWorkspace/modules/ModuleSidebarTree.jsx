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
    <div className="workspace-sidebar-container">
      <h3 style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: 'bold' }}>Syllabus Topics</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
        {modules.map((mod, index) => {
          const isModuleExpanded = expandedModules[mod.dayId];

          return (
            <div key={mod._id || index} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', borderRadius: '0.5rem', overflow: 'hidden', width: '100%' }}>
              
              <div 
                onClick={() => toggleModuleAccordion(mod.dayId)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', cursor: 'pointer', background: activeModuleId === mod.dayId ? 'rgba(6,182,212,0.02)' : 'transparent', width: '100%', boxSizing: 'border-box' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <BookOpen size={14} style={{ color: activeModuleId === mod.dayId ? '#06b6d4' : '#64748b', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Module {index + 1}: {mod.title}</span>
                </div>
                {isModuleExpanded ? <ChevronDown size={14} color="#64748b" style={{ flexShrink: 0 }} /> : <ChevronRight size={14} color="#64748b" style={{ flexShrink: 0 }} />}
              </div>

              {isModuleExpanded && (
                <div style={{ padding: '0.2rem 0.5rem 0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '1px dashed #1e293b', marginLeft: '1.25rem' }}>
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
                          padding: '0.5rem 0.65rem', width: '100%', border: 'none', borderRadius: '0.25rem',
                          background: isActive ? 'rgba(139,92,246,0.1)' : 'transparent',
                          color: isActive ? '#8b5cf6' : isLocked ? '#475569' : '#cbd5e1',
                          fontSize: '0.75rem', textAlign: 'left', cursor: isLocked ? 'not-allowed' : 'pointer',
                          boxSizing: 'border-box'
                        }}
                      >
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                          {idx + 1}. {topic}
                        </span>
                        {isLocked ? <Lock size={11} style={{ flexShrink: 0 }} /> : isFinished ? <CheckCircle2 size={11} style={{ color: '#10b981', flexShrink: 0 }} /> : <div style={{ width: '4px', height: '4px', background: '#64748b', borderRadius: '50%', flexShrink: 0 }}></div>}
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