import Logo from './Logo.jsx';

export default function LandingPage({ onStart }) {
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

      <p style={{ textAlign: "center", fontSize: 11, color: "#c4a498", marginTop: 24 }}>
        Icons by <a href="https://openmoji.org" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>OpenMoji</a> — the open-source emoji and icon project. License: CC BY-SA 4.0
      </p>
    </div>
  );
}
