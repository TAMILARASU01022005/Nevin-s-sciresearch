// public/js/main.js — TamilArivu – International Journal of Tamil and Scientific Studies

document.addEventListener('DOMContentLoaded', () => {

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // ── Mobile Nav ──────────────────────────────────────────────────────────────
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', navLinks.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
      }
    });
  }

  // ── Scroll Progress Bar ─────────────────────────────────────────────────────
  const bar = document.createElement('div');
  bar.className = 'scroll-indicator';
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });

  // ── Intersection Observer Animations ────────────────────────────────────────
  const animateEls = document.querySelectorAll('.animate');
  if (animateEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    animateEls.forEach(el => observer.observe(el));
  }

  // ── Active Nav Link ─────────────────────────────────────────────────────────
  const navAs = document.querySelectorAll('.nav-links a, .journals-nav a');
  const path = window.location.pathname;
  navAs.forEach(a => {
    if (a.getAttribute('href') === path || (path.startsWith(a.getAttribute('href')) && a.getAttribute('href') !== '/')) {
      a.classList.add('active');
    }
  });

  // ── Flash auto-dismiss ──────────────────────────────────────────────────────
  document.querySelectorAll('.flash').forEach(el => {
    setTimeout(() => {
      el.style.transition = 'opacity 0.5s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 500);
    }, 5000);
  });

  // ── Confirm delete ──────────────────────────────────────────────────────────
  document.querySelectorAll('[data-confirm]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (!confirm(el.dataset.confirm || 'Are you sure?')) e.preventDefault();
    });
  });

  // ── Smooth scroll to anchor ─────────────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Language Switcher ────────────────────────────────────────────────────────
  const applyLanguage = (lang) => {
    document.body.classList.remove('lang-preference-en', 'lang-preference-ta');
    document.body.classList.add(`lang-preference-${lang}`);
    localStorage.setItem('tamilarivu_lang', lang);
    
    // Update label on all switcher buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.innerHTML = lang === 'ta' ? '<i data-lucide="globe" class="icon-inline"></i> தமிழ்' : '<i data-lucide="globe" class="icon-inline"></i> English';
    });
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  };

  const storedLang = localStorage.getItem('tamilarivu_lang') || 'en';
  applyLanguage(storedLang);

  document.body.addEventListener('click', (e) => {
    const langBtn = e.target.closest('.lang-btn');
    if (langBtn) {
      const currentLang = localStorage.getItem('tamilarivu_lang') || 'en';
      const nextLang = currentLang === 'ta' ? 'en' : 'ta';
      applyLanguage(nextLang);
      e.preventDefault();
    }
  });

});

