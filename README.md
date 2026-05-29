# 🪔 Tamil Literature Portal

A full-stack Tamil literature academic portal with role-based access, academic journals, books, conference proceedings, and an admin dashboard.

---

## 📁 Project Structure

```
tamil-literature/
├── server.js                    ← Express app entry point
├── package.json
├── .env                         ← Environment variables (DO NOT commit)
├── .gitignore
│
├── db/
│   ├── init.js                  ← Run once to create DB + seed data
│   └── database.js              ← SQLite connection module
│
├── middleware/
│   ├── auth.js                  ← Admin session guard
│   └── upload.js                ← Multer file upload configs
│
├── routes/
│   ├── public.js                ← Home, Books, News, Submit
│   ├── journals.js              ← Academic Journal sub-site
│   └── admin.js                 ← All admin CRUD routes
│
├── views/
│   ├── partials/
│   │   ├── header.ejs           ← Main site header/nav
│   │   └── footer.ejs           ← Main site footer
│   ├── home.ejs                 ← Landing page
│   ├── news.ejs                 ← News listing
│   ├── news-detail.ejs          ← Single news item
│   ├── books.ejs                ← Books & conferences
│   ├── submit.ejs               ← Submit your work form
│   ├── 404.ejs
│   ├── error.ejs
│   │
│   ├── journals/
│   │   ├── partials-header.ejs  ← Journals sub-site header
│   │   ├── partials-footer.ejs  ← Journals sub-site footer
│   │   ├── home.ejs
│   │   ├── about.ejs
│   │   ├── editorial.ejs        ← Editorial team
│   │   ├── articles.ejs         ← Journal articles listing
│   │   └── contact.ejs
│   │
│   └── admin/
│       ├── partials-header.ejs  ← Admin sidebar layout
│       ├── partials-footer.ejs
│       ├── login.ejs
│       ├── dashboard.ejs        ← Stats + quick actions
│       ├── news.ejs             ← Manage news
│       ├── books.ejs            ← Manage books/conferences
│       ├── journals.ejs         ← Manage journal articles
│       ├── editorial.ejs        ← Manage editorial team
│       └── submissions.ejs      ← Review user submissions
│
└── public/
    ├── css/
    │   ├── main.css             ← Tamil-themed public styles
    │   └── admin.css            ← Admin panel styles
    ├── js/
    │   └── main.js              ← Client-side interactions
    └── uploads/                 ← User-uploaded files (PDFs, images)
        ├── books/
        ├── journals/
        ├── editorial/
        └── submissions/
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (https://nodejs.org)
- npm

### Steps

```bash
# 1. Clone / download and enter folder
cd tamil-literature

# 2. Install dependencies
npm install

# 3. Configure environment
# Edit .env file with your settings (see below)

# 4. Initialize database (creates SQLite DB + seeds sample data)
node db/init.js

# 5. Start development server
npm run dev   # uses nodemon for auto-restart

# OR for production:
npm start
```

Visit:
- **Public Portal:** http://localhost:3000
- **Academic Journals:** http://localhost:3000/journals
- **Admin Panel:** http://localhost:3000/tamil-literature/admin

**Default admin credentials** (change in `.env` before going live):
- Username: `admin`
- Password: `TamilLit@2024`

---

## ⚙️ Environment Configuration (`.env`)

```env
PORT=3000
NODE_ENV=production

# CHANGE THIS — long random string
SESSION_SECRET=your-super-secret-session-key-here

# Admin credentials (used during db/init.js)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourStrongPassword123!

# Max file upload size in MB
MAX_FILE_SIZE_MB=50
```

> ⚠️ **Never commit `.env` to version control**

---

## 🌐 URL Map

| URL | Description |
|-----|-------------|
| `/` | Public home page |
| `/journals` | Academic Journals home |
| `/journals/about` | About the journal |
| `/journals/editorial-team` | Editorial team |
| `/journals/articles` | Browse articles |
| `/journals/contact` | Journal contact |
| `/books` | Books & Conferences |
| `/news` | News & Announcements |
| `/submit` | Submit your work |
| `/download/book/:id` | Download book PDF |
| `/download/journal/:id` | Download journal PDF |
| `/tamil-literature/admin` | Admin dashboard |
| `/tamil-literature/admin/login` | Admin login |

---

## 💰 Deployment Guide (Low Budget)

### Option A: Railway (~$5/month) — RECOMMENDED ✅

Railway supports Node.js + persistent storage out of the box.

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Set environment variables in Railway dashboard or:
railway variables set SESSION_SECRET="your-secret-here"
railway variables set NODE_ENV="production"
railway variables set ADMIN_USERNAME="admin"
railway variables set ADMIN_PASSWORD="YourSecurePassword!"

# 5. Deploy
railway up

# 6. Get your domain
railway domain
```

**Cost:** ~$5/month (Hobby plan). Includes persistent disk for SQLite + uploads.

---

### Option B: Render (Free tier, then $7/month)

1. Push code to GitHub (exclude `.env`, `db/literature.db`, `public/uploads/`)
2. Go to https://render.com → New Web Service
3. Connect GitHub repo
4. Build command: `npm install && node db/init.js`
5. Start command: `npm start`
6. Add environment variables in Render dashboard
7. Add a **Persistent Disk** ($1/month) for SQLite + uploads

**Cost:** Free tier available (spins down on inactivity) or $7/month for always-on.

> ⚠️ Free tier on Render does NOT include persistent disk — use Render paid plan or Railway for production.

---

### Option C: VPS — DigitalOcean / Hetzner (~$4–6/month)

```bash
# On your VPS (Ubuntu 22.04):

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Upload your code via SCP or Git
git clone https://github.com/yourrepo/tamil-literature.git
cd tamil-literature
npm install
node db/init.js

# Start with PM2
pm2 start server.js --name tamil-literature
pm2 save
pm2 startup

# Install Nginx as reverse proxy
sudo apt install nginx
```

**Nginx config** (`/etc/nginx/sites-available/tamilliterature`):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    client_max_body_size 60M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tamilliterature /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Free SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

**Cost:** Hetzner CX11 = ~$4/month. DigitalOcean Droplet = ~$6/month.

---

### Cost Summary

| Option | Monthly Cost | Notes |
|--------|-------------|-------|
| Railway Hobby | ~$5 | Easiest, persistent disk included |
| Render Free | $0 | Sleeps after inactivity, no persistent disk |
| Render Paid | ~$8 | Always-on + persistent disk |
| Hetzner VPS | ~$4 | Most control, manual setup |
| DigitalOcean | ~$6 | Good docs, managed options |

**Domain name:** ~$10–15/year via Namecheap, Porkbun, or Cloudflare.

**Total minimum cost:** ~$4–8/month + $10/year domain = **~$60–110/year**

---

## 🔒 Security Notes

1. **Change admin password** before going live (set in `.env` before running `node db/init.js`)
2. **SESSION_SECRET** must be a long random string in production
3. **Rate limiting** is enabled on login (10 attempts / 15 min) and submissions
4. **Helmet.js** is configured for security headers
5. **File uploads** are validated (PDF-only for articles, image-only for covers)
6. **SQLite** database is stored outside `public/` — not web-accessible
7. Always use **HTTPS** in production (Nginx + Let's Encrypt covers this)

---

## 📦 Changing Admin Password

If you need to reset the admin password after first setup:

```bash
node -e "
const bcrypt = require('bcryptjs');
const db = require('better-sqlite3')('./db/literature.db');
const hash = bcrypt.hashSync('YourNewPassword!', 12);
db.prepare('UPDATE admin SET password_hash = ? WHERE id = 1').run(hash);
console.log('Password updated');
db.close();
"
```

---

## 🛠️ Maintenance Tips

- **Backup:** Regularly backup `db/literature.db` and `public/uploads/` folder
- **Updates:** Run `npm audit` and `npm update` periodically
- **Logs:** Use `pm2 logs` (VPS) or Railway/Render dashboard logs
- **DB size:** SQLite handles thousands of records comfortably; migrate to PostgreSQL only if needed beyond 100k+ records

---

## 📚 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Template Engine | EJS |
| Database | SQLite (via better-sqlite3) |
| File Uploads | Multer |
| Auth | bcryptjs + express-session |
| Security | Helmet.js, express-rate-limit |
| Fonts | Google Fonts (Cormorant Garamond, EB Garamond, Noto Serif Tamil) |

---

Built with ❤️ for Tamil literary scholarship.
