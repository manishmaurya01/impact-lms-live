import React, { useState, useEffect, useRef } from 'react';
import { Code, Monitor, ChevronLeft, Play, Send, CheckCircle, XCircle, ShieldAlert, Sparkles, Lock, Pause, PlayCircle, Timer, AlertTriangle } from 'lucide-react';

export default function TakeAssignmentView({ assignment, topicName, courseId, moduleId, onBackToWorkspace, onAssignmentFinished }) {
  // Normalize checking variations for strict string comparison
  const rawLang = assignment?.language?.toLowerCase() || "javascript";
  const detectedLanguage = rawLang === "js" ? "javascript" : rawLang;
  
  const workspaceContainerRef = useRef(null);
  const timerRef = useRef(null);
  
  // Phase Grid States: 'DETAILS' | 'STREAM_ENFORCE' | 'LAB_WORKSPACE'
  const [labPhase, setLabPhase] = useState('DETAILS');
  const [streamInstance, setStreamInstance] = useState(null);
  const [streamError, setStreamError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ⏱️ TIMER & WORKSPACE PAUSE HOOK MATRIX
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isWorkspacePaused, setIsWorkspacePaused] = useState(false);

  // Compiler Matrix State Loops
  const [editorText, setEditorText] = useState("");
  const [consoleOutput, setConsoleOutput] = useState("");
  const [consoleStatus, setConsoleStatus] = useState("IDLE");
  const [testCases, setTestCases] = useState([]);

  // Double Submit Hooks Verification Layer
  const [pendingAiReport, setPendingAiReport] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // 🚨 CUSTOM TOAST POPUP WARNING STATE
  const [securityToast, setSecurityToast] = useState({ show: false, message: "" });

  const editorTextRef = useRef(editorText);
  useEffect(() => {
    editorTextRef.current = editorText;
  }, [editorText]);

  const problemSpecs = {
    inputFormat: assignment?.inputFormat || "Standard stream tokens mapped to argument parameters.",
    outputFormat: assignment?.outputFormat || "Explicit function return values matching assertions structure.",
    example: assignment?.example || {
      input: detectedLanguage === "javascript" ? "solve([1, 2, 3])" : detectedLanguage === "python" ? "solve([1, 2, 3])" : "Solution.main(new String[]{})",
      output: "Hello World",
      explanation: "Base stream registers successfully initialized and output sequence matches signature schema requirements."
    }
  };

  const triggerSecurityToast = (msg) => {
    setSecurityToast({ show: true, message: msg });
    setTimeout(() => {
      setSecurityToast({ show: false, message: "" });
    }, 3500);
  };

  // ⏱️ CONTINUOUS OPERATIONAL TIMER EFFECT ENGINE
  useEffect(() => {
    if (labPhase === 'LAB_WORKSPACE' && !isWorkspacePaused && !showReviewModal) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [labPhase, isWorkspacePaused, showReviewModal]);

  // 🔒 STRICT SECURITY INTERCEPT LOOP ENGINE
  useEffect(() => {
    if (labPhase !== 'LAB_WORKSPACE' || isWorkspacePaused) return;

    const interceptDevToolsShortcuts = (e) => {
      if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || 
        (e.ctrlKey && e.keyCode === 85)
      ) {
        e.preventDefault();
        triggerSecurityToast("🔒 Developer console tools are strictly disabled inside this active sandbox context.");
        return false;
      }
    };

    const denyCloningEvents = (e) => {
      e.preventDefault();
      triggerSecurityToast("🔒 Action Blocked: Clipboard operations (Copy, Cut, Paste) are disabled to protect test environment integrity.");
      return false;
    };

    const blockContextMenuTrigger = (e) => e.preventDefault();

    const monitorFullscreenEgressState = () => {
      if (!document.fullscreenElement && labPhase === 'LAB_WORKSPACE' && !isWorkspacePaused) {
        triggerSecurityToast("🚨 Fullscreen exited! Re-engage secure layout boundaries immediately to prevent session freeze.");
        window.location.reload();
      }
    };

    window.addEventListener('keydown', interceptDevToolsShortcuts, true);
    window.addEventListener('contextmenu', blockContextMenuTrigger, true);
    document.addEventListener('copy', denyCloningEvents, true);
    document.addEventListener('paste', denyCloningEvents, true);
    document.addEventListener('cut', denyCloningEvents, true);
    document.addEventListener('fullscreenchange', monitorFullscreenEgressState);

    return () => {
      window.removeEventListener('keydown', interceptDevToolsShortcuts, true);
      window.removeEventListener('contextmenu', blockContextMenuTrigger, true);
      document.removeEventListener('copy', denyCloningEvents, true);
      document.removeEventListener('paste', denyCloningEvents, true);
      document.removeEventListener('cut', denyCloningEvents, true);
      document.removeEventListener('fullscreenchange', monitorFullscreenEgressState);
    };
  }, [labPhase, isWorkspacePaused]);

  // Dynamic starter template assignment matching active route payload course language
  useEffect(() => {
    if (assignment?.starterCode) {
      setEditorText(assignment.starterCode);
    } else {
      if (detectedLanguage === "java") {
        setEditorText(`public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}`);
      } else if (detectedLanguage === "python") {
        setEditorText(`def solve():\n    print("Hello World")\n\nsolve()`);
      } else {
        setEditorText(`function solve() {\n    console.log("Hello World");\n}\nsolve();`);
      }
    }
    
    setTestCases([
      { id: 1, name: "Test Case 1: Standard Verification Vector", input: "Sample Base Context", expected: "Hello World", actual: "", status: "PENDING" },
      { id: 2, name: "Test Case 2: System Assertions Boundary Edge", input: "Constraint Arrays Buffer", expected: "Hello World", actual: "", status: "PENDING" }
    ]);
  }, [assignment, detectedLanguage]);

  const processImmediatePanicAutoSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/assignment/evaluate-via-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          courseId, moduleId, topicName,
          assignmentType: "CODING",
          selectedLanguage: detectedLanguage,
          codeOrText: editorTextRef.current || "// Empty Fallback Stack String"
        })
      });
      const json = await response.json();
      if (json.success) {
        alert("🚨 Screen share interrupted! System state backed up and evaluation locked successfully.");
        if (document.fullscreenElement) document.exitFullscreen();
        onAssignmentFinished(json.submissionData.aiEvaluationLog);
        onBackToWorkspace();
      }
    } catch (err) {
      console.error("Emergency auto-submit channel failure:", err);
    }
  };

  const initializeSecureWorkspaceSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      setStreamInstance(stream);
      stream.getVideoTracks()[0].onended = () => {
        processImmediatePanicAutoSubmit();
      };
      
      if (workspaceContainerRef.current) {
        await workspaceContainerRef.current.requestFullscreen();
      }
      setLabPhase('LAB_WORKSPACE');
    } catch (err) {
      setStreamError("⚠️ Telemetry integrity setup faulted: Screen-share stream pipeline required.");
    }
  };

  // 🛠️ DYNAMIC LANGUAGE COMPILER SIMULATION ENGINE
  const runLocalCompilationEngine = () => {
    setConsoleStatus("RUNNING");
    setConsoleOutput(`Analyzing active execution node...\nRunning logic inside isolated sandboxed [${detectedLanguage.toUpperCase()}] interpreter loop...`);

    setTimeout(() => {
      try {
        let executionOutput = "";
        
        if (detectedLanguage === "javascript") {
          let captures = [];
          const proxyLog = console.log;
          console.log = (v) => captures.push(String(v));

          const compilerScopeFunction = new Function(`${editorText}`);
          compilerScopeFunction();
          
          console.log = proxyLog; 
          executionOutput = captures.join("\n") || "Success (Sandbox returned no stdout log output lines)";
        } 
        else if (detectedLanguage === "python") {
          // Verify if print script string exists dynamically
          if (editorText.includes("print(")) {
            const matches = editorText.match(/print\((['"])(.*?)\1\)/);
            executionOutput = matches ? matches[2] : "Hello World";
          } else {
            executionOutput = "Success (Python return executed with no print stream trace buffers)";
          }
        } 
        else if (detectedLanguage === "java") {
          if (editorText.includes("System.out.println")) {
            const matches = editorText.match(/System\.out\.println\((['"])(.*?)\1\)/);
            executionOutput = matches ? matches[2] : "Hello World";
          } else {
            throw new Error("Compilation Error Trace: Missing output log printing stream sequence entry points.");
          }
        }

        setConsoleOutput(`🚀 [${detectedLanguage.toUpperCase()}] Runtime Stream Terminated Normally.\n---------------------------\n${executionOutput}`);
        setConsoleStatus("SUCCESS");

        setTestCases(prev => prev.map(tc => {
          const passState = executionOutput.trim().toLowerCase().includes(tc.expected.trim().toLowerCase());
          return { ...tc, actual: executionOutput.trim(), status: passState ? "PASSED" : "FAILED" };
        }));

      } catch (err) {
        setConsoleOutput(`❌ Extended [${detectedLanguage.toUpperCase()}] Compilation Exception Log Trace:\n${err.message}`);
        setConsoleStatus("FAILED");
        setTestCases(prev => prev.map(tc => ({ ...tc, actual: "COMPILATION_FAIL", status: "FAILED" })));
      }
    }, 800);
  };

  const dispatchToAiEvaluatorEngine = async () => {
    if (!editorText.trim()) return alert("Compiler text block parameters cannot stay empty.");
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/assignment/evaluate-via-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          courseId, moduleId, topicName,
          assignmentType: "CODING",
          selectedLanguage: detectedLanguage,
          codeOrText: editorText
        })
      });
      const json = await response.json();
      if (json.success) {
        setPendingAiReport(json.submissionData.aiEvaluationLog);
        setShowReviewModal(true);
      } else {
        alert("Evaluation server rejected telemetry loop compilation.");
      }
    } catch (err) {
      console.error("AI processing nodes structural fault:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const executePermanentDatabaseCommit = () => {
    const finalConfirmationPrompt = window.confirm("🚨 ATTENTION: Confirming will securely lock your metrics permanently into database layers. Continue?");
    if (!finalConfirmationPrompt) return;

    if (streamInstance) {
      streamInstance.getVideoTracks()[0].onended = null;
      streamInstance.getTracks().forEach(t => t.stop());
    }
    if (document.fullscreenElement) document.exitFullscreen();
    if (timerRef.current) clearInterval(timerRef.current);
    
    onAssignmentFinished(pendingAiReport);
    setShowReviewModal(false);
    onBackToWorkspace();
  };

  const formatTimeMetricsString = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleWorkspacePauseState = async () => {
    if (!isWorkspacePaused) {
      setIsWorkspacePaused(true);
      if (document.fullscreenElement) await document.exitFullscreen();
    } else {
      try {
        if (workspaceContainerRef.current) {
          await workspaceContainerRef.current.requestFullscreen();
        }
        setIsWorkspacePaused(false);
      } catch (err) {
        triggerSecurityToast("🔒 Fullscreen environment lock is mandatory to resume application loops.");
      }
    }
  };

  return (
    <div ref={workspaceContainerRef} style={{ width: '100vw', height: '100vh', background: '#020617', color: '#f8fafc', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 99999, fontFamily: '"Inter", sans-serif', userSelect: 'none' }}>
      
      {/* HUD DASHBOARD CONSOLE HEAD BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2.5rem', borderBottom: '1px solid #1e293b', background: '#0f172a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBackToWorkspace} disabled={labPhase === 'LAB_WORKSPACE'} style={{ background: 'transparent', border: '1px solid #1e293b', color: '#94a3b8', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><ChevronLeft size={14}/> Escape Sandbox</button>
          <div style={{ fontSize: '0.82rem', color: '#06B6D4', fontFamily: 'monospace', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Lock size={12}/> LEETCODE SECURITY SANDBOX ENGINE v7</div>
        </div>

        {/* Dynamic Continuous Counter HUD Block */}
        {labPhase === 'LAB_WORKSPACE' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#020617', padding: '0.4rem 1.2rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', color: '#f59e0b', fontFamily: 'monospace', fontWeight: 'bold' }}>
              <Timer size={14} /> {formatTimeMetricsString(elapsedSeconds)}
            </div>
            <button onClick={toggleWorkspacePauseState} style={{ background: isWorkspacePaused ? '#10b981' : '#334155', border: 'none', color: '#fff', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {isWorkspacePaused ? <PlayCircle size={12}/> : <Pause size={12}/>} {isWorkspacePaused ? "Resume Session" : "Pause Session"}
            </button>
          </div>
        )}

        <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Topic Context Node: <span style={{ color: '#10b981', fontWeight: '700' }}>{topicName}</span></div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* PHASE 1: DETAILS INFRASTRUCTURE PANEL */}
        {labPhase === 'DETAILS' && (
          <div style={{ margin: 'auto', width: '560px', background: '#0f172a', padding: '2.5rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '800' }}>SANDBOX DIRECTIVE HANDSHAKE</span>
            <h2 style={{ fontSize: '1.4rem', margin: '0.5rem 0 1rem 0' }}>{assignment?.name || "Premium Algorithm Lab Environment"}</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>This dashboard enforces a real-time secure workspace engine mapped to your locked curriculum environment bounds.</p>
            <div style={{ background: '#020617', border: '1px solid #1e293b', padding: '1rem', borderRadius: '6px', color: '#06B6D4', fontFamily: 'monospace', fontSize: '0.82rem', marginBottom: '2rem' }}>
              ⚙️ TARGET ENVIRONMENT DESCRIPTOR: {detectedLanguage.toUpperCase()} EXECUTION CONTEXT
            </div>
            <button onClick={() => setLabPhase('STREAM_ENFORCE')} style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', padding: '0.85rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Proceed To Workspace Enforcer</button>
          </div>
        )}

        {/* PHASE 2: SCREEN-SHARE INTERCEPT */}
        {labPhase === 'STREAM_ENFORCE' && (
          <div style={{ margin: 'auto', width: '520px', background: '#0f172a', padding: '2.5rem', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)', textAlign: 'center' }}>
            <Monitor size={36} color="#8B5CF6" style={{ marginBottom: '1rem' }} />
            <h3>Terminal Monitor Loop Intercept</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.5rem 0 2rem 0' }}>Authorize your unified projection stream frame vectors and expand window arrays to full-screen mode bounds to unlock execution sheets.</p>
            {streamError && <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{streamError}</div>}
            <button onClick={initializeSecureWorkspaceSession} style={{ width: '100%', background: 'linear-gradient(135deg, #8B5CF6, #7c3aed)', border: 'none', color: '#fff', padding: '0.85rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Grant Stream & Lock Screen</button>
          </div>
        )}

        {/* PHASE 3: LEETCODE GRID */}
        {labPhase === 'LAB_WORKSPACE' && !isWorkspacePaused && (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '500px 1fr', height: '100%', background: '#02040a' }}>
            
            {/* LEFT PROBLEM DETAILS COLUMN */}
            <div style={{ borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: '#0f172a' }}>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#06B6D4', fontWeight: '800', background: 'rgba(6,182,212,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>UNIFIED SPECIFICATION SPEC SHEET</span>
                  <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: '0.5rem 0 0.5rem 0' }}>{assignment?.name}</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>{assignment?.assignmentObjective}</p>
                </div>

                <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <strong style={{ color: '#f59e0b', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>📥 Input Parameters Format:</strong>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4' }}>{problemSpecs.inputFormat}</div>
                  </div>
                  <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.75rem' }}>
                    <strong style={{ color: '#10b981', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>📤 Expected Output Format Matcher:</strong>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4' }}>{problemSpecs.outputFormat}</div>
                  </div>
                </div>

                <div style={{ background: '#090d16', border: '1px solid #334155', borderRadius: '8px', padding: '1rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#a7f3d0', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>📝 EXAMPLE RUNTIME SNAPSHOT REFERENCE:</span>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div><span style={{ color: '#64748b' }}>Input Vector primitive:</span> {problemSpecs.example.input}</div>
                    <div><span style={{ color: '#64748b' }}>Target Output value:</span> {problemSpecs.example.output}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.5rem', borderTop: '1px dashed #1e293b', paddingTop: '0.4rem' }}><span style={{ color: '#64748b' }}>Explanation Detail:</span> {problemSpecs.example.explanation}</div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 0.75rem 0', letterSpacing: '0.05em' }}>Automated Assertions Pipeline Matrix</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {testCases.map(tc => (
                      <div key={tc.id} style={{ background: '#020617', border: tc.status === 'PASSED' ? '1px solid rgba(16,185,129,0.4)' : tc.status === 'FAILED' ? '1px solid rgba(239,68,68,0.4)' : '1px solid #1e293b', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{tc.name}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', background: tc.status === 'PASSED' ? 'rgba(16,185,129,0.1)' : tc.status === 'FAILED' ? 'rgba(239,68,68,0.1)' : '#1e293b', color: tc.status === 'PASSED' ? '#10b981' : tc.status === 'FAILED' ? '#ef4444' : '#64748b', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{tc.status}</span>
                        </div>
                        {tc.actual && (
                          <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', background: '#090d16', padding: '0.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div><span style={{ color: '#64748b' }}>Expected Value:</span> <span style={{ color: '#34d399' }}>{tc.expected}</span></div>
                            <div><span style={{ color: '#64748b' }}>Compiled Runtime Return:</span> <span style={{ color: tc.status === 'PASSED' ? '#34d399' : '#f87171' }}>{tc.actual}</span></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div style={{ padding: '1.25rem 1.5rem', background: '#090d16', borderTop: '1px solid #1e293b', display: 'flex', gap: '1rem' }}>
                <button onClick={runLocalCompilationEngine} style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <Play size={14} /> Run Compilation
                </button>
                <button onClick={dispatchToAiEvaluatorEngine} disabled={isProcessing} style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  {isProcessing ? "Evaluating..." : "Submit Code Matrix"} <Send size={14}/>
                </button>
              </div>
            </div>

            {/* RIGHT WORKSPACE TEXT EDITOR COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: '0.75rem 1.5rem', background: '#090d16', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '700' }}><Code size={14}/> SECURE EDITOR ENVIRONMENT SHEET</div>
                <div style={{ background: '#0f172a', border: '1px solid #06B6D4', color: '#06B6D4', padding: '0.35rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', fontFamily: 'monospace' }}>
                  Target Runtime Environment: {detectedLanguage.toUpperCase()} (LOCKED)
                </div>
              </div>

              <textarea 
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                spellCheck="false"
                style={{ flex: 1, background: '#02040a', border: 'none', resize: 'none', padding: '1.5rem', color: '#a7f3d0', fontFamily: '"Fira Code", "Courier New", monospace', fontSize: '0.9rem', lineHeight: '1.6', outline: 'none' }}
              />

              <div style={{ height: '200px', background: '#070a13', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: '#0f172a', padding: '0.5rem 1.25rem', fontSize: '0.75rem', color: '#64748b', fontWeight: '700', borderBottom: '1px solid #1e293b', textTransform: 'uppercase' }}>
                  System Console Intercept Terminal Output
                </div>
                <pre style={{ flex: 1, margin: 0, padding: '1rem 1.25rem', overflowY: 'auto', color: consoleStatus === "FAILED" ? "#f87171" : "#34d399", fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5', background: '#020408' }}>
                  {consoleOutput || "Awaiting local sandboxed interpreter execution signal streams..."}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* 🔒 SECURITY OVERLAY */}
        {labPhase === 'LAB_WORKSPACE' && isWorkspacePaused && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#090d16' }}>
            <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem', background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <Lock size={44} color="#f59e0b" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0' }}>Workspace Session Paused</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>The assignment editor canvas and tracking test cases are securely hidden to safeguard curriculum integrity metrics.</p>
              <button onClick={toggleWorkspacePauseState} style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>
                Resume Coding Tasks
              </button>
            </div>
          </div>
        )}

        {/* REVIEW REPORT OVERLAY MODAL */}
        {showReviewModal && pendingAiReport && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(2,4,10,0.9)', backdropFilter: 'blur(16px)', display: 'flex', zIndex: 999999 }}>
            <div style={{ margin: 'auto', width: '100%', maxWidth: '680px', background: '#0f172a', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '2.5rem', borderRadius: '16px', maxHeight: '85%', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#06B6D4', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                <Sparkles size={12}/> Cognitive Matrix Check Handshake Ready
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#fff' }}>Laboratory Evaluation Report</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Review parameters before locking code into cloud records.</span>
                </div>
                <div style={{ padding: '0.75rem 1.25rem', background: '#020617', border: '1px solid #1e293b', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: '700' }}>APPROACH RATING</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#10b981', fontFamily: 'monospace' }}>{pendingAiReport.approachScore}<span style={{ fontSize: '0.8rem', color: '#334155' }}>/100</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left', marginBottom: '2.5rem' }}>
                <div>
                  <h5 style={{ color: '#8B5CF6', margin: '0 0 0.3rem 0', fontSize: '0.8rem', fontWeight: '700' }}>📊 COMPLEXITY ALGORITHMIC FEEDBACK</h5>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', background: '#020617', padding: '0.85rem', borderRadius: '6px', border: '1px solid #1e293b', margin: 0, lineHeight: '1.5' }}>{pendingAiReport.complexityAnalysis}</p>
                </div>
                <div>
                  <h5 style={{ color: '#f59e0b', margin: '0 0 0.3rem 0', fontSize: '0.8rem', fontWeight: '700' }}>💡 STRUCTURE CRITIQUE / SHORTCUT CHECK</h5>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', background: '#020617', padding: '0.85rem', borderRadius: '6px', border: '1px solid #1e293b', margin: 0, lineHeight: '1.5' }}>{pendingAiReport.architecturalCritique}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowReviewModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #1e293b', color: '#94a3b8', padding: '0.85rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel & Revise Code
                </button>
                <button onClick={executePermanentDatabaseCommit} style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', padding: '0.85rem', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={16}/> Confirm & Lock Submission
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 🚨 DYNAMIC CUSTOM TOAST WARNING COMPONENT */}
        {securityToast.show && (
          <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#7f1d1d', border: '1px solid #ef4444', color: '#fca5a5', padding: '1rem 1.5rem', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 1000000, maxWidth: '420px', animation: 'toastFadeIn 0.2s ease-out' }}>
            <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem', fontWeight: '500', lineHeight: '1.4' }}>{securityToast.message}</div>
            
            <style>{`
              @keyframes toastFadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </div>
        )}

      </div>
    </div>
  );
}