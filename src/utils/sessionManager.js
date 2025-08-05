// Session management utilities
const SESSION_KEY = "aegis_user_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const sessionManager = {
  // Save user session
  saveSession: (userData) => {
    const sessionData = {
      user: userData,
      timestamp: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  },

  // Get current session
  getSession: () => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        sessionManager.clearSession();
        return null;
      }

      // Extend session if it's still valid
      sessionManager.extendSession();

      return session.user;
    } catch {
      console.error("Error getting session");
      sessionManager.clearSession();
      return null;
    }
  },

  // Extend session duration
  extendSession: () => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return;

      const session = JSON.parse(sessionData);
      session.expiresAt = Date.now() + SESSION_DURATION;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      console.error("Error extending session");
    }
  },

  // Clear session
  clearSession: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return sessionManager.getSession() !== null;
  },

  // Get session expiry time
  getSessionExpiry: () => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      return session.expiresAt;
    } catch {
      return null;
    }
  },
};

// Auto-extend session on user activity
export const setupSessionAutoExtend = () => {
  const events = [
    "mousedown",
    "mousemove",
    "keypress",
    "scroll",
    "touchstart",
    "click",
  ];

  const extendSessionOnActivity = () => {
    if (sessionManager.isLoggedIn()) {
      sessionManager.extendSession();
    }
  };

  events.forEach((event) => {
    document.addEventListener(event, extendSessionOnActivity, {
      passive: true,
    });
  });

  // Also extend session every 30 minutes
  setInterval(() => {
    if (sessionManager.isLoggedIn()) {
      sessionManager.extendSession();
    }
  }, 30 * 60 * 1000); // 30 minutes
};
