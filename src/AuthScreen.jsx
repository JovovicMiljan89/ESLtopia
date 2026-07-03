import { useState } from 'react';
import { supabase } from './supabaseClient.js';
import Logo from './Logo.jsx';
import { validateEmail, validatePassword, normalizeProfile, fetchProfile } from './profileHelpers.js';

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

export function ResetPasswordForm({ onDone }) {
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

export default function AuthScreen({ onLogin }) {
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
