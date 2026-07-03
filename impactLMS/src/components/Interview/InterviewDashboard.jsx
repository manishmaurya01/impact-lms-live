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

  const BACKEND_URL = 'http://localhost:5000/api';
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

  const activeCourseObj = courses.find(c => c._id === activeCourseFilter);
  const filteredModulesList = activeCourseObj?.modules || [];
  const filteredHistoryLogs = historicalLogs.filter(log => log.courseId === activeCourseFilter);

  const totalScheduledForCourse = filteredHistoryLogs.length;
  const totalCompletedForCourse = filteredHistoryLogs.filter(l => l.status === 'Completed').length;
  const totalFlagsForCourse = filteredHistoryLogs.reduce((acc, curr) => acc + (curr.proctorLog?.tabSwitchesCount || 0), 0);

  const handleModuleSelectionChange = (moduleIdValue) => {
    setSelectedModuleId(moduleIdValue);
    if (!moduleIdValue) {
      setSelectedTopics([]);
      return;
    }

    const targetModule = filteredModulesList.find(m => String(m.moduleId) === String(moduleIdValue));
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
            <h4 className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">Booked Tests</h4>
            <p className="text-4xl font-black text-slate-100">{totalScheduledForCourse}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
            <h4 className="text-[10px] uppercase text-emerald-400 font-black tracking-widest mb-1">Completed Sessions</h4>
            <p className="text-4xl font-black text-slate-100">{totalCompletedForCourse}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
            <h4 className="text-[10px] uppercase text-red-400 font-black tracking-widest mb-1">Cumulative Flags</h4>
            <p className="text-4xl font-black text-slate-100">{totalFlagsForCourse}</p>
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
                  <option key={m.moduleId} value={m.moduleId}>
                    Module {m.moduleId}: {m.moduleName}
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
                    <th className="p-4">Session Hash Token</th>
                    <th className="p-4">Rubric Depth</th>
                    <th className="p-4">Surveillance Log</th>
                    <th className="p-4">State Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300 font-medium">
                  {filteredHistoryLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-500 font-mono tracking-wider">NO_SESSIONS_RECORDED_FOR_THIS_WORKSPACE</td>
                    </tr>
                  ) : (
                    filteredHistoryLogs.map(log => (
                      <tr key={log._id} className="hover:bg-slate-950/30 transition-colors">
                        <td className="p-4 font-mono text-blue-400">#{log._id.slice(-6).toUpperCase()}</td>
                        <td className="p-4"><span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono">{log.difficulty}</span></td>
                        <td className="p-4 font-mono text-slate-400">Tab Blurs: <strong className={log.proctorLog?.tabSwitchesCount > 0 ? 'text-red-400' : 'text-slate-500'}>{log.proctorLog?.tabSwitchesCount || 0}</strong></td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${log.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : log.status === 'Terminated' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {log.status}
                          </span>
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
    </div>
  );
};

export default InterviewDashboard;