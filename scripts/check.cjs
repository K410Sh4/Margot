'use strict';
const {readdirSync, readFileSync, existsSync} = require('node:fs');
const {resolve} = require('node:path');
const {execFileSync} = require('node:child_process');
const assert = require('node:assert/strict');
const root = resolve(__dirname, '..');
for (const directory of ['', 'scripts', 'tests']) {
  for (const name of readdirSync(resolve(root, directory))) {
    if (/\.(js|cjs)$/.test(name)) execFileSync(process.execPath, ['--check', resolve(root, directory, name)]);
  }
}
for (const name of ['index.html', 'privacidade.html']) {
  const html = readFileSync(resolve(root, name), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, `IDs duplicados em ${name}`);
  for (const [, reference] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(reference)) continue;
    if (reference.startsWith('#')) {
      assert(ids.includes(reference.slice(1)), `Âncora inválida: ${name} ${reference}`);
    } else {
      assert(existsSync(resolve(root, reference.split(/[?#]/)[0])), `Arquivo ausente: ${reference}`);
    }
  }
}
console.log('Sintaxe JavaScript, IDs, âncoras e recursos locais verificados.');
