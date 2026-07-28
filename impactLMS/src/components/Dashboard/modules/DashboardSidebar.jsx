import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, LayoutDashboard, Sparkles, FolderOpen, 
  BookOpen, LogOut, BadgeCheck, MessageSquareCode, Sun, Moon 
} from 'lucide-react';

export default function DashboardSidebar({ onLogout, isMobileOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  
  // Responsive sidebar collapsible state
  const [isExpanded, setIsExpanded] = useState(true);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');
  const [userProfile, setUserProfile] = useState({
    fullName: 'Guest User',
    role: 'Student',
    initials: 'GU'
  });

  useEffect(() => {
    const loadUserProfile = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const fullName = user.fullName || user.name || 'User';
          const role = user.role || 'Student';
          const initials = fullName
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase() || 'US';
          
          setUserProfile({ fullName, role, initials });
        }
      } catch (e) {
        console.error("Failed to parse user profile details:", e);
      }
    };

    loadUserProfile();
    window.addEventListener('userProfileUpdated', loadUserProfile);
    return () => {
      window.removeEventListener('userProfileUpdated', loadUserProfile);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  };

  const isActive = (routePath) => pathname === routePath ? 'is-active' : '';

  return (
    <aside 
      className={`lms-sidebar-container ${isExpanded ? 'expanded' : 'collapsed'} ${isMobileOpen ? 'mobile-open' : ''}`} 
      style={{ width: isExpanded ? '280px' : '78px' }}
    >
      {/* Header Panel */}
      <div className="sidebar-header-block" style={{ justifyContent: isExpanded ? 'space-between' : 'center' }}>
        {isExpanded && (
          <div 
            className="sidebar-brand-block" 
            onClick={() => navigate('/dashboard')} 
          >
            <div className="brand-logo-spark" style={{ color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center' }}><Sparkles size={20} /></div>
            <div className="brand-title-text" style={{ display: 'flex', flexDirection: 'column' }}>
              <h2>Impact LMS</h2>
              <span>Learning Platform</span>
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {/* Collapse/Expand toggle button - Desktop only */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="sidebar-toggle-btn hidden md:flex"
          >
            {isExpanded ? <X size={18} /> : <Menu size={18} />}
          </button>
          
          {/* Mobile slide close button - Mobile only */}
          <button
            onClick={onCloseMobile}
            className="sidebar-toggle-btn flex md:hidden"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav" style={{ padding: isExpanded ? '0' : '0 10px' }}>
        
        {/* 1. Dashboard Core */}
        <button 
          onClick={() => navigate('/dashboard')} 
          className={`nav-link-item ${isActive('/dashboard')}`}
        >
          <LayoutDashboard size={18} style={{ flexShrink: 0 }} />
          {isExpanded && <span>Dashboard</span>}
        </button>

        {/* 2. Generate Course */}
        <button 
          onClick={() => navigate('/generate-course')} 
          className={`nav-link-item ${isActive('/generate-course')}`}
        >
          <Sparkles size={18} style={{ flexShrink: 0 }} />
          {isExpanded && <span>Generate Course</span>}
        </button>

        {/* 3. AI Interviewer */}
        <button 
          onClick={() => navigate('/interview')} 
          className={`nav-link-item ${isActive('/interview')}`}
        >
          <MessageSquareCode size={18} style={{ flexShrink: 0 }} />
          {isExpanded && <span>AI Interviewer</span>}
        </button>

        {/* 4. Courses & History */}
        <button 
          onClick={() => navigate('/courses')} 
          className={`nav-link-item ${isActive('/courses')}`}
        >
          <FolderOpen size={18} style={{ flexShrink: 0 }} />
          {isExpanded && <span>Courses & History</span>}
        </button>

        {/* 5. Cloud Notes Repository */}
        <button 
          onClick={() => navigate('/notes')} 
          className={`nav-link-item ${isActive('/notes')}`}
        >
          <BookOpen size={18} style={{ flexShrink: 0 }} />
          {isExpanded && <span>My Notes</span>}
        </button>
      </nav>

      {/* Account Profile Footer */}
      <div 
        className="sidebar-footer-profile-node" 
        style={{ 
          paddingLeft: isExpanded ? '0.5rem' : '0', 
          paddingRight: isExpanded ? '0.5rem' : '0' 
        }}
      >
        {isExpanded ? (
          <div className="profile-info-row">
            <div className="user-avatar-glow-wrapper">
              <div className="user-avatar-initials">
                {userProfile.initials}
              </div>
            </div>
            <div className="user-meta-credentials">
              <h4>{userProfile.fullName}</h4>
              <span className="user-role">
                {userProfile.role} <BadgeCheck size={12} style={{ color: 'var(--accent-secondary)' }} />
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', width: '100%' }}>
            <div className="user-avatar-glow-wrapper">
              <div className="user-avatar-initials">
                {userProfile.initials}
              </div>
            </div>
          </div>
        )}
        
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          className="nav-link-item"
          style={{ 
            marginBottom: '0.75rem', 
            justifyContent: isExpanded ? 'flex-start' : 'center', 
            padding: isExpanded ? '0.8rem 1rem' : '0.8rem 0'
          }}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun size={18} style={{ flexShrink: 0 }} /> : <Moon size={18} style={{ flexShrink: 0 }} />}
          {isExpanded && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        
        {/* Logout Button */}
        <button 
          onClick={onLogout} 
          className="btn-logout-sidebar"
        >
          <LogOut size={16} style={{ flexShrink: 0 }} /> 
          {isExpanded && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}