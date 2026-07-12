import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, LayoutDashboard, Sparkles, FolderOpen, 
  BookOpen, LogOut, BadgeCheck, MessageSquareCode 
} from 'lucide-react';

export default function DashboardSidebar({ onLogout, isMobileOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  
  // 🚀 SIDEBAR COLLAPSIBLE STATE HANDLING 
  const [isExpanded, setIsExpanded] = useState(true);

  // Helper utility to strictly check and assign active CSS class paths
  const isActive = (routePath) => pathname === routePath ? 'is-active' : '';

  return (
    <aside 
      className={`lms-sidebar-container ${isExpanded ? 'expanded' : 'collapsed'} ${isMobileOpen ? 'mobile-open' : ''}`} 
      style={{
        width: isExpanded ? '280px' : '78px',
        transition: 'width 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f172a',
        borderRight: '1px solid rgba(30, 41, 59, 0.8)',
        padding: isExpanded ? '1.25rem 0.85rem' : '1.25rem 0',
        height: '100vh',
        position: 'relative',
        zIndex: 100,
        boxShadow: '10px 0 30px rgba(0,0,0,0.4)',
        overflowX: 'hidden',
        alignItems: 'center'
      }}
    >
      {/* 🛠️ CONTROL HEADER PANEL TRIGGER */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isExpanded ? 'space-between' : 'center', 
        marginBottom: '2.5rem', 
        width: '100%',
        padding: isExpanded ? '0' : '0 0.5rem',
        boxSizing: 'border-box'
      }}>
        {isExpanded && (
          <div 
            className="sidebar-brand-block" 
            onClick={() => navigate('/dashboard')} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <div className="brand-logo-spark" style={{ color: '#06B6D4', display: 'flex', alignItems: 'center' }}><Sparkles size={20} /></div>
            <div className="brand-title-text" style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#fff', lineTone: '1.1' }}>LuminaLearn</h2>
              <span style={{ fontSize: '0.65rem', color: '#8B5CF6', letterSpacing: '0.1em', fontWeight: 'bold' }}>Studio Core</span>
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: '0.5rem', 
              padding: '0.5rem', 
              color: '#cbd5e1', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              outline: 'none',
              width: '38px',
              height: '38px'
            }}
          >
            {isExpanded ? <X size={18} /> : <Menu size={18} />}
          </button>
          
          <button
            onClick={onCloseMobile}
            className="md:hidden"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              color: '#f87171',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              width: '38px',
              height: '38px'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* 🚀 ALL DYNAMIC CORE NAVIGATION LINKS */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexGrow: 1, width: '100%', padding: isExpanded ? '0' : '0 10px', boxSizing: 'border-box' }}>
        
        {/* 1. Dashboard Core */}
        <button 
          onClick={() => navigate('/dashboard')} 
          className={`nav-link-item ${isActive('/dashboard')}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'flex-start' : 'center', gap: isExpanded ? '0.85rem' : '0', width: '100%', padding: '0.85rem', whiteSpace: 'nowrap', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <LayoutDashboard size={18} style={{ flexShrink: 0 }} />
          {isExpanded && <span>Dashboard Hub</span>}
        </button>

        {/* 2. Generate Course / Path (वापस डाल दिया है) */}
        <button 
          onClick={() => navigate('/assignments')} 
          className={`nav-link-item ${isActive('/assignments')}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'flex-start' : 'center', gap: isExpanded ? '0.85rem' : '0', width: '100%', padding: '0.85rem', whiteSpace: 'nowrap', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <Sparkles size={18} style={{ color: pathname === '/assignments' ? '#06B6D4' : 'inherit', flexShrink: 0 }} />
          {isExpanded && <span>Generate Course</span>}
        </button>

        {/* 3. AI Interviewer */}
        <button 
          onClick={() => navigate('/interview')} 
          className={`nav-link-item ${isActive('/interview')}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'flex-start' : 'center', gap: isExpanded ? '0.85rem' : '0', width: '100%', padding: '0.85rem', whiteSpace: 'nowrap', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <MessageSquareCode size={18} style={{ color: pathname === '/interview' ? '#06B6D4' : 'inherit', flexShrink: 0 }} />
          {isExpanded && <span>AI Interviewer</span>}
        </button>

        {/* 4. Manage Courses & History */}
        <button 
          onClick={() => navigate('/courses')} 
          className={`nav-link-item ${isActive('/courses')}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'flex-start' : 'center', gap: isExpanded ? '0.85rem' : '0', width: '100%', padding: '0.85rem', whiteSpace: 'nowrap', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <FolderOpen size={18} style={{ color: pathname === '/courses' ? '#8B5CF6' : 'inherit', flexShrink: 0 }} />
          {isExpanded && <span>Courses & History</span>}
        </button>

        {/* 5. Cloud Notes Repository */}
        <button 
          onClick={() => navigate('/notes')} 
          className={`nav-link-item ${isActive('/notes')}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'flex-start' : 'center', gap: isExpanded ? '0.85rem' : '0', width: '100%', padding: '0.85rem', whiteSpace: 'nowrap', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <BookOpen size={18} style={{ flexShrink: 0 }} />
          {isExpanded && <span>Cloud Notes</span>}
        </button>
      </nav>

      {/* 👥 ACCOUNT DATA PROFILE NODES FOOTER */}
      <div className="sidebar-footer-profile-node" style={{ borderTop: '1px solid rgba(30, 41, 59, 0.8)', paddingTop: '1.25rem', width: '100%', paddingLeft: isExpanded ? '0.5rem' : '0', paddingRight: isExpanded ? '0.5rem' : '0', boxSizing: 'border-box' }}>
        {isExpanded ? (
          <div className="profile-info-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', whiteSpace: 'nowrap' }}>
            <div className="user-avatar-glow-wrapper" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', padding: '2px', background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)' }}>
              <div className="user-avatar-initials" style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>MM</div>
            </div>
            <div className="user-meta-credentials" style={{ display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Manish Maurya</h4>
              <span className="user-role" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.65rem', color: '#94a3b8' }}>
                Verified Student <BadgeCheck size={12} style={{ color: '#06B6D4' }} />
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', width: '100%' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#fff' }}>MM</div>
          </div>
        )}
        
        <button 
          onClick={onLogout} 
          className="btn-logout-sidebar"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: isExpanded ? '0.5rem' : '0', 
            width: isExpanded ? '100%' : '42px', 
            height: isExpanded ? 'auto' : '42px',
            padding: isExpanded ? '0.75rem' : '0', 
            whiteSpace: 'nowrap', 
            background: 'rgba(239, 68, 68, 0.05)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            color: '#ef4444', 
            borderRadius: '0.5rem', 
            cursor: 'pointer',
            margin: '0 auto'
          }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} /> 
          {isExpanded && <span>Terminate Session</span>}
        </button>
      </div>
    </aside>
  );
}