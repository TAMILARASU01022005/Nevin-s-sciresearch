// middleware/auth.js
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId === 1) {
    return next();
  }
  req.flash('error', 'Please log in to access the admin panel.');
  res.redirect('/tamil-literature/admin/login');
}

module.exports = { requireAdmin };
