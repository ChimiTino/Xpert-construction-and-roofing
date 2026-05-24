/* ============================================================
   XPERT CONSTRUCTION & ROOFING — Main JavaScript
   ============================================================ */

/* ──────────────────────────────────────────────────────────
   EMAIL CONFIG — Web3Forms (, no monthly limits)
   
   HOW TO ACTIVATE IN 3 STEPS:
   1. Go to https://web3forms.com/
   2. Enter: services@xpertconstruction.co.za  → click "Create Access Key"
   3. Check your inbox, copy the key, paste it below replacing YOUR_ACCESS_KEY_HERE
   ────────────────────────────────────────────────────────── */
const WEB3FORMS_KEY = 'a43d129f-4120-4a1d-b5f6-31dfbcb8cbfc';

/* ──────────────────────────────────────────────────────────
   Navbar: scroll shadow
   ────────────────────────────────────────────────────────── */
(function () {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
})();

/* ──────────────────────────────────────────────────────────
   Hamburger mobile menu
   ────────────────────────────────────────────────────────── */
(function () {
  const btn   = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;

  function closeMenu() {
    links.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }

  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    const spans = btn.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      closeMenu();
    }
  });

  links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', e => {
    if (!btn.closest('nav').contains(e.target)) closeMenu();
  });
})();

/* ──────────────────────────────────────────────────────────
   Scroll fade-in animations
   ────────────────────────────────────────────────────────── */
(function () {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));
})();

/* ──────────────────────────────────────────────────────────
   Smooth in-page anchor scrolling
   ────────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    }
  });
});

/* ──────────────────────────────────────────────────────────
   Quote Form — real email via Web3Forms
   ────────────────────────────────────────────────────────── */
(function () {
  const form    = document.getElementById('quoteForm');
  const success = document.getElementById('formSuccess');
  const errBox  = document.getElementById('formError');
  if (!form) return;

  /* ── Field validation ── */
  function validate() {
    let ok = true;
    form.querySelectorAll('[required]').forEach(f => {
      f.classList.remove('field-error');
      if (!f.value.trim()) { f.classList.add('field-error'); ok = false; }
    });
    const email = form.querySelector('#email');
    if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.classList.add('field-error'); ok = false;
    }
    if (!ok) {
      const first = form.querySelector('.field-error');
      if (first) { first.focus(); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
    return ok;
  }

  /* ── Clear error highlight on change ── */
  form.querySelectorAll('input, select, textarea').forEach(f => {
    f.addEventListener('input', () => f.classList.remove('field-error'));
  });

  /* ── Submit ── */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validate()) return;

    const btn = form.querySelector('.form-submit');
    const btnOriginal = btn.innerHTML;

    /* Loading state */
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        style="animation:spin .8s linear infinite">
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/>
        <path d="M21 12a9 9 0 00-9-9"/>
      </svg>
      Sending…`;

    if (errBox) errBox.style.display = 'none';

    /* Check key is configured */
    if (!WEB3FORMS_KEY || WEB3FORMS_KEY === 'YOUR_ACCESS_KEY_HERE') {
      showError('⚠️ Email not yet configured. Please follow the setup steps in js/main.js to activate form submissions.');
      resetBtn(btn, btnOriginal);
      return;
    }

    /* Build payload */
    const data = {
      access_key:  WEB3FORMS_KEY,
      subject:     `New Quote Request — ${form.querySelector('#service')?.value || 'General Enquiry'}`,
      from_name:   `${form.querySelector('#firstName')?.value || ''} ${form.querySelector('#lastName')?.value || ''}`.trim(),
      email:       form.querySelector('#email')?.value || '',
      phone:       form.querySelector('#phone')?.value || '',
      region:      form.querySelector('#region')?.value || '',
      service:     form.querySelector('#service')?.value || '',
      message:     form.querySelector('#message')?.value || '(No message provided)',
      botcheck:    ''   /* honeypot */
    };

    try {
      const res  = await fetch('https://api.web3forms.com/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify(data)
      });
      const json = await res.json();

      if (json.success) {
        form.style.display   = 'none';
        if (success) {
          success.style.display = 'block';
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        showError(json.message || 'Something went wrong. Please try again or call us directly.');
        resetBtn(btn, btnOriginal);
      }
    } catch (err) {
      showError('Network error — please check your connection and try again, or call +27 724 071 496.');
      resetBtn(btn, btnOriginal);
    }
  });

  function showError(msg) {
    if (errBox) {
      errBox.querySelector('.error-msg').textContent = msg;
      errBox.style.display = 'block';
      errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      alert(msg);
    }
  }

  function resetBtn(btn, original) {
    btn.disabled = false;
    btn.innerHTML = original;
  }
})();

/* Spin animation for loading state */
const spinStyle = document.createElement('style');
spinStyle.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .field-error { border-color: #e53935 !important; box-shadow: 0 0 0 3px rgba(229,57,53,.12) !important; }
`;
document.head.appendChild(spinStyle);
