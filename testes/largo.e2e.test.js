const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, aoVivo } = require('./apoio.js');
// Tela larga (a partir de 900 px): o mesmo app em dois lados. Palco à esquerda, painel à direita, pé embaixo do palco.
const caixa = (page, sel) => page.locator(sel).first().evaluate(e => { const r = e.getBoundingClientRect(); return { e: r.left, d: r.right, t: r.top, b: r.bottom, l: r.width, a: r.height }; });
const css = (page, sel, prop) => page.locator(sel).first().evaluate((e, p) => getComputedStyle(e)[p], prop);
async function semRolagem(page, onde, tambemParaBaixo) {
  const r = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth, document.documentElement.scrollHeight, innerHeight]);
  assert.ok(r[0] <= r[1], onde + ': rola para o lado (' + r[0] + ' > ' + r[1] + ')');
  if (tambemParaBaixo) assert.ok(r[2] <= r[3], onde + ': rola para baixo (' + r[2] + ' > ' + r[3] + ')');
}
test('tela larga: a entrada tem o palco preto à esquerda e o painel creme à direita, e os três passos cabem sem rolar', async () => {
  for (const [largura, altura] of [[900, 700], [1280, 720], [1440, 900], [1920, 1080]]) {
    const { page, fechar } = await abrir({ largura, altura }), onde = largura + '×' + altura;
    await page.getByText('só entre alunos').waitFor();
    const palco = await caixa(page, '.palco'), painel = await caixa(page, '.painel'), pe = await caixa(page, '.pe');
    assert.ok(painel.e >= palco.d + 40, onde + ': painel à direita do palco');
    assert.ok(pe.t >= palco.b - 1 && pe.d <= painel.e, onde + ': pé embaixo do palco');
    assert.deepEqual([await css(page, '.painel', 'backgroundColor'), await css(page, '.painel .frase', 'color'), await css(page, '.palco .ficha', 'color')],
      ['rgb(235, 224, 217)', 'rgb(0, 0, 0)', 'rgb(235, 224, 217)']);
    // o botão do painel creme é preto; a palavra do palco continua creme
    assert.equal(await css(page, '.painel .principal', 'backgroundColor'), 'rgb(0, 0, 0)');
    // o nome gigante vai de ponta a ponta do palco
    const nome = await page.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.querySelector('h1.titulo')); return r.getBoundingClientRect().width; });
    assert.ok(Math.abs(nome - palco.l) <= palco.l * .02, onde + ': nome com ' + nome + ' num palco de ' + palco.l);
    await semRolagem(page, onde + ' e-mail', true);
    await page.getByLabel('Seu e-mail da Unicamp').fill('d000000@dac.unicamp.br'); await page.getByRole('button', { name: 'Receber o código' }).click();
    const digito = await caixa(page, '.digito');
    assert.ok(digito.e >= painel.e && digito.l >= 70, onde + ': células grandes dentro do painel');
    await semRolagem(page, onde + ' código', true);
    await page.getByLabel('Dígito 1 de 4').fill('4815'); await page.getByLabel('Seu nome').waitFor();
    await semRolagem(page, onde + ' perfil', true);
    // abrir uma lista do perfil empurra o que vem embaixo; a frase de cima não sai do lugar sob o cursor
    const topoDaFrase = () => caixa(page, '.painel .frase').then(c => c.t), antes = await topoDaFrase();
    await page.getByRole('button', { name: /^Pegada:/ }).click();
    assert.equal(await topoDaFrase(), antes, onde + ': a frase pulou ao abrir a pegada');
    await page.getByRole('button', { name: 'pronto' }).click();
    await page.getByRole('button', { name: /^Curso:/ }).click(); // a lista de cursos é longa: pode rolar para baixo, nunca para o lado
    await semRolagem(page, onde + ' perfil com a lista aberta');
    await fechar();
  }
});
test('tela larga: espera, vender, drop, é sua e você, lado a lado e sem rolagem lateral', async () => {
  const { page, passar, fechar } = await abrir({ largura: 1280, altura: 720 }); await entrar(page);
  // espera: números no palco, peças borradas no painel
  let palco = await caixa(page, '.palco');
  const contagem = await caixa(page, '#contagem'), teaser = await caixa(page, '.teaser');
  assert.ok(contagem.d <= palco.d + 1 && contagem.l >= palco.l * .9, 'contagem ocupa o palco');
  assert.ok(teaser.e >= palco.d && teaser.a > 300, 'peças borradas no painel');
  await semRolagem(page, 'espera', true);
  // vender: o visor é a metade esquerda da janela; as frases ficam no painel
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.getByText('Fotografe a peça. Eu digo o que é e sugiro o preço.').waitFor();
  await page.getByRole('button', { name: 'Fotografar' }).waitFor(); // o visor é redesenhado quando a câmera responde: mede depois
  const visor = await caixa(page, '.visor');
  assert.deepEqual([visor.e, visor.t, visor.l, visor.a], [0, 0, 640, 720]);
  assert.ok((await caixa(page, '.painel')).e >= visor.d);
  await page.getByRole('button', { name: 'Fotografar' }).click(); await passar(1200);
  assert.ok((await caixa(page, '.painel .principal')).e >= visor.d, 'botão de anunciar no painel');
  assert.deepEqual([(await caixa(page, '.visor')).l, (await caixa(page, '.visor')).a], [640, 720]);
  await semRolagem(page, 'palpite', true);
  await page.getByRole('button', { name: 'Anunciar no drop' }).click(); await semRolagem(page, 'publicado', true);
  await page.getByRole('button', { name: 'Voltar' }).click();
  // drop: foto à esquerda, folha à direita, na janela inteira; a dica do teclado aparece
  await aoVivo(page, passar);
  const foto = await caixa(page, '#drop .foto'), folha = await caixa(page, '.folha');
  assert.deepEqual([foto.e, foto.t, foto.l, foto.a], [0, 0, 704, 720]);
  assert.deepEqual([folha.e, folha.d, folha.a], [704, 1280, 720]);
  await page.getByText('No teclado: ← passa, → é minha.').waitFor();
  await passar(5000); // alguém leva a peça anunciada: o aviso entra na folha, acima das ações
  const aviso = await caixa(page, '#aviso'), acoes = await caixa(page, '.acoes');
  assert.ok(aviso.e >= folha.e && aviso.b <= acoes.t && aviso.a < 120, 'aviso dentro da folha, acima das ações');
  await semRolagem(page, 'drop', true);
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowRight');
  // é sua: o código no palco, a foto da peça no painel
  await page.locator('.codigo').waitFor();
  palco = await caixa(page, '.palco');
  const retrato = await caixa(page, '.retrato');
  assert.ok(retrato.e >= palco.d && retrato.a > 400 && (await caixa(page, '.codigo')).d <= palco.d, 'foto da peça no painel');
  await semRolagem(page, 'é sua', true);
  // você: perfil no palco, peças e reservas no painel
  await page.locator('#conta').click(); await page.getByText('A cor do seu brechó é').waitFor();
  assert.ok((await caixa(page, '.painel')).e >= (await caixa(page, '.palco')).d);
  assert.ok((await page.locator('.painel').innerText()).toUpperCase().startsWith('SUAS PEÇAS'));
  await semRolagem(page, 'você', true);
  await fechar();
});
test('janela de 1920: no drop e na câmera o topo fica nas bordas da janela, como a foto e o visor', async () => {
  const { page, passar, fechar } = await abrir({ largura: 1920, altura: 1080 }); await entrar(page);
  const bordas = async () => { const t = await caixa(page, '.topo'); return [t.e, 1920 - t.d]; }; // na câmera a conta dá lugar ao cronômetro: mede o topo inteiro
  // na espera o corpo continua no meio, com 1440 px
  assert.deepEqual(await bordas(), [280, 280]);
  await semRolagem(page, 'espera 1920', true);
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.getByRole('button', { name: 'Fotografar' }).waitFor();
  assert.deepEqual(await bordas(), [40, 40]);
  await page.locator('#marca').click(); await aoVivo(page, passar);
  assert.deepEqual(await bordas(), [40, 40]);
  assert.equal((await caixa(page, '.pilulas')).e, 40); // o cabide fica alinhado às pílulas da foto
  await fechar();
});
test('celular: os lados não existem, o que é só da tela larga some e a fila segue a ordem de sempre', async () => {
  const { page, passar, fechar } = await abrir(); // 390 × 844
  const topo = async sel => (await caixa(page, sel)).t;
  assert.equal(await css(page, '.lado', 'display'), 'contents');
  assert.ok(await topo('.fecho') > await topo('.principal'), 'o fecho da capa fica depois do botão');
  await entrar(page);
  assert.ok(await topo('.teaser') < await topo('.principal'), 'as peças borradas ficam antes do botão');
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click(); await page.getByRole('button', { name: 'Fotografar' }).waitFor();
  assert.equal(await page.getByText('Fotografe a peça. Eu digo o que é e sugiro o preço.').isVisible(), false);
  assert.equal(await page.locator('#ir-arara').isVisible(), false); // na câmera o cronômetro ocupa o canto
  await page.locator('#marca').click();
  await aoVivo(page, passar);
  assert.equal(await page.getByText('No teclado: ← passa, → é minha.').isVisible(), false);
  await page.getByRole('button', { name: 'É minha' }).click(); await page.locator('.codigo').waitFor();
  assert.equal(await page.locator('.retrato').isVisible(), false);
  await fechar();
});
