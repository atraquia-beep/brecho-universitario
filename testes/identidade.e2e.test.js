const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar } = require('./apoio.js'); const DADOS = require('../dados.js');
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
// nenhuma pontuação depois de uma palavra ou de um campo começa uma linha sozinha
const pontuacaoSolta = page => page.evaluate(() => {
  const soltas = [];
  document.querySelectorAll('#tela p .palavra, #tela p .campo').forEach(c => {
    const t = c.nextSibling;
    if (!t || t.nodeType !== 3 || !/^[.,;:!?]/.test(t.data)) return;
    const r = document.createRange(); r.setStart(t, 0); r.setEnd(t, 1);
    const p = r.getBoundingClientRect(), rs = c.getClientRects(), u = rs[rs.length - 1];
    if (!(p.top < u.bottom && p.bottom > u.top)) soltas.push((c.value || c.textContent) + t.data.charAt(0));
  });
  return { soltas, larga: document.documentElement.scrollWidth > innerWidth };
});
test('pontuação nunca cai sozinha na linha de baixo', async () => {
  const longo = DADOS.CURSOS.reduce((a, b) => b.length > a.length ? b : a);
  for (const largura of [360, 390]) {
    const { page, passar, fechar } = await abrir({ largura });
    const confere = async onde => assert.deepEqual(await pontuacaoSolta(page), { soltas: [], larga: false }, largura + ' ' + onde);
    await page.getByLabel('Seu nome').fill('Deco'); await page.getByLabel('Seu e-mail da Unicamp').fill('d000000@dac.unicamp.br');
    await page.getByRole('button', { name: /^Curso:/ }).click(); await page.getByRole('button', { name: longo, exact: true }).click();
    await confere('primeira vez');
    await entrar(page);
    await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
    await page.getByRole('button', { name: 'Fotografar' }).click(); await passar(1200);
    await page.getByRole('button', { name: 'Anunciar no drop' }).waitFor();
    await confere('palpite');
    await page.getByRole('button', { name: /^Estado:/ }).click(); await page.getByRole('button', { name: 'novo com etiqueta', exact: true }).click();
    await confere('palpite novo com etiqueta');
    await page.goto(page.url().split('#')[0] + '#/voce'); await page.getByText('A cor do seu brechó é').waitFor();
    await confere('você');
    await fechar();
  }
});
