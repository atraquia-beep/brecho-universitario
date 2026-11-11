const test = require('node:test'); const assert = require('node:assert/strict'); const path = require('node:path'); const { abrir, entrar, salvo, aoVivo } = require('./apoio.js');
async function ateOPalpite(page, passar) {
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.getByText('Sem câmera aqui: usei uma peça de exemplo.').waitFor();
  await page.getByRole('button', { name: 'Fotografar' }).click();
  await page.getByText('Olhando…').waitFor(); await passar(1200);
}
async function anunciarExemplo(page, passar, espera = 17800) {
  await ateOPalpite(page, passar);
  await page.getByText(/Parece uma jaqueta jeans, tamanho M, pouco uso\. No campus, peças assim saem por R\$\s30 a R\$\s40\. Eu anunciaria por R\$\s35\./).waitFor();
  await passar(espera);
  await page.getByRole('button', { name: 'Anunciar no drop' }).click();
}
test('vender sem câmera: 19 segundos e a peça entra no próximo drop', async () => {
  const { page, passar, fechar } = await abrir({ largura: 360 }); await entrar(page);
  await ateOPalpite(page, passar);
  assert.equal(await page.evaluate(() => document.body.classList.contains('escuro')), true);
  assert.deepEqual((await page.locator('.etiqueta').allInnerTexts()).map(t => t.replace(/\s/g, ' ')), ['jaqueta jeans · M · pouco uso', 'R$ 35']);
  await page.getByText(/Vendendo, prefiro R\$\s35 em créditos\./).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await passar(17800); await page.getByRole('button', { name: 'Anunciar no drop' }).click();
  await page.getByText('No drop em 19 segundos. Sua jaqueta jeans entra quarta, às 20h.').waitFor();
  const s = await salvo(page); assert.equal(s.ultimoAnuncioSeg, 19);
  assert.deepEqual([s.anuncios[0].preco, s.anuncios[0].tamanho, s.anuncios[0].receber, s.anuncios[0].foto, s.anuncios[0].vendida], [35, 'M', 'creditos', 'fotos/exemplo-venda.jpg', false]);
  await page.getByRole('button', { name: 'Voltar' }).click(); await page.getByText('Próximo drop · quarta, 20h').waitFor();
  await page.getByText('Deco, catorze peças entram juntas.', { exact: false }).waitFor(); // a própria peça não entra na pilha
  await fechar();
});
test('cronômetro, tamanho do perfil, palavras que refazem o preço e Pix', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page, { tamanho: 'G' });
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.locator('#cronometro').waitFor(); // a rota abre antes de o relógio andar
  await passar(3000); assert.equal(await page.locator('#cronometro').innerText(), '00:03');
  await page.getByRole('button', { name: 'Fotografar' }).click(); await passar(1200);
  await page.getByText(/tamanho G/).waitFor();
  await page.getByRole('button', { name: /^Estado:/ }).click(); await page.getByRole('button', { name: 'usado', exact: true }).click();
  const preco = Number((await page.getByRole('button', { name: /^Preço:/ }).innerText()).replace(/\D/g, ''));
  assert.ok(preco < 35 && preco % 5 === 0);
  assert.match((await page.locator('.etiqueta').first().innerText()), /jaqueta jeans · G · usado/);
  await page.getByRole('button', { name: /^Preço:/ }).click();
  await page.getByRole('button', { name: new RegExp('^R\\$\\s' + (preco + 5) + '$') }).click();
  await page.getByRole('button', { name: /^Receber:/ }).click(); await page.getByRole('button', { name: /^R\$\s[\d,]+ no Pix$/ }).click();
  await page.getByRole('button', { name: 'Anunciar no drop' }).click();
  const a = (await salvo(page)).anuncios[0]; assert.deepEqual([a.preco, a.receber, a.tamanho, a.estado], [preco + 5, 'pix', 'G', 'usado']);
  await fechar();
});
test('com câmera: visor ao vivo, foto reduzida e câmera desligada depois', async () => {
  const { page, passar, fechar } = await abrir({ camera: true }); await entrar(page);
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.locator('video#visor').waitFor();
  assert.equal(await page.getByText('Sem câmera aqui').count(), 0);
  await page.waitForFunction(() => document.querySelector('#visor').videoWidth > 0);
  await page.getByRole('button', { name: 'Fotografar' }).click();
  await page.getByText('Olhando…').waitFor(); await passar(1200);
  await page.getByRole('button', { name: 'Anunciar no drop' }).click();
  const foto = (await salvo(page)).anuncios[0].foto;
  assert.ok(foto.startsWith('data:image/jpeg') && foto.length < 200_000);
  assert.equal(await page.locator('video').count(), 0);
  await fechar();
});
test('foto da galeria é reduzida; arquivo que não é imagem vira frase', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.setInputFiles('#foto-entrada', { name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('oi') });
  await page.getByText('Não consegui abrir essa foto. Tente outra ou use a peça de exemplo.').waitFor();
  await page.setInputFiles('#foto-entrada', path.join(__dirname, '..', 'fotos', 'exemplo-venda.jpg'));
  await page.getByText('Olhando…').waitFor(); await passar(1200);
  await page.getByRole('button', { name: 'Anunciar no drop' }).click();
  await page.getByText(/^No drop em/).waitFor();
  const foto = (await salvo(page)).anuncios[0].foto;
  assert.ok(foto.startsWith('data:image/jpeg') && foto.length < 200_000);
  const lado = await page.evaluate(src => new Promise(ok => { const i = new Image(); i.onload = () => ok(Math.max(i.naturalWidth, i.naturalHeight)); i.src = src; }), foto);
  assert.ok(lado <= 600);
  await fechar();
});
test('anunciar funciona mesmo sem conseguir gravar', async () => {
  const { page, passar, fechar } = await abrir({ antes: () => { Storage.prototype.setItem = () => { throw new Error('cheio'); }; } });
  await entrar(page); await anunciarExemplo(page, passar);
  await page.getByText(/^No drop em 19 segundos\./).waitFor();
  await fechar();
});
test('sua peça é levada no drop e o crédito cobre a próxima peça', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await anunciarExemplo(page, passar); await page.getByRole('button', { name: 'Voltar' }).click();
  await aoVivo(page, passar);
  await passar(4800); assert.equal((await salvo(page)).creditos, 0);
  await passar(200);
  await page.getByText(/A Bia, de Nutrição, levou sua jaqueta jeans\. Entraram R\$\s35 em créditos\./).waitFor();
  assert.match(await page.locator('#conta').innerText(), /R\$\s35 em créditos/);
  await page.getByRole('button', { name: 'passo' }).click();
  await page.getByText(/· sai de graça com seus créditos/).waitFor();                       // camisa xadrez, R$ 25
  await page.reload(); await page.locator('#drop').waitFor();
  assert.equal((await salvo(page)).anuncios[0].vendida, true);
  await fechar();
});
test('crédito parcial, crédito total e Pix', async () => {
  let a = await abrir(); await entrar(a.page);
  await anunciarExemplo(a.page, a.passar); await a.page.getByRole('button', { name: 'Voltar' }).click();
  await aoVivo(a.page, a.passar); await a.passar(5000);
  await a.page.getByRole('button', { name: 'passo' }).click(); await a.page.getByRole('button', { name: 'passo' }).click(); // moletom preto, R$ 40
  await a.page.getByRole('button', { name: 'É minha' }).click();
  await a.page.getByText(/Seus R\$\s35 em créditos já entraram\. Faltam R\$\s5, pagos na hora\./).waitFor();
  assert.match(await a.page.locator('#conta').innerText(), /R\$\s0 em créditos/);
  await a.page.getByRole('button', { name: 'Cancelar a reserva' }).click(); await a.page.locator('#drop').waitFor();
  await a.page.getByRole('button', { name: 'passo' }).click(); await a.page.getByRole('button', { name: 'passo' }).click(); // camiseta azul, R$ 15
  await a.page.getByRole('button', { name: 'É minha' }).click();
  await a.page.getByText('Seus créditos pagaram tudo.').waitFor();
  assert.match(await a.page.locator('#conta').innerText(), /R\$\s20 em créditos/);
  await a.fechar();
  a = await abrir(); await entrar(a.page);
  await ateOPalpite(a.page, a.passar);
  await a.page.getByRole('button', { name: /^Receber:/ }).click(); await a.page.getByRole('button', { name: /^R\$\s31,50 no Pix$/ }).click();
  await a.page.getByRole('button', { name: 'Anunciar no drop' }).click(); await a.page.getByRole('button', { name: 'Voltar' }).click();
  await aoVivo(a.page, a.passar); await a.passar(5000);
  await a.page.getByText(/A Bia, de Nutrição, levou sua jaqueta jeans\. O Pix de R\$\s31,50 cai depois da retirada\./).waitFor();
  assert.match(await a.page.locator('#conta').innerText(), /R\$\s0 em créditos/);
  await a.fechar();
});
test('anúncio feito durante o drop espera o próximo', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page); await aoVivo(page, passar);
  await page.goto(page.url().split('#')[0] + '#/vender');
  await page.getByRole('button', { name: 'Fotografar' }).click(); await passar(1200);
  await page.getByRole('button', { name: 'Anunciar no drop' }).click();
  await page.getByText(/entra quarta, às 20h\./).waitFor();
  await page.getByRole('button', { name: 'Voltar' }).click(); await page.locator('#drop').waitFor();
  await passar(20000); assert.equal((await salvo(page)).anuncios[0].vendida, false);
  await fechar();
});
test('o visor ocupa a tela e os controles cabem sem rolar', async () => {
  const { page, fechar } = await abrir({ largura: 360, altura: 640 }); await entrar(page);
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.getByText('Sem câmera aqui: usei uma peça de exemplo.').waitFor();
  const alto = await page.evaluate(() => innerHeight);
  const visor = await page.locator('#visor').boundingBox();
  assert.ok(visor.height >= 0.9 * alto, 'visor com ' + visor.height + ' de ' + alto);
  for (const b of [page.locator('#disparo'), page.getByRole('button', { name: 'escolher uma foto' })]) {
    const caixa = await b.boundingBox(); assert.ok(caixa.y + caixa.height <= alto, 'botão termina em ' + (caixa.y + caixa.height));
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await fechar();
});
test('cronômetro conta segundos inteiros e para no número da frase', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.locator('#cronometro').waitFor();
  await passar(200); assert.equal(await page.locator('#cronometro').innerText(), '00:00');
  await page.getByRole('button', { name: 'Fotografar' }).click(); await passar(1200);
  await page.getByRole('button', { name: 'Anunciar no drop' }).waitFor();
  await passar(18000); assert.equal(await page.locator('#cronometro').innerText(), '00:19');
  await page.getByRole('button', { name: 'Anunciar no drop' }).click();
  await page.getByText(/^No drop em 19 segundos\./).waitFor();
  assert.equal(await page.locator('#cronometro').innerText(), '00:19');
  await fechar();
});
test('a peça de exemplo sempre ganha o palpite da jaqueta', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  for (let i = 0; i < 2; i++) {
    await ateOPalpite(page, passar);
    await page.getByText(/^Parece uma jaqueta jeans, tamanho M, pouco uso\./).waitFor();
    await page.getByRole('button', { name: 'Anunciar no drop' }).click(); await page.getByRole('button', { name: 'Voltar' }).click();
  }
  assert.equal((await salvo(page)).anuncios.length, 2);
  await fechar();
});
test('enquanto a câmera não responde, já dá para escolher uma foto', async () => {
  const { page, passar, fechar } = await abrir({ antes: () => { Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: () => new Promise(() => {}) } }); } });
  await entrar(page);
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.getByRole('button', { name: 'escolher uma foto' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Fotografar' }).count(), 0);
  assert.equal(await page.locator('.canto').count(), 0);
  await page.setInputFiles('#foto-entrada', path.join(__dirname, '..', 'fotos', 'exemplo-venda.jpg'));
  await page.getByText('Olhando…').waitFor(); await passar(1200);
  await page.getByRole('button', { name: 'Anunciar no drop' }).waitFor();
  await fechar();
});
