const express = require('express');
const { passport, setSessionCookie, requireAuth } = require('./auth');

const users = require('./routes/users');
const groups = require('./routes/groups');
const progress = require('./routes/progress');
const notify = require('./routes/notify');

// health
app.get('/health', (_req, res) => res.json({ ok: true }));

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(passport.initialize());



// CORS (point to your Vercel URL in env)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});



// Google OAuth
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/failure' }),
  (req, res) => {
    setSessionCookie(res, req.user.token);
    res.redirect(process.env.POST_LOGIN_REDIRECT || (process.env.CORS_ORIGIN || '/'));
  }
);

app.get('/auth/failure', (_req, res) => res.status(401).json({ error: 'google_oauth_failed' }));


app.get('/auth/logout', (req, res) => {
  const name = process.env.SESSION_COOKIE_NAME || 'sb_session';
  res.setHeader('Set-Cookie', `${name}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
  res.json({ ok: true });
});

// Protected API modules
app.use('/users', requireAuth, users);
app.use('/groups', requireAuth, groups);
app.use('/progress', requireAuth, progress);
app.use('/notify', requireAuth, notify);

module.exports = app;
