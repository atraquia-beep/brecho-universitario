const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, salvo, aoVivo } = require('./apoio.js');
const D = require('../dados.js');
// A arara fica aberta o tempo todo: mesma peça por vez do drop, sem relógio e sem outras pessoas levando.
const nomeNaTela = async page => (await page.locator('.folha .frase').first().innerText()).split(',')[0];
test('arara: fora do drop dá para olhar, passar e pegar uma peça, e ela vira reserva', async () => {
  const { page, passar, fechar } = await abrir();
  assert.equal(await page.locator('#ir-arara').isVisible(), false); // na entrada ainda não há arara
  await entrar(page);
  // a espera fala só do drop; a arara é um botão no canto de cima, à direita, logo depois da conta, na mesma linha
  await page.getByText('Cada peça é única. Quem tocar primeiro leva.', { exact: true }).waitFor();
  const botao = page.getByRole('link', { name: 'Arara, 5 peças' });
  const [b, c, t] = await Promise.all(['#ir-arara', '#conta', '.topo'].map(s => page.locator(s).evaluate(e => e.getBoundingClientRect().toJSON())));
  assert.ok(Math.abs(b.right - t.right) <= 1 && c.right <= b.left - 8 && c.top < b.bottom && t.height <= 36, 'botão no canto, depois da conta, numa linha só: ' + JSON.stringify([b, c, t]));
  await botao.click();
  await page.locator('#drop').waitFor();
  assert.equal(await page.locator('#ir-arara').isVisible(), false); // dentro da arara o botão sai: a foto ocupa a tela
  assert.deepEqual(await page.locator('.pilula').allInnerTexts().then(t => t.map(x => x.toUpperCase())), ['ARARA · SEMPRE ABERTA', '5 PEÇAS']);
  assert.equal(await page.locator('#placar, #barra, #resta').count(), 0);
  // quem serve em Deco (M, vintage ou street, até R$ 40) vem na frente, na ordem do cadastro
  assert.equal(await nomeNaTela(page), 'Jaqueta bomber terracota');
  await passar(60000); assert.equal(await nomeNaTela(page), 'Jaqueta bomber terracota'); // ninguém leva nada: a arara não tem relógio
  await page.getByRole('button', { name: 'passo' }).click();
  assert.equal(await nomeNaTela(page), 'Suéter azul-marinho');
  assert.equal((await page.locator('.pilula').nth(1).innerText()).toUpperCase(), '4 PEÇAS');
  await page.keyboard.press('ArrowRight'); // no teclado, igual ao drop
  await page.locator('.codigo').waitFor();
  await page.getByText(/^É seu\. O suéter azul-marinho da Helena espera você/).waitFor();
  const e = await salvo(page);
  assert.deepEqual(e.reservas.map(r => [r.pecaId, r.drop, r.aPagar]), [['sueter-marinho-helena', null, 30]]);
  assert.equal(e.drop, null);
  await page.getByRole('link', { name: 'continuar na arara' }).click();
  await page.locator('#drop').waitFor();
  // a bomber passada continua fora desta visita; a peça reservada saiu de vez; depois das duas que servem vêm as outras, na ordem do cadastro
  assert.equal(await nomeNaTela(page), 'Jaqueta jeans cinza');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'passo' }).click();
  await page.getByText('Você viu a arara inteira.').waitFor();
  assert.equal(await page.locator('#drop').count(), 0);
  await page.getByRole('button', { name: 'olhar de novo' }).click();
  assert.equal(await nomeNaTela(page), 'Jaqueta bomber terracota');
  assert.equal((await page.locator('.pilula').nth(1).innerText()).toUpperCase(), '4 PEÇAS');
  // de volta à espera: a reserva aparece e a conta da arara desceu
  await page.getByRole('link', { name: 'voltar' }).click();
  await page.getByRole('link', { name: 'Arara, 4 peças' }).waitFor();
  assert.equal(await page.locator('#ir-arara span').innerText(), '4');
  await page.getByText(/^Seu suéter azul-marinho espera você/).waitFor();
  await page.getByText('Deco, catorze peças entram juntas. Cinco são M, na sua pegada.').waitFor(); // o drop não perdeu nada
  await page.reload(); await page.getByRole('link', { name: 'Arara, 4 peças' }).waitFor();
  await fechar();
});
test('arara: com o drop no ar ela segue aberta e não mexe no placar; o fim do drop aponta para ela', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await aoVivo(page, passar);
  assert.equal(await page.locator('#placar').innerText(), '0 de 14 já foram');
  assert.equal(await page.locator('#ir-arara').isVisible(), false); // durante o drop o topo fica só com a conta
  await page.goto(page.url().split('#')[0] + '#/arara'); await page.locator('#drop').waitFor();
  assert.equal((await page.locator('.pilula').first().innerText()).toUpperCase(), 'ARARA · SEMPRE ABERTA');
  await page.getByRole('button', { name: 'É minha' }).click(); await page.locator('.codigo').waitFor();
  await page.getByRole('button', { name: 'Voltar ao drop' }).click(); await page.locator('#resta').waitFor();
  assert.equal(await page.locator('#placar').innerText(), '0 de 14 já foram');
  for (let i = 0; i < 14; i++) await page.getByRole('button', { name: 'passo' }).click();
  await page.getByText('O drop acabou. Você não pegou nada desta vez.').waitFor();
  await page.getByText('Enquanto isso, a arara continua aberta.').waitFor();
  await page.getByRole('link', { name: 'Arara, 4 peças' }).waitFor(); // fim do drop: o botão volta
  await fechar();
});
test('arara: tudo reservado, a espera avisa e a rota mostra a arara vazia', async () => {
  const reservas = D.ARARA.map((p, i) => ({ pecaId: p.id, codigo: 'AB2' + i, janela: 'terça, das 12h às 13h', creditosUsados: 0, aPagar: p.preco, retirada: false, nota: null, drop: null }));
  const estado = { perfil: { nome: 'Deco', tamanho: 'M', pegadas: ['vintage', 'street'], teto: 40, curso: 'Administração', email: 'd000000@dac.unicamp.br' }, creditos: 0, reservas, anuncios: [], pedido: null, acordar: false, realce: '#FF0000', ultimoAnuncioSeg: null, ensaio: null, drop: null };
  const { page, fechar } = await abrir({ hash: '#/arara', antes: 'localStorage["brecho.v2"] = ' + JSON.stringify(JSON.stringify(estado)) });
  await page.getByText('A arara está vazia agora.').waitFor();
  assert.equal(await page.getByRole('button', { name: 'olhar de novo' }).count(), 0);
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByRole('link', { name: 'Arara', exact: true }).waitFor(); // vazia: o botão fica, sem número
  assert.equal(await page.locator('#ir-arara span').isVisible(), false);
  await fechar();
});
test('arara: na tela larga a peça fica à esquerda e a folha à direita, sem rolagem', async () => {
  const { page, fechar } = await abrir({ largura: 1280, altura: 720 }); await entrar(page);
  await page.locator('#ir-arara').click(); await page.locator('#drop').waitFor();
  const r = await page.evaluate(() => { const c = s => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; };
    return { foto: c('#drop .foto'), folha: c('.folha'), rola: [document.documentElement.scrollWidth <= innerWidth, document.documentElement.scrollHeight <= innerHeight] }; });
  assert.deepEqual(r, { foto: [0, 0, 704, 720], folha: [704, 0, 576, 720], rola: [true, true] });
  await page.getByText('No teclado: ← passa, → é minha.').waitFor();
  await fechar();
});
