/* Margot Acessórios | V1.5
 * Motion progressivo: GSAP 3.15 + ScrollTrigger.
 * Se o CDN falhar, toda a vitrine permanece visível e utilizável.
 */
(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);
    const motion = gsap.matchMedia();

    motion.add('(prefers-reduced-motion: no-preference)', () => {
      const cleanup = [];
      const on = (el, type, handler, options) => {
        if (!el) return;
        el.addEventListener(type, handler, options);
        cleanup.push(() => el.removeEventListener(type, handler, options));
      };
      const watched = (el, callback, options) => {
        if (!el) return;
        const observer = new MutationObserver(callback);
        observer.observe(el, options);
        cleanup.push(() => observer.disconnect());
      };
      const reveal = (targets, trigger, opts = {}) => {
        const elements = gsap.utils.toArray(targets);
        if (!elements.length) return;
        return gsap.from(elements, {
          y: opts.y ?? 20,
          autoAlpha: 0,
          duration: opts.duration ?? 0.65,
          stagger: opts.stagger ?? 0,
          ease: 'power2.out',
          clearProps: 'transform,opacity,visibility',
          scrollTrigger: { trigger, start: 'top 88%', once: true }
        });
      };

      // Uma entrada leve: sem esconder conteúdo no HTML/CSS antes de carregar o GSAP.
      gsap.from('.header-main .brand', {
        y: -9, autoAlpha: 0, duration: 0.7, ease: 'power2.out',
        clearProps: 'transform,opacity,visibility'
      });
      if (window.matchMedia('(min-width: 701px)').matches) {
        gsap.from('.main-nav a', {
          y: -7, autoAlpha: 0, stagger: 0.045, duration: 0.47,
          delay: 0.16, ease: 'power2.out', clearProps: 'transform,opacity,visibility'
        });
      }

      // Carrossel existente: anima somente o texto ativo, não mexe na troca de slides.
      const hero = document.querySelector('.hero-carousel');
      if (hero) {
        let lastSlide = null;
        const enterSlide = () => {
          const active = hero.querySelector('.hero-slide.is-active');
          if (!active || active === lastSlide) return;
          if (lastSlide) gsap.killTweensOf(lastSlide.querySelectorAll('.hero-copy > *'));
          lastSlide = active;
          const contents = active.querySelectorAll('.hero-copy > *');
          gsap.fromTo(contents,
            { y: 17, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, stagger: 0.085, duration: 0.64,
              ease: 'power2.out', overwrite: 'auto', clearProps: 'transform,opacity,visibility' }
          );
        };
        enterSlide();
        watched(hero.querySelector('.hero-slides'), enterSlide, {
          attributes: true, attributeFilter: ['class'], subtree: true
        });
      }

      reveal('.benefit-grid > div', '.benefits', { y: 16, stagger: 0.07, duration: 0.54 });
      reveal('#categorias .section-heading', '#categorias', { y: 16 });
      reveal('.category-card-photo', '#category-grid', { y: 25, stagger: 0.075, duration: 0.63 });
      reveal('#produtos .section-heading', '#produtos', { y: 16 });

      // O catálogo é recriado por filtros e pesquisa: anima cada nova lista sem acumular triggers.
      const grid = document.getElementById('product-grid');
      let productTween = null;
      const animateProducts = () => {
        if (productTween) {
          if (productTween.scrollTrigger) productTween.scrollTrigger.kill();
          productTween.kill();
        }
        if (!grid) return;
        const cards = Array.from(grid.querySelectorAll('.product-card'));
        if (!cards.length) return;
        productTween = gsap.from(cards, {
          y: 21, autoAlpha: 0, duration: 0.48,
          stagger: Math.min(0.065, 0.4 / cards.length), ease: 'power2.out',
          clearProps: 'transform,opacity,visibility',
          scrollTrigger: { trigger: grid, start: 'top 93%', once: true }
        });
      };
      if (grid) {
        animateProducts();
        watched(grid, animateProducts, { childList: true });
      }

      // Feedback sutil para mouse e teclado; não depende de hover em telas sensíveis ao toque.
      if (grid && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const locate = event => event.target.closest('.product-card');
        const enterCard = event => {
          const card = locate(event);
          if (!card || card.contains(event.relatedTarget)) return;
          gsap.to(card, { y: -5, duration: 0.22, overwrite: 'auto', ease: 'power2.out' });
        };
        const leaveCard = event => {
          const card = locate(event);
          if (!card || card.contains(event.relatedTarget)) return;
          gsap.to(card, { y: 0, duration: 0.28, overwrite: 'auto', ease: 'power2.out' });
        };
        on(grid, 'mouseover', enterCard);
        on(grid, 'mouseout', leaveCard);
      }
      if (grid) {
        on(grid, 'click', event => {
          const button = event.target.closest('[data-add]');
          if (!button) return;
          gsap.fromTo(button, { scale: 1 }, {
            scale: 1.1, duration: 0.14, yoyo: true, repeat: 1,
            overwrite: 'auto', clearProps: 'transform', ease: 'power1.out'
          });
        });
      }

      reveal('.gift-copy > *', '#presentes', { y: 20, stagger: 0.07, duration: 0.7 });
      const giftPhoto = document.querySelector('.gift-photo');
      if (giftPhoto) {
        gsap.from(giftPhoto, {
          scale: 1.045, duration: 1.15, ease: 'power1.out',
          clearProps: 'transform',
          scrollTrigger: { trigger: '#presentes', start: 'top 89%', once: true }
        });
      }
      // Assinatura da marca permanece visível sem depender do ScrollTrigger.
      // Rodapé deliberadamente estático: evita conteúdo invisível após saltos/refresh.

      // O menu e o drawer preservam toda sua lógica original, só animamos o conteúdo.
      const navigation = document.getElementById('main-nav');
      watched(navigation, () => {
        if (navigation?.classList.contains('open')) {
          gsap.fromTo(navigation.querySelectorAll('a'),
            { y: -6, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, stagger: 0.035, duration: 0.25,
              ease: 'power2.out', clearProps: 'transform,opacity,visibility' }
          );
        }
      }, { attributes: true, attributeFilter: ['class'] });
      const drawer = document.getElementById('drawer');
      watched(drawer, () => {
        if (drawer?.classList.contains('open')) {
          gsap.fromTo(drawer.querySelectorAll('.drawer-header > *'),
            { y: 9, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.3,
              ease: 'power2.out', clearProps: 'transform,opacity,visibility' }
          );
        }
      }, { attributes: true, attributeFilter: ['class'] });

      return () => {
        cleanup.forEach(dispose => dispose());
        if (productTween) {
          productTween.scrollTrigger?.kill();
          productTween.kill();
        }
        // Ao ativar movimento reduzido, não deixar estilos transitórios ocultando peças.
        gsap.set(document.querySelectorAll('.hero-copy > *, .product-card, .category-card-photo'), {
          clearProps: 'transform,opacity,visibility'
        });
      };
    });
  });
})();