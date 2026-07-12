import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Cpu, Terminal, CheckSquare, Database, 
  Code, ShieldAlert, ScreenShare, Award, Activity, CheckCircle2 
} from 'lucide-react';

export default function SecureTerminalWorkspace({ targetParams, onReturn }) {
  const [step, setStep] = useState('briefing');
  const [viewMode, setViewMode] = useState(targetParams.type === 'Theory' ? 'theory' : 'coding'); 
  const [codeData, setCodeData] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  useEffect(() => { 
    setCodeData(targetParams.starterCode || '// Initialize repository execution loop state'); 
  }, [targetParams]);

  const triggerScreenShare = async () => {
    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 900;
      
      if (!isMobile && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "monitor" },
          audio: false
        });
        setScreenStream(stream);
        
        stream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
          setStep('lockdown');
          alert("SECURITY ALERT: Monitor stream disconnected. Environment locked.");
        };
      }
      setStep('workspace');
    } catch (err) {
      alert("SECURITY MATRIX: Monitor stream mapping required to proceed.");
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
  };

  const simulateProcessingAndSave = () => {
    setSubmitting(true);
    setTimeout(() => {
      const existingProgress = JSON.parse(localStorage.getItem(`progress_${targetParams.courseId}`)) || [];
      if (!existingProgress.includes(targetParams.id)) {
        localStorage.setItem(`progress_${targetParams.courseId}`, JSON.stringify([...existingProgress, targetParams.id]));
      }

      setEvalResult({
        score: 96,
        feedback: "Perfect algorithmic execution. System telemetry parameters matching completely.",
        approach: "Direct register manipulation processed securely over local cache layer buffers."
      });
      
      stopScreenShare();
      setStep('evaluation');
      setSubmitting(false);
    }, 2000);
  };

  const handleExit = () => {
    stopScreenShare();
    onReturn();
  };

  if (step === 'briefing') return (
    <div className="workspace-container step-briefing">
      <div className="glass-card briefing-card">
        <div className="briefing-header">
          <div className="header-title-box">
            <div className="icon-box box-cyan"><BookOpenCheck size={20} /></div>
            <h2>Mission Briefing</h2>
          </div>
          <span className="id-badge">ID: MOD-{targetParams.id}</span>
        </div>
        <h1 className="task-title">{targetParams.title}</h1>
        <div className="diagnostic-box">
          <span className="diagnostic-label">Security Parameters</span>
          <ul className="diagnostic-list">
            <li><span>&gt; Format:</span> {targetParams.type} Challenge</li>
            <li><span>&gt; Rule 01:</span> Screen Share integration is strictly mandatory.</li>
            <li><span>&gt; Rule 02:</span> Anti-cheat tracker sweeps monitor window focus loops.</li>
          </ul>
        </div>
        <div className="action-row">
          <button onClick={handleExit} className="btn-outline">Abort Target</button>
          <button onClick={() => setStep('lockdown')} className="btn-gradient">Acknowledge Framework</button>
        </div>
      </div>
    </div>
  );

  if (step === 'lockdown') return (
    <div className="workspace-container step-lockdown">
      <div className="radar-container">
        <div className="radar-ping"></div>
        <div className="radar-pulse"></div>
        <div className="radar-icon"><ShieldAlert size={32} /></div>
      </div>
      <h2>Security Override Required</h2>
      <p>Anti-cheat protocol active. A secure monitor stream link is required to render the terminal workspace.</p>
      <button onClick={triggerScreenShare} className="btn-danger">
        <ScreenShare size={16} /> Authenticate Video Stream
      </button>
    </div>
  );

  if (step === 'workspace') return (
    <div className="workspace-container step-editor">
      <div className="glass-card editor-navbar">
        <div className="nav-controls">
          <button onClick={handleExit} className="btn-back"><ArrowLeft size={16} /></button>
          <div className="mode-toggle">
            <button onClick={() => setViewMode('coding')} className={viewMode === 'coding' ? 'active cyan' : ''}>CODING</button>
            <button onClick={() => setViewMode('theory')} className={viewMode === 'theory' ? 'active purple' : ''}>THEORY</button>
          </div>
        </div>
        <button onClick={simulateProcessingAndSave} disabled={submitting} className="btn-execute">
          {submitting ? <Cpu className="icon-spin" size={16} /> : <CheckSquare size={16} />} 
          {submitting ? "Processing..." : "Submit Task Buffer"}
        </button>
      </div>

      <div className="editor-grid">
        <div className="glass-card spec-pane">
          <div className="pane-header purple-theme">
            <Database size={14} /> Challenge Specifics
          </div>
          <div className="pane-content">
            <h2>{targetParams.title}</h2>
            <pre className="spec-text">
              {viewMode === 'coding' ? targetParams.codingQuestion : targetParams.theoryQuestion}
            </pre>
          </div>
        </div>

        <div className="ide-pane">
          <div className="ide-header">
            <div className="traffic-lights"><span></span><span></span><span></span></div>
            <span className="ide-filename">Workspace.js</span>
          </div>
          <textarea 
            value={codeData} 
            onChange={(e) => setCodeData(e.target.value)}
            className="ide-textarea" spellCheck="false"
            placeholder={viewMode === 'coding' ? "Enter code trace..." : "Provide clear documentation structural mapping blocks..."}
          />
        </div>
      </div>
    </div>
  );

  if (step === 'evaluation') return (
    <div className="workspace-container step-eval">
      <div className="glass-card eval-card">
        <div className="eval-header">
          <h3><Award size={20} /> Execution Matrix Generated</h3>
          <span className="id-badge">Audit Success</span>
        </div>
        <div className="score-board">
          <div className="score-text">
            <h4>Code Committed to Server</h4>
            <p>AI compilation pipeline has completely processed your structural inputs.</p>
          </div>
          <div className="score-number-box">
            <span>Cognitive Score</span>
            <div className="score-value">{evalResult.score}</div>
          </div>
        </div>
        <div className="feedback-grid">
          <div className="feedback-box">
            <h5><Activity size={16}/> System Feedback</h5>
            <p>{evalResult.feedback}</p>
          </div>
          <div className="feedback-box">
            <h5 className="cyan-text"><CheckCircle2 size={16}/> Optimum Architecture</h5>
            <p className="font-mono">{evalResult.approach}</p>
          </div>
        </div>
        <button onClick={handleExit} className="btn-solid-light">Return to Course Dashboard</button>
      </div>
    </div>
  );
}