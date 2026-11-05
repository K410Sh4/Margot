/* Margot V1.12 | Navegação mobile auditada e corrigida.
 * Usa as ações já existentes do store.js; sem novo armazenamento de sacola/favoritos.
 * Menu funciona como diálogo modal somente em telas mobile.
 */
(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const get = id => document.getElementById(id);
    const header = document.querySelector('.site-header');
    const nav = get('main-nav');
    const toggle = get('menu-open');
    const backdrop = get('mobile-menu-backdrop');
    const closeButton = get('mobile-menu-close');
    const bar = get('mobile-bottom-nav');
    const searchInput = get('search-input');
    const searchAction = get('mobile-nav-search');
    const matchMobile = window.matchMedia('(max-width: 700px)');
    const account = get('account-open');

    if (!header || !nav || !toggle || !backdrop || !closeButton || !bar || !searchAction) return;

    const mobile = () => matchMobile.matches;
    const inertSnapshot = new Map();
    let menuOpen = false;
    let ticking = false;

    function setBackgroundInert(disabled) {
      if (disabled) {
        const exclusions = new Set([header, backdrop]);
        const background = [...document.body.children].filter(
          el => !exclusions.has(el) && el.tagName !== 'SCRIPT'
        );
        const headerMain = header.querySelector('.header-main');
        if (headerMain) background.push(headerMain);
        for (const el of background) {
          if (!inertSnapshot.has(el)) inertSnapshot.set(el, el.inert);
          el.inert = true;
        }
      } else {
        for (const [element, previous] of inertSnapshot) element.inert = previous;
        inertSnapshot.clear();
      }
    }

    function syncSearch() {
      const visible = mobile() && header.classList.contains('searching');
      searchAction.setAttribute('aria-pressed', String(visible));
      searchAction.classList.toggle('is-active', visible);
    }

    function syncMenu() {
      const opened = mobile() && nav.classList.contains('open');

      backdrop.hidden = !opened;
      document.body.classList.toggle('mobile-menu-open', opened);
      toggle.setAttribute('aria-expanded', String(opened));
      toggle.setAttribute('aria-label', opened ? 'Menu de categorias aberto' : 'Abrir menu');

      if (opened) {
        nav.setAttribute('role', 'dialog');
        nav.setAttribute('aria-modal', 'true');
        nav.setAttribute('aria-labelledby', 'mobile-menu-heading');
        nav.removeAttribute('aria-hidden');
        if (!menuOpen) {
          header.classList.remove('searching');
          setBackgroundInert(true);
          menuOpen = true;
          closeButton.focus({preventScroll: true});
        }
      } else {
        nav.removeAttribute('role');
        nav.removeAttribute('aria-modal');
        nav.removeAttribute('aria-labelledby');
        if (mobile()) nav.setAttribute('aria-hidden', 'true');
        else nav.removeAttribute('aria-hidden');
        if (menuOpen) {
          setBackgroundInert(false);
          menuOpen = false;
        }
      }
      syncSearch();
    }

    function closeMenu(restoreFocus = false) {
      const wasOpened = mobile() && nav.classList.contains('open');
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      syncMenu();
      if (restoreFocus && wasOpened) toggle.focus({preventScroll: true});
    }

    // store.js abre o menu alterando a classe; este observer gerencia o modal.
    const observeMenu = new MutationObserver(syncMenu);
    observeMenu.observe(nav, {attributes: true, attributeFilter: ['class']});
    const observeSearch = new MutationObserver(syncSearch);
    observeSearch.observe(header, {attributes: true, attributeFilter: ['class']});
    backdrop.addEventListener('click', () => closeMenu(true));
    closeButton.addEventListener('click', () => closeMenu(true));
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
    if (account) account.addEventListener('click', () => closeMenu());

    // Barra inferior usa os botões existentes do catálogo e drawer.
    function trigger(id) {
      const button = get(id);
      if (button) button.click();
    }
    searchAction.addEventListener('click', () => {
      closeMenu();
      trigger('search-open');
      syncSearch();
      if (header.classList.contains('searching') && searchInput) {
        searchInput.focus({preventScroll: true});
      } else {
        searchAction.focus({preventScroll: true});
      }
    });
    get('mobile-nav-favorites').addEventListener('click', () => {
      closeMenu();
      header.classList.remove('searching');
      syncSearch();
      trigger('favorites-open');
    });
    get('mobile-nav-cart').addEventListener('click', () => {
      closeMenu();
      header.classList.remove('searching');
      syncSearch();
      trigger('cart-open');
    });

    for (const id of ['mobile-nav-home', 'mobile-nav-categories']) {
      get(id).addEventListener('click', () => {
        closeMenu();
        header.classList.remove('searching');
        syncSearch();
      });
    }

    // Fechar busca ao tocar fora do campo evita que ela fique sobre as seções.
    document.addEventListener('pointerdown', event => {
      if (!mobile() || !header.classList.contains('searching')) return;
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('#search-form, #mobile-nav-search, #search-open')) return;
      header.classList.remove('searching');
      syncSearch();
    }, {passive: true});

    // Espelha contadores, sem persistência ou lógica de negócio duplicada.
    function mirrorCounts() {
      [
        ['favorite-count','mobile-favorites-count'],
        ['cart-count','mobile-cart-count']
      ].forEach(([originalId, mobileId]) => {
        const source = get(originalId), destination = get(mobileId);
        if (!source || !destination) return;
        destination.textContent = source.textContent.trim();
        destination.hidden = source.hidden || Number(source.textContent) <= 0;
      });
    }
    const countObserver = new MutationObserver(mirrorCounts);
    for (const id of ['favorite-count', 'cart-count']) {
      const el = get(id);
      if (el) {
        countObserver.observe(el, {
          childList: true, characterData: true, subtree: true,
          attributes: true, attributeFilter: ['hidden']
        });
      }
    }
    mirrorCounts();

    // Destaque preciso: apenas a seção atualmente visível, não todas as seguintes.
    function updateActive() {
      ticking = false;
      if (!mobile()) return;
      const collections = get('categorias');
      if (!collections) return;
      const top = collections.getBoundingClientRect().top + window.scrollY;
      const bottom = collections.getBoundingClientRect().bottom + window.scrollY;
      const marker = window.scrollY + header.getBoundingClientRect().height + 24;
      const homeActive = marker < top;
      const collectionsActive = marker >= top && marker < bottom;
      [
        ['mobile-nav-home', homeActive],
        ['mobile-nav-categories', collectionsActive]
      ].forEach(([id, selected]) => {
        const link = get(id);
        link.classList.toggle('is-active', selected);
        if (selected) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      syncSearch();
    }

    function queueActive() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateActive);
    }
    window.addEventListener('scroll', queueActive, {passive: true});
    window.addEventListener('resize', () => {
      if (!mobile()) closeMenu();
      syncMenu();
      queueActive();
    }, {passive: true});
    window.addEventListener('pageshow', queueActive);

    // Controle de foco do diálogo de categorias (teclado e leitores de tela).
    document.addEventListener('focusin', event => {
      if (menuOpen && !nav.contains(event.target)) {
        closeButton.focus({preventScroll: true});
      }
    });
    document.addEventListener('keydown', event => {
      if (!menuOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeMenu(true);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...nav.querySelectorAll('a[href],button:not([disabled])')]
        .filter(el => el.getClientRects().length && !el.inert);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }, true);

    syncMenu();
    updateActive();
    document.documentElement.classList.add('mobile-nav-ready');
  });
})();
