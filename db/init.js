// db/init.js — Run once: node db/init.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'literature.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    pdf_file TEXT NOT NULL,
    conference_name TEXT,
    is_conference INTEGER DEFAULT 0,
    year INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS journals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    volume TEXT,
    issue TEXT,
    year INTEGER,
    abstract TEXT,
    pdf_file TEXT NOT NULL,
    author TEXT,
    category TEXT,
    type TEXT DEFAULT 'article',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS editorial_team (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    profile_image TEXT,
    popular_work TEXT,
    bio TEXT,
    works_link TEXT,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_name TEXT NOT NULL,
    email TEXT NOT NULL,
    title TEXT NOT NULL,
    abstract TEXT,
    pdf_file TEXT NOT NULL,
    type TEXT DEFAULT 'journal',
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Seed Admin ───────────────────────────────────────────────────────────────

const adminExists = db.prepare('SELECT id FROM admin WHERE id = 1').get();
if (!adminExists) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'TamilLit@2024';
  const hash = bcrypt.hashSync(password, 12);
  db.prepare('INSERT INTO admin (id, username, password_hash) VALUES (1, ?, ?)').run(username, hash);
  console.log(`✅ Admin created: username="${username}"`);
}

// ── Seed Sample Data ─────────────────────────────────────────────────────────

const newsCount = db.prepare('SELECT COUNT(*) as c FROM news').get().c;
if (newsCount === 0) {
  const insertNews = db.prepare('INSERT INTO news (title, body, category) VALUES (?, ?, ?)');
  insertNews.run('Inaugural Launch of Arivan Journal', 'We are proud to introduce Arivan – International Journal of Tamil and Scientific Studies. Arivan is a peer-reviewed, open-access international research journal dedicated to exploring the relationship between Tamil language, literature, heritage, and scientific thought.', 'General');
  insertNews.run('Call for Papers — Volume I, Issue 1 (January 2026)', 'The editorial board invites original research articles, review papers, and critical essays for our inaugural issue. Scope includes Linguistics, Science in Classical Tamil, Technology in Literature, History of Science, and Scientific Terminology in Tamil. Submission deadline: December 31, 2025.', 'Call for Papers');
  insertNews.run('Scope and Focus: Blending Heritage with Science', 'Arivan promotes interdisciplinary research linking classical Tamil knowledge with modern science, technology, and innovation. We encourage comparative and interdisciplinary studies globally.', 'General');
}

const editorialCount = db.prepare('SELECT COUNT(*) as c FROM editorial_team').get().c;
if (editorialCount === 0) {
  const insertMember = db.prepare('INSERT INTO editorial_team (name, role, popular_work, bio, works_link, display_order) VALUES (?, ?, ?, ?, ?, ?)');
  insertMember.run('Dr. Meenakshi Sundaram', 'Editor-in-Chief', 'Science and Technology in Ancient Tamil Grammar (2022)', 'Professor of Tamil Literature at the University of Madras with 25 years of research in classical Tamil poetry and Sangam-age literature.', '#', 1);
  insertMember.run('Prof. Kavitha Rajan', 'Associate Editor', 'Linguistic Structures of Nannul (2023)', 'Specializes in medieval Tamil literature with a focus on Bhakti poetry and the literary contributions of Tamil women saints.', '#', 2);
  insertMember.run('Dr. Selvam Arumugam', 'Managing Editor', 'Ethical Governance in Thirukkural and Modern Management (2024)', 'Renowned scholar of Thirukkural with extensive publications on ethics, governance, and philosophy in classical Tamil texts.', '#', 3);
  insertMember.run('Dr. Priya Natarajan', 'Review Editor', 'Scientific Terminology Adaptation in Modern Tamil (2025)', 'Research focus on Tamil diaspora literature and the evolution of Tamil identity in global contexts.', '#', 4);
}

const booksCount = db.prepare('SELECT COUNT(*) as c FROM books').get().c;
if (booksCount === 0) {
  const insertBook = db.prepare('INSERT INTO books (title, author, description, pdf_file, is_conference, year) VALUES (?, ?, ?, ?, ?, ?)');
  insertBook.run('Tamil Scientific Heritage: A Review', 'Dr. R. Balakrishnan', 'An in-depth exploration of metal-casting, water harvesting, and architectural marvels of the ancient Tamils.', 'sample.pdf', 0, 2025);
  insertBook.run('Proceedings: Arivan International Scientific Conference', 'Various Authors', 'Collected peer-reviewed papers from the Arivan International Conference on Tamil and Scientific Studies.', 'sample.pdf', 1, 2026);
}

const journalsCount = db.prepare('SELECT COUNT(*) as c FROM journals').get().c;
if (journalsCount === 0) {
  const insertJournal = db.prepare('INSERT INTO journals (title, volume, issue, year, abstract, pdf_file, author, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertJournal.run('Scientific Dimensions of Sangam Literature', 'Vol 1', 'Issue 1', 2026, 'This paper explores the chemical, biological, and physical principles described in ancient Sangam poems, tracing early Tamil scientific thought.', 'sample.pdf', 'Dr. Meenakshi Sundaram', 'Science in Classical Tamil');
  insertJournal.run('Adaptation of Technical Terminology in Tamil Linguistics', 'Vol 1', 'Issue 1', 2026, 'An analytical study of new scientific terms, coinage methodologies, and adaptation in the Tamil language.', 'sample.pdf', 'Dr. Priya Natarajan', 'Linguistics');
}

console.log('✅ Database initialized successfully');
console.log(`📁 Database location: ${DB_PATH}`);
db.close();
