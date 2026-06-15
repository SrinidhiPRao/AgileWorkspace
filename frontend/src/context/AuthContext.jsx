import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { auth } from '../api/index.js';

const AuthContext = createContext(null);

/**
 * Auth state machine:
 *  authChecked=false  → still verifying stored token (shows nothing / spinner)
 *  authChecked=true, token=null → unauthenticated → show Login/Signup
 *  authChecked=true, token set  → authenticated    → show AppShell
 */
export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => sessionStorage.getItem('aw_token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false); // true once we know auth status

  const persistToken = useCallback((t) => {
    if (t) sessionStorage.setItem('aw_token', t);
    else sessionStorage.removeItem('aw_token');
    setTokenState(t);
  }, []);

  // On mount (or when token changes), verify the stored token via test-token.
  // This is the only place we call the network for auth hydration.
  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      setAuthChecked(true);
      return;
    }
    auth.testToken()
      .then((user) => {
        setCurrentUser(user);
        setAuthChecked(true);
      })
      .catch(() => {
        // Token is invalid or expired
        persistToken(null);
        setCurrentUser(null);
        setAuthChecked(true);
      });
  }, []); // intentionally run once on mount only — token changes handled by login/logout

  /**
   * Log in. Stores the token and fetches the user profile.
   * Throws on bad credentials so the LoginPage can surface the error.
   */
  const login = useCallback(async (email, password) => {
    const res = await auth.login(email, password);
    persistToken(res.access_token);
    // Hydrate user immediately after token is stored
    const user = await auth.testToken();
    setCurrentUser(user);
  }, [persistToken]);

  /**
   * Sign up then automatically log in.
   * Throws on validation errors so SignupPage can surface them.
   */
  const signup = useCallback(async (name, email, password) => {
    await auth.signup(name, email, password);
    await login(email, password);
  }, [login]);

  /** Log out — clears token and user; no server call needed (stateless JWT). */
  const logout = useCallback(() => {
    persistToken(null);
    setCurrentUser(null);
  }, [persistToken]);

  return (
    <AuthContext.Provider value={{ token, currentUser, authChecked, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};