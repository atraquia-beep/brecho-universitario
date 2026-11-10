const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, aoVivo } = require('./apoio.js');
const abrindo = page => page.evaluate(() => document.body.classList.contains('abrindo'));
test('abertura: aparece para quem aceita movimento, sai sozinha e um toque pula', async () => {
  const { page, fechar } = await abrir({ movimento: 'no-preference' });
  const ab = page.locator('#abertura');
  await ab.waitFor();
  assert.equal(await ab.getAttribute('aria-hidden'), 'true');
  assert.equal(await ab.locator('.ab-marca').getAttribute('aria-label'), 'TAKE IT');
  assert.equal(await ab.locator('.ab-pilha img').count(), 7);
  assert.equal(await abrindo(page), true);
  const barra = () => page.locator('meta[name="theme-color"]').getAttribute('content');
  assert.equal(await barra(), '#EBE0D9'); // a barra do navegador fica creme com a abertura na frente
  assert.equal(await page.locator('h1.titulo').count(), 1); // o app já está desenhado por baixo
  await ab.waitFor({ state: 'detached', timeout: 8000 }); // sai sozinha, mesmo com o relógio do teste parado
  assert.equal(await abrindo(page), false);
  assert.equal(await barra(), '#000000'); // e volta ao preto da capa
  await page.reload(); await ab.waitFor(); await ab.click();
  assert.equal(await ab.count(), 0); assert.equal(await abrindo(page), false);
  await fechar();
});
test('abertura e cortina do drop não existem para quem pede menos movimento', async () => {
  const { page, passar, fechar } = await abrir();
  await page.getByText('só entre alunos').waitFor();
  assert.equal(await page.locator('.cortina').count(), 0);
  await entrar(page); await aoVivo(page, passar);
  assert.equal(await page.locator('.cortina').count(), 0);
  await fechar();
});
test('o drop abre com a cortina "AO VIVO", que sai sozinha e não trava o drop', async () => {
  const { page, passar, fechar } = await abrir({ movimento: 'no-preference' });
  await page.locator('#abertura').click();
  await entrar(page);
  await page.getByRole('button', { name: 'ensaiar o drop agora' }).click(); await passar(10000);
  const c = page.locator('#ao-vivo'); await c.waitFor();
  assert.equal(await c.locator('.ab-marca').getAttribute('aria-label'), 'AO VIVO');
  await page.locator('#drop').waitFor(); // o drop já está por baixo
  await c.waitFor({ state: 'detached', timeout: 8000 });
  await page.getByRole('button', { name: 'É minha' }).click(); await page.locator('.codigo').waitFor();
  await fechar();
});
test('recomeçar do zero toca a abertura de novo', async () => {
  const { page, fechar } = await abrir({ movimento: 'no-preference' });
  await page.locator('#abertura').click(); await entrar(page);
  await page.locator('#conta').click();
  await page.getByRole('button', { name: 'Recomeçar do zero' }).click(); await page.getByRole('button', { name: 'sim', exact: true }).click();
  await page.locator('#abertura').waitFor(); await page.locator('h1.titulo').waitFor({ state: 'attached' });
  await fechar();
});
const semAnimar = page => page.addStyleTag({ content: '.cortina { animation: none !important; }' });
test('abertura: sem o aviso de fim da animação, a reserva de 5 s libera a tela', async () => {
  const { page, passar, fechar } = await abrir({ movimento: 'no-preference' });
  await page.locator('#abertura').waitFor(); await semAnimar(page);
  await passar(4900); assert.equal(await page.locator('#abertura').count(), 1);
  await passar(200);
  assert.equal(await page.locator('#abertura').count(), 0); assert.equal(await abrindo(page), false);
  await fechar();
});
test('recarregar nos últimos segundos do ensaio não põe "AO VIVO" sobre a abertura', async () => {
  const { page, passar, fechar } = await abrir({ movimento: 'no-preference' });
  await page.locator('#abertura').click(); await entrar(page);
  await page.getByRole('button', { name: 'ensaiar o drop agora' }).click(); await passar(8000);
  await page.reload(); await page.locator('#abertura').waitFor(); await semAnimar(page);
  await passar(2400); await page.locator('#drop').waitFor({ state: 'attached' });
  assert.equal(await page.locator('#ao-vivo').count(), 0); assert.equal(await page.locator('#abertura').count(), 1);
  await fechar();
});
