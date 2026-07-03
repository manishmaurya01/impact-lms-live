import React, { useState, useEffect } from 'react';
import "./Assignment.css";
import { 
  Terminal, Code, Database, Cpu, Zap, 
  ArrowLeft, CheckCircle2, Binary, Award, AlertCircle
} from 'lucide-react';

// Premium High Fidelity Dummy Data Matrix
const initialAssignments = [
  {
    assignmentId: "LL-FOR-LOOP-808",
    title: "Atlas Verified: Advanced Loop Mechanics",
    format: "MCQ Matrix",
    description: "Analyze the runtime execution stack context of nested loops inside transient V8 structures. Verify variable leaking patterns under memory stress vectors.",
    category: "Core Engine",
    difficulty: "Level 4",
    theoryQuestion: "Which statement precisely governs the initialization phase of a standard JavaScript block scope evaluation sequence inside execution threads?",
    options: [
      "The assignment instantiates a temporary pointer visible to execution contexts outside the local iteration blocks.",
      "Block scoped constraints lock mutations within the immediate frame, maintaining distinct context variables across ticks.",
      "Memory segments are completely flushed and re-allocated explicitly before the evaluation statement finishes checking bounds."
    ],
    starterCode: "// LuminaLearn Quantum Terminal\n// Verifying Loop Stack Array Indices...\n"
  },
  {
    assignmentId: "LL-ARR-INVERT-402",
    title: "Algorithm Core: Array Inversion Protocol",
    format: "Hybrid Code Sandbox",
    description: "Write structural routines that perform zero-memory array inversions in place. The target implementation must execute under O(1) auxiliary spaces.",
    category: "Data Topology",
    difficulty: "Level 5",
    theoryQuestion: "Contrast spatial complexity arrays against pointer mutation graphs under functional closures.",
    options: [],
    starterCode: `/**
 * @param {number[]} arr
 * @return {number[]}
 */
function reverseArrayInPlace(arr) {
  // Execute architectural solution here
  let left = 0;
  let right = arr.length - 1;
  
  while(left < right) {
    let temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;
    left++;
    right--;
  }
  return arr;
}`
  }
];

export default function AIAssignmentEngine() {
  const [activeParams, setActiveParams] = useState(null);

  return (
    <div className="main-container">
      {/* Platform Header Telemetry */}
      <header className="studio-header">
        <div className="brand-telemetry">
          <Binary className="brand-logo" size={24} />
          <h1 className="hero-title">LuminaLearn Studio</h1>
        </div>
        <div className="system-status">AI-Engine: Operational</div>
      </header>

      {!activeParams ? (
        /* Component Main Interface View */
        <div className="assignment-grid">
          {initialAssignments.map((assignment) => (
            <div 
              key={assignment.assignmentId} 
              className="glass-panel"
              onClick={() => setActiveParams(assignment)}
            >
              <div className="card-meta">
                <Cpu size={12} color="#06B6D4" /> 
                {assignment.category} • {assignment.difficulty}
              </div>
              <h3 className="card-title">{assignment.title}</h3>
              <p className="card-desc">{assignment.description}</p>
              <button className="btn-primary">
                <Terminal size={16} /> Initialize Interface
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Interactive Workspace Execution Layer */
        <SecureTerminalWorkspace 
          targetParams={activeParams} 
          onReturn={() => setActiveParams(null)} 
        />
      )}
    </div>
  );
}

function SecureTerminalWorkspace({ targetParams, onReturn }) {
  const [codeData, setCodeData] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => { 
    setCodeData(targetParams.starterCode); 
    setSelectedOption(null);
    setIsSubmitted(false);
  }, [targetParams]);

  const handleRunVerification = () => {
    setIsSubmitted(true);
  };

  return (
    <div className="workspace-animation-layer">
      {/* Return Interface Control */}
      <button className="btn-secondary" onClick={onReturn}>
        <ArrowLeft size={16} /> Terminate Frame & Return
      </button>

      <div className="workspace-container">
        {/* Left Specification Column */}
        <div className="glass-panel">
          <div className="panel-header-spec">
            <Database size={18} color="#8B5CF6" />
            <h2>{targetParams.title}</h2>
          </div>
          <div className="card-meta">{targetParams.format}</div>
          <p className="card-desc" style={{ fontSize: '0.95rem' }}>
            {targetParams.theoryQuestion}
          </p>

          {/* Render MCQ Selector Context if available */}
          {targetParams.options.length > 0 && (
            <div className="mcq-group">
              {targetParams.options.map((option, idx) => (
                <div 
                  key={idx} 
                  className={`mcq-option ${selectedOption === idx ? 'active' : ''}`}
                  onClick={() => setSelectedOption(idx)}
                >
                  <span className="radio-dot"></span>
                  <span style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>{option}</span>
                </div>
              ))}
            </div>
          )}

          {isSubmitted && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: 'rgba(6, 182, 212, 0.08)', 
              border: '1px solid #06B6D4', 
              borderRadius: '8px',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center'
            }}>
              <CheckCircle2 color="#06B6D4" size={20} />
              <span style={{ fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>
                Telemetry compilation sequence verified successfully.
              </span>
            </div>
          )}
        </div>

        {/* Right High Fidelity Code Terminal Panel */}
        <div className="terminal-block">
          <div className="terminal-header-bar">
            <div className="terminal-dots">
              <span className="dot active-glow"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
            <span className="terminal-title">IDE-STACK // {targetParams.assignmentId}</span>
            <Code size={14} color="#94a3b8" />
          </div>
          
          <textarea 
            className="code-textarea" 
            value={codeData} 
            onChange={(e) => setCodeData(e.target.value)} 
            spellCheck="false"
          />

          <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
            <button className="btn-primary" onClick={handleRunVerification}>
              <Zap size={16} /> Commit Changes & Compile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
