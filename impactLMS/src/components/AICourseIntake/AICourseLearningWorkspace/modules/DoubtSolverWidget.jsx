import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Send, Sparkles, X, FileText, Check, Loader2 } from 'lucide-react';

export default function DoubtSolverWidget({ courseId, moduleId, moduleName, topicName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your Lumina Doubt Solver. Ask me any questions or doubts about your current topic, and I will clarify them. You can also ask me to save a doubt resolution directly to your notes!',
      id: 'init'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [savedStatus, setSavedStatus] = useState({}); // Track notes saved status per message ID

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const userMessageText = inputText;
    setInputText('');
    
    const userMsgId = Date.now().toString();
    const newMessages = [...messages, { role: 'user', content: userMessageText, id: userMsgId }];
    setMessages(newMessages);
    setIsSending(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/doubt/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId,
          moduleId,
          moduleName,
          topicName,
          doubtText: userMessageText,
          chatHistory: newMessages.slice(1).map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();
      setIsSending(false);

      if (data.success) {
        const aiMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer,
          id: aiMsgId
        }]);

        if (data.autoSaved) {
          setSavedStatus(prev => ({ ...prev, [aiMsgId]: true }));
          alert(`✨ Automated Note Sync Success!\nSaved: "${data.note?.title || 'Doubt Resolution'}"`);
        }
      } else {
        alert("Failed to solve doubt: " + (data.message || "Server Error"));
      }
    } catch (err) {
      setIsSending(false);
      alert("Error connecting to doubt solver network.");
      console.error(err);
    }
  };

  const handleSaveToNotesManual = async (msgId, textContent) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId,
          moduleId: moduleId || 1,
          moduleName: moduleName || topicName || "General",
          title: `Doubt: ${topicName || "Topic Resolution"}`,
          contentHtml: `<div class="doubt-resolution-note"><h3>Doubt Resolution: ${topicName}</h3><p>${textContent}</p></div>`
        })
      });

      const data = await response.json();
      if (data.success) {
        setSavedStatus(prev => ({ ...prev, [msgId]: true }));
        alert("💾 Explanation saved to workspace notes successfully!");
      } else {
        alert("Failed to save note: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Network fault saving workspace notes.");
    }
  };

  return (
    <>
      {/* 🔮 FLOATING TOGGLE FAB BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '50px',
          padding: '0.8rem 1.5rem',
          cursor: 'pointer',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 10px 25px rgba(124, 58, 237, 0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05) translateY(-3px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
      >
        <HelpCircle size={18} />
        <span>Solve Doubts</span>
      </button>

      {/* 🖥️ SLIDING SIDEBAR WINDOW */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : '-400px',
        width: '380px',
        height: '100vh',
        background: 'rgba(7, 10, 18, 0.95)',
        backdropFilter: 'blur(16px)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isOpen ? '-10px 0 30px rgba(0,0,0,0.8)' : 'none',
        transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: '"Inter", sans-serif'
      }}>
        
        {/* Header Block */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.01)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={18} color="#06b6d4" style={{ animation: 'doubtPulse 2s infinite' }} />
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>Lumina Doubt Solver</h3>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Info panel */}
        <div style={{ background: 'rgba(6, 182, 212, 0.05)', padding: '0.6rem 1rem', fontSize: '0.75rem', color: '#06b6d4', borderBottom: '1px solid rgba(6, 182, 212, 0.1)', textAlign: 'center', letterSpacing: '0.03em' }}>
          TOPIC: {topicName || "Workspace Concepts"}
        </div>

        {/* Chat Logs Window */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {messages.map((msg) => (
            <div 
              key={msg.id}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <div style={{
                background: msg.role === 'user' ? '#7c3aed' : 'rgba(255, 255, 255, 0.03)',
                color: msg.role === 'user' ? '#fff' : '#cbd5e1',
                padding: '0.85rem 1rem',
                borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '0 12px 12px 12px',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)'
              }}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div 
                    className="doubt-solver-html-content"
                    dangerouslySetInnerHTML={{ __html: msg.content }} 
                  />
                )}
              </div>

              {/* Save to Notes Button for AI responses */}
              {msg.role === 'assistant' && msg.id !== 'init' && (
                <button
                  onClick={() => handleSaveToNotesManual(msg.id, msg.content)}
                  disabled={savedStatus[msg.id]}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'transparent',
                    border: 'none',
                    color: savedStatus[msg.id] ? '#10b981' : '#64748b',
                    fontSize: '0.75rem',
                    cursor: savedStatus[msg.id] ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 4px',
                    transition: 'color 0.2s'
                  }}
                >
                  {savedStatus[msg.id] ? (
                    <>
                      <Check size={12} />
                      <span>Note Saved</span>
                    </>
                  ) : (
                    <>
                      <FileText size={12} />
                      <span>Save to Notes</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))}

          {isSending && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '0 12px 12px 12px', color: '#64748b', fontSize: '0.85rem' }}>
              <Loader2 size={16} className="animate-spin" style={{ animation: 'workspaceCoreSpin 1s linear infinite' }} />
              <span>Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <form 
          onSubmit={handleSendMessage}
          style={{
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(2, 4, 10, 0.4)',
            display: 'flex',
            gap: '0.75rem'
          }}
        >
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask doubt... (e.g. Save this to notes)"
            disabled={isSending}
            style={{
              flex: 1,
              background: '#04060a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
          <button 
            type="submit"
            disabled={isSending || !inputText.trim()}
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: isSending || !inputText.trim() ? 0.5 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            <Send size={16} />
          </button>
        </form>

      </div>

      <style>{`
        @keyframes doubtPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .doubt-solver-html-content p {
          margin: 0 0 0.75rem 0;
        }
        .doubt-solver-html-content p:last-child {
          margin-bottom: 0;
        }
        .doubt-solver-html-content ul, .doubt-solver-html-content ol {
          margin: 0 0 0.75rem 1rem;
          padding: 0;
        }
        .doubt-solver-html-content pre, .doubt-solver-html-content code {
          font-family: 'Fira Code', monospace;
          background: #02040a;
          padding: 2px 6px;
          border-radius: 4px;
          color: #a7f3d0;
          font-size: 0.85rem;
        }
        .doubt-solver-html-content pre {
          padding: 0.75rem 1rem;
          overflow-x: auto;
          margin-bottom: 0.75rem;
        }
      `}</style>
    </>
  );
}
