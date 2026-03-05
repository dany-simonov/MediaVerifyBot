/* auth.js — Authentication modal for Источник platform (v0.5.0) */
(function () {
  'use strict';

  function initAuth() {
    var modal = document.getElementById('auth-modal');
    var loginBtn = document.getElementById('login-btn');
    var mobileLoginBtn = document.getElementById('mobile-login-btn');
    var closeBtn = document.getElementById('auth-close');

    if (!modal || !loginBtn) return;

    /* ── Open modal ── */
    function openModal() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      /* Close mobile nav if open */
      var mobileNav = document.getElementById('mobile-nav');
      var menuBtn = document.getElementById('mobile-menu-btn');
      if (mobileNav) mobileNav.classList.remove('open');
      if (menuBtn) menuBtn.classList.remove('active');
    }

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    loginBtn.addEventListener('click', openModal);
    if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', openModal);

    /* ── Close modal ── */
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    /* ── Tab switching ── */
    var tabs = modal.querySelectorAll('.auth-tab');
    var contents = modal.querySelectorAll('.auth-content');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var targetTab = this.getAttribute('data-tab');
        tabs.forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        contents.forEach(function (c) {
          c.style.display = c.id === 'auth-' + targetTab ? 'block' : 'none';
        });
      });
    });

    /* ── Form submission (register / login) ── */
    var form = document.getElementById('auth-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = document.getElementById('auth-email-input').value.trim();
        var password = document.getElementById('auth-password-input').value;
        if (!email || !password) return;

        var submitBtn = form.querySelector('.auth-submit');
        var originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '...';

        var apiBase = (window.ISTOCHNIK_CONFIG && window.ISTOCHNIK_CONFIG.apiBase) || '';

        /* Try login first, fallback to register */
        fetch(apiBase + '/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password }),
        })
          .then(function (res) {
            if (res.ok) return res.json();
            /* If login fails, attempt register */
            return fetch(apiBase + '/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email, password: password }),
            }).then(function (r) { return r.json(); });
          })
          .then(function (data) {
            if (data && data.access_token) {
              localStorage.setItem('istochnik_token', data.access_token);
              closeModal();
              updateLoginState(data.email || email);
            } else {
              var msg = data && data.detail ? data.detail : 'Ошибка авторизации';
              showAuthError(msg);
            }
          })
          .catch(function () {
            /* API not available — demo mode: just close */
            closeModal();
          })
          .finally(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          });
      });
    }

    /* ── Telegram login button (placeholder) ── */
    var tgLoginBtn = modal.querySelector('.btn-telegram-login');
    if (tgLoginBtn) {
      tgLoginBtn.addEventListener('click', function () {
        window.open('https://t.me/MediaVerifyBot?start=web_auth', '_blank');
      });
    }

    /* ── Check stored token on load ── */
    var token = localStorage.getItem('istochnik_token');
    if (token) {
      updateLoginState();
    }
  }

  function showAuthError(msg) {
    var errEl = document.getElementById('auth-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id = 'auth-error';
      errEl.className = 'auth-error';
      var form = document.getElementById('auth-form');
      if (form) form.parentNode.insertBefore(errEl, form);
    }
    errEl.textContent = msg;
    errEl.style.display = 'block';
    setTimeout(function () { errEl.style.display = 'none'; }, 4000);
  }

  function updateLoginState(email) {
    var loginBtn = document.getElementById('login-btn');
    if (!loginBtn) return;

    if (email) {
      loginBtn.textContent = email.split('@')[0];
      loginBtn.classList.add('logged-in');
    } else {
      /* Try to decode token for email — fallback to icon */
      loginBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>';
      loginBtn.classList.add('logged-in');
    }
  }

  /* Init on DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})();
