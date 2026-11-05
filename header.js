/* Margot V1.17 — estado reversível do cabeçalho, sem dimensões inline. */
(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const root = document.documentElement;
    const nav = document.getElementById('main-nav');
    const compactAt = 155;
    const expandedAt = 72;
    const directionDistance = 18;
    let lastY = Math.max(0, window.scrollY || 0);
    let direction = 0;
    let turningPoint = lastY;
    let compact = false;
    let pending = false;
    let forceNext = false;

    function reconcile(force = false) {
      const y = Math.max(0, window.scrollY || window.pageYOffset || 0);
      const delta = y - lastY;
      const newDirection = delta > 1 ? 1 : delta < -1 ? -1 : direction;
      if (newDirection !== direction) {
        turningPoint = lastY;
        direction = newDirection;
      }
      lastY = y;

      let next = compact;
      if (force) {
        // Reidratação, rotação e pageshow: resultado determinístico.
        next = y >= compactAt;
        turningPoint = y;
        direction = 0;
      } else if (y <= expandedAt) {
        next = false;
      } else if (direction < 0 && turningPoint - y >= directionDistance) {
        // Ao subir, restaura sem exigir retorno ao topo.
        next = false;
      } else if (direction > 0 && y >= compactAt && y - turningPoint >= directionDistance) {
        next = true;
      }

      // Mantém HTML e cabeçalho sincronizados mesmo após restaurar do cache.
      const wasCompact = compact;
      compact = next;
      header.classList.toggle('is-compact', compact);
      root.classList.toggle('has-compact-header', compact);

      if (wasCompact && !compact && window.matchMedia('(min-width: 701px)').matches) {
        nav?.classList.remove('open');
        header.classList.remove('searching');
      }
    }

    function schedule(force = false) {
      forceNext = forceNext || force;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const reset = forceNext;
        forceNext = false;
        reconcile(reset);
      });
    }

    window.addEventListener('scroll', () => schedule(), {passive: true});
    window.addEventListener('resize', () => schedule(true), {passive: true});
    window.addEventListener('pageshow', () => schedule(true));
    reconcile(true);
  });
})();
