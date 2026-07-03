import React from 'react';
import { BookOpen, HelpCircle } from 'lucide-react';

export default function ContentArea({ activeModule }) {
  if (!activeModule) return null;

  return (
    <div style={{ flex: 1, padding: '2.5rem 3rem', overflowY: 'auto', background: '#02040a' }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
        
        {/* Objective banner */}
        <div style={{ background: 'rgba(6,182,212,0.02)', border: '1px solid rgba(6,182,212,0.08)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
          <h5 style={{ margin: 0, color: '#06b6d4', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Learning Objective</h5>
          <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5' }}>{activeModule.objective}</p>
        </div>

        {/* Core Topics Checklist */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={18} style={{ color: '#8b5cf6' }} /> Targeted Core Concepts
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '3rem' }}>
          {activeModule.topics.map((topic, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '0.75rem' }}>
              <span style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', flexShrink: 0 }}>
                {index + 1}
              </span>
              <span style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.4' }}>{topic}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}