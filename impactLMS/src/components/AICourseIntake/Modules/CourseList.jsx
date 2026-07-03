import React from 'react';

export default function CourseList({ savedCoursesList, onSelectCourse, onDeleteCourse }) {
  if (savedCoursesList.length === 0) {
    return (
      <div className="interactive-glass-card">
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          No persistent structures recorded inside your cloud workspace profile nodes index. Go generate a path first!
        </p>
      </div>
    );
  }

  return (
    <div className="roadmap-master-scaffold-container max-w-4xl w-full">
      <div className="interactive-glass-card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: '#fff' }}>
          Saved Roadmap Repository Logs
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {savedCoursesList.map((course) => (
            <div 
              key={course._id} 
              onClick={() => onSelectCourse(course)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(15,23,42,0.6)', border: '1px solid #1e293b', borderRadius: '0.75rem', cursor: 'pointer' }}
              className="hover:border-cyan-500/40"
            >
              <div>
                <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{course.title}</h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Domain Class: {course.contentType} | Tracks: {course.modules.length} Modules
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', background: '#1e1b4b', border: '1px solid #312e81', color: '#a78bfa', padding: '0.25rem 0.5rem', borderRadius: '0.35rem', fontWeight: 'bold' }}>
                  {course.level}
                </span>
                <button 
                  onClick={(e) => onDeleteCourse(course._id, e)}
                  className="pill-selector-item" 
                  style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.05)', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}