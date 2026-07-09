import { useState } from "react";

// Fisher-Yates -- Array.sort(() => Math.random() - 0.5) produces a biased,
// non-uniform shuffle (a well-documented JS anti-pattern) and can behave
// inconsistently on engines whose sort relies on a stable comparator.
export function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function CircleWordTask({ data, showAnswers }) {
  return (
    <div>
      <div className="section-title">Zaokruži tačnu reč 🔤</div>
      <p style={{ fontSize: 13, color: "#9b7060", marginBottom: 8 }}>{data.instruction}</p>
      <div className="circle-word-grid">
        {data.items.map((item, i) => (
          <div className="circle-word-item" key={i}>
            <div className="circle-word-emoji">{item.emoji}</div>
            <div className="circle-word-options">
              {item.options.map((opt, j) => (
                <span
                  key={j}
                  className={`circle-word-option${showAnswers && j === item.correctIndex ? " correct" : ""}`}
                >
                  {opt}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OddOneOutTask({ data, showAnswers }) {
  return (
    <div>
      <div className="section-title">Zaokruži tuđinca 🔍</div>
      <p style={{ fontSize: 13, color: "#9b7060", marginBottom: 8 }}>{data.instruction}</p>
      <div className="odd-groups">
        {data.groups.map((g, i) => (
          <div className="odd-group" key={i}>
            <span className="odd-group-num">{i + 1}.</span>
            <div className="odd-group-items">
              {g.words.map((w, j) => (
                <div
                  className={`listen-card odd-item${showAnswers && j === g.oddIndex ? " odd-answer" : ""}`}
                  key={j}
                >
                  <div className="listen-card-emoji">{w.emoji}</div>
                  <div className="listen-card-word">{w.word}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListenCircleTask({ data }) {
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

export function ColorBoxTask({ data }) {
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
            {item.sr && <div className="color-box-sr">{item.sr}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatchTask({ data, showAnswers }) {
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

export function FillInTask({ data, showAnswers }) {
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

export function TrueFalseTask({ data, showAnswers }) {
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
