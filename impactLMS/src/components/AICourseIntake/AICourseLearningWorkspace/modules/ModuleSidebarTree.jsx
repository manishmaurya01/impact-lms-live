import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Lock, BookOpen } from 'lucide-react';

export default function ModuleSidebarTree({ modules, activeModuleId, activeTopicIndex, completedTracks, onSelectTopic }) {
  const [expandedModules, setExpandedModules] = useState({ [activeModuleId]: true });

  const toggleModuleAccordion = (modId) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const verifyLockStatus = (modIndex, currentTopicIdx) => {
    if (modIndex === 0 && currentTopicIdx === 0) return false; 
    
    let targetModIndex = modIndex;
    let targetTopicIdx = currentTopicIdx - 1;

    if (targetTopicIdx < 0) {
      targetModIndex = modIndex - 1;
      const prevModObj = modules[targetModIndex];
      targetTopicIdx = prevModObj && prevModObj.topics ? prevModObj.topics.length - 1 : 0;
    }

    const targetMod = modules[targetModIndex];
    if (!targetMod) return false;

    const previousKey = `mod-${targetMod.dayId}-topic-${targetTopicIdx}`;
    return !completedTracks[previousKey];
  };

  return (
    <div className="workspace-sidebar-container">
      <h3 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: 'bold' }}>
        Syllabus Topics
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
        {modules.map((mod, index) => {
          const isModuleExpanded = expandedModules[mod.dayId];

          return (
            <div key={mod._id || index} style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden', width: '100%' }}>
              
              <div 
                onClick={() => toggleModuleAccordion(mod.dayId)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', cursor: 'pointer', background: activeModuleId === mod.dayId ? 'rgba(var(--accent-primary-rgb), 0.05)' : 'transparent', width: '100%', boxSizing: 'border-box' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <BookOpen size={14} style={{ color: activeModuleId === mod.dayId ? 'var(--accent-primary)' : 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Module {index + 1}: {mod.title}</span>
                </div>
                {isModuleExpanded ? <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
              </div>

              {isModuleExpanded && (
                <div style={{ padding: '0.2rem 0.5rem 0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '1px dashed var(--border-color)', marginLeft: '1.25rem' }}>
                  {(mod.topics || []).map((topic, idx) => {
                    const isLocked = verifyLockStatus(index, idx);
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
                          background: isActive ? 'rgba(var(--accent-primary-rgb), 0.12)' : 'transparent',
                          color: isActive ? 'var(--accent-primary)' : isLocked ? 'var(--text-muted)' : 'var(--text-main)',
                          fontSize: '0.75rem', textAlign: 'left', cursor: isLocked ? 'not-allowed' : 'pointer',
                          boxSizing: 'border-box',
                          opacity: isLocked ? 0.5 : 1
                        }}
                      >
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                          {idx + 1}. {topic}
                        </span>
                        {isLocked ? <Lock size={11} style={{ flexShrink: 0, color: 'var(--text-muted)' }} /> : isFinished ? <CheckCircle2 size={11} style={{ color: 'var(--accent-success)', flexShrink: 0 }} /> : <div style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%', flexShrink: 0 }}></div>}
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