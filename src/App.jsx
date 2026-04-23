import { useState, useRef, useCallback } from "react";

const COLORS = {
  bg: "#0d0d0d",
  surface: "#161616",
  card: "#1e1e1e",
  border: "#2a2a2a",
  accent: "#00e5a0",
  accentDim: "#00e5a020",
  accentBorder: "#00e5a040",
  red: "#ff4d6d",
  yellow: "#ffd166",
  text: "#f0f0f0",
  muted: "#666",
  subtle: "#333",
};

const styles = {
  app: {
    minHeight: "100vh",
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: "'Courier New', monospace",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "28px 36px 20px",
    borderBottom: `1px solid ${COLORS.border}`,
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  logo: {
    width: 38, height: 38, borderRadius: 8,
    background: `linear-gradient(135deg, ${COLORS.accent}, #00b4d8)`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, flexShrink: 0,
  },
  title: { fontSize: 18, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.3px" },
  subtitle: { fontSize: 11, color: COLORS.muted, letterSpacing: "0.5px", textTransform: "uppercase" },
  main: {
    flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr",
    height: "calc(100vh - 87px)",
  },
  panel: { display: "flex", flexDirection: "column", borderRight: `1px solid ${COLORS.border}` },
  panelHeader: {
    padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`,
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  panelLabel: { fontSize: 11, color: COLORS.muted, letterSpacing: "1px", textTransform: "uppercase", fontWeight: 600 },
  textarea: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: COLORS.text, fontFamily: "'Courier New', monospace", fontSize: 15,
    lineHeight: 1.7, padding: "20px", resize: "none", caretColor: COLORS.accent,
  },
  outputPanel: { display: "flex", flexDirection: "column" },
  outputContent: { flex: 1, padding: "20px", overflowY: "auto" },
  fixedText: { fontSize: 15, lineHeight: 1.8, color: COLORS.text, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  diffContainer: { marginTop: 24, borderTop: `1px solid ${COLORS.border}`, paddingTop: 20 },
  diffLabel: { fontSize: 11, color: COLORS.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 14, fontWeight: 600 },
  changeItem: {
    display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start",
    padding: "10px 12px", borderRadius: 6, background: COLORS.card, border: `1px solid ${COLORS.border}`,
  },
  badge: (type) => ({
    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
    letterSpacing: "0.5px", flexShrink: 0, marginTop: 2,
    background: type === "spelling" ? "#ff4d6d22" : type === "grammar" ? "#ffd16622" : "#00e5a022",
    color: type === "spelling" ? COLORS.red : type === "grammar" ? COLORS.yellow : COLORS.accent,
    border: `1px solid ${type === "spelling" ? "#ff4d6d44" : type === "grammar" ? "#ffd16644" : "#00e5a044"}`,
  }),
  changeText: { fontSize: 13, color: "#ccc", lineHeight: 1.5 },
  wrong: { color: COLORS.red, textDecoration: "line-through", fontFamily: "'Courier New', monospace" },
  right: { color: COLORS.accent, fontFamily: "'Courier New', monospace", fontWeight: 700 },
  footer: { padding: "14px 20px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 10, alignItems: "center" },
  checkBtn: (loading) => ({
    padding: "9px 22px",
    background: loading ? COLORS.subtle : COLORS.accent,
    color: loading ? COLORS.muted : "#000",
    border: "none", borderRadius: 6, cursor: loading ? "not-allowed" : "pointer",
    fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: 13,
    display: "flex", alignItems: "center", gap: 7,
  }),
  clearBtn: {
    padding: "9px 16px", background: "transparent", color: COLORS.muted,
    border: `1px solid ${COLORS.border}`, borderRadius: 6, cursor: "pointer",
    fontFamily: "'Courier New', monospace", fontSize: 13,
  },
  copyBtn: {
    padding: "9px 16px", background: "transparent", color: COLORS.muted,
    border: `1px solid ${COLORS.border}`, borderRadius: 6, cursor: "pointer",
    fontFamily: "'Courier New', monospace", fontSize: 13, marginLeft: "auto",
  },
  statsRow: {
    display: "flex", gap: 16, padding: "10px 20px",
    borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface,
  },
  stat: { fontSize: 11, color: COLORS.muted, display: "flex", alignItems: "center", gap: 5 },
  statNum: (color) => ({ color: color || COLORS.accent, fontWeight: 700, fontSize: 13 }),
  dot: (color) => ({ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }),
  langTag: {
    fontSize: 11, padding: "2px 8px", background: COLORS.accentDim,
    border: `1px solid ${COLORS.accentBorder}`, borderRadius: 4, color: COLORS.accent,
  },
  noChanges: {
    padding: "20px", textAlign: "center", color: COLORS.accent, fontSize: 14,
    marginTop: 20, border: `1px solid ${COLORS.accentBorder}`, borderRadius: 8, background: COLORS.accentDim,
  },
  placeholder: { color: COLORS.subtle, fontSize: 14, lineHeight: 1.8, marginTop: 8 },
};

export default function App() {
  const [input, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const checkGrammar = useCallback(async () => {
    if (!input.trim() || loading) return;
    setLoading(true); setResult(null);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: `You are a grammar and spelling checker. Analyze the text and fix ALL errors. Support any language.\n\nReturn ONLY a JSON object (no markdown):\n{\n  "fixed": "corrected text",\n  "language": "detected language",\n  "changes": [{"type": "spelling|grammar|punctuation", "wrong": "...", "right": "...", "reason": "..."}]\n}\n\nTEXT:\n${input}` }]
        })
      });
      const data = await response.json();
      const raw = data.content?.[0]?.text || "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setResult(parsed);
    } catch { setResult({ fixed: "Error. Please try again.", language: "Unknown", changes: [] }); }
    setLoading(false);
  }, [input, loading]);

  const spellingCount = result?.changes?.filter(c => c.type === "spelling").length || 0;
  const grammarCount = result?.changes?.filter(c => c.type === "grammar").length || 0;
  const punctCount = result?.changes?.filter(c => c.type === "punctuation").length || 0;

  return (
    <div style={styles.app}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} textarea::placeholder{color:#333} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#333;border-radius:2px}`}</style>
      <div style={styles.header}>
        <div style={styles.logo}>✦</div>
        <div>
          <div style={styles.title}>FixIt AI</div>
          <div style={styles.subtitle}>Grammar & Spell Checker · Any Language</div>
        </div>
      </div>
      <div style={styles.main}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelLabel}>Your Text</span>
            <span style={{ fontSize: 11, color: COLORS.muted }}>{charCount} chars</span>
          </div>
          <textarea style={styles.textarea}
            placeholder={"Type or paste any text here...\n\nExample: I goed to store yestaday and buyed milk."}
            value={input}
            onChange={e => { setText(e.target.value); setCharCount(e.target.value.length); }}
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") checkGrammar(); }}
          />
          <div style={styles.footer}>
            <button style={styles.checkBtn(loading || !input.trim())} onClick={checkGrammar} disabled={loading || !input.trim()}>
              {loading ? <div style={{ width:14,height:14,border:"2px solid #000",borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 0.6s linear infinite" }} /> : "✦"}
              {loading ? "Checking..." : "Check (Ctrl+Enter)"}
            </button>
            <button style={styles.clearBtn} onClick={() => { setText(""); setResult(null); setCharCount(0); }}>Clear</button>
          </div>
        </div>
        <div style={styles.outputPanel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelLabel}>Fixed Text</span>
            {result?.language && <span style={styles.langTag}>{result.language}</span>}
          </div>
          {result && (
            <div style={styles.statsRow}>
              <span style={styles.stat}><span style={styles.dot(COLORS.red)} /><span style={styles.statNum(COLORS.red)}>{spellingCount}</span> Spelling</span>
              <span style={styles.stat}><span style={styles.dot(COLORS.yellow)} /><span style={styles.statNum(COLORS.yellow)}>{grammarCount}</span> Grammar</span>
              <span style={styles.stat}><span style={styles.dot(COLORS.accent)} /><span style={styles.statNum(COLORS.accent)}>{punctCount}</span> Punctuation</span>
            </div>
          )}
          <div style={styles.outputContent}>
            {!result && !loading && <div style={styles.placeholder}>Fixed text will appear here after checking.</div>}
            {loading && <div style={{ color: COLORS.muted, fontSize: 14 }}>Analyzing your text...</div>}
            {result && (
              <>
                <div style={styles.fixedText}>{result.fixed}</div>
                {result.changes?.length === 0 && <div style={styles.noChanges}>✓ No errors found!</div>}
                {result.changes?.length > 0 && (
                  <div style={styles.diffContainer}>
                    <div style={styles.diffLabel}>Changes Made ({result.changes.length})</div>
                    {result.changes.map((c, i) => (
                      <div key={i} style={styles.changeItem}>
                        <span style={styles.badge(c.type)}>{c.type.toUpperCase()}</span>
                        <span style={styles.changeText}>
                          <span style={styles.wrong}>{c.wrong}</span>
                          <span style={{ color: COLORS.muted, margin: "0 5px" }}> → </span>
                          <span style={styles.right}>{c.right}</span>
                          <br /><span style={{ color: COLORS.muted, fontSize: 12 }}>{c.reason}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {result && (
            <div style={{ ...styles.footer }}>
              <button style={styles.copyBtn} onClick={() => { navigator.clipboard.writeText(result.fixed); setCopied(true); setTimeout(() => setCopied(false), 1800); }}>
                {copied ? "✓ Copied!" : "Copy Fixed Text"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
