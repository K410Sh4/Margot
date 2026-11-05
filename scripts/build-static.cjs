'use strict';
const {cpSync, mkdirSync, rmSync} = require('node:fs');
const {resolve} = require('node:path');
const root = resolve(__dirname, '..');
const destination = resolve(root, 'dist');
const files = [
  'index.html', 'privacidade.html', 'styles.css', 'mobile-navigation.css',
  'store.js', 'carousel.js', 'motion.js', 'header.js', 'mobile-nav.js',
  'firebase-config.js', 'account.js', 'assets', 'vendor'
];
rmSync(destination, {recursive: true, force: true});
mkdirSync(destination, {recursive: true});
for (const file of files) cpSync(resolve(root, file), resolve(destination, file), {recursive: true});
console.log('Vitrine preparada em dist/; testes, dependências e documentos não são publicados.');
