import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bold, Italic, Underline, Undo, Redo, HelpCircle, Trash2, Check, FileText, Loader2, 
  Sparkles, Palette, RefreshCw, PenTool, Eraser, Save, BookOpen, User, ArrowLeft, 
  Image, Grid, AlignLeft, AlignCenter, AlignRight, List, ListOrdered
} from 'lucide-react';
import "./NotesPage.css";

function NotesPage({ isModal = false, activeCourseContext = null, onClose = null }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const editorRef = useRef(null);
  const [userName, setUserName] = useState("Operator Node");
  
  // Tab-based controls: "editor" or "whiteboard"
  const [activeTab, setActiveTab] = useState("editor");

  // Whiteboard States
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#00f0ff"); // Neon Cyan default
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState("pen"); // "pen" or "eraser"

  // AI Notes Generator States
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Formatting color pickers states
  const [activeFontColor, setActiveFontColor] = useState("#ffffff");
  const [activeHighlightColor, setActiveHighlightColor] = useState("transparent");

  useEffect(() => {
    fetchCourses();
    try {
      const storedUser = localStorage.getItem("userName") || localStorage.getItem("user");
      if (storedUser) {
        if (storedUser.startsWith("{")) {
          const parsed = JSON.parse(storedUser);
          setUserName(parsed.name || parsed.email?.split("@")[0] || "Operator Node");
        } else {
          let cleanStr = storedUser.replace(/"/g, '').trim();
          setUserName(cleanStr.includes("@") ? cleanStr.split("@")[0] : cleanStr);
        }
      }
    } catch (err) {
      console.error("User context tracking faulted:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchNotesForCourse(selectedCourse._id);
    } else {
      setNotes([]);
    }
  }, [selectedCourse]);

  // Context injection logic
  useEffect(() => {
    if (activeCourseContext && courses.length > 0) {
      const match = courses.find(c => c._id === activeCourseContext.courseId);
      if (match) {
        setSelectedCourse(match);
        if (activeCourseContext.moduleId !== undefined) {
          const modMatch = match.modules.find(m => m.moduleId === activeCourseContext.moduleId);
          setSelectedModule(modMatch || null);
        }
      }
    }
  }, [activeCourseContext, courses]);

  // Whiteboard Resize Canvas to fit container
  useEffect(() => {
    if (activeTab === "whiteboard" && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = Math.max(rect.height - 80, 480);
      
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#070a12";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [activeTab]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/courses", { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setCourses(result.data);
    } catch (err) { console.error("Error loading courses:", err); }
  };

  const fetchNotesForCourse = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/notes/course/${courseId}`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setNotes(result.data);
    } catch (err) { console.error("Error loading notes:", err); }
  };

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  const handleNewNote = () => {
    if (!selectedCourse || !selectedModule) {
      alert("Please select both a Course and a Module context first.");
      return;
    }
    setActiveNoteId(null);
    setNoteTitle("");
    if (editorRef.current) editorRef.current.innerHTML = "<div>Start writing your rich structured notes...</div>";
  };

  const handleLoadNote = (note) => {
    setActiveNoteId(note._id);
    setNoteTitle(note.title);
    if (editorRef.current) editorRef.current.innerHTML = note.contentHtml;
    const modMatch = selectedCourse?.modules?.find(m => m.moduleId === note.moduleId);
    setSelectedModule(modMatch || null);
    setActiveTab("editor");
  };

  const handleSaveNote = async () => {
    if (!selectedCourse || !selectedModule) {
      alert("Enforce a strict course and module schema path before saving.");
      return;
    }
    const htmlContent = editorRef.current ? editorRef.current.innerHTML : "";
    if (!htmlContent.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/notes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          noteId: activeNoteId,
          courseId: selectedCourse._id,
          moduleId: selectedModule.moduleId,
          moduleName: selectedModule.moduleName,
          title: noteTitle.trim() || "Untitled Note",
          contentHtml: htmlContent
        })
      });
      const result = await res.json();
      if (result.success) {
        alert("Notes committed successfully.");
        fetchNotesForCourse(selectedCourse._id);
        if(!activeNoteId) handleNewNote();
      }
    } catch (err) { alert("Workspace tracking sync pipeline faulted."); }
  };

  const handleDeleteNote = async (e, noteId) => {
    e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      
      if (result.success) {
        alert("Note deleted successfully.");
        if (activeNoteId === noteId) {
          setActiveNoteId(null);
          setNoteTitle("");
          if (editorRef.current) editorRef.current.innerHTML = "<div>Start writing your rich structured notes...</div>";
        }
        fetchNotesForCourse(selectedCourse._id);
      } else {
        alert("Database rejected deletion request.");
      }
    } catch (err) {
      console.error(err);
      alert("Note deletion request failed.");
    }
  };

  // --- WHITEBOARD INTERACTIVE DRAWING HANDLERS ---
  const startDrawing = ({ nativeEvent }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    let clientX, clientY;
    if (nativeEvent.touches) {
      clientX = nativeEvent.touches[0].clientX;
      clientY = nativeEvent.touches[0].clientY;
    } else {
      clientX = nativeEvent.clientX;
      clientY = nativeEvent.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    let clientX, clientY;
    if (nativeEvent.touches) {
      clientX = nativeEvent.touches[0].clientX;
      clientY = nativeEvent.touches[0].clientY;
    } else {
      clientX = nativeEvent.clientX;
      clientY = nativeEvent.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.strokeStyle = tool === 'eraser' ? '#070a12' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#070a12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveWhiteboardToNotes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Convert drawing to base64 DataURL
    const dataUrl = canvas.toDataURL("image/png");
    
    const imgTag = `<img src="${dataUrl}" alt="Whiteboard Sketch" style="max-width: 100%; border-radius: 8px; border: 1px solid #1e293b; margin: 1rem 0; box-shadow: 0 4px 12px rgba(0,0,0,0.5);" />`;
    
    // Switch to editor tab and insert the image at cursor
    setActiveTab("editor");
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand("insertHTML", false, imgTag);
      }
    }, 100);
  };

  // --- AI NOTES GENERATOR ACTION ---
  const handleAIGenerateNotes = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isGeneratingAI) return;
    if (!selectedCourse || !selectedModule) {
      alert("Please configure a Course and Module context first.");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/notes/generate-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          topicName: selectedModule.moduleName,
          prompt: aiPrompt,
          courseLevel: selectedCourse.level
        })
      });

      const data = await res.json();
      setIsGeneratingAI(false);

      if (data.success && data.note) {
        setAiPrompt("");
        
        // Populate Title if empty
        if (!noteTitle.trim()) {
          setNoteTitle(data.note.title);
        }

        // Insert structured HTML to editor
        setActiveTab("editor");
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand("insertHTML", false, data.note.contentHtml);
          }
        }, 100);
      } else {
        alert("Failed to generate AI notes: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      setIsGeneratingAI(false);
      alert("Error contacting AI notes compiler pipeline.");
      console.error(err);
    }
  };

  // Command to insert table helper
  const insertTableHelper = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #1e293b; margin: 1rem 0;">
        <thead>
          <tr style="background: rgba(255, 255, 255, 0.03);">
            <th style="border: 1px solid #1e293b; padding: 10px; color: #06b6d4; font-weight: bold; font-size: 0.9rem;">Heading 1</th>
            <th style="border: 1px solid #1e293b; padding: 10px; color: #06b6d4; font-weight: bold; font-size: 0.9rem;">Heading 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #1e293b; padding: 10px; font-size: 0.9rem;">Cell data 1</td>
            <td style="border: 1px solid #1e293b; padding: 10px; font-size: 0.9rem;">Cell data 2</td>
          </tr>
          <tr>
            <td style="border: 1px solid #1e293b; padding: 10px; font-size: 0.9rem;">Cell data 3</td>
            <td style="border: 1px solid #1e293b; padding: 10px; font-size: 0.9rem;">Cell data 4</td>
          </tr>
        </tbody>
      </table>
    `;
    executeCommand("insertHTML", tableHtml);
  };

  return (
    <div className={`notes-system-wrapper ${isModal ? "modal-view" : "fullscreen-view"}`}>
      <div className="notes-blur-overlay" onClick={onClose}></div>

      <div className="notes-panel-container">
        
        {/* Fututistic Cinematic Header */}
        <div className="notes-workspace-header">
          <div className="header-left-cluster">
            {!isModal && (
              <button className="btn-header-back" onClick={() => navigate(-1)} title="Return to Dashboard">
                <ArrowLeft size={16} /> Back
              </button>
            )}

            <div className="header-identity-block">
              <h2>
                <span className="icon-telemetry">✦</span> LuminaLearn Studio Notes
                {isModal && <span className="badge">Sync Context</span>}
              </h2>
              <p className="sub-telemetry-text">Interactive Digital Notebook & Canvas Ledger</p>
            </div>
          </div>

          {/* Left/Right controls tab toggles */}
          <div style={{ display: 'flex', gap: '0.5rem', background: '#070a12', padding: '4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <button 
              onClick={() => setActiveTab("editor")}
              style={{
                background: activeTab === "editor" ? "rgba(6, 182, 212, 0.1)" : "transparent",
                color: activeTab === "editor" ? "#06b6d4" : "#64748b",
                border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem"
              }}
            >
              📝 Notes Editor
            </button>
            <button 
              onClick={() => setActiveTab("whiteboard")}
              style={{
                background: activeTab === "whiteboard" ? "rgba(139, 92, 246, 0.1)" : "transparent",
                color: activeTab === "whiteboard" ? "#8b5cf6" : "#64748b",
                border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem"
              }}
            >
              🎨 Whiteboard Canvas
            </button>
          </div>

          <div className="header-actions">
            <button className="btn-secondary" onClick={handleNewNote}>
              <span>+</span> New Note
            </button>
            <button className="btn-primary" onClick={handleSaveNote}>
              <Save size={14} /> Save to DB
            </button>
          </div>

          <div className="header-user-profile-zone">
            <div className="user-meta-details">
              <span className="user-status-dot"></span>
              <span className="user-profile-name">{userName}</span>
            </div>
            {isModal && (
              <button className="btn-close" onClick={onClose} title="Exit Workspace">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Workspace Body */}
        <div className="notes-workspace-body">
          
          {/* COLUMN 1: LEFT SIDEBAR SELECTORS */}
          <div className="notes-sidebar-controls">
            <label>🎯 Active Course</label>
            <select 
              value={selectedCourse ? selectedCourse._id : ""} 
              onChange={(e) => {
                const c = courses.find(item => item._id === e.target.value);
                setSelectedCourse(c || null);
                setSelectedModule(null);
              }}
            >
              <option value="">-- Choose Course --</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>

            <label>📑 Module Hierarchy</label>
            <select 
              value={selectedModule ? selectedModule.moduleId : ""} 
              onChange={(e) => {
                const m = selectedCourse?.modules?.find(item => item.moduleId === parseInt(e.target.value));
                setSelectedModule(m || null);
              }}
              disabled={!selectedCourse}
            >
              <option value="">-- Select Module --</option>
              {(selectedCourse?.modules || []).map(m => (
                <option key={m.moduleId} value={m.moduleId}>M{m.moduleId}: {m.moduleName}</option>
              ))}
            </select>

            {/* AI NOTES ARCHITECT CARD */}
            {selectedModule && (
              <div style={{
                marginTop: 'auto',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(6, 182, 212, 0.03) 100%)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                padding: '1.25rem',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#8b5cf6', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  <Sparkles size={16} />
                  <span>AI Notes Architect</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: '1.4' }}>
                  Type a prompt and Lumina AI will automatically compile rich study notes into your editor.
                </p>
                <form onSubmit={handleAIGenerateNotes} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. key summaries, code examples, concepts..."
                    disabled={isGeneratingAI}
                    style={{
                      width: '100%',
                      height: '70px',
                      background: '#04060a',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      color: '#fff',
                      fontSize: '0.8rem',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isGeneratingAI || !aiPrompt.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 size={14} className="animate-spin" style={{ animation: 'workspaceCoreSpin 1s linear infinite' }} />
                        <span>Compiling...</span>
                      </>
                    ) : (
                      <span>⚡ Build Notes via AI</span>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* COLUMN 2: CENTER ARENA */}
          <div className="notes-word-editor-arena" style={{ display: activeTab === "editor" ? "flex" : "none" }}>
            <input 
              type="text" 
              className="note-title-field" 
              placeholder="Title your notes document..." 
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />

            <div className="word-processor-toolbar">
              <button title="Undo" onClick={() => executeCommand("undo")}><Undo size={14}/></button>
              <button title="Redo" onClick={() => executeCommand("redo")}><Redo size={14}/></button>
              <span className="separator">|</span>
              <button title="Bold" onClick={() => executeCommand("bold")}><Bold size={14}/></button>
              <button title="Italic" onClick={() => executeCommand("italic")}><Italic size={14}/></button>
              <button title="Underline" onClick={() => executeCommand("underline")}><Underline size={14}/></button>
              <span className="separator">|</span>
              <button title="Heading 1" onClick={() => executeCommand("formatBlock", "<h1>")} style={{ fontWeight: 'bold' }}>H1</button>
              <button title="Heading 2" onClick={() => executeCommand("formatBlock", "<h2>")} style={{ fontWeight: 'bold' }}>H2</button>
              <button title="Paragraph Code Wrapper" onClick={() => executeCommand("formatBlock", "<pre>")}><Code size={14}/></button>
              <span className="separator">|</span>
              <button title="Unordered List" onClick={() => executeCommand("insertUnorderedList")}><List size={14}/></button>
              <button title="Ordered List" onClick={() => executeCommand("insertOrderedList")}><ListOrdered size={14}/></button>
              <span className="separator">|</span>
              <button title="Align Left" onClick={() => executeCommand("justifyLeft")}><AlignLeft size={14}/></button>
              <button title="Align Center" onClick={() => executeCommand("justifyCenter")}><AlignCenter size={14}/></button>
              <button title="Align Right" onClick={() => executeCommand("justifyRight")}><AlignRight size={14}/></button>
              <span className="separator">|</span>
              
              {/* Insert Table */}
              <button title="Insert Grid Table" onClick={insertTableHelper}><Grid size={14}/></button>

              {/* Font Color Selection */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', margin: '0 4px' }}>
                <Palette size={14} style={{ color: activeFontColor, marginRight: '4px' }} />
                <select 
                  onChange={(e) => {
                    executeCommand("foreColor", e.target.value);
                    setActiveFontColor(e.target.value);
                  }}
                  value={activeFontColor}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="#ffffff" style={{ background: '#0f172a', color: '#fff' }}>White</option>
                  <option value="#00f0ff" style={{ background: '#0f172a', color: '#00f0ff' }}>Cyan</option>
                  <option value="#a78bfa" style={{ background: '#0f172a', color: '#a78bfa' }}>Violet</option>
                  <option value="#34d399" style={{ background: '#0f172a', color: '#34d399' }}>Green</option>
                  <option value="#fbbf24" style={{ background: '#0f172a', color: '#fbbf24' }}>Yellow</option>
                  <option value="#f87171" style={{ background: '#0f172a', color: '#f87171' }}>Red</option>
                </select>
              </div>

              {/* Clear format */}
              <span className="separator">|</span>
              <button title="Clear Formatting" onClick={() => executeCommand("removeFormat")} style={{ fontSize: '0.75rem', width: 'auto', padding: '0 6px', color: '#ef4444' }}>Clear</button>
            </div>

            <div 
              className="word-editable-canvas"
              contentEditable
              suppressContentEditableWarning
              ref={editorRef}
            >
              <div>Start writing your rich structured notes...</div>
            </div>
          </div>

          {/* WHITEBOARD CANVAS VIEW AREA */}
          <div className="notes-word-editor-arena" style={{ display: activeTab === "whiteboard" ? "flex" : "none", overflow: 'hidden' }}>
            <div className="word-processor-toolbar" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  onClick={() => setTool("pen")} 
                  style={{ background: tool === "pen" ? "rgba(139, 92, 246, 0.15)" : "transparent", color: tool === "pen" ? "#8b5cf6" : "#64748b" }}
                  title="Draw Tool"
                >
                  <PenTool size={14} />
                </button>
                <button 
                  onClick={() => setTool("eraser")} 
                  style={{ background: tool === "eraser" ? "rgba(139, 92, 246, 0.15)" : "transparent", color: tool === "eraser" ? "#8b5cf6" : "#64748b" }}
                  title="Eraser Tool"
                >
                  <Eraser size={14} />
                </button>
                <span className="separator">|</span>
                
                {/* Neon brush colors */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {['#ffffff', '#00f0ff', '#bd00ff', '#00ff66', '#ffea00', '#ff0055'].map((neonColor) => (
                    <button 
                      key={neonColor}
                      onClick={() => { setColor(neonColor); setTool("pen"); }}
                      style={{ 
                        width: '18px', height: '18px', borderRadius: '50%', background: neonColor, border: color === neonColor && tool === "pen" ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)', padding: 0, cursor: 'pointer',
                        boxShadow: color === neonColor && tool === "pen" ? `0 0 10px ${neonColor}` : 'none'
                      }}
                    />
                  ))}
                </div>
                
                <span className="separator">|</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Size:</span>
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(parseInt(e.target.value))} 
                    style={{ width: '80px', accentColor: '#8b5cf6', cursor: 'pointer', height: '4px' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontFamily: 'monospace' }}>{brushSize}px</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={clearCanvas} 
                  style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.75rem', width: 'auto', padding: '0 10px' }}
                >
                  Clear Sketch
                </button>
                <button 
                  onClick={saveWhiteboardToNotes}
                  style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.75rem', width: 'auto', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                >
                  <Image size={12} />
                  <span>Insert into Note</span>
                </button>
              </div>
            </div>

            {/* drawing canvas container */}
            <div style={{ flex: 1, border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden', background: '#070a12', position: 'relative' }}>
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ display: 'block', cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
              />
            </div>
          </div>

          {/* COLUMN 3: RIGHT HISTORY VAULT */}
          <div className="history-vault-section">
            <h4>🗄️ Saved Notes Vault</h4>
            <div className="history-list">
              {notes.length === 0 ? (
                <p className="empty-alert">No records found.</p>
              ) : (
                notes.map(n => (
                  <div 
                    key={n._id} 
                    className={`note-history-card ${activeNoteId === n._id ? "active-track" : ""}`}
                    onClick={() => handleLoadNote(n)}
                  >
                    <div className="note-card-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <h5 style={{ margin: 0, flex: 1 }}>{n.title}</h5>
                      <button 
                        className="btn-note-inline-purge"
                        onClick={(e) => handleDeleteNote(e, n._id)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', opacity: 0.6, cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                      >
                        ✕
                      </button>
                    </div>
                    <span>Module {n.moduleId} • {new Date(n.updatedAt).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default NotesPage;