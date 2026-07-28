import React, { useState, useEffect } from 'react';
import WorkspaceHeader from './modules/WorkspaceHeader';
import ModuleSidebarTree from './modules/ModuleSidebarTree';
import MainResourceCanvas from './modules/MainResourceCanvas';
import TakeQuizView from '../../quiz/TakeQuizView'; 
import TakeAssignmentView from '../../Asignment/TakeAssignmentView'; 
import DoubtSolverWidget from './modules/DoubtSolverWidget'; 

export default function AICourseLearningWorkspace({ courseData, onBack }) {
  const [activeModuleId, setActiveModuleId] = useState(courseData?.lastActiveModuleId || courseData?.modules[0]?.dayId || 1);
  const [activeTopicIndex, setActiveTopicIndex] = useState(courseData?.lastActiveTopicIndex || 0);
  const [activeTab, setActiveTab] = useState('video'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  // CORE STATE REPOSITORIES
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [isSyncingMaterial, setIsSyncingMaterial] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [completedTracks, setCompletedTracks] = useState(() => {
    const tracks = {};
    if (courseData?.completedTopics && courseData.completedTopics.length > 0) {
      courseData.completedTopics.forEach(t => {
        tracks[t] = true;
      });
    } else {
      tracks[`mod-${courseData?.modules[0]?.dayId || 1}-topic-0`] = true;
    }
    return tracks;
  });
  
  // METRICS REPOSITORIES TELEMETRY CACHE
  const [quizResultsCache, setQuizResultsCache] = useState({});
  const [assignmentLocksCache, setAssignmentLocksCache] = useState({});

  // ROUTING FLAGS FOR FULLSCREEN SECURITY TERMINALS
  const [quizModeActive, setQuizModeActive] = useState(false);
  const [assignmentModeActive, setAssignmentModeActive] = useState(false); 

  const modulesArray = courseData?.modules || [];
  const currentModuleIndex = modulesArray.findIndex(m => m.dayId === activeModuleId);
  const currentModule = modulesArray[currentModuleIndex] || modulesArray[0];
  
  const currentTopicName = currentModule?.topics?.[activeTopicIndex] || "No Content Available";
  const trackKey = `mod-${activeModuleId}-topic-${activeTopicIndex}`;

  const saveProgressToDb = async (updatedCompletedTracks = completedTracks, modId = activeModuleId, topicIdx = activeTopicIndex) => {
    try {
      const token = localStorage.getItem('token');
      const completedKeys = Object.keys(updatedCompletedTracks).filter(k => updatedCompletedTracks[k]);
      await fetch(`${window.API_URL}/api/courses/${courseData._id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          completedTopics: completedKeys,
          lastActiveModuleId: modId,
          lastActiveTopicIndex: topicIdx
        })
      });
    } catch (err) {
      console.error("Error saving progress to DB:", err);
    }
  };

  // INTEGRATED DATABASE STATUS AUTO-FETCHER
  const loadTopicMaterialOnDemand = async (modId, topicIdx, specificTopicName) => {
    setIsSyncingMaterial(true);
    setSyncProgress(0);
    setActiveModuleId(modId);
    setActiveTopicIndex(topicIdx);
    setActiveMaterial(null); 
    saveProgressToDb(completedTracks, modId, topicIdx);
    
    let progressVal = 0;
    const progressInterval = setInterval(() => {
      if (progressVal < 40) {
        progressVal += Math.floor(Math.random() * 8) + 4;
      } else if (progressVal < 70) {
        progressVal += Math.floor(Math.random() * 5) + 2;
      } else if (progressVal < 90) {
        progressVal += Math.floor(Math.random() * 3) + 1;
      } else if (progressVal < 98) {
        progressVal += 1;
      }
      setSyncProgress(Math.min(progressVal, 98));
    }, 150);
    
    try {
      const token = localStorage.getItem('token');
      const currentTrackKey = `mod-${modId}-topic-${topicIdx}`;
      
      // 1. Fetch Concept Materials Layer
      const response = await fetch(`${window.API_URL}/api/courses/fetch-material`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseId: courseData._id, moduleId: modId, topicName: specificTopicName })
      });
      const json = await response.json();
      if (json.success && json.data) {
        setActiveMaterial(json.data);
      }

      // 2. LIVE DATABASE QUIZ LOCK CHECK
      const lockRes = await fetch(`${window.API_URL}/api/quiz/check-lock-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseId: courseData._id, moduleId: modId, topicName: specificTopicName })
      });
      const lockJson = await lockRes.json();
      if (lockJson.success && lockJson.isLocked) {
        setQuizResultsCache(prev => ({ ...prev, [currentTrackKey]: lockJson.resultData }));
      }

      // 3. LIVE DATABASE ASSIGNMENT LOCK CHECK
      const assignRes = await fetch(`${window.API_URL}/api/assignment/check-lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseId: courseData._id, moduleId: modId, topicName: specificTopicName })
      });
      const assignJson = await assignRes.json();
      if (assignJson.success && assignJson.isLocked) {
        setAssignmentLocksCache(prev => ({ ...prev, [currentTrackKey]: assignJson.data.aiEvaluationLog }));
      }

      clearInterval(progressInterval);
      setSyncProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (err) {
      console.error("Failed syncing material details:", err);
      clearInterval(progressInterval);
      setSyncProgress(0);
    } finally {
      setIsSyncingMaterial(false);
    }
  };

  useEffect(() => {
    const syncLatestCourseProgress = async () => {
      let activeCompleted = courseData?.completedTopics || [];
      let initModId = courseData?.lastActiveModuleId || modulesArray[0]?.dayId || 1;
      let initTopicIdx = courseData?.lastActiveTopicIndex || 0;

      try {
        const token = localStorage.getItem('token');
        if (courseData?._id && token) {
          const res = await fetch(`${window.API_URL}/api/courses/${courseData._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const json = await res.json();
          if (json.success && json.data) {
            if (json.data.completedTopics) activeCompleted = json.data.completedTopics;
            if (json.data.lastActiveModuleId) initModId = json.data.lastActiveModuleId;
            if (json.data.lastActiveTopicIndex !== undefined) initTopicIdx = json.data.lastActiveTopicIndex;
          }
        }
      } catch (err) {
        console.error("Failed fetching latest course progress:", err);
      }

      const tracks = {};
      if (activeCompleted.length > 0) {
        activeCompleted.forEach(t => { tracks[t] = true; });
      }
      tracks[`mod-${modulesArray[0]?.dayId || 1}-topic-0`] = true;
      setCompletedTracks(tracks);

      setActiveModuleId(initModId);
      setActiveTopicIndex(initTopicIdx);

      const targetModule = modulesArray.find(m => m.dayId === initModId) || modulesArray[0];
      const targetTopicName = targetModule?.topics?.[initTopicIdx] || "";
      loadTopicMaterialOnDemand(initModId, initTopicIdx, targetTopicName);
    };

    if (modulesArray.length > 0) {
      syncLatestCourseProgress();
    }
  }, [courseData?._id]);

  const handleTopicSelection = (modId, topicIdx) => {
    setActiveTab('video');
    setQuizModeActive(false); 
    setAssignmentModeActive(false); 
    const targetModule = modulesArray.find(m => m.dayId === modId);
    const targetTopicName = targetModule?.topics?.[topicIdx] || "";
    loadTopicMaterialOnDemand(modId, topicIdx, targetTopicName);
  };

  const markTopicAsCompleted = () => {
    window.speechSynthesis.cancel(); 
    const currentKey = `mod-${activeModuleId}-topic-${activeTopicIndex}`;
    const updated = { ...completedTracks, [currentKey]: true };
    setCompletedTracks(updated);
    saveProgressToDb(updated, activeModuleId, activeTopicIndex);

    if (activeTopicIndex + 1 < (currentModule?.topics?.length || 0)) {
      handleTopicSelection(activeModuleId, activeTopicIndex + 1);
    } else if (currentModuleIndex + 1 < modulesArray.length) {
      const nextModuleObj = modulesArray[currentModuleIndex + 1];
      handleTopicSelection(nextModuleObj.dayId, 0);
    } else {
      alert("🎉 You have completed this course! Excellent job!");
    }
  };

  const handleQuizSubmissionSuccess = (scorePayload) => {
    const activeTrackKey = `mod-${activeModuleId}-topic-${activeTopicIndex}`;
    setQuizResultsCache(prev => ({ ...prev, [activeTrackKey]: scorePayload }));
    setActiveTab('quiz'); 
    setQuizModeActive(false); 
  };

  const handleAssignmentSubmissionSuccess = (evaluationPayload) => {
    const activeTrackKey = `mod-${activeModuleId}-topic-${activeTopicIndex}`;
    setAssignmentLocksCache(prev => ({ ...prev, [activeTrackKey]: evaluationPayload }));
    setActiveTab('assignment');
    setAssignmentModeActive(false);
  };

  const triggerAssignmentWorkspaceActivation = () => {
    const activeAssignment = currentModule?.schedules?.assignment;
    if (!activeAssignment || !activeAssignment.assignmentObjective || activeAssignment.assignmentObjective.trim() === "" || activeAssignment.assignmentObjective === "Implement concepts learned today.") {
      return alert("⚠️ This topic does not require a technical assignment.");
    }
    if (assignmentLocksCache[trackKey]) {
      return alert("⚠️ Assignment has already been submitted and verified.");
    }
    setAssignmentModeActive(true);
  };

  if (quizModeActive) {
    return (
      <TakeQuizView 
        quiz={currentModule?.schedules?.quiz} 
        topicName={currentTopicName}
        courseId={courseData?._id}
        moduleId={activeModuleId}
        onBackToWorkspace={() => setQuizModeActive(false)} 
        onQuizSubmitFinished={handleQuizSubmissionSuccess} 
      />
    );
  }

  if (assignmentModeActive) {
    return (
      <TakeAssignmentView 
        assignment={currentModule?.schedules?.assignment}
        topicName={currentTopicName}
        courseId={courseData?._id}
        moduleId={activeModuleId}
        onBackToWorkspace={() => setAssignmentModeActive(false)}
        onAssignmentFinished={handleAssignmentSubmissionSuccess}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-main)', overflow: 'hidden' }}>
      <style>{`
        @keyframes workspaceCoreSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .workspace-sidebar-container {
            position: absolute !important;
            left: ${isSidebarOpen ? '0' : '-320px'} !important;
            top: 0;
            bottom: 0;
            height: 100% !important;
            z-index: 100 !important;
            transition: left 0.3s cubic-bezier(0.25, 1, 0.5, 1) !important;
            box-shadow: var(--shadow-md) !important;
          }
        }
        @media (min-width: 1025px) {
          .workspace-sidebar-toggle-btn {
            display: none !important;
          }
        }
      `}</style>
      <WorkspaceHeader 
        courseTitle={courseData?.title} 
        modules={modulesArray}
        completedTracks={completedTracks}
        onBack={onBack} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* Mobile Sidebar dimming backdrop */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(3px)', zIndex: 98 }}
          />
        )}

        <ModuleSidebarTree 
          modules={modulesArray} 
          activeModuleId={activeModuleId}
          activeTopicIndex={activeTopicIndex}
          completedTracks={completedTracks}
          onSelectTopic={(modId, topicIdx) => {
            setIsSidebarOpen(false); // Auto close sidebar on mobile topic select
            handleTopicSelection(modId, topicIdx);
          }}
        />

        {isSyncingMaterial && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
            <div style={{ width: '90%', maxWidth: '400px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '2.5rem 2rem', borderRadius: '1rem', boxShadow: 'var(--shadow-lg)', textAlign: 'center', boxSizing: 'border-box' }}>
              <div style={{ margin: '0 auto 1.5rem auto', width: '44px', height: '44px', border: '3px solid rgba(139, 92, 246, 0.1)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', animation: 'workspaceCoreSpin 0.85s linear infinite' }} />
              <h3 style={{ margin: '0 0 0.6rem 0', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '600' }}>Syncing Study Data ({syncProgress}%)</h3>
              
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden', margin: '1rem 0 1.5rem 0' }}>
                <div style={{ width: `${syncProgress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.2s ease-out' }} />
              </div>

              <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0', lineHeight: '1.4' }}>Loading learning path and verified topic guides...</p>
            </div>
          </div>
        )}

        <MainResourceCanvas 
          topicName={currentTopicName}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          videoSearchQuery={activeMaterial?.videoLink || "https://www.youtube.com"}
          materialNotes={activeMaterial} 
          quiz={currentModule?.schedules?.quiz} 
          assignment={currentModule?.schedules?.assignment} 
          onComplete={markTopicAsCompleted} 
          onLaunchQuiz={() => setQuizModeActive(true)}
          onLaunchAssignment={triggerAssignmentWorkspaceActivation} 
          courseId={courseData?._id}
          moduleId={activeModuleId}
          activeQuizResult={quizResultsCache[trackKey]} 
          activeAssignmentResult={assignmentLocksCache[trackKey]}
        />

        <DoubtSolverWidget 
          courseId={courseData?._id}
          moduleId={activeModuleId}
          moduleName={currentModule?.title}
          topicName={currentTopicName}
        />
      </div>
    </div>
  );
} 