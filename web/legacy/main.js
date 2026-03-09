/* main.js — Источник landing page interactions (v2) */
(function () {
  'use strict';

  /* ─── Smooth scroll for anchor links ─── */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href === '#') return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        // Close mobile nav if open
        closeMobileNav();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ─── Mobile menu ─── */
  var menuBtn = document.getElementById('mobile-menu-btn');
  var mobileNav = document.getElementById('mobile-nav');

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      var isOpen = mobileNav.classList.contains('open');
      if (isOpen) {
        closeMobileNav();
      } else {
        mobileNav.classList.add('open');
        menuBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMobileNav();
      });
    });
  }

  function closeMobileNav() {
    if (mobileNav) mobileNav.classList.remove('open');
    if (menuBtn) menuBtn.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ─── Intersection Observer for scroll animations ─── */
  if ('IntersectionObserver' in window) {
    var animateElements = document.querySelectorAll('[data-animate]');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    animateElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show all
    document.querySelectorAll('[data-animate]').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ─── Header active link highlight on scroll ─── */
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.header-nav a[href^="#"]');

  if (sections.length > 0 && navLinks.length > 0) {
    var lastActiveId = '';
    window.addEventListener('scroll', function () {
      var scrollPos = window.scrollY + 100;
      var currentId = '';

      sections.forEach(function (section) {
        if (section.offsetTop <= scrollPos) {
          currentId = section.getAttribute('id');
        }
      });

      if (currentId !== lastActiveId) {
        lastActiveId = currentId;
        navLinks.forEach(function (link) {
          if (link.getAttribute('href') === '#' + currentId) {
            link.style.color = 'var(--color-text-primary)';
          } else {
            link.style.color = '';
          }
        });
      }
    }, { passive: true });
  }
})();
