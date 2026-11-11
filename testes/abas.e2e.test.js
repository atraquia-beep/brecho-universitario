const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, aoVivo } = require('./apoio.js');
const D = require('../dados.js');
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
test('tela nova abre no topo: trocar de aba depois de rolar não herda a rolagem', async () => {
  const reservas = D.ARARA.slice(0, 2).map((p, i) => ({ pecaId: p.id, codigo: 'AB2' + i, janela: 'terça, das 12h às 13h', creditosUsados: 0, aPagar: p.preco, retirada: false, nota: null, drop: null }));
  const estado = { perfil: { nome: 'Deco', tamanho: 'M', pegadas: ['vintage', 'street'], teto: 40, curso: 'Administração', email: 'd000000@dac.unicamp.br' }, creditos: 0, reservas, anuncios: [], pedido: null, acordar: false, realce: '#FF0000', ultimoAnuncioSeg: null, ensaio: null, drop: null };
  const { page, fechar } = await abrir({ largura: 390, altura: 664, antes: 'localStorage["brecho.v2"] = ' + JSON.stringify(JSON.stringify(estado)) });
  const aba = nome => page.locator('#abas').getByRole('link', { name: nome });
  const rolarAoFim = () => page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  const y = () => page.evaluate(() => scrollY);
  await page.locator('a.palavra').first().waitFor();
  await rolarAoFim(); assert.ok(await y() > 0, 'a tela de início rola');
  await aba('Você').click(); await page.getByText('A cor do seu brechó é').waitFor();
  assert.equal(await y(), 0);
  await rolarAoFim(); assert.ok(await y() > 0, 'Você rola');
  await aba('Comprar').click(); await page.getByText('À venda agora').waitFor();
  assert.equal(await y(), 0);
  const topo = await caixa(page, 'a.palavra');
  assert.ok(topo.top >= 0 && topo.bottom <= 664, JSON.stringify(topo));
  await fechar();
});
