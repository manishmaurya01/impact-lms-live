import React from 'react';

function AIAlign({ formData, updateData, onSubmit, onBack }) {
  const handleLocalChange = (e) => {
    updateData({ [e.target.name]: e.target.value });
  };

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleLocalSubmit} className="form-step-wrapper">
      <h2>// AI AGENT ALIGNMENT</h2>
      <p className="step-subtitle">Adaptive curation engine parameters calibration setup.</p>

      <div className="input-group">
        <label><i className="fa-solid fa-sliders"></i> Your Current Baseline Level</label>
        <select name="experience" value={formData.experience} onChange={handleLocalChange}>
          <option value="Beginner">Absolute Beginner (Tier 0)</option>
          <option value="Intermediate">Intermediate (Tier 1)</option>
          <option value="Advanced">Advanced Core (Tier 2)</option>
        </select>
      </div>

      <div className="input-group">
        <label><i className="fa-solid fa-photo-film"></i> Curation Style Preference</label>
        <select name="learningStyle" value={formData.learningStyle} onChange={handleLocalChange}>
          <option value="Videos">Visual Curation (YouTube/Video Heavy)</option>
          <option value="Documentation">Theoretical Grid (Articles & Docs Heavy)</option>
          <option value="Practical">Practical Execution (Assignments & Quizzes Heavy)</option>
        </select>
      </div>

      <div className="btn-actions-row">
        <button type="button" className="btn-nav-back" onClick={onBack}>Back</button>
        <button type="submit" className="btn-submit-matrix">
          Deploy AI LMS Engine <i className="fa-solid fa-brain"></i>
        </button>
      </div>
    </form>
  );
}

export default AIAlign;