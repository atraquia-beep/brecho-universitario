const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, salvo } = require('./apoio.js');
test('primeira vez: frase editável, e-mail da Unicamp, entrada', async () => {
  const { page, fechar } = await abrir();
  await page.getByText('Oi. Este é o brechó do campus de Limeira, só entre alunos.').waitFor();
  assert.equal(await page.locator('#conta').innerText(), '');
  assert.equal(await page.evaluate(() => document.body.classList.contains('escuro')), false);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByText('Como eu te chamo?').waitFor();
  await page.getByLabel('Seu nome').fill('Deco');
  await page.getByRole('button', { name: /^Tamanho:/ }).click(); await page.getByRole('button', { name: 'G', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: /^Tamanho:/ }).innerText(), 'G');
  await page.getByRole('button', { name: /^Pegada:/ }).click();
  for (const p of ['vintage', 'street']) await page.getByRole('button', { name: p, exact: true }).click();
  await page.getByRole('button', { name: 'pronto', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: /^Pegada:/ }).innerText(), 'vintage e street');
  await page.getByRole('button', { name: /^Teto:/ }).click(); await page.getByRole('button', { name: 'sem teto', exact: true }).click();
  await page.getByRole('button', { name: /^Curso:/ }).click(); await page.getByRole('button', { name: 'Nutrição', exact: true }).click();
  await page.getByLabel('Seu e-mail da Unicamp').fill('deco@gmail.com');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByText('Preciso de um e-mail da Unicamp para deixar você entrar.').waitFor();
  await page.getByLabel('Seu e-mail da Unicamp').fill('d000000@dac.unicamp.br');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByText('Próximo drop · quarta, 20h').waitFor();
  assert.match(await page.locator('#conta').innerText(), /^Deco · R\$\s0 em créditos$/);
  assert.equal(await page.evaluate(() => document.body.classList.contains('escuro')), true);
  assert.deepEqual((await salvo(page)).perfil, { nome: 'Deco', tamanho: 'G', pegadas: ['vintage', 'street'], teto: null, curso: 'Nutrição', email: 'd000000@dac.unicamp.br' });
  await page.reload(); await page.getByText('Próximo drop · quarta, 20h').waitFor();
  await fechar();
});
test('entrar() do apoio leva à tela principal em qualquer endereço', async () => {
  const { page, fechar } = await abrir({ hash: '#/nao-existe' });
  await entrar(page); await page.getByText('Próximo drop · quarta, 20h').waitFor();
  assert.deepEqual((await salvo(page)).perfil, { nome: 'Deco', tamanho: 'M', pegadas: ['vintage', 'street'], teto: 40, curso: 'Administração', email: 'd000000@dac.unicamp.br' });
  const antes = await page.evaluate(() => history.length);
  await page.goto(page.url().split('#')[0] + '#/qualquer/coisa'); await page.getByText('Próximo drop · quarta, 20h').waitFor();
  assert.ok(page.url().endsWith('#/')); assert.ok(await page.evaluate(() => history.length) <= antes + 1);
  await page.goto(page.url().split('#')[0] + '#/constructor'); await page.waitForFunction(() => location.hash === '#/');
  await page.getByText('Próximo drop · quarta, 20h').waitFor();
  await fechar();
});
test('localStorage corrompido ou bloqueado não derruba o app', async () => {
  let a = await abrir({ antes: () => localStorage.setItem('brecho.v2', '{quebrado') });
  await a.page.getByText('só entre alunos').waitFor(); await a.fechar();
  a = await abrir({ antes: () => { Storage.prototype.setItem = () => { throw new Error('cheio'); }; } });
  await entrar(a.page); await a.page.getByText('Próximo drop · quarta, 20h').waitFor(); await a.fechar();
  for (const guardado of ['{"perfil":{"nome":"Deco"},"creditos":"5"}', '{"perfil":{"nome":"Deco"},"creditos":null}', '{"perfil":{"nome":"Deco","pegadas":"x"},"creditos":0,"reservas":[],"anuncios":[]}', '{"reservas":{}}']) {
    a = await abrir({ antes: 'localStorage.setItem("brecho.v2", ' + JSON.stringify(guardado) + ')' });
    await a.page.getByText('só entre alunos').waitFor(); await a.fechar();
  }
  for (const antes of [() => localStorage.setItem('brecho.v2', 'null'), () => localStorage.setItem('brecho.v2', '{}'), () => localStorage.setItem('brecho.v2', '7')]) {
    a = await abrir({ antes });
    await a.page.getByText('só entre alunos').waitFor(); await a.fechar();
  }
});
test('nome com marcação aparece como texto', async () => {
  const { page, fechar } = await abrir();
  await entrar(page, { nome: '<b>Deco</b>' });
  assert.equal(await page.locator('#tela b, #conta b').count(), 0);
  assert.match(await page.locator('#conta').innerText(), /^<b>Deco<\/b> · /);
  await fechar();
});
test('teclado: Escape fecha a lista e o foco volta; escolher devolve o foco; Enter entra', async () => {
  const { page, fechar } = await abrir();
  const tam = page.getByRole('button', { name: /^Tamanho:/ });
  await tam.click(); assert.equal(await tam.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await tam.getAttribute('aria-expanded'), 'false'); assert.equal(await page.locator('.opcoes').count(), 0);
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Tamanho: M');
  await tam.click(); await page.getByRole('button', { name: 'PP', exact: true }).click();
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Tamanho: PP');
  await page.getByLabel('Seu nome').fill('Deco'); await page.getByLabel('Seu e-mail da Unicamp').fill('d000000@unicamp.br');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Seu e-mail da Unicamp');
  await page.keyboard.press('Enter'); await page.getByText('Próximo drop · quarta, 20h').waitFor();
  await fechar();
});
test('campo abraça o texto, sem cortar, e a lógica não vaza nomes globais', async () => {
  const { page, fechar } = await abrir({ largura: 360 });
  assert.deepEqual(await page.evaluate(() => [typeof Logica, typeof DADOS, typeof D, typeof reserva]), ['object', 'object', 'undefined', 'undefined']);
  await page.getByLabel('Seu nome').fill('Deco');
  const larguras = await page.evaluate(() => {
    const s = document.createElement('span'); s.className = 'palavra'; s.textContent = 'Deco'; s.style.cssText = 'position:absolute;border:0';
    document.querySelector('.frase').appendChild(s);
    const r = [document.querySelector('.campo').getBoundingClientRect().width, s.getBoundingClientRect().width]; s.remove(); return r;
  });
  assert.ok(Math.abs(larguras[0] - larguras[1]) <= 6, String(larguras));
  const email = page.getByLabel('Seu e-mail da Unicamp');
  await email.fill('wwwwmmmm@dac.unicamp.br');
  assert.ok(await email.evaluate(e => e.scrollWidth <= e.clientWidth + 1));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await fechar();
});
