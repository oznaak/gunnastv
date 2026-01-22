const crypto = require('crypto');

const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
const SESSION_CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // Clean up every 15 minutes
const sessions = new Map();

// Periodic cleanup of expired sessions
function cleanupExpiredSessions() {
  const now = Date.now();
  let cleanedCount = 0;
  for (const [sid, session] of sessions.entries()) {
    if (session.expiresAt <= now) {
      sessions.delete(sid);
      cleanedCount++;
    }
  }
  if (cleanedCount > 0) {
    console.log(`Session cleanup: removed ${cleanedCount} expired session(s). Active: ${sessions.size}`);
  }
}

// Start cleanup interval
setInterval(cleanupExpiredSessions, SESSION_CLEANUP_INTERVAL_MS);

function createSession({ dns, username, password }) {
  const sid = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;

  sessions.set(sid, { dns, username, password, expiresAt });
  return { sid, expiresAt };
}

function getSession(sid) {
  if (!sid) return null;
  const session = sessions.get(sid);
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    sessions.delete(sid);
    return null;
  }

  return session;
}

function deleteSession(sid) {
  sessions.delete(sid);
}

module.exports = {
  createSession,
  getSession,
  deleteSession
};
