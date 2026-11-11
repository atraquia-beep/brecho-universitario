const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, aoVivo } = require('./apoio.js');
const caixa = (page, sel) => page.locator(sel).first().evaluate(e => e.getBoundingClientRect().toJSON());
const atual = page => page.locator('#abas [aria-current="page"]').innerText();
test('barra: Comprar, Vender e Você a um toque, e some onde a peça ou a câmera ocupam a tela', async () => {
  const { page, passar, fechar } = await abrir();
  assert.equal(await page.locator('#abas').isVisible(), false); // entrada
  await entrar(page);
  const abas = page.locator('#abas a');
  assert.deepEqual(await abas.evaluateAll(as => as.map(a => [a.textContent, a.getAttribute('href')])), [['Comprar', '#/'], ['Vender', '#/vender'], ['Você', '#/voce']]);
  assert.equal(await atual(page), 'Comprar');
  const barra = await caixa(page, '#abas');
  assert.equal(barra.bottom, 844);
  for (const a of await abas.all()) assert.ok((await a.boundingBox()).height >= 44);
  assert.equal(await page.locator('#abas').evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(0, 0, 0)');
  await page.locator('#abas').getByRole('link', { name: 'Você' }).click(); await page.getByText('A cor do seu brechó é').waitFor();
  assert.equal(await atual(page), 'Você');
  assert.equal(await page.locator('#abas').evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(235, 224, 217)');
  await page.goto(page.url().split('#')[0] + '#/arara'); await page.locator('#drop').waitFor();
  assert.equal(await atual(page), 'Comprar');
  const topoDaBarra = (await caixa(page, '#abas')).top;
  for (const b of ['passo', 'É minha']) assert.ok((await page.getByRole('button', { name: b }).boundingBox()).y + (await page.getByRole('button', { name: b }).boundingBox()).height <= topoDaBarra, b + ' embaixo da barra');
  await page.locator('#abas').getByRole('link', { name: 'Vender' }).click(); await page.getByRole('button', { name: 'Fotografar' }).waitFor();
  assert.equal(await page.locator('#abas').isVisible(), false);
  await page.locator('#marca').click(); await aoVivo(page, passar);
  assert.equal(await page.locator('#abas').isVisible(), false);
  await page.getByRole('button', { name: 'É minha' }).click(); await page.locator('.codigo').waitFor();
  assert.equal(await page.locator('#abas').isVisible(), false);
  assert.equal(await page.locator('#abas').count(), 1); // some por classe, o nó fica
  await fechar();
});
test('topo: só o nome, com área de toque de 44 px, sem mudar a altura do topo', async () => {
  const { page, fechar } = await abrir(); await entrar(page, { nome: 'Bia' });
  assert.equal(await page.locator('#conta').innerText(), 'Bia');
  const conta = await caixa(page, '#conta');
  assert.ok(conta.height >= 44 && conta.width >= 44, JSON.stringify(conta));
  assert.ok((await caixa(page, '.topo')).height <= 36);
  await fechar();
});
test('barra na tela larga: na coluna da direita, sem cobrir a folha da arara e sem rolar', async () => {
  const { page, fechar } = await abrir({ largura: 1280, altura: 720 }); await entrar(page);
  const palco = await caixa(page, '.palco'), primeira = await caixa(page, '#abas a');
  assert.ok(primeira.left >= palco.right && primeira.bottom <= 720);
  assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight));
  await page.goto(page.url().split('#')[0] + '#/arara'); await page.locator('#drop').waitFor();
  assert.deepEqual(await page.locator('#drop .foto').evaluate(e => { const r = e.getBoundingClientRect(); return [r.top, r.height]; }), [0, 720]);
  const minha = await page.getByRole('button', { name: 'É minha' }).boundingBox();
  assert.ok(minha.y + minha.height <= (await caixa(page, '#abas a')).top);
  await fechar();
});
