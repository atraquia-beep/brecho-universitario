const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, ateOPerfil, entrar, salvo } = require('./apoio.js');
const focado = page => page.evaluate(() => document.activeElement.getAttribute('aria-label'));
test('entrada: e-mail da Unicamp, código de quatro dígitos, perfil', async () => {
  const { page, passar, fechar } = await abrir({ movimento: 'no-preference' });
  await page.locator('#abertura').click();
  await page.getByText('Oi. O Take It é o brechó do campus de Limeira, só entre alunos.').waitFor();
  assert.equal(await page.locator('#conta').innerText(), '');
  assert.deepEqual(await page.evaluate(() => ['escuro', 'entrada'].map(c => document.body.classList.contains(c))), [true, true]); // a capa abre no preto
  assert.equal(await page.locator('h1.titulo').getAttribute('aria-label'), 'TAKE IT');
  const passo = () => page.locator('.passos [aria-current="step"]').innerText();
  assert.match(await passo(), /^01 E-MAIL$/i);
  await page.getByRole('button', { name: 'Receber o código' }).click();
  await page.getByText('Preciso de um e-mail da Unicamp para deixar você entrar.').waitFor();
  assert.equal(await focado(page), 'Seu e-mail da Unicamp');
  await page.getByLabel('Seu e-mail da Unicamp').fill('deco@gmail.com'); await page.keyboard.press('Enter');
  await page.getByText('Preciso de um e-mail da Unicamp para deixar você entrar.').waitFor();
  await page.getByLabel('Seu e-mail da Unicamp').fill(' d000000@dac.unicamp.br '); await page.keyboard.press('Enter');
  await page.getByText('Mandei quatro dígitos para d000000@dac.unicamp.br. Digite aqui:').waitFor();
  assert.match(await passo(), /^02 CÓDIGO$/i); assert.equal(await focado(page), 'Dígito 1 de 4');
  // digitar anda para a frente, letra não entra, apagar volta
  await page.keyboard.type('4x8'); assert.equal(await focado(page), 'Dígito 3 de 4');
  await page.keyboard.press('Backspace'); assert.equal(await focado(page), 'Dígito 2 de 4');
  assert.deepEqual(await page.locator('.digito').evaluateAll(cs => cs.map(c => c.value)), ['4', '', '', '']);
  assert.equal(await page.locator('.digitos.confere').count(), 0);
  await page.keyboard.type('815');
  assert.deepEqual(await page.locator('.digito').evaluateAll(cs => cs.map(c => c.value)), ['4', '8', '1', '5']);
  await page.locator('.digitos.confere').waitFor(); await page.getByText('Conferindo…').waitFor();
  await passar(1400); assert.match(await passo(), /^02 CÓDIGO$/i);
  await passar(200); await page.getByText('Código certo. Agora me conte de você:').waitFor();
  assert.match(await passo(), /^03 VOCÊ$/i); assert.equal(await focado(page), 'Seu nome');
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
  assert.equal(await page.getByLabel('Seu nome').inputValue(), 'Deco'); // trocar uma palavra não apaga o que foi digitado
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByText('Próximo drop · quarta, 20h').waitFor();
  assert.equal(await page.locator('#conta').innerText(), 'Deco');
  assert.deepEqual(await page.evaluate(() => ['escuro', 'entrada'].map(c => document.body.classList.contains(c))), [true, false]);
  assert.deepEqual((await salvo(page)).perfil, { nome: 'Deco', tamanho: 'G', pegadas: ['vintage', 'street'], teto: null, curso: 'Nutrição', email: 'd000000@dac.unicamp.br' });
  await page.reload(); await page.getByText('Próximo drop · quarta, 20h').waitFor();
  await fechar();
});
test('código: colar espalha os dígitos; "trocar o e-mail" volta com o e-mail no campo; recarregar recomeça do e-mail', async () => {
  const { page, passar, fechar } = await abrir();
  await page.getByLabel('Seu e-mail da Unicamp').fill('d000000@unicamp.br');
  await page.getByRole('button', { name: 'Receber o código' }).click();
  await page.getByRole('button', { name: 'trocar o e-mail' }).click();
  assert.equal(await page.getByLabel('Seu e-mail da Unicamp').inputValue(), 'd000000@unicamp.br'); assert.equal(await focado(page), 'Seu e-mail da Unicamp');
  await page.keyboard.press('Enter');
  await page.getByLabel('Dígito 2 de 4').fill('12 34 56'); // colado no meio: cabe o que cabe, do ponto em diante
  assert.deepEqual(await page.locator('.digito').evaluateAll(cs => cs.map(c => c.value)), ['', '1', '2', '3']);
  assert.equal(await page.locator('.digitos.confere').count(), 0);
  // quem pede menos movimento não espera a animação: o quarto dígito leva direto ao perfil, sem o relógio andar
  await page.getByLabel('Dígito 1 de 4').fill('9'); await page.getByText('Código certo. Agora me conte de você:').waitFor();
  assert.equal(await focado(page), 'Seu nome');
  await page.reload(); await passar(2000);
  await page.getByText('só entre alunos').waitFor(); assert.equal(await page.locator('.digito').count(), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('brecho.v2')), null);
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
  assert.equal(await page.locator('#conta').innerText(), '<b>Deco</b>');
  await fechar();
});
test('teclado: Escape fecha a lista e o foco volta; escolher devolve o foco; Enter entra', async () => {
  const { page, fechar } = await abrir();
  await ateOPerfil(page);
  const tam = page.getByRole('button', { name: /^Tamanho:/ });
  await tam.click(); assert.equal(await tam.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await tam.getAttribute('aria-expanded'), 'false'); assert.equal(await page.locator('.opcoes').count(), 0);
  assert.equal(await focado(page), 'Tamanho: M');
  await tam.click(); await page.getByRole('button', { name: 'PP', exact: true }).click();
  assert.equal(await focado(page), 'Tamanho: PP');
  await page.getByLabel('Seu nome').fill('Deco');
  assert.equal(await focado(page), 'Seu nome');
  await page.keyboard.press('Enter'); await page.getByText('Próximo drop · quarta, 20h').waitFor();
  await fechar();
});
test('campo abraça o texto, sem cortar, e a lógica não vaza nomes globais', async () => {
  const { page, fechar } = await abrir({ largura: 360 });
  assert.deepEqual(await page.evaluate(() => [typeof Logica, typeof DADOS, typeof D, typeof reserva]), ['object', 'object', 'undefined', 'undefined']);
  const email = page.getByLabel('Seu e-mail da Unicamp');
  await email.fill('wwwwmmmm@dac.unicamp.br');
  assert.ok(await email.evaluate(e => e.scrollWidth <= e.clientWidth + 1));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await ateOPerfil(page, 'wwwwmmmm@dac.unicamp.br');
  await page.getByLabel('Seu nome').fill('Deco');
  const larguras = await page.evaluate(() => {
    const s = document.createElement('span'); s.className = 'palavra'; s.textContent = 'Deco'; s.style.cssText = 'position:absolute;border:0';
    const c = document.querySelector('.campo'); c.closest('.frase').appendChild(s);
    const r = [c.getBoundingClientRect().width, s.getBoundingClientRect().width]; s.remove(); return r;
  });
  assert.ok(Math.abs(larguras[0] - larguras[1]) <= 6, String(larguras));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await fechar();
});
