import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const InterviewDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [historicalLogs, setHistoricalLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCourseFilter, setActiveCourseFilter] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [difficulty, setDifficulty] = useState('Beginner');
  const [language, setLanguage] = useState('English'); 

  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const BACKEND_URL = `${window.API_URL}/api`;
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDashboardTelemetry();
  }, []);

  const fetchDashboardTelemetry = async () => {
    try {
      const metaRes = await fetch(`${BACKEND_URL}/interview/dashboard-meta`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const metaData = await metaRes.json();
      if (metaData.success && metaData.courses) {
        setCourses(metaData.courses);
        if (metaData.courses.length > 0) {
          setActiveCourseFilter(metaData.courses[0]._id);
        }
      }

      const historyRes = await fetch(`${BACKEND_URL}/interview/history-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      if (historyData.success) setHistoricalLogs(historyData.logs);

    } catch (err) {
      console.error("Telemetry channel connection error:", err);
    } finally { // <-- FIX: 'file' ko badal kar 'finally' kar diya hai
      setLoading(false);
    }
  };

  const fetchAndOpenReportDetail = async (interviewId) => {
    setLoadingDetail(true);
    setIsReportModalOpen(true);
    setSelectedSessionDetail(null);
    try {
      const res = await fetch(`${BACKEND_URL}/interview/session-detail/${interviewId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedSessionDetail(data);
      } else {
        alert(data.message || "Failed to load session details.");
        setIsReportModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting the screening telemetry tunnel.");
      setIsReportModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const activeCourseObj = courses.find(c => c._id === activeCourseFilter);
  const filteredModulesList = activeCourseObj?.modules || [];
  const filteredHistoryLogs = historicalLogs.filter(log => log.courseId === activeCourseFilter);

  const totalScheduledForCourse = filteredHistoryLogs.length;
  const totalCompletedForCourse = filteredHistoryLogs.filter(l => l.status === 'Completed').length;
  const totalViolationsForCourse = filteredHistoryLogs.reduce((acc, curr) => acc + (curr.proctorLog?.tabSwitchesCount || 0), 0);
  const completedSessions = filteredHistoryLogs.filter(l => l.status === 'Completed' && l.avgAccuracy !== undefined);
  const averageAccuracyForCourse = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, curr) => acc + curr.avgAccuracy, 0) / completedSessions.length)
    : 0;
  const integrityRating = totalCompletedForCourse === 0 
    ? 'N/A' 
    : (totalViolationsForCourse / totalCompletedForCourse <= 0.5 ? 'Excellent' : totalViolationsForCourse / totalCompletedForCourse <= 1.5 ? 'Good' : 'Needs Review');

  const handleModuleSelectionChange = (moduleIdValue) => {
    setSelectedModuleId(moduleIdValue);
    if (!moduleIdValue) {
      setSelectedTopics([]);
      return;
    }

    const targetModule = filteredModulesList.find(m => String(m.dayId) === String(moduleIdValue));
    if (targetModule && targetModule.topics) {
      setSelectedTopics(targetModule.topics);
    } else {
      setSelectedTopics([]);
    }
  };

  const triggerScheduleAndNavigation = async () => {
    if (!activeCourseFilter || !selectedModuleId) return alert("Please map a baseline target module.");
    
    try {
      const res = await fetch(`${BACKEND_URL}/interview/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          courseId: activeCourseFilter,
          dayId: Number(selectedModuleId),
          selectedTopics,
          difficulty,
          language
        })
      });
      const data = await res.json();
      if (!data.success) return alert("System scheduling validation trace failed.");

      const bookedId = data.data._id;

      const startRes = await fetch(`${BACKEND_URL}/interview/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ interviewId: bookedId })
      });
      const startData = await startRes.json();

      if (startData.success) {
        navigate(`/interview/live/${bookedId}/${startData.sessionId}`);
      } else {
        alert(startData.message || "Boot configuration matrix failure.");
      }
    } catch (err) {
      alert("Hardware tracking bridge operation error.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-mono tracking-widest text-xs">
        AGGREGATING_COURSE_METRICS_DATA...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <script src="https://cdn.tailwindcss.com"></script>
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900 pb-5 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 font-bold transition-all"
            >
              ← BACK_TO_CONSOLE
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-100">AI Simulated Screening Panel</h1>
              <p className="text-xs text-slate-400 mt-0.5">Real-time parameters linked via MongoDB indexing clusters.</p>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-xl font-mono text-[11px] text-blue-400 font-bold uppercase">
            Active Workspace: {activeCourseObj?.title || "NONE"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-xl transition-transform hover:scale-[1.02]">
            <h4 className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1 font-mono">Booked Sessions</h4>
            <p className="text-4xl font-black text-slate-100">{totalScheduledForCourse}</p>
            <span className="text-[9px] text-slate-500 font-mono">Scheduled slots</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-xl transition-transform hover:scale-[1.02]">
            <h4 className="text-[10px] uppercase text-emerald-400 font-black tracking-widest mb-1 font-mono">Completed</h4>
            <p className="text-4xl font-black text-emerald-400">{totalCompletedForCourse}</p>
            <span className="text-[9px] text-slate-500 font-mono">Assessments finished</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-xl transition-transform hover:scale-[1.02]">
            <h4 className="text-[10px] uppercase text-cyan-400 font-black tracking-widest mb-1 font-mono">Average Accuracy</h4>
            <p className="text-4xl font-black text-cyan-400">{averageAccuracyForCourse}%</p>
            <div className="w-full bg-slate-950 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-cyan-400 h-full" style={{ width: `${averageAccuracyForCourse}%` }}></div>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-xl transition-transform hover:scale-[1.02]">
            <h4 className="text-[10px] uppercase text-amber-400 font-black tracking-widest mb-1 font-mono">Integrity Status</h4>
            <p className={`text-2xl font-black mt-1 ${integrityRating === 'Excellent' ? 'text-emerald-400' : integrityRating === 'Good' ? 'text-cyan-400' : integrityRating === 'Needs Review' ? 'text-red-400' : 'text-slate-400'}`}>
              {integrityRating}
            </p>
            <span className="text-[9px] text-slate-500 font-mono">Tab switches: {totalViolationsForCourse}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block mb-2.5">Switch Active Data Domain Filter:</span>
          <div className="flex flex-wrap gap-2">
            {courses.map(c => (
              <button 
                key={c._id}
                onClick={() => { setActiveCourseFilter(c._id); setSelectedModuleId(''); setSelectedTopics([]); }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${activeCourseFilter === c._id ? 'bg-blue-600 border-blue-400 text-white shadow-xl' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'}`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
            <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase font-mono border-b border-slate-800 pb-3">Configure Pipeline Matrix</h3>
            
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Available Track Modules</label>
              <select 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                value={selectedModuleId}
                onChange={(e) => handleModuleSelectionChange(e.target.value)}
              >
                <option value="">-- Choose Target Module --</option>
                {filteredModulesList.map((m) => (
                  <option key={m.dayId} value={m.dayId}>
                    Module {m.dayId}: {m.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedTopics && selectedTopics.length > 0 && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[9px] font-black text-blue-400 tracking-wider block mb-2 uppercase font-mono">Bound Context Parameters:</span>
                <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {selectedTopics.map((topic, i) => (
                    <span key={i} className="bg-slate-900 border border-slate-800/60 text-[11px] px-3 py-2 rounded text-slate-300 font-medium font-sans">
                      🔹 {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Complexity Depth</label>
              <div className="grid grid-cols-3 gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                  <button 
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all border ${difficulty === lvl ? 'bg-blue-600 border-blue-400 text-white shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Interview Response Language</label>
              <select 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="English">English (US)</option>
                <option value="Hinglish">Hinglish (Hindi + English)</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
              </select>
            </div>

            <button 
              onClick={triggerScheduleAndNavigation}
              disabled={!selectedModuleId}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-xs py-3.5 rounded-xl hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all uppercase shadow-xl"
            >
              LAUNCH SIMULATOR AGENT
            </button>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 bg-slate-900/30">
              <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-widest">Ecosystem Logs Archive Stream</h3>
              <p className="text-xs text-slate-400 mt-0.5">Showing past evaluation parameters exclusively for the active selected workspace.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase tracking-widest border-b border-slate-800">
                    <th className="p-4">Session Hash</th>
                    <th className="p-4">Language & Rubric</th>
                    <th className="p-4">Surveillance Log</th>
                    <th className="p-4">AI Score</th>
                    <th className="p-4">State Verdict</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300 font-medium">
                  {filteredHistoryLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 font-mono tracking-wider">NO_SESSIONS_RECORDED_FOR_THIS_WORKSPACE</td>
                    </tr>
                  ) : (
                    filteredHistoryLogs.map(log => (
                      <tr key={log._id} className="hover:bg-slate-950/30 transition-colors">
                        <td className="p-4 font-mono text-blue-400">#{log._id.slice(-6).toUpperCase()}</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-200">{log.language || 'English'}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{log.difficulty}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-400">
                          Tab Blurs: <strong className={log.proctorLog?.tabSwitchesCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-500'}>{log.proctorLog?.tabSwitchesCount || 0}</strong>
                        </td>
                        <td className="p-4 font-mono">
                          {log.status === 'Completed' ? (
                            <span className={`px-2 py-1 rounded font-bold text-[11px] ${log.avgAccuracy >= 80 ? 'text-emerald-400 bg-emerald-950/20' : log.avgAccuracy >= 50 ? 'text-amber-400 bg-amber-950/20' : 'text-red-400 bg-red-950/20'}`}>
                              {log.avgAccuracy}%
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">N/A</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${log.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : log.status === 'Terminated' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {log.status === 'Completed' ? (
                            <button
                              onClick={() => fetchAndOpenReportDetail(log._id)}
                              className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded font-semibold text-[10px] transition-all uppercase tracking-wider font-mono cursor-pointer"
                            >
                              View Report
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[10px] font-mono">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* ─── INTERACTIVE SESSION REPORT MODAL (UX PRIORITY) ─── */}
      {isReportModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(16px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '2rem' }}>
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-[fadeIn_0.2s_ease-out]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">Screening Performance Transcript Matrix</span>
                <h2 className="text-xl font-black text-slate-100 mt-1">
                  Session Detail: #{selectedSessionDetail?.session?.interviewId?._id?.slice(-6).toUpperCase() || 'LOAD_LOG'}
                </h2>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
              >
                CLOSE_METRIC
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex-1 p-16 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <p className="font-mono text-xs tracking-widest text-cyan-400 animate-pulse uppercase">Syncing_Session_Transcripts_Database...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-[fadeIn_0.2s_ease-out]">
                
                {/* Stats Summary Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl">
                  <div className="text-center md:border-r border-slate-800/60 p-2">
                    <p className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider mb-1">Session Accuracy</p>
                    <span className="text-3xl font-black text-cyan-400">
                      {selectedSessionDetail?.session?.conversationContext
                        ? (() => {
                            const answers = selectedSessionDetail.session.conversationContext.filter(c => c.role === 'candidate');
                            const totalScore = answers.reduce((acc, curr) => acc + (curr.accuracyScore || 0), 0);
                            return answers.length > 0 ? Math.round(totalScore / answers.length) : 0;
                          })()
                        : 0}%
                    </span>
                  </div>
                  <div className="text-center md:border-r border-slate-800/60 p-2">
                    <p className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider mb-1">Integrity Violations</p>
                    <span className={`text-3xl font-black ${selectedSessionDetail?.proctorLog?.tabSwitchesCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {selectedSessionDetail?.proctorLog?.tabSwitchesCount || 0} Flags
                    </span>
                  </div>
                  <div className="text-center p-2">
                    <p className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider mb-1">Verdict</p>
                    <span className={`text-lg font-black uppercase tracking-wider ${selectedSessionDetail?.proctorLog?.isFlaggedForCheating ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                      {selectedSessionDetail?.proctorLog?.isFlaggedForCheating ? '⚠️ FLAGGED' : '✅ SECURE'}
                    </span>
                  </div>
                </div>

                {/* Dialogues List */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono border-b border-slate-800 pb-2">Dialogue Transcription Logs</h3>
                  {selectedSessionDetail?.session?.conversationContext?.map((item, idx) => {
                    const isAi = item.role === 'interviewer';
                    return (
                      <div key={idx} className="flex flex-col gap-2.5">
                        <div className={`p-4 rounded-xl border flex flex-col gap-1.5 ${isAi ? 'bg-blue-950/20 border-blue-900/30' : 'bg-slate-950 border-slate-800/60'}`}>
                          <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 mb-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest font-mono ${isAi ? 'text-blue-400' : 'text-slate-400'}`}>
                              {isAi ? '🤖 AI INTERVIEWER' : '👤 CANDIDATE ANSWER'}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed font-sans">{item.text}</p>
                        </div>

                        {/* AI Evaluation details underneath candidate answer */}
                        {!isAi && item.accuracyScore !== null && (
                          <div className="ml-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                                📊 AI Evaluation Score Card
                              </span>
                              <span className={`px-2 py-0.5 rounded font-black text-xs font-mono ${item.accuracyScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : item.accuracyScore >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                Score: {item.accuracyScore}/100
                              </span>
                            </div>
                            {item.feedback && (
                              <div className="text-xs">
                                <strong className="text-slate-450 block mb-0.5 font-mono uppercase tracking-wider text-[9px]">AI Critique Feedback:</strong>
                                <p className="text-slate-300 font-sans leading-relaxed">{item.feedback}</p>
                              </div>
                            )}
                            {item.keyPointsMissed && item.keyPointsMissed.length > 0 && (
                              <div className="text-xs">
                                <strong className="text-slate-455 block mb-1 font-mono uppercase tracking-wider text-[9px]">Key Terms Missed:</strong>
                                <div className="flex flex-wrap gap-1.5">
                                  {item.keyPointsMissed.map((pt, pIdx) => (
                                    <span key={pIdx} className="bg-red-950/20 border border-red-900/30 text-red-400 text-[9px] px-2 py-0.5 rounded font-mono font-medium">
                                      ❌ {pt}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {item.suggestions && (
                              <div className="text-xs">
                                <strong className="text-slate-450 block mb-0.5 font-mono uppercase tracking-wider text-[9px]">Suggestions for Improvement:</strong>
                                <p className="text-slate-300 font-sans leading-relaxed italic">💡 {item.suggestions}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewDashboard;