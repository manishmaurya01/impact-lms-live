import React from 'react';

function CoreAuth({ formData, updateData, onNext }) {
  const handleLocalChange = (e) => {
    updateData({ [e.target.name]: e.target.value });
  };

  const validateAndProceed = (e) => {
    e.preventDefault();
    if (formData.fullName && formData.email && formData.password) {
      onNext();
    } else {
      alert("Please fill all identity grid inputs correctly.");
    }
  };

  return (
    <form onSubmit={validateAndProceed} className="form-step-wrapper">
      <h2>// INITIALIZE IDENTITY MATRIX</h2>
      <p className="step-subtitle">Setup your secure system credentials.</p>
      
      <div className="input-group">
        <label><i className="fa-solid fa-user"></i> Full Name</label>
        <input type="text" name="fullName" value={formData.fullName} onChange={handleLocalChange} placeholder="Enter your name" required />
      </div>
      
      <div className="input-group">
        <label><i className="fa-solid fa-envelope"></i> Core Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleLocalChange} placeholder="name@domain.com" required />
      </div>
      
      <div className="input-group">
        <label><i className="fa-solid fa-key"></i> System Password</label>
        <input type="password" name="password" value={formData.password} onChange={handleLocalChange} placeholder="••••••••" required />
      </div>

      <div className="input-group">
        <label><i className="fa-solid fa-user-shield"></i> Define System Role</label>
        <select name="role" value={formData.role} onChange={handleLocalChange}>
          <option value="Student">Student (Learner Core)</option>
          <option value="Mentor">Mentor / Teacher</option>
          <option value="Admin">System Administrator</option>
        </select>
      </div>

      <button type="submit" className="btn-nav-next">
        Proceed to Persona Tuning <i className="fa-solid fa-arrow-right"></i>
      </button>
    </form>
  );
}

export default CoreAuth;
