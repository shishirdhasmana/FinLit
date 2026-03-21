import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // ── Upload PDF ───────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/upload", formData);
      setSessionId(res.data.session_id);
      setUploadSuccess(true);
      setMessages([{
        role: "system",
        text: `Document uploaded successfully. ${res.data.chunks} chunks processed. Ask me anything about it.`
      }]);
    } catch (err) {
      alert("Upload failed. Make sure the backend is running.");
    } finally {
      setUploading(false);
    }
  };

  // ── Ask Question ─────────────────────────────────────────
  const handleAsk = async () => {
    if (!question.trim() || !sessionId) return;
    const userQuestion = question;
    setQuestion("");
    setMessages(prev => [...prev, { role: "user", text: userQuestion }]);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/ask", {
        session_id: sessionId,
        question: userQuestion
      });

      setMessages(prev => [...prev, {
        role: "assistant",
        text: res.data.answer,
        sources: res.data.sources
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Sorry, something went wrong. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Enter Key Support ─────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>FinLit Q&A</h1>
      <p style={styles.subtitle}>Upload a financial document and ask questions in plain English</p>

      {/* Upload Section */}
      <div style={styles.uploadBox}>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
          style={styles.fileInput}
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={styles.uploadBtn}
        >
          {uploading ? "Processing..." : "Upload PDF"}
        </button>
        {uploadSuccess && <span style={styles.successBadge}>Document Ready</span>}
      </div>

      {/* Chat Section */}
      {uploadSuccess && (
        <>
          <div style={styles.chatBox}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                ...styles.message,
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                background: msg.role === "user" ? "#0066cc" : msg.role === "system" ? "#2a2a2a" : "#1a1a1a",
                color: "#fff"
              }}>
                <p style={{ margin: 0 }}>{msg.text}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <details style={styles.sources}>
                    <summary style={styles.sourcesSummary}>View Sources</summary>
                    {msg.sources.map((src, j) => (
                      <p key={j} style={styles.sourceChunk}>"{src}..."</p>
                    ))}
                  </details>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ ...styles.message, background: "#1a1a1a", color: "#888" }}>
                Thinking...
              </div>
            )}
          </div>

          {/* Input */}
          <div style={styles.inputRow}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your document..."
              style={styles.textarea}
              rows={2}
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              style={styles.askBtn}
            >
              {loading ? "..." : "Ask"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily: "sans-serif",
    background: "#0d0d0d",
    minHeight: "100vh",
    color: "#fff"
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#fff"
  },
  subtitle: {
    color: "#888",
    marginBottom: "32px"
  },
  uploadBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap"
  },
  fileInput: {
    color: "#fff"
  },
  uploadBtn: {
    background: "#0066cc",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px"
  },
  successBadge: {
    background: "#1a4d1a",
    color: "#4caf50",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px"
  },
  chatBox: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: "#111",
    borderRadius: "12px",
    padding: "20px",
    minHeight: "300px",
    maxHeight: "500px",
    overflowY: "auto",
    marginBottom: "16px"
  },
  message: {
    maxWidth: "75%",
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    lineHeight: "1.6"
  },
  sources: {
    marginTop: "10px",
    fontSize: "12px"
  },
  sourcesSummary: {
    cursor: "pointer",
    color: "#888",
    marginBottom: "6px"
  },
  sourceChunk: {
    color: "#aaa",
    background: "#222",
    padding: "8px",
    borderRadius: "6px",
    margin: "4px 0",
    fontSize: "11px"
  },
  inputRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end"
  },
  textarea: {
    flex: 1,
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "12px",
    color: "#fff",
    fontSize: "14px",
    resize: "none"
  },
  askBtn: {
    background: "#0066cc",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    height: "fit-content"
  }
};

export default App;