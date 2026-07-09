import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from './supabaseClient.js';
import Logo from './Logo.jsx';
import PdfPreviewModal from './PdfPreviewModal.jsx';
import { styles } from './styles.js';
import { TOPICS, TOPIC_DATA, generateTasks } from './worksheetContent.js';
import { fetchProfile } from './profileHelpers.js';
import LandingPage from './LandingPage.jsx';
import AdminPanel from './AdminPanel.jsx';
import EmployeesPanel from './EmployeesPanel.jsx';
import AuthScreen, { ResetPasswordForm } from './AuthScreen.jsx';

// ─── RENDER HELPERS ───────────────────────────────────────────────────────────

// ─── AUTH ─────────────────────────────────────────────────────────────────────

const ROLE_META = {
  teacher:    { label: "Teacher",     icon: "👩‍🏫" },
  school:     { label: "School",      icon: "🏫"   },
  superadmin: { label: "Super Admin", icon: "🔑"   },
};


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

  // onAuthStateChange below is registered once (see the empty dep array on
  // the effect that follows) and would otherwise close over passwordReset's
  // initial value forever -- a ref keeps it reading the current value.
  const passwordResetRef = useRef(passwordReset);
  useEffect(() => { passwordResetRef.current = passwordReset; }, [passwordReset]);

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
        if (!passwordResetRef.current) {
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
  const [grade, setGrade] = useState("");
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
  useEffect(() => { ownerIdRef.current = currentUser?.id; }, [currentUser?.id]);

  const syncRecord = useCallback((classId, data) => {
    clearTimeout(syncTimers.current[classId]);
    syncTimers.current[classId] = setTimeout(async () => {
      if (!ownerIdRef.current) return;
      const { error } = await supabase.from('records').upsert(
        { class_id: classId, owner_id: ownerIdRef.current, data, updated_at: new Date().toISOString() },
        { onConflict: 'class_id' }
      );
      if (error) console.error('Failed to save record:', error);
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
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) { console.error('Failed to delete class:', error); return; }
    setClasses(prev => prev.filter(c => c.id !== id));
    if (selectedClassId === id) { setSelectedClassId(""); setSelectedStudent(""); }
  };

  const addStudent = async (classId) => {
    const name = (newStudentInputs[classId] || "").trim();
    if (!name) return;
    const cls = classes.find(c => c.id === classId);
    if (!cls || cls.students.includes(name)) return;
    const newStudents = [...cls.students, name];
    const { error } = await supabase.from('classes').update({ students: newStudents }).eq('id', classId);
    if (error) { console.error('Failed to add student:', error); return; }
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, students: newStudents } : c));
    setNewStudentInputs(prev => ({ ...prev, [classId]: "" }));
  };

  const removeStudent = async (classId, name) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    const newStudents = cls.students.filter(s => s !== name);
    const { error } = await supabase.from('classes').update({ students: newStudents }).eq('id', classId);
    if (error) { console.error('Failed to remove student:', error); return; }
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, students: newStudents } : c));
  };

  const gradeGroups = Array.from(new Set(TOPICS.map(t => t.grade)))
    .sort((a, b) => Number(a) - Number(b))
    .map(g => ({ grade: g, count: TOPICS.filter(t => t.grade === g).length }));

  const filteredTopics = grade ? TOPICS.filter(t => t.grade === grade) : [];

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
                  <div className="type-pills">
                    {gradeGroups.map(g => (
                      <button
                        key={g.grade}
                        type="button"
                        className={`type-pill ${grade === g.grade ? "active" : ""}`}
                        onClick={() => { setGrade(g.grade); setSelectedTopic(null); }}
                      >
                        Grade {g.grade} ({g.count})
                      </button>
                    ))}
                  </div>
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
                {grade ? (
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
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-emoji">👆</div>
                    <div className="empty-state-text">Choose a grade above to see its topics.</div>
                  </div>
                )}
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

      <PdfPreviewModal
        open={pdfModal}
        topic={topic}
        tasks={tasks}
        studentName={studentName}
        selectedClass={selectedClass}
        showAnswers={showAnswers}
        sheetKey={generateKey}
        styles={styles}
        onClose={() => setPdfModal(false)}
        onNewSet={generate}
        onToggleAnswers={() => setShowAnswers(v => !v)}
      />
    </>
  );
}
