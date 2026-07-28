import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  BookOpenCheck,
  Flame,
  Clock,
  Plus,
  Search,
  Bell,
  CheckCircle
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
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
    totalFlaggedInterviews: 0,
    xp: 0,
    level: 1,
    xpProgressPercent: 0,
    xpToNextLevel: 300,
    learningHours: 0,
    currentStreak: 0,
    longestStreak: 0,
    certificatesCount: 0,
    modulesCompletedCount: 0
  });

  const [courseProgressList, setCourseProgressList] = useState([]);
  const [calendarData, setCalendarData] = useState({});
  
  // Interactive global filter states
  const [selectedCourse, setSelectedCourse] = useState('');
  const [timeRange, setTimeRange] = useState('All');
  const [courseStatus, setCourseStatus] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [activityType, setActivityType] = useState('All');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [quizHistory, setQuizHistory] = useState([]);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [weeklyStudyHours, setWeeklyStudyHours] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [aiInsights, setAiInsights] = useState({
    weakestTopics: [],
    strongestTopics: [],
    suggestedRevisionTopics: [],
    recommendedNextCourse: '',
    completionPrediction: '',
    learningConsistency: ''
  });

  // Certificate Modal State
  const [selectedCertCourse, setSelectedCertCourse] = useState(null);

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

  // Fetch Course List once on mount or activeTab transition
  const fetchCourseList = async () => {
    try {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) return;

      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}` 
      };

      const courseResponse = await fetch(`${window.API_URL}/api/courses`, {
        method: 'GET',
        headers: headers
      });
      const courseResult = await courseResponse.json();
      
      if (courseResult.success && courseResult.data) {
        setMongoSavedHistory(courseResult.data);
        
        // Auto-select latest active course by default if none is selected
        if (courseResult.data.length > 0 && !selectedCourse) {
          const sorted = [...courseResult.data].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
          setSelectedCourse(sorted[0]._id);
        }
      }
    } catch (error) {
      console.error("Course Sync Fault:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchCourseList();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'dashboard' && selectedCourse) {
      fetchRealtimeDashboardData();
    }
  }, [activeTab, selectedCourse, timeRange, courseStatus, difficulty, activityType, customStartDate, customEndDate, searchQuery]);

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

      const queryParams = new URLSearchParams({
        courseId: selectedCourse,
        timeRange,
        status: courseStatus,
        difficulty,
        activityType,
        startDate: customStartDate,
        endDate: customEndDate,
        search: searchQuery
      });

      // Get Aggregated Metrics Counters
      const analyticsResponse = await fetch(`${window.API_URL}/api/dashboard/analytics?${queryParams.toString()}`, {
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
        if (analyticsResult.heatmapData) {
          setHeatmapData(analyticsResult.heatmapData);
        }
        if (analyticsResult.weeklyStudyHours) {
          setWeeklyStudyHours(analyticsResult.weeklyStudyHours);
        }
        if (analyticsResult.calendarData) {
          setCalendarData(analyticsResult.calendarData);
        }
        if (analyticsResult.recentActivities) {
          setRecentActivities(analyticsResult.recentActivities);
        }
        if (analyticsResult.allBadges) {
          setAllBadges(analyticsResult.allBadges);
        }
        if (analyticsResult.aiInsights) {
          setAiInsights(analyticsResult.aiInsights);
        }
      }



    } catch (error) {
      console.error("Dashboard Sync Fault:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "LuminaLearn Analytics Report\n";
    csvContent += `Generated On: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
    csvContent += "Metrics,Value\n";
    csvContent += `Total Courses,${stats.totalCourses}\n`;
    csvContent += `XP Earned,${stats.xp}\n`;
    csvContent += `Current Streak,${stats.currentStreak} days\n`;
    csvContent += `Study Time,${stats.learningHours} hours\n`;
    csvContent += `Quiz Average,${stats.averageQuizScore}%\n`;
    csvContent += `Mock Interview Accuracy,${stats.averageInterviewScore}%\n\n`;
    csvContent += "Timeline Activities\n";
    csvContent += "Date,Time,Course,Module,Activity,Status\n";
    
    recentActivities.forEach(act => {
      const row = [
        `"${act.date}"`,
        `"${act.time}"`,
        `"${act.courseTitle}"`,
        `"${act.moduleTitle}"`,
        `"${act.action}"`,
        `"${act.status}"`
      ].join(",");
      csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LuminaLearn_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const actRows = recentActivities.map(act => `
      <tr>
        <td>${act.date} ${act.time}</td>
        <td>${act.courseTitle}</td>
        <td>${act.moduleTitle}</td>
        <td>${act.action}</td>
        <td>${act.status}</td>
      </tr>
    `).join('');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>LuminaLearn Learning Analytics Report</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 2rem; color: #1e293b; background: #fff; }
            h1 { font-size: 24px; font-weight: 800; margin-bottom: 0.5rem; }
            .date { font-size: 14px; color: #64748b; margin-bottom: 2rem; }
            .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; }
            .metric-card { border: 1px solid #e2e8f0; padding: 1.25rem; border-radius: 8px; }
            .metric-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 0.5rem; }
            .metric-value { font-size: 24px; font-weight: 800; color: #4f46e5; }
            table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 0.75rem; text-align: left; font-size: 13px; }
            th { background: #f8fafc; font-weight: 700; color: #4f46e5; }
          </style>
        </head>
        <body>
          <h1>LuminaLearn Analytics Report</h1>
          <div class="date">Exported on: ${new Date().toLocaleString()}</div>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-title">Total Courses</div>
              <div class="metric-value">${stats.totalCourses}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">XP Earned</div>
              <div class="metric-value">${stats.xp} XP</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Study Hours</div>
              <div class="metric-value">${stats.learningHours} hrs</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Current Streak</div>
              <div class="metric-value">${stats.currentStreak} days</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Quiz Average</div>
              <div class="metric-value">${stats.averageQuizScore}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Mock Interview Score</div>
              <div class="metric-value">${stats.averageInterviewScore}%</div>
            </div>
          </div>
          
          <h2>Learning Activity Timeline</h2>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Course</th>
                <th>Module</th>
                <th>Action</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${actRows}
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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

  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Extract upcoming uncompleted lessons from active course modules
  const getUpcomingLessons = () => {
    if (!activeCourse || !mongoSavedHistory.length) return [];
    const courseObj = mongoSavedHistory.find(c => c._id === activeCourse.courseId);
    if (!courseObj || !courseObj.modules) return [];
    
    const upcoming = [];
    const completedSet = new Set(courseObj.completedTopics || []);
    
    for (const mod of courseObj.modules) {
      if (mod.topics) {
        for (let i = 0; i < mod.topics.length; i++) {
          const key = `mod-${mod.dayId}-topic-${i}`;
          if (!completedSet.has(key)) {
            upcoming.push({
              moduleTitle: mod.title,
              topicName: mod.topics[i],
              dayId: mod.dayId,
              topicIndex: i,
              courseId: courseObj._id
            });
            if (upcoming.length >= 3) return upcoming;
          }
        }
      }
    }
    return upcoming;
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

    const points = quizHistory.slice(-6).map((q, idx) => {
      const x = paddingLeft + (quizHistory.length > 1 ? (idx / (Math.min(6, quizHistory.length) - 1)) * chartWidth : chartWidth / 2);
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

  // Render Interactive Custom SVG Line Chart for oral interview accuracy
  const renderInterviewChart = () => {
    const completedInterviews = interviewHistory.filter(i => i.status === 'Completed' || i.avgAccuracy > 0);

    if (completedInterviews.length === 0) {
      return (
        <div className="chart-empty-state">
          <MessageSquare size={32} style={{ color: 'var(--text-muted)' }} />
          <p>No completed interviews yet.</p>
          <span style={{ fontSize: '0.75rem' }}>Oral evaluations will show accuracy charts once interviews are completed.</span>
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

    const points = completedInterviews.slice(-6).map((item, idx) => {
      const x = paddingLeft + (completedInterviews.length > 1 ? (idx / (Math.min(6, completedInterviews.length) - 1)) * chartWidth : chartWidth / 2);
      const y = paddingTop + chartHeight - (item.avgAccuracy / 100) * chartHeight;
      return { x, y, ...item };
    });

    const lineD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
    const areaD = `${lineD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        <defs>
          <linearGradient id="intAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
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

        <path d={areaD} fill="url(#intAreaGrad)" />
        <path d={lineD} fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" />

        {/* Bars */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-secondary)" stroke="var(--accent-primary)" strokeWidth="2.5" />
            <text x={p.x} y={p.y - 8} fill="var(--text-main)" fontSize="8" fontWeight="700" textAnchor="middle">{p.avgAccuracy}%</text>
            <text x={p.x} y={height - 10} fill="var(--text-muted)" fontSize="9" textAnchor="middle">{`Int ${idx + 1}`}</text>
          </g>
        ))}
      </svg>
    );
  };

  // Render SVG Line Chart for Weekly Study Hours
  const renderWeeklyStudyHoursChart = () => {
    if (!weeklyStudyHours || weeklyStudyHours.length === 0) {
      return (
        <div className="chart-empty-state">
          <Activity size={32} />
          <p>No activity tracked this week.</p>
        </div>
      );
    }
    const width = 500;
    const height = 200;
    const leftPad = 40;
    const rightPad = 20;
    const topPad = 25;
    const bottomPad = 30;

    const chartWidth = width - leftPad - rightPad;
    const chartHeight = height - topPad - bottomPad;

    const maxHours = Math.max(...weeklyStudyHours.map(d => d.hours), 4); 

    const points = weeklyStudyHours.map((d, idx) => {
      const x = leftPad + (idx / (weeklyStudyHours.length - 1)) * chartWidth;
      const y = topPad + chartHeight - (d.hours / maxHours) * chartHeight;
      return { x, y, ...d };
    });

    const lineD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
    const areaD = `${lineD} L ${points[points.length - 1].x} ${height - bottomPad} L ${points[0].x} ${height - bottomPad} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        <defs>
          <linearGradient id="studyAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map(pct => {
          const val = Math.round((pct / 100) * maxHours * 10) / 10;
          const y = topPad + chartHeight - (pct / 100) * chartHeight;
          return (
            <g key={pct}>
              <line x1={leftPad} y1={y} x2={width - rightPad} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
              <text x={leftPad - 8} y={y + 3} fill="var(--text-muted)" fontSize="9" textAnchor="end">{val}h</text>
            </g>
          );
        })}
        <path d={areaD} fill="url(#studyAreaGrad)" />
        <path d={lineD} fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" />
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-secondary)" stroke="var(--accent-primary)" strokeWidth="2.5" />
            <text x={p.x} y={p.y - 8} fill="var(--text-main)" fontSize="8" fontWeight="700" textAnchor="middle">{p.hours}h</text>
            <text x={p.x} y={height - 10} fill="var(--text-muted)" fontSize="9" textAnchor="middle">{p.day}</text>
          </g>
        ))}
      </svg>
    );
  };

  // Render SVG Skills Donut Chart
  const renderSkillsDonutChart = () => {
    const beginnerCount = courseProgressList.filter(c => c.level?.toLowerCase() === 'beginner').length;
    const intermediateCount = courseProgressList.filter(c => c.level?.toLowerCase() === 'intermediate').length;
    const advancedCount = courseProgressList.filter(c => c.level?.toLowerCase() === 'advanced' || c.level?.toLowerCase() === 'expert').length;
    const total = beginnerCount + intermediateCount + advancedCount;

    if (total === 0) {
      return (
        <div className="chart-empty-state">
          <Layers size={32} style={{ color: 'var(--text-muted)' }} />
          <p>No skills data available.</p>
          <span style={{ fontSize: '0.75rem' }}>Create dynamic courses to populate skills stats.</span>
        </div>
      );
    }

    const segments = [
      { label: 'Beginner', count: beginnerCount, color: 'var(--accent-primary)' },
      { label: 'Intermediate', count: intermediateCount, color: 'var(--accent-secondary)' },
      { label: 'Advanced', count: advancedCount, color: 'var(--accent-warning)' }
    ].filter(s => s.count > 0);

    let accumulatedPercent = 0;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center', width: '100%' }}>
        <svg viewBox="0 0 160 160" width="120" height="120">
          <g transform="rotate(-90 80 80)">
            {segments.map((seg, idx) => {
              const percent = seg.count / total;
              const strokeLength = percent * circumference;
              const strokeOffset = circumference - (accumulatedPercent * circumference);
              accumulatedPercent += percent;

              return (
                <circle
                  key={idx}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="16"
                  strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                >
                  <title>{`${seg.label}: ${seg.count} courses (${Math.round(percent * 100)}%)`}</title>
                </circle>
              );
            })}
            <circle cx="80" cy="80" r="36" fill="var(--bg-secondary)" />
          </g>
          <text x="80" y="84" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="800">
            {total} Courses
          </text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
          {segments.map((seg, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: seg.color }} />
              <span style={{ fontWeight: '600' }}>{seg.label}:</span>
              <span style={{ color: 'var(--text-muted)' }}>{seg.count} ({Math.round((seg.count / total) * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // GitHub contribution-style Heatmap Grid
  const renderHeatmap = () => {
    if (!heatmapData || heatmapData.length === 0) return null;
    
    return (
      <div className="heatmap-scroll-outer">
        <div className="heatmap-grid-layout">
          {heatmapData.map((day, idx) => {
            let colorClass = 'heatmap-color-0';
            if (day.count === 1) colorClass = 'heatmap-color-1';
            else if (day.count === 2) colorClass = 'heatmap-color-2';
            else if (day.count === 3) colorClass = 'heatmap-color-3';
            else if (day.count >= 4) colorClass = 'heatmap-color-4';

            const details = calendarData[day.date] || { studyHours: 0, completedModules: 0 };
            const courseText = selectedCourse !== 'All' 
              ? (mongoSavedHistory.find(c => c._id === selectedCourse)?.title || 'Course')
              : 'All Courses';
            const tooltip = `Date: ${day.date}\nCourse: ${courseText}\nStudy Time: ${details.studyHours || 0} hrs\nModules Completed: ${details.completedModules || 0}`;

            return (
              <div 
                key={idx} 
                className={`heatmap-cell-node ${colorClass}`}
                title={tooltip}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', alignItems: 'center' }}>
          <span>Less</span>
          <div className="heatmap-cell-node heatmap-color-0" />
          <div className="heatmap-cell-node heatmap-color-1" />
          <div className="heatmap-cell-node heatmap-color-2" />
          <div className="heatmap-cell-node heatmap-color-3" />
          <div className="heatmap-cell-node heatmap-color-4" />
          <span>More</span>
        </div>
      </div>
    );
  };

  // Render Mini Calendar
  const renderMiniCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDayIdx = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const weekdayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const calendarDays = [];
    
    for (let i = 0; i < firstDayIdx; i++) {
      calendarDays.push({ dayNum: '', activeStudy: false, isToday: false });
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const isToday = d === today.getDate();
      const details = calendarData[dateStr] || { studyHours: 0, completedModules: 0, quizAttempts: 0, assignments: 0 };
      const hasStudyActivity = details.studyHours > 0 || details.completedModules > 0 || details.quizAttempts > 0 || details.assignments > 0;
      
      calendarDays.push({
        dayNum: d,
        dateStr,
        activeStudy: hasStudyActivity,
        details,
        isToday
      });
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.25rem' }}>
          <span>{today.toLocaleString('default', { month: 'long' })} {year}</span>
        </div>
        <div className="saas-calendar-grid">
          {weekdayHeaders.map((w, idx) => (
            <div key={idx} className="calendar-day-header">{w}</div>
          ))}
          {calendarDays.map((day, idx) => (
            <div 
              key={idx} 
              className={`calendar-day-node ${day.activeStudy ? 'active-study' : ''} ${day.isToday ? 'today-highlight' : ''}`}
              title={day.dayNum ? `Date: ${day.dateStr}\nStudy Hours: ${day.details.studyHours} hrs\nCompleted Modules: ${day.details.completedModules}\nQuiz Attempts: ${day.details.quizAttempts}\nAssignments: ${day.details.assignments}` : undefined}
            >
              {day.dayNum}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const filteredCourses = courseProgressList.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCourse = courseProgressList.length > 0 ? courseProgressList[0] : null;

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
              
              {/* TOP HEADER CONTROLS SECTION */}
              <div className="dashboard-top-navbar">
                <div className="navbar-brand-section">
                  <h1>Workspace Dashboard</h1>
                  <p>{getDynamicGreeting()}, {profileFormData.fullName || 'Student'}</p>
                </div>
                <div className="navbar-controls-group">
                  
                  {/* Search Engine */}
                  <div className="navbar-search-wrapper">
                    <Search size={16} className="search-leading-icon" />
                    <input 
                      type="text" 
                      placeholder="Search courses..." 
                      className="navbar-search-input"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Notifications bell */}
                  <div className="navbar-btn-circle" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                    <Bell size={18} />
                    {recentActivities.length > 0 && <div className="notification-badge-dot" />}
                    
                    <AnimatePresence>
                      {isNotificationsOpen && (
                        <motion.div 
                          className="notifications-dropdown-menu"
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="dropdown-header-bar">
                            <div>
                              <h4>Recent Activities</h4>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest updates</span>
                            </div>
                            <button 
                              className="close-notifications-btn" 
                              onClick={() => setIsNotificationsOpen(false)}
                            >
                              &times;
                            </button>
                          </div>
                          <div className="dropdown-list-scroller">
                            {recentActivities.length === 0 ? (
                              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                No recent notifications
                              </div>
                            ) : (
                              recentActivities.map((act, idx) => (
                                <div key={idx} className="dropdown-item-row">
                                  <span className="item-title">{act.action}</span>
                                  <span className="item-desc">{act.courseTitle} &bull; {act.moduleTitle}</span>
                                  <span className="item-time">{act.date} {act.time}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Profile Edit Trigger */}
                  <div 
                    className="navbar-btn-circle" 
                    title="Profile Settings"
                    onClick={() => {
                      loadProfileFromStorage();
                      setIsProfileModalOpen(true);
                    }}
                  >
                    <Settings size={18} />
                  </div>

                </div>
              </div>

              {/* STICKY FILTER BAR */}
              <div className="sticky-filter-bar">
                <div className="filter-group">
                  <label>Course Selection</label>
                  <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                    {mongoSavedHistory.map(c => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Time Period</label>
                  <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                    <option value="All">All Time</option>
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Last 90 Days">Last 90 Days</option>
                    <option value="This Year">This Year</option>
                    <option value="Custom">Custom Range</option>
                  </select>
                </div>

                {timeRange === 'Custom' && (
                  <div className="filter-group date-inputs">
                    <div>
                      <label>Start</label>
                      <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
                    </div>
                    <div>
                      <label>End</label>
                      <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
                    </div>
                  </div>
                )}

                <div className="filter-group">
                  <label>Course Status</label>
                  <select value={courseStatus} onChange={(e) => setCourseStatus(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Not Started">Not Started</option>
                    <option value="Started">Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="All">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Activity Focus</label>
                  <select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                    <option value="All">All Activities</option>
                    <option value="Modules">Modules</option>
                    <option value="Notes">Notes</option>
                    <option value="Quizzes">Quizzes</option>
                    <option value="Assignments">Assignments</option>
                    <option value="Interviews">Interviews</option>
                  </select>
                </div>

                <div className="filter-actions">
                  <button className="btn-export-csv" onClick={exportToCSV}>Export CSV</button>
                  <button className="btn-export-pdf" onClick={exportToPDF}>Export PDF</button>
                </div>
              </div>

              {/* REDESIGNED SAAS HERO BANNER */}
              <div className="premium-hero-card-container">
                <div className="premium-hero-glow-underlay" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Sparkles size={20} style={{ color: 'var(--accent-secondary)' }} />
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '800', color: 'rgba(255,255,255,0.85)' }}>AI-Powered Learning Workspace</span>
                  </div>
                  <h2>{profileFormData.fullName}</h2>
                  <p>Master complex topics, test your skills in oral interviews, and track your daily learning streak.</p>
                  
                  <div className="hero-stats-ribbon">
                    <div className="ribbon-stat-item">
                      <Flame size={14} style={{ color: '#ffb800' }} />
                      <span>{stats.currentStreak} Day Streak</span>
                    </div>
                    <div className="ribbon-stat-item">
                      <Trophy size={14} style={{ color: '#00c896' }} />
                      <span>Level {stats.level} ({stats.xp} XP)</span>
                    </div>
                    <div className="ribbon-stat-item">
                      <Clock size={14} style={{ color: '#a855f7' }} />
                      <span>{stats.learningHours} Hrs Learned</span>
                    </div>
                  </div>
                </div>

                <div className="hero-resume-action-box">
                  <div className="resume-header-row">
                    <span>Continue Learning</span>
                    <Clock size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  </div>
                  <h4 className="hero-course-title">
                    {activeCourse ? activeCourse.title : 'No active courses yet'}
                  </h4>
                  <button 
                    className="hero-btn-resume"
                    disabled={!activeCourse}
                    onClick={() => navigate('/courses', { state: { courseId: activeCourse.courseId, autoLaunch: true } })}
                  >
                    Resume Lesson &rarr;
                  </button>
                </div>
              </div>

              {/* SAAS METRICS GRID */}
              <div className="premium-metrics-grid">
                
                <div className="saas-metric-card">
                  <div className="saas-metric-header">
                    <span className="saas-metric-title">Total Courses</span>
                    <div className="icon-box icon-purple-bg"><BookOpenCheck size={18} /></div>
                  </div>
                  <h2 className="saas-metric-value">{mongoSavedHistory.length}</h2>
                  <span className="saas-metric-footer">Total roadmaps generated</span>
                </div>

                <div className="saas-metric-card">
                  <div className="saas-metric-header">
                    <span className="saas-metric-title">Modules Complete</span>
                    <div className="icon-box icon-teal-bg"><CheckCircle size={18} /></div>
                  </div>
                  <h2 className="saas-metric-value">{stats.modulesCompletedCount}</h2>
                  <span className="saas-metric-footer">Fully completed</span>
                </div>

                <div className="saas-metric-card">
                  <div className="saas-metric-header">
                    <span className="saas-metric-title">Assignments</span>
                    <div className="icon-box icon-amber-bg"><FileText size={18} /></div>
                  </div>
                  <h2 className="saas-metric-value">{stats.evaluatedAssignments}</h2>
                  <span className="saas-metric-footer">AI reviews evaluated</span>
                </div>

                <div className="saas-metric-card">
                  <div className="saas-metric-header">
                    <span className="saas-metric-title">Quiz Average</span>
                    <div className="icon-box icon-purple-bg"><TrendingUp size={18} /></div>
                  </div>
                  <h2 className="saas-metric-value">{stats.averageQuizScore}%</h2>
                  <span className="saas-metric-footer">Practice evaluations</span>
                </div>

                <div className="saas-metric-card">
                  <div className="saas-metric-header">
                    <span className="saas-metric-title">Oral Accuracy</span>
                    <div className="icon-box icon-teal-bg"><Award size={18} /></div>
                  </div>
                  <h2 className="saas-metric-value">{stats.averageInterviewScore}%</h2>
                  <span className="saas-metric-footer">Oral speech accuracy</span>
                </div>

              </div>

              {/* DASHBOARD COLUMNS: 70% LEFT, 30% RIGHT */}
              <div className="dashboard-columns-grid">
                
                {/* LEFT 70% PANEL */}
                <div className="dashboard-left-panel">
                  
                  {/* Course Comparison Matrix */}
                  {courseProgressList.length > 1 && (
                    <motion.div 
                      className="saas-panel-card"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="saas-card-header">
                        <h3><Layers size={18} style={{ color: 'var(--accent-primary)' }} /> Course Comparison Matrix</h3>
                      </div>
                      <div style={{ overflowX: 'auto', width: '100%' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>COURSE</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>COMPLETION %</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>QUIZ AVG</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>STUDY TIME</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>NOTES</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>ASSIGNMENTS</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>INTERVIEWS</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>LEARNING SPEED</th>
                            </tr>
                          </thead>
                          <tbody>
                            {courseProgressList.map(c => {
                              const speed = c.percentProgress > 0 
                                ? `${Math.round(c.percentProgress / 2)}% progress/day`
                                : '0%';
                              return (
                                <tr key={c.courseId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '1rem', fontWeight: '700', fontSize: '0.85rem' }}>{c.title}</td>
                                  <td style={{ padding: '1rem', color: 'var(--accent-secondary)', fontWeight: '800' }}>{c.percentProgress}%</td>
                                  <td style={{ padding: '1rem' }}>{c.quizAverage}%</td>
                                  <td style={{ padding: '1rem' }}>{c.totalStudyTime} hrs</td>
                                  <td style={{ padding: '1rem' }}>{c.notesCreated}</td>
                                  <td style={{ padding: '1rem' }}>{c.assignmentCompletion}</td>
                                  <td style={{ padding: '1rem' }}>{c.interviewAccuracy}%</td>
                                  <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '700' }}>{speed}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Continue Learning Widget Card */}
                  {activeCourse && (
                    <motion.div 
                      className="saas-panel-card"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="saas-card-header">
                        <h3><Clock size={18} style={{ color: 'var(--accent-primary)' }} /> Continue Learning</h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estimated completion in {Math.ceil((100 - activeCourse.percentProgress) / 15) || 1} days</span>
                      </div>
                      
                      <div className="active-course-highlight-card">
                        <div className="active-highlight-meta">
                          <div>
                            <h4>{activeCourse.title}</h4>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              Modules completed: <strong>{activeCourse.completedModules} of {activeCourse.totalModules}</strong>
                            </span>
                          </div>
                          <span className="course-difficulty-badge">{activeCourse.level}</span>
                        </div>

                        <div className="progress-bar-wrapper">
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${activeCourse.percentProgress}%` }} />
                          </div>
                          <span className="progress-percent-label">{activeCourse.percentProgress}%</span>
                        </div>

                        <button 
                          className="btn-resume-course-inline"
                          onClick={() => navigate('/courses', { state: { courseId: activeCourse.courseId, autoLaunch: true } })}
                        >
                          Resume Active Workspace &rarr;
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Upcoming Lessons Widget */}
                  {activeCourse && (
                    <motion.div 
                      className="saas-panel-card"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 }}
                    >
                      <div className="saas-card-header">
                        <h3><BookOpenCheck size={18} style={{ color: 'var(--accent-primary)' }} /> Upcoming Lessons</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Next in your syllabus</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {getUpcomingLessons().length === 0 ? (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>
                            No upcoming lessons. You've completed all topics in this course! 🎉
                          </div>
                        ) : (
                          getUpcomingLessons().map((lesson, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '1rem', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255,255,255,0.01)',
                                gap: '1rem'
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: '800', textTransform: 'uppercase' }}>
                                  Module {lesson.dayId}
                                </span>
                                <h5 style={{ margin: '0.1rem 0 0 0', fontSize: '0.9rem', fontWeight: '800' }}>{lesson.topicName}</h5>
                                <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lesson.moduleTitle}</p>
                              </div>
                              <button 
                                className="btn-resume-course-inline"
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                                onClick={() => navigate('/courses', { 
                                  state: { 
                                    courseId: lesson.courseId, 
                                    autoLaunch: true,
                                    targetModuleId: lesson.dayId,
                                    targetTopicIndex: lesson.topicIndex
                                  } 
                                })}
                              >
                                Start &rarr;
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Course Progress List */}
                  <div className="saas-panel-card">
                    <div className="saas-card-header">
                      <h3><BookOpenCheck size={18} style={{ color: 'var(--accent-secondary)' }} /> Course Roadmaps & Progress</h3>
                    </div>
                    <div className="saas-courses-grid">
                      {isLoading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <Loader2 className="spinner-icon" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }} />
                          <span>Syncing course roadmaps...</span>
                        </div>
                      ) : filteredCourses.length === 0 ? (
                        <div className="chart-empty-state">
                          <Layers size={36} style={{ color: 'var(--text-muted)' }} />
                          <p>No matching courses generated yet.</p>
                          <button className="btn-resume-course-inline" style={{ alignSelf: 'center', marginTop: '0.5rem' }} onClick={() => navigate('/generate-course')}>
                            Generate roadmap now
                          </button>
                        </div>
                      ) : (
                        filteredCourses.map(course => (
                          <div key={course.courseId} className="saas-course-row">
                            <div className="saas-course-row-info">
                              <h4>{course.title}</h4>
                              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                <span>Level: <strong>{course.level}</strong></span>
                                <span>Modules: <strong>{course.completedModules} / {course.totalModules}</strong></span>
                              </div>
                            </div>
                            
                            <div className="saas-course-row-progress-col">
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                                <span>Progress</span>
                                <span style={{ fontWeight: '800', color: 'var(--accent-primary)' }}>{course.percentProgress}%</span>
                              </div>
                              <div className="progress-bar-bg" style={{ height: '6px' }}>
                                <div className="progress-bar-fill" style={{ width: `${course.percentProgress}%` }} />
                              </div>
                            </div>

                            <div className="saas-course-row-actions">
                              <button 
                                className="btn-resume-course-inline"
                                onClick={() => navigate('/courses', { state: { courseId: course.courseId, autoLaunch: true } })}
                              >
                                Study
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Weekly Study Hours Line Chart */}
                  <div className="saas-panel-card">
                    <div className="saas-card-header">
                      <h3><Activity size={18} style={{ color: 'var(--accent-primary)' }} /> Weekly Learning Hours</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monday to Sunday study hours</span>
                    </div>
                    <div className="saas-chart-wrapper">
                      {renderWeeklyStudyHoursChart()}
                    </div>
                  </div>

                  {/* Heatmap Contribution Graph */}
                  <div className="saas-panel-card">
                    <div className="saas-card-header">
                      <h3><Layers size={18} style={{ color: 'var(--accent-secondary)' }} /> Learning Activity Heatmap</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GitHub style contribution tracker</span>
                    </div>
                    {renderHeatmap()}
                  </div>

                  {/* Timeline Activities List */}
                  <div className="saas-panel-card">
                    <div className="saas-card-header">
                      <h3><History size={18} style={{ color: 'var(--accent-primary)' }} /> Learning Activity Timeline</h3>
                    </div>
                    <div className="saas-timeline-list">
                      {selectedCourse !== 'All' ? (
                        (() => {
                          const currentCourseObj = mongoSavedHistory.find(c => c._id === selectedCourse);
                          if (!currentCourseObj) return <p style={{ color: 'var(--text-muted)' }}>No timeline journey recorded for this course.</p>;
                          return (
                            <div>
                              {/* Course Started Node */}
                              <div className="saas-timeline-item">
                                <div className="saas-timeline-dot" style={{ borderColor: 'var(--accent-secondary)' }} />
                                <div className="saas-timeline-content">
                                  <span className="time-stamp">{new Date(currentCourseObj.createdAt).toLocaleDateString()}</span>
                                  <h5>Course Journey Initiated</h5>
                                  <p>Started course: <strong>{currentCourseObj.title}</strong> at level <strong>{currentCourseObj.level}</strong></p>
                                </div>
                              </div>

                              {/* Sequential Modules Map */}
                              {currentCourseObj.modules?.map((mod, modIdx) => {
                                const modTopicsCount = mod.topics ? mod.topics.length : 0;
                                let completedTopicsCount = 0;
                                mod.topics?.forEach((t, tIdx) => {
                                  if (currentCourseObj.completedTopics?.includes(`mod-${mod.dayId}-topic-${tIdx}`)) {
                                    completedTopicsCount++;
                                  }
                                });

                                const isStarted = completedTopicsCount > 0;
                                const isCompleted = modTopicsCount > 0 && completedTopicsCount === modTopicsCount;

                                const hasNotes = recentActivities.some(a => a.courseId === currentCourseObj._id && Number(a.dayId) === Number(mod.dayId) && a.action.startsWith('Notes'));
                                const quizCompleted = recentActivities.find(a => a.courseId === currentCourseObj._id && Number(a.dayId) === Number(mod.dayId) && a.action === 'Quiz Completed');
                                const assignmentCompleted = recentActivities.find(a => a.courseId === currentCourseObj._id && Number(a.dayId) === Number(mod.dayId) && a.action === 'Assignment Reviewed');

                                return (
                                  <React.Fragment key={mod.dayId}>
                                    <div className="saas-timeline-item">
                                      <div className="saas-timeline-dot" style={{ borderColor: isCompleted ? 'var(--accent-secondary)' : (isStarted ? 'var(--accent-warning)' : 'var(--border-color)') }} />
                                      <div className="saas-timeline-content">
                                        <h5>Module {mod.dayId}: {mod.title}</h5>
                                        <p>Progress: {completedTopicsCount}/{modTopicsCount} topics completed ({isCompleted ? 'Completed' : (isStarted ? 'In Progress' : 'Not Started')})</p>
                                      </div>
                                    </div>

                                    {hasNotes && (
                                      <div className="saas-timeline-item" style={{ paddingLeft: '1rem' }}>
                                        <div className="saas-timeline-dot" style={{ borderColor: 'var(--accent-primary)', width: '12px', height: '12px', left: '-25px' }} />
                                        <div className="saas-timeline-content">
                                          <h5>Notes Saved</h5>
                                          <p>Revision notes recorded in the workspace</p>
                                        </div>
                                      </div>
                                    )}

                                    {quizCompleted && (
                                      <div className="saas-timeline-item" style={{ paddingLeft: '1rem' }}>
                                        <div className="saas-timeline-dot" style={{ borderColor: 'var(--accent-secondary)', width: '12px', height: '12px', left: '-25px' }} />
                                        <div className="saas-timeline-content">
                                          <h5>Quiz Evaluation Completed</h5>
                                          <p>Quiz: <strong>{quizCompleted.metadata?.quizName || 'Practice Assessment'}</strong> &bull; Score: <strong>{quizCompleted.metadata?.scorePercentage}%</strong></p>
                                        </div>
                                      </div>
                                    )}

                                    {assignmentCompleted && (
                                      <div className="saas-timeline-item" style={{ paddingLeft: '1rem' }}>
                                        <div className="saas-timeline-dot" style={{ borderColor: 'var(--accent-primary)', width: '12px', height: '12px', left: '-25px' }} />
                                        <div className="saas-timeline-content">
                                          <h5>Assignment Reviewed</h5>
                                          <p>AI Review Score: <strong>{assignmentCompleted.metadata?.approachScore}/100</strong></p>
                                        </div>
                                      </div>
                                    )}
                                  </React.Fragment>
                                );
                              })}

                              {/* Course Certificate Generated Node */}
                              {currentCourseObj.completedTopics?.length === currentCourseObj.modules?.reduce((acc, m) => acc + (m.topics ? m.topics.length : 0), 0) && (
                                <div className="saas-timeline-item">
                                  <div className="saas-timeline-dot" style={{ borderColor: 'var(--accent-secondary)', background: 'var(--accent-secondary)' }} />
                                  <div className="saas-timeline-content">
                                    <h5>Certificate Unlocked</h5>
                                    <p>Completed all roadmap modules for <strong>{currentCourseObj.title}</strong>.</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        recentActivities.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No activities matching filter criteria.</p>
                        ) : (
                          recentActivities.map((item, idx) => (
                            <div key={idx} className="saas-timeline-item">
                              <div className="saas-timeline-dot" />
                              <div className="saas-timeline-content">
                                <span className="time-stamp">{item.date} &bull; {item.time}</span>
                                <h5>{item.action}</h5>
                                <p>
                                  Course: <strong>{item.courseTitle}</strong> | {item.moduleTitle}
                                </p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                  Topic: <em>{item.topic}</em> &bull; Status: <span style={{ color: item.status === 'Completed' || item.status === 'Success' ? 'var(--accent-secondary)' : 'var(--text-muted)', fontWeight: 700 }}>{item.status}</span>
                                </p>
                              </div>
                            </div>
                          ))
                        )
                      )}
                    </div>
                  </div>

                </div>

                {/* RIGHT 30% PANEL */}
                <div className="dashboard-right-panel">
                  
                  {/* AI Coach Banner */}
                  <div className="ai-coach-banner">
                    <div className="ai-coach-avatar-circle">
                      <Sparkles size={20} />
                    </div>
                    <div className="ai-coach-bubble">
                      <h4>AI Recommendation Coach</h4>
                      <p>
                        {aiInsights.weakestTopics.length > 0 
                          ? `Hey! Based on your scores, I suggest revising the topic: "${aiInsights.weakestTopics[0]}".`
                          : "Great progress! Start your next syllabus module to maintain your momentum."}
                      </p>
                    </div>
                  </div>

                  {/* AI Insights Card */}
                  <div className="saas-panel-card">
                    <div className="saas-card-header">
                      <h3><Sparkles size={18} style={{ color: 'var(--accent-primary)' }} /> AI Knowledge Insights</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: '700' }}>WEAKEST TOPICS</span>
                        {aiInsights.weakestTopics.length > 0 ? (
                          <div className="insights-topics-list">
                            {aiInsights.weakestTopics.map((t, i) => (
                              <span key={i} className="topic-pill pill-danger">{t}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: '600' }}>No weak topics identified! Keep it up.</span>
                        )}
                      </div>

                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: '700' }}>STRONGEST AREAS</span>
                        {aiInsights.strongestTopics.length > 0 ? (
                          <div className="insights-topics-list">
                            {aiInsights.strongestTopics.map((t, i) => (
                              <span key={i} className="topic-pill pill-success">{t}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attempt more quizzes to calculate strong areas.</span>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', fontWeight: '700' }}>COMPLETION FORECAST</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{aiInsights.completionPrediction}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', fontWeight: '700' }}>RECOMMENDED NEXT ROADMAP</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{aiInsights.recommendedNextCourse}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gamification Level Box */}
                  <div className="saas-panel-card">
                    <div className="saas-card-header">
                      <h3><Award size={18} style={{ color: '#ffb800' }} /> Gamified Level progress</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '800', fontSize: '1rem' }}>Level {stats.level}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats.xpToNextLevel} XP to Level {stats.level + 1}</span>
                      </div>
                      <div className="progress-bar-bg" style={{ height: '8px' }}>
                        <div className="progress-bar-fill" style={{ width: `${stats.xpProgressPercent}%`, background: 'var(--accent-warning)', boxShadow: '0 0 8px var(--accent-warning)' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Streak: {stats.currentStreak} days (Longest: {stats.longestStreak} days)</span>
                    </div>
                  </div>

                  {/* Skills distribution donut chart */}
                  <div className="saas-panel-card">
                    <div className="saas-card-header">
                      <h3><Layers size={18} style={{ color: 'var(--accent-secondary)' }} /> Skills Distribution</h3>
                    </div>
                    {renderSkillsDonutChart()}
                  </div>

                  {/* Mini Calendar widget */}
                  <div className="saas-panel-card">
                    <div className="saas-card-header">
                      <h3><Award size={18} style={{ color: 'var(--accent-primary)' }} /> Learning Calendar</h3>
                    </div>
                    {renderMiniCalendar()}
                  </div>

                  {/* Achievements badges card */}
                  <div className="saas-panel-card">
                    <div className="saas-card-header">
                      <h3><Trophy size={18} style={{ color: '#ffb800' }} /> Achievements Badges</h3>
                    </div>
                    <div className="saas-badges-grid">
                      {allBadges.map((badge, idx) => {
                        let IconComp = Sparkles;
                        if (badge.icon === 'Trophy') IconComp = Trophy;
                        else if (badge.icon === 'Flame') IconComp = Flame;
                        else if (badge.icon === 'Award') IconComp = Award;
                        else if (badge.icon === 'MessageSquare') IconComp = MessageSquare;
                        else if (badge.icon === 'CheckCircle2') IconComp = CheckCircle2;

                        return (
                          <div key={idx} className={`saas-badge-node ${badge.unlocked ? 'unlocked' : ''}`} title={badge.desc}>
                            <div className="saas-badge-icon-ring">
                              <IconComp size={18} />
                            </div>
                            <span className="saas-badge-title">{badge.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Certificates Widget */}
                  {stats.certificatesCount > 0 && (
                    <div className="saas-panel-card">
                      <div className="saas-card-header">
                        <h3><Trophy size={18} style={{ color: 'var(--accent-secondary)' }} /> Certificates Earned</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {courseProgressList.filter(c => c.percentProgress === 100).map(c => (
                          <div 
                            key={c.courseId} 
                            style={{ padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => setSelectedCertCourse(c)}
                          >
                            <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{c.title}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: '800' }}>View &rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions widget */}
                  <div className="saas-panel-card">
                    <div className="saas-card-header">
                      <h3><Plus size={18} style={{ color: 'var(--text-main)' }} /> Quick Actions</h3>
                    </div>
                    <div className="saas-quick-actions-row">
                      <button className="saas-action-btn" onClick={() => navigate('/generate-course')}>
                        <Plus size={18} className="btn-icon" />
                        <span>Build Roadmap</span>
                      </button>
                      <button className="saas-action-btn" onClick={() => navigate('/interview')}>
                        <MessageSquare size={18} className="btn-icon" />
                        <span>Mock Interview</span>
                      </button>
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
                  <div className="saas-chart-wrapper">
                    {renderQuizChart()}
                  </div>
                </div>

                {/* INTERVIEW ACCURACY CHART */}
                <div className="dashboard-panel-card">
                  <div className="panel-card-header">
                    <h3><MessageSquare size={18} style={{ color: 'var(--accent-primary)' }} /> AI Interview Accuracy Score</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Speech evaluation benchmarks</span>
                  </div>
                  <div className="saas-chart-wrapper">
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

      {/* Certificate Viewer Modal */}
      {selectedCertCourse && (
        <div className="profile-modal-overlay" onClick={() => setSelectedCertCourse(null)}>
          <div className="certificate-modal-card" onClick={e => e.stopPropagation()}>
            <button 
              className="close-modal-btn" 
              style={{ position: 'absolute', top: '1rem', right: '1.5rem', color: '#fff' }} 
              onClick={() => setSelectedCertCourse(null)}
            >
              &times;
            </button>
            <div className="cert-border-ring">
              <div className="cert-stamp">
                <Trophy size={32} />
              </div>
              <h2 style={{ fontSize: '1.8rem', fontFamily: 'serif', margin: '0 0 1rem 0', color: '#fff' }}>Certificate of Completion</h2>
              <p style={{ fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', margin: '0 0 1.5rem 0' }}>This is proudly presented to</p>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 1rem 0', color: 'var(--accent-secondary)' }}>{profileFormData.fullName}</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', margin: '0 auto 2rem auto', maxWidth: '400px' }}>
                for successfully mastering the curriculum and evaluations of the course
              </p>
              <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: '0 0 2rem 0' }}>{selectedCertCourse.title}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                <span>Date: {new Date(selectedCertCourse.createdAt).toLocaleDateString()}</span>
                <span>Credential ID: IMP-{selectedCertCourse.courseId.substring(18).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}