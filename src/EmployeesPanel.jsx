import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js';
import { normalizeProfile, validateEmail } from './profileHelpers.js';

// ─── Employees Panel (School) ──────────────────────────────────────────────────

export default function EmployeesPanel({ currentUser }) {
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
