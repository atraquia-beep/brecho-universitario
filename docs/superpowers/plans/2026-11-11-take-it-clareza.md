# Take It: tela de início que se explica sozinha — plano de construção

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** trocar a tela de espera do drop por uma tela de início que mostra primeiro as peças à venda, explica o drop em uma frase e dá uma barra fixa Comprar · Vender · Você, sem o campo do pedido.

**Architecture:** site estático sem framework. Toda a interface sai de `app.js` (cada tela devolve nós; `desenhar()` monta), o visual de `estilo.css` e a casca de `index.html`. `logica.js` e `dados.js` quase não mudam. Testes: `node:test` + Playwright (Chromium), relógio fixo em terça 10/11/2026 9h.

**Tech Stack:** HTML, CSS e JavaScript puros; Node 22; Playwright com Chromium já instalado.

**Spec:** `/mnt/project-files/MG900/Ativ05-mvp/app/docs/superpowers/specs/2026-11-10-take-it-clareza-design.md` (leia antes; este plano argumenta a partir dela).

**Repositório:** `/home/user/brecho-universitario`, branch `ux-clareza` (saiu de `main` em `fbdb444`). Base: 83 testes passando em 82 s.

## Global Constraints

- Sem dependência nova, sem framework, sem build. Só `index.html`, `app.js`, `estilo.css`, `dados.js` e `testes/`.
- Diretrizes Karpathy: a menor mudança que resolve; não mexer no que a tarefa não pede; remover só o que a própria mudança deixou órfão; seguir o estilo do arquivo (nomes em português, comentário só para o porquê).
- Identidade Velvet: só os tokens que já existem (`--fundo`, `--tinta`, `--apoio`, `--traco`, `--cor`, `--realce`), só Inter Tight, sem cantos arredondados novos, sem sombra, sem ícone.
- Texto da pessoa só por `textContent` (nunca `innerHTML`).
- Na tela de início, nenhum texto visível usa "pegada", "arara" ou "crédito".
- Contrato com a thread de movimento: barra = um único `<nav id="abas">` no `index.html`, cada aba um `<a>`, a ativa com `aria-current="page"`, escondida pela classe `sem-abas` no `body` (nunca removendo o nó); cada foto da vitrine com `data-peca="<id>"`; o topo mantém `id="marca"` e `id="conta"`.
- Toda área tocável nova com pelo menos 44 px de altura.
- Rodar testes: `node --test --test-concurrency=2 "testes/*.test.js"` (a suíte toda) ou `node --test testes/<arquivo>.test.js` (um arquivo). Não passe a pasta: falha no Node 22.
- Commits: autor `Claude <noreply@anthropic.com>` (já configurado no clone), mensagem em português começando por "Take It: ", e no fim:
  ```
  Co-Authored-By: Claude <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01P7xh9VN3BXKzK7FdmBSHa8
  ```
  Nunca nome de modelo no commit.

## Decisões deste plano (dentro do que o desenho deixou para quem constrói)

- Frase do drop: `"Catorze peças novas entram juntas, só por 10 minutos. Quem tocar primeiro leva. Sete são M."`. A conta é **só pelo tamanho** (`p.tamanho === perfil.tamanho`), para "sete são M" ser verdade literal; "Quem tocar primeiro leva." fica porque é a explicação do drop que saiu de "Cada peça é única…".
- Nome curto na vitrine: `maiuscula(peca.tipo) + ' · ' + peca.tamanho` (ex.: "Jaqueta bomber · M").
- Vitrine vazia (tudo reservado): frase `"Nada à venda agora. As próximas peças entram no drop."`, sem fileira e sem botão.
- O "ensaiar o drop agora" de Você também vira `"ver um drop de teste agora (10 s)"`: a mesma ação com o mesmo nome nas duas telas.
- Os avisos de reserva da espera seguem o desenho, numa linha curta: `"<Sua/Seu> <nome em minúsculas>: retirada terça, 12h–13h. Código XXXX."` (corrigido na construção: o desenho já decidia esse texto).
- O "Voltar" do fim do drop e o da arara vazia ficam (o do fim fecha o drop, não é só navegação). Sai só o link "voltar" de dentro da arara.
- `DADOS.DROP.esperando` sai (o "38 alunos esperando" some da tela e nada mais usa o número).

## Review Focus

1. **Estado gravado antes desta versão** (com `pedido`, `acordar` ou reservas): a tela de início abre sem "Anotado", o drop abre na ordem normal e "Me avise antes" já aparece como "Combinado…". Testes: Tarefa 1 (pedido antigo) e Tarefa 3 (o "Combinado" volta depois de recarregar).
2. **Arara toda reservada**: a tela de início mostra a frase de vazio, sem botão quebrado nem fileira vazia. Teste: Tarefa 3.
3. **Celular baixo (360 × 640) e iPhone 13 (390 × 664)**: a barra nunca cobre a última ação, nada rola para o lado, a primeira dobra mostra peças, botão e começo do drop. Teste: Tarefa 3.
4. **Barra sobre a peça em tela cheia (arara)**: "passo" e "É minha" ficam acima da barra no celular; no computador a foto continua na altura toda e a barra fica na folha. Testes: Tarefa 2.
5. **As duas luzes**: a barra lê bem no preto (início, arara) e no creme (Você). Teste: Tarefa 2.

---

### Tarefa 1: Tirar o pedido da interface

**Files:**
- Modify: `index.html` (linha do `<form id="pedido">`)
- Modify: `app.js` (`naoEntendi`, `pilhaAtual`, `avisosDaEspera`, `telaNoAr`, `recomecar`, bloco `comPedido` em `desenhar`, ouvinte de `submit` do `#pedido`)
- Modify: `estilo.css` (`#pedido`, `body.com-pedido`, `#pedido button` no seletor de `touch-action`, regras `#pedido` da tela larga, comentários que citam o pedido)
- Test: `testes/espera.e2e.test.js`, `testes/drop.e2e.test.js`, `testes/largo.e2e.test.js`, `testes/vender.e2e.test.js`, `testes/roteiro.e2e.test.js`, `testes/capturas.js`

**Interfaces:**
- Produces: `pilhaAtual()` passa a chamar `Logica.ordenarPilha(DADOS.CATALOGO, estado.perfil, null, Logica.foraDaPilha(estado))`. `avisosDaEspera()` devolve só os avisos de reserva. Nada mais lê `estado.pedido` na interface. `logica.js` não muda (as funções de pedido e os testes delas ficam).

- [ ] **Passo 1: Escrever o teste que falha** (em `testes/espera.e2e.test.js`)

```js
test('um pedido gravado antes desta versão é ignorado', async () => {
  const estado = { perfil: { nome: 'Deco', tamanho: 'M', pegadas: ['vintage', 'street'], teto: 40, curso: 'Administração', email: 'd000000@dac.unicamp.br' }, creditos: 0, reservas: [], anuncios: [], pedido: 'um blazer para a entrevista de quinta', acordar: false, realce: '#FF0000', ultimoAnuncioSeg: null, ensaio: null, drop: null };
  const { page, passar, fechar } = await abrir({ antes: 'localStorage["brecho.v2"] = ' + JSON.stringify(JSON.stringify(estado)) });
  await page.getByText('Próximo drop · quarta, 20h').waitFor();
  assert.equal(await page.locator('#pedido').count(), 0);
  assert.equal(await page.getByText(/Anotado/).count(), 0);
  await aoVivo(page, passar);
  assert.match(await page.locator('.folha .frase').first().innerText(), /^Jaqueta jeans, M, pouco uso\. R\$\s35\.$/);
  assert.equal(await page.getByText(/Você pediu/).count(), 0);
  await fechar();
});
```
(importe `aoVivo` de `./apoio.js` no topo do arquivo.)

- [ ] **Passo 2: Rodar e ver falhar**

Run: `node --test testes/espera.e2e.test.js`
Expected: FAIL no novo teste (`#pedido` existe e o drop abre no blazer).

- [ ] **Passo 3: Tirar o pedido** de `index.html`, `app.js` e `estilo.css` como listado em Files. O comentário de `avisosDaEspera` passa a dizer só "reservas por retirar". O `@media (max-height: 700px) and (max-width: 899px)` fica (a Tarefa 3 mexe nele), só sem citar o pedido.

- [ ] **Passo 4: Ajustar os testes que usavam o pedido**
  - `espera.e2e`: apagar `pedido anotado, esquecido e não entendido`, `foco visível no campo do pedido e na seta`, `depois de enviar o pedido o teclado fecha…` e `celular de tela baixa: as ações da espera ficam acima do campo do pedido`; em `espera do roteiro`, apagar as linhas do `#pedido` (scroll, `campo`, `fim`). Apagar o helper `pedir`.
  - `drop.e2e`: apagar `o pedido abre a pilha e some depois do drop`.
  - `largo.e2e`: tirar as asserções e passos do `#pedido` (variável `pedido`, `position: static`, "pedido embaixo do palco", "espera com pedido") e, no teste do celular, a linha do `#pedido` `fixed`.
  - `vender.e2e`, `sua peça é levada no drop…`: tirar a linha do pedido; renomear para `sua peça é levada no drop e o crédito cobre a próxima peça`; o comentário da peça de R$ 30 vira "camisa xadrez, R$ 25".
  - `vender.e2e`, `crédito parcial, crédito total e Pix` (primeira metade, sem pedido; pilha do Deco: jaqueta jeans 35, camisa xadrez 25, moletom preto 40, calça jeans 35, camiseta azul 15):
    ```js
    await a.page.getByRole('button', { name: 'passo' }).click(); await a.page.getByRole('button', { name: 'passo' }).click(); // moletom preto, R$ 40
    await a.page.getByRole('button', { name: 'É minha' }).click();
    await a.page.getByText(/Seus R\$\s35 em créditos já entraram\. Faltam R\$\s5, pagos na hora\./).waitFor();
    assert.match(await a.page.locator('#conta').innerText(), /R\$\s0 em créditos/);
    await a.page.getByRole('button', { name: 'Cancelar a reserva' }).click(); await a.page.locator('#drop').waitFor();
    await a.page.getByRole('button', { name: 'passo' }).click(); await a.page.getByRole('button', { name: 'passo' }).click(); // camiseta azul, R$ 15
    await a.page.getByRole('button', { name: 'É minha' }).click();
    await a.page.getByText('Seus créditos pagaram tudo.').waitFor();
    assert.match(await a.page.locator('#conta').innerText(), /R\$\s20 em créditos/);
    ```
  - `roteiro.e2e`: tirar as duas linhas do pedido e o "Você pediu". Depois de `aoVivo`: tocar **passo** uma vez (a jaqueta jeans do catálogo sai antes de a Bia levar a sua, para o vídeo não mostrar duas jaquetas), conferir `/^Camisa xadrez, M, usada\. R\$\s25\.$/` em `.folha .frase`, `passar(5000)`, a frase da Bia, **É minha**, `'É sua. A camisa xadrez do Leo espera você terça, das 12h às 13h, no ponto da FCA. Mostre este código:'` e `'Seus créditos pagaram tudo.'`. No fim: link `/^Sua camisa xadrez espera você terça, das 12h às 13h\. Código [A-HJKMNP-Z2-9]{4}\.$/` e, em Você, `/Camisa xadrez · terça, das 12h às 13h · código [A-HJKMNP-Z2-9]{4} · retirada/`.
  - `capturas.js`: tirar o bloco `espera-pedido` (4 linhas).

- [ ] **Passo 5: Rodar a suíte toda**

Run: `node --test --test-concurrency=2 "testes/*.test.js"`
Expected: tudo PASS, 79 testes (83 − 5 apagados + 1 novo).

- [ ] **Passo 6: Commit** — `Take It: o pedido sai da interface`

---

### Tarefa 2: Barra fixa Comprar · Vender · Você e topo só com o nome

**Files:**
- Modify: `index.html` (meta viewport; `<nav id="abas">` logo depois de `<main id="tela">`)
- Modify: `app.js` (`atualizarConta`, `desenhar`)
- Modify: `estilo.css` (`--abas`, `#abas`, `#conta`, `#drop` e `.folha` com barra, tela larga)
- Create: `testes/abas.e2e.test.js`
- Modify: `testes/apoio.js`, `testes/primeira-vez.e2e.test.js`, `testes/vender.e2e.test.js`

**Interfaces:**
- Produces (HTML fixo, a outra thread anima em cima):
  ```html
  <nav id="abas" aria-label="Seções"><a href="#/"><span>Comprar</span></a><a href="#/vender"><span>Vender</span></a><a href="#/voce"><span>Você</span></a></nav>
  ```
  e `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- Produces: em `desenhar()`, depois de `rota.tela()`, `body.sem-abas` liga quando NÃO vale `!!estado.perfil && (rota === rotas.arara || rota === rotas.voce || (rota === rotas[''] && ultimaTela !== 'no-ar'))`; a aba com `href` igual a `rota === rotas.voce ? '#/voce' : '#/'` recebe `aria-current="page"` e as outras perdem o atributo. Ou seja: a barra aparece na espera, no fim do drop, na arara e em Você; some na entrada, no drop ao vivo, na câmera e em "É seu".
- Produces: `#conta` mostra só `estado.perfil.nome` (sai " · R$ x em créditos"). O botão `#ir-arara` continua nesta tarefa (a Tarefa 3 tira).
- Produces (CSS): `:root { --abas: calc(56px + env(safe-area-inset-bottom)); }`. `body.sem-abas #abas { display: none; }`. Celular: barra `position: fixed; left: 0; right: 0; bottom: 0; margin: 0 auto; max-width: 430px; z-index: 2` (acima do `#drop`), altura `var(--abas)` com o `padding-bottom` da área segura, fundo `var(--fundo)`, traço de cima `1px solid var(--traco)`, três abas de largura igual e pelo menos 44 px de altura, 15 px, cor `var(--apoio)`; a ativa em `var(--tinta)` com o mesmo realce de `.opcoes [aria-current="true"]` no `span` (`font-weight: 700; background: linear-gradient(transparent 62%, var(--realce) 62%)`). `body:not(.sem-abas)` ganha `padding-bottom: calc(22px + var(--abas))` e `body:not(.sem-abas) #drop { bottom: var(--abas); }`. Tela larga (≥ 900 px): `#abas { max-width: 1440px; }` (centrada como o corpo), sem fundo e sem traço, `pointer-events: none` nela e `auto` nas abas, palavras de 17 px a partir da coluna da direita (`padding-left: calc(96px + var(--coluna))`, `gap: 40px`, abas da largura do texto), `body:not(.sem-abas) { padding-bottom: calc(30px + var(--abas)); }`, `body:not(.sem-abas) #drop { bottom: 0; }` (a foto volta à altura toda) e `body:not(.sem-abas) .folha { padding-bottom: calc(34px + var(--abas)); }`. `#conta` ganha área de toque de 44 × 44 px sem mudar a altura do topo: `min-width: 44px; text-align: right; padding: 13px 0; margin: -13px 0 -13px auto;`. `#abas a` entra no seletor de `touch-action: manipulation`.

- [ ] **Passo 1: Escrever os testes que falham** (`testes/abas.e2e.test.js`). Antes, em `apoio.js`, `entrar()` passa a esperar `page.locator('#conta').filter({ hasText: p.nome })` em vez de "em créditos" (vale antes e depois da mudança).

```js
const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, aoVivo } = require('./apoio.js');
const caixa = (page, sel) => page.locator(sel).first().evaluate(e => e.getBoundingClientRect().toJSON());
const atual = page => page.locator('#abas [aria-current="page"]').innerText();
test('barra: Comprar, Vender e Você a um toque, e some onde a peça ou a câmera ocupam a tela', async () => {
  const { page, passar, fechar } = await abrir();
  assert.equal(await page.locator('#abas').isVisible(), false); // entrada
  await entrar(page);
  const abas = page.locator('#abas a');
  assert.deepEqual(await abas.evaluateAll(as => as.map(a => [a.textContent, a.getAttribute('href')])), [['Comprar', '#/'], ['Vender', '#/vender'], ['Você', '#/voce']]);
  assert.equal(await atual(page), 'Comprar');
  const barra = await caixa(page, '#abas');
  assert.equal(barra.bottom, 844);
  for (const a of await abas.all()) assert.ok((await a.boundingBox()).height >= 44);
  assert.equal(await page.locator('#abas').evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(0, 0, 0)');
  await page.locator('#abas').getByRole('link', { name: 'Você' }).click(); await page.getByText('A cor do seu brechó é').waitFor();
  assert.equal(await atual(page), 'Você');
  assert.equal(await page.locator('#abas').evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(235, 224, 217)');
  await page.goto(page.url().split('#')[0] + '#/arara'); await page.locator('#drop').waitFor();
  assert.equal(await atual(page), 'Comprar');
  const topoDaBarra = (await caixa(page, '#abas')).top;
  for (const b of ['passo', 'É minha']) assert.ok((await page.getByRole('button', { name: b }).boundingBox()).y + (await page.getByRole('button', { name: b }).boundingBox()).height <= topoDaBarra, b + ' embaixo da barra');
  await page.locator('#abas').getByRole('link', { name: 'Vender' }).click(); await page.getByRole('button', { name: 'Fotografar' }).waitFor();
  assert.equal(await page.locator('#abas').isVisible(), false);
  await page.locator('#marca').click(); await aoVivo(page, passar);
  assert.equal(await page.locator('#abas').isVisible(), false);
  await page.getByRole('button', { name: 'É minha' }).click(); await page.locator('.codigo').waitFor();
  assert.equal(await page.locator('#abas').isVisible(), false);
  assert.equal(await page.locator('#abas').count(), 1); // some por classe, o nó fica
  await fechar();
});
test('topo: só o nome, com área de toque de 44 px, sem mudar a altura do topo', async () => {
  const { page, fechar } = await abrir(); await entrar(page, { nome: 'Bia' });
  assert.equal(await page.locator('#conta').innerText(), 'Bia');
  const conta = await caixa(page, '#conta');
  assert.ok(conta.height >= 44 && conta.width >= 44, JSON.stringify(conta));
  assert.ok((await caixa(page, '.topo')).height <= 36);
  await fechar();
});
test('barra na tela larga: na coluna da direita, sem cobrir a folha da arara e sem rolar', async () => {
  const { page, fechar } = await abrir({ largura: 1280, altura: 720 }); await entrar(page);
  const palco = await caixa(page, '.palco'), primeira = await caixa(page, '#abas a');
  assert.ok(primeira.left >= palco.right && primeira.bottom <= 720);
  assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight));
  await page.goto(page.url().split('#')[0] + '#/arara'); await page.locator('#drop').waitFor();
  assert.deepEqual(await page.locator('#drop .foto').evaluate(e => { const r = e.getBoundingClientRect(); return [r.top, r.height]; }), [0, 720]);
  const minha = await page.getByRole('button', { name: 'É minha' }).boundingBox();
  assert.ok(minha.y + minha.height <= (await caixa(page, '#abas a')).top);
  await fechar();
});
```

- [ ] **Passo 2: Rodar e ver falhar**

Run: `node --test testes/abas.e2e.test.js`
Expected: FAIL (`#abas` não existe).

- [ ] **Passo 3: Implementar** o que está em Interfaces.

- [ ] **Passo 4: Ajustar os testes que liam os créditos no topo**
  - `primeira-vez.e2e`: `#conta` vira `assert.equal(…innerText(), 'Deco')` e, no teste do nome com marcação, `'<b>Deco</b>'`.
  - `vender.e2e`: toda leitura de créditos em `#conta` vira `assert.equal((await salvo(page)).creditos, N)` com o mesmo número (35, 0, 20, 0).

- [ ] **Passo 5: Rodar a suíte toda**

Run: `node --test --test-concurrency=2 "testes/*.test.js"`
Expected: tudo PASS, 82 testes. Se uma tela da tela larga passar a rolar para baixo por causa do `padding-bottom` novo, o ajuste é de espaço (margens) e nunca afrouxar o `semRolagem`.

- [ ] **Passo 6: Commit** — `Take It: barra Comprar, Vender e Você; topo só com o nome`

---

### Tarefa 3: Nova tela de início (vitrine primeiro, drop explicado)

**Files:**
- Modify: `app.js` (`telaEspera`, `telaArara`, `telaFim`, `linkDaArara`, `telaVoce`, `atualizarConta`)
- Modify: `index.html` (tirar `<a id="ir-arara">`)
- Modify: `estilo.css` (vitrine, atalhos, `.contagem` menor no celular; tirar `.teaser`, `#ir-arara`, `body.ao-vivo #ir-arara` e `.acoes + .apoio`)
- Modify: `dados.js` (tirar `esperando` de `DROP`)
- Test: `testes/espera.e2e.test.js`, `testes/arara.e2e.test.js`, `testes/largo.e2e.test.js`, `testes/voce.e2e.test.js`, `testes/drop.e2e.test.js`, `testes/vender.e2e.test.js`, `testes/identidade.e2e.test.js`, `testes/abertura.e2e.test.js`, `testes/dados.test.js`, `testes/apoio.js`, `testes/roteiro.e2e.test.js`, `testes/capturas.js`

**Interfaces:**
- Consumes: `#abas` e `sem-abas` (Tarefa 2); `pilhaDaArara(true)` (peças da arara ainda livres, as que servem na frente); `Logica.extenso`, `maiuscula`, `frase`, `apoio`, `botaoPalavra`, `principal`, `lado`, `regua`, `focavel`, `el`.
- Produces: `telaEspera(sit)` devolve `[lado('painel', ...avisosDaEspera(), fichaDaVenda, fraseDaVenda, vitrine, botaoVer), lado('palco', rotulo, contagem, regua(), fraseDoDrop, atalhos)]` — no celular a vitrine vem primeiro; no computador a vitrine fica no painel (direita) e o drop no palco (esquerda, números gigantes).
- Produces (DOM que testes e a thread de movimento usam):
  - ficha: `p.ficha.lab` com dois `span`: "À venda agora" e "N peças" ("1 peça"; vazio: só o primeiro).
  - frase: `"Roupa de quem estuda aqui. Gostou, toque em "` + `span.amostra` "É minha" + `" e ela é sua."`
  - vitrine: `div.vitrine` > `a.vitrine-peca[href="#/arara"]` > (`span.vitrine-foto` > `img[data-peca=id][alt=""]` + `span.etiqueta` com `Logica.dinheiro(preco)`) + `span.vitrine-nome` com `maiuscula(tipo) + ' · ' + tamanho`.
  - botão: `principal(n === 1 ? 'Ver a peça' : 'Ver as ' + n + ' peças', () => { location.hash = '#/arara'; })`.
  - vazio (`n === 0`): no lugar de frase, vitrine e botão, `frase('Nada à venda agora. As próximas peças entram no drop.')`.
  - rótulo: `p#rotulo.ficha.lab` focável, spans `sit.ensaio ? 'Drop de teste' : 'Próximo drop · ' + dia + ', ' + hora + 'h'` e `'faltam'`.
  - contagem: o `p#contagem.contagem` de hoje.
  - frase do drop (`m = DADOS.DROP.duracaoMs / 60000`; `t` = total da pilha; `k` = peças da pilha do tamanho da pessoa; `M` = o link `a.palavra[href="#/voce"]` com o tamanho):
    `t === 1 ? 'Uma peça nova entra sozinha' : maiuscula(extenso(t, 'f')) + ' peças novas entram juntas'` + `', só por ' + m + ' minutos. Quem tocar primeiro leva. '` + (`k === 0` → `'Nenhuma é ', M, ' desta vez.'`; `k === 1` → `'Uma é ', M, '.'`; senão `maiuscula(extenso(k, 'f')) + ' são ', M, '.'`).
  - atalhos: `p.atalhos` com `botaoPalavra('Me avise antes', …)` (que grava `Logica.pedirParaAcordar` e foca `#combinado`) ou, com `estado.acordar`, `span#combinado` focável "Combinado. Te aviso cinco minutos antes."; e `botaoPalavra('ver um drop de teste agora (' + DADOS.DROP.ensaioMs / 1000 + ' s)', ensaiarAgora)`.
- Produces: em Você, o botão do ensaio com o mesmo texto novo. Na arara, sem o link "voltar". No fim do drop: `frase('Enquanto isso, ', linkDaArara(), ' continuam lá.')` com `linkDaArara()` escrevendo "as peças à venda". Sai `#ir-arara` (HTML, `atualizarConta`, CSS).
- Produces (CSS, celular): `.vitrine` em fila com `overflow-x: auto` e sem barra de rolagem, sangrando até a borda direita da coluna sem alargar a página (`margin-right: -24px; padding-right: 24px`); cada peça com 118 × 148 px de foto (`object-fit: cover`, sem cantos arredondados), etiqueta no canto de baixo da foto, nome em 13 px de apoio embaixo; `.atalhos` em coluna (um botão por linha, alinhados à esquerda), 17 px, cada botão com `min-height: 44px`; `.contagem { font-size: calc(var(--coluna) / 6.5); }` no celular, e `calc(var(--coluna) / 4.15)` de volta na tela larga. No `@media (max-height: 700px)`, sai a linha do `.teaser`. Na tela larga, a vitrine fica dentro do painel, com fotos maiores, e a tela 1280 × 720 continua sem rolar.

- [ ] **Passo 1: Escrever os testes que falham** (substituem `espera do roteiro` e `perfil fora do roteiro` em `testes/espera.e2e.test.js`)

```js
const ARARA_DO_DECO = ['bomber-terracota-tiago', 'sueter-marinho-helena', 'jaqueta-jeans-cinza-murilo', 'sueter-creme-sofia', 'camisa-manga-curta-iara'];
const FRASE_DO_DROP = 'Catorze peças novas entram juntas, só por 10 minutos. Quem tocar primeiro leva. Sete são M.';
test('início: as peças à venda primeiro, depois o drop explicado', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await page.getByText('À venda agora').waitFor(); await page.getByText('5 peças', { exact: true }).waitFor();
  await page.getByText('Roupa de quem estuda aqui. Gostou, toque em É minha e ela é sua.').waitFor();
  assert.deepEqual(await page.locator('.vitrine img').evaluateAll(is => is.map(i => i.dataset.peca)), ARARA_DO_DECO);
  assert.deepEqual(await page.locator('.vitrine-nome').allInnerTexts(), ['Jaqueta bomber · M', 'Suéter · M', 'Jaqueta jeans · G', 'Suéter · P', 'Camisa social · M']);
  assert.deepEqual((await page.locator('.vitrine .etiqueta').allInnerTexts()).map(t => t.replace(/\s/g, ' ')), ['R$ 40', 'R$ 30', 'R$ 32', 'R$ 28', 'R$ 20']);
  assert.ok((await page.locator('.vitrine-peca').evaluateAll(as => as.map(a => a.getAttribute('href')))).every(h => h === '#/arara'));
  await page.getByText('Próximo drop · quarta, 20h').waitFor();
  assert.equal(await page.locator('#contagem').innerText(), '35:00:00');
  await passar(1000); assert.equal(await page.locator('#contagem').innerText(), '34:59:59');
  await page.getByText(FRASE_DO_DROP).waitFor();
  assert.equal(await page.getByRole('link', { name: 'M', exact: true }).getAttribute('href'), '#/voce');
  await page.getByRole('button', { name: 'ver um drop de teste agora (10 s)' }).waitFor();
  const texto = (await page.locator('.topo, #tela, #abas').allInnerTexts()).join(' ').toLowerCase();
  for (const palavra of ['pegada', 'arara', 'crédito']) assert.ok(!texto.includes(palavra), palavra + ' na tela: ' + texto);
  assert.equal(await page.locator('#ir-arara, .teaser, #pedido').count(), 0);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole('button', { name: 'Me avise antes' }).click();
  await page.getByText('Combinado. Te aviso cinco minutos antes.').waitFor();
  await page.reload(); await page.getByText('Combinado. Te aviso cinco minutos antes.').waitFor();
  assert.equal((await salvo(page)).acordar, true);
  await page.getByRole('button', { name: 'Ver as 5 peças' }).click(); await page.locator('#drop').waitFor();
  assert.equal((await page.locator('.pilula').first().innerText()).toUpperCase(), 'ARARA · SEMPRE ABERTA');
  await fechar();
});
test('início: a primeira dobra do iPhone 13 mostra peças, botão e o começo do drop, e a barra não cobre nada', async () => {
  for (const [largura, altura] of [[390, 664], [360, 640]]) {
    const { page, fechar } = await abrir({ largura, altura }); await entrar(page);
    const barra = await page.locator('#abas').evaluate(e => e.getBoundingClientRect().top);
    if (largura === 390) {
      const fotos = await page.locator('.vitrine-foto').evaluateAll((fs, b) => fs.filter(f => { const r = f.getBoundingClientRect(); return r.right <= innerWidth && r.bottom <= b; }).length, barra);
      assert.ok(fotos >= 2, fotos + ' fotos inteiras');
      const ver = await page.getByRole('button', { name: 'Ver as 5 peças' }).boundingBox();
      assert.ok(ver.y + ver.height <= barra);
      assert.ok((await page.locator('#rotulo').boundingBox()).y < barra);
    }
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    const fim = await page.locator('.atalhos').evaluate(e => e.getBoundingClientRect().bottom);
    assert.ok(fim <= await page.locator('#abas').evaluate(e => e.getBoundingClientRect().top), largura + 'x' + altura + ': a barra cobre os atalhos');
    for (const b of await page.locator('.atalhos button').all()) assert.ok((await b.boundingBox()).height >= 44);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await fechar();
  }
});
test('início: tocar numa foto abre a arara do começo, e o toque duplo em É minha reserva uma vez só', async () => {
  const { page, fechar } = await abrir(); await entrar(page);
  await page.locator('.vitrine-peca').nth(2).click(); await page.locator('#drop').waitFor();
  assert.match(await page.locator('.folha .frase').first().innerText(), /^Jaqueta bomber terracota,/);
  await page.getByRole('button', { name: 'É minha' }).evaluate(b => { b.click(); b.click(); });
  await page.locator('.codigo').waitFor();
  assert.deepEqual((await salvo(page)).reservas.map(r => r.pecaId), ['bomber-terracota-tiago']);
  await fechar();
});
test('perfil fora do roteiro', async () => {
  const { page, fechar } = await abrir(); await entrar(page, { tamanho: 'GG', pegadas: ['esportivo'], teto: 20 });
  await page.getByText('Catorze peças novas entram juntas, só por 10 minutos. Quem tocar primeiro leva. Uma é GG.').waitFor();
  await fechar();
});
```
No teste `ensaio: a contagem zera…`: o botão vira `'ver um drop de teste agora (10 s)'` e o rótulo `'Drop de teste'`. Em `testes/arara.e2e.test.js`, no teste `tudo reservado…`, depois do **Voltar**: `await page.getByText('Nada à venda agora. As próximas peças entram no drop.').waitFor();` e `assert.equal(await page.locator('.vitrine, .principal').count(), 0);` (no lugar das linhas do botão Arara).

- [ ] **Passo 2: Rodar e ver falhar**

Run: `node --test testes/espera.e2e.test.js`
Expected: FAIL (não há `.vitrine`).

- [ ] **Passo 3: Implementar** o que está em Interfaces (`app.js`, `index.html`, `estilo.css`, `dados.js`).

- [ ] **Passo 4: Ajustar os outros testes ao texto e aos caminhos novos**
  - `apoio.js` (`aoVivo`), `abertura.e2e`, `voce.e2e`, `capturas.js`: `'ensaiar o drop agora'` → `'ver um drop de teste agora (10 s)'`; `'Ensaio do drop'` → `'Drop de teste'`. Em `voce.e2e`, a ordem de leitura procura `'ver um drop de teste agora'` e a frase do GG vira `/Uma é GG\./`.
  - Onde se tocava **vender uma peça para este drop** (`vender.e2e` 7×, `voce.e2e`, `identidade.e2e`, `largo.e2e` 3×, `roteiro.e2e`, `capturas.js`): `page.locator('#abas').getByRole('link', { name: 'Vender' })`.
  - `vender.e2e`, primeiro teste: `'Deco, catorze peças entram juntas.'` → `'Catorze peças novas entram juntas'` (`exact: false`).
  - `drop.e2e`, `retirada depois do drop`: `'Treze peças novas entram juntas, só por 10 minutos. Quem tocar primeiro leva. Seis são M.'`
  - `roteiro.e2e`: a frase da espera vira `FRASE_DO_DROP` (copie a string).
  - `arara.e2e`, primeiro teste: a primeira linha (`#ir-arara` invisível na entrada) vira `#abas` invisível na entrada; entrar na arara por `getByRole('button', { name: 'Ver as 5 peças' })`; tirar as asserções do `#ir-arara` (posição no topo e o número `span`); `'Cada peça é única…'` vira `'À venda agora'`; o "voltar" vira `page.locator('#abas').getByRole('link', { name: 'Comprar' })`; `'Arara, 4 peças'` vira o botão `'Ver as 4 peças'` (também depois do reload); a frase do drop vira `FRASE_DO_DROP`.
  - `arara.e2e`, segundo teste: `#ir-arara` invisível no drop → `#abas` invisível; `'Enquanto isso, a arara continua aberta.'` → `'Enquanto isso, as peças à venda continuam lá.'`; no fim do drop, `#abas` visível e o link "as peças à venda" com `href` `#/arara`.
  - `arara.e2e`, tela larga: `#ir-arara` → botão `'Ver as 5 peças'`.
  - `largo.e2e`, espera na tela larga: `.teaser` → `.vitrine` (`vitrine.e >= palco.d`, visível); a contagem continua ocupando o palco (≥ 90%). No celular: `.vitrine` antes de `#contagem` (no lugar de `.teaser` antes de `.principal`) e, na câmera, `#abas` invisível (no lugar do `#ir-arara`).
  - `dados.test.js`: tirar `esperando: 38` do `deepEqual` do `DROP`.

- [ ] **Passo 5: Rodar a suíte toda**

Run: `node --test --test-concurrency=2 "testes/*.test.js"`
Expected: tudo PASS, 85 testes (84 + o teste dos textos raros, somado na revisão).

- [ ] **Passo 6: Commit** — `Take It: tela de início com as peças à venda e o drop explicado`

---

### Tarefa 4: Roteiro do vídeo, guia de gravação e capturas

**Files:**
- Modify: `testes/roteiro.e2e.test.js`, `LEIA-ME.md`, `testes/capturas.js`

**Interfaces:**
- Consumes: tudo das Tarefas 1–3 (nomes de botões, frases e a barra).

- [ ] **Passo 1: Reescrever `roteiro.e2e.test.js`** como a história do vídeo, nesta ordem (cada linha é uma asserção ou um toque):
  1. `entrar`; `'À venda agora'` e `FRASE_DO_DROP`.
  2. **Me avise antes** → `'Combinado. Te aviso cinco minutos antes.'`
  3. **Ver as 5 peças** → arara na jaqueta bomber; **passo** → suéter azul-marinho; **É minha** → `'É seu. O suéter azul-marinho da Helena espera você terça, das 12h às 13h, no ponto da FCA. Mostre este código:'` e `/Você paga R\$\s30 na hora, em Pix ou dinheiro\./`.
  4. **continuar na arara** → `#drop`; aba **Comprar** → botão `'Ver as 4 peças'` e o aviso `/^Seu suéter azul-marinho: retirada terça, 12h–13h\. Código [A-HJKMNP-Z2-9]{4}\.$/`.
  5. Aba **Vender** → **Fotografar**, `passar(19000)`, **Anunciar no drop** → `'No drop em 19 segundos. Sua jaqueta jeans entra quarta, às 20h.'` → **Voltar**.
  6. `aoVivo` → **passo** → `/^Camisa xadrez, M, usada\. R\$\s25\.$/` → `passar(5000)` → frase da Bia → **É minha** → `'É sua. A camisa xadrez do Leo espera você terça, das 12h às 13h, no ponto da FCA. Mostre este código:'` e `'Seus créditos pagaram tudo.'`
  7. **Voltar ao drop** → `passar(600000)` → `'O drop acabou. Você ficou com uma peça.'` → **Voltar**.
  8. Link `/^Sua camisa xadrez: retirada terça, 12h–13h\. Código [A-HJKMNP-Z2-9]{4}\.$/` → **Já retirei** → **ótimo** → `'Obrigado. Uma peça a menos no lixo: Administração chegou a 129.'` → **Voltar**.
  9. Aba **Você** → `/jaqueta jeans · M · R\$\s35 · vendida em créditos/`, `/Você tem R\$\s10 em créditos\./`, link `/Camisa xadrez · terça, das 12h às 13h · código [A-HJKMNP-Z2-9]{4} · retirada/`, link `/^Suéter azul-marinho · terça, das 12h às 13h · código [A-HJKMNP-Z2-9]{4}$/`, `'Seu último anúncio levou 19 s.'`

- [ ] **Passo 2: Rodar** — `node --test testes/roteiro.e2e.test.js` → PASS.

- [ ] **Passo 3: Atualizar `LEIA-ME.md`** no estilo dele: "Antes de gravar" (abrir a câmera pela aba **Vender**; tirar "Numa tela baixa…" se não valer mais), "Roteiro de gravação sugerido" com os 9 passos acima em prosa (a arara entra no roteiro principal; a seção "Mostrar a arara (opcional)" sai ou vira uma nota curta), o passo de Você pela aba **Você**, e a tabela "O que é simulado" sem a linha "Entender o pedido", com "23 online" no lugar de "23 online e 38 esperando" e "Me avise antes" no lugar de "Acordar antes do drop". Em "Como trocar uma foto", sai `DROP.esperando` da lista; em "A regra do drop e a arara", "O ensaio abre…" vira "O drop de teste abre…".

- [ ] **Passo 4: Atualizar `capturas.js`** para as 11 telas, nesta ordem e com estes nomes: `primeira-vez`, `inicio`, `arara`, `e-seu-arara`, `vender-visor`, `palpite`, `publicado`, `drop-no-ar`, `e-sua-drop`, `fim-do-drop`, `voce`, seguindo o caminho do roteiro novo; o comentário do topo diz "das onze telas" e a mensagem final vira "33 capturas em …". As imagens ficam em `capturas/`, que o `.gitignore` já tira do git.

- [ ] **Passo 5: Rodar** — `node testes/capturas.js` → "33 capturas em …/capturas", sem "Rolagem horizontal". Depois a suíte toda: `node --test --test-concurrency=2 "testes/*.test.js"` → tudo PASS, 85 testes.

- [ ] **Passo 6: Commit** — `Take It: roteiro do vídeo, guia de gravação e capturas da tela nova`

---

## Depois das tarefas (quem coordena faz)

1. Revisão do branch inteiro (`fbdb444..ux-clareza`) contra a spec e as Decisões deste plano; olhar as 33 capturas.
2. Avisar a thread "Animar transições e botões do Take It" antes do push.
3. `git fetch origin main`, avançar `main` para `ux-clareza` (fast-forward), `git push origin main` e `git push origin main:gh-pages`.
4. Publicar na Vercel (projeto `take-it`, `gitSource {type github, repoId "1453074389", ref main}`, produção) e conferir https://takeit-campus.vercel.app no celular (390 × 844) e no computador (1280 × 720).
5. Espelhar o código em `/mnt/project-files/MG900/Ativ05-mvp/app/` (`git archive HEAD | tar -x -C …`), mandar à thread de movimento branch, commit e "no ar", e mostrar ao André o antes e depois.
