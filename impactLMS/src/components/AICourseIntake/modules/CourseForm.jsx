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
        <h2 className="gradient-heading-text" style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>
          Generate New Course
        </h2>
        
        {errorLogs && (
          <div style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '12px', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '0.5rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {errorLogs}
          </div>
        )}

        <div className="form-input-wrapper-node" style={{ marginBottom: '1.5rem' }}>
          <label className="input-field-terminal-label">What topic do you want to learn?</label>
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="e.g., Python Programming for Beginners, Figma UI Design, etc."
            required
            disabled={isGenerating}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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
            {isGenerating ? 'Analyzing Topic...' : 'Generate Course'}
          </button>
        </div>
      </form>
    </div>
  );
}