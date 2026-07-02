import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from './supabaseClient.js';
import Logo from './Logo.jsx';

const storage = {
  async get(key) {
    if (typeof window !== "undefined" && window.storage && window.storage.get) {
      return await window.storage.get(key);
    }
    try {
      const v = localStorage.getItem(key);
      return v != null ? { value: v } : null;
    } catch (e) {
      return null;
    }
  },
  async set(key, value) {
    if (typeof window !== "undefined" && window.storage && window.storage.set) {
      return await window.storage.set(key, value);
    }
    try {
      localStorage.setItem(key, value);
      return { value };
    } catch (e) {
      return null;
    }
  },
};

const styles = `
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
    body.pdf-modal-open .pdf-modal-header { display: none !important; }
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
  .pdf-modal-overlay {
    position: fixed;
    inset: 0;
    background: #1e1e2e;
    display: flex;
    flex-direction: column;
    z-index: 200;
  }

  .pdf-modal-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    background: #13132a;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
  }

  .pdf-modal-title {
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    font-weight: 800;
    color: rgba(255,255,255,0.8);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pdf-modal-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 28px 20px 48px;
    display: flex;
    justify-content: center;
    background: #2a2a3e;
  }

  .pdf-a4-page {
    background: #fff;
    width: 794px;
    max-width: 100%;
    border-radius: 3px;
    box-shadow: 0 14px 52px rgba(0,0,0,0.6);
    padding: 40px 44px 52px;
    flex-shrink: 0;
    align-self: flex-start;
  }

  .pdf-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 800;
    padding: 9px 18px;
    transition: all 0.18s;
    white-space: nowrap;
    letter-spacing: 0.01em;
  }

  .pdf-action-btn.pdf-close-btn {
    background: rgba(255,255,255,0.09);
    color: rgba(255,255,255,0.7);
  }
  .pdf-action-btn.pdf-close-btn:hover { background: rgba(255,255,255,0.16); color: #fff; }

  .pdf-action-btn.pdf-new-btn {
    background: rgba(255,255,255,0.09);
    color: rgba(255,255,255,0.7);
  }
  .pdf-action-btn.pdf-new-btn:hover { background: rgba(255,255,255,0.16); color: #fff; }

  .pdf-action-btn.pdf-answers-btn {
    background: rgba(255,255,255,0.09);
    color: rgba(255,255,255,0.7);
  }
  .pdf-action-btn.pdf-answers-btn:hover { background: rgba(255,255,255,0.16); color: #fff; }

  .pdf-action-btn.pdf-print-btn {
    background: rgba(255,255,255,0.12);
    color: #fff;
    border: 1.5px solid rgba(255,255,255,0.22);
  }
  .pdf-action-btn.pdf-print-btn:hover { background: rgba(255,255,255,0.22); }

  .pdf-action-btn.pdf-download-btn {
    background: linear-gradient(135deg, #f76707 0%, #e64980 100%);
    color: #fff;
    box-shadow: 0 3px 16px rgba(247,103,7,0.42);
  }
  .pdf-action-btn.pdf-download-btn:hover {
    box-shadow: 0 6px 22px rgba(247,103,7,0.54);
    transform: translateY(-1px);
  }

  .pdf-header-sep {
    width: 1px;
    height: 22px;
    background: rgba(255,255,255,0.14);
    flex-shrink: 0;
  }

  @media (max-width: 860px) {
    .pdf-a4-page { width: 100%; padding: 20px 14px 28px; }
    .pdf-modal-scroll { padding: 12px 6px 32px; }
  }

  @media (max-width: 480px) {
    .pdf-modal-header { padding: 10px 12px; flex-wrap: wrap; }
    .pdf-modal-title { width: 100%; order: -1; }
    .pdf-action-btn { font-size: 12px; padding: 8px 12px; }
  }

`;



// ─── DATA ────────────────────────────────────────────────────────────────────

const TOPICS = [
  { id: "alphabet", emoji: "🔤", name: "Alphabet", desc: "Slova — Stars & Heroes", grade: "1" },
  { id: "colors", emoji: "🎨", name: "Colors", desc: "Boje — Mickey, Minnie, Donald…", grade: "1" },
  { id: "numbers", emoji: "🔢", name: "Numbers 1–20", desc: "Brojevi — Stars & Heroes", grade: "1" },
  { id: "animals", emoji: "🐾", name: "Animals", desc: "Pluto, Simba, Nemo i drugi", grade: "1" },
  { id: "family", emoji: "👨‍👩‍👧", name: "Family", desc: "Porodica — Stars & Heroes", grade: "1" },
  { id: "body", emoji: "🧍", name: "Body parts", desc: "Delovi tela — Mickey & friends", grade: "2" },
  { id: "food", emoji: "🍎", name: "Food", desc: "Hrana — Stars & Heroes", grade: "2" },
  { id: "am_is_are", emoji: "✏️", name: "am / is / are", desc: "Mickey is happy — glagol to be", grade: "2" },
  { id: "a_an", emoji: "📝", name: "a / an", desc: "Neodređeni član — Stars & Heroes", grade: "2" },
  { id: "classroom", emoji: "🏫", name: "Classroom", desc: "Učionica — Stars & Heroes", grade: "2" },
  // Grade 3
  { id: "sports", emoji: "⚽", name: "Sports", desc: "Sportovi — Mickey & Heroes", grade: "3" },
  { id: "clothes", emoji: "👕", name: "Clothes", desc: "Minnie's dress, Donald's hat…", grade: "3" },
  { id: "adjectives", emoji: "📏", name: "Adjectives", desc: "Pridevi — Stars & Heroes", grade: "3" },
  { id: "prepositions", emoji: "📦", name: "Prepositions", desc: "Gde je Mickey? in/on/under…", grade: "3" },
  { id: "present_simple_3rd", emoji: "🔄", name: "Present Simple", desc: "Mickey plays, Minnie reads…", grade: "3" },
  // Grade 4
  { id: "comparatives", emoji: "📊", name: "Comparatives", desc: "Poređenje prideva", grade: "4" },
  { id: "have_has", emoji: "🤲", name: "have / has", desc: "Glagol have i has", grade: "4" },
  { id: "plurals", emoji: "📚", name: "Plurals", desc: "Množina imenica", grade: "4" },
  { id: "do_does", emoji: "❓", name: "Do / Does?", desc: "Pitanja u sadašnjem vremenu", grade: "4" },
  // Grade 5
  { id: "past_simple_regular", emoji: "⏮️", name: "Past Simple", desc: "Pravilni glagoli (-ed)", grade: "5" },
  { id: "past_simple_irregular", emoji: "⚡", name: "Irregular Verbs", desc: "Nepravilni glagoli", grade: "5" },
  { id: "past_simple_negative", emoji: "❌", name: "Past Simple — didn't", desc: "Negacija u prošlom vremenu", grade: "5" },
  // Grade 6
  { id: "past_simple_questions", emoji: "🔍", name: "Past Simple — Did?", desc: "Pitanja u prošlom vremenu", grade: "6" },
  { id: "past_simple_mixed", emoji: "🔀", name: "Past Simple — Mix", desc: "Mešoviti zadaci", grade: "6" },
];

// ─── TASK GENERATORS ─────────────────────────────────────────────────────────

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function makeTFFromPairs(pairs, count) {
  const selected = shuffle(pairs).slice(0, Math.min(count, pairs.length));
  const allSr = pairs.map(p => p.sr);
  const targetCorrect = Math.round(selected.length / 2);
  const correctIndices = new Set(shuffle([...Array(selected.length).keys()]).slice(0, targetCorrect));
  return {
    type: "tf",
    instruction: "Zaokruži TRUE ako je prevod tačan, FALSE ako nije.",
    items: selected.map((p, i) => {
      if (correctIndices.has(i)) {
        return { sentence: `"${p.en}" znači "${p.sr}"`, answer: true };
      }
      const wrongOptions = allSr.filter(s => s !== p.sr);
      const wrong = wrongOptions.length > 0 ? shuffle(wrongOptions)[0] : p.sr;
      return { sentence: `"${p.en}" znači "${wrong}"`, answer: wrong === p.sr };
    }),
  };
}

function generateTasks(topicId, count, taskType) {
  const data = TOPIC_DATA[topicId];
  if (!data) return null;
  return data.generate(count, taskType);
}

const TOPIC_DATA = {
  colors: {
    generate(count) {
      const all = [
        { word: "red", sr: "crvena" }, { word: "blue", sr: "plava" },
        { word: "green", sr: "zelena" }, { word: "yellow", sr: "žuta" },
        { word: "orange", sr: "narandžasta" }, { word: "purple", sr: "ljubičasta" },
        { word: "pink", sr: "roze" }, { word: "black", sr: "crna" },
        { word: "white", sr: "bela" }, { word: "brown", sr: "braon" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 10));
      return {
        type: "color-boxes",
        instruction: "Oboj svako polje bojom koja piše ispod! 🖍️ Mickey, Minnie i Donald vole boje.",
        teacherNote: "Nastavnik čita svaku boju na engleskom (2×). Deca boje polje odgovarajućom bojom.",
        items,
      };
    },
  },

  numbers: {
    generate(count) {
      const all = [
        { word: "one", emoji: "1️⃣", sr: "jedan" }, { word: "two", emoji: "2️⃣", sr: "dva" },
        { word: "three", emoji: "3️⃣", sr: "tri" }, { word: "four", emoji: "4️⃣", sr: "četiri" },
        { word: "five", emoji: "5️⃣", sr: "pet" }, { word: "six", emoji: "6️⃣", sr: "šest" },
        { word: "seven", emoji: "7️⃣", sr: "sedam" }, { word: "eight", emoji: "8️⃣", sr: "osam" },
        { word: "nine", emoji: "9️⃣", sr: "devet" }, { word: "ten", emoji: "🔟", sr: "deset" },
        { word: "eleven", emoji: "1️⃣1️⃣", sr: "jedanaest" }, { word: "twelve", emoji: "1️⃣2️⃣", sr: "dvanaest" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 12));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže broj na engleskom. Zaokruži odgovarajući broj! 🔢",
        teacherNote: "Izgovorite broj na engleskom 2–3 puta. Deca zaokružuju cifru/kartu.",
        items,
      };
    },
  },

  animals: {
    generate(count) {
      const all = [
        { word: "cat", emoji: "🐱", sr: "mačka" }, { word: "dog", emoji: "🐶", sr: "pas" },
        { word: "cow", emoji: "🐄", sr: "krava" }, { word: "horse", emoji: "🐴", sr: "konj" },
        { word: "bird", emoji: "🐦", sr: "ptica" }, { word: "fish", emoji: "🐟", sr: "riba" },
        { word: "rabbit", emoji: "🐰", sr: "zec" }, { word: "lion", emoji: "🦁", sr: "lav" },
        { word: "elephant", emoji: "🐘", sr: "slon" }, { word: "monkey", emoji: "🐒", sr: "majmun" },
        { word: "snake", emoji: "🐍", sr: "zmija" }, { word: "frog", emoji: "🐸", sr: "žaba" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 12));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže životinju na engleskom. Zaokruži odgovarajuću sliku! 🐾 Pluto je dog, Simba je lion, Nemo je fish!",
        teacherNote: "Izgovorite ime životinje 2–3 puta. Deca zaokružuju sličicu.",
        items,
      };
    },
  },

  family: {
    generate(count) {
      const all = [
        { word: "mother", emoji: "👩", sr: "mama" }, { word: "father", emoji: "👨", sr: "tata" },
        { word: "sister", emoji: "👧", sr: "sestra" }, { word: "brother", emoji: "👦", sr: "brat" },
        { word: "grandmother", emoji: "👵", sr: "baka" }, { word: "grandfather", emoji: "👴", sr: "deda" },
        { word: "aunt", emoji: "👩‍🦰", sr: "tetka" }, { word: "uncle", emoji: "👨‍🦱", sr: "ujak" },
        { word: "baby", emoji: "👶", sr: "beba" }, { word: "family", emoji: "👨‍👩‍👧‍👦", sr: "porodica" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 10));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže člana porodice na engleskom. Zaokruži odgovarajuću sličicu! 👨‍👩‍👧",
        teacherNote: "Izgovorite reč 2–3 puta. Deca zaokružuju odgovarajući emoji.",
        items,
      };
    },
  },

  body: {
    generate(count) {
      const all = [
        { word: "head", emoji: "🗣️", sr: "glava" }, { word: "eye", emoji: "👁️", sr: "oko" },
        { word: "nose", emoji: "👃", sr: "nos" }, { word: "mouth", emoji: "👄", sr: "usta" },
        { word: "ear", emoji: "👂", sr: "uho" }, { word: "hand", emoji: "✋", sr: "ruka" },
        { word: "foot", emoji: "🦶", sr: "stopalo" }, { word: "leg", emoji: "🦵", sr: "noga" },
        { word: "arm", emoji: "💪", sr: "nadlaktica" }, { word: "finger", emoji: "☝️", sr: "prst" },
        { word: "teeth", emoji: "🦷", sr: "zubi" }, { word: "hair", emoji: "💇", sr: "kosa" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 12));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže deo tela na engleskom. Zaokruži odgovarajuću sličicu! 🧍",
        teacherNote: "Izgovorite deo tela 2–3 puta. Deca zaokružuju sličicu i mogu pokazati na sebi.",
        items,
      };
    },
  },

  food: {
    generate(count) {
      const all = [
        { word: "apple", emoji: "🍎", sr: "jabuka" }, { word: "bread", emoji: "🍞", sr: "hleb" },
        { word: "milk", emoji: "🥛", sr: "mleko" }, { word: "egg", emoji: "🥚", sr: "jaje" },
        { word: "banana", emoji: "🍌", sr: "banana" }, { word: "cheese", emoji: "🧀", sr: "sir" },
        { word: "juice", emoji: "🧃", sr: "sok" }, { word: "water", emoji: "💧", sr: "voda" },
        { word: "cake", emoji: "🎂", sr: "torta" }, { word: "soup", emoji: "🍲", sr: "supa" },
        { word: "pizza", emoji: "🍕", sr: "pica" }, { word: "ice cream", emoji: "🍦", sr: "sladoled" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 12));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže hranu na engleskom. Zaokruži odgovarajuću sličicu! 🍎",
        teacherNote: "Izgovorite naziv hrane 2–3 puta. Deca zaokružuju sličicu.",
        items,
      };
    },
  },

  classroom: {
    generate(count) {
      const all = [
        { word: "pencil", emoji: "✏️", sr: "olovka" }, { word: "book", emoji: "📚", sr: "knjiga" },
        { word: "ruler", emoji: "📏", sr: "lenjir" }, { word: "eraser", emoji: "🧹", sr: "gumica" },
        { word: "bag", emoji: "🎒", sr: "torba" }, { word: "desk", emoji: "🪑", sr: "klupa" },
        { word: "pen", emoji: "🖊️", sr: "hemijska" }, { word: "notebook", emoji: "📓", sr: "sveska" },
        { word: "scissors", emoji: "✂️", sr: "makaze" }, { word: "glue", emoji: "🖇️", sr: "lepak" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 10));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže predmet iz učionice na engleskom. Zaokruži odgovarajuću sličicu! 🏫",
        teacherNote: "Izgovorite predmet 2–3 puta. Deca zaokružuju sličicu i mogu pokazati predmet u učionici.",
        items,
      };
    },
  },

  am_is_are: {
    generate(count) {
      const pool = shuffle([
        { sentence: "I ___ a student.", answer: "am", hint: "I" },
        { sentence: "Mickey ___ very happy.", answer: "is", hint: "Mickey" },
        { sentence: "Minnie ___ a great dancer.", answer: "is", hint: "Minnie" },
        { sentence: "Donald and Goofy ___ best friends.", answer: "are", hint: "Donald and Goofy" },
        { sentence: "Minnie and Daisy ___ in the park.", answer: "are", hint: "Minnie and Daisy" },
        { sentence: "Pluto ___ a big dog.", answer: "is", hint: "Pluto" },
        { sentence: "You ___ my friend.", answer: "are", hint: "You" },
        { sentence: "Goofy ___ very tall.", answer: "is", hint: "Goofy" },
        { sentence: "I ___ hungry.", answer: "am", hint: "I" },
        { sentence: "Mickey and Minnie ___ in the clubhouse.", answer: "are", hint: "Mickey and Minnie" },
        { sentence: "Donald ___ funny.", answer: "is", hint: "Donald" },
        { sentence: "We ___ good friends.", answer: "are", hint: "We" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: 'Popuni rečenice sa am, is ili are. ⭐ Mickey, Minnie, Donald i prijatelji pomažu!',
        wordBank: ["am", "is", "are"],
        items: pool,
      };
    },
  },

  a_an: {
    generate(count) {
      const pool = shuffle([
        { sentence: "___ apple (Minnie's favourite)", answer: "an", hint: "(počinje samoglasnikom)" },
        { sentence: "___ book (from Mickey's library)", answer: "a", hint: "(počinje suglasnikom)" },
        { sentence: "___ orange hat (just like Goofy's)", answer: "an", hint: "(počinje samoglasnikom)" },
        { sentence: "___ dog (just like Pluto!)", answer: "a", hint: "(počinje suglasnikom)" },
        { sentence: "___ elephant (just like Dumbo)", answer: "an", hint: "(počinje samoglasnikom)" },
        { sentence: "___ car (Mickey's red car)", answer: "a", hint: "(počinje suglasnikom)" },
        { sentence: "___ umbrella (Goofy has one)", answer: "an", hint: "(počinje samoglasnikom)" },
        { sentence: "___ big clubhouse (Mickey's!)", answer: "a", hint: "(počinje suglasnikom)" },
        { sentence: "___ egg (Donald makes breakfast)", answer: "an", hint: "(počinje samoglasnikom)" },
        { sentence: "___ pencil (for drawing Mickey)", answer: "a", hint: "(počinje suglasnikom)" },
        { sentence: "___ ice cream (Minnie loves it)", answer: "an", hint: "(počinje samoglasnikom)" },
        { sentence: "___ bow (Minnie's pink bow)", answer: "a", hint: "(počinje suglasnikom)" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: 'Stavi "a" ili "an" ispred imenice. ⭐ Hint: an + samoglasnik (a, e, i, o, u), a + suglasnik!',
        wordBank: ["a", "an"],
        items: pool.map(p => ({ sentence: p.sentence, answer: p.answer, hint: p.hint })),
      };
    },
  },

  // ── Grade 3 ──────────────────────────────────────────────────────────────

  sports: {
    supportedTypes: ["match", "tf"],
    generate(count, taskType) {
      const pairs = shuffle([
        { en: "football", sr: "fudbal" },
        { en: "basketball", sr: "košarka" },
        { en: "tennis", sr: "tenis" },
        { en: "swimming", sr: "plivanje" },
        { en: "cycling", sr: "biciklizam" },
        { en: "running", sr: "trčanje" },
        { en: "volleyball", sr: "odbojka" },
        { en: "skiing", sr: "skijanje" },
        { en: "gymnastics", sr: "gimnastika" },
        { en: "boxing", sr: "boks" },
      ]).slice(0, Math.min(count, 10));
      if (taskType === "tf") return makeTFFromPairs(pairs, count);
      return {
        type: "match",
        instruction: "Povezi sport na engleskom sa prevodom na srpski.",
        pairs,
        leftLabel: "English",
        rightLabel: "Srpski",
      };
    },
  },

  clothes: {
    supportedTypes: ["match", "tf"],
    generate(count, taskType) {
      const pairs = shuffle([
        { en: "shirt", sr: "košulja" },
        { en: "trousers", sr: "pantalone" },
        { en: "dress", sr: "haljina" },
        { en: "jacket", sr: "jakna" },
        { en: "hat", sr: "šešir/kapa" },
        { en: "shoes", sr: "cipele" },
        { en: "socks", sr: "čarape" },
        { en: "skirt", sr: "suknja" },
        { en: "coat", sr: "kaput" },
        { en: "scarf", sr: "šal" },
        { en: "gloves", sr: "rukavice" },
        { en: "boots", sr: "čizme" },
      ]).slice(0, Math.min(count, 12));
      if (taskType === "tf") return makeTFFromPairs(pairs, count);
      return {
        type: "match",
        instruction: "Povezi odevni predmet na engleskom sa prevodom.",
        pairs,
        leftLabel: "English",
        rightLabel: "Srpski",
      };
    },
  },

  adjectives: {
    supportedTypes: ["match", "tf"],
    generate(count, taskType) {
      const allPairs = shuffle([
        { en: "big", sr: "small" },
        { en: "hot", sr: "cold" },
        { en: "tall", sr: "short" },
        { en: "fast", sr: "slow" },
        { en: "old", sr: "young" },
        { en: "happy", sr: "sad" },
        { en: "good", sr: "bad" },
        { en: "long", sr: "short" },
        { en: "hard", sr: "easy" },
        { en: "clean", sr: "dirty" },
        { en: "heavy", sr: "light" },
        { en: "full", sr: "empty" },
      ]).slice(0, Math.min(count, 12));
      if (taskType === "tf") {
        const allSr = allPairs.map(p => p.sr);
        const targetCorrect = Math.round(allPairs.length / 2);
        const correctIdx = new Set(shuffle([...Array(allPairs.length).keys()]).slice(0, targetCorrect));
        return {
          type: "tf",
          instruction: "Zaokruži TRUE ako su pridevi suprotnog značenja, FALSE ako nisu.",
          items: allPairs.map((p, i) => {
            if (correctIdx.has(i)) return { sentence: `"${p.en}" ↔ "${p.sr}"`, answer: true };
            const wrong = shuffle(allSr.filter(s => s !== p.sr))[0] || p.sr;
            return { sentence: `"${p.en}" ↔ "${wrong}"`, answer: wrong === p.sr };
          }),
        };
      }
      return {
        type: "match",
        instruction: "Povezi pridev sa suprotnim pojmom (antonimom).",
        pairs: allPairs,
        leftLabel: "Pridev",
        rightLabel: "Suprotan pojam",
      };
    },
  },

  prepositions: {
    generate(count) {
      const pool = shuffle([
        { sentence: "Mickey is ___ the clubhouse.", answer: "in", hint: "(unutra)" },
        { sentence: "Minnie's bow is ___ the table.", answer: "on", hint: "(na)" },
        { sentence: "Pluto is ___ the chair.", answer: "under", hint: "(ispod)" },
        { sentence: "Goofy is ___ Mickey.", answer: "next to", hint: "(pored)" },
        { sentence: "Daisy is ___ the door.", answer: "behind", hint: "(iza)" },
        { sentence: "Donald's hat is ___ the box.", answer: "in", hint: "(unutra)" },
        { sentence: "Minnie is ___ the sofa.", answer: "on", hint: "(na)" },
        { sentence: "Mickey is ___ the bed.", answer: "under", hint: "(ispod)" },
        { sentence: "Pluto is ___ Donald.", answer: "next to", hint: "(pored)" },
        { sentence: "Goofy is ___ the car.", answer: "behind", hint: "(iza)" },
        { sentence: "The ball is ___ Mickey's bag.", answer: "in", hint: "(unutra)" },
        { sentence: "Donald's book is ___ the desk.", answer: "on", hint: "(na)" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: "Gde su Mickey i prijatelji? Popuni predlog mesta. 🏠",
        wordBank: ["in", "on", "under", "next to", "behind"],
        items: pool,
      };
    },
  },

  present_simple_3rd: {
    generate(count) {
      const pool = shuffle([
        { sentence: "Minnie ___ (play) with her friends every day.", answer: "plays", base: "play" },
        { sentence: "Mickey ___ (go) to the clubhouse by car.", answer: "goes", base: "go" },
        { sentence: "Daisy ___ (watch) TV after school.", answer: "watches", base: "watch" },
        { sentence: "Goofy ___ (have) a big hat.", answer: "has", base: "have" },
        { sentence: "Minnie ___ (like) pink bows.", answer: "likes", base: "like" },
        { sentence: "Donald ___ (do) his homework every evening.", answer: "does", base: "do" },
        { sentence: "Daisy ___ (read) books in her free time.", answer: "reads", base: "read" },
        { sentence: "Mickey ___ (eat) breakfast at 7 o'clock.", answer: "eats", base: "eat" },
        { sentence: "Minnie ___ (live) in a pretty house.", answer: "lives", base: "live" },
        { sentence: "Donald ___ (teach) his friends to swim.", answer: "teaches", base: "teach" },
        { sentence: "Daisy ___ (study) every afternoon.", answer: "studies", base: "study" },
        { sentence: "Goofy ___ (swim) on Saturdays.", answer: "swims", base: "swim" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: "Stavi glagol u odgovarajući oblik (3. lice jednine). ⭐ Mickey i prijatelji uče Present Simple!",
        wordBank: pool.map(p => p.base),
        items: pool.map(p => ({ sentence: p.sentence, answer: p.answer })),
      };
    },
  },

  // ── Grade 4 ──────────────────────────────────────────────────────────────

  comparatives: {
    generate(count) {
      const all = shuffle([
        { en: "big", sr: "bigger" },
        { en: "small", sr: "smaller" },
        { en: "tall", sr: "taller" },
        { en: "fast", sr: "faster" },
        { en: "old", sr: "older" },
        { en: "long", sr: "longer" },
        { en: "hot", sr: "hotter" },
        { en: "cold", sr: "colder" },
        { en: "good", sr: "better" },
        { en: "bad", sr: "worse" },
        { en: "expensive", sr: "more expensive" },
        { en: "difficult", sr: "more difficult" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "match",
        instruction: "Povezi pridev sa komparativom (stepenom poređenja).",
        pairs: all,
        leftLabel: "Pridev",
        rightLabel: "Komparativ",
      };
    },
  },

  have_has: {
    generate(count) {
      const pool = shuffle([
        { sentence: "I ___ a dog.", answer: "have", hint: "(I)" },
        { sentence: "She ___ a cat.", answer: "has", hint: "(She)" },
        { sentence: "He ___ a new bike.", answer: "has", hint: "(He)" },
        { sentence: "We ___ two brothers.", answer: "have", hint: "(We)" },
        { sentence: "They ___ a big garden.", answer: "have", hint: "(They)" },
        { sentence: "It ___ long ears.", answer: "has", hint: "(It)" },
        { sentence: "You ___ a great idea.", answer: "have", hint: "(You)" },
        { sentence: "My mother ___ brown eyes.", answer: "has", hint: "(My mother)" },
        { sentence: "The children ___ a lot of toys.", answer: "have", hint: "(The children)" },
        { sentence: "The cat ___ a long tail.", answer: "has", hint: "(The cat)" },
        { sentence: "I ___ breakfast at 7 o'clock.", answer: "have", hint: "(I)" },
        { sentence: "She ___ a lesson today.", answer: "has", hint: "(She)" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: 'Popuni rečenicu sa "have" ili "has".',
        wordBank: ["have", "has"],
        items: pool,
      };
    },
  },

  plurals: {
    generate(count) {
      const all = shuffle([
        { en: "cat", sr: "cats" },
        { en: "dog", sr: "dogs" },
        { en: "box", sr: "boxes" },
        { en: "bus", sr: "buses" },
        { en: "city", sr: "cities" },
        { en: "baby", sr: "babies" },
        { en: "child", sr: "children" },
        { en: "man", sr: "men" },
        { en: "woman", sr: "women" },
        { en: "tooth", sr: "teeth" },
        { en: "foot", sr: "feet" },
        { en: "mouse", sr: "mice" },
        { en: "class", sr: "classes" },
        { en: "dish", sr: "dishes" },
        { en: "story", sr: "stories" },
      ]).slice(0, Math.min(count, 15));
      return {
        type: "match",
        instruction: "Povezi imenicu u jednini sa oblikom množine.",
        pairs: all,
        leftLabel: "Jednina (singular)",
        rightLabel: "Množina (plural)",
      };
    },
  },

  do_does: {
    generate(count) {
      const pool = shuffle([
        { sentence: "___ you like pizza?", answer: "Do", hint: "(you)" },
        { sentence: "___ she play football?", answer: "Does", hint: "(she)" },
        { sentence: "___ they live in London?", answer: "Do", hint: "(they)" },
        { sentence: "___ he have a dog?", answer: "Does", hint: "(he)" },
        { sentence: "___ we need an umbrella?", answer: "Do", hint: "(we)" },
        { sentence: "___ it eat meat?", answer: "Does", hint: "(it)" },
        { sentence: "___ your parents work here?", answer: "Do", hint: "(your parents)" },
        { sentence: "___ she speak English?", answer: "Does", hint: "(she)" },
        { sentence: "___ you go to school by bus?", answer: "Do", hint: "(you)" },
        { sentence: "___ the teacher give homework?", answer: "Does", hint: "(the teacher)" },
        { sentence: "___ he like reading?", answer: "Does", hint: "(he)" },
        { sentence: "___ they play basketball?", answer: "Do", hint: "(they)" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: 'Napiši "Do" ili "Does" na početku pitanja u sadašnjem vremenu.',
        wordBank: ["Do", "Does"],
        items: pool,
      };
    },
  },

  // ── Grade 5 ──────────────────────────────────────────────────────────────

  past_simple_regular: {
    generate(count) {
      const pool = shuffle([
        { base: "walk", past: "walked", sentence: "She ___ to school yesterday.", answer: "walked" },
        { base: "play", past: "played", sentence: "They ___ football last Sunday.", answer: "played" },
        { base: "watch", past: "watched", sentence: "We ___ a movie last night.", answer: "watched" },
        { base: "talk", past: "talked", sentence: "He ___ to his teacher.", answer: "talked" },
        { base: "cook", past: "cooked", sentence: "My mother ___ dinner.", answer: "cooked" },
        { base: "clean", past: "cleaned", sentence: "I ___ my room.", answer: "cleaned" },
        { base: "visit", past: "visited", sentence: "We ___ our grandparents.", answer: "visited" },
        { base: "listen", past: "listened", sentence: "She ___ to music.", answer: "listened" },
        { base: "open", past: "opened", sentence: "He ___ the window.", answer: "opened" },
        { base: "close", past: "closed", sentence: "She ___ the door.", answer: "closed" },
        { base: "finish", past: "finished", sentence: "They ___ the game.", answer: "finished" },
        { base: "help", past: "helped", sentence: "I ___ my friend.", answer: "helped" },
        { base: "jump", past: "jumped", sentence: "The dog ___ over the fence.", answer: "jumped" },
        { base: "call", past: "called", sentence: "She ___ her mother.", answer: "called" },
        { base: "ask", past: "asked", sentence: "He ___ a question.", answer: "asked" },
      ]).slice(0, Math.min(count, 15));
      return {
        type: "fillin",
        instruction: "Stavi glagol u Past Simple (pravilni glagoli dodaju -ed).",
        wordBank: pool.map(p => p.base),
        items: pool.map(p => ({ sentence: p.sentence, answer: p.answer, hint: `(${p.base})` })),
      };
    },
  },

  past_simple_irregular: {
    generate(count) {
      const all = [
        { base: "go", past: "went" }, { base: "come", past: "came" },
        { base: "see", past: "saw" }, { base: "eat", past: "ate" },
        { base: "drink", past: "drank" }, { base: "buy", past: "bought" },
        { base: "take", past: "took" }, { base: "give", past: "gave" },
        { base: "make", past: "made" }, { base: "have", past: "had" },
        { base: "do", past: "did" }, { base: "say", past: "said" },
        { base: "get", past: "got" }, { base: "run", past: "ran" },
        { base: "write", past: "wrote" }, { base: "read", past: "read" },
        { base: "swim", past: "swam" }, { base: "sing", past: "sang" },
        { base: "sleep", past: "slept" }, { base: "wake", past: "woke" },
      ];
      const selected = shuffle(all).slice(0, Math.min(count, 20));
      return {
        type: "match",
        instruction: "Povezi glagol u infinitivu sa oblikom Past Simple.",
        pairs: selected.map(v => ({ en: v.base, sr: v.past })),
        leftLabel: "Infinitive",
        rightLabel: "Past Simple",
      };
    },
  },

  past_simple_negative: {
    generate(count) {
      const pool = shuffle([
        { sentence: "She ___ (not/go) to school yesterday.", answer: "didn't go" },
        { sentence: "They ___ (not/watch) TV last night.", answer: "didn't watch" },
        { sentence: "He ___ (not/eat) breakfast.", answer: "didn't eat" },
        { sentence: "I ___ (not/finish) my homework.", answer: "didn't finish" },
        { sentence: "We ___ (not/play) football.", answer: "didn't play" },
        { sentence: "She ___ (not/call) me.", answer: "didn't call" },
        { sentence: "They ___ (not/come) to the party.", answer: "didn't come" },
        { sentence: "He ___ (not/buy) a new book.", answer: "didn't buy" },
        { sentence: "I ___ (not/sleep) well.", answer: "didn't sleep" },
        { sentence: "We ___ (not/see) the movie.", answer: "didn't see" },
        { sentence: "She ___ (not/make) a cake.", answer: "didn't make" },
        { sentence: "He ___ (not/run) in the park.", answer: "didn't run" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: "Napiši negaciju u Past Simple koristeći didn't + glagol.",
        wordBank: ["didn't"],
        items: pool,
      };
    },
  },

  // ── Grade 6 ──────────────────────────────────────────────────────────────

  past_simple_questions: {
    generate(count) {
      const pool = shuffle([
        { sentence: "___ she go to school yesterday?", answer: "Did", hint: "(she / go)" },
        { sentence: "___ they play football?", answer: "Did", hint: "(they / play)" },
        { sentence: "___ he eat breakfast?", answer: "Did", hint: "(he / eat)" },
        { sentence: "___ you finish your homework?", answer: "Did", hint: "(you / finish)" },
        { sentence: "___ we see that movie?", answer: "Did", hint: "(we / see)" },
        { sentence: "___ she call you?", answer: "Did", hint: "(she / call)" },
        { sentence: "___ they come to the party?", answer: "Did", hint: "(they / come)" },
        { sentence: "___ he buy a new phone?", answer: "Did", hint: "(he / buy)" },
        { sentence: "___ it rain yesterday?", answer: "Did", hint: "(it / rain)" },
        { sentence: "___ you walk to school?", answer: "Did", hint: "(you / walk)" },
      ]).slice(0, Math.min(count, 10));
      return {
        type: "fillin",
        instruction: "Napiši pitanje u Past Simple — stavi 'Did' na početak rečenice.",
        wordBank: ["Did"],
        items: pool,
      };
    },
  },

  past_simple_mixed: {
    generate(count) {
      const sentences = shuffle([
        { sentence: "Yesterday I ___ (go) to the park.", answer: "went", hint: "(nepravilan)" },
        { sentence: "She ___ (cook) dinner last night.", answer: "cooked", hint: "(pravilan)" },
        { sentence: "They ___ (not/watch) TV.", answer: "didn't watch", hint: "(negacija)" },
        { sentence: "___ he (play) football?", answer: "Did he play", hint: "(pitanje)" },
        { sentence: "We ___ (see) a great film.", answer: "saw", hint: "(nepravilan)" },
        { sentence: "I ___ (clean) my room.", answer: "cleaned", hint: "(pravilan)" },
        { sentence: "She ___ (not/come) to school.", answer: "didn't come", hint: "(negacija)" },
        { sentence: "___ they (eat) lunch?", answer: "Did they eat", hint: "(pitanje)" },
        { sentence: "He ___ (run) very fast.", answer: "ran", hint: "(nepravilan)" },
        { sentence: "We ___ (visit) our friends.", answer: "visited", hint: "(pravilan)" },
        { sentence: "I ___ (not/finish) the test.", answer: "didn't finish", hint: "(negacija)" },
        { sentence: "___ she (buy) a new bag?", answer: "Did she buy", hint: "(pitanje)" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: "Stavi glagol u odgovarajući oblik Past Simple (potvrdno, negativno ili pitanje).",
        wordBank: [],
        items: sentences,
      };
    },
  },

  alphabet: {
    generate(count) {
      const letterEmojis = {
        A:"🍎", B:"🐝", C:"🐱", D:"🐶", E:"🐘", F:"🐸",
        G:"🦒", H:"🏠", I:"🍦", J:"🃏", K:"🦘", L:"🦁",
        M:"🐭", N:"👃", O:"🍊", P:"🐧", Q:"👸", R:"🌈",
        S:"⭐", T:"🐯", U:"☂️", V:"🌋", W:"🐋", X:"❌",
        Y:"🪀", Z:"🦓",
      };
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
      const selected = shuffle(letters).slice(0, Math.min(count, 16));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže slovo na engleskom. Zaokruži odgovarajuće slovo! 🔤",
        teacherNote: "Izgovorite naziv slova na engleskom 2–3 puta (npr. 'EY' za A). Deca zaokružuju slovo.",
        items: selected.map(l => ({ word: l, emoji: letterEmojis[l], sr: "" })),
      };
    },
  },
};

// ─── RENDER HELPERS ───────────────────────────────────────────────────────────

function ListenCircleTask({ data }) {
  return (
    <div>
      <div className="section-title">Slušaj i zaokruži 👂</div>
      <p style={{ fontSize: 13, color: "#9b7060", marginBottom: 8 }}>{data.instruction}</p>
      {data.teacherNote && <div className="teacher-note">📋 Teacher's note: {data.teacherNote}</div>}
      <div className="listen-grid">
        {data.items.map((item, i) => (
          <div className="listen-card" key={i}>
            <div className="listen-card-emoji">{item.emoji}</div>
            <div className="listen-card-word">{item.word}</div>
            {item.sr && <div className="listen-card-sr">{item.sr}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorBoxTask({ data }) {
  return (
    <div>
      <div className="section-title">Oboj 🖍️</div>
      <p style={{ fontSize: 13, color: "#9b7060", marginBottom: 8 }}>{data.instruction}</p>
      {data.teacherNote && <div className="teacher-note">📋 Teacher's note: {data.teacherNote}</div>}
      <div className="color-grid">
        {data.items.map((item, i) => (
          <div className="color-box" key={i}>
            <div className="color-box-square" />
            <div className="color-box-word">{item.word}</div>
            <div className="color-box-sr">{item.sr}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchTask({ data, showAnswers }) {
  const [shuffledRight] = useState(() => shuffle(data.pairs.map(p => p.sr)));
  return (
    <div>
      <div className="section-title">Poveži</div>
      <p style={{ fontSize: 13, color: "#9b7060", marginBottom: 16 }}>{data.instruction}</p>
      <div className="match-grid">
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#c4a498", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{data.leftLabel}</div>
          {data.pairs.map((p, i) => (
            <div className="match-row" key={i}>
              <span className="match-num">{i + 1}.</span>
              <span className="match-word">{p.en}</span>
              {showAnswers
                ? <span className="match-answer">{p.sr}</span>
                : <span className="match-line" />}
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#c4a498", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{data.rightLabel}</div>
          {shuffledRight.map((w, i) => (
            <div className="match-row" key={i} style={{ justifyContent: "flex-start" }}>
              <span className="match-num">{String.fromCharCode(65 + i)}.</span>
              <span className="match-word">{w}</span>
            </div>
          ))}
        </div>
      </div>
      {showAnswers && (
        <div className="answer-key" style={{ marginTop: 20 }}>
          <div className="answer-key-title">Answer Key</div>
          <div className="answer-key-grid">
            {data.pairs.map((p, i) => (
              <span key={i} className="answer-key-item">{i + 1}. {p.en} = {p.sr}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FillInTask({ data, showAnswers }) {
  return (
    <div>
      <div className="section-title">Popuni</div>
      <p style={{ fontSize: 13, color: "#9b7060", marginBottom: 14 }}>{data.instruction}</p>
      {data.wordBank.length > 0 && (
        <div className="word-bank">
          <div className="word-bank-label">Word bank</div>
          {data.wordBank.map((w, i) => <span key={i} className="word-chip">{w}</span>)}
        </div>
      )}
      <div className="fill-list">
        {data.items.map((item, i) => {
          const parts = item.sentence.split("___");
          return (
            <div className="fill-item" key={i}>
              <span className="fill-num">{i + 1}.</span>
              <span className="fill-sentence">
                {parts[0]}
                {showAnswers
                  ? <span className="fill-blank-answer">{item.answer}</span>
                  : <span className="fill-blank" />}
                {parts[1]}
                {item.hint && <span style={{ fontSize: 12, fontWeight: 400, color: "#c4a498", marginLeft: 6 }}>{item.hint}</span>}
              </span>
            </div>
          );
        })}
      </div>
      {showAnswers && (
        <div className="answer-key" style={{ marginTop: 20 }}>
          <div className="answer-key-title">Answer Key</div>
          <div className="answer-key-grid">
            {data.items.map((item, i) => (
              <span key={i} className="answer-key-item">{i + 1}. {item.answer}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrueFalseTask({ data, showAnswers }) {
  return (
    <div>
      <div className="section-title">True or False?</div>
      <p style={{ fontSize: 13, color: "#9b7060", marginBottom: 14 }}>{data.instruction}</p>
      <div className="tf-list">
        {data.items.map((item, i) => (
          <div className="tf-item" key={i}>
            <span className="tf-num">{i + 1}.</span>
            <span className="tf-sentence">{item.sentence}</span>
            <div className="tf-boxes">
              <div className={`tf-box ${showAnswers && item.answer === true ? "correct-t" : ""}`}>T</div>
              <div className={`tf-box ${showAnswers && item.answer === false ? "correct-f" : ""}`}>F</div>
            </div>
          </div>
        ))}
      </div>
      {showAnswers && (
        <div className="answer-key" style={{ marginTop: 20 }}>
          <div className="answer-key-title">Answer Key</div>
          <div className="answer-key-grid">
            {data.items.map((item, i) => (
              <span key={i} className="answer-key-item">{i + 1}. {item.answer ? "True" : "False"}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

const ROLE_META = {
  teacher:    { label: "Teacher",     icon: "👩‍🏫" },
  school:     { label: "School",      icon: "🏫"   },
  superadmin: { label: "Super Admin", icon: "🔑"   },
};

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(pw) {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Must contain at least one uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Must contain at least one lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Must contain at least one number.";
  if (!/[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/.test(pw)) return "Must contain at least one special character (!@#$…).";
  return null;
}

const normalizeProfile = (p) => ({
  ...p,
  firstName: p?.first_name || '',
  lastName:  p?.last_name  || '',
  middleName: p?.middle_name || '',
});

async function fetchProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data ? normalizeProfile(data) : null;
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm({ onLogin, onSwitchToSignup, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!validateEmail(email)) e.email = "Please enter a valid email address.";
    if (!password.trim()) e.password = "Please enter your password.";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitted(true);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setGlobalError("Incorrect email or password.");
      setLoading(false);
      return;
    }
    const profile = await fetchProfile(data.user.id);
    if (!profile) {
      setGlobalError("Profile not found. Contact your administrator.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    if (profile.status && profile.status !== 'active') {
      setGlobalError(
        profile.status === 'pending'
          ? "Your account is pending. Check your email to set your password."
          : "Your account has been deactivated. Contact your school administrator."
      );
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    setLoading(false);
    onLogin({ ...data.user, ...profile });
  };

  const err = (f) => submitted && errors[f] ? { borderColor: "#ff6b6b", boxShadow: "0 0 0 3px rgba(224,49,49,0.1)" } : {};

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {globalError && <div className="auth-alert">{globalError}</div>}
      <div className="auth-field">
        <label>Email address</label>
        <input className="text-input" type="email" placeholder="your@email.com" value={email}
          onChange={e => { setEmail(e.target.value); setGlobalError(""); }} style={err("email")} />
        {submitted && errors.email && <span className="auth-error">{errors.email}</span>}
      </div>
      <div className="auth-field">
        <label>Password</label>
        <input className="text-input" type="password" placeholder="Your password" value={password}
          onChange={e => { setPassword(e.target.value); setGlobalError(""); }} style={err("password")} />
        {submitted && errors.password && <span className="auth-error">{errors.password}</span>}
      </div>
      <button type="submit" className="gen-btn" style={{ marginTop: 6 }} disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p style={{ textAlign: "center", fontSize: 13, color: "#9b7060", margin: 0 }}>
        <button type="button" onClick={onForgotPassword}
          style={{ background: "none", border: "none", color: "#9b7060", cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" }}>
          Forgot password?
        </button>
      </p>
      <p style={{ textAlign: "center", fontSize: 14, color: "#9b7060", margin: 0 }}>
        Don't have an account?{" "}
        <button type="button" onClick={onSwitchToSignup}
          style={{ background: "none", border: "none", color: "#f76707", fontWeight: 700, cursor: "pointer", fontSize: 14, padding: 0 }}>
          Sign up
        </button>
      </p>
    </form>
  );
}

// ─── Signup Form ──────────────────────────────────────────────────────────────

function SignupForm({ onSignup, onSwitchToLogin }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", middleName: "",
    email: "", password: "", confirmPassword: "", role: "",
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [awaitConfirm, setAwaitConfirm] = useState(false);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim() || form.firstName.trim().length < 2)
      e.firstName = "First name must be at least 2 characters.";
    if (!form.lastName.trim() || form.lastName.trim().length < 2)
      e.lastName = "Last name must be at least 2 characters.";
    if (!validateEmail(form.email))
      e.email = "Please enter a valid email address.";
    const pwErr = validatePassword(form.password);
    if (pwErr) e.password = pwErr;
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    if (!form.role)
      e.role = "Please select a role.";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitted(true);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name:  form.firstName.trim(),
          last_name:   form.lastName.trim(),
          middle_name: form.middleName.trim(),
          role:        form.role,
        }
      }
    });
    if (error) {
      setGlobalError(
        error.message.toLowerCase().includes('already registered')
          ? "This email address is already registered."
          : error.message
      );
      setLoading(false);
      return;
    }
    if (!data.session) {
      setLoading(false);
      setAwaitConfirm(true);
      return;
    }
    // Wait for DB trigger to create the profile row
    let profile = null;
    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, 350));
      profile = await fetchProfile(data.user.id);
      if (profile) break;
    }
    setLoading(false);
    onSignup({ ...data.user, ...(profile || normalizeProfile({ first_name: form.firstName.trim(), last_name: form.lastName.trim(), middle_name: form.middleName.trim(), role: form.role })) });
  };

  const err = (f) => submitted && errors[f] ? { borderColor: "#ff6b6b", boxShadow: "0 0 0 3px rgba(224,49,49,0.1)" } : {};

  if (awaitConfirm) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 900, color: "#2d1b0e", marginBottom: 8 }}>
          Confirm your email address
        </div>
        <p style={{ fontSize: 14, color: "#9b7060", lineHeight: 1.6 }}>
          We've sent a link to <strong>{form.email}</strong>.<br />
          Click the link in the email to complete your registration.
        </p>
        <button className="mini-btn ghost" style={{ marginTop: 20 }} onClick={() => setAwaitConfirm(false)}>
          Back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {globalError && <div className="auth-alert">{globalError}</div>}
      <div className="input-row-2">
        <div className="auth-field">
          <label>First Name *</label>
          <input className="text-input" placeholder="e.g. Jane" value={form.firstName} onChange={set("firstName")} style={err("firstName")} />
          {submitted && errors.firstName && <span className="auth-error">{errors.firstName}</span>}
        </div>
        <div className="auth-field">
          <label>Last Name *</label>
          <input className="text-input" placeholder="e.g. Smith" value={form.lastName} onChange={set("lastName")} style={err("lastName")} />
          {submitted && errors.lastName && <span className="auth-error">{errors.lastName}</span>}
        </div>
      </div>
      <div className="auth-field">
        <label>Middle Name <span style={{ color: "#c4a498", fontWeight: 500 }}>(optional)</span></label>
        <input className="text-input" placeholder="Not required" value={form.middleName} onChange={set("middleName")} />
      </div>
      <div className="auth-field">
        <label>Email Address *</label>
        <input className="text-input" type="email" placeholder="your@email.com" value={form.email}
          onChange={e => { set("email")(e); setGlobalError(""); }} style={err("email")} />
        {submitted && errors.email && <span className="auth-error">{errors.email}</span>}
      </div>
      <div className="auth-field">
        <label>Password *</label>
        <input className="text-input" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={set("password")} style={err("password")} />
        {submitted && errors.password && <span className="auth-error">{errors.password}</span>}
        <span className="auth-hint">Must include: uppercase, lowercase, number, special character (!@#$…)</span>
      </div>
      <div className="auth-field">
        <label>Confirm Password *</label>
        <input className="text-input" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set("confirmPassword")} style={err("confirmPassword")} />
        {submitted && errors.confirmPassword && <span className="auth-error">{errors.confirmPassword}</span>}
      </div>
      <div className="auth-field">
        <label>Role *</label>
        <div className="role-cards">
          {[
            { value: "teacher", icon: "👩‍🏫", label: "Teacher", desc: "Individual teacher" },
            { value: "school",  icon: "🏫",   label: "School",  desc: "Educational institution" },
          ].map(r => (
            <button key={r.value} type="button"
              className={`role-card ${form.role === r.value ? "active" : ""}`}
              onClick={() => setForm(prev => ({ ...prev, role: r.value }))}>
              <span className="role-icon">{r.icon}</span>
              <span className="role-label">{r.label}</span>
              <span className="role-desc">{r.desc}</span>
            </button>
          ))}
        </div>
        {submitted && errors.role && <span className="auth-error">{errors.role}</span>}
      </div>
      <button type="submit" className="gen-btn" style={{ marginTop: 4 }} disabled={loading}>
        {loading ? "Registering…" : "Sign up"}
      </button>
      <p style={{ textAlign: "center", fontSize: 14, color: "#9b7060", margin: 0 }}>
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin}
          style={{ background: "none", border: "none", color: "#f76707", fontWeight: 700, cursor: "pointer", fontSize: 14, padding: 0 }}>
          Sign in
        </button>
      </p>
    </form>
  );
}

// ─── Forgot Password Form ─────────────────────────────────────────────────────

function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateEmail(email)) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 900, color: "#2d1b0e", marginBottom: 8 }}>
          Check your email
        </div>
        <p style={{ fontSize: 14, color: "#9b7060", lineHeight: 1.6 }}>
          We've sent a reset link to <strong>{email}</strong>.
        </p>
        <button className="mini-btn ghost" style={{ marginTop: 20 }} onClick={onBack}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && <div className="auth-alert">{error}</div>}
      <div className="auth-field">
        <label>Email address</label>
        <input className="text-input" type="email" placeholder="your@email.com" value={email}
          onChange={e => { setEmail(e.target.value); setError(""); }} />
      </div>
      <button type="submit" className="gen-btn" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </button>
      <p style={{ textAlign: "center", fontSize: 14, color: "#9b7060", margin: 0 }}>
        <button type="button" onClick={onBack}
          style={{ background: "none", border: "none", color: "#f76707", fontWeight: 700, cursor: "pointer", fontSize: 14, padding: 0 }}>
          Back to sign in
        </button>
      </p>
    </form>
  );
}

// ─── Reset Password Form ──────────────────────────────────────────────────────

function ResetPasswordForm({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    // Activate the account if this was an invited teacher accepting their invite.
    try { await supabase.rpc('activate_my_account'); } catch (_) { /* no-op for normal recovery */ }
    setSuccess(true);
    setTimeout(onDone, 2000);
  };

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 900, color: "#2d1b0e" }}>
          Password updated!
        </div>
        <p style={{ fontSize: 14, color: "#9b7060", marginTop: 8 }}>Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && <div className="auth-alert">{error}</div>}
      <div className="auth-field">
        <label>New Password</label>
        <input className="text-input" type="password" placeholder="Minimum 8 characters"
          value={password} onChange={e => { setPassword(e.target.value); setError(""); }} />
        <span className="auth-hint">Must include: uppercase, lowercase, number, special character (!@#$…)</span>
      </div>
      <div className="auth-field">
        <label>Confirm New Password</label>
        <input className="text-input" type="password" placeholder="Repeat password"
          value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(""); }} />
      </div>
      <button type="submit" className="gen-btn" disabled={loading}>
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────

function AuthScreen({ onLogin }) {
  const [view, setView] = useState("login");
  const subtitle = view === "login" ? "Welcome! Sign in to continue."
    : view === "signup" ? "Create a new account"
    : "Reset your password";
  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <Logo variant="icon" size={62} className="auth-logo" />
        <div className="auth-title">ESLtopia</div>
        <div className="auth-subtitle">{subtitle}</div>
        {view === "login" && <LoginForm onLogin={onLogin} onSwitchToSignup={() => setView("signup")} onForgotPassword={() => setView("forgot")} />}
        {view === "signup" && <SignupForm onSignup={onLogin} onSwitchToLogin={() => setView("login")} />}
        {view === "forgot" && <ForgotPasswordForm onBack={() => setView("login")} />}
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

function AdminPanel({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at')
      .then(({ data }) => {
        if (data) setUsers(data.map(normalizeProfile));
        setAdminLoading(false);
      });
  }, []);

  const changeRole = async (userId, newRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const deleteUser = async (userId) => {
    if (userId === currentUser.id) return;
    if (!window.confirm("Delete this user? Their data will be retained for reporting.")) return;
    const deletedAt = new Date().toISOString();
    const { error } = await supabase.from('profiles').update({ deleted_at: deletedAt }).eq('id', userId);
    if (!error) setUsers(prev => prev.map(u => u.id === userId ? { ...u, deleted_at: deletedAt } : u));
  };

  const restoreUser = async (userId) => {
    const { error } = await supabase.from('profiles').update({ deleted_at: null }).eq('id', userId);
    if (!error) setUsers(prev => prev.map(u => u.id === userId ? { ...u, deleted_at: null } : u));
  };

  if (adminLoading) {
    return (
      <div className="classes-panel">
        <div className="config-title">Admin panel</div>
        <div className="empty-state"><div className="empty-state-text">Loading users…</div></div>
      </div>
    );
  }

  const totalRegistered = users.length;
  const activeCount  = users.filter(u => !u.deleted_at && u.status === 'active').length;
  const pendingCount = users.filter(u => !u.deleted_at && u.status === 'pending').length;
  const inactiveCount = users.filter(u => !u.deleted_at && u.status === 'inactive').length;
  const deletedCount = users.filter(u => u.deleted_at).length;

  const dailyMap = {};
  users.forEach(u => {
    const day = u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : 'Unknown';
    dailyMap[day] = (dailyMap[day] || 0) + 1;
  });
  const dailyRows = Object.entries(dailyMap).sort((a, b) => {
    const parse = s => { const [d, m, y] = s.split('/'); return new Date(`${y}-${m}-${d}`); };
    return parse(b[0]) - parse(a[0]);
  });

  return (
    <div className="classes-panel">
      <div className="config-title">Admin panel — Overview</div>

      {/* ── Summary stats ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        {[
          { label: "Total registered", value: totalRegistered, color: "#2d1b0e" },
          { label: "Active",           value: activeCount,     color: "#2b8a3e" },
          { label: "Pending",          value: pendingCount,    color: "#e67700" },
          { label: "Inactive",         value: inactiveCount,   color: "#9b7060" },
          { label: "Deleted",          value: deletedCount,    color: "#c92a2a" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "#fff8f5", border: "1px solid #f0ddd5", borderRadius: 10,
            padding: "10px 18px", minWidth: 100, textAlign: "center",
          }}>
            <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "'Nunito', sans-serif" }}>{value}</div>
            <div style={{ fontSize: 11, color: "#9b7060", fontWeight: 700, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Daily registrations ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#2d1b0e", marginBottom: 8, fontFamily: "'Nunito', sans-serif" }}>
          Daily registrations
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {dailyRows.map(([date, count]) => (
              <tr key={date}>
                <td style={{ fontSize: 13, color: "#9b7060" }}>{date}</td>
                <td style={{ fontSize: 13, fontWeight: 800, color: "#2d1b0e" }}>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── User management ── */}
      <div style={{ fontSize: 13, fontWeight: 800, color: "#2d1b0e", marginBottom: 8, fontFamily: "'Nunito', sans-serif" }}>
        User management
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Registered</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const isDeleted = !!u.deleted_at;
            return (
              <tr key={u.id} style={{ opacity: isDeleted ? 0.5 : 1 }}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: isDeleted
                        ? "#e9ecef"
                        : "linear-gradient(135deg, #f76707 0%, #e64980 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isDeleted ? "#adb5bd" : "#fff",
                      fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 900, flexShrink: 0,
                    }}>
                      {(u.firstName?.[0] || "") + (u.lastName?.[0] || "")}
                    </div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14, color: isDeleted ? "#adb5bd" : "#2d1b0e" }}>
                      {u.firstName} {u.middleName ? u.middleName + " " : ""}{u.lastName}
                      {u.id === currentUser.id && (
                        <span style={{ marginLeft: 6, fontSize: 10, background: "#ebfbee", color: "#2b8a3e", fontWeight: 700, borderRadius: 5, padding: "1px 7px" }}>You</span>
                      )}
                      {isDeleted && (
                        <span style={{ marginLeft: 6, fontSize: 10, background: "#fff0f0", color: "#c92a2a", fontWeight: 700, borderRadius: 5, padding: "1px 7px" }}>Deleted</span>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 13, color: "#9b7060" }}>{u.email}</td>
                <td>
                  <select
                    className="grade-select"
                    style={{ width: 120, fontSize: 12, textAlign: "left" }}
                    value={u.role}
                    onChange={e => changeRole(u.id, e.target.value)}
                    disabled={isDeleted || (u.id === currentUser.id && u.role === 'superadmin')}
                  >
                    <option value="teacher">Teacher</option>
                    <option value="school">School</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </td>
                <td style={{ fontSize: 12, color: "#9b7060" }}>{isDeleted ? "—" : (u.status || "active")}</td>
                <td style={{ fontSize: 12, color: "#c4a498" }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB") : "—"}
                </td>
                <td>
                  {u.id !== currentUser.id && (
                    isDeleted
                      ? <button className="delete-class-btn" style={{ color: "#2b8a3e" }} onClick={() => restoreUser(u.id)}>Restore</button>
                      : <button className="delete-class-btn" style={{ color: "#ff6b6b" }} onClick={() => deleteUser(u.id)}>Delete</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Employees Panel (School) ──────────────────────────────────────────────────

function EmployeesPanel({ currentUser }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName: "", lastName: "", middleName: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', currentUser.id)
      .order('created_at');
    setTeachers((data || []).map(normalizeProfile));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  const addTeacher = async (ev) => {
    ev.preventDefault();
    setError(""); setNotice("");
    if (!form.firstName.trim() || !form.lastName.trim() || !validateEmail(form.email)) {
      setError("First name, last name and a valid email are required.");
      return;
    }
    setBusy(true);
    const { data, error: fnErr } = await supabase.functions.invoke('create-teacher', {
      body: {
        email: form.email.trim().toLowerCase(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim(),
      },
    });
    setBusy(false);
    if (fnErr || data?.error) {
      setError(data?.error || fnErr?.message || "Could not add teacher.");
      return;
    }
    setNotice(`Invitation sent to ${form.email.trim().toLowerCase()}.`);
    setForm({ firstName: "", lastName: "", middleName: "", email: "" });
    load();
  };

  const manage = async (teacherId, action) => {
    if (action === 'remove' && !window.confirm("Remove this teacher? This permanently deletes their account.")) return;
    setError(""); setNotice("");
    const { data, error: fnErr } = await supabase.functions.invoke('manage-teacher', {
      body: { teacherId, action },
    });
    if (fnErr || data?.error) {
      setError(data?.error || fnErr?.message || "Action failed.");
      return;
    }
    load();
  };

  const statusBadge = (status) => {
    const map = {
      pending:  { bg: "#fff9db", color: "#b08900", label: "Pending" },
      active:   { bg: "#ebfbee", color: "#2b8a3e", label: "Active" },
      inactive: { bg: "#fff0f0", color: "#e03131", label: "Inactive" },
    };
    const s = map[status] || map.active;
    return <span style={{ fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, borderRadius: 6, padding: "2px 8px" }}>{s.label}</span>;
  };

  return (
    <div className="classes-panel">
      <div className="config-title">Employees — Teacher management</div>
      <p style={{ fontSize: 13, color: "#9b7060", marginBottom: 16 }}>
        Add teachers employed at your school. They receive an email to set their password; until then they show as <strong>Pending</strong>.
      </p>

      <form onSubmit={addTeacher} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", marginBottom: 20 }}>
        <div className="auth-field" style={{ flex: "1 1 130px" }}>
          <label>First name *</label>
          <input className="text-input" placeholder="e.g. Jane" value={form.firstName} onChange={set("firstName")} />
        </div>
        <div className="auth-field" style={{ flex: "1 1 130px" }}>
          <label>Last name *</label>
          <input className="text-input" placeholder="e.g. Smith" value={form.lastName} onChange={set("lastName")} />
        </div>
        <div className="auth-field" style={{ flex: "1 1 180px" }}>
          <label>Email *</label>
          <input className="text-input" type="email" placeholder="teacher@email.com" value={form.email} onChange={set("email")} />
        </div>
        <button type="submit" className="gen-btn" style={{ flex: "0 0 auto" }} disabled={busy}>
          {busy ? "Adding…" : "Add teacher"}
        </button>
      </form>

      {error && <div className="auth-alert" style={{ marginBottom: 14 }}>{error}</div>}
      {notice && <div style={{ marginBottom: 14, background: "#ebfbee", color: "#2b8a3e", borderRadius: 8, padding: "10px 14px", fontSize: 14 }}>{notice}</div>}

      {loading ? (
        <div className="empty-state"><div className="empty-state-text">Loading teachers…</div></div>
      ) : teachers.length === 0 ? (
        <div className="empty-state"><div className="empty-state-text">No teachers yet. Add your first one above.</div></div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Teacher</th><th>Email</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.id}>
                <td style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14, color: "#2d1b0e" }}>
                  {t.firstName} {t.middleName ? t.middleName + " " : ""}{t.lastName}
                </td>
                <td style={{ fontSize: 13, color: "#9b7060" }}>{t.email}</td>
                <td>{statusBadge(t.status)}</td>
                <td>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    {t.status === 'inactive' ? (
                      <button className="mini-btn ghost" onClick={() => manage(t.id, 'reactivate')}>Reactivate</button>
                    ) : (
                      <button className="mini-btn ghost" onClick={() => manage(t.id, 'deactivate')}>Deactivate</button>
                    )}
                    <button className="delete-class-btn" style={{ color: "#ff6b6b" }} onClick={() => manage(t.id, 'remove')}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

function LandingPage({ onStart }) {
  return (
    <div className="landing">
      <div className="landing-hero">
        <Logo variant="icon" size={88} className="landing-logo" />
        <div className="landing-tagline">For English teachers · Grades 1–6</div>
        <h1 className="landing-title">
          English worksheets<br />
          <span className="landing-title-accent">in seconds</span>
        </h1>
        <p className="landing-subtitle">
          Choose a grade and topic, set the number of exercises, and your worksheet is ready to print. No design required, no time wasted.
        </p>
        <button className="landing-cta" onClick={onStart}>
          Get started <span style={{fontSize:20}}>→</span>
        </button>
        <div className="landing-stats">
          <div className="landing-stat">
            <div className="landing-stat-num">25+</div>
            <div className="landing-stat-label">Topics</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-num">6</div>
            <div className="landing-stat-label">Grades</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-num">3</div>
            <div className="landing-stat-label">Task types</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-num">∞</div>
            <div className="landing-stat-label">Combinations</div>
          </div>
        </div>
      </div>

      <div className="landing-features">
        <div className="feature-card">
          <span className="feature-icon">📝</span>
          <div className="feature-title">Worksheet Generator</div>
          <p className="feature-desc">Pick a topic, number of exercises, and type — tasks are generated automatically, always different.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">👥</span>
          <div className="feature-title">Class Management</div>
          <p className="feature-desc">Add classes and students. Generate personalised worksheets for each group.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">📋</span>
          <div className="feature-title">Records &amp; Grades</div>
          <p className="feature-desc">Track attendance, grades, and payments for every student — all in one place.</p>
        </div>
      </div>

      <div className="landing-grades-card">
        <div className="landing-section-label">Grade coverage</div>
        <div className="grade-pills">
          <div className="grade-pill hot">Grade 1 ⭐</div>
          <div className="grade-pill hot">Grade 2 ⭐</div>
          <div className="grade-pill hot">Grade 3 ⭐</div>
          <div className="grade-pill">Grade 4</div>
          <div className="grade-pill">Grade 5</div>
          <div className="grade-pill">Grade 6</div>
        </div>
        <p className="disney-note">
          <strong>⭐ Grades 1–3:</strong> exercises aligned with the <strong>Disney Stars &amp; Heroes</strong> textbook (Klett) — Mickey, Minnie, Donald, Goofy and friends.
        </p>
      </div>
    </div>
  );
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TRIMESTERS = [
  { key: "t1", name: "Term 1", short: "T1", period: "September – November", months: [9, 10, 11] },
  { key: "t2", name: "Term 2", short: "T2", period: "December – February",  months: [12, 1, 2] },
  { key: "t3", name: "Term 3", short: "T3", period: "March – May",          months: [3, 4, 5] },
  { key: "t4", name: "Term 4", short: "T4", period: "June – August",        months: [6, 7, 8] },
];

const dateMonth = (dateStr) => parseInt(dateStr.split("-")[1], 10);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function EnglishGenerator() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  useEffect(() => {
    // An invited teacher lands on /?setup=1 — show the "set a new password" screen.
    if (new URLSearchParams(window.location.search).get('setup') === '1') {
      setPasswordReset(true);
    }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const profile = await fetchProfile(session.user.id);
        if (profile && profile.status !== 'pending' && profile.status !== 'inactive') {
          setCurrentUser({ ...session.user, ...profile });
        } else if (profile) {
          // Lingering session for a pending/deactivated account — sign it out.
          await supabase.auth.signOut();
        }
      }
      setAuthLoaded(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      } else if (event === 'PASSWORD_RECOVERY') {
        setPasswordReset(true);
      } else if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        if (!passwordReset) {
          const profile = await fetchProfile(session.user.id);
          // Don't surface pending/inactive accounts — let handleSubmit show the error
          // and call signOut. Without this guard, SIGNED_IN races with handleSubmit
          // and can unmount the login form before the error is ever visible.
          if (profile && profile.status !== 'pending' && profile.status !== 'inactive') {
            setCurrentUser({ ...session.user, ...profile });
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (user) => setCurrentUser(user);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setShowLanding(true);
    setView("generator");
  };

  const [showLanding, setShowLanding] = useState(true);
  const [view, setView] = useState("generator");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [grade, setGrade] = useState("all");
  const [count, setCount] = useState(10);
  const [tasks, setTasks] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [taskType, setTaskType] = useState("match");
  const [pdfModal, setPdfModal] = useState(false);
  const [generateKey, setGenerateKey] = useState(0);

  const [classes, setClasses] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newStudentInputs, setNewStudentInputs] = useState({});

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const [records, setRecords] = useState({});
  const [recordsClassId, setRecordsClassId] = useState("");
  const todayISO = new Date().toISOString().slice(0, 10);
  const thisMonth = todayISO.slice(0, 7);
  const [attDate, setAttDate] = useState(todayISO);
  const [payMonth, setPayMonth] = useState(thisMonth);

  // Load classes + records from Supabase whenever the logged-in user changes
  useEffect(() => {
    if (!currentUser) return;
    setLoaded(false);
    (async () => {
      const { data: cls } = await supabase.from('classes').select('*').order('created_at');
      const loadedClasses = (cls || []).map(c => ({ ...c, students: c.students || [] }));
      setClasses(loadedClasses);

      const ids = loadedClasses.map(c => c.id);
      if (ids.length > 0) {
        const { data: recs } = await supabase.from('records').select('*').in('class_id', ids);
        if (recs) {
          const map = {};
          recs.forEach(r => { map[r.class_id] = r.data || {}; });
          setRecords(map);
        }
      }
      setLoaded(true);
    })();
  }, [currentUser?.id]);

  // Debounced Supabase sync for record mutations
  const syncTimers = useRef({});
  const ownerIdRef = useRef(null);
  const pdfPageRef = useRef(null);
  const pdfScrollRef = useRef(null);
  useEffect(() => { ownerIdRef.current = currentUser?.id; }, [currentUser?.id]);

  useEffect(() => {
    if (pdfModal) document.body.classList.add('pdf-modal-open');
    else document.body.classList.remove('pdf-modal-open');
    return () => document.body.classList.remove('pdf-modal-open');
  }, [pdfModal]);

  useEffect(() => {
    if (!pdfModal) return;
    const onKey = (e) => { if (e.key === 'Escape') setPdfModal(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pdfModal]);

  const syncRecord = useCallback((classId, data) => {
    clearTimeout(syncTimers.current[classId]);
    syncTimers.current[classId] = setTimeout(async () => {
      if (!ownerIdRef.current) return;
      await supabase.from('records').upsert(
        { class_id: classId, owner_id: ownerIdRef.current, data, updated_at: new Date().toISOString() },
        { onConflict: 'class_id' }
      );
    }, 800);
  }, []);

  const toggleAttendance = (classId, date, student) => {
    setRecords(prev => {
      const cls = prev[classId] || { attendance: {}, payment: {}, grades: {} };
      const day = { ...(cls.attendance?.[date] || {}) };
      day[student] = !day[student];
      const newCls = { ...cls, attendance: { ...cls.attendance, [date]: day } };
      syncRecord(classId, newCls);
      return { ...prev, [classId]: newCls };
    });
  };

  const markAllPresent = (classId, date, students) => {
    setRecords(prev => {
      const cls = prev[classId] || { attendance: {}, payment: {}, grades: {} };
      const day = { ...(cls.attendance?.[date] || {}) };
      students.forEach(s => { day[s] = true; });
      const newCls = { ...cls, attendance: { ...cls.attendance, [date]: day } };
      syncRecord(classId, newCls);
      return { ...prev, [classId]: newCls };
    });
  };

  const togglePayment = (classId, month, student) => {
    setRecords(prev => {
      const cls = prev[classId] || { attendance: {}, payment: {}, grades: {} };
      const mon = { ...(cls.payment?.[month] || {}) };
      mon[student] = !mon[student];
      const newCls = { ...cls, payment: { ...cls.payment, [month]: mon } };
      syncRecord(classId, newCls);
      return { ...prev, [classId]: newCls };
    });
  };

  const setGradeScore = (classId, date, student, score) => {
    setRecords(prev => {
      const cls = prev[classId] || { attendance: {}, payment: {}, grades: {} };
      const day = { ...(cls.grades?.[date] || {}) };
      if (score) day[student] = score;
      else delete day[student];
      const newCls = { ...cls, grades: { ...(cls.grades || {}), [date]: day } };
      syncRecord(classId, newCls);
      return { ...prev, [classId]: newCls };
    });
  };

  const countAttendance = (classId, student) => {
    const cls = records[classId];
    if (!cls || !cls.attendance) return 0;
    return Object.values(cls.attendance).filter(day => day[student]).length;
  };

  const updateNote = (classId, student, text) => {
    setRecords(prev => {
      const cls = prev[classId] || { attendance: {}, payment: {}, notes: {} };
      const newCls = { ...cls, notes: { ...(cls.notes || {}), [student]: text } };
      syncRecord(classId, newCls);
      return { ...prev, [classId]: newCls };
    });
  };

  const [profile, setProfile] = useState(null);
  const [openTrimesters, setOpenTrimesters] = useState({ t1: true, t2: false, t3: false, t4: false });

  const getStudentHistory = (classId, student) => {
    const cls = records[classId] || { attendance: {}, payment: {}, notes: {}, grades: {}, trimesterGrades: {} };
    const attendance = Object.entries(cls.attendance || {})
      .map(([date, day]) => ({ date, present: !!day[student] }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const payments = Object.entries(cls.payment || {})
      .filter(([, mon]) => mon[student])
      .map(([month]) => month)
      .sort((a, b) => b.localeCompare(a));
    const scores = Object.entries(cls.grades || {})
      .filter(([, day]) => day[student])
      .map(([date, day]) => ({ date, score: day[student] }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const note = (cls.notes || {})[student] || "";
    const presentCount = attendance.filter(a => a.present).length;
    const absentCount = attendance.filter(a => !a.present).length;
    const trimesterGrades = ((cls.trimesterGrades || {})[student]) || {};
    return { attendance, payments, scores, note, presentCount, absentCount, trimesterGrades };
  };

  const setTrimesterFinalGrade = (classId, student, trimester, gradeVal) => {
    setRecords(prev => {
      const cls = prev[classId] || { attendance: {}, payment: {}, grades: {}, trimesterGrades: {} };
      const tg = { ...(cls.trimesterGrades || {}) };
      const st = { ...(tg[student] || {}) };
      if (gradeVal) st[trimester] = gradeVal; else delete st[trimester];
      tg[student] = st;
      const newCls = { ...cls, trimesterGrades: tg };
      syncRecord(classId, newCls);
      return { ...prev, [classId]: newCls };
    });
  };

  const addClass = async () => {
    const name = newClassName.trim();
    if (!name) return;
    const id = "c_" + Date.now();
    const newClass = { id, name, owner_id: currentUser.id, students: [] };
    const { error } = await supabase.from('classes').insert(newClass);
    if (!error) setClasses(prev => [...prev, newClass]);
    setNewClassName("");
  };

  const deleteClass = async (id) => {
    await supabase.from('classes').delete().eq('id', id);
    setClasses(prev => prev.filter(c => c.id !== id));
    if (selectedClassId === id) { setSelectedClassId(""); setSelectedStudent(""); }
  };

  const addStudent = async (classId) => {
    const name = (newStudentInputs[classId] || "").trim();
    if (!name) return;
    const cls = classes.find(c => c.id === classId);
    if (!cls || cls.students.includes(name)) return;
    const newStudents = [...cls.students, name];
    await supabase.from('classes').update({ students: newStudents }).eq('id', classId);
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, students: newStudents } : c));
    setNewStudentInputs(prev => ({ ...prev, [classId]: "" }));
  };

  const removeStudent = async (classId, name) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    const newStudents = cls.students.filter(s => s !== name);
    await supabase.from('classes').update({ students: newStudents }).eq('id', classId);
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, students: newStudents } : c));
  };

  const filteredTopics = grade === "all"
    ? TOPICS
    : TOPICS.filter(t => t.grade === grade);

  const currentTopicData = selectedTopic ? TOPIC_DATA[selectedTopic] : null;
  const supportedTypes = currentTopicData?.supportedTypes;

  const selectTopic = (id) => {
    setSelectedTopic(id);
    const td = TOPIC_DATA[id];
    setTaskType(td?.supportedTypes?.[0] || "match");
  };

  const generate = () => {
    if (!selectedTopic) return;
    const effectiveType = supportedTypes?.includes(taskType) ? taskType : undefined;
    const result = generateTasks(selectedTopic, count, effectiveType);
    setTasks(result);
    setShowAnswers(false);
    setPdfModal(true);
    setGenerateKey(k => k + 1);
    setTimeout(() => { pdfScrollRef.current?.scrollTo({ top: 0 }); }, 0);
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    const el = pdfPageRef.current;
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) { alert('Pop-up blocked — please allow pop-ups for this site.'); return; }
    win.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>${topic?.emoji || ''} ${topic?.name || 'Worksheet'}</title>
<style>${styles}</style>
</head><body style="background:#fff;padding:32px 40px;">${el.innerHTML}</body></html>`);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const topic = TOPICS.find(t => t.id === selectedTopic);
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const studentName = selectedStudent;

  if (!authLoaded) return null;

  if (passwordReset) {
    return (
      <>
        <style>{styles}</style>
        <div className="auth-overlay">
          <div className="auth-card">
            <Logo variant="icon" size={62} className="auth-logo" />
            <div className="auth-title">ESLtopia</div>
            <div className="auth-subtitle">Set a new password</div>
            <ResetPasswordForm onDone={async () => {
              await supabase.auth.signOut();
              setPasswordReset(false);
              setCurrentUser(null);
              // Drop the ?setup=1 marker so a refresh returns to normal login.
              window.history.replaceState({}, '', window.location.pathname);
            }} />
          </div>
        </div>
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <style>{styles}</style>
        <AuthScreen onLogin={handleLogin} />
      </>
    );
  }

  if (showLanding) {
    return (
      <>
        <style>{styles}</style>
        <LandingPage onStart={() => setShowLanding(false)} />
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="header">
          <div className="logo-mark">
            <Logo size={52} />
          </div>
          <div className="header-text">
            <h1>ESLtopia</h1>
            <p>Worksheet Generator · <strong style={{color:"#f76707"}}>Grades 1–3: Disney Stars &amp; Heroes</strong> · Grades 4–6</p>
          </div>
          <div className="user-badge">
            <div className="user-avatar">
              {(currentUser.firstName?.[0] || "") + (currentUser.lastName?.[0] || "")}
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser.firstName} {currentUser.lastName}</span>
              <span className="user-role-label">{ROLE_META[currentUser.role]?.label || currentUser.role}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Sign out">Sign out</button>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${view === "generator" ? "active" : ""}`} onClick={() => setView("generator")}>
            📝 Generator
          </button>
          <button className={`tab ${view === "classes" ? "active" : ""}`} onClick={() => setView("classes")}>
            👥 Classes {classes.length > 0 && `(${classes.length})`}
          </button>
          <button className={`tab ${view === "records" ? "active" : ""}`} onClick={() => setView("records")}>
            📋 Records
          </button>
          {currentUser.role === "superadmin" && (
            <button className={`tab ${view === "admin" ? "active" : ""}`} onClick={() => setView("admin")}>
              🔑 Admin
            </button>
          )}
          {currentUser.role === "school" && (
            <button className={`tab ${view === "employees" ? "active" : ""}`} onClick={() => setView("employees")}>
              🧑‍🏫 Employees
            </button>
          )}
        </div>

        {view === "classes" && (
          <div className="classes-panel">
            <div className="config-title">My Classes</div>
            <div className="add-class-row">
              <input
                className="text-input"
                type="text"
                placeholder="Class name, e.g. 1-A or Grade 5"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addClass(); }}
              />
              <button className="mini-btn" onClick={addClass} disabled={!newClassName.trim()}>
                + Add class
              </button>
            </div>

            {classes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-emoji">📚</div>
                <div className="empty-state-text">
                  You don't have any classes yet.<br />
                  Add your first class above, then add students.
                </div>
              </div>
            ) : (
              classes.map(c => (
                <div className="class-card" key={c.id}>
                  <div className="class-card-head">
                    <div>
                      <div className="class-name">{c.name}</div>
                      <div className="class-count">{c.students.length} {c.students.length === 1 ? "student" : "students"}</div>
                    </div>
                    <button className="delete-class-btn" onClick={() => deleteClass(c.id)}>Delete class</button>
                  </div>

                  {c.students.length === 0 ? (
                    <div className="empty-students">No students in this class yet.</div>
                  ) : (
                    <div className="student-tags">
                      {c.students.map(s => (
                        <span className="student-tag" key={s}>
                          <button
                            onClick={() => setProfile({ classId: c.id, name: s })}
                            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", font: "inherit", padding: 0 }}
                            title="Open profile"
                          >{s}</button>
                          <button onClick={() => removeStudent(c.id, s)} title="Remove">×</button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="add-student-row">
                    <input
                      className="text-input"
                      type="text"
                      placeholder="Student name"
                      value={newStudentInputs[c.id] || ""}
                      onChange={e => setNewStudentInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") addStudent(c.id); }}
                    />
                    <button
                      className="mini-btn ghost"
                      onClick={() => addStudent(c.id)}
                      disabled={!(newStudentInputs[c.id] || "").trim()}
                    >+ Add</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === "records" && (
          <div className="classes-panel">
            <div className="config-title">Records — attendance, grades &amp; payment</div>

            {classes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-emoji">📋</div>
                <div className="empty-state-text">
                  You have no classes for records.<br />
                  First create a class and add students in the "Classes" tab.
                </div>
              </div>
            ) : (
              <>
                <div className="records-controls">
                  <div className="field">
                    <label>Class</label>
                    <select value={recordsClassId} onChange={e => setRecordsClassId(e.target.value)}>
                      <option value="">— Select class —</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Class date (attendance / grade)</label>
                    <input className="text-input" type="date" value={attDate} onChange={e => setAttDate(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Month (payment)</label>
                    <input className="text-input" type="month" value={payMonth} onChange={e => setPayMonth(e.target.value)} />
                  </div>
                </div>

                {(() => {
                  const cls = classes.find(c => c.id === recordsClassId);
                  if (!cls) return (
                    <div className="empty-students" style={{ textAlign: "center", padding: "20px 0" }}>
                      Select a class to see the student list.
                    </div>
                  );
                  if (cls.students.length === 0) return (
                    <div className="empty-students" style={{ textAlign: "center", padding: "20px 0" }}>
                      This class has no students yet.
                    </div>
                  );

                  const rec = records[cls.id] || { attendance: {}, payment: {}, grades: {} };
                  const dayAtt = rec.attendance?.[attDate] || {};
                  const monPay = rec.payment?.[payMonth] || {};
                  const dayGrades = rec.grades?.[attDate] || {};
                  const presentCount = cls.students.filter(s => dayAtt[s]).length;
                  const paidCount = cls.students.filter(s => monPay[s]).length;

                  return (
                    <>
                      <div className="quick-fill-row">
                        <span className="quick-fill-label">Quick:</span>
                        <button
                          className="quick-fill-btn"
                          onClick={() => markAllPresent(cls.id, attDate, cls.students)}
                        >
                          ✓ All present ({attDate.split("-").reverse().join(".")})
                        </button>
                      </div>
                      <table className="records-table">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th className="center">Present<br />({attDate.split("-").reverse().join(".")})</th>
                            <th className="center">Total<br />attendance</th>
                            <th className="center">Grade<br />({attDate.split("-").reverse().join(".")})</th>
                            <th className="center">Paid<br />({payMonth})</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cls.students.map(s => {
                            const present = !!dayAtt[s];
                            const paid = !!monPay[s];
                            const score = dayGrades[s] || "";
                            return (
                              <tr key={s}>
                                <td className="student-cell">
                                  <button className="student-link" onClick={() => setProfile({ classId: cls.id, name: s })}>
                                    {s}
                                  </button>
                                </td>
                                <td className="center">
                                  <button
                                    className={`check ${present ? "checked" : ""}`}
                                    onClick={() => toggleAttendance(cls.id, attDate, s)}
                                    title={present ? "Present" : "Absent"}
                                  >
                                    {present && (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </button>
                                </td>
                                <td className="center">
                                  <span className="att-count">{countAttendance(cls.id, s)}</span>
                                </td>
                                <td className="center">
                                  <select
                                    className="grade-select"
                                    value={score}
                                    onChange={e => setGradeScore(cls.id, attDate, s, e.target.value)}
                                  >
                                    <option value="">—</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                  </select>
                                </td>
                                <td className="center">
                                  <button
                                    className={`check pay ${paid ? "checked pay" : ""}`}
                                    onClick={() => togglePayment(cls.id, payMonth, s)}
                                    title={paid ? "Paid" : "Not paid"}
                                  >
                                    {paid && (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <div className="pay-summary">
                        <div className="pay-summary-item">
                          <span className="pay-summary-label">Present today</span>
                          <span className="pay-summary-value">{presentCount} / {cls.students.length}</span>
                        </div>
                        <div className="pay-summary-item">
                          <span className="pay-summary-label">Paid ({payMonth})</span>
                          <span className="pay-summary-value">{paidCount} / {cls.students.length}</span>
                        </div>
                        <div className="pay-summary-item">
                          <span className="pay-summary-label">Not paid</span>
                          <span className="pay-summary-value" style={{ color: paidCount < cls.students.length ? "#ff6b6b" : "#51cf66" }}>
                            {cls.students.length - paidCount}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {view === "admin" && currentUser.role === "superadmin" && (
          <AdminPanel currentUser={currentUser} />
        )}

        {view === "employees" && currentUser.role === "school" && (
          <EmployeesPanel currentUser={currentUser} />
        )}

        {view === "generator" && (
          <>
            <div className="configurator">
              <div className="config-title">Settings</div>

              <div className="config-row">
                <div className="field">
                  <label>Grade</label>
                  <select value={grade} onChange={e => { setGrade(e.target.value); setSelectedTopic(null); }}>
                    <option value="all">All grades</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                    <option value="6">Grade 6</option>
                  </select>
                </div>
                <div className="field">
                  <label>Number of exercises</label>
                  <input
                    type="number"
                    className="text-input"
                    min={5}
                    max={20}
                    value={count}
                    onChange={e => setCount(Math.max(5, Math.min(20, parseInt(e.target.value) || 10)))}
                  />
                </div>
              </div>

              <div className="field full" style={{ marginBottom: 16 }}>
                <label>Topic</label>
                <div className="topic-grid">
                  {filteredTopics.map(t => (
                    <div
                      key={t.id}
                      className={`topic-card ${selectedTopic === t.id ? "active" : ""}`}
                      onClick={() => selectTopic(t.id)}
                    >
                      <div className="topic-emoji">{t.emoji}</div>
                      <div className="topic-name">{t.name}</div>
                      <div className="topic-desc">{t.desc} · Grade {t.grade}</div>
                    </div>
                  ))}
                </div>
              </div>

              {supportedTypes && supportedTypes.length > 1 && (
                <div className="field full" style={{ marginBottom: 16 }}>
                  <label>Exercise type</label>
                  <div className="type-pills">
                    <button
                      className={`type-pill ${taskType === "match" ? "active" : ""}`}
                      onClick={() => setTaskType("match")}
                    >
                      🔗 Match
                    </button>
                    <button
                      className={`type-pill ${taskType === "tf" ? "active" : ""}`}
                      onClick={() => setTaskType("tf")}
                    >
                      ✓✗ True / False
                    </button>
                  </div>
                </div>
              )}

              <div className="config-row" style={{ marginBottom: 0 }}>
                <div className="field">
                  <label>Class</label>
                  <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setSelectedStudent(""); }}>
                    <option value="">— No class —</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Student (optional)</label>
                  <select
                    value={selectedStudent}
                    onChange={e => setSelectedStudent(e.target.value)}
                    disabled={!selectedClass || selectedClass.students.length === 0}
                  >
                    <option value="">
                      {!selectedClass
                        ? "Select a class first"
                        : selectedClass.students.length === 0
                          ? "No students in class"
                          : "— Select student —"}
                    </option>
                    {selectedClass && selectedClass.students.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {classes.length === 0 && (
                <p style={{ fontSize: 12, color: "#c4a498", marginTop: 10 }}>
                  💡 Create classes in the "Classes" tab to select students from the list.
                </p>
              )}

              <button
                className="gen-btn"
                onClick={generate}
                disabled={!selectedTopic}
                style={{ marginTop: 20 }}
              >
                ✏️ Generate worksheet
              </button>
            </div>

            {tasks && topic && (
              <div className="worksheet-wrap">
                <div className="worksheet-toolbar">
                  <div className="worksheet-meta">
                    <strong>{topic.emoji} {topic.name}</strong> · Grade {topic.grade} · {tasks.items?.length || tasks.pairs?.length} exercises
                  </div>
                  <div className="toolbar-actions">
                    <button className="action-btn" onClick={() => setShowAnswers(!showAnswers)}>
                      {showAnswers ? "Hide answers" : "Show answers"}
                    </button>
                    <button className="action-btn" onClick={generate}>New set</button>
                    <button className="action-btn primary" onClick={() => setPdfModal(true)}>🖨 Preview PDF</button>
                  </div>
                </div>

                <div className="worksheet">
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
            )}
          </>
        )}

        {profile && (() => {
          const cls = classes.find(c => c.id === profile.classId);
          const hist = getStudentHistory(profile.classId, profile.name);
          const initials = profile.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
          return (
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setProfile(null); }}>
              <div className="modal">
                <div className="modal-head">
                  <button className="modal-close" onClick={() => setProfile(null)}>×</button>
                  <div className="modal-avatar">{initials}</div>
                  <div className="modal-name">{profile.name}</div>
                  <div className="modal-class">{cls ? cls.name : ""}</div>
                </div>

                <div className="modal-body">
                  <div className="profile-stats">
                    <div className="profile-stat stat-present">
                      <div className="profile-stat-value green">{hist.presentCount}</div>
                      <div className="profile-stat-label">Attendances</div>
                    </div>
                    <div className="profile-stat stat-absent">
                      <div className="profile-stat-value red">{hist.absentCount}</div>
                      <div className="profile-stat-label">Absences</div>
                    </div>
                    {TRIMESTERS.map(tr => (
                      <div className="profile-stat stat-grade" key={tr.key}>
                        <div className="profile-stat-value blue">{hist.trimesterGrades[tr.key] || "—"}</div>
                        <div className="profile-stat-label">{tr.short}</div>
                      </div>
                    ))}
                  </div>

                  <div className="profile-block">
                    <div className="profile-section-title">Terms</div>
                    {TRIMESTERS.map(tr => {
                      const trAtt = hist.attendance.filter(a => tr.months.includes(dateMonth(a.date)));
                      const trScores = hist.scores.filter(s => tr.months.includes(dateMonth(s.date)));
                      const finalGrade = hist.trimesterGrades[tr.key] || "";
                      const pres = trAtt.filter(a => a.present).length;
                      const abs = trAtt.filter(a => !a.present).length;
                      const isOpen = openTrimesters[tr.key];
                      return (
                        <div className="trimester-block" key={tr.key}>
                          <div
                            className={`trimester-header ${tr.key}`}
                            onClick={() => setOpenTrimesters(prev => ({ ...prev, [tr.key]: !prev[tr.key] }))}
                          >
                            <div className="trimester-header-left">
                              <div className="trimester-name">{tr.name}</div>
                              <div className="trimester-period">{tr.period}</div>
                            </div>
                            <div className="trimester-chips">
                              {pres > 0 && <span className="trimester-chip att">✓ {pres}</span>}
                              {abs > 0  && <span className="trimester-chip abs">✗ {abs}</span>}
                              {finalGrade && <span className="trimester-chip fin">{finalGrade}</span>}
                            </div>
                            <span className={`trimester-toggle ${isOpen ? "open" : ""}`}>▼</span>
                          </div>
                          {isOpen && (
                            <div className="trimester-content">
                              <div>
                                <div className="trimester-sub">Attendance</div>
                                {trAtt.length === 0 ? (
                                  <div className="trimester-empty">No classes recorded.</div>
                                ) : (
                                  <div className="att-log">
                                    {trAtt.map(a => (
                                      <div className={`att-log-row ${a.present ? "present" : "absent"}`} key={a.date}>
                                        <span>{a.date.split("-").reverse().join(".")}</span>
                                        <span className="att-log-status">{a.present ? "✓ Present" : "✗ Absent"}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="trimester-sub">Grades</div>
                                {trScores.length === 0 ? (
                                  <div className="trimester-empty">No grades recorded.</div>
                                ) : (
                                  <div className="scores-log">
                                    {trScores.map(s => (
                                      <div className="score-log-row" key={s.date}>
                                        <span>{s.date.split("-").reverse().join(".")}</span>
                                        <span className="score-badge">{s.score}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="trimester-final-row">
                                <div className="trimester-final-label">Final grade</div>
                                <select
                                  className="trimester-final-select"
                                  value={finalGrade}
                                  onChange={e => setTrimesterFinalGrade(profile.classId, profile.name, tr.key, e.target.value)}
                                >
                                  <option value="">—</option>
                                  <option value="1">1</option>
                                  <option value="2">2</option>
                                  <option value="3">3</option>
                                  <option value="4">4</option>
                                  <option value="5">5</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="profile-block">
                    <div className="profile-section-title">Paid months</div>
                    {hist.payments.length === 0 ? (
                      <div className="profile-empty">No payments recorded yet.</div>
                    ) : (
                      <div className="pay-months">
                        {hist.payments.map(m => (
                          <span className="pay-month-chip" key={m}>{m}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="profile-block" style={{ marginBottom: 0 }}>
                    <div className="profile-section-title">Notes</div>
                    <textarea
                      className="notes-area"
                      placeholder="Notes on student — progress, behaviour, special needs..."
                      value={hist.note}
                      onChange={e => updateNote(profile.classId, profile.name, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {pdfModal && tasks && topic && createPortal(
        <div className="pdf-modal-overlay">
          <div className="pdf-modal-header">
            <span className="pdf-modal-title">📄 {topic.emoji} {topic.name} · Grade {topic.grade}</span>
            <button className="pdf-action-btn pdf-answers-btn" onClick={() => setShowAnswers(v => !v)}>
              {showAnswers ? "Hide answers" : "Show answers"}
            </button>
            <button className="pdf-action-btn pdf-new-btn" onClick={generate}>
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
            <button className="pdf-action-btn pdf-close-btn" onClick={() => setPdfModal(false)}>
              ✕ Close
            </button>
          </div>
          <div className="pdf-modal-scroll" ref={pdfScrollRef}>
            <div className="pdf-a4-page" key={generateKey} ref={pdfPageRef}>
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
      )}
    </>
  );
}
