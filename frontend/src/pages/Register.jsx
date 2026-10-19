import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import AuthLayout from "../components/AuthLayout";

function PasswordVisibilityButton({ visible, onClick }) {
  return (
    <button
      className="password-visibility"
      type="button"
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
      onClick={onClick}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {visible ? (
          <>
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 002.8 2.8" />
            <path d="M9.9 5.2A11 11 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.2-2.3 3.3" />
            <path d="M6.2 6.2C4.2 7.5 2.9 9.5 2.5 12c1 2.5 4.5 7 9.5 7 1.3 0 2.5-.3 3.6-.9" />
          </>
        ) : (
          <>
            <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
            <circle cx="12" cy="12" r="2.5" />
          </>
        )}
      </svg>
    </button>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Convenience checks only. The API re-validates everything and is the real authority.
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.confirm,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h2>Create your account</h2>
      <p className="auth-sub">Start asking your policies questions in minutes.</p>

      <form onSubmit={handleSubmit}>
        {error && <div className="error" role="alert">{error}</div>}

        <div className="field-row">
          <div className="field">
            <label htmlFor="first_name">First name </label>
            <input id="first_name" autoComplete="given-name" value={form.first_name} onChange={update("first_name")} />
          </div>
          <div className="field">
            <label htmlFor="last_name">Last name </label>
            <input id="last_name" autoComplete="family-name" value={form.last_name} onChange={update("last_name")} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" autoComplete="username" minLength={3} maxLength={50} value={form.username} onChange={update("username")} required />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={form.email} onChange={update("email")} required />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="password-input">
            <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={72} value={form.password} onChange={update("password")} required />
            <PasswordVisibilityButton
              visible={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            />
          </div>
          <div className="hint">8 to 72 characters.</div>
        </div>

        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <div className="password-input">
            <input id="confirm" type={showConfirm ? "text" : "password"} autoComplete="new-password" value={form.confirm} onChange={update("confirm")} required />
            <PasswordVisibilityButton
              visible={showConfirm}
              onClick={() => setShowConfirm((visible) => !visible)}
            />
          </div>
        </div>

        <button className="btn" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
