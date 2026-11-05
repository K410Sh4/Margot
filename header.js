/* Margot V1.20 — estados de cabeçalho estáveis para desktop e mobile.
 * Não reagir a inversões de scroll induzidas pelo redimensionamento do próprio header.
 */
(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const root = document.documentElement;
    const nav = document.getElementById('main-nav');
    const desktopQuery = window.matchMedia('(min-width: 701px)');
    const compactAt = 155;
    const expandedAt = 72;
    const mobileTravel = 18;
    const desktopUpTravel = 80;
    const desktopDownTravel = 100;
    const desktopSettleMs = 480;

    let compact = false;
    let lastY = Math.max(0, window.scrollY || 0);
    let desktop = desktopQuery.matches;
    let direction = 0;
    let turningPoint = lastY;
    let settleUntil = 0;
    let pending = false;
    let forceNext = false;

    function resetTracking(y) {
      lastY = y;
      turningPoint = y;
      direction = 0;
    }

    function setCompact(next, y, force = false) {
      const changed = compact !== next;
      compact = next;
      if (!changed && !force) return;
      header.classList.toggle('is-compact', compact);
      root.classList.toggle('has-compact-header', compact);

      if (changed && desktop) {
        // Cabeçalho desktop muda sua altura de layout: ignorar scroll induzido por reflow.
        settleUntil = performance.now() + desktopSettleMs;
      }

      if (changed && !compact && desktop) {
        // O dropdown só existe enquanto o desktop está compacto.
        nav?.classList.remove('open');
        header.classList.remove('searching');
      }
      if (changed) resetTracking(y);
    }

    function reconcile(force = false) {
      const y = Math.max(0, window.scrollY || window.pageYOffset || 0);
      const isDesktop = desktopQuery.matches;
      const crossedBreakpoint = desktop !== isDesktop;
      desktop = isDesktop;

      if (force || crossedBreakpoint) {
        // Reidratação e troca de template: reconciliar uma vez, sem reiniciar animações.
        settleUntil = 0;
        resetTracking(y);
        setCompact(y >= compactAt, y, true);
        return;
      }

      if (y <= expandedAt) {
        // Retornar ao início sempre restaura o header, mesmo durante a proteção.
        setCompact(false, y);
        resetTracking(y);
        return;
      }

      if (isDesktop && performance.now() < settleUntil) {
        // Refluxo do sticky/scroll anchoring não constitui intenção de usuário.
        resetTracking(y);
        return;
      }

      const delta = y - lastY;
      if (delta > 1 || delta < -1) {
        const newDirection = delta > 0 ? 1 : -1;
        if (newDirection !== direction) {
          direction = newDirection;
          turningPoint = lastY;
        }
      }
      lastY = y;

      if (isDesktop) {
        if (compact && direction < 0 && turningPoint - y >= desktopUpTravel) {
          setCompact(false, y);
        } else if (!compact && direction > 0 &&
                   y >= compactAt && y - turningPoint >= desktopDownTravel) {
          setCompact(true, y);
        }
      } else {
        // Preservar a resposta rápida do mobile: sua geometria é invariável.
        if (compact && direction < 0 && turningPoint - y >= mobileTravel) {
          setCompact(false, y);
        } else if (!compact && direction > 0 &&
                   y >= compactAt && y - turningPoint >= mobileTravel) {
          setCompact(true, y);
        }
      }
    }

    function schedule(force = false) {
      forceNext = forceNext || force;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const force = forceNext;
        forceNext = false;
        reconcile(force);
      });
    }

    window.addEventListener('scroll', () => schedule(), {passive: true});
    // Resize dentro do mesmo breakpoint NÃO reinicializa os estados.
    window.addEventListener('resize', () => schedule(), {passive: true});
    desktopQuery.addEventListener('change', () => schedule(true));
    window.addEventListener('pageshow', () => schedule(true));
    reconcile(true);
  });
})();
