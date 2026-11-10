const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir } = require('./apoio.js');
test('identidade: papel e drop, fontes embutidas, foco, sem rolagem lateral', async () => {
  const { page, fechar } = await abrir({ largura: 360 });
  const css = (sel, prop) => page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s))[p], [sel, prop]);
  assert.deepEqual([await css('body', 'backgroundColor'), await css('.frase', 'color')], ['rgb(255, 255, 255)', 'rgb(31, 35, 34)']);
  assert.match(await css('.frase', 'fontFamily'), /Newsreader/);
  const carregadas = await page.evaluate(() => document.fonts.ready.then(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, ''))));
  assert.ok(carregadas.includes('Newsreader'));
  assert.ok(await page.locator('#marca svg').isVisible());
  await page.keyboard.press('Tab');
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'none');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.evaluate(() => document.body.classList.add('escuro'));
  assert.deepEqual([await css('body', 'backgroundColor'), await css('.frase', 'color'), await css('#marca', 'color')], ['rgb(31, 35, 34)', 'rgb(244, 241, 234)', 'rgb(244, 241, 234)']);
  await fechar();
});
test('computador: coluna central com largura de celular', async () => {
  const { page, fechar } = await abrir({ largura: 1280 });
  const r = await page.evaluate(() => { const b = document.querySelector('#tela').getBoundingClientRect(); return [b.width, b.left, innerWidth - b.right]; });
  assert.ok(r[0] >= 360 && r[0] <= 430); assert.ok(Math.abs(r[1] - r[2]) < 2);
  await fechar();
});
