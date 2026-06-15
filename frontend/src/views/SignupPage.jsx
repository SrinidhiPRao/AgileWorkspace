import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/**
 * Signup page.
 *
 * @param {{ onGoToLogin: () => void }} props
 */
export function SignupPage({ onGoToLogin }) {
    const { signup } = useAuth();
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErr, setFieldErr] = useState({});

    const validate = () => {
        const errs = {};
        if (!name.trim()) errs.name = 'Name is required.';
        if (!email.trim()) errs.email = 'Email is required.';
        else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address.';
        if (!password) errs.password = 'Password is required.';
        else if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
        else if (password.length > 128) errs.password = 'Password must be under 128 characters.';
        if (password && confirm !== password) errs.confirm = 'Passwords do not match.';
        return errs;
    };

    const clearErr = (field) => setFieldErr(p => ({ ...p, [field]: undefined }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setFieldErr(errs); return; }
        setFieldErr({});
        setLoading(true);
        try {
            await signup(name.trim(), email.trim(), password);
            showToast('Account created. Welcome!');
            // AuthContext.signup calls login internally → authChecked flips → AppShell shown
        } catch (err) {
            // FastAPI returns { detail: "The user with this email already exists..." } on 400
            const raw = err?.message ?? 'Could not create account. Please try again.';
            // Surface duplicate-email errors on the email field
            if (raw.toLowerCase().includes('email')) {
                setFieldErr({ email: raw });
            } else {
                showToast(raw, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Logo */}
                <div className="auth-logo">
                    <i className="bx bx-layer auth-logo-icon" />
                    <span className="auth-logo-text">AgileWorkspace</span>
                </div>

                <h1 className="auth-heading">Create account</h1>
                <p className="auth-subheading">Get started with your workspace.</p>

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    {/* Name */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-name">Full name</label>
                        <input
                            id="signup-name"
                            type="text"
                            className={`form-input${fieldErr.name ? ' input-error' : ''}`}
                            placeholder="Alex Chen"
                            value={name}
                            onChange={e => { setName(e.target.value); clearErr('name'); }}
                            autoComplete="name"
                            autoFocus
                        />
                        {fieldErr.name && <span className="field-error">{fieldErr.name}</span>}
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-email">Email</label>
                        <input
                            id="signup-email"
                            type="email"
                            className={`form-input${fieldErr.email ? ' input-error' : ''}`}
                            placeholder="you@company.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); clearErr('email'); }}
                            autoComplete="email"
                        />
                        {fieldErr.email && <span className="field-error">{fieldErr.email}</span>}
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-password">Password</label>
                        <input
                            id="signup-password"
                            type="password"
                            className={`form-input${fieldErr.password ? ' input-error' : ''}`}
                            placeholder="Min. 8 characters"
                            value={password}
                            onChange={e => { setPassword(e.target.value); clearErr('password'); clearErr('confirm'); }}
                            autoComplete="new-password"
                        />
                        {fieldErr.password && <span className="field-error">{fieldErr.password}</span>}
                    </div>

                    {/* Confirm password */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-confirm">Confirm password</label>
                        <input
                            id="signup-confirm"
                            type="password"
                            className={`form-input${fieldErr.confirm ? ' input-error' : ''}`}
                            placeholder="Repeat password"
                            value={confirm}
                            onChange={e => { setConfirm(e.target.value); clearErr('confirm'); }}
                            autoComplete="new-password"
                        />
                        {fieldErr.confirm && <span className="field-error">{fieldErr.confirm}</span>}
                    </div>

                    {/* Password strength hint */}
                    {password && (
                        <PasswordStrength password={password} />
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary auth-submit"
                        disabled={loading}
                    >
                        {loading ? 'Creating account…' : 'Create account'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{' '}
                    <button className="auth-link" onClick={onGoToLogin}>
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
}

// ── Password strength indicator ───────────────────────────────────────────────

function score(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s; // 0–5
}

const LABELS = ['', 'Weak', 'Fair', 'Fair', 'Strong', 'Strong'];
const COLORS = ['', 'var(--colors-error)', 'var(--colors-warning)', 'var(--colors-warning)', 'var(--colors-success)', 'var(--colors-success)'];

function PasswordStrength({ password }) {
    const s = score(password);
    return (
        <div className="pw-strength">
            <div className="pw-strength-bars">
                {[1, 2, 3, 4, 5].map(i => (
                    <div
                        key={i}
                        className="pw-strength-bar"
                        style={{ backgroundColor: i <= s ? COLORS[s] : 'var(--colors-surface-2)' }}
                    />
                ))}
            </div>
            {s > 0 && (
                <span className="pw-strength-label" style={{ color: COLORS[s] }}>
                    {LABELS[s]}
                </span>
            )}
        </div>
    );
}