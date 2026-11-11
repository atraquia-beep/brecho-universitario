const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, salvo, aoVivo } = require('./apoio.js');
const D = require('../dados.js');
const FRASE_DO_DROP = 'Catorze peças novas entram juntas, só por 10 minutos. Quem tocar primeiro leva. Sete são M.';
// A arara fica aberta o tempo todo: mesma peça por vez do drop, sem relógio e sem outras pessoas levando.
const nomeNaTela = async page => (await page.locator('.folha .frase').first().innerText()).split(',')[0];
test('arara: fora do drop dá para olhar, passar e pegar uma peça, e ela vira reserva', async () => {
  const { page, passar, fechar } = await abrir();
  assert.equal(await page.locator('#abas').isVisible(), false); // na entrada ainda não há barra
  await entrar(page);
  // a tela de início abre com as peças à venda; o botão leva à arara
  await page.getByText('À venda agora', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Ver as 5 peças' }).click();
  await page.locator('#drop').waitFor();
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
  // de volta ao início pela barra: a reserva aparece e as peças à venda desceram para quatro
  await page.locator('#abas').getByRole('link', { name: 'Comprar' }).click();
  await page.getByRole('button', { name: 'Ver as 4 peças' }).waitFor();
  await page.getByText(/^Seu suéter azul-marinho: retirada terça, 12h–13h\. Código\s[A-HJKMNP-Z2-9]{4}\.$/).waitFor();
  await page.getByText(FRASE_DO_DROP).waitFor(); // o drop não perdeu nada
  await page.reload(); await page.getByRole('button', { name: 'Ver as 4 peças' }).waitFor();
  await fechar();
});
test('arara: com o drop no ar ela segue aberta e não mexe no placar; o fim do drop aponta para ela', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await aoVivo(page, passar);
  assert.equal(await page.locator('#placar').innerText(), '0 de 14 já foram');
  assert.equal(await page.locator('#abas').isVisible(), false); // durante o drop a barra sai
  await page.goto(page.url().split('#')[0] + '#/arara'); await page.locator('#drop').waitFor();
  assert.equal((await page.locator('.pilula').first().innerText()).toUpperCase(), 'ARARA · SEMPRE ABERTA');
  await page.getByRole('button', { name: 'É minha' }).click(); await page.locator('.codigo').waitFor();
  await page.getByRole('button', { name: 'Voltar ao drop' }).click(); await page.locator('#resta').waitFor();
  assert.equal(await page.locator('#placar').innerText(), '0 de 14 já foram');
  for (let i = 0; i < 14; i++) await page.getByRole('button', { name: 'passo' }).click();
  await page.getByText('O drop acabou. Você não pegou nada desta vez.').waitFor();
  await page.getByText('Enquanto isso, as peças à venda continuam lá.').waitFor();
  assert.equal(await page.locator('#abas').isVisible(), true); // fim do drop: a barra volta
  assert.equal(await page.getByRole('link', { name: 'as peças à venda' }).getAttribute('href'), '#/arara');
  await fechar();
});
test('arara: tudo reservado, a espera avisa e a rota mostra a arara vazia', async () => {
  const reservas = D.ARARA.map((p, i) => ({ pecaId: p.id, codigo: 'AB2' + i, janela: 'terça, das 12h às 13h', creditosUsados: 0, aPagar: p.preco, retirada: false, nota: null, drop: null }));
  const estado = { perfil: { nome: 'Deco', tamanho: 'M', pegadas: ['vintage', 'street'], teto: 40, curso: 'Administração', email: 'd000000@dac.unicamp.br' }, creditos: 0, reservas, anuncios: [], pedido: null, acordar: false, realce: '#FF0000', ultimoAnuncioSeg: null, ensaio: null, drop: null };
  const { page, fechar } = await abrir({ hash: '#/arara', antes: 'localStorage["brecho.v2"] = ' + JSON.stringify(JSON.stringify(estado)) });
  await page.getByText('A arara está vazia agora.').waitFor();
  assert.equal(await page.getByRole('button', { name: 'olhar de novo' }).count(), 0);
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByText('Nada à venda agora. As próximas peças entram no drop.').waitFor();
  assert.equal(await page.locator('.vitrine, .principal').count(), 0);
  await fechar();
});
test('arara abre na peça tocada da vitrine', async () => {
  const { page, fechar } = await abrir(); await entrar(page);
  await page.locator('.vitrine-peca').nth(2).click(); await page.locator('#drop').waitFor();
  assert.equal(await nomeNaTela(page), 'Jaqueta jeans cinza');
  // sem passagem animada a troca é na hora, e a foto não guarda o nome da passagem que não houve
  assert.equal(await page.evaluate(() => document.getElementById('peca').style.viewTransitionName), '');
  // passo segue a ordem de sempre, sem a peça já vista
  await page.getByRole('button', { name: 'passo' }).click();
  assert.equal(await nomeNaTela(page), 'Jaqueta bomber terracota');
  // a peça tocada vem na frente só na chegada: o endereço volta a ser o da arara e "olhar de novo" recomeça da ordem de sempre
  assert.equal(await page.evaluate(() => location.hash), '#/arara');
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'passo' }).click();
  await page.getByRole('button', { name: 'olhar de novo' }).click();
  assert.equal(await nomeNaTela(page), 'Jaqueta bomber terracota');
  await fechar();
});
test('arara: na tela larga a peça fica à esquerda e a folha à direita, sem rolagem', async () => {
  const { page, fechar } = await abrir({ largura: 1280, altura: 720 }); await entrar(page);
  await page.getByRole('button', { name: 'Ver as 5 peças' }).click(); await page.locator('#drop').waitFor();
  const r = await page.evaluate(() => { const c = s => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; };
    return { foto: c('#drop .foto'), folha: c('.folha'), rola: [document.documentElement.scrollWidth <= innerWidth, document.documentElement.scrollHeight <= innerHeight] }; });
  assert.deepEqual(r, { foto: [0, 0, 704, 720], folha: [704, 0, 576, 720], rola: [true, true] });
  await page.getByText('No teclado: ← passa, → é minha.').waitFor();
  await fechar();
});
