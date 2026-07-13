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
  Menu
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
    averageQuizScore: 0
  });

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
      
      if (analyticsResult.success && analyticsResult.analytics) {
        setStats(analyticsResult.analytics);
      }

      // Get Recent Active Roadmaps for History Grid
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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
              
              {/* Welcome Hero Card */}
              <div className="welcome-hero-card">
                <div className="ambient-glow-sphere"></div>
                <div className="hero-text-content">
                  <h2>Welcome back to Impact LMS</h2>
                  <p>Track your courses, quizzes, and AI evaluations in one centralized place.</p>
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

              </div>

              {/* DUAL STATS GRID */}
              <div className="dashboard-grid-layout">
                
                {/* Active Course Status */}
                <div className="target-node-hero-card">
                  <div className="hero-status-row">
                    <h3>Active Course</h3>
                    <span className="status-pill-active">Connected</span>
                  </div>
                  
                  <div className="hero-action-container">
                    <h2>
                      {mongoSavedHistory.length > 0 
                        ? mongoSavedHistory[0].title 
                        : 'No active courses yet.'}
                    </h2>
                    <p className="hero-subtext">
                      {mongoSavedHistory.length > 0 
                        ? `Contains ${mongoSavedHistory[0].modules?.length || 0} modules.`
                        : 'Open the course generator to build your first learning roadmap.'}
                    </p>
                    <button 
                      className="btn-resume-track" 
                      disabled={mongoSavedHistory.length === 0} 
                      onClick={() => navigate('/courses')}
                    >
                      Continue Learning →
                    </button>
                  </div>
                </div>

                {/* System Info Box */}
                <div className="quick-stats-container-upgraded">
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

              </div>

              {/* RECENT COURSE LIST */}
              <div className="history-registry-container">
                <h3 className="registry-title"><History size={18} /> Recent Courses</h3>
                
                {isLoading ? (
                  <div className="loading-state-panel">
                    <Loader2 className="spinner-icon" size={36} />
                    <p>Loading courses...</p>
                  </div>
                ) : mongoSavedHistory.length === 0 ? (
                  <div className="empty-state-panel">
                    <Layers size={40} className="empty-icon" />
                    <p>No courses found. Go to 'Generate Course' to create one!</p>
                  </div>
                ) : (
                  <div className="course-history-grid">
                    {mongoSavedHistory.map((courseRow) => (
                      <div key={courseRow._id} className="history-course-row-card" onClick={() => navigate('/courses')}>
                        <div className="row-meta-info">
                          <h4>{courseRow.title}</h4>
                          <span>Difficulty: <strong>{courseRow.level || 'Beginner'}</strong></span>
                        </div>
                        <span className="load-matrix-txt">Open →</span>
                      </div>
                    ))}
                  </div>
                )}
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
    </div>
  );
}