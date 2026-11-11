const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const Logica = require('../logica.js');
const DADOS = require('../dados.js');

// Navegadores abertos: um teste que falha antes de fechar() não pode deixar a execução pendurada.
const abertos = new Set();
require('node:test').after(() => Promise.all([...abertos].map(b => b.close().catch(() => {}))));

// Terça, 9h: o próximo drop é quarta, 20h, dali a 35 horas.
const AGORA = new Date('2026-11-10T09:00:00-03:00');
const RAIZ = path.resolve(__dirname, '..');

async function abrir({ largura = 390, altura = 844, hash = '', antes, movimento = 'reduce', camera = false } = {}) {
  const browser = await chromium.launch(camera ? { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } : {});
  abertos.add(browser);
  const context = await browser.newContext({ viewport: { width: largura, height: altura }, timezoneId: 'America/Sao_Paulo', locale: 'pt-BR', reducedMotion: movimento });
  const page = await context.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
  page.on('dialog', d => { erros.push('dialog: ' + d.message()); d.dismiss(); });
  await page.clock.install({ time: AGORA });
  await page.clock.pauseAt(AGORA);
  if (antes) await page.addInitScript(antes);
  await page.goto('file://' + RAIZ + '/index.html' + hash).catch(async e => { await browser.close(); throw e; });
  const passar = ms => page.clock.runFor(ms);
  const fechar = async () => { await browser.close(); abertos.delete(browser); assert.deepEqual(erros, []); };
  return { page, passar, fechar };
}

const PERFIL_DE_TESTE = { nome: 'Deco', tamanho: 'M', pegadas: ['vintage', 'street'], teto: 40, curso: 'Administração', email: 'd000000@dac.unicamp.br' };

// Passa pelo e-mail e pelo código (colado de uma vez) e para na frase do perfil. Quem já está nela fica onde está.
async function ateOPerfil(page, email = PERFIL_DE_TESTE.email) {
  if (await page.getByLabel('Seu nome').count()) return;
  await page.getByLabel('Seu e-mail da Unicamp').fill(email);
  await page.getByRole('button', { name: 'Receber o código' }).click();
  await page.getByLabel('Dígito 1 de 4').fill('4815');
  // quem aceita movimento espera 1,5 s as células girarem, se juntarem e virarem o visto; o padrão dos testes segue na hora, sem mexer no relógio.
  // 1600 e não 1500: o relógio segue alinhado ao tique de 200 ms, e "passar(10000)" depois de ensaiar ainda cai no drop
  if (await page.locator('.digitos.confere').count()) await page.clock.runFor(1600);
  await page.getByLabel('Seu nome').waitFor();
}

// Faz a entrada inteira (e-mail, código, perfil) e espera a conta aparecer.
async function entrar(page, perfil = {}) {
  const p = { ...PERFIL_DE_TESTE, ...perfil };
  const botao = nome => page.getByRole('button', { name: nome });
  const opcao = nome => page.locator('.opcoes').getByRole('button', { name: nome, exact: true });
  await ateOPerfil(page, p.email);
  await page.getByLabel('Seu nome').fill(p.nome);
  await botao(/^Tamanho:/).click(); await opcao(p.tamanho).click();
  await botao(/^Pegada:/).click();
  for (const g of p.pegadas) if ((await opcao(g).getAttribute('aria-pressed')) !== 'true') await opcao(g).click();
  for (const g of DADOS.PEGADAS) if (!p.pegadas.includes(g) && (await opcao(g).getAttribute('aria-pressed')) === 'true') await opcao(g).click();
  await opcao('pronto').click();
  await botao(/^Teto:/).click(); await opcao(p.teto === null ? 'sem teto' : 'até ' + Logica.dinheiro(p.teto)).click();
  await botao(/^Curso:/).click(); await opcao(p.curso).click();
  await botao('Entrar').click();
  await page.locator('#conta').filter({ hasText: p.nome }).waitFor();
}

const salvo = page => page.evaluate(() => JSON.parse(localStorage['brecho.v2']));

// Toca "ensaiar o drop agora", deixa os 10 segundos passarem e espera o drop no ar.
async function aoVivo(page, passar) {
  await page.getByRole('button', { name: 'ensaiar o drop agora' }).click();
  await passar(10000);
  await page.locator('#drop').waitFor();
}

module.exports = { AGORA, abrir, ateOPerfil, entrar, salvo, aoVivo };
