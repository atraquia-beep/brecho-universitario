// node testes/capturas.js: grava capturas/<largura>-<tela>.png das dez telas, no celular (360 e 390 px) e no computador (1280 × 720).
// Sai com erro se alguma tela rolar para o lado. Não faz parte da suíte (o nome não termina em .test.js).
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { AGORA, entrar } = require('./apoio.js');

const PASTA = path.resolve(__dirname, '..', 'capturas');
const estouradas = [], erros = [];

async function capturar(largura, altura) {
  // como abrir() de apoio.js, mas com deviceScaleFactor 2
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 2, timezoneId: 'America/Sao_Paulo', locale: 'pt-BR', reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', e => erros.push(largura + ': ' + e.message));
  await page.clock.install({ time: AGORA });
  await page.clock.pauseAt(AGORA);
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  const passar = ms => page.clock.runFor(ms);
  const foto = async nome => {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => Array.prototype.every.call(document.images, i => i.complete), null, { polling: 50 });
    const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    if (sw > iw) estouradas.push(largura + '-' + nome + ' (' + sw + ' > ' + iw + ')');
    await page.screenshot({ path: path.join(PASTA, largura + '-' + nome + '.png'), animations: 'disabled' });
  };
  await foto('primeira-vez');
  await entrar(page);
  await foto('espera');
  await page.getByLabel('Diga o que procura').fill('um blazer para a entrevista de quinta');
  await page.getByLabel('Diga o que procura').press('Enter');
  await page.getByText(/^Anotado:/).waitFor();
  await foto('espera-pedido');
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.getByRole('button', { name: 'Fotografar' }).waitFor();
  await foto('vender-visor');
  await page.getByRole('button', { name: 'Fotografar' }).click(); await passar(19000);
  await page.getByRole('button', { name: 'Anunciar no drop' }).waitFor();
  await foto('palpite');
  await page.getByRole('button', { name: 'Anunciar no drop' }).click();
  await page.getByText(/^No drop em/).waitFor();
  await foto('publicado');
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByRole('button', { name: 'ensaiar o drop agora' }).click();
  await passar(10000);
  await page.locator('#drop').waitFor();
  await foto('drop-no-ar');
  await page.getByRole('button', { name: 'É minha' }).click();
  await page.locator('.codigo').waitFor();
  await foto('e-sua');
  await page.getByRole('button', { name: 'Voltar ao drop' }).click();
  await passar(600000);
  await page.getByText(/^O drop acabou/).waitFor();
  await foto('fim-do-drop');
  await page.locator('#conta').click();
  await page.getByText('A cor do seu brechó é').waitFor();
  await foto('voce');
  await browser.close();
}

(async () => {
  fs.mkdirSync(PASTA, { recursive: true });
  for (const [largura, altura] of [[360, 844], [390, 844], [1280, 720]]) await capturar(largura, altura);
  if (erros.length) { console.error('Erros na página: ' + erros.join('; ')); process.exit(1); }
  if (estouradas.length) { console.error('Rolagem horizontal em: ' + estouradas.join(', ')); process.exit(1); }
  console.log('30 capturas em ' + PASTA);
  process.exit(0); // process.exit: o after() de apoio.js não mexe no código de saída
})().catch(e => { console.error(e); process.exit(1); });
