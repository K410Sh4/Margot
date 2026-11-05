/* Margot — redução progressiva do cabeçalho ao rolar.
 * Funciona independentemente de GSAP ou bibliotecas externas.
 */
(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');
    const menu = document.getElementById('menu-open');
    const nav = document.getElementById('main-nav');
    const search = document.getElementById('search-open');
    if (!header || !menu || !nav || !search) return;

    let compact = false;
    let pending = false;
    const desktop = () => window.matchMedia('(min-width: 701px)').matches;
    const closeMenu = () => {
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
    };
    function checkScroll() {
      pending = false;
      const y = window.scrollY || window.pageYOffset || 0;
      const next = compact ? y > 65 : y > 155;
      if (next === compact) return;
      compact = next;
      header.classList.toggle('is-compact', compact);
      document.documentElement.classList.toggle('has-compact-header', compact);
      if (compact || desktop()) closeMenu();
    }
    function update() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(checkScroll);
    }
    window.addEventListener('scroll', update, {passive: true});
    window.addEventListener('resize', update, {passive: true});
    window.addEventListener('pageshow', update);
    // store.js continua responsável pelo estado dos controles.
    menu.addEventListener('click', () => {
      if (nav.classList.contains('open')) header.classList.remove('searching');
    });
    search.addEventListener('click', () => {
      if (header.classList.contains('searching')) closeMenu();
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
    checkScroll();
  });
})();
