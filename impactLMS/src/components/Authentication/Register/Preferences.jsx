import React from 'react';

function Preferences({ formData, updateData, onNext, onBack }) {
  const handleLocalChange = (e) => {
    updateData({ [e.target.name]: e.target.value });
  };

  return (
    <div className="form-step-wrapper">
      <h2>// PERSONA CONFIGURATION</h2>
      <p className="step-subtitle">Help AI calibrate your timeline tracking plan.</p>

      <div className="input-group">
        <label><i className="fa-solid fa-network-wired"></i> Primary Tech/Learning Domain</label>
        <select name="domain" value={formData.domain} onChange={handleLocalChange}>
          <option value="Programming">Programming & DSA Core</option>
          <option value="Design">UI/UX & Graphics Design</option>
          <option value="Marketing">Digital Marketing & Growth</option>
          <option value="Languages">Language & Linguistics</option>
          <option value="Competitive">Competitive Board Exams</option>
        </select>
      </div>

      <div className="input-group">
        <label><i className="fa-solid fa-clock"></i> Daily Committed Bandwidth</label>
        <select name="commitment" value={formData.commitment} onChange={handleLocalChange}>
          <option value="30 Mins">Tactical Sprint (30 Mins/day)</option>
          <option value="1 Hour">Balanced Matrix (1 Hour/day)</option>
          <option value="2 Hours">Deep Focus Mode (2 Hours+/day)</option>
        </select>
      </div>

      <div className="btn-actions-row">
        <button type="button" className="btn-nav-back" onClick={onBack}>Back</button>
        <button type="button" className="btn-nav-next" onClick={onNext}>Next Step</button>
      </div>
    </div>
  );
}

export default Preferences;