export const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

  button, input, select, textarea { touch-action: manipulation; }

  html, body { overflow-x: hidden; }

  body {
    background-color: #fffaf6;
    background-image:
      radial-gradient(circle, rgba(247, 103, 7, 0.055) 1.5px, transparent 1.5px),
      linear-gradient(160deg, #fffbf5 0%, #fff5f8 50%, #f5fff9 100%);
    background-size: 28px 28px, 100% 100%;
    background-attachment: fixed;
    color: #2d1b0e;
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
  }

  .app {
    max-width: 900px;
    margin: 0 auto;
    padding: 36px 24px;
    min-width: 0;
  }

  .header {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    margin-bottom: 36px;
  }

  .logo-mark {
    flex-shrink: 0;
  }

  .header-text h1 {
    font-family: 'Nunito', sans-serif;
    font-size: 28px;
    font-weight: 900;
    color: #2d1b0e;
    line-height: 1.1;
  }

  .header-text p {
    font-size: 14px;
    color: #9b7060;
    margin-top: 4px;
  }

  .configurator {
    background:
      linear-gradient(90deg, #f76707 0%, #e64980 100%) top / 100% 3px no-repeat,
      rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    border-radius: 24px;
    padding: 32px 28px 28px;
    margin-bottom: 24px;
    border: 1px solid rgba(255,255,255,0.9);
    box-shadow: 0 4px 32px rgba(60, 30, 15, 0.08), 0 1px 0 rgba(255,255,255,0.8) inset;
  }

  .config-title {
    font-family: 'Nunito', sans-serif;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #9b7060;
    margin-bottom: 22px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .config-title::before {
    content: '';
    display: block;
    width: 3px;
    height: 16px;
    background: linear-gradient(180deg, #f76707, #e64980);
    border-radius: 2px;
    flex-shrink: 0;
  }

  .config-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  /* ═══ RESPONSIVE ══════════════════════════════════════════════════════════ */

  /* Tablet ≤ 768px */
  @media (max-width: 768px) {
    .app { padding: 24px 16px; }
    .listen-grid { grid-template-columns: repeat(3, 1fr); }
    .color-grid { grid-template-columns: repeat(4, 1fr); }
    .topic-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
    .worksheet { padding: 24px 20px; }
    .tabs { width: 100%; }
    .toolbar-actions { flex-wrap: wrap; gap: 8px; }
  }

  /* Large mobile ≤ 600px */
  @media (max-width: 600px) {
    .config-row { grid-template-columns: 1fr; }
    .landing-features { grid-template-columns: 1fr; gap: 14px; }
    .landing-stats { gap: 24px; }
    .listen-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .color-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
  }

  /* Small mobile ≤ 480px — covers Samsung A55 5G (393px) and most Android phones */
  @media (max-width: 480px) {
    .app { padding: 14px 10px; }

    /* ── Header ── */
    .header { gap: 12px; margin-bottom: 20px; }
    .header-text { min-width: 0; }
    .logo-mark { flex-shrink: 0; }
    .header-text h1 { font-size: 20px; }
    .header-text p { font-size: 12px; }

    /* ── Tabs — horizontally scrollable, no squeeze ── */
    .tabs { width: 100%; border-radius: 14px; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .tabs::-webkit-scrollbar { display: none; }
    .tab { flex-shrink: 0; padding: 11px 18px; font-size: 13px; white-space: nowrap; min-height: 44px; display: flex; align-items: center; justify-content: center; }

    /* ── Panels ── */
    .configurator, .classes-panel { padding: 16px 12px; border-radius: 18px; }

    /* ── Topic grid ── */
    .topic-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .topic-card { padding: 12px 10px; }
    .topic-emoji { font-size: 18px; }
    .topic-name { font-size: 12px; }
    .topic-desc { font-size: 10px; }

    /* ── Generate button ── */
    .gen-btn { font-size: 15px; padding: 15px; border-radius: 12px; }

    /* ── Worksheet ── */
    .worksheet { padding: 16px 12px; }
    .ws-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .ws-fields { text-align: left; flex-direction: row; flex-wrap: wrap; gap: 10px 18px; }
    .ws-field-line { justify-content: flex-start; }
    .ws-title { font-size: 18px; }
    .ws-subtitle { font-size: 12px; }

    /* ── Worksheet toolbar — stack meta above buttons ── */
    .worksheet-toolbar { padding: 10px 12px; flex-direction: column; align-items: flex-start; gap: 10px; }
    .toolbar-actions { flex-wrap: wrap; gap: 6px; width: 100%; }
    .action-btn { font-size: 11px; padding: 8px 12px; min-height: 40px; flex: 1; text-align: center; }

    /* ── Task pills ── */
    .type-pill { padding: 10px 16px; min-height: 44px; display: flex; align-items: center; }

    /* ── Match task ── */
    .match-grid { grid-template-columns: 1fr; gap: 0; }

    /* ── Listen & color task grids — 2 columns so kids see big, clear cards ── */
    .listen-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .listen-card { padding: 18px 8px 14px; min-height: 110px; border-radius: 16px; }
    .listen-card-emoji { font-size: 40px; }
    .listen-card-word { font-size: 14px; }
    .listen-card-sr { font-size: 12px; }
    .color-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .color-box-word { font-size: 14px; }
    .color-box-sr { font-size: 12px; }

    /* ── Records table — horizontal scroll with bigger tap targets ── */
    .records-table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; white-space: nowrap; }
    .records-table th { padding: 8px 10px; font-size: 10px; }
    .records-table td { padding: 10px 10px; font-size: 13px; }
    .check { width: 34px; height: 34px; border-radius: 8px; }
    .check svg { width: 16px; height: 16px; }
    .records-controls { flex-direction: column; gap: 8px; }
    .records-controls .field { min-width: unset; }

    /* ── Classes panel ── */
    .add-class-row { flex-direction: column; }
    .add-class-row .text-input { min-width: unset; }

    /* ── Modal — slides up from bottom ── */
    .modal-overlay { padding: 0; align-items: flex-end; }
    .modal { border-radius: 24px 24px 0 0; max-height: 90vh; overflow-y: auto; width: 100%; max-width: 100%; }
    .modal-head { padding: 20px 18px 18px; border-radius: 24px 24px 0 0; }
    .modal-close { width: 40px; height: 40px; font-size: 20px; }
    .modal-body { padding: 16px 14px 32px; }

    /* ── Profile stats ── */
    .profile-stats { grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .profile-stat { padding: 12px 8px; }
    .profile-stat-value { font-size: 20px; }

    /* ── Payment summary ── */
    .pay-summary { gap: 12px; }
    .pay-summary-value { font-size: 16px; }

    /* ── Landing page ── */
    .landing { padding: 0 16px 60px; }
    .landing-hero { padding: 48px 4px 36px; }
    .landing-logo { display: block; margin: 0 auto 28px; }
    .landing-title { font-size: 30px; }
    .landing-subtitle { font-size: 15px; }
    .landing-cta { font-size: 16px; padding: 16px 24px; width: 100%; max-width: 320px; }
    .landing-grades-card { padding: 22px 16px; }
  }

  /* Extra small ≤ 360px */
  @media (max-width: 360px) {
    .app { padding: 12px 8px; }
    .tab { padding: 10px 14px; font-size: 12px; }
    .listen-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .color-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .topic-grid { grid-template-columns: 1fr; }
    .action-btn { font-size: 10px; padding: 7px 8px; }
    .profile-stats { grid-template-columns: repeat(2, 1fr); }
    .profile-stat { padding: 10px 6px; }
    .landing-title { font-size: 26px; }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field.full { grid-column: 1 / -1; }

  label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #c4a498;
  }

  select, .text-input {
    background: #fff9f6;
    border: 1.5px solid #fde8d8;
    border-radius: 12px;
    color: #2d1b0e;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    padding: 10px 14px;
    outline: none;
    transition: all 0.18s;
    width: 100%;
    appearance: none;
  }

  select:focus, .text-input:focus {
    border-color: #f76707;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(247, 103, 7, 0.12);
  }

  .topic-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
  }

  .topic-card {
    background: #fff;
    border: 1.5px solid #fff4f0;
    border-radius: 14px;
    cursor: pointer;
    padding: 16px;
    transition: all 0.2s;
    user-select: none;
    box-shadow: 0 2px 8px rgba(60, 30, 15, 0.04);
  }

  .topic-card:hover {
    border-color: #ffb085;
    background: #fffaf8;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(247, 103, 7, 0.13);
  }

  .topic-card.active {
    background: linear-gradient(135deg, #f76707 0%, #e64980 100%);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 6px 22px rgba(247, 103, 7, 0.38);
    transform: translateY(-1px);
  }

  .topic-emoji { font-size: 22px; margin-bottom: 6px; }

  .topic-name {
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 800;
    color: inherit;
    line-height: 1.2;
  }

  .topic-desc {
    font-size: 11px;
    color: #9b7060;
    margin-top: 3px;
    line-height: 1.4;
  }

  .topic-card.active .topic-desc { color: #fdc9a9; }

  .gen-btn {
    width: 100%;
    background: linear-gradient(135deg, #f76707 0%, #e64980 100%);
    border: none;
    border-radius: 14px;
    color: #fff;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    font-size: 16px;
    font-weight: 800;
    padding: 16px;
    transition: all 0.2s;
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 20px rgba(247, 103, 7, 0.38);
    letter-spacing: 0.02em;
  }

  .gen-btn:hover:not(:disabled) {
    box-shadow: 0 8px 28px rgba(247, 103, 7, 0.48);
    transform: translateY(-1px);
  }
  .gen-btn:active:not(:disabled) { transform: scale(0.99); box-shadow: 0 2px 12px rgba(247, 103, 7, 0.3); }
  .gen-btn:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }

  .worksheet-wrap {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px);
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.95);
    overflow: hidden;
    box-shadow: 0 4px 32px rgba(60, 30, 15, 0.08);
  }

  .worksheet-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 22px;
    border-bottom: 1px solid #fff6f0;
    gap: 12px;
    flex-wrap: wrap;
    background: #fffaf8;
  }

  .worksheet-meta {
    font-size: 13px;
    color: #9b7060;
    min-width: 0;
    word-break: break-word;
  }

  .worksheet-meta strong { color: #2d1b0e; font-weight: 600; }

  .toolbar-actions { display: flex; gap: 8px; }

  .action-btn {
    background: #fff;
    border: 1.5px solid #fff4f0;
    border-radius: 10px;
    color: #555;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 500;
    padding: 7px 14px;
    transition: all 0.18s;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  .action-btn:hover {
    background: #fff9f6;
    border-color: #c0cbf0;
    box-shadow: 0 3px 10px rgba(60, 30, 15, 0.08);
    transform: translateY(-1px);
  }

  .action-btn.primary {
    background: linear-gradient(135deg, #f76707 0%, #e64980 100%);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 2px 12px rgba(247, 103, 7, 0.32);
  }

  .action-btn.primary:hover {
    box-shadow: 0 5px 18px rgba(247, 103, 7, 0.42);
    transform: translateY(-1px);
  }

  .worksheet { padding: 32px; }

  .ws-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28px;
    padding-bottom: 18px;
    border-bottom: 3px solid #f76707;
    gap: 16px;
    flex-wrap: wrap;
  }

  .ws-badge {
    display: inline-block;
    background: linear-gradient(135deg, #fff4f0 0%, #ffe8f5 100%);
    border-radius: 100px;
    color: #f76707;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 14px;
    margin-bottom: 8px;
    box-shadow: 0 1px 4px rgba(247, 103, 7, 0.12);
  }

  .ws-title {
    font-family: 'Nunito', sans-serif;
    font-size: 22px;
    font-weight: 900;
    color: #2d1b0e;
  }

  .ws-subtitle { font-size: 13px; color: #9b7060; margin-top: 3px; }

  .ws-fields {
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: right;
  }

  .ws-field-line {
    font-size: 12px;
    color: #c4a498;
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: flex-end;
  }

  .ws-field-line span {
    display: inline-block;
    width: 120px;
    border-bottom: 1px solid #fde0d0;
  }

  .section-title {
    font-family: 'Nunito', sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #c4a498;
    margin: 24px 0 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, #fff4f0, transparent);
  }

  .section-title:first-of-type { margin-top: 0; }

  .match-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 32px;
  }

  .match-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid #fff4f0;
  }

  .match-num {
    font-size: 11px;
    font-weight: 700;
    color: #c4a498;
    width: 18px;
    flex-shrink: 0;
  }

  .match-word {
    font-family: 'Nunito', sans-serif;
    font-size: 15px;
    font-weight: 800;
    color: #2d1b0e;
    flex: 1;
  }

  .match-line {
    flex: 1;
    border-bottom: 1.5px solid #ffc9a0;
    height: 18px;
    min-width: 60px;
  }

  .match-answer {
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #f76707;
    flex: 1;
    min-width: 60px;
  }

  .fill-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .fill-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .fill-num {
    font-size: 11px;
    font-weight: 700;
    color: #c4a498;
    width: 20px;
    flex-shrink: 0;
  }

  .fill-sentence {
    font-family: 'Nunito', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #2d1b0e;
    line-height: 1.8;
    overflow-wrap: break-word;
    word-break: break-word;
    min-width: 0;
  }

  .fill-blank {
    display: inline-block;
    border-bottom: 2px solid #f76707;
    min-width: 70px;
    margin: 0 4px;
    height: 22px;
  }

  .fill-blank-answer {
    display: inline-block;
    color: #f76707;
    font-weight: 800;
    min-width: 70px;
    margin: 0 4px;
    border-bottom: 2px solid #f76707;
    text-align: center;
  }

  .tf-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .tf-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fffaf8;
    border: 1px solid #fff4f0;
    border-radius: 12px;
    padding: 12px 16px;
    transition: border-color 0.15s;
  }

  .tf-item:hover { border-color: #fdc9a9; }

  .tf-num {
    font-size: 11px;
    font-weight: 700;
    color: #c4a498;
    width: 18px;
    flex-shrink: 0;
  }

  .tf-sentence {
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #2d1b0e;
    flex: 1;
    overflow-wrap: break-word;
    word-break: break-word;
    min-width: 0;
  }

  .tf-boxes {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .tf-box {
    width: 36px;
    height: 28px;
    border: 1.5px solid #fde0d0;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: #c4a498;
  }

  .tf-box.correct-t { background: #d3f9d8; border-color: #51cf66; color: #2b8a3e; }
  .tf-box.correct-f { background: #ffe3e3; border-color: #ff6b6b; color: #c92a2a; }

  .word-bank {
    background: linear-gradient(135deg, #fff9f6 0%, #fff0e8 100%);
    border: 1.5px dashed #fdc9a9;
    border-radius: 14px;
    padding: 14px 18px;
    margin-bottom: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .word-bank-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #c4a498;
    width: 100%;
    margin-bottom: 4px;
  }

  .word-chip {
    background: #fff;
    border: 1.5px solid #fde0d0;
    border-radius: 8px;
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 800;
    color: #2d1b0e;
    padding: 4px 12px;
  }

  .answer-key {
    margin-top: 28px;
    padding-top: 18px;
    border-top: 1.5px dashed #fde0d0;
  }

  .answer-key-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #c4a498;
    margin-bottom: 10px;
  }

  .answer-key-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .answer-key-item {
    font-family: 'Nunito', sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: #f76707;
    background: #fff4f0;
    border-radius: 6px;
    padding: 3px 10px;
  }

  @media print {
    /* Modal closed — print inline worksheet */
    body:not(.pdf-modal-open) { background: #fff; }
    body:not(.pdf-modal-open) .app { padding: 0; max-width: 100%; }
    body:not(.pdf-modal-open) .configurator,
    body:not(.pdf-modal-open) .worksheet-toolbar,
    body:not(.pdf-modal-open) .classes-panel { display: none !important; }
    body:not(.pdf-modal-open) .worksheet-wrap { border: none; border-radius: 0; }
    body:not(.pdf-modal-open) .worksheet { padding: 20px; }
    body:not(.pdf-modal-open) .answer-key { display: none; }
    body:not(.pdf-modal-open) .tf-box.correct-t,
    body:not(.pdf-modal-open) .tf-box.correct-f { background: #fff; border-color: #ccc; color: transparent; }
    body:not(.pdf-modal-open) .fill-blank-answer { color: transparent; border-bottom-color: #2d1b0e; }
    body:not(.pdf-modal-open) .match-answer { color: transparent; }

    /* Modal open — print only the A4 preview */
    body.pdf-modal-open .app { display: none !important; }
    body.pdf-modal-open .pdf-modal-overlay {
      position: static !important;
      background: #fff !important;
      backdrop-filter: none !important;
    }
    body.pdf-modal-open .pdf-modal-card {
      max-width: 100% !important;
      max-height: none !important;
      height: auto !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      background: #fff !important;
    }
    body.pdf-modal-open .pdf-modal-header { display: none !important; }
    body.pdf-modal-open .pdf-modal-actionbar { display: none !important; }
    body.pdf-modal-open .pdf-modal-scroll {
      padding: 0 !important;
      overflow: visible !important;
      background: #fff !important;
      display: block !important;
    }
    body.pdf-modal-open .pdf-a4-page {
      box-shadow: none !important;
      border-radius: 0 !important;
      width: 100% !important;
      min-height: unset !important;
      padding: 20px !important;
    }
    body.pdf-modal-open .answer-key { display: none !important; }
    body.pdf-modal-open .tf-box.correct-t,
    body.pdf-modal-open .tf-box.correct-f { background: #fff; border-color: #ccc; color: transparent; }
    body.pdf-modal-open .fill-blank-answer { color: transparent; border-bottom-color: #2d1b0e; }
    body.pdf-modal-open .match-answer { color: transparent; }

    /* Flashcard modal open — print only the flashcard grid */
    body.flashcard-modal-open .app { display: none !important; }
    body.flashcard-modal-open .pdf-modal-overlay {
      position: static !important;
      background: #fff !important;
      backdrop-filter: none !important;
    }
    body.flashcard-modal-open .pdf-modal-card {
      max-width: 100% !important;
      max-height: none !important;
      height: auto !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      background: #fff !important;
    }
    body.flashcard-modal-open .pdf-modal-header { display: none !important; }
    body.flashcard-modal-open .pdf-modal-actionbar { display: none !important; }
    body.flashcard-modal-open .pdf-modal-scroll {
      padding: 0 !important;
      overflow: visible !important;
      background: #fff !important;
      display: block !important;
    }
    body.flashcard-modal-open .flashcard-page {
      box-shadow: none !important;
      border-radius: 0 !important;
      width: 100% !important;
      padding: 0 !important;
    }
    .flashcard { break-inside: avoid; }
  }

  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 20px;
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(10px);
    border-radius: 14px;
    padding: 4px;
    width: fit-content;
    box-shadow: 0 2px 12px rgba(60, 30, 15, 0.07), 0 1px 0 rgba(255,255,255,0.8) inset;
  }

  .tab {
    background: transparent;
    border: none;
    border-radius: 10px;
    color: #9b7060;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    font-weight: 800;
    padding: 10px 20px;
    transition: all 0.2s;
  }

  .tab:hover { color: #f76707; background: rgba(247, 103, 7, 0.06); }

  .tab.active {
    background: #fff;
    color: #f76707;
    box-shadow: 0 2px 10px rgba(60, 30, 15, 0.1);
  }

  .classes-panel {
    background:
      linear-gradient(90deg, #f76707 0%, #e64980 100%) top / 100% 3px no-repeat,
      rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    border-radius: 24px;
    padding: 32px 28px 28px;
    margin-bottom: 24px;
    border: 1px solid rgba(255,255,255,0.9);
    box-shadow: 0 4px 32px rgba(60, 30, 15, 0.08);
  }

  .add-class-row {
    display: flex;
    gap: 10px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .add-class-row .text-input { flex: 1; min-width: 180px; }

  .mini-btn {
    background: linear-gradient(135deg, #f76707 0%, #e64980 100%);
    border: none;
    border-radius: 12px;
    color: #fff;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    font-weight: 800;
    padding: 10px 20px;
    transition: all 0.2s;
    white-space: nowrap;
    box-shadow: 0 3px 12px rgba(247, 103, 7, 0.3);
  }

  .mini-btn:hover:not(:disabled) {
    box-shadow: 0 5px 18px rgba(247, 103, 7, 0.42);
    transform: translateY(-1px);
  }
  .mini-btn:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }

  .mini-btn.ghost {
    background: #fff;
    border: 1.5px solid #fde0d0;
    color: #f76707;
    box-shadow: 0 1px 5px rgba(0,0,0,0.05);
  }
  .mini-btn.ghost:hover { background: #fff9f6; box-shadow: 0 3px 10px rgba(60,30,15,0.08); transform: translateY(-1px); }

  .class-card {
    background: #fff;
    border: 1px solid #fff6f0;
    border-radius: 18px;
    padding: 20px 22px;
    margin-bottom: 12px;
    box-shadow: 0 2px 12px rgba(60, 30, 15, 0.05);
    transition: box-shadow 0.15s;
  }

  .class-card:hover { box-shadow: 0 4px 20px rgba(60, 30, 15, 0.09); }

  .class-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    gap: 12px;
  }

  .class-name {
    font-family: 'Nunito', sans-serif;
    font-size: 17px;
    font-weight: 900;
    color: #2d1b0e;
  }

  .class-count {
    font-size: 12px;
    color: #9b7060;
    font-weight: 500;
  }

  .student-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }

  .student-tag {
    background: #fff9f6;
    border: 1.5px solid #fde8d8;
    border-radius: 100px;
    color: #2d1b0e;
    font-size: 13px;
    font-weight: 600;
    padding: 5px 12px 5px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    transition: all 0.15s;
  }

  .student-tag:hover { border-color: #fdc9a9; box-shadow: 0 2px 8px rgba(60,30,15,0.08); }

  .student-tag button {
    background: none;
    border: none;
    color: #c0c8e0;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 0;
    transition: color 0.15s;
  }
  .student-tag button:hover { color: #ff6b6b; }

  .empty-students {
    font-size: 13px;
    color: #c4a498;
    font-style: italic;
    margin-bottom: 14px;
  }

  .add-student-row {
    display: flex;
    gap: 8px;
  }

  .add-student-row .text-input {
    flex: 1;
    padding: 8px 12px;
    font-size: 13px;
  }

  .delete-class-btn {
    background: none;
    border: none;
    color: #c0c8e0;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    padding: 4px 8px;
    transition: color 0.15s;
  }
  .delete-class-btn:hover { color: #ff6b6b; }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #c4a498;
  }

  .empty-state-emoji { font-size: 36px; margin-bottom: 12px; }
  .empty-state-text { font-size: 14px; line-height: 1.6; }

  .records-controls {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .records-controls .field { flex: 1; min-width: 150px; }

  .records-table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 14px;
    overflow: hidden;
  }

  .records-table thead tr {
    background: linear-gradient(135deg, #fff9f6 0%, #fff5f8 100%);
  }

  .records-table th {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9b7060;
    text-align: left;
    padding: 12px 14px;
    border-bottom: 2px solid #fde0d0;
  }

  .records-table th.center, .records-table td.center { text-align: center; }

  .records-table td {
    padding: 13px 14px;
    border-bottom: 1px solid #fff4f0;
    font-size: 14px;
    color: #2d1b0e;
    transition: background 0.1s;
  }

  .records-table tbody tr:nth-child(even) td { background-color: #fffcf9; }
  .records-table tbody tr:hover td { background-color: #fff4f0; }

  .quick-fill-row {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
    align-items: center;
  }

  .quick-fill-label {
    font-size: 11px;
    font-weight: 600;
    color: #c4a498;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .quick-fill-btn {
    background: linear-gradient(135deg, #ebfbee 0%, #d3f9d8 100%);
    border: 1.5px solid #8ce99a;
    border-radius: 10px;
    color: #2b8a3e;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 700;
    padding: 7px 14px;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .quick-fill-btn:hover {
    background: linear-gradient(135deg, #d3f9d8 0%, #b2f2bb 100%);
    border-color: #51cf66;
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(43, 138, 62, 0.2);
  }

  .records-table tr:last-child td { border-bottom: none; }

  .student-cell {
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
  }

  .att-count {
    display: inline-block;
    background: #fff4f0;
    border-radius: 100px;
    color: #f76707;
    font-family: 'Nunito', sans-serif;
    font-size: 12px;
    font-weight: 800;
    padding: 2px 10px;
    min-width: 28px;
    text-align: center;
  }

  .check {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    border: 2px solid #ffc9a0;
    background: #fff;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.12s;
    padding: 0;
  }

  .check:hover { border-color: #f76707; }

  .check.checked {
    background: #51cf66;
    border-color: #51cf66;
    color: #fff;
  }

  .check.checked.pay {
    background: #f76707;
    border-color: #f76707;
  }

  .check svg { width: 14px; height: 14px; }

  .pay-summary {
    display: flex;
    gap: 20px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1.5px dashed #fde0d0;
    flex-wrap: wrap;
  }

  .pay-summary-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .pay-summary-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #c4a498;
  }

  .pay-summary-value {
    font-family: 'Nunito', sans-serif;
    font-size: 18px;
    font-weight: 800;
    color: #f76707;
  }

  .student-link {
    background: none;
    border: none;
    color: #2d1b0e;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    font-weight: 700;
    padding: 0;
    text-align: left;
    transition: color 0.12s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .student-link:hover { color: #f76707; }
  .student-link::after {
    content: "↗";
    font-size: 11px;
    color: #c0c8e0;
  }
  .student-link:hover::after { color: #f76707; }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(26, 26, 46, 0.55);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 40px 20px;
    z-index: 100;
    backdrop-filter: blur(3px);
    overflow-y: auto;
  }

  .modal {
    background: #fff;
    border-radius: 20px;
    max-width: 560px;
    width: 100%;
    padding: 0;
    position: relative;
    box-shadow: 0 20px 60px rgba(26, 26, 46, 0.25);
  }

  .modal-head {
    background: linear-gradient(135deg, #f76707 0%, #e64980 100%);
    border-radius: 20px 20px 0 0;
    padding: 24px 28px;
    color: #fff;
    position: relative;
  }

  .modal-avatar {
    width: 48px;
    height: 48px;
    background: rgba(255,255,255,0.18);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Nunito', sans-serif;
    font-size: 20px;
    font-weight: 900;
    margin-bottom: 12px;
  }

  .modal-name {
    font-family: 'Nunito', sans-serif;
    font-size: 22px;
    font-weight: 900;
    line-height: 1.1;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .modal-class {
    font-size: 13px;
    color: #fdc9a9;
    margin-top: 3px;
  }

  .modal-close {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255,255,255,0.18);
    border: none;
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: background 0.15s;
  }
  .modal-close:hover { background: rgba(255,255,255,0.3); }

  .modal-body { padding: 24px 28px 28px; }

  .profile-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 22px;
  }

  .profile-stat {
    background: #fff9f6;
    border-radius: 14px;
    padding: 14px 10px;
    text-align: center;
    border: 1.5px solid transparent;
  }

  .profile-stat.stat-present {
    background: linear-gradient(135deg, #ebfbee 0%, #d3f9d8 100%);
    border-color: #b2f2bb;
  }

  .profile-stat.stat-absent {
    background: linear-gradient(135deg, #fff0f0 0%, #ffe3e3 100%);
    border-color: #ffa8a8;
  }

  .profile-stat.stat-grade {
    background: linear-gradient(135deg, #fff9f6 0%, #fff0e8 100%);
    border-color: #fdc9a9;
  }

  .profile-stat-value {
    font-family: 'Nunito', sans-serif;
    font-size: 22px;
    font-weight: 900;
    line-height: 1;
  }

  .profile-stat-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9b7060;
    margin-top: 5px;
    line-height: 1.3;
  }

  .profile-stat-value.green { color: #2b8a3e; }
  .profile-stat-value.red { color: #c92a2a; }
  .profile-stat-value.blue { color: #f76707; }

  .profile-section-title {
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #f76707;
    margin: 0 0 12px;
  }

  .profile-block { margin-bottom: 24px; }

  .att-log {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 180px;
    overflow-y: auto;
  }

  .att-log-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 14px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 600;
  }

  .att-log-row.present { background: #ebfbee; color: #2b8a3e; }
  .att-log-row.absent { background: #fff0f0; color: #c92a2a; }

  .att-log-status { font-size: 12px; font-weight: 700; }

  .pay-months {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pay-month-chip {
    background: #fff4f0;
    border: 1.5px solid #fdc9a9;
    border-radius: 100px;
    color: #f76707;
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 700;
    padding: 5px 14px;
  }

  .profile-empty {
    font-size: 13px;
    color: #c4a498;
    font-style: italic;
    padding: 8px 0;
  }

  .notes-area {
    background: #fff9f6;
    border: 1.5px solid #fde0d0;
    border-radius: 12px;
    color: #2d1b0e;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    padding: 14px;
    width: 100%;
    min-height: 90px;
    resize: vertical;
    outline: none;
    transition: border-color 0.15s;
  }
  .notes-area:focus { border-color: #f76707; }

  .type-pills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .type-pill {
    background: #fff9f6;
    border: 1.5px solid #fde0d0;
    border-radius: 20px;
    color: #9b7060;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 700;
    padding: 7px 16px;
    transition: all 0.15s;
  }

  .type-pill:hover { border-color: #f76707; color: #f76707; }

  .type-pill.active {
    background: #f76707;
    border-color: #f76707;
    color: #fff;
  }

  .grade-select {
    background: #fff9f6;
    border: 1.5px solid #fde0d0;
    border-radius: 7px;
    color: #2d1b0e;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 700;
    padding: 4px 6px;
    outline: none;
    cursor: pointer;
    width: 54px;
    text-align: center;
    appearance: none;
    transition: border-color 0.12s;
  }
  .grade-select:focus { border-color: #f76707; }

  .scores-log {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 150px;
    overflow-y: auto;
  }

  .score-log-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    border-radius: 9px;
    background: #fff9f6;
    font-size: 13px;
    font-weight: 600;
    color: #2d1b0e;
  }

  .score-badge {
    font-family: 'Nunito', sans-serif;
    font-size: 16px;
    font-weight: 900;
    color: #f76707;
    background: #fff4f0;
    border-radius: 8px;
    padding: 2px 10px;
  }

  /* ── Trimester blocks ── */
  .trimester-block {
    border: 1.5px solid #fde0d0;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .trimester-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    cursor: pointer;
    background: #fff9f6;
    gap: 12px;
    user-select: none;
    transition: background 0.15s;
  }

  .trimester-header:hover { background: #fff4f0; }
  .trimester-header.t1 { border-left: 4px solid #f76707; }
  .trimester-header.t2 { border-left: 4px solid #e64980; }
  .trimester-header.t3 { border-left: 4px solid #2b8a3e; }
  .trimester-header.t4 { border-left: 4px solid #1971c2; }

  .trimester-header-left { flex: 1; min-width: 0; }

  .trimester-name {
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    font-weight: 900;
    color: #2d1b0e;
  }

  .trimester-period {
    font-size: 11px;
    color: #c4a498;
    margin-top: 1px;
  }

  .trimester-chips {
    display: flex;
    gap: 5px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .trimester-chip {
    font-size: 11px;
    font-weight: 700;
    border-radius: 100px;
    padding: 3px 9px;
    white-space: nowrap;
  }

  .trimester-chip.att  { background: #ebfbee; color: #2b8a3e; }
  .trimester-chip.abs  { background: #fff0f0; color: #c92a2a; }
  .trimester-chip.fin  { background: #fff4f0; border: 1.5px solid #fdc9a9; color: #f76707; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 900; }

  .trimester-toggle {
    font-size: 11px;
    color: #c4a498;
    margin-left: 8px;
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .trimester-toggle.open { transform: rotate(180deg); }

  .trimester-content {
    padding: 16px 18px;
    border-top: 1px solid #fde8d8;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .trimester-sub {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #c4a498;
    margin-bottom: 6px;
  }

  .trimester-final-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: linear-gradient(135deg, #fff9f6 0%, #fff4f0 100%);
    border-radius: 12px;
    border: 1.5px solid #fde0d0;
  }

  .trimester-final-label {
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 800;
    color: #2d1b0e;
  }

  .trimester-final-select {
    background: #fff;
    border: 1.5px solid #fde0d0;
    border-radius: 8px;
    color: #f76707;
    font-family: 'Nunito', sans-serif;
    font-size: 16px;
    font-weight: 900;
    padding: 5px 10px;
    outline: none;
    cursor: pointer;
    width: 80px;
    transition: border-color 0.15s;
    appearance: none;
    text-align: center;
  }

  .trimester-final-select:focus { border-color: #f76707; box-shadow: 0 0 0 3px rgba(247,103,7,0.1); }

  .trimester-empty {
    font-size: 13px;
    color: #c4a498;
    font-style: italic;
  }

  /* ── Listen & Circle (grades 1–2) ── */
  .listen-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-top: 12px;
  }
  .listen-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 3px dashed #fdc9a9;
    border-radius: 18px;
    padding: 18px 8px 12px;
    background: #fffdfb;
    min-height: 100px;
    gap: 6px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .listen-card:hover {
    border-color: #f76707;
    box-shadow: 0 4px 14px rgba(247, 103, 7, 0.15);
  }
  .listen-card-emoji {
    font-size: 44px;
    line-height: 1;
  }
  .listen-card-word {
    font-family: 'Nunito', sans-serif;
    font-size: 15px;
    font-weight: 800;
    color: #2d1b0e;
    text-align: center;
    letter-spacing: 0.02em;
  }
  .listen-card-sr {
    font-size: 11px;
    color: #c4a498;
    text-align: center;
  }

  .odd-groups { display: flex; flex-direction: column; gap: 14px; margin-top: 12px; }
  .odd-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border-radius: 14px;
    background: #fffdfb;
    border: 1.5px solid #fff0e8;
  }
  .odd-group-num { font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 13px; color: #9b7060; }
  .odd-group-items { display: flex; gap: 10px; flex-wrap: wrap; }
  .odd-item { width: 96px; min-height: 84px; padding: 10px 6px 8px; }
  .odd-item .listen-card-emoji { font-size: 30px; }
  .odd-item .listen-card-word { font-size: 12px; }
  .odd-item.odd-answer { border-color: #ff6b6b; background: #ffe3e3; }

  .teacher-note {
    margin-top: 10px;
    padding: 8px 12px;
    background: #fff9db;
    border-left: 4px solid #f59f00;
    border-radius: 6px;
    font-size: 12px;
    color: #7c6b00;
    font-style: italic;
  }

  /* ── Color Boxes (grade 1 colors) ── */
  .color-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
    margin-top: 12px;
  }
  .color-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .color-box-square {
    width: 100%;
    aspect-ratio: 1;
    border: 3px dashed #fdc9a9;
    border-radius: 12px;
    background: #fffdfb;
    transition: border-color 0.15s;
  }

  .color-box:hover .color-box-square { border-color: #f76707; }
  .color-box-word {
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 800;
    color: #2d1b0e;
    text-align: center;
  }
  .color-box-sr {
    font-size: 11px;
    color: #c4a498;
    text-align: center;
    margin-top: -2px;
  }

  /* ── Landing Page ── */
  .landing {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 24px 80px;
    min-width: 0;
  }

  .landing-hero {
    text-align: center;
    padding: 72px 20px 56px;
  }

  .landing-logo {
    display: block;
    margin: 0 auto 28px;
  }

  .landing-tagline {
    display: inline-block;
    background: linear-gradient(135deg, #fff4f0 0%, #ffe8f5 100%);
    border: 1.5px solid #fdc9a9;
    border-radius: 100px;
    color: #f76707;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 5px 16px;
    margin-bottom: 20px;
  }

  .landing-title {
    font-family: 'Nunito', sans-serif;
    font-size: 46px;
    font-weight: 900;
    color: #2d1b0e;
    line-height: 1.1;
    margin-bottom: 18px;
  }

  .landing-title-accent {
    background: linear-gradient(135deg, #f76707 20%, #e64980 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .landing-subtitle {
    font-size: 18px;
    color: #9b7060;
    max-width: 500px;
    margin: 0 auto 40px;
    line-height: 1.65;
  }

  .landing-cta {
    background: linear-gradient(135deg, #f76707 0%, #e64980 100%);
    border: none;
    border-radius: 16px;
    color: #fff;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    font-size: 18px;
    font-weight: 900;
    padding: 18px 52px;
    box-shadow: 0 6px 28px rgba(247, 103, 7, 0.44);
    transition: all 0.22s;
    letter-spacing: 0.02em;
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .landing-cta:hover {
    box-shadow: 0 12px 38px rgba(247, 103, 7, 0.52);
    transform: translateY(-3px);
  }

  .landing-cta:active { transform: translateY(-1px); }

  .landing-stats {
    display: flex;
    justify-content: center;
    gap: 36px;
    margin-top: 36px;
    flex-wrap: wrap;
  }

  .landing-stat {
    text-align: center;
  }

  .landing-stat-num {
    font-family: 'Nunito', sans-serif;
    font-size: 28px;
    font-weight: 900;
    color: #f76707;
    line-height: 1;
  }

  .landing-stat-label {
    font-size: 12px;
    color: #c4a498;
    font-weight: 600;
    margin-top: 3px;
    letter-spacing: 0.05em;
  }

  .landing-features {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 20px;
  }

  .feature-card {
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(12px);
    border-radius: 24px;
    padding: 32px 22px 28px;
    text-align: center;
    box-shadow: 0 4px 24px rgba(60, 30, 15, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.95);
    transition: all 0.22s;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 36px rgba(60, 30, 15, 0.11);
  }

  .feature-icon {
    font-size: 52px;
    display: block;
    margin-bottom: 16px;
    line-height: 1;
  }

  .feature-title {
    font-family: 'Nunito', sans-serif;
    font-size: 17px;
    font-weight: 900;
    color: #2d1b0e;
    margin-bottom: 10px;
  }

  .feature-desc {
    font-size: 14px;
    color: #9b7060;
    line-height: 1.6;
  }

  .landing-grades-card {
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(12px);
    border-radius: 24px;
    padding: 36px 32px;
    box-shadow: 0 4px 24px rgba(60, 30, 15, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.95);
    text-align: center;
  }

  .landing-section-label {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #c4a498;
    margin-bottom: 18px;
  }

  .grade-pills {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .grade-pill {
    border-radius: 100px;
    padding: 10px 22px;
    font-family: 'Nunito', sans-serif;
    font-weight: 800;
    font-size: 14px;
    border: 2px solid #fdc9a9;
    background: #fff9f6;
    color: #9b7060;
  }

  .grade-pill.hot {
    background: linear-gradient(135deg, #f76707 0%, #e64980 100%);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 4px 14px rgba(247, 103, 7, 0.32);
  }

  .disney-note {
    font-size: 13px;
    color: #c4a498;
    margin-top: 6px;
  }

  .disney-note strong { color: #f76707; }

  /* ═══ AUTH ══════════════════════════════════════════════════════════════════ */

  .auth-overlay {
    position: fixed;
    inset: 0;
    background: #fffaf6;
    background-image:
      radial-gradient(circle, rgba(247, 103, 7, 0.055) 1.5px, transparent 1.5px),
      linear-gradient(160deg, #fffbf5 0%, #fff5f8 50%, #f5fff9 100%);
    background-size: 28px 28px, 100% 100%;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 32px 20px 60px;
    overflow-y: auto;
    z-index: 1000;
  }

  .auth-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,0.9);
    box-shadow: 0 8px 48px rgba(60, 30, 15, 0.1);
    padding: 40px 36px 36px;
    width: 100%;
    max-width: 480px;
    margin-top: 24px;
  }

  @media (max-width: 480px) {
    .auth-card { padding: 28px 20px 28px; border-radius: 22px; margin-top: 0; }
  }

  .auth-logo {
    display: block;
    margin: 0 auto 18px;
  }

  .auth-title {
    font-family: 'Nunito', sans-serif;
    font-size: 26px;
    font-weight: 900;
    color: #2d1b0e;
    text-align: center;
    margin-bottom: 4px;
  }

  .auth-subtitle {
    font-size: 14px;
    color: #9b7060;
    text-align: center;
    margin-bottom: 26px;
  }

  .auth-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .auth-error {
    font-size: 12px;
    color: #e03131;
    font-weight: 600;
  }

  .auth-hint {
    font-size: 11px;
    color: #c4a498;
    margin-top: 1px;
  }

  .auth-alert {
    background: #fff0f0;
    border: 1.5px solid #ffa8a8;
    border-radius: 10px;
    color: #c92a2a;
    font-size: 13px;
    font-weight: 600;
    padding: 10px 14px;
    text-align: center;
    margin-bottom: 4px;
  }

  .auth-success {
    background: #ebfbee;
    border: 1.5px solid #8ce99a;
    border-radius: 10px;
    color: #2b8a3e;
    font-size: 13px;
    font-weight: 600;
    padding: 10px 14px;
    text-align: center;
    margin-bottom: 4px;
  }

  .role-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 4px;
  }

  .role-card {
    background: #fff9f6;
    border: 2px solid #fde8d8;
    border-radius: 14px;
    cursor: pointer;
    padding: 14px 10px;
    text-align: center;
    transition: all 0.18s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .role-card:hover {
    border-color: #f76707;
    background: #fffaf8;
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgba(247, 103, 7, 0.12);
  }

  .role-card.active {
    background: linear-gradient(135deg, #fff4f0 0%, #ffe8f5 100%);
    border-color: #f76707;
    box-shadow: 0 0 0 3px rgba(247, 103, 7, 0.15);
  }

  .role-icon { font-size: 26px; line-height: 1; }
  .role-label { font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 900; color: #2d1b0e; }
  .role-desc { font-size: 11px; color: #9b7060; line-height: 1.3; }

  .user-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.85);
    border: 1.5px solid #fde8d8;
    border-radius: 12px;
    padding: 6px 10px 6px 6px;
    margin-left: auto;
    flex-shrink: 0;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #f76707 0%, #e64980 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Nunito', sans-serif;
    font-size: 12px;
    font-weight: 900;
    color: #fff;
    flex-shrink: 0;
  }

  .user-info { display: flex; flex-direction: column; }
  .user-name { font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 800; color: #2d1b0e; line-height: 1.1; }
  .user-role-label { font-size: 10px; color: #c4a498; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }

  .logout-btn {
    background: none;
    border: 1.5px solid #fde8d8;
    border-radius: 8px;
    color: #c4a498;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .logout-btn:hover { border-color: #ff6b6b; color: #e03131; background: #fff0f0; }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 14px;
    overflow: hidden;
    margin-top: 8px;
  }

  .admin-table th {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9b7060;
    text-align: left;
    padding: 12px 14px;
    border-bottom: 2px solid #fde0d0;
    background: linear-gradient(135deg, #fff9f6 0%, #fff5f8 100%);
  }

  .admin-table td {
    padding: 13px 14px;
    border-bottom: 1px solid #fff4f0;
    font-size: 14px;
    color: #2d1b0e;
  }

  .admin-table tbody tr:nth-child(even) td { background-color: #fffcf9; }
  .admin-table tbody tr:hover td { background-color: #fff4f0; }
  .admin-table tbody tr:last-child td { border-bottom: none; }

  .role-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
  }
  .role-badge.teacher { background: #e7f5ff; color: #1971c2; }
  .role-badge.school  { background: #fff9db; color: #e67700; }
  .role-badge.superadmin { background: #fff4f0; color: #f76707; }

  .input-row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  @media (max-width: 480px) {
    .input-row-2 { grid-template-columns: 1fr; }
    .role-cards { grid-template-columns: 1fr 1fr; }
  }

  /* ── PDF Preview Modal ── */
  @keyframes pdf-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pdf-pop { from { transform: scale(0.98); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  .pdf-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(24,15,9,0.5);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 28px;
    animation: pdf-fade 0.18s ease;
  }

  .pdf-modal-card {
    width: 100%;
    max-width: 900px;
    height: 100%;
    max-height: min(880px, 92vh);
    background: #f7f1ec;
    border-radius: 24px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 44px 90px -18px rgba(24,15,9,0.55);
    animation: pdf-pop 0.2s ease;
  }

  .pdf-modal-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 22px;
    background: #fff;
    border-bottom: 1px solid #fff0e8;
    flex-shrink: 0;
  }

  .pdf-modal-icon {
    width: 44px;
    height: 44px;
    border-radius: 13px;
    background: linear-gradient(135deg, #fff4f0 0%, #ffe8f5 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
  }

  .pdf-modal-heading { flex: 1; min-width: 0; }

  .pdf-modal-title {
    font-family: 'Nunito', sans-serif;
    font-size: 16px;
    font-weight: 900;
    color: #2d1b0e;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pdf-modal-subtitle {
    font-size: 12px;
    color: #9b7060;
    margin-top: 1px;
  }

  .pdf-modal-close {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    border: none;
    background: #fff4f0;
    color: #c4813f;
    font-size: 17px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
  }
  .pdf-modal-close:hover { background: #ffdfd0; color: #f76707; }

  .pdf-modal-actionbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 22px;
    background: #fffaf7;
    border-bottom: 1px solid #fff0e8;
    flex-shrink: 0;
    flex-wrap: wrap;
    row-gap: 10px;
  }

  .pdf-actionbar-spacer { flex: 1; min-width: 6px; }

  .pdf-answer-toggle {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    border: 1.5px solid #fde0d0;
    border-radius: 999px;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 800;
    padding: 7px 16px 7px 8px;
    background: #fff;
    color: #9b7060;
    transition: all 0.15s;
  }
  .pdf-answer-toggle.active {
    border-color: #f9c9a6;
    background: #fff4ec;
    color: #c4600f;
  }

  .pdf-answer-track {
    display: inline-flex;
    align-items: center;
    width: 30px;
    height: 18px;
    border-radius: 999px;
    flex-shrink: 0;
    background: #e8ddd4;
    transition: background 0.15s;
  }
  .pdf-answer-toggle.active .pdf-answer-track {
    background: linear-gradient(135deg, #f76707, #e64980);
  }

  .pdf-answer-thumb {
    display: block;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.28);
    transform: translateX(2px);
    transition: transform 0.15s;
  }
  .pdf-answer-toggle.active .pdf-answer-thumb { transform: translateX(13px); }

  .pdf-ghost-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1.5px solid transparent;
    border-radius: 999px;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 700;
    padding: 8px 14px;
    background: transparent;
    color: #9b7060;
    transition: all 0.15s;
  }
  .pdf-ghost-btn:hover { background: #fff4f0; color: #c4600f; }

  .pdf-outline-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1.5px solid #ecd9cd;
    border-radius: 11px;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 800;
    padding: 9px 16px;
    background: #fff;
    color: #5a3d2b;
    transition: all 0.15s;
  }
  .pdf-outline-btn:hover { background: #fff8f4; border-color: #f9c9a6; }

  .pdf-primary-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: none;
    border-radius: 11px;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 800;
    padding: 9px 18px;
    background: linear-gradient(135deg, #f76707 0%, #e64980 100%);
    color: #fff;
    box-shadow: 0 6px 18px -6px rgba(247,103,7,0.55);
    transition: all 0.18s;
  }
  .pdf-primary-btn:hover {
    box-shadow: 0 8px 24px -6px rgba(247,103,7,0.65);
    transform: translateY(-1px);
  }

  .pdf-modal-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 28px 20px 40px;
    display: flex;
    justify-content: center;
    background: #efe6de;
  }

  .pdf-a4-page {
    background: #fff;
    width: 794px;
    max-width: 100%;
    border-radius: 12px;
    box-shadow: 0 16px 44px -16px rgba(45,27,14,0.32);
    padding: 40px 44px 52px;
    flex-shrink: 0;
    align-self: flex-start;
  }

  @media (max-width: 860px) {
    .pdf-modal-overlay { padding: 0; }
    .pdf-modal-card { max-width: 100%; max-height: 100%; border-radius: 0; }
    .pdf-a4-page { width: 100%; padding: 20px 14px 28px; }
    .pdf-modal-scroll { padding: 12px 6px 32px; }
  }

  @media (max-width: 480px) {
    .pdf-modal-header { padding: 12px 14px; }
    .pdf-modal-actionbar { padding: 10px 14px; }
    .pdf-outline-btn, .pdf-primary-btn { font-size: 12px; padding: 8px 12px; }
  }

  /* ═══ FLASHCARDS ══════════════════════════════════════════════════════════ */

  .flashcard-page {
    background: #fff;
    width: 794px;
    max-width: 100%;
    border-radius: 12px;
    box-shadow: 0 16px 44px -16px rgba(45,27,14,0.32);
    padding: 32px;
    flex-shrink: 0;
    align-self: flex-start;
  }

  .flashcard-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .flashcard {
    border-radius: 16px;
    padding: 20px 12px;
    min-height: 170px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .flashcard-emoji { font-size: 44px; margin-bottom: 8px; line-height: 1; }

  .flashcard-word {
    font-family: 'Nunito', sans-serif;
    font-weight: 900;
    font-size: 17px;
    color: #2d1b0e;
    text-transform: capitalize;
    line-height: 1.25;
  }

  .flashcard-translation {
    font-size: 12px;
    color: #9b7060;
    font-style: italic;
    margin-top: 4px;
  }

  /* Color set — playful pastel palette, cycling every 6 cards */
  .flashcard-color { border: 2px solid #ffd7c2; background: linear-gradient(135deg, #fff4f0 0%, #ffe8f5 100%); }
  .flashcard-color:nth-of-type(6n+2) { border-color: #bfe6cf; background: linear-gradient(135deg, #f2fbf5 0%, #e3f6ea 100%); }
  .flashcard-color:nth-of-type(6n+3) { border-color: #b9d9f7; background: linear-gradient(135deg, #f1f8ff 0%, #e3f0fd 100%); }
  .flashcard-color:nth-of-type(6n+4) { border-color: #ffe08a; background: linear-gradient(135deg, #fffaeb 0%, #fff2c9 100%); }
  .flashcard-color:nth-of-type(6n+5) { border-color: #d8c4f2; background: linear-gradient(135deg, #f8f3fd 0%, #ede0fa 100%); }
  .flashcard-color:nth-of-type(6n+0) { border-color: #f7b8c8; background: linear-gradient(135deg, #fff0f4 0%, #fde1e9 100%); }

  /* Color-in set — thick dashed border, outlined picture with a white
     interior (not a flat silhouette) so there's actual white space to color,
     plain black word for kids to color themselves */
  .flashcard-outline {
    background: #fff;
    border: 3px dashed #2d1b0e;
  }

  /* Two stacked copies of the same emoji fake an "outline" out of a color
     glyph (CSS can't do real edge-detection): a black silhouette scaled up
     ~16% sits behind a white silhouette at 100%, so only a black ring shows
     around a white, colorable interior. */
  .flashcard-emoji-outline {
    position: relative;
    width: 56px;
    height: 56px;
    margin: 0 auto 8px;
  }
  .flashcard-emoji-outline .emoji-layer {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 44px;
    line-height: 1;
  }
  .flashcard-emoji-outline .emoji-stroke {
    filter: grayscale(1) brightness(0);
    transform: scale(1.16);
  }
  .flashcard-emoji-outline .emoji-fill {
    filter: grayscale(1) brightness(0) invert(1);
  }

  .flashcard-outline .flashcard-word { color: #2d1b0e; }
  .flashcard-outline .flashcard-translation { color: #b0a89f; }

  @media (max-width: 860px) {
    .flashcard-page { width: 100%; padding: 20px 14px; }
    .flashcard-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 480px) {
    .flashcard-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .flashcard { min-height: 140px; padding: 14px 8px; }
    .flashcard-emoji { font-size: 34px; }
    .flashcard-emoji-outline { width: 44px; height: 44px; }
    .flashcard-emoji-outline .emoji-layer { font-size: 34px; }
    .flashcard-word { font-size: 14px; }
  }

`;
