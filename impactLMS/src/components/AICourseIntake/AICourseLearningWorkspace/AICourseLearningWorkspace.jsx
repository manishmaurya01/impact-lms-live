import React, { useState, useEffect } from 'react';
import WorkspaceHeader from './modules/WorkspaceHeader';
import ModuleSidebarTree from './modules/ModuleSidebarTree';
import MainResourceCanvas from './modules/MainResourceCanvas';
import TakeQuizView from '../../quiz/TakeQuizView'; 
import TakeAssignmentView from '../../Asignment/TakeAssignmentView'; 
import DoubtSolverWidget from './modules/DoubtSolverWidget'; 

export default function AICourseLearningWorkspace({ courseData, onBack }) {
  const [activeModuleId, setActiveModuleId] = useState(courseData?.modules[0]?.moduleId || 1);
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('video'); 

  // CORE STATE REPOSITORIES
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [isSyncingMaterial, setIsSyncingMaterial] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [completedTracks, setCompletedTracks] = useState({ "mod-1-topic-0": true });
  
  // METRICS REPOSITORIES TELEMETRY CACHE
  const [quizResultsCache, setQuizResultsCache] = useState({});
  const [assignmentLocksCache, setAssignmentLocksCache] = useState({});

  // ROUTING FLAGS FOR FULLSCREEN SECURITY TERMINALS
  const [quizModeActive, setQuizModeActive] = useState(false);
  const [assignmentModeActive, setAssignmentModeActive] = useState(false); 

  const modulesArray = courseData?.modules || [];
  const currentModuleIndex = modulesArray.findIndex(m => m.moduleId === activeModuleId);
  const currentModule = modulesArray[currentModuleIndex] || modulesArray[0];
  
  const currentTopicName = currentModule?.topics?.[activeTopicIndex] || "No Content Available";
  const trackKey = `mod-${activeModuleId}-topic-${activeTopicIndex}`;

  // INTEGRATED DATABASE STATUS AUTO-FETCHER
  const loadTopicMaterialOnDemand = async (modId, topicIdx, specificTopicName) => {
    setIsSyncingMaterial(true);
    setSyncProgress(0);
    setActiveModuleId(modId);
    setActiveTopicIndex(topicIdx);
    setActiveMaterial(null); 
    
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
      const response = await fetch('http://localhost:5000/api/courses/fetch-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseId: courseData._id, moduleId: modId, topicName: specificTopicName })
      });
      const json = await response.json();
      if (json.success && json.data) {
        setActiveMaterial(json.data);
      }

      // 2. LIVE DATABASE QUIZ LOCK CHECK
      const lockRes = await fetch('http://localhost:5000/api/quiz/check-lock-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseId: courseData._id, moduleId: modId, topicName: specificTopicName })
      });
      const lockJson = await lockRes.json();
      if (lockJson.success && lockJson.isLocked) {
        setQuizResultsCache(prev => ({ ...prev, [currentTrackKey]: lockJson.resultData }));
      }

      // 3. LIVE DATABASE ASSIGNMENT LOCK CHECK
      const assignRes = await fetch('http://localhost:5000/api/assignment/check-lock', {
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
      console.error("Failed syncing material collection layer:", err);
      clearInterval(progressInterval);
      setSyncProgress(0);
    } finally {
      setIsSyncingMaterial(false);
    }
  };

  useEffect(() => {
    if (modulesArray.length > 0) {
      loadTopicMaterialOnDemand(activeModuleId, activeTopicIndex, currentModule?.topics?.[0] || "");
    }
  }, []);

  const handleTopicSelection = (modId, topicIdx) => {
    setActiveTab('video');
    setQuizModeActive(false); 
    setAssignmentModeActive(false); 
    const targetModule = modulesArray.find(m => m.moduleId === modId);
    const targetTopicName = targetModule?.topics?.[topicIdx] || "";
    loadTopicMaterialOnDemand(modId, topicIdx, targetTopicName);
  };

  const markTopicAsCompleted = () => {
    window.speechSynthesis.cancel(); 
    const currentKey = `mod-${activeModuleId}-topic-${activeTopicIndex}`;
    setCompletedTracks(prev => ({ ...prev, [currentKey]: true }));

    if (activeTopicIndex + 1 < (currentModule?.topics?.length || 0)) {
      handleTopicSelection(activeModuleId, activeTopicIndex + 1);
    } else if (currentModuleIndex + 1 < modulesArray.length) {
      const nextModuleObj = modulesArray[currentModuleIndex + 1];
      handleTopicSelection(nextModuleObj.moduleId, 0);
    } else {
      alert("🎉 Dynamic curriculum paths completely verified!");
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

  // Safe Guardrail Interceptor Rule to Lock Finished Sessions completely
  const triggerAssignmentWorkspaceActivation = () => {
    const activeAssignment = currentModule?.assignment;
    if (!activeAssignment || !activeAssignment.assignmentObjective || activeAssignment.assignmentObjective.trim() === "" || activeAssignment.assignmentObjective === "Implement concepts learned today.") {
      return alert("⚠️ This topic does not require a technical assignment.");
    }
    if (assignmentLocksCache[trackKey]) {
      return alert("⚠️ Access Denied: Assignment has already been submitted and securely locked in historical database clusters.");
    }
    setAssignmentModeActive(true);
  };

  if (quizModeActive) {
    return (
      <TakeQuizView 
        quiz={currentModule?.quiz} 
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
        assignment={currentModule?.assignment}
        topicName={currentTopicName}
        courseId={courseData?._id}
        moduleId={activeModuleId}
        onBackToWorkspace={() => setAssignmentModeActive(false)}
        onAssignmentFinished={handleAssignmentSubmissionSuccess}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#02040a', overflow: 'hidden' }}>
      <WorkspaceHeader 
        courseTitle={courseData?.title} 
        modules={modulesArray}
        completedTracks={completedTracks}
        onBack={onBack} 
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <ModuleSidebarTree 
          modules={modulesArray} 
          activeModuleId={activeModuleId}
          activeTopicIndex={activeTopicIndex}
          completedTracks={completedTracks}
          onSelectTopic={handleTopicSelection}
        />

        {isSyncingMaterial && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(2, 4, 10, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
            <div style={{ width: '400px', background: '#070a12', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '2.5rem 2rem', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', textAlign: 'center' }}>
              <div style={{ margin: '0 auto 1.5rem auto', width: '44px', height: '44px', border: '3px solid rgba(6, 182, 212, 0.1)', borderTop: '3px solid #06b6d4', borderRadius: '50%', animation: 'workspaceCoreSpin 0.85s linear infinite' }} />
              <h3 style={{ margin: '0 0 0.6rem 0', color: '#fff', fontSize: '1.2rem', fontWeight: '600' }}>Syncing Workspace Telemetry ({syncProgress}%)</h3>
              
              <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden', margin: '1rem 0 1.5rem 0' }}>
                <div style={{ width: `${syncProgress}%`, height: '100%', background: '#06b6d4', transition: 'width 0.2s ease-out', boxShadow: '0 0 10px #06b6d4' }} />
              </div>

              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0', lineHeight: '1.4' }}>Loading dynamic learning paths and looking up server lock verification database logs...</p>
            </div>
            <style>{`@keyframes workspaceCoreSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        <MainResourceCanvas 
          topicName={currentTopicName}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          videoSearchQuery={activeMaterial?.videoLink || "https://www.youtube.com"}
          materialNotes={activeMaterial} 
          quiz={currentModule?.quiz} 
          assignment={currentModule?.assignment} 
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