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
  
  // 100% Real-Time MongoDB Unified Telemetry States
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

      // 📡 Request Node 1: Get Aggregated Real-Time Metrics Counters
      const analyticsResponse = await fetch(`${window.API_URL}/api/dashboard/analytics`, {
        method: 'GET',
        headers: headers
      });
      const analyticsResult = await analyticsResponse.json();
      
      if (analyticsResult.success && analyticsResult.analytics) {
        setStats(analyticsResult.analytics);
      }

      // 📡 Request Node 2: Get Recent Active Roadmap Logs for History Grid
      const courseResponse = await fetch(`${window.API_URL}/api/courses`, {
        method: 'GET',
        headers: headers
      });
      const courseResult = await courseResponse.json();
      
      if (courseResult.success && courseResult.data) {
        setMongoSavedHistory(courseResult.data);
      }

    } catch (error) {
      console.error("❌ [DASHBOARD_LIVE_METRICS_CRASH] Pipeline Sync Fault:", error);
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
      
      {/* 🔒 Sidebar Controller Integration */}
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

      {/* 🚀 Dynamic Content Core Stage */}
      <div className="lms-content-window">
        
        {/* Mobile Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.8rem 1.5rem', width: '100%', boxSizing: 'border-box' }} className="md:hidden">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ color: '#06b6d4', fontWeight: 900, fontSize: '1rem' }}>LuminaLearn</span>
          </div>
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.5rem', padding: '0.5rem', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Menu size={18} />
          </button>
        </div>

        <main className={`lms-workspace-stage ${activeTab !== 'dashboard' ? 'fullscreen-tab' : ''}`}>
          
          {/* === 📊 ANALYTICS DASHBOARD LAYOUT === */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-layout-wrapper">
              
              {/* Premium Header Banner Grid */}
              <div className="welcome-hero-card">
                <div className="ambient-glow-sphere"></div>
                <div className="hero-text-content">
                  <h2>Welcome back to LuminaLearn Matrix</h2>
                  <p>Real-time analytics stream is active. Your courses, evaluated code blocks, and adaptive performance scores are fetched live from MongoDB Atlas clusters.</p>
                </div>
              </div>

              {/* 📈 REAL METRICS COUNTER PANELS */}
              <div className="analytics-metrics-grid">
                
                <div className="metric-data-card">
                  <div className="metric-header">
                    <span className="metric-title">Generated Paths</span>
                    <BookOpen className="icon-blue" size={22} />
                  </div>
                  <h2 className="metric-number">{stats.totalCourses}</h2>
                  <p className="metric-footer-text">Live dynamic roadmaps</p>
                </div>

                <div className="metric-data-card">
                  <div className="metric-header">
                    <span className="metric-title">Workspace Notes</span>
                    <FileText className="icon-amber" size={22} />
                  </div>
                  <h2 className="metric-number">{stats.totalNotes}</h2>
                  <p className="metric-footer-text">Total documented markdown files</p>
                </div>

                <div className="metric-data-card">
                  <div className="metric-header">
                    <span className="metric-title">AI Evaluated Code</span>
                    <CheckCircle2 className="icon-green" size={22} />
                  </div>
                  <h2 className="metric-number">{stats.evaluatedAssignments}</h2>
                  <p className="metric-footer-text">Tasks graded by Gemini Engine</p>
                </div>

                <div className="metric-data-card">
                  <div className="metric-header">
                    <span className="metric-title">Avg Quiz Score</span>
                    <TrendingUp className="icon-purple" size={22} />
                  </div>
                  <h2 className="metric-number">{stats.averageQuizScore}%</h2>
                  <p className="metric-footer-text">Aggregate calculation registry</p>
                </div>

              </div>

              {/* 🔄 CENTRAL PIPELINE CONTROLS */}
              <div className="dashboard-grid-layout">
                
                {/* Active Cluster Pathway Status Node */}
                <div className="target-node-hero-card">
                  <div className="hero-status-row">
                    <h3><Database size={18} /> Primary Cluster Endpoint</h3>
                    <span className="status-pill-active">Data Synchronized</span>
                  </div>
                  
                  <div className="hero-action-container">
                    <h2>
                      {mongoSavedHistory.length > 0 
                        ? mongoSavedHistory[0].title 
                        : 'No active deployment pathways tracked.'}
                    </h2>
                    <p className="hero-subtext">
                      {mongoSavedHistory.length > 0 
                        ? `Architecture Profile: Contains ${mongoSavedHistory[0].modules?.length || 0} smart AI educational modules.`
                        : 'Open the course generation module to populate real-time nodes.'}
                    </p>
                    <button 
                      className="btn-resume-track" 
                      disabled={mongoSavedHistory.length === 0} 
                      onClick={() => setActiveTab('courses')}
                    >
                      Resume Learning Engine &rarr;
                    </button>
                  </div>
                </div>

                {/* Gateway Configurations Status Box */}
                <div className="quick-stats-container-upgraded">
                  <div className="system-status-header">
                    <h4>Telemetry Architecture Nodes</h4>
                  </div>
                  <div className="status-item-line">
                    <span className="status-bullet green"></span>
                    <p><strong>AI Processing Model:</strong> Gemini-2.5-Flash Core Connected</p>
                  </div>
                  <div className="status-item-line">
                    <span className="status-bullet blue"></span>
                    <p><strong>Database Target:</strong> MongoDB Cloud Atlas Mesh</p>
                  </div>
                  <div className="status-item-line">
                    <span className="status-bullet purple"></span>
                    <p><strong>Client Security:</strong> Enforced Bearer JWT Auth Parameter</p>
                  </div>
                </div>

              </div>

              {/* 📑 RECENT HISTORY LOGS FROM DATABASE */}
              <div className="history-registry-container">
                <h3 className="registry-title"><History size={18} /> Account Index Database Registries</h3>
                
                {isLoading ? (
                  <div className="loading-state-panel">
                    <Loader2 className="spinner-icon" size={36} />
                    <p>Parsing active indexes directly from the backend cluster array...</p>
                  </div>
                ) : mongoSavedHistory.length === 0 ? (
                  <div className="empty-state-panel">
                    <Layers size={40} className="empty-icon" />
                    <p>No architecture workflows linked to your profile token.</p>
                  </div>
                ) : (
                  <div className="course-history-grid">
                    {mongoSavedHistory.map((courseRow) => (
                      <div key={courseRow._id} className="history-course-row-card" onClick={() => setActiveTab('courses')}>
                        <div className="row-meta-info">
                          <h4>{courseRow.title}</h4>
                          <span>Difficulty: <strong>{courseRow.level || 'Beginner'}</strong> | Tracks: {courseRow.contentType || 'Technical'}</span>
                        </div>
                        <span className="load-matrix-txt">[MOUNT_NODE]</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* === 🎛️ MULTI-ROUTER TAB VIEWS === */}
          {activeTab === 'generate' && <AICourseIntake />}
          {activeTab === 'courses' && <AICourseIntake />}
          {activeTab === 'assignments' && <AIAssignmentEngine />}
          {activeTab === 'notes' && <NotesPage />}

          {/* === 🧪 ADAPTIVE QUIZZES PLUG WINDOW === */}
          {activeTab === 'quizzes' && (
            <div className="placeholder-tab-view">
              <h2>AI Adaptive Quizzes Terminal</h2>
              <p>Dynamic assessment pipelines are parsing telemetry data nodes from MongoDB...</p>
              <div className="pulse-loader"></div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}