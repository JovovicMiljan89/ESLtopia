import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ListenCircleTask, ColorBoxTask, MatchTask, FillInTask, TrueFalseTask } from "./WorksheetTasks.jsx";

export default function PdfPreviewModal({
  open,
  topic,
  tasks,
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

  if (!open || !tasks || !topic) return null;

  return createPortal(
    <div className="pdf-modal-overlay">
      <div className="pdf-modal-header">
        <span className="pdf-modal-title">📄 {topic.emoji} {topic.name} · Grade {topic.grade}</span>
        <button className="pdf-action-btn pdf-answers-btn" onClick={onToggleAnswers}>
          {showAnswers ? "Hide answers" : "Show answers"}
        </button>
        <button className="pdf-action-btn pdf-new-btn" onClick={onNewSet}>
          ↺ New set
        </button>
        <div className="pdf-header-sep" />
        <button className="pdf-action-btn pdf-print-btn" onClick={handlePrint}>
          🖨 Print
        </button>
        <button className="pdf-action-btn pdf-download-btn" onClick={handleDownloadPDF}>
          ⬇ Download PDF
        </button>
        <div className="pdf-header-sep" />
        <button className="pdf-action-btn pdf-close-btn" onClick={onClose}>
          ✕ Close
        </button>
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
          {tasks.type === "listen-circle" && <ListenCircleTask data={tasks} />}
          {tasks.type === "color-boxes" && <ColorBoxTask data={tasks} />}
          {tasks.type === "match" && <MatchTask data={tasks} showAnswers={showAnswers} />}
          {tasks.type === "fillin" && <FillInTask data={tasks} showAnswers={showAnswers} />}
          {tasks.type === "tf" && <TrueFalseTask data={tasks} showAnswers={showAnswers} />}
        </div>
      </div>
    </div>,
    document.body
  );
}
