// routes/journals.js
const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

router.get('/', async (req, res) => {
  const { data: journals } = await supabase
    .from('journals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8);
  res.render('journals/home', { title: 'Academic Journals', journals: journals || [] });
});

router.get('/about', (req, res) => {
  res.render('journals/about', { title: 'About — Academic Journals' });
});

router.get('/editorial-team', async (req, res) => {
  const { data: team } = await supabase
    .from('editorial_team')
    .select('*')
    .order('display_order', { ascending: true });
  res.render('journals/editorial', { title: 'Editorial Team', team: team || [] });
});

router.get('/articles', async (req, res) => {
  const { q } = req.query;
  let builder = supabase.from('journals').select('*');
  if (q) {
    builder = builder.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
  }
  const { data: journals } = await builder.order('created_at', { ascending: false });
  
  const { data: categoriesData } = await supabase
    .from('journals')
    .select('category');
  
  const uniqueCategories = [...new Set((categoriesData || []).map(item => item.category).filter(Boolean))];
  const categories = uniqueCategories.map(cat => ({ category: cat }));

  res.render('journals/articles', { title: 'Articles', journals: journals || [], categories, q: q || '' });
});

router.get('/contact', (req, res) => {
  res.render('journals/contact', { title: 'Contact — Academic Journals' });
});

module.exports = router;
