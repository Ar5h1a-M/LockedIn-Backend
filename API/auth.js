// API/auth.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const db = require('./db');

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  JWT_SECRET,
  SESSION_COOKIE_NAME = 'sb_session',
  COOKIE_DOMAIN,
  NODE_ENV
} = process.env;

passport.use(new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const googleSub = profile.id;
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName || 'User';
      const avatar = profile.photos?.[0]?.value;

      // upsert user
      const [rows] = await db.query(
        `SELECT id FROM users WHERE google_sub = ? OR email = ? LIMIT 1`,
        [googleSub, email]
      );

      let userId;
      if (rows.length) {
        userId = rows[0].id;
        await db.query(
          `UPDATE users SET name=?, avatar_url=?, email=? WHERE id=?`,
          [name, avatar, email, userId]
        );
      } else {
        const [res] = await db.query(
          `INSERT INTO users (google_sub, email, name, avatar_url) VALUES (?, ?, ?, ?)`,
          [googleSub, email, name, avatar]
        );
        userId = res.insertId;
      }

      const token = jwt.sign({ uid: userId, sub: googleSub, email }, JWT_SECRET, { expiresIn: '7d' });
      return done(null, { token, userId });
    } catch (err) {
      return done(err);
    }
  }
));

function setSessionCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie',
    cookie.serialize(process.env.SESSION_COOKIE_NAME || 'sb_session', token, {
      httpOnly: true,
      secure: isProd,            // must be true in prod for SameSite=None to work
      sameSite: 'none',          // <<< change from 'lax' to 'none'
      path: '/',
      maxAge: 7 * 24 * 3600,
      ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {})
    })
  );
}


function requireAuth(req, res, next) {
  try {
    const cookies = (req.headers.cookie && cookie.parse(req.headers.cookie)) || {};
    const token = cookies[SESSION_COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

module.exports = { passport, setSessionCookie, requireAuth };
