import React from 'react';

export default function CourseList({ savedCoursesList, onSelectCourse, onDeleteCourse }) {
  if (savedCoursesList.length === 0) {
    return (
      <div className="roadmap-master-scaffold-container max-w-4xl w-full">
        <div className="interactive-glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            No saved courses found. Go generate an AI course roadmap first!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="roadmap-master-scaffold-container max-w-6xl w-full">
      <div className="interactive-glass-card" style={{ background: 'transparent', border: 'none', padding: 0 }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📂 My Saved Courses ({savedCoursesList.length})
        </h2>
        
        <div className="historical-courses-matrix-grid">
          {savedCoursesList.map((course) => {
            // Calculate progress percent
            let totalTopics = 0;
            course.modules?.forEach(m => { totalTopics += m.topics ? m.topics.length : 0; });
            const completedCount = course.completedTopics ? course.completedTopics.length : 0;
            const progress = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

            return (
              <div key={course._id} className="matrix-course-item-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div className="matrix-course-meta-header">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{course.title}</h3>
                  <span className="matrix-level-badge">{course.level}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Curriculum Modules</span>
                    <span>{course.modules.length} Modules</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Syllabus Progress</span>
                    <strong>{progress}%</strong>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '6px' }}>
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="matrix-course-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={(e) => onDeleteCourse(course._id, e)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    🗑️ Delete Course
                  </button>
                  <button 
                    className="btn-open-matrix"
                    onClick={() => onSelectCourse(course)}
                  >
                    Resume Study &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}