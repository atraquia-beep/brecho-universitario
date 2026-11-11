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
// quanto do caminho (da largura ou da altura) a tela de cima já andou com 10% do tempo da passagem
const andouNoComeco = page => page.waitForFunction(() => {
  // achar, pausar, andar e ler numa tacada só: a animação não pode acabar entre uma ida ao navegador e outra
  const a = document.getAnimations().find(a => a.effect && a.effect.pseudoElement === '::view-transition-old(root)');
  if (!a) return false;
  a.pause(); a.currentTime = a.effect.getComputedTiming().duration * .1;
  const m = new DOMMatrix(getComputedStyle(document.documentElement, '::view-transition-old(root)').transform);
  a.play();
  return Math.max(m.m41 / innerWidth, m.m42 / innerHeight);
}).then(h => h.jsonValue());

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
  // a passagem pulada não apaga a marca da que começou depois dela
  await page.waitForFunction(() => document.documentElement.dataset.passagem === 'volta', null, { timeout: 2000 });
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
  await page.evaluate(() => { window.__vistos = []; }); // a entrada em passos também desliza: só conta daqui
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
  assert.ok((await page.locator('.vitrine-peca').evaluateAll(as => as.map(a => getComputedStyle(a).animationName))).every(n => n === 'none'));
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

test('volta e desce partem na hora do toque', async () => {
  const { page, fechar } = await comMovimento();
  await verPecas(page).click(); await page.locator('#drop').waitFor(); await fimDaPassagem(page);
  await page.locator('#marca').click();
  const volta = await andouNoComeco(page);
  assert.ok(volta > .25, 'volta: ' + volta);
  await page.locator('.contagem').waitFor(); await fimDaPassagem(page);
  await page.locator('#abas').getByRole('link', { name: 'Vender' }).click();
  await page.getByRole('button', { name: 'Fotografar' }).waitFor(); await fimDaPassagem(page);
  await page.locator('#marca').click();
  const desce = await andouNoComeco(page);
  assert.ok(desce > .25, 'desce: ' + desce);
  await page.locator('.contagem').waitFor(); await fimDaPassagem(page);
  await fechar();
});

test('É minha: com passagem, a folha que sobe é o retorno e só o passar solta o fantasma; sem a API, o fantasma voa como antes', async () => {
  for (const semApi of [false, true]) {
    const { page, fechar } = await comMovimento(semApi ? { antes: () => { delete Document.prototype.startViewTransition; } } : {});
    await verPecas(page).click(); await page.locator('#drop').waitFor(); await fimDaPassagem(page);
    // o lado de cada fantasma que sai da foto
    await page.evaluate(() => {
      window.__fantasmas = [];
      new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.classList && n.classList.contains('fantasma')) window.__fantasmas.push(n.classList[1]); })))
        .observe(document.body, { childList: true, subtree: true });
    });
    await page.getByRole('button', { name: 'passo' }).click();
    await page.getByRole('button', { name: 'É minha' }).click();
    assert.equal(await sentido(page), semApi ? '' : 'sobe');
    await page.locator('.codigo').waitFor(); await fimDaPassagem(page);
    assert.deepEqual(await page.evaluate(() => window.__fantasmas), semApi ? ['esquerda', 'direita'] : ['esquerda']);
    await fechar();
  }
});

// sem perfil: só a abertura sai e a entrada fica no e-mail
async function naEntrada(opcoes) {
  const aberto = await abrir({ movimento: 'no-preference', ...opcoes });
  await aberto.page.locator('#abertura').waitFor({ state: 'detached', timeout: 8000 });
  return aberto;
}

test('entrada desliza para a frente e mantém o foco no campo novo', async () => {
  const { page, fechar } = await naEntrada();
  await page.getByLabel('Seu e-mail da Unicamp').fill('d000000@dac.unicamp.br');
  await page.getByRole('button', { name: 'Receber o código' }).click();
  assert.equal(await sentido(page), 'ida');
  await page.getByLabel('Dígito 1 de 4').waitFor();
  // dentro da passagem só a tela desliza: a chegada escalonada do painel não roda junto
  assert.deepEqual(await page.evaluate(() => document.getAnimations().filter(a => a.animationName === 'entrar' && a.effect.target.closest('.painel')).length), 0);
  await fimDaPassagem(page);
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Dígito 1 de 4');
  await fechar();
});

test('opções se desdobram uma a uma', async () => {
  const { page, fechar } = await comMovimento();
  await page.locator('#abas').getByRole('link', { name: 'Você' }).click();
  await page.getByRole('button', { name: /^Tamanho:/ }).waitFor(); await fimDaPassagem(page);
  await page.getByRole('button', { name: /^Tamanho:/ }).click();
  const js = await page.locator('.opcoes > button').evaluateAll(bs => bs.map(b => [b.style.getPropertyValue('--j'), getComputedStyle(b).animationName]));
  assert.ok(js.length > 2);
  js.forEach(([j, nome], n) => { assert.equal(j, String(n)); assert.match(nome, /entrar/); });
  await fechar();
});

test('marca da aba acompanha a aba ativa, na barra de baixo e no computador', async () => {
  for (const [largura, altura] of [[390, 844], [1280, 720]]) {
    const { page, fechar } = await comMovimento({ largura, altura });
    // a marca é o realce atrás da palavra: --aba-x/--aba-w seguem o span da aba ativa
    const confere = async rotulo => {
      const r = await page.evaluate(() => {
        const abas = document.getElementById('abas'), caixa = abas.getBoundingClientRect(), s = abas.querySelector('[aria-current="page"] span').getBoundingClientRect(), cs = getComputedStyle(abas);
        return { x: parseFloat(cs.getPropertyValue('--aba-x')), w: parseFloat(cs.getPropertyValue('--aba-w')), esperadoX: s.left - caixa.left, esperadoW: s.width };
      });
      assert.ok(Math.abs(r.x - r.esperadoX) <= 1 && Math.abs(r.w - r.esperadoW) <= 1, rotulo + ' ' + JSON.stringify(r));
    };
    await verPecas(page).click(); await page.locator('#drop').waitFor(); await fimDaPassagem(page);
    await confere(largura + ' arara');
    await page.locator('#abas').getByRole('link', { name: 'Você' }).click();
    await page.getByRole('button', { name: /^Tamanho:/ }).waitFor(); await fimDaPassagem(page);
    await confere(largura + ' você');
    await fechar();
  }
});

test('marca da aba: barra que aparece já a encontra no lugar, sem varrer desde o canto', async () => {
  const { page, fechar } = await comMovimento();
  await page.locator('#abas').getByRole('link', { name: 'Vender' }).click();
  await page.getByRole('button', { name: 'Fotografar' }).waitFor(); await fimDaPassagem(page);
  await page.locator('#marca').click();
  const h = await page.waitForFunction(() => {
    const abas = document.getElementById('abas');
    if (document.body.classList.contains('sem-abas') || !document.querySelector('.contagem')) return false;
    const cs = getComputedStyle(abas), t = new DOMMatrix(getComputedStyle(abas, '::after').transform);
    return { feito: Math.abs(t.m41 - parseFloat(cs.getPropertyValue('--aba-x'))) <= 1, x: t.m41, alvo: cs.getPropertyValue('--aba-x') };
  });
  const r = await h.jsonValue();
  assert.ok(r.feito, JSON.stringify(r));
  await fechar();
});

// o #peca na primeira vez que aparece: o nome de view transition dele, a passagem em curso nessa hora, se o que vai por cima da foto espera ela pousar
// e a opacidade da peça de baixo (outra roupa, que não pode aparecer em volta da foto que cresce)
const pecaNaPassagem = page => page.waitForFunction(() => { const p = document.getElementById('peca'), q = document.querySelector('.proxima'); return p && [getComputedStyle(p).viewTransitionName, document.documentElement.dataset.passagem || '', document.body.classList.contains('pousando'), q && getComputedStyle(q).opacity]; }, null, { timeout: 2000 }).then(h => h.jsonValue());

test('a foto tocada cresce até a arara', async () => {
  const { page, fechar } = await comMovimento();
  // o nome da foto na hora do toque: este ouvinte roda depois do da vitrine
  await page.evaluate(() => document.addEventListener('click', e => { const a = e.target.closest('.vitrine-peca'); if (a) window.__nome = a.querySelector('img').style.viewTransitionName; }));
  // abrir a peça em outra aba (Ctrl) não troca a tela aqui: a foto não fica com o nome para a próxima passagem
  await page.locator('.vitrine-peca').first().click({ modifiers: ['Control'] });
  assert.equal(await page.evaluate(() => window.__nome), '');
  await page.locator('.vitrine-peca').nth(2).click();
  assert.equal(await page.evaluate(() => window.__nome), 'peca');
  assert.deepEqual(await pecaNaPassagem(page), ['peca', 'ida', true, '0']); // a foto grande da arara leva o mesmo nome enquanto a passagem corre
  await fimDaPassagem(page);
  assert.deepEqual(await page.evaluate(() => [Array.prototype.filter.call(document.querySelectorAll('*'), e => getComputedStyle(e).viewTransitionName === 'peca').length,
    document.body.classList.contains('pousando')]), [0, false]);
  // nenhuma outra passagem dá o nome à foto: por "Ver as N peças" ela desliza com a tela
  await page.locator('#marca').click(); await page.locator('.contagem').waitFor(); await fimDaPassagem(page);
  await verPecas(page).click();
  assert.deepEqual(await pecaNaPassagem(page), ['none', 'ida', false, '1']);
  await fimDaPassagem(page);
  await fechar();
});

test('vitrine: encaixa foto a foto, e as fotos chegam uma a uma só quando a tela abre sem passagem', async () => {
  const { page, fechar } = await comMovimento(); // a tela de início abriu depois de entrar, sem passagem
  const fotos = () => page.locator('.vitrine-peca').evaluateAll(as => as.map(a => { const cs = getComputedStyle(a); return [cs.scrollSnapAlign, cs.animationName, parseFloat(cs.animationDelay)]; }));
  assert.equal(await page.locator('.vitrine').evaluate(v => getComputedStyle(v).scrollSnapType), 'x mandatory');
  const chegada = await fotos();
  chegada.forEach(([encaixe, nome, atraso], n) => {
    assert.deepEqual([encaixe, nome], ['start', 'entrar']);
    const passo = n && atraso - chegada[n - 1][2];
    if (n) assert.ok(passo > .059 && passo < .081, 'passo de ' + passo + ' s');
  });
  // depois de uma passagem a tela inteira já se moveu: as fotos não entram de novo
  await verPecas(page).click(); await page.locator('#drop').waitFor(); await fimDaPassagem(page);
  await page.locator('#marca').click(); await page.locator('.contagem').waitFor(); await fimDaPassagem(page);
  assert.ok((await fotos()).every(([, nome]) => nome === 'none'));
  await fechar();
});

// ---------- A pilha: a peça de baixo, o arraste e a mola ----------
// na arara, com a passagem de chegada já terminada
async function naArara() {
  const aberto = await comMovimento();
  await verPecas(aberto.page).click(); await aberto.page.locator('#drop').waitFor(); await fimDaPassagem(aberto.page);
  return aberto;
}
// o dedo (o mouse) no meio da foto, andando dx px para o lado, sem soltar
async function puxar(page, dx) {
  const b = await page.locator('#peca').boundingBox(), x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx / 2, y, { steps: 4 }); await page.mouse.move(x + dx, y, { steps: 4 });
}
const nomeDaPeca = page => page.locator('.folha .frase').first().innerText().then(t => t.split(',')[0]);
const brilho = filtro => Number(/brightness\(([\d.]+)\)/.exec(filtro)[1]);

test('a próxima peça espera embaixo e cresce com o arraste', async () => {
  const { page, fechar } = await naArara();
  // a segunda peça da arara do Deco, atrás do cartão e fora da leitura de tela
  assert.deepEqual(await page.locator('#drop .foto > img.proxima').evaluateAll(is => is.map(i => [i.getAttribute('src'), i.alt, i.getAttribute('aria-hidden'), i.nextElementSibling.className])),
    [['fotos/sueter-marinho.jpg', '', 'true', 'cartao']]);
  await puxar(page, 40);
  const r = await page.evaluate(() => {
    const c = getComputedStyle(document.querySelector('.carimbo')), q = document.querySelector('.proxima'), p = getComputedStyle(q), giro = new DOMMatrix(c.transform);
    return { puxa: Number(getComputedStyle(document.querySelector('#drop .foto')).getPropertyValue('--puxa')), opacidade: Number(c.opacity), escala: Number(c.scale),
      giro: Math.round(Math.atan2(giro.b, giro.a) * 180 / Math.PI), proxima: new DOMMatrix(p.transform).a, filtro: p.filter, atraso: q.getAnimations().length };
  });
  assert.ok(r.puxa > .4 && r.puxa < .6, JSON.stringify(r));
  // o carimbo aparece aos poucos e cresce até o tamanho dele, sem perder a inclinação
  assert.ok(r.opacidade > 0 && r.opacidade < 1, JSON.stringify(r));
  assert.ok(r.escala > .85 && r.escala < 1, JSON.stringify(r));
  assert.equal(r.giro, -10);
  // a peça de baixo cresce e clareia junto com o arraste, colada ao dedo (sem transição correndo atrás)
  assert.ok(r.proxima > .94 && r.proxima < 1 && brilho(r.filtro) > .6 && brilho(r.filtro) < 1, JSON.stringify(r));
  assert.equal(r.atraso, 0);
  await fechar();
});

test('soltar antes do limite volta com mola', async () => {
  const { page, fechar } = await naArara();
  const antes = await nomeDaPeca(page);
  await puxar(page, 40); await page.mouse.up();
  const curva = await page.locator('.cartao').evaluate(c => getComputedStyle(c).transitionTimingFunction);
  const pontos = /cubic-bezier\(([^)]+)\)/.exec(curva);
  assert.ok(pontos && Number(pontos[1].split(',')[1]) > 1, curva); // passa do ponto e volta
  assert.equal(await nomeDaPeca(page), antes);
  // a de baixo volta para a pilha junto com o cartão, sem pular de tamanho nem de luz
  assert.equal(await page.locator('#drop .foto').evaluate(f => f.style.getPropertyValue('--puxa')), '0');
  assert.deepEqual(await page.evaluate(() => ['.cartao', '.proxima'].map(s => getComputedStyle(document.querySelector(s)).transitionDuration)), ['0.5s', '0.5s, 0.5s']);
  await fechar();
});

test('a peça nova continua de onde a de baixo estava: inteira depois do arraste, da pilha depois do "passo"', async () => {
  const { page, fechar } = await naArara();
  // escala e brilho do #peca no começo da entrada: achar, pausar no zero, ler e soltar numa tacada só
  const comeco = () => page.waitForFunction(() => {
    const p = document.getElementById('peca'), a = p && p.getAnimations()[0];
    if (!a) return false;
    a.pause(); a.currentTime = 0;
    const cs = getComputedStyle(p), r = [new DOMMatrix(cs.transform).a, cs.filter];
    a.play();
    return r;
  }, null, { timeout: 2000 }).then(h => h.jsonValue()).then(([escala, filtro]) => [Math.round(escala * 100) / 100, Math.round(brilho(filtro) * 100) / 100]);
  const primeira = await nomeDaPeca(page);
  await puxar(page, -150); await page.mouse.up();
  assert.deepEqual(await comeco(), [1, 1]); // já tinha crescido embaixo do dedo: não encolhe nem escurece de novo
  assert.notEqual(await nomeDaPeca(page), primeira);
  await page.getByRole('button', { name: 'passo' }).click();
  assert.deepEqual(await comeco(), [.94, .6]); // sem arraste, sobe da pilha
  await fechar();
});
