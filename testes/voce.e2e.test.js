const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, salvo, aoVivo } = require('./apoio.js');
test('mudar o perfil em Você muda a espera', async () => {
  const { page, fechar } = await abrir(); await entrar(page);
  await page.locator('#conta').click();
  await page.getByText(/Você tem R\$\s0 em créditos\./).waitFor();
  assert.equal(await page.evaluate(() => document.body.classList.contains('escuro')), false);
  await page.getByText('Você ainda não anunciou nada.').waitFor(); await page.getByText('Nenhuma reserva por enquanto.').waitFor();
  await page.getByRole('button', { name: /^Tamanho:/ }).click(); await page.getByRole('button', { name: 'GG', exact: true }).click();
  await page.locator('#marca').click();
  await page.getByText(/(são|é) GG,? na sua pegada/).waitFor();
  await fechar();
});
test('cor de realce vale na hora e depois de recarregar', async () => {
  const { page, fechar } = await abrir(); await entrar(page);
  const realce = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--realce').trim().toUpperCase());
  assert.equal(await realce(), '#F0E4D6');
  await page.locator('#conta').click();
  await page.getByRole('button', { name: /^Cor:/ }).click(); await page.getByRole('button', { name: 'verde', exact: true }).click();
  assert.equal(await realce(), '#DDEBD9');
  await page.reload(); await page.getByText('A cor do seu brechó é').waitFor(); assert.equal(await realce(), '#DDEBD9');
  await fechar();
});
test('ensaiar e recomeçar do zero', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await page.locator('#conta').click();
  await page.getByRole('button', { name: 'ensaiar o drop agora' }).click();
  await page.getByText('Ensaio do drop').waitFor(); await passar(10000); await page.locator('#drop').waitFor();
  await page.locator('#conta').click();
  await page.getByRole('button', { name: 'Recomeçar do zero' }).click();
  await page.getByText('Apagar tudo e começar de novo?').waitFor();
  await page.getByRole('button', { name: 'não', exact: true }).click();
  assert.equal((await salvo(page)).perfil.nome, 'Deco');
  await page.getByRole('button', { name: 'Recomeçar do zero' }).click(); await page.getByRole('button', { name: 'sim', exact: true }).click();
  await page.getByText('só entre alunos').waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('brecho.v2')), null);
  await fechar();
});
test('movimento existe e respeita quem pede menos movimento', async () => {
  const nome = async movimento => { const { page, fechar } = await abrir({ movimento }); const n = await page.evaluate(() => getComputedStyle(document.querySelector('.frase')).animationName); await fechar(); return n; };
  assert.equal(await nome('reduce'), 'none'); assert.equal(await nome('no-preference'), 'entrar');
});
test('trocar de passo na mesma rota anima; trocar uma palavra no mesmo passo, não', async () => {
  const { page, passar, fechar } = await abrir({ movimento: 'no-preference' }); await entrar(page);
  const nome = () => page.evaluate(() => getComputedStyle(document.querySelector('.frase')).animationName);
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.getByRole('button', { name: 'Fotografar' }).click(); await passar(1200);
  await page.getByRole('button', { name: 'Anunciar no drop' }).waitFor();
  assert.equal(await nome(), 'entrar');
  await page.getByRole('button', { name: /^Tamanho:/ }).click(); await page.locator('.opcoes').getByRole('button', { name: 'G', exact: true }).click();
  await page.getByRole('button', { name: 'Tamanho: G' }).waitFor();
  assert.equal(await nome(), 'none');
  await fechar();
});
test('ensaiar funciona depois do fim e durante outro drop', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await aoVivo(page, passar);
  await passar(600000); await page.getByText(/^O drop acabou/).waitFor();
  await page.locator('#conta').click();
  await page.getByRole('button', { name: 'ensaiar o drop agora' }).click();
  await page.getByText('Ensaio do drop').waitFor(); await passar(10000); await page.locator('#drop').waitFor();
  await page.locator('#conta').click();
  await page.getByRole('button', { name: 'ensaiar o drop agora' }).click();
  await page.getByText('Ensaio do drop').waitFor(); await passar(10000); await page.locator('#drop').waitFor();
  await fechar();
});
test('campo em Você: pontuação colada ao texto, sem cortar', async () => {
  const { page, fechar } = await abrir(); await entrar(page);
  await page.locator('#conta').click(); await page.getByText('A cor do seu brechó é').waitFor();
  const medidas = await page.evaluate(() => [...document.querySelectorAll('#tela .campo')].map(c => {
    const css = getComputedStyle(c), s = document.createElement('span');
    s.textContent = c.value; s.style.cssText = 'position:absolute;white-space:pre;font:' + css.font + ';letter-spacing:' + css.letterSpacing;
    document.body.appendChild(s); const largura = s.getBoundingClientRect().width; s.remove();
    const r = document.createRange(); r.setStart(c.nextSibling, 0); r.setEnd(c.nextSibling, 1);
    return { valor: c.value, folga: r.getBoundingClientRect().left - (c.getBoundingClientRect().left + largura), cabe: c.scrollWidth <= c.clientWidth };
  }));
  assert.equal(medidas.length, 2);
  for (const m of medidas) assert.ok(m.folga < 4 && m.cabe, JSON.stringify(m));
  await fechar();
});
