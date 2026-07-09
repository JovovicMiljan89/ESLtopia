import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ListenCircleTask, ColorBoxTask, MatchTask, FillInTask, TrueFalseTask, OddOneOutTask, CircleWordTask, PictureShadowTask, TraceLettersTask } from "./WorksheetTasks.jsx";

export default function PdfPreviewModal({
  open,
  topic,
  sections,
  studentName,
  selectedClass,
  showAnswers,
  sheetKey,
  styles,
  onClose,
  onNewSet,
  onToggleAnswers,
}) {
  const pdfPageRef = useRef(null);
  const pdfScrollRef = useRef(null);

  useEffect(() => {
    if (open) document.body.classList.add("pdf-modal-open");
    else document.body.classList.remove("pdf-modal-open");
    return () => document.body.classList.remove("pdf-modal-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) pdfScrollRef.current?.scrollTo({ top: 0 });
  }, [sheetKey, open]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    const el = pdfPageRef.current;
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) { alert("Pop-up blocked — please allow pop-ups for this site."); return; }
    win.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>${topic?.emoji || ""} ${topic?.name || "Worksheet"}</title>
<style>${styles}</style>
</head><body style="background:#fff;padding:32px 40px;">${el.innerHTML}</body></html>`);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  if (!open || !sections || !topic) return null;

  const exerciseCount = sections.reduce((sum, s) => sum + (s.items || s.pairs || s.groups || s.letters || []).length, 0);

  return createPortal(
    <div className="pdf-modal-overlay" onClick={onClose}>
      <div className="pdf-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-modal-header">
          <div className="pdf-modal-icon">{topic.emoji}</div>
          <div className="pdf-modal-heading">
            <div className="pdf-modal-title">{topic.name}</div>
            <div className="pdf-modal-subtitle">Grade {topic.grade} · {exerciseCount} exercises</div>
          </div>
          <button className="pdf-modal-close" onClick={onClose} title="Close (Esc)">✕</button>
        </div>

        <div className="pdf-modal-actionbar">
          <button
            className={`pdf-answer-toggle${showAnswers ? " active" : ""}`}
            onClick={onToggleAnswers}
          >
            <span className="pdf-answer-track"><span className="pdf-answer-thumb" /></span>
            Answer key
          </button>
          <button className="pdf-ghost-btn" onClick={onNewSet}>↺ New set</button>
          <div className="pdf-actionbar-spacer" />
          <button className="pdf-outline-btn" onClick={handlePrint}>🖨 Print</button>
          <button className="pdf-primary-btn" onClick={handleDownloadPDF}>⬇ Download PDF</button>
        </div>

        <div className="pdf-modal-scroll" ref={pdfScrollRef}>
          <div className="pdf-a4-page" key={sheetKey} ref={pdfPageRef}>
            <div className="ws-header">
              <div>
                <div className="ws-badge">Grade {topic.grade} · English</div>
                <div className="ws-title">{topic.emoji} {topic.name}</div>
                <div className="ws-subtitle">{topic.desc}</div>
              </div>
              <div className="ws-fields">
                <div className="ws-field-line">Name: <span>{studentName}</span></div>
                {selectedClass && <div className="ws-field-line">Class: <span>{selectedClass.name}</span></div>}
                <div className="ws-field-line">Date: <span /></div>
                <div className="ws-field-line">Grade: <span /></div>
              </div>
            </div>
            {sections.map((sec, i) => (
              <div key={i} style={{ marginTop: i > 0 ? 28 : 0 }}>
                {sections.length > 1 && <div className="ws-badge" style={{ marginBottom: 10 }}>Zadatak {i + 1}</div>}
                {sec.type === "listen-circle" && <ListenCircleTask data={sec} />}
                {sec.type === "color-boxes" && <ColorBoxTask data={sec} />}
                {sec.type === "match" && <MatchTask data={sec} showAnswers={showAnswers} />}
                {sec.type === "fillin" && <FillInTask data={sec} showAnswers={showAnswers} />}
                {sec.type === "tf" && <TrueFalseTask data={sec} showAnswers={showAnswers} />}
                {sec.type === "odd-one-out" && <OddOneOutTask data={sec} showAnswers={showAnswers} />}
                {sec.type === "circle-word" && <CircleWordTask data={sec} showAnswers={showAnswers} />}
                {sec.type === "picture-shadow" && <PictureShadowTask data={sec} showAnswers={showAnswers} />}
                {sec.type === "trace-letters" && <TraceLettersTask data={sec} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
