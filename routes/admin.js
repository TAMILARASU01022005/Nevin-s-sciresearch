// routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const supabase = require('../db/supabase');
const { requireAdmin } = require('../middleware/auth');
const { bookUpload, journalUpload, editorialUpload, deleteFromCloudinary } = require('../middleware/upload');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts' });

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/tamil-literature/admin');
  res.render('admin/login', { title: 'Admin Login' });
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    let { data: admin } = await supabase.from('admin').select('*').eq('id', 1).maybeSingle();
    
    // Auto-seed admin if database is brand new and has no admin record
    if (!admin) {
      const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
      const defaultPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
      const hash = bcrypt.hashSync(defaultPassword, 12);
      await supabase.from('admin').insert([{ id: 1, username: defaultUsername, password_hash: hash }]);
      const refreshed = await supabase.from('admin').select('*').eq('id', 1).maybeSingle();
      admin = refreshed.data;
    }

    if (!admin || admin.username !== username || !bcrypt.compareSync(password, admin.password_hash)) {
      req.flash('error', 'Invalid credentials.');
      return res.redirect('/tamil-literature/admin/login');
    }
    req.session.adminId = 1;
    req.session.adminUsername = admin.username;
    req.flash('success', 'Welcome back!');
    res.redirect('/tamil-literature/admin');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Login error. Please try again.');
    res.redirect('/tamil-literature/admin/login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/tamil-literature/admin/login'));
});

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { count: newsCount } = await supabase.from('news').select('*', { count: 'exact', head: true });
    const { count: booksCount } = await supabase.from('books').select('*', { count: 'exact', head: true });
    const { count: journalsCount } = await supabase.from('journals').select('*', { count: 'exact', head: true });
    const { count: teamCount } = await supabase.from('editorial_team').select('*', { count: 'exact', head: true });
    const { count: submissionsCount } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');

    const stats = {
      news: newsCount || 0,
      books: booksCount || 0,
      journals: journalsCount || 0,
      team: teamCount || 0,
      submissions: submissionsCount || 0,
    };

    const { data: recentNews } = await supabase.from('news').select('*').order('created_at', { ascending: false }).limit(5);
    const { data: recentSubmissions } = await supabase.from('submissions').select('*').order('created_at', { ascending: false }).limit(5);

    res.render('admin/dashboard', { 
      title: 'Admin Dashboard', 
      stats, 
      recentNews: recentNews || [], 
      recentSubmissions: recentSubmissions || [] 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Dashboard loading error');
  }
});

// ── NEWS ──────────────────────────────────────────────────────────────────────
router.get('/news', requireAdmin, async (req, res) => {
  const { data: news } = await supabase.from('news').select('*').order('created_at', { ascending: false });
  res.render('admin/news', { title: 'Manage News', news: news || [] });
});

router.post('/news/add', requireAdmin, async (req, res) => {
  const { title, body, category, link } = req.body;
  await supabase.from('news').insert([
    { title, body, category: category || 'General', link: link || null }
  ]);
  req.flash('success', 'News post added.');
  res.redirect('/tamil-literature/admin/news');
});

router.post('/news/delete/:id', requireAdmin, async (req, res) => {
  await supabase.from('news').delete().eq('id', req.params.id);
  req.flash('success', 'News post deleted.');
  res.redirect('/tamil-literature/admin/news');
});

// ── BOOKS ─────────────────────────────────────────────────────────────────────
router.get('/books', requireAdmin, async (req, res) => {
  const { data: books } = await supabase.from('books').select('*').order('created_at', { ascending: false });
  res.render('admin/books', { title: 'Manage Books & Conferences', books: books || [] });
});

router.post('/books/add', requireAdmin, bookUpload.fields([
  { name: 'pdf_file', maxCount: 1 },
  { name: 'cover_image', maxCount: 1 }
]), async (req, res) => {
  if (!req.files?.pdf_file) { req.flash('error', 'PDF is required.'); return res.redirect('/tamil-literature/admin/books'); }
  const { title, author, description, conference_name, is_conference, year } = req.body;
  await supabase.from('books').insert([
    {
      title,
      author,
      description: description || '',
      cover_image: req.files.cover_image?.[0]?.path || null,
      pdf_file: req.files.pdf_file[0].path,
      conference_name: conference_name || null,
      is_conference: is_conference === '1' ? 1 : 0,
      year: year ? parseInt(year) : new Date().getFullYear()
    }
  ]);
  req.flash('success', 'Book/Conference added.');
  res.redirect('/tamil-literature/admin/books');
});

router.post('/books/delete/:id', requireAdmin, async (req, res) => {
  const { data: book } = await supabase.from('books').select('*').eq('id', req.params.id).maybeSingle();
  if (book) {
    for (const f of [book.pdf_file, book.cover_image].filter(Boolean)) {
      if (!f.startsWith('http')) {
        const fp = path.join(__dirname, '../public/uploads/books', f);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      } else {
        await deleteFromCloudinary(f);
      }
    }
    await supabase.from('books').delete().eq('id', req.params.id);
  }
  req.flash('success', 'Deleted.');
  res.redirect('/tamil-literature/admin/books');
});

// ── JOURNALS ──────────────────────────────────────────────────────────────────
router.get('/journals', requireAdmin, async (req, res) => {
  const { data: journals } = await supabase.from('journals').select('*').order('created_at', { ascending: false });
  res.render('admin/journals', { title: 'Manage Journals', journals: journals || [] });
});

router.post('/journals/add', requireAdmin, journalUpload.single('pdf_file'), async (req, res) => {
  if (!req.file) { req.flash('error', 'File is required.'); return res.redirect('/tamil-literature/admin/journals'); }
  const { title, volume, issue, year, abstract, author, category, type } = req.body;
  await supabase.from('journals').insert([
    {
      title,
      volume: volume || '',
      issue: issue || '',
      year: year ? parseInt(year) : new Date().getFullYear(),
      abstract: abstract || '',
      pdf_file: req.file.path,
      author: author || '',
      category: category || '',
      type: type || 'article'
    }
  ]);
  req.flash('success', type === 'journal' ? 'Journal (group of articles) added.' : 'Article added.');
  res.redirect('/tamil-literature/admin/journals');
});

router.post('/journals/delete/:id', requireAdmin, async (req, res) => {
  const { data: j } = await supabase.from('journals').select('*').eq('id', req.params.id).maybeSingle();
  if (j) {
    if (j.pdf_file) {
      if (!j.pdf_file.startsWith('http')) {
        const fp = path.join(__dirname, '../public/uploads/journals', j.pdf_file);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      } else {
        await deleteFromCloudinary(j.pdf_file);
      }
    }
    await supabase.from('journals').delete().eq('id', req.params.id);
  }
  req.flash('success', 'Deleted.');
  res.redirect('/tamil-literature/admin/journals');
});

// ── EDITORIAL TEAM ────────────────────────────────────────────────────────────
router.get('/editorial', requireAdmin, async (req, res) => {
  const { data: team } = await supabase.from('editorial_team').select('*').order('display_order', { ascending: true });
  res.render('admin/editorial', { title: 'Manage Editorial Team', team: team || [] });
});

router.post('/editorial/add', requireAdmin, editorialUpload.single('profile_image'), async (req, res) => {
  const { name, role, popular_work, bio, works_link, display_order } = req.body;
  await supabase.from('editorial_team').insert([
    {
      name,
      role,
      popular_work: popular_work || '',
      bio: bio || '',
      works_link: works_link || '#',
      profile_image: req.file?.path || null,
      display_order: parseInt(display_order) || 0
    }
  ]);
  req.flash('success', 'Team member added.');
  res.redirect('/tamil-literature/admin/editorial');
});

router.post('/editorial/delete/:id', requireAdmin, async (req, res) => {
  const { data: member } = await supabase.from('editorial_team').select('*').eq('id', req.params.id).maybeSingle();
  if (member?.profile_image) {
    if (!member.profile_image.startsWith('http')) {
      const fp = path.join(__dirname, '../public/uploads/editorial', member.profile_image);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    } else {
      await deleteFromCloudinary(member.profile_image);
    }
  }
  await supabase.from('editorial_team').delete().eq('id', req.params.id);
  req.flash('success', 'Team member removed.');
  res.redirect('/tamil-literature/admin/editorial');
});

// ── SUBMISSIONS ───────────────────────────────────────────────────────────────
router.get('/submissions', requireAdmin, async (req, res) => {
  const { data: submissions } = await supabase.from('submissions').select('*').order('created_at', { ascending: false });
  res.render('admin/submissions', { title: 'Manage Submissions', submissions: submissions || [] });
});

router.post('/submissions/update/:id', requireAdmin, async (req, res) => {
  try {
    console.log(`[ADMIN] Update submission ${req.params.id} status to: ${req.body.status}`);
    await supabase.from('submissions').update({ status: req.body.status }).eq('id', req.params.id);
    
    if (req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, message: 'Status updated successfully', status: req.body.status });
    }
    req.flash('success', 'Submission status updated.');
  } catch (err) {
    console.error(`[ADMIN] Error updating submission:`, err);
    if (req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, error: err.message });
    }
    req.flash('error', 'Failed to update submission status.');
  }
  res.redirect('/tamil-literature/admin/submissions');
});

router.get('/submissions/download/:id', requireAdmin, async (req, res) => {
  const { data: s } = await supabase.from('submissions').select('*').eq('id', req.params.id).maybeSingle();
  if (!s) return res.status(404).send('Not found');
  if (s.pdf_file.startsWith('http')) {
    return res.redirect(s.pdf_file);
  }
  const fp = path.join(__dirname, '../public/uploads/submissions', s.pdf_file);
  if (!fs.existsSync(fp)) return res.status(404).send('File missing');
  res.download(fp, `submission-${s.id}.pdf`);
});

router.post('/submissions/delete/:id', requireAdmin, async (req, res) => {
  try {
    const { data: s } = await supabase.from('submissions').select('*').eq('id', req.params.id).maybeSingle();
    if (s) {
      if (s.pdf_file) {
        if (!s.pdf_file.startsWith('http')) {
          const fp = path.join(__dirname, '../public/uploads/submissions', s.pdf_file);
          if (fs.existsSync(fp)) fs.unlinkSync(fp);
        } else {
          await deleteFromCloudinary(s.pdf_file);
        }
      }
      await supabase.from('submissions').delete().eq('id', req.params.id);
      req.flash('success', 'Submission deleted successfully.');
    } else {
      req.flash('error', 'Submission not found.');
    }
  } catch (err) {
    console.error('[ADMIN] Error deleting submission:', err);
    req.flash('error', 'Failed to delete submission.');
  }
  res.redirect('/tamil-literature/admin/submissions');
});

module.exports = router;
