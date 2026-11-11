const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar } = require('./apoio.js');
// O sentido da passagem que o toque abriu (<html data-passagem>). O hashchange chega numa tarefa à parte, que pode vir depois de uma
// leitura imediata: espera a marca aparecer (até 2 s) e a lê na hora, sem esperar a tela nova. Sem passagem, ''.
const sentido = page => page.waitForFunction(() => document.documentElement.dataset.passagem, null, { timeout: 2000 }).then(h => h.jsonValue(), () => '');
// o fim da passagem tira a marca do <html>
const fimDaPassagem = page => page.locator('html:not([data-passagem])').waitFor({ state: 'attached', timeout: 3000 });
const verPecas = page => page.getByRole('button', { name: /^Ver as \d+ peças/ }); // o nome acessível leva a seta do ::after
const nomeDoTopo = page => page.locator('.topo').evaluate(e => getComputedStyle(e).viewTransitionName);
// a entrada escalonada de #tela que ainda roda: a tela inteira já se moveu, então depois de uma passagem não sobra nenhuma
const entrando = page => page.evaluate(() => document.getAnimations().filter(a => a instanceof CSSAnimation && a.effect.target.closest('#tela')).map(a => a.animationName));

// com movimento: entra e espera a abertura sair
async function comMovimento(opcoes) {
  const aberto = await abrir({ movimento: 'no-preference', ...opcoes });
  await entrar(aberto.page);
  await aberto.page.locator('#abertura').waitFor({ state: 'detached', timeout: 8000 });
  return aberto;
}

test('espera → arara desliza para a frente e volta', async () => {
  const { page, fechar } = await comMovimento();
  await verPecas(page).click();
  assert.equal(await sentido(page), 'ida');
  assert.equal(await nomeDoTopo(page), 'none'); // o topo vai com a tela: parado, o cabide piscava entre uma tela escura e uma clara
  await page.locator('#drop').waitFor(); await fimDaPassagem(page);
  assert.deepEqual(await entrando(page), []);
  await page.locator('#marca').click();
  assert.equal(await sentido(page), 'volta');
  await page.locator('.contagem').waitFor(); await fimDaPassagem(page);
  assert.deepEqual(await entrando(page), []);
  await fechar();
});

test('É seu sobe e desce', async () => {
  const { page, fechar } = await comMovimento();
  await verPecas(page).click(); await page.locator('#drop').waitFor(); await fimDaPassagem(page);
  await page.getByRole('button', { name: 'É minha' }).click();
  assert.equal(await sentido(page), 'sobe');
  await page.locator('.codigo').waitFor(); await fimDaPassagem(page);
  await page.getByRole('link', { name: 'continuar na arara' }).click();
  assert.equal(await sentido(page), 'desce');
  await page.locator('#drop').waitFor(); await fimDaPassagem(page);
  await fechar();
});

test('vender sobe', async () => {
  const { page, fechar } = await comMovimento();
  await page.locator('#abas').getByRole('link', { name: 'Vender' }).click();
  assert.equal(await sentido(page), 'sobe');
  await page.getByRole('button', { name: 'Fotografar' }).waitFor(); await fimDaPassagem(page);
  await fechar();
});

test('toque no meio da passagem termina na tela certa', async () => {
  const { page, fechar } = await comMovimento();
  const naEspera = async () => {
    await page.locator('.contagem').waitFor(); await fimDaPassagem(page);
    assert.match(await page.evaluate(() => location.hash), /^(#\/)?$/);
    assert.equal(await page.locator('#drop').count(), 0);
    assert.equal(await page.locator('.contagem').count(), 1);
    assert.equal(await page.locator('#tela').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.passagem || ''), '');
  };
  await verPecas(page).click();
  assert.equal(await sentido(page), 'ida');
  await page.evaluate(() => { location.hash = '#/'; }); // o voltar do navegador com a arara ainda entrando
  await naEspera();
  // com toques de verdade, um logo depois do outro
  await verPecas(page).click(); await page.locator('#marca').click();
  await naEspera();
  await fechar();
});

test('ensaio vira drop com a cortina e sem passagem lateral', async () => {
  const { page, passar, fechar } = await comMovimento({
    antes: () => {
      window.__vistos = [];
      new MutationObserver(ms => ms.forEach(m => window.__vistos.push(m.oldValue || '', document.documentElement.dataset.passagem || '')))
        .observe(document, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['data-passagem'] });
    },
  });
  await page.getByRole('button', { name: 'ver um drop de teste agora (10 s)' }).click();
  await passar(10000);
  await page.locator('#ao-vivo').waitFor(); await page.locator('#drop').waitFor();
  const vistos = await page.evaluate(() => window.__vistos);
  assert.ok(!vistos.includes('ida') && !vistos.includes('volta'), vistos.join());
  await fechar();
});

test('tela larga: passagem lateral sem rolagem horizontal', async () => {
  const { page, fechar } = await comMovimento({ largura: 1280, altura: 720 });
  const semRolagem = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  await verPecas(page).click();
  assert.equal(await sentido(page), 'ida');
  assert.ok(await semRolagem(), 'no começo da passagem');
  await page.locator('#drop').waitFor();
  assert.ok(await semRolagem(), 'no meio da passagem');
  await fimDaPassagem(page);
  assert.ok(await semRolagem(), 'depois da passagem');
  await fechar();
});

test('movimento reduzido: nenhuma passagem', async () => {
  const { page, fechar } = await abrir(); await entrar(page);
  await verPecas(page).click();
  assert.equal(await sentido(page), '');
  await page.locator('#drop').waitFor();
  await fechar();
});

test('barra que volta fora de uma passagem sobe de baixo; dentro dela, sobe com a passagem', async () => {
  const { page, fechar } = await comMovimento();
  // tira e põe a barra pela classe do contrato, como o fim do drop faz pelo tique; conta o que a move
  const voltaABarra = () => page.evaluate(() => {
    const b = document.body, abas = document.getElementById('abas');
    b.classList.add('sem-abas'); abas.offsetHeight; b.classList.remove('sem-abas');
    return abas.getAnimations().length;
  });
  const marcar = valor => page.evaluate(v => { if (v) document.documentElement.dataset.passagem = v; else delete document.documentElement.dataset.passagem; }, valor);
  assert.equal(await voltaABarra(), 1);
  await marcar('desce');
  assert.equal(await voltaABarra(), 0);
  await marcar(null); // o fim da passagem não faz a barra subir de novo
  assert.equal(await page.locator('#abas').evaluate(e => e.getAnimations().length), 0);
  await fechar();
});
