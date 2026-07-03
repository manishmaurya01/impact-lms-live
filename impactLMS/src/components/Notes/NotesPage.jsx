import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

  // Word-Style Commands Execution Engine
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
    const modMatch = selectedCourse.modules.find(m => m.moduleId === note.moduleId);
    setSelectedModule(modMatch || null);
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
          title: noteTitle.trim() || "Untitled Structural Sync Note",
          contentHtml: htmlContent
        })
      });
      const result = await res.json();
      if (result.success) {
        alert("Notes committed to cloud ledger node successfully.");
        fetchNotesForCourse(selectedCourse._id);
        if(!activeNoteId) handleNewNote();
      }
    } catch (err) { alert("Workspace tracking sync pipeline faulted."); }
  };

  // 🗑️ CLOUD LEDGER DELETE PIPELINE
  const handleDeleteNote = async (e, noteId) => {
    e.stopPropagation(); // Click bubble block sequence
    
    if (!window.confirm("Are you absolutely sure you want to purge this record node permanently from cloud networks?")) {
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
        alert("Note packet safely dropped from database cache records.");
        if (activeNoteId === noteId) {
          setActiveNoteId(null);
          setNoteTitle("");
          if (editorRef.current) editorRef.current.innerHTML = "<div>Start writing your rich structured notes...</div>";
        }
        fetchNotesForCourse(selectedCourse._id);
      } else {
        alert("Database system rejected dropping transaction branch packet.");
      }
    } catch (err) {
      console.error("Purge lifecycle failed:", err);
      alert("Critical workspace drop tracking engine error.");
    }
  };

  return (
    <div className={`notes-system-wrapper ${isModal ? "modal-view" : "fullscreen-view"}`}>
      <div className="notes-blur-overlay" onClick={onClose}></div>

      <div className="notes-panel-container">
        
        {/* 💻 HIGH-FIDELITY ARCHITECTURAL SYSTEM HEADER */}
        <div className="notes-workspace-header">
          <div className="header-left-cluster">
            {!isModal && (
              <button className="btn-header-back" onClick={() => navigate(-1)} title="Return to Dashboard">
                <span className="arrow-glyph">⟵</span> Back
              </button>
            )}

            <div className="header-identity-block">
              <h2>
                <span className="icon-telemetry">✦</span> LuminaLearn Notes 
                {isModal && <span className="badge">Sync Context</span>}
              </h2>
              <p className="sub-telemetry-text">Secure Document Ledger Workspace</p>
            </div>
          </div>

          <div className="header-actions">
            <button className="btn-secondary" onClick={handleNewNote}>
              <span style={{ fontSize: "1.1rem", fontWeight: "400" }}>+</span> New Workspace
            </button>
            <button className="btn-primary" onClick={handleSaveNote}>
              <span style={{ fontSize: "0.95rem" }}>⛃</span> Commit Sync to DB
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

        {/* 📐 3-COLUMN WORKSPACE MATRIX BODY */}
        <div className="notes-workspace-body">
          
          {/* COLUMN 1: LEFT TELEMETRY CONTROLLER PANEL */}
          <div className="notes-sidebar-controls">
            <label>🎯 Track Target Course</label>
            <select 
              value={selectedCourse ? selectedCourse._id : ""} 
              onChange={(e) => {
                const c = courses.find(item => item._id === e.target.value);
                setSelectedCourse(c || null);
                setSelectedModule(null);
              }}
            >
              <option value="">-- Choose Active Course Cloud Node --</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>

            <label>📑 Module Hierarchy Link</label>
            <select 
              value={selectedModule ? selectedModule.moduleId : ""} 
              onChange={(e) => {
                const m = selectedCourse?.modules.find(item => item.moduleId === parseInt(e.target.value));
                setSelectedModule(m || null);
              }}
              disabled={!selectedCourse}
            >
              <option value="">-- Select Target Sub-Module --</option>
              {selectedCourse?.modules.map(m => (
                <option key={m.moduleId} value={m.moduleId}>M{m.moduleId}: {m.moduleName}</option>
              ))}
            </select>
          </div>

          {/* COLUMN 2: CENTER TEXT CANVAS EDIT AREA */}
          <div className="notes-word-editor-arena">
            <input 
              type="text" 
              className="note-title-field" 
              placeholder="Give your note architectural layout a title..." 
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />

            <div className="word-processor-toolbar">
              <button title="Bold" onClick={() => executeCommand("bold")}><b>B</b></button>
              <button title="Italic" onClick={() => executeCommand("italic")}><i>I</i></button>
              <button title="Underline" onClick={() => executeCommand("underline")}><u>U</u></button>
              <span className="separator">|</span>
              <button title="Heading 1" onClick={() => executeCommand("formatBlock", "<h1>")}>H1</button>
              <button title="Heading 2" onClick={() => executeCommand("formatBlock", "<h2>")}>H2</button>
              <button title="Paragraph Code Wrapper" onClick={() => executeCommand("formatBlock", "<pre>")}>Code</button>
              <span className="separator">|</span>
              <button title="Unordered List" onClick={() => executeCommand("insertUnorderedList")}>• List</button>
              <button title="Ordered List" onClick={() => executeCommand("insertOrderedList")}>1. List</button>
              <span className="separator">|</span>
              <button title="Align Left" onClick={() => executeCommand("justifyLeft")}>⇐</button>
              <button title="Align Center" onClick={() => executeCommand("justifyCenter")}>⇔</button>
              <button title="Align Right" onClick={() => executeCommand("justifyRight")}>⇒</button>
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

          {/* COLUMN 3: RIGHT LEDGER NOTEBOOK VAULT (Inline Delete System Linked) */}
          <div className="history-vault-section">
            <h4>🗄️ Saved Notebook Vault</h4>
            <div className="history-list">
              {notes.length === 0 ? (
                <p className="empty-alert">No records under this course node.</p>
              ) : (
                notes.map(n => (
                  <div 
                    key={n._id} 
                    className={`note-history-card ${activeNoteId === n._id ? "active-track" : ""}`}
                    onClick={() => handleLoadNote(n)}
                  >
                    {/* 🛠️ INLINE ALIGNED TITLE AND DELETE CONTAINER */}
                    <div className="note-card-title-row">
                      <h5>{n.title}</h5>
                      <button 
                        className="btn-note-inline-purge"
                        onClick={(e) => handleDeleteNote(e, n._id)}
                        title="Purge Record Node"
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