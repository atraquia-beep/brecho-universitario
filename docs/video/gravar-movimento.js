// Grava o roteiro do LEIA-ME do Take It com o movimento ligado, em 390 × 844 (celular) e 1280 × 720 (computador),
// converte para MP4 (H.264) sem o começo tingido pelo codificador e monta uma folha de contato com 4 quadros de cada passagem.
// Grava o app como ele é: nada é injetado na página. O relógio e a pessoa são os do teste testes/roteiro.e2e.test.js.
//   node gravar-movimento.js [pasta do app]      grava as duas telas e monta tudo
//   node gravar-movimento.js [pasta] --folhas    só refaz MP4 e folhas a partir da última gravação
// Precisa do Playwright com o Chromium e do ffmpeg. Arquivos de trabalho (webm, quadros, marcas): $TRABALHO ou a pasta temporária.
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');

const args = process.argv.slice(2), soFolhas = args.includes('--folhas');
const RAIZ = path.resolve(args.find(a => !a.startsWith('--')) || '/home/user/brecho-universitario');
const SAIDA = __dirname;
const TRABALHO = process.env.TRABALHO || path.join(os.tmpdir(), 'take-it-gravacao');
const Logica = require(path.join(RAIZ, 'logica.js'));
// terça, 9h, como em testes/apoio.js: o próximo drop é quarta, 20h, e a retirada é terça, das 12h às 13h
const AGORA = new Date('2026-11-10T09:00:00-03:00');
const FONTE = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const TELAS = [[390, 844, 'celular', 'celular-390x844'], [1280, 720, 'computador', 'computador-1280x720']];

// quando tirar os 4 quadros de cada passagem, em segundos. As passagens com curva --expo andam metade do caminho no primeiro quadro (40 ms):
// para elas a conta parte do último quadro parado, achado no vídeo (comecoNaTela); para o resto, da marca.
const LADO = [0, .04, .08, .2];     // lateral (420 ms na ida, 380 na volta) e folha (500 subindo, 360 descendo)
const CRESCE = [0, .04, .08, .6];   // a foto da vitrine; o topo volta depois do pouso
const PASSA = [0, .04, .12, .4];    // o cartão que voa (180 ms) e a próxima que sobe da pilha (500 ms)
const ALINHADOS = [LADO, CRESCE, PASSA];
const FOLHA = LADO;
const ENTRA = [.08, .3, .6, 1.1];   // a entrada escalonada de hoje (.7 s + 60 ms por linha)

async function gravar(largura, altura, nome) {
  const dir = path.join(TRABALHO, 'webm-' + nome);
  fs.rmSync(dir, { recursive: true, force: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1, timezoneId: 'America/Sao_Paulo',
    locale: 'pt-BR', reducedMotion: 'no-preference', recordVideo: { dir, size: { width: largura, height: altura } } });
  await context.clock.install({ time: AGORA }); // corre sozinho a partir de terça, 9h: os 10 s do drop de teste e o "Olhando…" passam de verdade
  const page = await context.newPage();
  const t0 = Date.now(); // o vídeo começa junto com a página
  const marcas = [], erros = [];
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
  page.on('dialog', d => { erros.push('dialog: ' + d.message()); d.dismiss(); });
  const agora = () => (Date.now() - t0) / 1000;
  const marcar = (rotulo, quadros, t = agora()) => marcas.push({ rotulo, t, quadros, alinhar: ALINHADOS.includes(quadros) });
  const pausa = ms => page.waitForTimeout(ms);
  const parada = () => page.locator('html:not([data-passagem])').waitFor({ state: 'attached' });
  const botao = (nome, exact) => page.getByRole('button', { name: nome, exact });
  const aba = nome => page.locator('#abas').getByRole('link', { name: nome });
  const opcao = nome => page.locator('.opcoes').getByRole('button', { name: nome, exact: true });
  // o dedo sai da tela depois de tocar: o mouse parado em cima deixaria o botão com o realce de hover, que o celular não tem
  const soltarDedo = () => page.mouse.move(1, altura / 2);
  // segurar 120 ms: com o clique comum, apertar e soltar caem no mesmo quadro e o botão nunca aparece afundando
  const toque = async (alvo, opcoes) => { await alvo.click({ delay: 120, ...opcoes }); await soltarDedo(); };
  // o dedo (o mouse) pega o meio do alvo e anda (dx, dy) em ms, acelerando e freando; segura e solta
  const arrastar = async (alvo, dx, dy, ms, segura = 0) => {
    await parada(); // um arraste que começa no meio de uma passagem não pega
    const b = await alvo.boundingBox(), x = b.x + b.width / 2, y = b.y + b.height / 2, n = Math.round(ms / 25);
    await page.mouse.move(x, y); await page.mouse.down();
    for (let i = 1; i <= n; i++) { const k = (1 - Math.cos(Math.PI * i / n)) / 2; await page.mouse.move(x + dx * k, y + dy * k); await pausa(25); }
    await pausa(segura); await page.mouse.up(); await soltarDedo();
  };
  const escolher = async (rotulo, opcoes, marca) => {
    await toque(botao(rotulo)); if (marca) marcar(marca, [.04, .12, .24, .5]);
    await pausa(600);
    for (const o of opcoes) { await toque(opcao(o)); await pausa(350); }
    await pausa(300);
  };

  // 1. A abertura e a entrada: e-mail, código e a frase do perfil
  marcar('abertura (fica como está)', [.9, 1.9, 3.4, 4.4]);
  await page.goto('file://' + RAIZ + '/index.html');
  await page.locator('#abertura').waitFor({ state: 'detached', timeout: 10000 });
  await pausa(1500);
  await page.getByLabel('Seu e-mail da Unicamp').pressSequentially('d000000@dac.unicamp.br', { delay: 45 });
  await pausa(500);
  await toque(botao('Receber o código')); marcar('entrada: e-mail → código (A, ida)', LADO);
  await parada(); await pausa(900);
  await page.getByLabel('Dígito 1 de 4').pressSequentially('4815', { delay: 160 });
  marcar('entrada: o código confere (as células giram e viram o visto)', [.3, .75, 1.1, 1.45]);
  await page.waitForFunction(() => document.documentElement.dataset.passagem === 'ida'); marcar('entrada: código → perfil (A, ida)', LADO);
  await page.getByLabel('Seu nome').waitFor(); await parada(); await pausa(800);
  await page.getByLabel('Seu nome').pressSequentially('Deco', { delay: 110 });
  await pausa(400);
  await escolher(/^Tamanho:/, ['M']);
  await escolher(/^Pegada:/, ['vintage', 'street', 'pronto'], 'entrada: a lista de opções da palavra se desdobra (Pegada)');
  await escolher(/^Teto:/, ['até ' + Logica.dinheiro(40)]);
  await escolher(/^Curso:/, ['Administração']);
  await toque(botao('Entrar')); marcar('Entrar → início: a vitrine entra escalonada e a barra sobe', ENTRA);
  await page.locator('#conta').filter({ hasText: 'Deco' }).waitFor();
  await pausa(2200);

  // 2–3. O início e "Me avise antes"
  await toque(botao('Me avise antes'));
  await page.getByText('Combinado. Te aviso cinco minutos antes.').waitFor();
  await pausa(1300);
  // fora do roteiro do LEIA-ME: a foto da vitrine cresce até a arara (o suéter, que a arara põe na frente) e o cabide volta
  await toque(page.locator('.vitrine-peca').nth(1)); marcar('vitrine → arara: a foto tocada cresce (A, ida)', CRESCE);
  await page.locator('#drop').waitFor(); await parada(); await pausa(1300);
  await toque(page.locator('#marca')); marcar('arara → início pelo cabide (A, volta)', LADO);
  await page.locator('.contagem').waitFor(); await parada(); await pausa(1000);

  // 4. A arara: passar arrastando, É minha
  await toque(botao(/^Ver as 5 peças/)); marcar('"Ver as 5 peças" → arara (A, ida)', LADO);
  await page.locator('#drop').getByText(/jaqueta bomber/i).first().waitFor(); await parada(); await pausa(1200);
  // fora do roteiro: um arraste curto para a direita, que não chega ao limite e volta com mola
  marcar('arara: arraste curto para a direita, o carimbo aparece e o cartão volta com mola', [.35, .8, 1, 1.25]);
  await arrastar(page.locator('#peca'), 62, 0, 450, 350);
  await pausa(900);
  marcar('arara: arrasta para a esquerda e passa (a próxima cresce embaixo, carimbo, o cartão voa)', [.2, .38, .5, .8]);
  await arrastar(page.locator('#peca'), -170, 0, 420);
  await page.locator('#drop').getByText(/suéter azul-marinho/i).first().waitFor();
  await pausa(1100); // bem mais que os 200 ms entre passar e "É minha"
  await toque(botao('É minha')); marcar('arara → É seu (C, a folha sobe; a barra desce)', FOLHA);
  await page.getByText('É seu. O suéter azul-marinho da Helena espera você terça, das 12h às 13h, no ponto da FCA. Mostre este código:').waitFor();
  await parada(); await pausa(2000);

  // 5. No lugar de "continuar na arara" (mesmo destino), a folha fecha arrastada pela alça
  marcar('É seu → arara: a folha fecha arrastada pela alça (C, desce; a barra sobe)', [.3, .58, .78, 1.1]);
  await arrastar(page.locator('.alca'), 0, Math.round(altura * .45), 500, 120);
  await page.locator('#drop').waitFor(); await parada(); await pausa(900);
  // fora do roteiro: o resto da arara pelo botão "passo", até "Você viu a arara inteira."
  let ultimo = 0;
  while (await botao('passo').count()) {
    await toque(botao('passo'));
    if (!ultimo) marcar('arara: "passo" (o cartão voa e a próxima sobe da pilha)', PASSA);
    ultimo = agora();
    await pausa(800);
  }
  marcar('arara → "Você viu a arara inteira." (entrada escalonada)', ENTRA, ultimo);
  await page.getByText('Você viu a arara inteira.').waitFor(); await pausa(1200);
  await toque(aba('Comprar')); marcar('arara → início pela aba Comprar (A, volta)', LADO);
  await botao(/^Ver as 4 peças/).waitFor();
  await page.getByRole('link', { name: /^Seu suéter azul-marinho: retirada terça, 12h–13h\. Código/ }).waitFor();
  await parada(); await pausa(1600);

  // 6. Vender: fotografar, "Olhando…", palpite, publicado
  await toque(aba('Vender')); marcar('início → Vender (C, a folha sobe; a barra desce)', FOLHA);
  await botao('Fotografar').waitFor(); await parada(); await pausa(1300);
  await toque(botao('Fotografar')); marcar('Vender: foto → "Olhando…" (a luz varre a foto)', [.1, .45, .8, 1.1]);
  await botao('Anunciar no drop').waitFor(); marcar('Vender: "Olhando…" → palpite (entrada escalonada)', ENTRA);
  await pausa(1800);
  await toque(botao('Anunciar no drop')); marcar('Vender: palpite → publicado (entrada escalonada)', ENTRA);
  await page.getByText(/^No drop em \d+ segundos?\. Sua jaqueta jeans entra quarta, às 20h\.$/).waitFor();
  await pausa(1800);
  await toque(botao(/^Voltar\W*$/)); marcar('Vender → início pelo Voltar (C, a folha desce; a barra sobe)', FOLHA);
  await page.locator('.contagem').waitFor(); await parada(); await pausa(1000);

  // 7. O drop de teste: os 10 s correm de verdade, a cortina AO VIVO, "passo" e a venda da jaqueta
  await toque(botao('ver um drop de teste agora (10 s)'));
  await page.locator('#ao-vivo').waitFor({ state: 'attached', timeout: 15000 });
  marcar('espera → drop no ar: cortina AO VIVO (fica como está)', [.2, .8, 1.3, 1.9]);
  await page.locator('#ao-vivo').waitFor({ state: 'detached', timeout: 8000 }); await pausa(900);
  await toque(botao('passo')); marcar('drop: "passo" (o cartão voa, fica como está)', PASSA);
  await page.getByText(/A Bia, de Nutrição, levou sua jaqueta jeans\. Entraram R\$\s35 em créditos\./).waitFor({ timeout: 15000 });
  await pausa(1800);

  // 8–9. É minha no drop, Voltar ao drop e passar o resto até o fim
  await toque(botao('É minha')); marcar('drop → É sua (C, a folha sobe)', FOLHA);
  await page.getByText('Seus créditos pagaram tudo.').waitFor(); await parada(); await pausa(2000);
  await toque(botao('Voltar ao drop')); marcar('É sua → drop pelo "Voltar ao drop" (C, a folha desce)', FOLHA);
  await page.locator('#drop').waitFor(); await parada(); await pausa(800);
  const acabou = page.getByText('O drop acabou. Você ficou com uma peça.');
  while (!(await acabou.count())) {
    // os outros alunos também levam peças: o botão pode sumir entre olhar e tocar
    if (await botao('passo').count()) { await toque(botao('passo'), { timeout: 1500 }).catch(() => {}); ultimo = agora(); }
    await pausa(650);
  }
  marcar('drop no ar → fim do drop (entrada escalonada; a barra sobe)', ENTRA, ultimo);
  await pausa(1700);
  await toque(botao(/^Voltar\W*$/)); marcar('fim do drop → início pelo Voltar (entrada escalonada)', ENTRA);
  await page.locator('.contagem').waitFor(); await pausa(1200);

  // 10. A camisa retirada
  await toque(page.getByRole('link', { name: /^Sua camisa xadrez: retirada terça, 12h–13h\. Código/ })); marcar('aviso da reserva → É sua (C, a folha sobe; a barra desce)', FOLHA);
  await botao('Já retirei').waitFor(); await parada(); await pausa(1300);
  await toque(botao('Já retirei')); await pausa(1000);
  await toque(botao('ótimo', true));
  await page.getByText('Obrigado. Uma peça a menos no lixo: Administração chegou a 129.').waitFor(); await pausa(1800);
  await toque(botao(/^Voltar\W*$/)); marcar('É sua → início pelo Voltar (C, a folha desce; a barra sobe)', FOLHA);
  await page.locator('.contagem').waitFor(); await parada(); await pausa(1000);

  // 11. Você pela barra e, fora do roteiro, a volta pela barra
  await toque(aba('Você')); marcar('início → Você pela barra (A, ida; a marca da aba desliza, a barra muda de cor)', LADO);
  await page.getByText(/^Seu último anúncio levou \d+ s\.$/).waitFor(); await parada(); await pausa(2500);
  await toque(aba('Comprar')); marcar('Você → início pela barra (A, volta; a marca volta, a barra muda de cor)', LADO);
  await page.locator('.contagem').waitFor(); await parada(); await pausa(1500);

  const webm = await page.video().path();
  await context.close(); // fecha o vídeo
  await browser.close();
  return { webm, marcas, erros };
}

const ffmpeg = (...a) => execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...a.map(String)]);
const duracao = arquivo => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arquivo]).toString());

// O vídeo não tem branco antes da primeira pintura, mas o VP8 do recordVideo começa cinza e depois rosado até assentar (6 a 10 quadros,
// conferido numa página lisa cor creme). O MP4 começa no primeiro quadro em que um canto liso da abertura volta à cor do quadro 0 e fica.
function comecoAssentado(webm) {
  const q = execFileSync('ffmpeg', ['-v', 'error', '-t', '2', '-i', webm, '-vf', 'crop=40:40:iw-60:200,scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  const igual = k => [0, 1, 2].every(c => Math.abs(q[3 * k + c] - q[c]) <= 4);
  for (let k = 1; 3 * (k + 3) <= q.length; k++) if (igual(k) && igual(k + 1) && igual(k + 2)) return k / 25;
  return 0;
}

// Onde a passagem começa na tela: o último quadro parado antes do primeiro que já fez um quarto da mudança dos 0,8 s seguintes
// (o botão que solta muda pouco; a tela que desliza ou sobe muda quase tudo).
function comecoNaTela(mp4, t, largura, altura) {
  const w = 32, h = 2 * Math.round(w * altura / largura / 2), n = w * h, de = Math.max(0, t - .08);
  const q = execFileSync('ffmpeg', ['-v', 'error', '-ss', de.toFixed(3), '-t', '0.8', '-i', mp4, '-vf', `scale=${w}:${h}`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-']);
  const dif = [];
  for (let k = 0; (k + 1) * n <= q.length; k++) { let s = 0; for (let i = 0; i < n; i++) s += Math.abs(q[k * n + i] - q[i]); dif.push(s / n); }
  const k = dif.findIndex(d => d > Math.max(...dif) / 4);
  return de + Math.max(0, k - 1) / 25;
}

// MP4 sem o começo tingido e uma folha de contato: uma linha por passagem, 4 quadros, com o tempo de cada quadro no MP4
function entregar({ webm, marcas }, largura, altura, curto, nome) {
  const corte = comecoAssentado(webm);
  const mp4 = path.join(SAIDA, 'take-it-movimento_' + nome + '.mp4');
  ffmpeg('-ss', corte.toFixed(3), '-i', webm, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4);
  const pasta = path.join(TRABALHO, 'quadros-' + curto);
  fs.rmSync(pasta, { recursive: true, force: true }); fs.mkdirSync(pasta, { recursive: true });
  const w = largura < 900 ? 200 : 320;
  marcas.forEach((m, i) => {
    m.noMp4 = m.alinhar ? comecoNaTela(mp4, m.t - corte, largura, altura) : m.t - corte;
    const ts = m.quadros.map(dt => Math.max(0, m.noMp4 + dt));
    const rotulo = path.join(pasta, i + '.txt');
    fs.writeFileSync(rotulo, String(i + 1).padStart(2, '0') + '  ' + m.rotulo);
    const quadros = ts.map((t, k) => `[${k}:v]trim=end_frame=1,scale=${w}:-2,`
      + `drawtext=fontfile=${FONTE}:text='${t.toFixed(2)} s':x=5:y=h-th-5:fontsize=12:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=3[q${k}]`);
    ffmpeg(...ts.flatMap(t => ['-ss', t.toFixed(3), '-i', mp4]), '-filter_complex', quadros.join(';')
      + `;[q0][q1][q2][q3]hstack=inputs=4,pad=iw:ih+28:0:28:color=0x202020,drawtext=fontfile=${FONTE}:textfile=${rotulo}:x=8:y=7:fontsize=15:fontcolor=white`,
      '-frames:v', 1, path.join(pasta, String(i).padStart(2, '0') + '.png'));
  });
  const folha = path.join(SAIDA, 'folha-de-contato_' + curto + '.jpg');
  ffmpeg('-i', path.join(pasta, '%02d.png'), '-vf', 'tile=1x' + marcas.length, '-frames:v', 1, '-q:v', 5, folha);
  console.log(`${mp4}: ${duracao(mp4).toFixed(1)} s, ${(fs.statSync(mp4).size / 1e6).toFixed(1)} MB (${corte.toFixed(2)} s tingidos cortados do começo)`);
  console.log(`${folha}: ${(fs.statSync(folha).size / 1e6).toFixed(2)} MB`);
  marcas.forEach((m, i) => console.log(`  ${String(i + 1).padStart(2, '0')}  ${m.noMp4.toFixed(2).padStart(6)} s  ${m.rotulo}`));
}

(async () => {
  fs.mkdirSync(TRABALHO, { recursive: true });
  let erros = 0;
  for (const [largura, altura, curto, nome] of TELAS) {
    const salvo = path.join(TRABALHO, 'gravacao-' + curto + '.json');
    let g;
    if (soFolhas) g = JSON.parse(fs.readFileSync(salvo, 'utf8'));
    else { g = await gravar(largura, altura, curto); fs.writeFileSync(salvo, JSON.stringify(g, null, 1)); }
    entregar(g, largura, altura, curto, nome);
    if (g.erros.length) { erros++; console.error('Erros na página (' + curto + '):\n  ' + g.erros.join('\n  ')); }
  }
  process.exit(erros ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
