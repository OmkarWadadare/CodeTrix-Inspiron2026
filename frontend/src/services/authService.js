/**
 * Mock Authentication Service to prepare for JWT implementation
 */

export const authService = {
  login: async (credentials) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const token = btoa(JSON.stringify({ ...credentials, exp: Date.now() + 86400000 }));
        localStorage.setItem('transluna_token', token);
        resolve({ token, status: 'success' });
      }, 800);
    });
  },

  signupUser: async (data) => {
    // data: { email, password, username }
    return new Promise((resolve) => {
      setTimeout(() => {
        const token = btoa(JSON.stringify({ userType: 'individual', ...data, exp: Date.now() + 86400000 }));
        localStorage.setItem('transluna_token', token);
        resolve({ token, status: 'success' });
      }, 800);
    });
  },

  signupOrg: async (data, isNewOrg) => {
    // data: { orgCode, workspaceName, ... }
    return new Promise((resolve) => {
      setTimeout(() => {
        const token = btoa(JSON.stringify({ userType: 'organization', isAdmin: isNewOrg, ...data, exp: Date.now() + 86400000 }));
        localStorage.setItem('transluna_token', token);
        resolve({ token, status: 'success' });
      }, 800);
    });
  },

  logout: () => {
    localStorage.removeItem('transluna_token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('transluna_token');
  },

  getUser: () => {
    const token = localStorage.getItem('transluna_token');
    if (!token) return null;
    try {
      return JSON.parse(atob(token));
    } catch (e) {
      return null;
    }
  }
};
