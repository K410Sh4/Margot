const {defineConfig} = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  timeout: 35000,
  expect: {timeout: 8000},
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    viewport: {width: 390, height: 844},
    hasTouch: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: ['chromium', 'webkit', 'firefox'].flatMap(browserName =>
    ['reduce', 'no-preference'].map(reducedMotion => ({
      name: `${browserName}-${reducedMotion}`,
      use: {browserName, reducedMotion, isMobile: browserName !== 'firefox'}
    }))
  ),
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory dist',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
