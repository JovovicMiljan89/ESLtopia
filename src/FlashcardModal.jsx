import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function FlashcardModal({
  open,
  topic,
  cards,
  sheetKey,
  styles,
  onClose,
  onNewSet,
}) {
  const [cardStyle, setCardStyle] = useState("color");
  const pageRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open) document.body.classList.add("flashcard-modal-open");
    else document.body.classList.remove("flashcard-modal-open");
    return () => document.body.classList.remove("flashcard-modal-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: 0 });
  }, [sheetKey, open]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    const el = pageRef.current;
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) { alert("Pop-up blocked — please allow pop-ups for this site."); return; }
    win.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>${topic?.emoji || ""} ${topic?.name || "Flashcards"}</title>
<style>${styles}</style>
</head><body style="background:#fff;padding:32px 40px;">${el.innerHTML}</body></html>`);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  if (!open || !cards || !topic) return null;

  return createPortal(
    <div className="pdf-modal-overlay" onClick={onClose}>
      <div className="pdf-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-modal-header">
          <div className="pdf-modal-icon">🃏</div>
          <div className="pdf-modal-heading">
            <div className="pdf-modal-title">{topic.name} — Flashcards</div>
            <div className="pdf-modal-subtitle">Grade {topic.grade} · {cards.length} cards</div>
          </div>
          <button className="pdf-modal-close" onClick={onClose} title="Close (Esc)">✕</button>
        </div>

        <div className="pdf-modal-actionbar">
          <div className="type-pills">
            <button
              className={`type-pill ${cardStyle === "color" ? "active" : ""}`}
              onClick={() => setCardStyle("color")}
            >
              🎨 Color
            </button>
            <button
              className={`type-pill ${cardStyle === "outline" ? "active" : ""}`}
              onClick={() => setCardStyle("outline")}
            >
              🖍️ Color-in
            </button>
          </div>
          <button className="pdf-ghost-btn" onClick={onNewSet}>↺ New set</button>
          <div className="pdf-actionbar-spacer" />
          <button className="pdf-outline-btn" onClick={handlePrint}>🖨 Print</button>
          <button className="pdf-primary-btn" onClick={handleDownloadPDF}>⬇ Download PDF</button>
        </div>

        <div className="pdf-modal-scroll" ref={scrollRef}>
          <div className="flashcard-page" key={sheetKey} ref={pageRef}>
            <div className={`flashcard-grid ${cardStyle === "outline" ? "outline" : ""}`}>
              {cards.map((c, i) => (
                <div className={`flashcard ${cardStyle === "outline" ? "flashcard-outline" : "flashcard-color"}`} key={i}>
                  {cardStyle === "outline" ? (
                    <div className="flashcard-emoji-outline">
                      <span className="emoji-layer emoji-stroke">{c.emoji}</span>
                      <span className="emoji-layer emoji-fill">{c.emoji}</span>
                    </div>
                  ) : (
                    <div className="flashcard-emoji">{c.emoji}</div>
                  )}
                  <div className="flashcard-word">{c.front}</div>
                  {c.back && <div className="flashcard-translation">{c.back}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
