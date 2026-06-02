// server.js — Arivan – International Journal of Tamil and Scientific Studies
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Ensure upload directories exist ──────────────────────────────────────────
['public/uploads/books', 'public/uploads/journals', 'public/uploads/editorial', 'public/uploads/submissions'].forEach(dir => {
  fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
});

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "blob:"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  }
}));

app.use(flash());

// ── Global template locals ────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.isAdmin = req.session.adminId ? true : false;
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/', require('./routes/public'));
app.use('/journals', require('./routes/journals'));
app.use('/tamil-literature/admin', require('./routes/admin'));

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('404', { title: '404 – Page Not Found' });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Server Error', message: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🪔 Arivan – International Journal of Tamil and Scientific Studies running at http://localhost:${PORT}`);
  console.log(`📚 Admin panel: http://localhost:${PORT}/tamil-literature/admin`);
  console.log(`📖 Journals:    http://localhost:${PORT}/journals\n`);
});
