const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, salvo, aoVivo } = require('./apoio.js');
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
