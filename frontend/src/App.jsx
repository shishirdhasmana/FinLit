import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const API = "http://localhost:5000";

export default function App() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [question]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") setFile(dropped);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API}/upload`, formData, {
        onUploadProgress: (e) => {
          setUploadProgress(Math.round((e.loaded * 100) / e.total));
        }
      });
      setSessionId(res.data.session_id);
      setUploadSuccess(true);
      setMessages([{
        role: "system",
        text: `I've analyzed **${file.name}** and found ${res.data.chunks} sections. Ask me anything about this document.`,
        id: Date.now()
      }]);
    } catch {
      alert("Upload failed. Make sure the backend is running on port 5000.");
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || !sessionId || loading) return;
    const q = question.trim();
    setQuestion("");
    setMessages(prev => [...prev, { role: "user", text: q, id: Date.now() }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API}/ask`, { session_id: sessionId, question: q });
      setMessages(prev => [...prev, {
        role: "assistant",
        text: res.data.answer,
        sources: res.data.sources,
        id: Date.now()
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Something went wrong. Please try again.",
        id: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const reset = () => {
    setFile(null);
    setSessionId(null);
    setMessages([]);
    setUploadSuccess(false);
    setUploadProgress(0);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0a0a0f;
          --surface: #111118;
          --surface2: #16161f;
          --border: rgba(255,255,255,0.07);
          --border-hover: rgba(255,255,255,0.15);
          --accent: #6c63ff;
          --accent2: #a78bfa;
          --text: #e8e8f0;
          --text-muted: #6b6b80;
          --text-dim: #3a3a50;
          --user-bg: #1e1b4b;
          --user-border: #4c4090;
          --success: #10b981;
          --radius: 16px;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background: 
            radial-gradient(ellipse 80% 50% at 20% -10%, rgba(108,99,255,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 110%, rgba(167,139,250,0.08) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .app {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 860px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 0 16px;
          border-bottom: 1px solid var(--border);
        }

        .logo { display: flex; align-items: center; gap: 10px; }

        .logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }

        .logo-text {
          font-family: 'Instrument Serif', serif;
          font-size: 1.4rem;
          letter-spacing: -0.02em;
        }

        .logo-text span { color: var(--accent2); font-style: italic; }

        .header-right { display: flex; align-items: center; gap: 10px; }

        .status-pill {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--text-muted);
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 6px 12px; border-radius: 20px;
        }

        .status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--success);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .reset-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 6px 14px; border-radius: 20px;
          font-size: 12px; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }

        .reset-btn:hover { border-color: var(--border-hover); color: var(--text); }

        .upload-section {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 32px; padding: 40px 0;
          animation: fadeUp 0.5s ease;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .upload-hero { text-align: center; }

        .upload-hero h2 {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 400;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 12px;
        }

        .upload-hero h2 em { font-style: italic; color: var(--accent2); }

        .upload-hero p {
          color: var(--text-muted); font-size: 15px;
          font-weight: 300; max-width: 400px; line-height: 1.6;
        }

        .drop-zone {
          width: 100%; max-width: 520px;
          border: 2px dashed var(--border);
          border-radius: var(--radius);
          padding: 48px 32px; text-align: center;
          cursor: pointer; transition: all 0.25s ease;
          background: var(--surface);
          position: relative; overflow: hidden;
        }

        .drop-zone::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(108,99,255,0.05), transparent);
          opacity: 0; transition: opacity 0.25s;
        }

        .drop-zone.drag-over {
          border-color: var(--accent);
          background: rgba(108,99,255,0.05);
          transform: scale(1.01);
        }

        .drop-zone.drag-over::before { opacity: 1; }
        .drop-zone.has-file { border-color: var(--success); border-style: solid; }

        .drop-icon {
          font-size: 40px; margin-bottom: 16px;
          display: block; transition: transform 0.3s;
        }

        .drop-zone:hover .drop-icon,
        .drop-zone.drag-over .drop-icon { transform: translateY(-4px); }

        .drop-title { font-size: 15px; font-weight: 500; color: var(--text); margin-bottom: 6px; }

        .drop-sub { font-size: 13px; color: var(--text-muted); }

        .drop-sub span {
          color: var(--accent2); cursor: pointer;
          text-decoration: underline; text-underline-offset: 3px;
        }

        .file-selected {
          display: flex; align-items: center; gap: 10px; justify-content: center;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 10px; padding: 10px 16px;
          margin-top: 16px; font-size: 13px; color: var(--success);
        }

        .upload-actions {
          display: flex; flex-direction: column;
          align-items: center; gap: 12px;
          width: 100%; max-width: 520px;
        }

        .upload-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none; border-radius: 12px;
          color: white; font-size: 15px; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.2s;
        }

        .upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .upload-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(108,99,255,0.35);
        }

        .progress-bar {
          width: 100%; height: 3px;
          background: var(--border); border-radius: 2px; overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--accent2));
          border-radius: 2px; transition: width 0.3s ease;
        }

        .chat-section {
          flex: 1; display: flex; flex-direction: column;
          overflow: hidden; animation: fadeUp 0.4s ease; padding-top: 8px;
        }

        .doc-badge {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.15);
          border-radius: 20px; font-size: 12px; color: var(--success);
          align-self: flex-start; margin: 8px 0 16px;
        }

        .messages {
          flex: 1; overflow-y: auto;
          display: flex; flex-direction: column;
          gap: 24px; padding: 8px 0 24px;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }

        .messages::-webkit-scrollbar { width: 4px; }
        .messages::-webkit-scrollbar-track { background: transparent; }
        .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

        .message { display: flex; gap: 12px; animation: fadeUp 0.3s ease; }
        .message.user { flex-direction: row-reverse; }

        .avatar {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0; margin-top: 2px;
        }

        .avatar.ai { background: linear-gradient(135deg, var(--accent), var(--accent2)); }
        .avatar.user { background: var(--user-bg); border: 1px solid var(--user-border); }

        .bubble {
          max-width: min(75%, 580px);
          padding: 14px 18px; border-radius: 16px;
          font-size: 14px; line-height: 1.7; font-weight: 300;
        }

        .bubble.ai {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text); border-top-left-radius: 4px;
        }

        .bubble.user {
          background: var(--user-bg);
          border: 1px solid var(--user-border);
          color: var(--text); border-top-right-radius: 4px;
        }

        .bubble.system {
          background: transparent; border: 1px solid var(--border);
          color: var(--text-muted); font-size: 13px; border-radius: 12px;
        }

        /* MARKDOWN */
        .bubble.ai h3 {
          font-family: 'Instrument Serif', serif;
          font-size: 16px; font-weight: 400;
          color: var(--accent2);
          margin-bottom: 10px; margin-top: 4px;
          letter-spacing: -0.01em;
        }

        .bubble.ai ul { padding-left: 18px; margin: 8px 0; }
        .bubble.ai li { margin-bottom: 6px; line-height: 1.6; color: var(--text); }
        .bubble.ai strong { color: var(--text); font-weight: 600; }
        .bubble.ai p { margin-bottom: 10px; }
        .bubble.ai p:last-child { margin-bottom: 0; }
        .bubble.system p { margin: 0; }

        .sources-toggle {
          margin-top: 12px; padding-top: 12px;
          border-top: 1px solid var(--border);
        }

        .sources-btn {
          background: none; border: none;
          color: var(--text-muted); font-size: 12px; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; gap: 4px;
          padding: 0; transition: color 0.2s;
        }

        .sources-btn:hover { color: var(--accent2); }

        .sources-list { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }

        .source-item {
          background: var(--surface2); border: 1px solid var(--border);
          border-radius: 8px; padding: 8px 12px;
          font-size: 11px; color: var(--text-muted);
          line-height: 1.5; font-style: italic;
        }

        .typing { display: flex; gap: 4px; align-items: center; padding: 4px 2px; }

        .typing span {
          width: 6px; height: 6px;
          background: var(--accent2); border-radius: 50%;
          animation: bounce 1.2s infinite;
        }

        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }

        .input-area { padding: 16px 0 20px; border-top: 1px solid var(--border); }

        .input-box {
          display: flex; gap: 10px; align-items: flex-end;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 12px 12px 12px 18px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-box:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(108,99,255,0.08);
        }

        .input-box textarea {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text); font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 300; resize: none; line-height: 1.6;
          max-height: 160px; overflow-y: auto; scrollbar-width: thin;
        }

        .input-box textarea::placeholder { color: var(--text-dim); }

        .send-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.2s; opacity: 0.4;
        }

        .send-btn.active { opacity: 1; }

        .send-btn.active:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(108,99,255,0.4);
        }

        .send-btn svg { width: 16px; height: 16px; fill: white; }

        .input-hint {
          text-align: center; font-size: 11px;
          color: var(--text-dim); margin-top: 10px;
        }

        @media (max-width: 600px) {
          .app { padding: 0 12px; }
          .bubble { max-width: 90%; font-size: 13px; }
          .drop-zone { padding: 32px 20px; }
          .upload-hero h2 { font-size: 1.8rem; }
          .logo-text { font-size: 1.2rem; }
          .status-pill { display: none; }
        }
      `}</style>

      <div className="app">
        <header className="header">
          <div className="logo">
            <div className="logo-icon">📄</div>
            <div className="logo-text">Fin<span>Lit</span> Q&A</div>
          </div>
          <div className="header-right">
            {uploadSuccess && (
              <>
                <div className="status-pill">
                  <div className="status-dot" />
                  Document loaded
                </div>
                <button className="reset-btn" onClick={reset}>New document</button>
              </>
            )}
          </div>
        </header>

        {!uploadSuccess ? (
          <div className="upload-section">
            <div className="upload-hero">
              <h2>Your <em>financial documents</em>,<br />finally explained.</h2>
              <p>Upload any PDF — loan agreements, tax forms, insurance policies — and ask questions in plain English.</p>
            </div>

            <div
              className={`drop-zone ${dragging ? "drag-over" : ""} ${file ? "has-file" : ""}`}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files[0])}
              />
              <span className="drop-icon">{file ? "✅" : "📂"}</span>
              {file ? (
                <>
                  <div className="drop-title">Ready to analyze</div>
                  <div className="file-selected">
                    📄 {file.name} · {(file.size / 1024).toFixed(1)} KB
                  </div>
                </>
              ) : (
                <>
                  <div className="drop-title">Drop your PDF here</div>
                  <div className="drop-sub">
                    or <span onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>browse files</span>
                  </div>
                </>
              )}
            </div>

            <div className="upload-actions">
              {uploading && (
                <div className="progress-bar" style={{ width: "100%", maxWidth: 520 }}>
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              <button
                className="upload-btn"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? `Processing… ${uploadProgress}%` : "Analyze Document →"}
              </button>
            </div>
          </div>
        ) : (
          <div className="chat-section">
            <div className="doc-badge">✅ {file?.name}</div>

            <div className="messages">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {loading && (
                <div className="message">
                  <div className="avatar ai">🤖</div>
                  <div className="bubble ai">
                    <div className="typing"><span /><span /><span /></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="input-area">
              <div className="input-box">
                <textarea
                  ref={textareaRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your document…"
                  rows={1}
                />
                <button
                  className={`send-btn ${question.trim() && !loading ? "active" : ""}`}
                  onClick={handleAsk}
                  disabled={!question.trim() || loading}
                >
                  <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg>
                </button>
              </div>
              <div className="input-hint">Press Enter to send · Shift+Enter for new line</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function MessageBubble({ msg }) {
  const [showSources, setShowSources] = useState(false);

  if (msg.role === "system") {
    return (
      <div className="message">
        <div className="avatar ai">🤖</div>
        <div className="bubble system">
          <ReactMarkdown>{msg.text}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className={`message ${msg.role}`}>
      <div className={`avatar ${msg.role === "user" ? "user" : "ai"}`}>
        {msg.role === "user" ? "👤" : "🤖"}
      </div>
      <div className={`bubble ${msg.role === "user" ? "user" : "ai"}`}>
        {msg.role === "assistant"
          ? <ReactMarkdown>{msg.text}</ReactMarkdown>
          : msg.text
        }
        {msg.sources?.length > 0 && (
          <div className="sources-toggle">
            <button className="sources-btn" onClick={() => setShowSources(p => !p)}>
              {showSources ? "▲" : "▼"} {showSources ? "Hide" : "View"} sources ({msg.sources.length})
            </button>
            {showSources && (
              <div className="sources-list">
                {msg.sources.map((src, i) => (
                  <div key={i} className="source-item">"{src}…"</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}