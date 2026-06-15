import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/**
 * Login page.
 *
 * @param {{ onGoToSignup: () => void }} props
 */
export function LoginPage({ onGoToSignup }) {
    const { login } = useAuth();
    const { showToast } = useToast();
    const emailRef = useRef(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErr, setFieldErr] = useState({});  // per-field inline errors

    const validate = () => {
        const errs = {};
        if (!email.trim()) errs.email = 'Email is required.';
        else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address.';
        if (!password) errs.password = 'Password is required.';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setFieldErr(errs); return; }
        setFieldErr({});
        setLoading(true);
        try {
            await login(email.trim(), password);
            // AuthContext will flip authChecked → App.jsx shows AppShell
        } catch (err) {
            // FastAPI returns { detail: "..." } on 400
            const msg = err?.message ?? 'Incorrect email or password.';
            showToast(msg, 'error');
            setFieldErr({ password: msg });
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

                <h1 className="auth-heading">Sign in</h1>
                <p className="auth-subheading">Enter your credentials to continue.</p>

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="login-email">Email</label>
                        <input
                            ref={emailRef}
                            id="login-email"
                            type="email"
                            className={`form-input${fieldErr.email ? ' input-error' : ''}`}
                            placeholder="you@company.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setFieldErr(p => ({ ...p, email: undefined })); }}
                            autoComplete="email"
                            autoFocus
                        />
                        {fieldErr.email && <span className="field-error">{fieldErr.email}</span>}
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            className={`form-input${fieldErr.password ? ' input-error' : ''}`}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setFieldErr(p => ({ ...p, password: undefined })); }}
                            autoComplete="current-password"
                        />
                        {fieldErr.password && <span className="field-error">{fieldErr.password}</span>}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary auth-submit"
                        disabled={loading}
                    >
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account?{' '}
                    <button className="auth-link" onClick={onGoToSignup}>
                        Create one
                    </button>
                </p>
            </div>
        </div>
    );
}