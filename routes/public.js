// routes/public.js
const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { submissionUpload } = require('../middleware/upload');
const rateLimit = require('express-rate-limit');

const submitLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

// HOME
router.get('/', async (req, res) => {
  const { data: news } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);
  res.render('home', { title: 'NSRS', news: news || [] });
});

// NEWS & ANNOUNCEMENTS
router.get('/news', async (req, res) => {
  const { data: news } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });
  res.render('news', { title: 'News & Announcements', news: news || [] });
});

router.get('/news/:id', async (req, res) => {
  const { data: item } = await supabase
    .from('news')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();
  if (!item) return res.redirect('/news');
  res.render('news-detail', { title: item.title, item });
});

// BOOKS & CONFERENCE
router.get('/books', async (req, res) => {
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('is_conference', 0)
    .order('created_at', { ascending: false });
  const { data: conferences } = await supabase
    .from('books')
    .select('*')
    .eq('is_conference', 1)
    .order('created_at', { ascending: false });
  res.render('books', { title: 'Books & Conferences', books: books || [], conferences: conferences || [] });
});

// PDF Download
router.get('/download/book/:id', async (req, res) => {
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();
  if (!book) return res.status(404).send('Not found');
  if (book.pdf_file.startsWith('http')) {
    return res.redirect(book.pdf_file);
  }
  const filePath = require('path').join(__dirname, '../public/uploads/books', book.pdf_file);
  if (!require('fs').existsSync(filePath)) return res.status(404).send('File not found');
  res.download(filePath, `${book.title}.pdf`);
});

router.get('/download/journal/:id', async (req, res) => {
  const { data: journal } = await supabase
    .from('journals')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();
  if (!journal) return res.status(404).send('Not found');
  if (journal.pdf_file.startsWith('http')) {
    return res.redirect(journal.pdf_file);
  }
  const filePath = require('path').join(__dirname, '../public/uploads/journals', journal.pdf_file);
  if (!require('fs').existsSync(filePath)) return res.status(404).send('File not found');
  const ext = require('path').extname(journal.pdf_file) || '.pdf';
  res.download(filePath, `${journal.title}${ext}`);
});

// SUBMIT WORK
router.get('/submit', (req, res) => {
  res.render('submit', { title: 'Submit Your Work' });
});

router.post('/submit', submitLimiter, submissionUpload.single('pdf_file'), async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Please upload a PDF file.');
      return res.redirect('/submit');
    }
    const { author_name, email, title, abstract, type } = req.body;
    await supabase.from('submissions').insert([
      {
        author_name,
        email,
        title,
        abstract: abstract || '',
        pdf_file: req.file.path,
        type: type || 'journal'
      }
    ]);
    req.flash('success', 'Your work has been submitted successfully! We will review it and get back to you.');
    res.redirect('/submit');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Submission failed. Please try again.');
    res.redirect('/submit');
  }
});

module.exports = router;
