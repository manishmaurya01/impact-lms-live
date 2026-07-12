import React from 'react';

export default function CourseForm({ 
  inputPrompt, 
  setInputPrompt, 
  selectedLevel, 
  setSelectedLevel, 
  isGenerating, 
  errorLogs, 
  onSubmit 
}) {
  return (
    <div className="roadmap-master-scaffold-container max-w-xl">
      <form onSubmit={onSubmit} className="interactive-glass-card">
        <h2 className="gradient-heading-text" style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>
          AI Intelligent Syllabus Architect
        </h2>
        
        {errorLogs && (
          <div style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '12px', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '0.5rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {errorLogs}
          </div>
        )}

        <div className="form-input-wrapper-node" style={{ marginBottom: '1.5rem' }}>
          <label className="input-field-terminal-label">Technology, Topic, or Activity Subject</label>
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Example: Data Structures & Algorithms from Scratch..."
            required
            disabled={isGenerating}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="pill-selector-mesh">
            {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`pill-selector-item ${selectedLevel === lvl ? 'is-active' : ''}`}
                onClick={() => !isGenerating && setSelectedLevel(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
          <button type="submit" className="prompt-matrix-submit-btn" disabled={isGenerating}>
            {isGenerating ? 'Analyzing Domain...' : 'Generate and Commit'}
          </button>
        </div>
      </form>
    </div>
  );
}