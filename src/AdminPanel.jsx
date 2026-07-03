import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js';
import { normalizeProfile } from './profileHelpers.js';

// ─── Admin Panel ──────────────────────────────────────────────────────────────

export default function AdminPanel({ currentUser }) {
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
