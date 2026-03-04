import { useState, useRef, useEffect } from "react";

const ANTHROPIC_API_URL = "/api/chat";


const EXAMPLE_MYTHS = [
  "We only use 10% of our brain",
  "Lightning never strikes the same place twice",
  "Goldfish have a 3-second memory",
  "Humans evolved from chimpanzees",
  "Eating carrots improves your eyesight",
  "The Great Wall of China is visible from space",
];

const verdictConfig = {
  FALSE: { color: "#FF3B3B", bg: "rgba(255,59,59,0.12)", icon: "✗", label: "MYTH BUSTED" },
  TRUE: { color: "#00C896", bg: "rgba(0,200,150,0.12)", icon: "✓", label: "CONFIRMED TRUE" },
  "PARTIALLY TRUE": { color: "#FFB800", bg: "rgba(255,184,0,0.12)", icon: "◑", label: "PARTIALLY TRUE" },
  MISLEADING: { color: "#FF7A00", bg: "rgba(255,122,0,0.12)", icon: "⚠", label: "MISLEADING" },
};

function parseResponse(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let verdict = "", summary = "", origin = "", links = [];
  let inLinks = false;

  for (const line of lines) {
    if (line.startsWith("VERDICT:")) verdict = line.replace("VERDICT:", "").trim();
    else if (line.startsWith("SUMMARY:")) summary = line.replace("SUMMARY:", "").trim();
    else if (line.startsWith("MYTH_ORIGIN:")) origin = line.replace("MYTH_ORIGIN:", "").trim();
    else if (line.startsWith("LINKS:")) inLinks = true;
    else if (inLinks && line.startsWith("-")) {
      const parts = line.slice(1).split("|");
      if (parts.length >= 2) {
        links.push({ title: parts[0].trim(), url: parts[1].trim() });
      }
    }
  }

  return { verdict, summary, origin, links };
}

export default function MythBuster() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [streamText, setStreamText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSearch(myth = query) {
    if (!myth.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    setStreamText("");

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          myth,
        }),
      });

      const data = await response.json();
      const rawText = data.content?.map((b) => b.text || "").join("") || "";
      const parsed = parseResponse(rawText);
      setResult({ ...parsed, myth });
      setHistory((prev) => [{ myth, verdict: parsed.verdict }, ...prev.slice(0, 4)]);
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") handleSearch();
  }

  const vc = result ? verdictConfig[result.verdict] || verdictConfig["MISLEADING"] : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0F",
      color: "#E8E8F0",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      padding: "0",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Animated background grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      {/* Glowing orb */}
      <div style={{
        position: "fixed", top: "-200px", right: "-200px",
        width: "600px", height: "600px", zIndex: 0,
        background: "radial-gradient(circle, rgba(255,60,60,0.08) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-100px", left: "-100px",
        width: "400px", height: "400px", zIndex: 0,
        background: "radial-gradient(circle, rgba(0,200,150,0.06) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "800px", margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <div style={{
            display: "inline-block",
            fontSize: "11px", letterSpacing: "5px", textTransform: "uppercase",
            color: "#FF3B3B", marginBottom: "16px",
            fontFamily: "'Courier New', monospace", fontWeight: "bold",
          }}>
            ◈ Research-Backed Truth Engine
          </div>
          <h1 style={{
            fontSize: "clamp(42px, 8vw, 72px)",
            fontWeight: "400", lineHeight: "0.95",
            margin: "0 0 16px",
            color: "#F0F0F8",
            letterSpacing: "-2px",
          }}>
            Myth<span style={{ color: "#FF3B3B", fontStyle: "italic" }}>Buster</span>
          </h1>
          <p style={{
            fontSize: "15px", color: "rgba(200,200,220,0.6)",
            maxWidth: "420px", margin: "0 auto", lineHeight: "1.6",
            fontFamily: "'Courier New', monospace",
          }}>
            Submit any claim. Get the truth — with sources.
          </p>
        </div>

        {/* Search Box */}
        <div style={{
          position: "relative", marginBottom: "16px",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "4px",
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(10px)",
          transition: "border-color 0.2s",
        }}>
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSearch(); } }}
            placeholder="Enter a myth, belief, or claim to fact-check…"
            rows={3}
            style={{
              width: "100%", background: "transparent", border: "none",
              color: "#E8E8F0", fontSize: "16px", padding: "20px 130px 20px 20px",
              outline: "none", resize: "none", lineHeight: "1.5",
              fontFamily: "'Georgia', serif", boxSizing: "border-box",
            }}
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            style={{
              position: "absolute", right: "12px", bottom: "12px",
              background: loading ? "rgba(255,59,59,0.3)" : "#FF3B3B",
              color: "#fff", border: "none", borderRadius: "3px",
              padding: "10px 20px", fontSize: "12px", letterSpacing: "2px",
              textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Courier New', monospace", fontWeight: "bold",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Analyzing…" : "Bust It →"}
          </button>
        </div>

        {/* Example chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "40px" }}>
          <span style={{ fontSize: "11px", color: "rgba(200,200,220,0.4)", fontFamily: "monospace", alignSelf: "center", marginRight: "4px" }}>TRY:</span>
          {EXAMPLE_MYTHS.map((myth) => (
            <button
              key={myth}
              onClick={() => { setQuery(myth); handleSearch(myth); }}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(200,200,220,0.7)", padding: "5px 12px", borderRadius: "2px",
                fontSize: "11px", cursor: "pointer", fontFamily: "monospace",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.target.style.background = "rgba(255,59,59,0.1)"; e.target.style.borderColor = "rgba(255,59,59,0.3)"; e.target.style.color = "#FF7A7A"; }}
              onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.04)"; e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.color = "rgba(200,200,220,0.7)"; }}
            >
              {myth}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            border: "1px solid rgba(255,59,59,0.2)",
            borderRadius: "4px", padding: "40px",
            textAlign: "center", background: "rgba(255,59,59,0.04)",
          }}>
            <div style={{ marginBottom: "16px" }}>
              {["◐", "◓", "◑", "◒"].map((c, i) => (
                <span key={i} style={{
                  display: "inline-block", fontSize: "24px",
                  animation: `spin 1.2s linear infinite`,
                  animationDelay: `${i * 0.1}s`,
                  color: "#FF3B3B", margin: "0 4px",
                }}>
                  {c}
                </span>
              ))}
            </div>
            <p style={{ color: "rgba(200,200,220,0.5)", fontFamily: "monospace", fontSize: "13px", letterSpacing: "2px" }}>
              CROSS-REFERENCING RESEARCH DATABASES…
            </p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            border: "1px solid rgba(255,59,59,0.3)", borderRadius: "4px",
            padding: "20px", background: "rgba(255,59,59,0.07)",
            color: "#FF7A7A", fontFamily: "monospace", fontSize: "13px",
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Result */}
        {result && !loading && vc && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <style>{`
              @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            {/* Verdict Banner */}
            <div style={{
              background: vc.bg,
              border: `1px solid ${vc.color}33`,
              borderLeft: `4px solid ${vc.color}`,
              borderRadius: "4px", padding: "24px 28px",
              marginBottom: "20px",
              display: "flex", alignItems: "center", gap: "20px",
            }}>
              <div style={{
                fontSize: "40px", color: vc.color,
                fontFamily: "monospace", lineHeight: 1, flexShrink: 0,
              }}>
                {vc.icon}
              </div>
              <div>
                <div style={{
                  fontSize: "10px", letterSpacing: "4px", color: vc.color,
                  fontFamily: "monospace", marginBottom: "6px", textTransform: "uppercase",
                }}>
                  Verdict
                </div>
                <div style={{
                  fontSize: "24px", fontWeight: "400", color: vc.color,
                  letterSpacing: "-0.5px",
                }}>
                  {vc.label}
                </div>
              </div>
            </div>

            {/* Myth */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "4px", padding: "20px 24px", marginBottom: "16px",
            }}>
              <div style={{ fontSize: "10px", letterSpacing: "3px", color: "rgba(200,200,220,0.4)", fontFamily: "monospace", marginBottom: "8px" }}>CLAIM EXAMINED</div>
              <p style={{ margin: 0, fontSize: "17px", lineHeight: "1.5", color: "rgba(220,220,240,0.9)", fontStyle: "italic" }}>
                "{result.myth}"
              </p>
            </div>

            {/* Summary */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "4px", padding: "20px 24px", marginBottom: "16px",
            }}>
              <div style={{ fontSize: "10px", letterSpacing: "3px", color: "rgba(200,200,220,0.4)", fontFamily: "monospace", marginBottom: "10px" }}>THE FACTS</div>
              <p style={{ margin: 0, fontSize: "16px", lineHeight: "1.7", color: "#E0E0EE" }}>
                {result.summary}
              </p>
            </div>

            {/* Origin */}
            {result.origin && (
              <div style={{
                background: "rgba(255,184,0,0.05)", border: "1px solid rgba(255,184,0,0.15)",
                borderRadius: "4px", padding: "16px 24px", marginBottom: "16px",
                display: "flex", gap: "14px", alignItems: "flex-start",
              }}>
                <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "1px" }}>🧩</span>
                <div>
                  <div style={{ fontSize: "10px", letterSpacing: "3px", color: "rgba(255,184,0,0.7)", fontFamily: "monospace", marginBottom: "6px" }}>MYTH ORIGIN</div>
                  <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "rgba(220,200,140,0.85)" }}>{result.origin}</p>
                </div>
              </div>
            )}

            {/* Links */}
            {result.links.length > 0 && (
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "4px", padding: "20px 24px",
              }}>
                <div style={{ fontSize: "10px", letterSpacing: "3px", color: "rgba(200,200,220,0.4)", fontFamily: "monospace", marginBottom: "16px" }}>
                  RESEARCH SOURCES
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {result.links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: "14px",
                        padding: "14px 16px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "3px", textDecoration: "none",
                        color: "#A8C8FF", transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(100,160,255,0.08)";
                        e.currentTarget.style.borderColor = "rgba(100,160,255,0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                      }}
                    >
                      <span style={{
                        width: "24px", height: "24px", borderRadius: "50%",
                        background: "rgba(100,160,255,0.15)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontFamily: "monospace", color: "#7AADFF",
                        flexShrink: 0, fontWeight: "bold",
                      }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", marginBottom: "4px", color: "#B8D0FF" }}>{link.title}</div>
                        <div style={{
                          fontSize: "11px", color: "rgba(150,170,220,0.5)",
                          fontFamily: "monospace", whiteSpace: "nowrap",
                          overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {link.url}
                        </div>
                      </div>
                      <span style={{ color: "rgba(150,170,220,0.4)", fontSize: "14px", flexShrink: 0 }}>↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && !loading && (
          <div style={{ marginTop: "40px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "3px", color: "rgba(200,200,220,0.3)", fontFamily: "monospace", marginBottom: "12px" }}>
              RECENT CHECKS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {history.slice(1).map((h, i) => {
                const hvc = verdictConfig[h.verdict] || verdictConfig["MISLEADING"];
                return (
                  <button
                    key={i}
                    onClick={() => { setQuery(h.myth); handleSearch(h.myth); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "3px", cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s", color: "rgba(180,180,200,0.6)", fontSize: "13px",
                      fontFamily: "Georgia, serif",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                  >
                    <span style={{ color: hvc.color, fontSize: "14px", flexShrink: 0 }}>{hvc.icon}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.myth}</span>
                    <span style={{ fontSize: "10px", color: hvc.color, fontFamily: "monospace", letterSpacing: "1px", flexShrink: 0 }}>{h.verdict}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: "60px", textAlign: "center",
          fontSize: "11px", color: "rgba(150,150,170,0.3)",
          fontFamily: "monospace", letterSpacing: "1px",
        }}>
          Powered by Claude AI · Sources are AI-suggested; verify independently
        </div>
      </div>
    </div>
  );
}
