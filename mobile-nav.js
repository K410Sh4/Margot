/* Margot | Navegação mobile V1.11: atalhos, menu e estados acessíveis.
 * Reutiliza controles do store.js, sem duplicar filtros ou lógica de sacola.
 */
(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const byId = id => document.getElementById(id);
    const header = document.querySelector('.site-header');
    const nav = byId('main-nav');
    const menu = byId('menu-open');
    const backdrop = byId('mobile-menu-backdrop');
    const closeButton = byId('mobile-menu-close');
    const bar = byId('mobile-bottom-nav');
    const input = byId('search-input');
    const mq = window.matchMedia('(max-width: 700px)');
    if (!header || !nav || !menu || !backdrop || !closeButton || !bar) return;

    const isMobile = () => mq.matches;
    function menuIsOpen() { return isMobile() && nav.classList.contains('open'); }

    function closeMenu(restoreFocus = false) {
      if (!nav.classList.contains('open')) return;
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
      if (restoreFocus && isMobile()) menu.focus({preventScroll: true});
    }

    function updateMenuState() {
      const opened = menuIsOpen();
      backdrop.hidden = !opened;
      document.body.classList.toggle('mobile-menu-open', opened);
      menu.setAttribute('aria-label', opened ? 'Fechar menu' : 'Abrir menu');
      if (opened) {
        // Busca e menu não devem aparecer abertos simultaneamente.
        header.classList.remove('searching');
        closeButton.focus({preventScroll: true});
      }
    }

    const menuObserver = new MutationObserver(updateMenuState);
    menuObserver.observe(nav, {attributes:true, attributeFilter:['class']});
    backdrop.addEventListener('click', () => closeMenu(true));
    closeButton.addEventListener('click', () => closeMenu(true));

    // O script original dispara os mesmos eventos de busca, sacola e favoritos.
    function tap(id) {
      const button = byId(id);
      if (button) button.click();
    }
    byId('mobile-nav-search').addEventListener('click', () => {
      closeMenu();
      tap('search-open');
      const open = header.classList.contains('searching');
      byId('mobile-nav-search').setAttribute('aria-pressed', String(open));
      if (open && input) input.focus({preventScroll:true});
      else byId('mobile-nav-search').focus({preventScroll:true});
    });
    byId('mobile-nav-favorites').addEventListener('click', () => {
      closeMenu();
      header.classList.remove('searching');
      tap('favorites-open');
    });
    byId('mobile-nav-cart').addEventListener('click', () => {
      closeMenu();
      header.classList.remove('searching');
      tap('cart-open');
    });
    [byId('mobile-nav-home'),byId('mobile-nav-categories')].forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
        header.classList.remove('searching');
        byId('mobile-nav-search').setAttribute('aria-pressed','false');
      });
    });

    // Espelha os mesmos contadores que a vitrine já atualiza, sem armazenamento duplicado.
    function syncCounts() {
      [
        ['favorite-count', 'mobile-favorites-count'],
        ['cart-count', 'mobile-cart-count']
      ].forEach(([from, to]) => {
        const origin = byId(from), target = byId(to);
        if (!origin || !target) return;
        target.textContent = origin.textContent.trim();
        target.hidden = origin.hidden || Number(origin.textContent) === 0;
      });
    }
    const countObserver = new MutationObserver(syncCounts);
    ['favorite-count','cart-count'].forEach(id => {
      const source = byId(id);
      if(source) countObserver.observe(source, {childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});
    });
    syncCounts();

    // Indicador da seção: mostra onde a pessoa está navegando.
    let pending = false;
    function updateLocation() {
      pending = false;
      const categories = byId('categorias');
      if (!categories || !isMobile()) return;
      const sectionOffset = categories.getBoundingClientRect().top;
      const onCollections = sectionOffset < window.innerHeight * .55;
      [['mobile-nav-home',!onCollections],['mobile-nav-categories',onCollections]].forEach(([id,active]) => {
        const el=byId(id);
        el.classList.toggle('is-active',active);
        if(active) el.setAttribute('aria-current','location');
        else el.removeAttribute('aria-current');
      });
      byId('mobile-nav-search').setAttribute('aria-pressed',String(header.classList.contains('searching')));
    }
    function queueLocation() {
      if(pending)return;
      pending=true;
      requestAnimationFrame(updateLocation);
    }
    window.addEventListener('scroll',queueLocation,{passive:true});
    window.addEventListener('resize',()=>{
      if(!isMobile())closeMenu();
      updateMenuState();
      queueLocation();
    },{passive:true});
    window.addEventListener('pageshow',queueLocation);
    updateLocation();
    updateMenuState();

    // Fechamento por teclado e contenção do foco enquanto o menu móvel está aberto.
    document.addEventListener('keydown', event => {
      if (!menuIsOpen()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeMenu(true);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = [...nav.querySelectorAll('a[href],button:not([disabled])')].filter(el=>el.getClientRects().length);
      if (!focusables.length) return;
      const first=focusables[0],last=focusables[focusables.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus()}
    }, true);
  });
})();
