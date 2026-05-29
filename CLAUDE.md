# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
node db/init.js      # Initialize SQLite DB and seed sample data (run once)
npm run dev          # Start dev server with nodemon auto-restart
npm start            # Start production server
```

The app runs at `http://localhost:3000`. Admin panel at `/tamil-literature/admin`.

**Reset admin password after DB init:**
```bash
node -e "
const bcrypt = require('bcryptjs');
const db = require('better-sqlite3')('./db/literature.db');
const hash = bcrypt.hashSync('NewPassword!', 12);
db.prepare('UPDATE admin SET password_hash = ? WHERE id = 1').run(hash);
db.close();
"
```

## Architecture

**Entry point:** `server.js` — mounts three route files and configures Express middleware (Helmet CSP, sessions, flash messages, static files, EJS views).

**Route split:**
- `routes/public.js` — public-facing pages (home, books, news, submit form)
- `routes/journals.js` — academic journals sub-site at `/journals`
- `routes/admin.js` — all admin CRUD behind `/tamil-literature/admin` with `requireAdmin` session guard

**Database:** Single SQLite file at `db/literature.db` via `better-sqlite3` (synchronous API). `db/database.js` exports a singleton `getDb()` with WAL mode and foreign keys enabled. Schema lives in `db/init.js` — tables: `admin`, `news`, `books`, `journals`, `editorial_team`, `submissions`.

**Auth:** Session-based. `req.session.adminId === 1` is the only check (`middleware/auth.js`). Login rate-limited to 10 attempts per 15 minutes. Admin credentials are seeded from `.env` at `db/init.js` run time.

**File uploads:** `middleware/upload.js` defines four Multer instances keyed to upload destinations (`public/uploads/{books,journals,editorial,submissions}`). Books accept PDF + image; journals and submissions accept PDF only; editorial accepts images only. Max size from `MAX_FILE_SIZE_MB` env var (default 50 MB). Filenames are `{timestamp}-{random}{ext}`. Delete routes unlink files from disk before removing DB rows.

**Views:** EJS with two layout contexts — the main site uses `views/partials/{header,footer}.ejs`, the journals sub-site uses `views/journals/partials-{header,footer}.ejs`, and admin uses `views/admin/partials-{header,footer}.ejs`. Flash messages (`success`, `error`) and `isAdmin` are set as `res.locals` globally.

**Environment variables** (`.env`, never commit):
- `SESSION_SECRET` — must be a long random string in production
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — used only during `db/init.js`
- `MAX_FILE_SIZE_MB` — upload size cap (default 50)
- `NODE_ENV` — set to `production` to enable secure cookies
