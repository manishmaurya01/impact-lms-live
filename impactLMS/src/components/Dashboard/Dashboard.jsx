import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  Loader2, 
  History, 
  Award, 
  BookOpen, 
  Layers, 
  FileText, 
  CheckCircle2, 
  TrendingUp,
  Menu,
  Settings,
  Trophy,
  Activity,
  MessageSquare,
  Sparkles,
  BookOpenCheck
} from 'lucide-react';
import './Dashboard.css';

// Component Imports
import DashboardSidebar from './modules/DashboardSidebar';
import AICourseIntake from '../AICourseIntake/AICourseIntake';
import AIAssignmentEngine from '../Asignment/AIAssignmentEngine';
import NotesPage from '../Notes/NotesPage';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Dynamic MongoDB Telemetry States
  const [mongoSavedHistory, setMongoSavedHistory] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalNotes: 0,
    evaluatedAssignments: 0,
    averageQuizScore: 0,
    averageInterviewScore: 0,
    totalInterviewsScheduled: 0,
    totalInterviewsCompleted: 0,
    totalFlaggedInterviews: 0
  });

  const [courseProgressList, setCourseProgressList] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [interviewHistory, setInterviewHistory] = useState([]);

  // Profile Edit Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Student',
    domain: 'Programming',
    commitment: '1 Hour',
    experience: 'Beginner',
    learningStyle: 'Videos'
  });

  const loadProfileFromStorage = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setProfileFormData({
          fullName: user.fullName || user.name || '',
          email: user.email || '',
          password: '',
          role: user.role || 'Student',
          domain: user.domain || 'Programming',
          commitment: user.commitment || '1 Hour',
          experience: user.experience || 'Beginner',
          learningStyle: user.learningStyle || 'Videos'
        });
      }
    } catch (e) {
      console.error("Failed to load user profile in state:", e);
    }
  };

  useEffect(() => {
    loadProfileFromStorage();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchRealtimeDashboardData();
    }
  }, [activeTab]);

  // Combined Fetch Engine for live DB Analytics
  const fetchRealtimeDashboardData = async () => {
    setIsLoading(true);
    try {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        navigate('/login');
        return;
      }

      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}` 
      };

      // Get Aggregated Metrics Counters
      const analyticsResponse = await fetch(`${window.API_URL}/api/dashboard/analytics`, {
        method: 'GET',
        headers: headers
      });
      const analyticsResult = await analyticsResponse.json();
      
      if (analyticsResult.success) {
        if (analyticsResult.analytics) {
          setStats(analyticsResult.analytics);
        }
        if (analyticsResult.courseProgressList) {
          setCourseProgressList(analyticsResult.courseProgressList);
        }
        if (analyticsResult.quizPerformance) {
          setQuizHistory(analyticsResult.quizPerformance);
        }
        if (analyticsResult.interviewPerformance) {
          setInterviewHistory(analyticsResult.interviewPerformance);
        }
      }

      // Get Recent Active Roadmaps for History Grid fallback
      const courseResponse = await fetch(`${window.API_URL}/api/courses`, {
        method: 'GET',
        headers: headers
      });
      const courseResult = await courseResponse.json();
      
      if (courseResult.success && courseResult.data) {
        setMongoSavedHistory(courseResult.data);
      }

    } catch (error) {
      console.error("Dashboard Sync Fault:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsProfileSaving(true);
    try {
      const currentToken = localStorage.getItem('token');
      const response = await fetch(`${window.API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify(profileFormData)
      });
      const result = await response.json();
      if (response.ok && result.success) {
        alert("✅ Profile updated successfully!");
        localStorage.setItem('user', JSON.stringify(result.user));
        // Dispatch custom event to notify Sidebar
        window.dispatchEvent(new Event('userProfileUpdated'));
        setIsProfileModalOpen(false);
        fetchRealtimeDashboardData();
      } else {
        alert(`❌ Update failed: ${result.message || 'Error occurred'}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Server connection error during profile update.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Render Interactive Custom SVG Area Chart for quizzes
  const renderQuizChart = () => {
    if (!quizHistory || quizHistory.length === 0) {
      return (
        <div className="chart-empty-state">
          <Activity size={32} style={{ color: 'var(--text-muted)' }} />
          <p>No quiz scores recorded yet.</p>
          <span style={{ fontSize: '0.75rem' }}>Quizzes will appear here once submitted inside course workspaces.</span>
        </div>
      );
    }

    const width = 500;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = quizHistory.map((q, idx) => {
      const x = paddingLeft + (quizHistory.length > 1 ? (idx / (quizHistory.length - 1)) * chartWidth : chartWidth / 2);
      const y = paddingTop + chartHeight - (q.scorePercentage / 100) * chartHeight;
      return { x, y, ...q };
    });

    const lineD = points.length > 0
      ? `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`
      : '';

    const areaD = points.length > 0
      ? `${lineD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
      : '';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-secondary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Gridlines */}
        {[0, 25, 50, 75, 100].map(val => {
          const y = paddingTop + chartHeight - (val / 100) * chartHeight;
          return (
            <g key={val}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              <text x={paddingLeft - 8} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">{val}%</text>
            </g>
          );
        })}

        {/* Area and Line */}
        {points.length > 0 && (
          <>
            <path d={areaD} fill="url(#areaGrad)" />
            <path d={lineD} fill="none" stroke="var(--accent-secondary)" strokeWidth="2.5" />
          </>
        )}

        {/* Data points */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle 
              cx={p.x} 
              cy={p.y} 
              r="4" 
              fill="var(--bg-secondary)" 
              stroke="var(--accent-secondary)" 
              strokeWidth="2.5" 
              style={{ cursor: 'pointer' }}
            />
            <title>{`${p.quizName}\nScore: ${p.scorePercentage}%\nTopic: ${p.topicName}`}</title>
          </g>
        ))}

        {/* X Axis labels */}
        {points.length > 0 && (
          <>
            <text x={points[0].x} y={height - 10} fill="var(--text-muted)" fontSize="9" textAnchor="start">First Quiz</text>
            {points.length > 1 && (
              <text x={points[points.length - 1].x} y={height - 10} fill="var(--text-muted)" fontSize="9" textAnchor="end">Latest</text>
            )}
          </>
        )}
      </svg>
    );
  };

  // Render Interactive Custom SVG Bar Chart for oral interview accuracy
  const renderInterviewChart = () => {
    const completedInterviews = interviewHistory.filter(i => i.status === 'Completed' || i.avgAccuracy > 0);

    if (completedInterviews.length === 0) {
      return (
        <div className="chart-empty-state">
          <MessageSquare size={32} style={{ color: 'var(--text-muted)' }} />
          <p>No completed interviews yet.</p>
          <span style={{ fontSize: '0.75rem' }}>Oral evaluations will show accuracy bar charts once interviews are completed.</span>
        </div>
      );
    }

    const width = 500;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const N = completedInterviews.length;
    const maxBarWidth = 40;
    const totalGapWidth = chartWidth * 0.4;
    const barWidth = Math.min(maxBarWidth, (chartWidth - totalGapWidth) / N);
    const gap = (chartWidth - N * barWidth) / (N + 1);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        <defs>
          <linearGradient id="cyanBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0.2)" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[0, 25, 50, 75, 100].map(val => {
          const y = paddingTop + chartHeight - (val / 100) * chartHeight;
          return (
            <g key={val}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              <text x={paddingLeft - 8} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">{val}%</text>
            </g>
          );
        })}

        {/* Bars */}
        {completedInterviews.map((item, idx) => {
          const x = paddingLeft + gap + idx * (barWidth + gap);
          const barHeight = (item.avgAccuracy / 100) * chartHeight;
          const y = height - paddingBottom - barHeight;

          return (
            <g key={idx}>
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={barHeight} 
                fill="url(#cyanBarGrad)" 
                rx="4"
                ry="4"
              />
              <text x={x + barWidth / 2} y={y - 6} fill="var(--text-main)" fontSize="10" fontWeight="bold" textAnchor="middle">
                {item.avgAccuracy}%
              </text>
              <text x={x + barWidth / 2} y={height - 12} fill="var(--text-muted)" fontSize="9" textAnchor="middle">
                {`Int ${idx + 1}`}
              </text>
              <title>{`Interview #${idx + 1}\nDifficulty: ${item.difficulty}\nAccuracy: ${item.avgAccuracy}%`}</title>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="lms-premium-viewport">
      
      {/* Sidebar Controller Integration */}
      <DashboardSidebar 
        onLogout={handleLogout} 
        currentActiveTab={activeTab}
        onTabChange={(tabName) => setActiveTab(tabName)} 
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(4px)', zIndex: 998 }}
        />
      )}

      {/* Content Window */}
      <div className="lms-content-window">
        
        {/* Mobile Header Bar */}
        <div className="mobile-header-bar">
          <div className="mobile-brand-logo">
            <span>Impact LMS</span>
          </div>
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="mobile-menu-btn"
          >
            <Menu size={18} />
          </button>
        </div>

        <main className={`lms-workspace-stage ${activeTab !== 'dashboard' ? 'fullscreen-tab' : ''}`}>
          
          {/* === ANALYTICS DASHBOARD LAYOUT === */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-layout-wrapper">
              
              {/* Welcome Hero Card with profile editor trigger */}
              <div className="welcome-hero-card">
                <div className="ambient-glow-sphere"></div>
                <div className="welcome-row-container">
                  <div className="hero-text-content">
                    <h2>Welcome back, {profileFormData.fullName || 'Learner'}</h2>
                    <p>Track your courses, quizzes, and AI evaluations in one centralized place.</p>
                  </div>
                  <button 
                    className="dashboard-edit-profile-btn"
                    onClick={() => {
                      loadProfileFromStorage();
                      setIsProfileModalOpen(true);
                    }}
                  >
                    <Settings size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Edit Profile
                  </button>
                </div>
              </div>

              {/* METRICS COUNTER PANELS */}
              <div className="analytics-metrics-grid">
                
                <div className="metric-data-card">
                  <div className="metric-header">
                    <span className="metric-title">Courses</span>
                    <BookOpen className="icon-blue" size={22} />
                  </div>
                  <h2 className="metric-number">{stats.totalCourses}</h2>
                  <p className="metric-footer-text">Roadmaps generated</p>
                </div>

                <div className="metric-data-card">
                  <div className="metric-header">
                    <span className="metric-title">Notes</span>
                    <FileText className="icon-amber" size={22} />
                  </div>
                  <h2 className="metric-number">{stats.totalNotes}</h2>
                  <p className="metric-footer-text">Saved notes</p>
                </div>

                <div className="metric-data-card">
                  <div className="metric-header">
                    <span className="metric-title">Assignments</span>
                    <CheckCircle2 className="icon-green" size={22} />
                  </div>
                  <h2 className="metric-number">{stats.evaluatedAssignments}</h2>
                  <p className="metric-footer-text">Assignments reviewed</p>
                </div>

                <div className="metric-data-card">
                  <div className="metric-header">
                    <span className="metric-title">Average Quiz Score</span>
                    <TrendingUp className="icon-purple" size={22} />
                  </div>
                  <h2 className="metric-number">{stats.averageQuizScore}%</h2>
                  <p className="metric-footer-text">Overall quiz performance</p>
                </div>

                <div className="metric-data-card">
                  <div className="metric-header">
                    <span className="metric-title">Oral Interview Score</span>
                    <Award className="icon-blue" size={22} style={{ color: '#06b6d4' }} />
                  </div>
                  <h2 className="metric-number">{stats.averageInterviewScore}%</h2>
                  <p className="metric-footer-text">Avg candidate accuracy</p>
                </div>

              </div>

              {/* DETAILED STATS GRID */}
              <div className="dashboard-detailed-grid">
                
                {/* Course-wise Progress card list */}
                <div className="dashboard-panel-card">
                  <div className="panel-card-header">
                    <h3><BookOpenCheck size={18} style={{ color: 'var(--accent-secondary)' }} /> Course Progress Analysis</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Realtime database telemetry</span>
                  </div>
                  <div className="progress-list-container">
                    {isLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', color: 'var(--text-muted)', gap: '0.5rem' }}>
                        <Loader2 className="spinner-icon" size={32} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Fetching progress details...</span>
                      </div>
                    ) : courseProgressList.length === 0 ? (
                      <div className="chart-empty-state">
                        <Layers size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                        <p>No active courses found.</p>
                        <button 
                          className="btn-resume-course-inline" 
                          style={{ alignSelf: 'center', marginTop: '0.5rem' }}
                          onClick={() => navigate('/assignments')}
                        >
                          Generate a Course &rarr;
                        </button>
                      </div>
                    ) : (
                      courseProgressList.map(course => (
                        <div key={course.courseId} className="progress-item-card">
                          <div className="progress-item-header">
                            <div style={{ flex: 1 }}>
                              <h4>{course.title}</h4>
                              <div className="progress-stats-row" style={{ marginTop: '0.4rem' }}>
                                <span>Modules: <strong>{course.completedModules} / {course.totalModules} Complete</strong></span>
                                <span>Remaining: <strong>{course.remainingModules}</strong></span>
                              </div>
                            </div>
                            <span className="course-difficulty-badge">{course.level}</span>
                          </div>

                          <div className="progress-bar-wrapper">
                            <div className="progress-bar-bg">
                              <div className="progress-bar-fill" style={{ width: `${course.percentProgress}%` }} />
                            </div>
                            <span className="progress-percent-label">{course.percentProgress}%</span>
                          </div>

                          <button 
                            className="btn-resume-course-inline"
                            onClick={() => navigate('/courses', { state: { courseId: course.courseId, autoLaunch: true } })}
                          >
                            Resume Course →
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* System Info Box & Quick metrics stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="quick-stats-container-upgraded" style={{ margin: 0, height: 'auto', flex: 1 }}>
                    <div className="system-status-header">
                      <h4>Learning Platform Status</h4>
                    </div>
                    <div className="status-item-line">
                      <span className="status-bullet green"></span>
                      <p>AI Core: Active (Gemini-2.5)</p>
                    </div>
                    <div className="status-item-line">
                      <span className="status-bullet blue"></span>
                      <p>Database: Connected (MongoDB Cloud)</p>
                    </div>
                    <div className="status-item-line">
                      <span className="status-bullet purple"></span>
                      <p>Access Security: SSL & JWT Enabled</p>
                    </div>
                  </div>

                  <div className="dashboard-panel-card" style={{ flex: 2 }}>
                    <div className="panel-card-header">
                      <h3><Award size={18} style={{ color: 'var(--accent-secondary)' }} /> Achievements Summary</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '0.5rem', borderRadius: '8px', color: '#06b6d4' }}>
                          <MessageSquare size={20} />
                        </div>
                        <div>
                          <h5 style={{ margin: '0 0 0.1rem 0', fontSize: '0.9rem', fontWeight: '700' }}>Interviews Scheduled</h5>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats.totalInterviewsScheduled} scheduled / {stats.totalInterviewsCompleted} completed</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent-danger)' }}>
                          <Activity size={20} />
                        </div>
                        <div>
                          <h5 style={{ margin: '0 0 0.1rem 0', fontSize: '0.9rem', fontWeight: '700' }}>Flagged Warnings</h5>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats.totalFlaggedInterviews} security warnings flagged</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* CHARTS CONTAINER GRID */}
              <div className="dashboard-detailed-grid">
                
                {/* QUIZ SCORE TREND CHART */}
                <div className="dashboard-panel-card">
                  <div className="panel-card-header">
                    <h3><Trophy size={18} style={{ color: 'var(--accent-secondary)' }} /> Quiz Performance History</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Interactive progress timeline</span>
                  </div>
                  <div className="svg-chart-container">
                    {renderQuizChart()}
                  </div>
                </div>

                {/* INTERVIEW ACCURACY CHART */}
                <div className="dashboard-panel-card">
                  <div className="panel-card-header">
                    <h3><MessageSquare size={18} style={{ color: '#06b6d4' }} /> AI Interview Accuracy Score</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Speech evaluation benchmarks</span>
                  </div>
                  <div className="svg-chart-container">
                    {renderInterviewChart()}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB VIEWS */}
          {activeTab === 'generate' && <AICourseIntake />}
          {activeTab === 'courses' && <AICourseIntake />}
          {activeTab === 'assignments' && <AIAssignmentEngine />}
          {activeTab === 'notes' && <NotesPage />}

          {/* ADAPTIVE QUIZZES PLUG WINDOW */}
          {activeTab === 'quizzes' && (
            <div className="placeholder-tab-view">
              <h2>Quizzes Dashboard</h2>
              <p>Practice quizzes are being prepared for your active courses.</p>
              <div className="pulse-loader"></div>
            </div>
          )}

        </main>
      </div>

      {/* Edit Profile Modal Popup */}
      {isProfileModalOpen && (
        <div className="profile-modal-overlay" onClick={() => setIsProfileModalOpen(false)}>
          <div className="profile-modal-card" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Edit Profile & Preferences</h3>
              <button className="close-modal-btn" onClick={() => setIsProfileModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleProfileSubmit} className="profile-modal-form">
              <div className="form-group-row">
                <div className="form-group-col">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={profileFormData.fullName} 
                    onChange={handleProfileChange} 
                    required 
                  />
                </div>
                <div className="form-group-col">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={profileFormData.email} 
                    onChange={handleProfileChange} 
                    required 
                  />
                </div>
              </div>
              <div className="form-group-row">
                <div className="form-group-col">
                  <label>New Password (leave blank to keep current)</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={profileFormData.password} 
                    onChange={handleProfileChange} 
                    placeholder="••••••" 
                  />
                </div>
                <div className="form-group-col">
                  <label>User Role</label>
                  <select name="role" value={profileFormData.role} onChange={handleProfileChange}>
                    <option value="Student">Student</option>
                    <option value="Mentor/Teacher">Mentor/Teacher</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="form-group-row">
                <div className="form-group-col">
                  <label>Domain Preference</label>
                  <input 
                    type="text" 
                    name="domain" 
                    value={profileFormData.domain} 
                    onChange={handleProfileChange} 
                  />
                </div>
                <div className="form-group-col">
                  <label>Commitment Level</label>
                  <select name="commitment" value={profileFormData.commitment} onChange={handleProfileChange}>
                    <option value="1 Hour">1 Hour / day</option>
                    <option value="2 Hours">2 Hours / day</option>
                    <option value="3 Hours">3 Hours / day</option>
                    <option value="4+ Hours">4+ Hours / day</option>
                  </select>
                </div>
              </div>
              <div className="form-group-row">
                <div className="form-group-col">
                  <label>Experience Layer</label>
                  <select name="experience" value={profileFormData.experience} onChange={handleProfileChange}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className="form-group-col">
                  <label>Learning Style</label>
                  <select name="learningStyle" value={profileFormData.learningStyle} onChange={handleProfileChange}>
                    <option value="Videos">Videos</option>
                    <option value="Practical Labs">Practical Labs</option>
                    <option value="Theory/Reading">Theory/Reading</option>
                    <option value="Mixed Mode">Mixed Mode</option>
                  </select>
                </div>
              </div>
              <div className="form-actions-row">
                <button type="button" className="btn-cancel-modal" onClick={() => setIsProfileModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-save-profile" disabled={isProfileSaving}>
                  {isProfileSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}