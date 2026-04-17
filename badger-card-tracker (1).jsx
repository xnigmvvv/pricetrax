import { useState, useRef, useEffect } from "react";

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxFwky0fg4MaekMMi53meyFNgQNQuEdAnFP-Na3diwWchir1OYF0CJkm0xMfzueogmNQw/exec";

function useQRLib() {
  const [ready, setReady] = useState(!!window.QRCode);
  useEffect(() => {
    if (window.QRCode) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  return ready;
}

function buildURL(name, price) {
  const data = JSON.stringify({ n: name, p: price, t: new Date().toISOString().split("T")[0] });
  return `${SHEET_URL}?data=${encodeURIComponent(data)}`;
}

function QRCanvas({ value, size = 118 }) {
  const divRef = useRef();
  const qrReady = useQRLib();

  useEffect(() => {
    if (!qrReady || !divRef.current) return;
    divRef.current.innerHTML = "";
    new window.QRCode(divRef.current, {
      text: value,
      width: size,
      height: size,
      colorDark: "#1a1a1a",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.M,
    });
  }, [qrReady, value, size]);

  return (
    <div ref={divRef} style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {!qrReady && <span style={{ fontSize: 10, color: "#aaa", fontFamily: "monospace" }}>loading…</span>}
    </div>
  );
}

function LabelCard({ name, price, onRemove }) {
  const url = buildURL(name, price);
  const displayPrice = parseFloat(price).toFixed(2);

  return (
    <div className="label-card" style={{
      background: "#fff", border: "1.5px solid #1a1a1a", borderRadius: 4,
      padding: "10px 10px 8px", display: "flex", flexDirection: "column",
      alignItems: "center", gap: 5, width: 152,
      fontFamily: "'Courier New', monospace", position: "relative",
      boxShadow: "2px 2px 0 #1a1a1a", pageBreakInside: "avoid",
    }}>
      <button className="no-print" onClick={onRemove} style={{
        position: "absolute", top: 3, right: 6, background: "none", border: "none",
        cursor: "pointer", fontSize: 13, color: "#bbb", lineHeight: 1,
      }}>✕</button>
      <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#888" }}>
        BADGER BREAKS
      </div>
      <QRCanvas value={url} size={118} />
      <div style={{
        fontSize: 10, fontWeight: 700, textAlign: "center", lineHeight: 1.3,
        maxWidth: 132, wordBreak: "break-word", color: "#1a1a1a",
      }}>{name}</div>
      <div style={{
        fontSize: 14, fontWeight: 900, color: "#1a1a1a",
        borderTop: "1px solid #eee", paddingTop: 4, width: "100%", textAlign: "center",
      }}>${displayPrice}</div>
    </div>
  );
}

export default function App() {
  const [cardName, setCardName] = useState("");
  const [price, setPrice] = useState("");
  const [labels, setLabels] = useState([]);
  const [tab, setTab] = useState("generate");
  const [copied, setCopied] = useState(false);
  const nameRef = useRef();

  useEffect(() => { if (tab === "generate") nameRef.current?.focus(); }, [tab]);

  const addLabel = () => {
    if (!cardName.trim() || !price) return;
    setLabels(prev => [...prev, { name: cardName.trim(), price, id: Date.now() }]);
    setCardName("");
    setPrice("");
    nameRef.current?.focus();
  };

  const gasCode = `function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const raw = e.parameter.data;
  if (!raw) return ContentService.createTextOutput("Missing data");
  try {
    const parsed = JSON.parse(raw);
    sheet.appendRow([
      parsed.t || new Date().toISOString().split("T")[0],
      parsed.n || "",
      parseFloat(parsed.p) || 0,
      new Date().toLocaleString()
    ]);
    return ContentService.createTextOutput("OK: " + parsed.n);
  } catch(err) {
    return ContentService.createTextOutput("Error: " + err);
  }
}`;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Georgia', serif" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .label-area { display: flex; flex-wrap: wrap; gap: 12px; padding: 12px; }
        }
      `}</style>

      <div className="no-print" style={{
        background: "#1a1a1a", color: "#f5f0e8", padding: "16px 24px",
        display: "flex", alignItems: "baseline", gap: 12, borderBottom: "3px solid #c8a84b",
      }}>
        <span style={{ fontSize: 20, fontWeight: 900 }}>🦡 BADGER BREAKS</span>
        <span style={{ fontSize: 11, color: "#c8a84b", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Courier New', monospace" }}>
          Card Cost Tracker
        </span>
      </div>

      <div className="no-print" style={{ display: "flex", borderBottom: "2px solid #1a1a1a", background: "#fff" }}>
        {[["generate", "🏷 Generate Labels"], ["setup", "⚙️ Sheet Setup"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "11px 22px", background: tab === key ? "#c8a84b" : "transparent",
            border: "none", borderRight: "1px solid #e0d9cc",
            fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: 12,
            cursor: "pointer", color: tab === key ? "#1a1a1a" : "#666",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: 22 }}>
        {tab === "generate" && (
          <>
            <div className="no-print" style={{
              background: "#fff", border: "2px solid #1a1a1a", borderRadius: 6,
              padding: 18, marginBottom: 24, boxShadow: "3px 3px 0 #1a1a1a",
            }}>
              <div style={{ fontSize: 12, fontFamily: "'Courier New', monospace", fontWeight: 700, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase", color: "#555" }}>
                Add Card Label
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: "1 1 240px" }}>
                  <label style={{ display: "block", fontSize: 10, fontFamily: "'Courier New', monospace", marginBottom: 4, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Card Name</label>
                  <input
                    ref={nameRef}
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addLabel()}
                    placeholder="e.g. 2021 Topps Chrome Trout PSA 10"
                    style={{
                      width: "100%", boxSizing: "border-box", padding: "9px 11px",
                      border: "2px solid #1a1a1a", borderRadius: 4,
                      fontFamily: "'Courier New', monospace", fontSize: 13, background: "#fafaf7",
                    }}
                  />
                </div>
                <div style={{ flex: "0 0 130px" }}>
                  <label style={{ display: "block", fontSize: 10, fontFamily: "'Courier New', monospace", marginBottom: 4, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Price ($)</label>
                  <input
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addLabel()}
                    placeholder="0.00" type="number" min="0" step="0.01"
                    style={{
                      width: "100%", boxSizing: "border-box", padding: "9px 11px",
                      border: "2px solid #1a1a1a", borderRadius: 4,
                      fontFamily: "'Courier New', monospace", fontSize: 13, background: "#fafaf7",
                    }}
                  />
                </div>
                <button onClick={addLabel} style={{
                  padding: "9px 22px", background: "#c8a84b", border: "2px solid #1a1a1a",
                  borderRadius: 4, fontFamily: "'Courier New', monospace", fontWeight: 900,
                  fontSize: 13, cursor: "pointer", boxShadow: "2px 2px 0 #1a1a1a",
                }}>+ Add Label</button>
              </div>
            </div>

            {labels.length === 0 ? (
              <div className="no-print" style={{ textAlign: "center", color: "#bbb", fontFamily: "'Courier New', monospace", fontSize: 12, padding: "50px 0" }}>
                Add a card above to generate your first QR label
              </div>
            ) : (
              <>
                <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>
                    {labels.length} label{labels.length !== 1 ? "s" : ""} — Ctrl/⌘+P to print
                  </span>
                  <button onClick={() => setLabels([])} style={{
                    background: "none", border: "1px solid #ccc", borderRadius: 4,
                    padding: "3px 10px", fontFamily: "'Courier New', monospace", fontSize: 11,
                    cursor: "pointer", color: "#aaa",
                  }}>Clear All</button>
                </div>
                <div className="label-area" style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                  {labels.map(l => (
                    <LabelCard key={l.id} name={l.name} price={l.price}
                      onRemove={() => setLabels(prev => prev.filter(x => x.id !== l.id))} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tab === "setup" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: "#fff", border: "2px solid #1a1a1a", borderRadius: 6, padding: 18, boxShadow: "3px 3px 0 #1a1a1a" }}>
              <h3 style={{ margin: "0 0 10px", fontFamily: "'Courier New', monospace", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#555" }}>Sheet Column Headers</h3>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "#444", lineHeight: 1.6 }}>Paste these into Row 1 of your Google Sheet:</p>
              <div style={{ position: "relative" }}>
                <pre style={{ background: "#f5f0e8", border: "1px solid #ddd", borderRadius: 4, padding: "8px 12px", fontFamily: "'Courier New', monospace", fontSize: 12, margin: 0 }}>
                  Date Purchased{"\t"}Card Name{"\t"}Purchase Price{"\t"}Scanned At
                </pre>
                <button onClick={() => { navigator.clipboard.writeText("Date Purchased\tCard Name\tPurchase Price\tScanned At"); setCopied("h"); setTimeout(() => setCopied(false), 1500); }}
                  style={{ position: "absolute", top: 6, right: 8, background: "#c8a84b", border: "1px solid #1a1a1a", borderRadius: 3, padding: "2px 8px", fontFamily: "'Courier New', monospace", fontSize: 10, cursor: "pointer" }}>
                  {copied === "h" ? "✓" : "Copy"}
                </button>
              </div>
            </div>

            <div style={{ background: "#fff", border: "2px solid #1a1a1a", borderRadius: 6, padding: 18, boxShadow: "3px 3px 0 #1a1a1a" }}>
              <h3 style={{ margin: "0 0 10px", fontFamily: "'Courier New', monospace", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#555" }}>Apps Script Code</h3>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "#444", lineHeight: 1.6 }}>Extensions → Apps Script → paste → Deploy as Web App → Anyone</p>
              <div style={{ position: "relative" }}>
                <pre style={{ background: "#1a1a1a", color: "#c8a84b", borderRadius: 4, padding: "12px 14px", fontFamily: "'Courier New', monospace", fontSize: 11, overflowX: "auto", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{gasCode}</pre>
                <button onClick={() => { navigator.clipboard.writeText(gasCode); setCopied("g"); setTimeout(() => setCopied(false), 1500); }}
                  style={{ position: "absolute", top: 8, right: 10, background: "#c8a84b", border: "1px solid #666", borderRadius: 3, padding: "2px 8px", fontFamily: "'Courier New', monospace", fontSize: 10, cursor: "pointer" }}>
                  {copied === "g" ? "✓" : "Copy"}
                </button>
              </div>
            </div>

            <div style={{ background: "#fffbe8", border: "2px solid #c8a84b", borderRadius: 6, padding: 14, fontFamily: "'Courier New', monospace", fontSize: 12, color: "#7a6200", lineHeight: 1.7 }}>
              ✅ Your Apps Script URL is wired in. Scan any label with your phone camera → auto-logs to your sheet.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
