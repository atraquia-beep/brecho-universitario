const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, salvo } = require('./apoio.js');
const pedir = async (page, texto) => { await page.getByLabel('Diga o que procura').fill(texto); await page.getByLabel('Diga o que procura').press('Enter'); };
test('espera do roteiro', async () => {
  const { page, passar, fechar } = await abrir({ largura: 360 }); await entrar(page);
  await page.getByText('Próximo drop · quarta, 20h').waitFor();
  assert.equal(await page.locator('#contagem').innerText(), '35:00:00');
  await passar(1000); assert.equal(await page.locator('#contagem').innerText(), '34:59:59');
  await page.getByText('Deco, catorze peças entram juntas. Cinco são M, na sua pegada.').waitFor();
  await page.getByText('Cada peça é única. Quem tocar primeiro leva.').waitFor();
  await page.getByText('só abre na hora').waitFor();
  assert.equal(await page.locator('#tela img[aria-hidden="true"]').count(), 3);
  assert.equal(await page.getByRole('link', { name: 'vender uma peça para este drop' }).getAttribute('href'), '#/vender');
  assert.equal(await page.getByRole('link', { name: 'M', exact: true }).getAttribute('href'), '#/voce');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  const [campo, fim] = await page.evaluate(() => [document.querySelector('#pedido'), [...document.querySelectorAll('#tela .apoio')].pop()].map(el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; }));
  assert.ok(Math.abs(campo.bottom - 844) <= 24 && fim.bottom <= campo.top);
  await page.getByRole('button', { name: 'Me acorde cinco minutos antes' }).click();
  await page.getByText('Combinado. Eu te acordo cinco minutos antes.').waitFor();
  await page.reload(); await page.getByText('Combinado. Eu te acordo cinco minutos antes.').waitFor();
  assert.equal((await salvo(page)).acordar, true);
  await fechar();
});
test('perfil fora do roteiro', async () => {
  const { page, fechar } = await abrir(); await entrar(page, { tamanho: 'GG', pegadas: ['esportivo'], teto: 20 });
  await page.getByText('Deco, catorze peças entram juntas. Nenhuma é GG na sua pegada desta vez, mas vale olhar.').waitFor();
  await fechar();
});
test('pedido anotado, esquecido e não entendido', async () => {
  const { page, fechar } = await abrir(); await entrar(page);
  await pedir(page, 'um blazer para a entrevista de quinta');
  await page.getByText('Anotado: "um blazer para a entrevista de quinta". O que combinar com isso abre a sua pilha no próximo drop.').waitFor();
  assert.equal(await page.getByLabel('Diga o que procura').inputValue(), '');
  await page.reload(); await page.getByText(/^Anotado: "um blazer para a entrevista de quinta"/).waitFor();
  await page.getByRole('button', { name: 'esquecer' }).click();
  assert.equal(await page.getByText(/^Anotado:/).count(), 0); assert.equal((await salvo(page)).pedido, null);
  await pedir(page, 'xyzzy');
  await page.getByText('Não entendi que peça você procura. Tente algo como "um blazer para a entrevista".').waitFor();
  assert.equal((await salvo(page)).pedido, null);
  await pedir(page, '   '); assert.equal((await salvo(page)).pedido, null);
  await pedir(page, '<img src=x onerror=alert(1)> BLAZER até r$40');
  await page.getByText(/^Anotado: "<img src=x onerror=alert\(1\)> BLAZER até r\$40"/).waitFor();
  assert.equal(await page.locator('#tela img[src="x"]').count(), 0);
  await fechar();
});
test('ensaio: a contagem zera e a tela vira o drop sozinha', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await page.getByRole('button', { name: 'ensaiar o drop agora' }).click();
  await page.getByText('Ensaio do drop').waitFor();
  assert.equal(await page.locator('#contagem').innerText(), '00:00:10');
  await passar(9000); assert.equal(await page.locator('#contagem').innerText(), '00:00:01');
  await page.reload(); assert.equal(await page.locator('#contagem').innerText(), '00:00:01');
  await passar(1000); await page.locator('#drop').waitFor();
  assert.equal(await page.locator('#resta').innerText(), 'AO VIVO · 10:00');
  const s = await salvo(page); assert.equal(s.drop.inicio, s.ensaio);
  await passar(19000); assert.equal(await page.locator('#resta').innerText(), 'AO VIVO · 09:41');
  await fechar();
});
test('foco visível no campo do pedido e na seta', async () => {
  const { page, fechar } = await abrir(); await entrar(page);
  const tamanhoDaLinha = () => page.locator('#pedido').evaluate(el => getComputedStyle(el).backgroundSize);
  const antes = await tamanhoDaLinha();
  await page.getByLabel('Diga o que procura').focus();
  assert.notEqual(await tamanhoDaLinha(), antes);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Enviar pedido');
  assert.notEqual(await page.getByRole('button', { name: 'Enviar pedido' }).evaluate(el => getComputedStyle(el).outlineStyle), 'none');
  await fechar();
});
test('depois de enviar o pedido o teclado fecha e a resposta fica à vista', async () => {
  const { page, fechar } = await abrir({ largura: 360, altura: 640 }); await entrar(page);
  for (const [texto, resposta] of [['xyzzy', /^Não entendi/], ['um blazer para a entrevista', /^Anotado:/]]) {
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await pedir(page, texto);
    await page.getByText(resposta).waitFor();
    assert.notEqual(await page.evaluate(() => document.activeElement.id), 'pedido-campo');
    const topo = await page.getByText(resposta).evaluate(el => el.getBoundingClientRect().top);
    assert.ok(topo >= 0 && topo < await page.evaluate(() => innerHeight), 'resposta em ' + topo);
  }
  await fechar();
});
test('celular de tela baixa: as ações da espera ficam acima do campo do pedido', async () => {
  for (const [largura, altura] of [[390, 664], [360, 640]]) {
    const { page, fechar } = await abrir({ largura, altura }); await entrar(page);
    await pedir(page, 'um blazer para a entrevista de quinta'); await page.getByText(/^Anotado:/).waitFor();
    await page.evaluate(() => scrollTo(0, 0));
    const campo = await page.locator('#pedido').evaluate(el => el.getBoundingClientRect().top);
    for (const alvo of [page.getByRole('button', { name: 'Me acorde cinco minutos antes' }), page.getByRole('link', { name: 'vender uma peça para este drop' }), page.getByRole('button', { name: 'ensaiar o drop agora' })]) {
      const r = await alvo.evaluate(el => { const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom }; });
      assert.ok(r.top >= 0 && r.bottom <= campo, largura + 'x' + altura + ': ' + JSON.stringify(r) + ' campo em ' + campo);
    }
    await fechar();
  }
});
