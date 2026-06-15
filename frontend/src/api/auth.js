import { request } from './client.js';

// Auth endpoints live at the root, NOT under /api/v1
const AUTH_BASE = '';

export const auth = {
  /**
   * FastAPI OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
   * with fields `username` (the email value) and `password`.
   * Returns { access_token, token_type }
   */
  login: (email, password) =>
    request('/login/access-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password }),
    }, {}, true /* useRootBase */),

  /**
   * POST /signup — JSON body { name, email, password }
   * Returns UserPublic
   */
  signup: (name, email, password) =>
    request('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }, {}, true),

  /**
   * POST /login/test-token — verifies the current token, returns UserPublic.
   */
  testToken: () =>
    request('/login/test-token', { method: 'POST' }, {}, true),
};