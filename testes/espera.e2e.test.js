const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, salvo, aoVivo } = require('./apoio.js');
const D = require('../dados.js');
const ARARA_DO_DECO = ['bomber-terracota-tiago', 'sueter-marinho-helena', 'jaqueta-jeans-cinza-murilo', 'sueter-creme-sofia', 'camisa-manga-curta-iara'];
const FRASE_DO_DROP = 'Catorze peças novas entram juntas, só por 10 minutos. Quem tocar primeiro leva. Sete são M.';
test('início: as peças à venda primeiro, depois o drop explicado', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await page.getByText('À venda agora').waitFor(); await page.getByText('5 peças', { exact: true }).waitFor();
  await page.getByText('Roupa de quem estuda aqui. Gostou, toque em É minha e ela é sua.').waitFor();
  assert.deepEqual(await page.locator('.vitrine img').evaluateAll(is => is.map(i => i.dataset.peca)), ARARA_DO_DECO);
  assert.deepEqual(await page.locator('.vitrine-nome').allInnerTexts(), ['Jaqueta bomber · M', 'Suéter · M', 'Jaqueta jeans · G', 'Suéter · P', 'Camisa social · M']);
  assert.deepEqual((await page.locator('.vitrine .etiqueta').allInnerTexts()).map(t => t.replace(/\s/g, ' ')), ['R$ 40', 'R$ 30', 'R$ 32', 'R$ 28', 'R$ 20']);
  assert.ok((await page.locator('.vitrine-peca').evaluateAll(as => as.map(a => a.getAttribute('href')))).every(h => h === '#/arara'));
  await page.getByText('Próximo drop · quarta, 20h').waitFor();
  assert.equal(await page.locator('#contagem').innerText(), '35:00:00');
  await passar(1000); assert.equal(await page.locator('#contagem').innerText(), '34:59:59');
  await page.getByText(FRASE_DO_DROP).waitFor();
  assert.equal(await page.getByRole('link', { name: 'M', exact: true }).getAttribute('href'), '#/voce');
  await page.getByRole('button', { name: 'ver um drop de teste agora (10 s)' }).waitFor();
  const texto = (await page.locator('.topo, #tela, #abas').allInnerTexts()).join(' ').toLowerCase();
  for (const palavra of ['pegada', 'arara', 'crédito']) assert.ok(!texto.includes(palavra), palavra + ' na tela: ' + texto);
  assert.equal(await page.locator('#ir-arara, .teaser, #pedido').count(), 0);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole('button', { name: 'Me avise antes' }).click();
  await page.getByText('Combinado. Te aviso cinco minutos antes.').waitFor();
  await page.reload(); await page.getByText('Combinado. Te aviso cinco minutos antes.').waitFor();
  assert.equal((await salvo(page)).acordar, true);
  await page.getByRole('button', { name: 'Ver as 5 peças' }).click(); await page.locator('#drop').waitFor();
  assert.equal((await page.locator('.pilula').first().innerText()).toUpperCase(), 'ARARA · SEMPRE ABERTA');
  await fechar();
});
test('início: a primeira dobra do iPhone 13 mostra peças, botão e o começo do drop, e a barra não cobre nada', async () => {
  for (const [largura, altura] of [[390, 664], [360, 640], [412, 915]]) {
    const { page, fechar } = await abrir({ largura, altura }); await entrar(page);
    // uma foto cortada na borda direita diz que a fila continua
    assert.ok(await page.locator('.vitrine-foto').evaluateAll(fs => fs.some(f => { const r = f.getBoundingClientRect(); return r.left < innerWidth && innerWidth < r.right; })), largura + ': nenhuma foto cortada na borda direita');
    const barra = await page.locator('#abas').evaluate(e => e.getBoundingClientRect().top);
    if (largura === 390) {
      const fotos = await page.locator('.vitrine-foto').evaluateAll((fs, b) => fs.filter(f => { const r = f.getBoundingClientRect(); return r.right <= innerWidth && r.bottom <= b; }).length, barra);
      assert.ok(fotos >= 2, fotos + ' fotos inteiras');
      const ver = await page.getByRole('button', { name: 'Ver as 5 peças' }).boundingBox();
      assert.ok(ver.y + ver.height <= barra);
      assert.ok((await page.locator('#rotulo').boundingBox()).y < barra);
    }
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    const fim = await page.locator('.atalhos').evaluate(e => e.getBoundingClientRect().bottom);
    assert.ok(fim <= await page.locator('#abas').evaluate(e => e.getBoundingClientRect().top), largura + 'x' + altura + ': a barra cobre os atalhos');
    for (const b of await page.locator('.atalhos button').all()) assert.ok((await b.boundingBox()).height >= 44);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await fechar();
  }
});
test('início: tocar numa foto abre a arara do começo, e o toque duplo em É minha reserva uma vez só', async () => {
  const { page, fechar } = await abrir(); await entrar(page);
  await page.locator('.vitrine-peca').nth(2).click(); await page.locator('#drop').waitFor();
  assert.match(await page.locator('.folha .frase').first().innerText(), /^Jaqueta bomber terracota,/);
  await page.getByRole('button', { name: 'É minha' }).evaluate(b => { b.click(); b.click(); });
  await page.locator('.codigo').waitFor();
  assert.deepEqual((await salvo(page)).reservas.map(r => r.pecaId), ['bomber-terracota-tiago']);
  await fechar();
});
test('perfil fora do roteiro', async () => {
  const { page, fechar } = await abrir(); await entrar(page, { tamanho: 'GG', pegadas: ['esportivo'], teto: 20 });
  await page.getByText('Catorze peças novas entram juntas, só por 10 minutos. Quem tocar primeiro leva. Uma é GG.').waitFor();
  await fechar();
});
test('espera: textos raros da vitrine e do drop', async () => {
  // GG, quatro das cinco peças da arara reservadas e o moletom (a única GG do catálogo) reservado no drop de segunda, o que o tira da próxima pilha
  const reserva = (p, codigo, drop) => ({ pecaId: p.id, codigo, janela: 'terça, das 12h às 13h', creditosUsados: 0, aPagar: p.preco, retirada: false, nota: null, drop });
  const reservas = D.ARARA.slice(1).map((p, i) => reserva(p, 'AB2' + i, null))
    .concat(reserva(D.CATALOGO.find(p => p.id === 'moletom-branco-marina'), 'AB29', Date.parse('2026-11-09T20:00:00-03:00')));
  const estado = { perfil: { nome: 'Deco', tamanho: 'GG', pegadas: ['vintage', 'street'], teto: 40, curso: 'Administração', email: 'd000000@dac.unicamp.br' }, creditos: 0, reservas, anuncios: [], pedido: null, acordar: false, realce: '#FF0000', ultimoAnuncioSeg: null, ensaio: null, drop: null };
  const { page, fechar } = await abrir({ antes: 'localStorage["brecho.v2"] = ' + JSON.stringify(JSON.stringify(estado)) });
  await page.locator('.painel > .ficha').getByText('1 peça', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Ver a peça' }).waitFor();
  await page.getByText('Treze peças novas entram juntas, só por 10 minutos. Quem tocar primeiro leva. Nenhuma é GG desta vez.').waitFor();
  await fechar();
});
test('ensaio: a contagem zera e a tela vira o drop sozinha', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await page.getByRole('button', { name: 'ver um drop de teste agora (10 s)' }).click();
  await page.getByText('Drop de teste', { exact: true }).waitFor();
  assert.equal(await page.locator('#contagem').innerText(), '00:00:10');
  await passar(9000); assert.equal(await page.locator('#contagem').innerText(), '00:00:01');
  await page.reload(); assert.equal(await page.locator('#contagem').innerText(), '00:00:01');
  await passar(1000); await page.locator('#drop').waitFor();
  assert.equal(await page.locator('#resta').innerText(), 'AO VIVO · 10:00');
  const s = await salvo(page); assert.equal(s.drop.inicio, s.ensaio);
  await passar(19000); assert.equal(await page.locator('#resta').innerText(), 'AO VIVO · 09:41');
  await fechar();
});
test('um pedido gravado antes desta versão é ignorado', async () => {
  const estado = { perfil: { nome: 'Deco', tamanho: 'M', pegadas: ['vintage', 'street'], teto: 40, curso: 'Administração', email: 'd000000@dac.unicamp.br' }, creditos: 0, reservas: [], anuncios: [], pedido: 'um blazer para a entrevista de quinta', acordar: false, realce: '#FF0000', ultimoAnuncioSeg: null, ensaio: null, drop: null };
  const { page, passar, fechar } = await abrir({ antes: 'localStorage["brecho.v2"] = ' + JSON.stringify(JSON.stringify(estado)) });
  await page.getByText('Próximo drop · quarta, 20h').waitFor();
  assert.equal(await page.locator('#pedido').count(), 0);
  assert.equal(await page.getByText(/Anotado/).count(), 0);
  await aoVivo(page, passar);
  assert.match(await page.locator('.folha .frase').first().innerText(), /^Jaqueta jeans, M, pouco uso\. R\$\s35\.$/);
  assert.equal(await page.getByText(/Você pediu/).count(), 0);
  await fechar();
});
