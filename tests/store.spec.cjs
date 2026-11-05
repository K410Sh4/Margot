const {test, expect} = require('@playwright/test');
const product = 'brinco-coracao';

async function ready(page) {
  await page.goto('/', {waitUntil: 'domcontentloaded'});
  await expect(page.locator('html')).toHaveClass(/mobile-nav-ready/);
}
async function catalog(page) {
  await page.locator('#product-grid').scrollIntoViewIfNeeded();
  await expect(page.locator('.product-card').first()).toBeVisible();
}
async function seed(page, value) {
  await page.addInitScript(value => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('margot-cart', JSON.stringify(value));
      sessionStorage.setItem('seeded', 'yes');
    }
  }, value);
}
async function openCart(page) {
  await page.locator('#mobile-nav-cart').click();
  await expect(page.locator('#drawer')).toHaveClass(/open/);
}

test.beforeEach(async ({page}) => {
  await page.route('https://www.gstatic.com/firebasejs/**', route => route.abort());
});

test('limite de 99 unidades permanece na sacola após adicionar e recarregar', async ({page}) => {
  await seed(page, {[product]: 99});
  await ready(page);
  await catalog(page);
  await page.locator(`[data-add="${product}"]`).click();
  await expect(page.locator('#toast')).toContainText('limite é de 99');
  await page.reload();
  await openCart(page);
  await expect(page.locator('.quantity span')).toHaveText('99');
  await expect(page.locator('.subtotal')).toContainText('1.475,10');
});

test('recupera quantidade 100 de versões antigas e descarta dados inválidos', async ({page}) => {
  await seed(page, {[product]: 100, desconhecido: 4, 'colar-perola': '2', 'anel-onda': -1});
  await ready(page);
  await openCart(page);
  await expect(page.locator('.drawer-item')).toHaveCount(1);
  await expect(page.locator('.quantity span')).toHaveText('99');
});

test('JSON corrompido e armazenamento indisponível não quebram a vitrine', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('margot-cart', '{');
    localStorage.setItem('margot-favorites', '{}');
    Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  await catalog(page);
  await page.locator(`[data-add="${product}"]`).click();
  await openCart(page);
  await expect(page.locator('.quantity span')).toHaveText('1');
  expect(errors).toEqual([]);
});

test('favoritar com teclado mantém foco e estado após recarga', async ({page}) => {
  await ready(page);
  const heart = page.locator(`[data-favorite="${product}"]`);
  await heart.scrollIntoViewIfNeeded();
  await expect(heart).toBeVisible();
  await heart.focus();
  await heart.press('Space');
  await expect(heart).toBeFocused();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
});

test('filtro mantém foco e histórico restaura a categoria', async ({page}) => {
  await ready(page);
  const filter = page.locator('[data-filter="Brincos"]');
  await filter.focus();
  await filter.press('Enter');
  await expect(filter).toBeFocused();
  await expect(page.locator('.product-card')).toHaveCount(3);
  await page.locator('[data-filter="Colares"]').click();
  await page.goBack();
  await expect(filter).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.product-card')).toHaveCount(3);
});

test('sacola bloqueia o fundo, mantém foco ao alterar quantidade e devolve ao atalho', async ({page}) => {
  await seed(page, {[product]: 1});
  await ready(page);
  await openCart(page);
  await expect(page.locator('#drawer-close')).toBeFocused();
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await expect(page.locator('#mobile-bottom-nav')).toHaveAttribute('inert', '');
  const plus = page.locator('[data-qty][data-delta="1"]');
  await plus.focus();
  await plus.press('Enter');
  await expect(plus).toBeFocused();
  await expect(page.locator('.quantity span')).toHaveText('2');
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-nav-cart')).toBeFocused();
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  await page.locator('#menu-open').click();
  await expect(page.locator('#mobile-menu-close')).toBeFocused();
});

test('remover a última peça mantém foco dentro do painel vazio', async ({page}) => {
  await seed(page, {[product]: 1});
  await ready(page);
  await openCart(page);
  await page.locator('[data-remove]').focus();
  await page.locator('[data-remove]').press('Enter');
  await expect(page.locator('.drawer-empty')).toContainText('vazia');
  await expect(page.locator('#drawer-close')).toBeFocused();
});

for (const mode of ['clipboard', 'fallback', 'denied', 'failed']) {
  test(`copiar lista trata o caminho ${mode} sem erro não capturado`, async ({page}) => {
    await seed(page, {[product]: 2});
    await page.addInitScript(mode => {
      window.copiedText = null;
      Object.defineProperty(navigator, 'clipboard', {configurable: true, value:
        mode === 'fallback' || mode === 'failed' ? undefined : {
          writeText: async text => {
            if (mode === 'denied') throw new DOMException('Denied', 'NotAllowedError');
            window.copiedText = text;
          }
        }
      });
      document.execCommand = () => {
        if (mode === 'failed') throw new Error('Clipboard unavailable');
        window.copiedText = document.activeElement.value;
        return true;
      };
    }, mode);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await ready(page);
    await openCart(page);
    await page.locator('#copy-order').focus();
    await page.locator('#copy-order').press('Enter');
    await expect(page.locator('#toast')).toContainText(mode === 'failed' ? 'Não foi possível copiar' : 'Lista copiada');
    await expect(page.locator('#drawer textarea')).toHaveCount(0);
    await expect(page.locator('#copy-order')).toBeFocused();
    if (mode !== 'failed') {
      expect(await page.evaluate(() => window.copiedText)).toContain('2 un.');
      expect(await page.evaluate(() => window.copiedText)).toContain('29,80');
    }
    expect(errors).toEqual([]);
  });
}

test('buscar e sair com Escape restaura foco no atalho mobile', async ({page}) => {
  await ready(page);
  await page.locator('#mobile-nav-search').click();
  await page.locator('#search-input').fill('zzzz-sem-produto');
  await expect(page.locator('#empty-results')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#search-input')).toBeHidden();
  await expect(page.locator('#mobile-nav-search')).toBeFocused();
});

test('catálogo e presentes aparecem com GSAP real após rolagem e recarga com hash', async ({page}) => {
  await ready(page);
  expect(await page.evaluate(() => window.gsap?.version)).toBe('3.15.0');
  await page.locator('#mobile-nav-categories').click();
  await expect(page.locator('.category-card').first()).toBeVisible();
  await page.locator('.category-card').first().click();
  await expect(page.locator('.product-card').first()).toBeVisible();
  await expect(page.locator('.product-card').first()).toHaveCSS('opacity', '1');
  await page.reload();
  await expect(page.locator('.product-card').first()).toBeVisible();
  await expect(page.locator('.product-card').first()).toHaveCSS('opacity', '1');
  await page.locator('.footer a[href="#presentes"]').click();
  await expect(page.locator('#gift-title')).toBeVisible();
  await expect(page.locator('#gift-title')).toHaveCSS('opacity', '1');
});

test('vitrine continua utilizável se as bibliotecas de animação falharem', async ({page}) => {
  await page.route('**/vendor/gsap/**', route => route.abort());
  await ready(page);
  await catalog(page);
  await page.locator(`[data-add="${product}"]`).click();
  await openCart(page);
  await expect(page.locator('.quantity span')).toHaveText('1');
});

test('pausa do carrossel é persistente e setas não deixam foco em slide inerte', async ({page}) => {
  await ready(page);
  const rotation = page.locator('#hero-rotation');
  if ((await rotation.textContent()) === 'Pausar') await rotation.click();
  await expect(rotation).toHaveText('Reproduzir');
  await page.clock.install();
  await page.locator('#account-open').focus();
  await page.clock.fastForward(14000);
  await expect(page.locator('.hero-slide').first()).toHaveClass(/is-active/);
  await page.locator('.hero-slide.is-active .button').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.hero-slide').nth(1)).toHaveClass(/is-active/);
  await expect(page.locator('.hero-next')).toBeFocused();
});

test('falha do SDK é informada e clique no espaço interno não fecha a conta', async ({page}) => {
  await ready(page);
  await page.locator('#account-open').click();
  await expect(page.locator('#account-auth-status')).toContainText('não pôde ser carregado');
  await page.locator('#account-dialog').click({position: {x: 25, y: 25}});
  await expect(page.locator('#account-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#account-open')).toBeFocused();
});

test('painel em paisagem permite alcançar itens e rodapé sem overflow horizontal', async ({page}) => {
  await page.setViewportSize({width: 667, height: 320});
  await seed(page, {[product]: 2, 'colar-perola': 1});
  await ready(page);
  await openCart(page);
  await page.locator('#copy-order').scrollIntoViewIfNeeded();
  await expect(page.locator('#copy-order')).toBeInViewport();
  await page.locator('[data-qty]').first().scrollIntoViewIfNeeded();
  await expect(page.locator('[data-qty]').first()).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('navegação e sacola permanecem funcionais no desktop', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 900});
  await ready(page);
  await page.locator('#search-input').fill('pérola');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await catalog(page);
  await page.locator('[data-add]').click();
  await page.locator('#cart-open').click();
  await expect(page.locator('.quantity span')).toHaveText('1');
  await page.locator('#drawer-close').click();
  await expect(page.locator('#cart-open')).toBeFocused();
});
