import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useVocabImage } from "./useVocabImage.js";

// Maps a card style to the image variant it wants from fetch-image's
// response ("original" | "blurred" | "grayscale" | "dotted" | "silhouette").
// Only styles with an entry here trigger a Pixabay-backed fetch; "color" and
// "outline" stay pure-emoji, zero network cost, same as before.
const IMAGE_VARIANT_BY_STYLE = {
  photo: "original",
  blurred: "blurred",
  dotted: "dotted",
};

// Renders a single card's picture area. Falls back one step at a time:
// requested variant -> original photo -> plain emoji -- a word that's still
// mid-fetch, failed, or just hasn't had its blurred/dotted variant generated
// yet (that's a separate offline script, not this fetch) never leaves a
// blank card.
function CardVisual({ card, cardStyle, imageEntry }) {
  const variant = IMAGE_VARIANT_BY_STYLE[cardStyle];
  if (variant) {
    if (imageEntry?.status === "ready") {
      const src = imageEntry.urls[variant] || imageEntry.urls.original;
      if (src) return <img className="flashcard-image" src={src} alt={card.front} loading="lazy" />;
    } else if (imageEntry?.status === "loading") {
      return <div className="flashcard-image-loading" aria-label="Loading image">⏳</div>;
    }
    // status "error", or no entry yet -- fall through to the emoji card.
  }
  if (cardStyle === "outline") {
    return (
      <div className="flashcard-emoji-outline">
        <span className="emoji-layer emoji-stroke">{card.emoji}</span>
        <span className="emoji-layer emoji-fill">{card.emoji}</span>
      </div>
    );
  }
  return <div className="flashcard-emoji">{card.emoji}</div>;
}

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
  // Per-word cache of fetch-image results, keyed by lowercased front text --
  // persists across "New set" clicks and style switches within one session,
  // so a word seen twice is only ever fetched once. Not the same thing as
  // the server-side Storage cache fetch-image itself checks; this just
  // avoids redundant invoke() calls from this one modal instance.
  const [imageMap, setImageMap] = useState({});
  const { fetchImage } = useVocabImage();
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

  // Only fires for image-backed styles (see IMAGE_VARIANT_BY_STYLE) -- color
  // and outline never touch the network. imageMap is deliberately left out
  // of the dependency array: it's this effect's own write target, so
  // including it would just re-trigger itself on every fetch resolution.
  useEffect(() => {
    if (!IMAGE_VARIANT_BY_STYLE[cardStyle] || !cards) return;
    const words = [...new Set(cards.map((c) => c.front?.trim().toLowerCase()).filter(Boolean))];
    const pending = words.filter((w) => !imageMap[w]);
    if (pending.length === 0) return;

    setImageMap((prev) => {
      const next = { ...prev };
      for (const w of pending) next[w] = { status: "loading" };
      return next;
    });

    pending.forEach(async (word) => {
      const result = await fetchImage(word, "photo");
      setImageMap((prev) => ({
        ...prev,
        [word]: result ? { status: "ready", urls: result.urls } : { status: "error" },
      }));
    });
  }, [cardStyle, cards]);

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

  const cardClass = cardStyle === "outline"
    ? "flashcard-outline"
    : IMAGE_VARIANT_BY_STYLE[cardStyle]
      ? "flashcard-imagecard"
      : "flashcard-color";

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
            <button
              className={`type-pill ${cardStyle === "photo" ? "active" : ""}`}
              onClick={() => setCardStyle("photo")}
            >
              📷 Photo
            </button>
            <button
              className={`type-pill ${cardStyle === "blurred" ? "active" : ""}`}
              onClick={() => setCardStyle("blurred")}
            >
              🌫️ Guess (blurred)
            </button>
            <button
              className={`type-pill ${cardStyle === "dotted" ? "active" : ""}`}
              onClick={() => setCardStyle("dotted")}
            >
              🔢 Connect the dots
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
                <div className={`flashcard ${cardClass}`} key={i}>
                  <CardVisual
                    card={c}
                    cardStyle={cardStyle}
                    imageEntry={imageMap[c.front?.trim().toLowerCase()]}
                  />
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
