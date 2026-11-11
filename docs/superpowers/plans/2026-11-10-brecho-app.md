# Brechó Universitário, versão 2 (o drop do campus) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um site estático em que as peças do brechó entram todas juntas num drop com hora marcada, a pessoa olha uma peça por vez arrastando, e vende abrindo direto na câmera, para o vídeo do MVP de MG900 – Empreendedorismo.

**Architecture:** Três scripts clássicos carregados em ordem: `dados.js` (catálogo e tabelas), `logica.js` (funções puras, inclusive o relógio do drop e as transições de estado) e `app.js` (estado em `localStorage`, rotas por `location.hash`, telas, gestos e câmera). Toda regra fica em `logica.js` e é testada em Node sem navegador. As telas são testadas por roteiros Playwright sobre `file://`, com o relógio do navegador controlado.

**Tech Stack:** HTML, CSS e JavaScript puros. Node 22 (`node --test`) e Playwright 1.63 (já instalados, `require('playwright')` funciona de qualquer pasta). Nenhuma dependência nova, nenhum passo de build.

**Spec:** `docs/superpowers/specs/2026-11-10-brecho-app-design.md` (leia inteiro antes de começar; as telas de referência estão em `docs/referencia/identidade-v2.jpg` e o CSS do esboço em `docs/referencia/identidade-v2.html`).

## Global Constraints

- Sem framework, sem servidor, sem dependência nova, sem build. Abre por link e por duplo clique (`file://`): nada de `fetch` de arquivo local nem de módulos ES.
- Cada `.js` é script clássico e também carregável no Node. `dados.js` termina com `if (typeof module !== 'undefined') module.exports = DADOS;`. `logica.js` começa com `const D = typeof require !== 'undefined' ? require('./dados.js') : DADOS;` e termina exportando `Logica` do mesmo jeito.
- Celular primeiro: 360 a 430 px sem rolagem horizontal. No computador, coluna central com largura de celular.
- Duas luzes. Papel (primeira vez, é sua, você): fundo `#FFFFFF`, tinta `#1F2322`, apoio `#6E7270`. Drop (`body.escuro`: espera, drop no ar, fim, câmera): fundo `#1F2322`, tinta `#F4F1EA`, apoio `#A9ADAA`. Realce padrão `#F0E4D6` (no escuro, o mesmo tom a 26% de opacidade).
- Frases em Newsreader ~21 px peso 400. Apoio em Inter 13 px. Contagem em Newsreader ~76 px com `font-variant-numeric: tabular-nums`. Fontes já estão em `fontes/` (`Newsreader-normal.woff2` variável 400–600, `Newsreader-italic.woff2`, `Inter-normal.woff2` variável 400–600); carregue por `@font-face` local.
- O app fala em frases. Ação é palavra sublinhada (`<button>` ou `<a>` de verdade). A ação principal de cada tela tem peso 600, uma faixa de realce por baixo e "›". Sem caixa, sem sombra, sem ícone de sistema, sem emoji. As fotos são a única cor.
- Nada de nome, logotipo, desenho ou arquivo de fonte do Instinct, do Depop ou de outra marca. Nenhum texto do app afirma que há IA.
- Português do Brasil, "você". Dinheiro sempre por `Logica.dinheiro` (usa espaço não separável: `R$\u00A035`).
- Texto vindo da pessoa (nome, e-mail, pedido) entra no DOM só por `textContent`, nunca por `innerHTML`.
- Acessível: foco visível, `alt` em toda foto de peça, contraste suficiente, todo gesto com botão e tecla equivalentes, `prefers-reduced-motion` respeitado.
- Estado em `localStorage` na chave `brecho.v2`, sempre dentro de `try/catch`; sem ele o app funciona em memória.
- O tempo vem sempre de `Date.now()` e de **um** `setInterval` de 200 ms (os testes controlam o relógio em múltiplos de 200 ms). Dias e horas usam o relógio local do aparelho.
- Diretrizes Karpathy do projeto: o mínimo de código que resolve, nada de abstração ou opção não pedida.
- Rodar tudo: `node --test --test-concurrency=2 "testes/*.test.js"`. Um arquivo: `node --test testes/<arquivo>`.
- Todo commit termina com estas duas linhas:
  ```
  Co-Authored-By: Claude <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01P7xh9VLjoeDTJVgkRyUf97
  ```
- Depois de cada commit, espelhe a pasta: `mkdir -p /mnt/project-files/MG900/Ativ05-mvp/app/ && git -C /home/user/brecho archive HEAD | tar -x -C /mnt/project-files/MG900/Ativ05-mvp/app/` (não há `rsync`; `/mnt/project-files/` é montagem de rede: sempre com a barra final, nunca varra a pasta inteira).

## Review Focus

1. **`localStorage` ausente, corrompido ou cheio** (aba anônima, `file://`, foto grande): o app abre do zero e continua em memória, sem erro. Testes nas Tasks 6 e 9.
2. **Aparelho sem câmera ou sem permissão**: a tela de vender continua com a peça de exemplo e com a galeria, sem erro e sem travar. Testes na Task 9.
3. **Recarregar, voltar ou sair no meio do drop, endereço quebrado e toque duplo**: volta para a mesma peça, sem reserva duplicada e sem prender o botão de voltar. Testes nas Tasks 5 e 8.
4. **O tempo do drop** (drop que acaba com o app fechado, ensaio velho, pilha que termina antes do tempo, drop do calendário fechado cedo): sempre uma tela válida e a contagem certa. Testes nas Tasks 5 e 8.
5. **Perfil fora do roteiro e texto livre estranho** (GG, esportivo, até R$ 20; maiúsculas, sem acento, HTML, vazio): a pilha nunca fica vazia, o pedido entende o que dá e nunca injeta marcação. Testes nas Tasks 3, 6 e 7.

---

### Task 1: Esqueleto e identidade

**Files:**
- Create: `index.html`, `estilo.css`, `app.js` (provisório), `dados.js` e `logica.js` (provisórios), `testes/apoio.js`, `testes/identidade.e2e.test.js`
- Existing: `fontes/*.woff2`

**Interfaces:**
- Produces (DOM fixo em `index.html`):
  ```html
  <header class="topo"><a id="marca" href="#/" aria-label="Tela principal"><svg>cabide</svg></a><a id="conta" href="#/voce"></a></header>
  <main id="tela" aria-live="polite"></main>
  <form id="pedido" hidden><input id="pedido-campo" aria-label="Diga o que procura" placeholder="Diga o que procura" autocomplete="off"><button aria-label="Enviar pedido">↑</button></form>
  <script src="dados.js"></script><script src="logica.js"></script><script src="app.js"></script>
  ```
- Produces (CSS): variáveis `--fundo`, `--tinta`, `--apoio`, `--realce` em `:root`, trocadas por `body.escuro`. Classes `.frase` (parágrafo em serifa), `.apoio` (Inter 13 px), `.palavra` (botão ou link sublinhado dentro da frase), `.principal` (ação principal), `.opcoes` (linha de opções sublinhadas), `.codigo` (serifa ~64 px), `.contagem` (serifa ~76 px, tabular), `.pilula` (rótulo pequeno sobre foto), `.etiqueta` (etiqueta branca sobre foto).
- O cabide é um SVG nosso, de traço irregular, com `stroke="currentColor"` (referência: símbolo `#cabide` em `docs/referencia/identidade-v2.html`).
- Produces (`testes/apoio.js`): `AGORA = new Date('2026-11-10T09:00:00-03:00')` (terça, 9h; o próximo drop é quarta, 20h, dali a 35 horas). `abrir({ largura = 390, altura = 844, hash = '', antes, movimento = 'reduce', camera = false } = {})` devolve `{ page, passar, fechar }`. Ele abre Chromium (com `args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']` quando `camera`), contexto com `timezoneId: 'America/Sao_Paulo'`, `locale: 'pt-BR'`, `reducedMotion: movimento`; faz `page.clock.install({ time: AGORA })` e `page.clock.pauseAt(AGORA)`; registra `pageerror`, `console` de erro e `dialog` (dispensa e registra); roda `page.addInitScript(antes)` se houver; abre `file://<raiz>/index.html` + `hash`. `passar(ms)` é `page.clock.runFor(ms)`. `fechar()` fecha e faz `assert.deepEqual(erros, [])`.
- `app.js` provisório só escreve em `#tela` um `<p class="frase">`; `dados.js` e `logica.js` nascem como `const DADOS = {}` e `const Logica = {}` com o rodapé de exportação.

- [ ] **Step 1: Write the failing test** (`testes/identidade.e2e.test.js`)

```js
const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir } = require('./apoio.js');
test('identidade: papel e drop, fontes embutidas, foco, sem rolagem lateral', async () => {
  const { page, fechar } = await abrir({ largura: 360 });
  const css = (sel, prop) => page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s))[p], [sel, prop]);
  assert.deepEqual([await css('body', 'backgroundColor'), await css('.frase', 'color')], ['rgb(255, 255, 255)', 'rgb(31, 35, 34)']);
  assert.match(await css('.frase', 'fontFamily'), /Newsreader/);
  const carregadas = await page.evaluate(() => document.fonts.ready.then(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, ''))));
  assert.ok(carregadas.includes('Newsreader'));
  assert.ok(await page.locator('#marca svg').isVisible());
  await page.keyboard.press('Tab');
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'none');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.evaluate(() => document.body.classList.add('escuro'));
  assert.deepEqual([await css('body', 'backgroundColor'), await css('.frase', 'color'), await css('#marca', 'color')], ['rgb(31, 35, 34)', 'rgb(244, 241, 234)', 'rgb(244, 241, 234)']);
  await fechar();
});
test('computador: coluna central com largura de celular', async () => {
  const { page, fechar } = await abrir({ largura: 1280 });
  const r = await page.evaluate(() => { const b = document.querySelector('#tela').getBoundingClientRect(); return [b.width, b.left, innerWidth - b.right]; });
  assert.ok(r[0] >= 360 && r[0] <= 430); assert.ok(Math.abs(r[1] - r[2]) < 2);
  await fechar();
});
```

- [ ] **Step 2: Run** `node --test testes/identidade.e2e.test.js`. Expected: FAIL (não existe `apoio.js` nem `index.html`).
- [ ] **Step 3: Implement** `testes/apoio.js`, `index.html`, `estilo.css` e os três `.js` provisórios. Compare a olho com `docs/referencia/identidade-v2.jpg`.
- [ ] **Step 4: Run** de novo. Expected: PASS, 2 testes.
- [ ] **Step 5: Commit** `feat: esqueleto e identidade visual em duas luzes`.

---

### Task 2: Catálogo e fotos

**Files:**
- Create: `dados.js` (substitui o provisório), `fotos/*.jpg`, `fotos/CREDITOS.md`, `testes/dados.test.js`

**Interfaces:**
- Produces `DADOS` com exatamente estas chaves:
  - `TAMANHOS: ['PP','P','M','G','GG']`; `PEGADAS: ['básico','vintage','street','social','esportivo']`; `TETOS: [20, 40, 60, 80, null]`; `ESTADOS: ['novo com etiqueta','pouco uso','usado']`
  - `CURSOS: ['Administração','Administração Pública','Ciências do Esporte','Engenharia de Manufatura','Engenharia de Produção','Nutrição','Engenharia Ambiental','Engenharia de Telecomunicações','Engenharia de Transportes','Sistemas de Informação','Análise e Desenvolvimento de Sistemas','outro curso']`
  - `CORES: [{nome:'areia',hex:'#F0E4D6'},{nome:'verde',hex:'#DDEBD9'},{nome:'rosa',hex:'#F6DDE3'},{nome:'azul',hex:'#DCE8F5'},{nome:'amarelo',hex:'#F7EBC0'}]`
  - `TIPOS: { [tipo]: { artigo: 'um'|'uma', genero: 'm'|'f', sinonimos: string[], faixa: [min, max] } }` com pelo menos: jaqueta jeans (`faixa: [30, 40]`), jaqueta de couro, blazer, camiseta, moletom, camisa social, vestido, calça jeans. Não existe o tipo `terno` nem esse sinônimo. `jaqueta jeans` e `jaqueta de couro` têm o sinônimo `jaqueta`; `jeans` sozinho é sinônimo só de `calça jeans`. A comparação tira acentos, então não repita sinônimo sem acento. `faixa` vale para o estado "pouco uso", em múltiplos de 5.
  - `OCASIOES: { entrevista: [...], festa: [...], frio: [...], treino: [...] }` (listas de tipos; `festa` inclui `jaqueta jeans`).
  - `CATALOGO: Peca[]`, exatamente 14 itens. `Peca = { id, tipo, nome, tamanho, preco (inteiro), estado, pegadas: string[], foto: 'fotos/<arquivo>.jpg', alt, vendedor: { nome, artigo: 'a'|'o', curso, nota, vendas } }`.
  - `PALPITES: [{ tipo: 'jaqueta jeans', estado: 'pouco uso' }, ...]` (2 a 4); `COMPRADOR: { nome: 'Bia', artigo: 'a', curso: 'Nutrição' }`; `CONTADOR_BASE: 128`; `COMISSAO: 0.10`; `PERFIL_PADRAO: { nome: '', tamanho: 'M', pegadas: ['básico'], teto: 40, curso: 'Administração', email: '' }`.
  - `DROP: { dias: [1, 3], hora: 20, duracaoMs: 600000, ensaioMs: 10000, levaACadaMs: 8000, vendaAposMs: 5000, online: 23, esperando: 38 }` (`dias` no padrão de `Date.getDay()`: segunda e quarta).
- Peças obrigatórias: a primeira do catálogo é `jaqueta-jeans-ana` (nome "Jaqueta jeans", jaqueta jeans, M, 35, pouco uso, vintage, Ana, artigo `a`, Administração, nota 4.8, 12 vendas). `blazer-preto-rafa` (nome "Blazer preto", blazer, M, 38, pouco uso, só social, vendedor Rafa, artigo `o`) vem antes de `blazer-bege-carol` (blazer, M, 30, só social).
- Exatamente cinco peças servem no perfil do roteiro (M, pegada vintage ou street, até R$ 40). Nenhuma peça GG tem a pegada esportivo com preço até R$ 20.
- Fotos: licença Unsplash, baixadas com `curl -sS -o fotos/<nome>.jpg "https://images.unsplash.com/photo-<ID>?w=800&q=70&fm=jpg"`. IDs já conferidos: `1543076447-215ad9ba6923` jaqueta jeans clara numa porta (use na da Ana); `1611312449408-fcece27cdbb7` jaqueta jeans escura (reserve para a Task 9, não entra no catálogo); `1551028719-00167b16eac5` e `1727515546577-f7d82a47b51d` jaquetas de couro; `1585412459272-762fb93357c3` blazer preto em cabide; `1761499101317-e32c4ed50b2f` blazer bege; `1564584217132-2271feaeb3c5` camiseta azul-clara; `1666358070734-b9d6590278c9` camiseta marinho; `1685883518316-355533810d68` camisetas estampadas; `1576871337622-98d48d1cf531` camisetas pretas; `1620799140188-3b2a02fd9a77` moletom branco; `1680292783974-a9a336c10366` moletom preto estampado; `1739384994765-d44f7af12029` moletom azul; `1603252109303-2751441dd157` camisa social branca em cabide; `1630355734650-55fe91e1e5c7` camisa xadrez vermelha; `1714143136372-ddaf8b606da7` calça jeans azul em fundo claro; `1714143164072-7646ef5cb24d` calça jeans escura; `1519554318711-aaf73ece6ff9` regata preta em cabide (cadastre como camiseta); `1534875756527-5e8e4392005f` vestido branco de renda numa porta de madeira. Evite `1598808503746-f34c53b9323e` (terno em manequim). Se precisar de outra foto, procure com WebFetch em `https://unsplash.com/s/photos/<termo>?license=free` (só URLs que começam com `https://images.unsplash.com/photo-`, nunca `plus.unsplash.com`). Olhe cada foto baixada antes de usar. `CREDITOS.md` lista arquivo, URL de origem e "licença Unsplash".

- [ ] **Step 1: Write the failing test** (`testes/dados.test.js`)

```js
const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const path = require('node:path');
const D = require('../dados.js'); const raiz = path.join(__dirname, '..');
test('catálogo íntegro', () => {
  assert.equal(D.CATALOGO.length, 14);
  assert.equal(new Set(D.CATALOGO.map(p => p.id)).size, 14);
  for (const p of D.CATALOGO) {
    assert.ok(fs.statSync(path.join(raiz, p.foto)).size < 200_000, p.foto);
    assert.ok(D.TIPOS[p.tipo] && D.TAMANHOS.includes(p.tamanho) && D.ESTADOS.includes(p.estado), p.id);
    assert.ok(Number.isInteger(p.preco) && p.preco >= 10 && p.preco <= 80, p.id);
    assert.ok(p.pegadas.length && p.pegadas.every(x => D.PEGADAS.includes(x)), p.id);
    assert.ok(p.alt && p.nome && p.vendedor.nome && ['a', 'o'].includes(p.vendedor.artigo) && D.CURSOS.includes(p.vendedor.curso), p.id);
  }
});
test('tabelas', () => {
  for (const t of Object.values(D.TIPOS)) { assert.ok(['um', 'uma'].includes(t.artigo) && ['m', 'f'].includes(t.genero) && t.sinonimos.length); assert.ok(t.faixa[0] >= 10 && t.faixa[0] < t.faixa[1] && t.faixa.every(v => v % 5 === 0)); }
  assert.deepEqual(D.TIPOS['jaqueta jeans'].faixa, [30, 40]); assert.equal(D.TIPOS.terno, undefined);
  const sin = t => D.TIPOS[t].sinonimos;
  assert.ok(sin('jaqueta jeans').includes('jaqueta') && sin('jaqueta de couro').includes('jaqueta') && !sin('jaqueta jeans').includes('jeans'));
  assert.ok(!Object.values(D.TIPOS).some(t => t.sinonimos.includes('terno')));
  for (const lista of Object.values(D.OCASIOES)) assert.ok(lista.length && lista.every(t => D.TIPOS[t]));
  assert.ok(D.OCASIOES.festa.includes('jaqueta jeans'));
  assert.deepEqual(D.PALPITES[0], { tipo: 'jaqueta jeans', estado: 'pouco uso' });
  assert.equal(D.CORES.length, 5); assert.equal(D.CORES[0].hex, '#F0E4D6'); assert.equal(D.CONTADOR_BASE, 128); assert.equal(D.COMISSAO, 0.10);
  assert.deepEqual(D.DROP, { dias: [1, 3], hora: 20, duracaoMs: 600000, ensaioMs: 10000, levaACadaMs: 8000, vendaAposMs: 5000, online: 23, esperando: 38 });
});
test('distribuição que o roteiro precisa', () => {
  const de = t => D.CATALOGO.filter(p => p.tamanho === t).length;
  assert.ok(de('P') >= 2 && de('M') >= 3 && de('G') >= 2 && de('PP') >= 1 && de('GG') >= 1);
  const roteiro = p => p.tamanho === 'M' && p.preco <= 40 && p.pegadas.some(x => ['vintage', 'street'].includes(x));
  assert.equal(D.CATALOGO.filter(roteiro).length, 5);
  assert.deepEqual(D.CATALOGO.filter(p => p.tipo === 'blazer' && p.tamanho === 'M' && p.preco <= 40).map(p => p.id), ['blazer-preto-rafa', 'blazer-bege-carol']);
  assert.equal(D.CATALOGO.filter(p => p.tamanho === 'GG' && p.preco <= 20 && p.pegadas.includes('esportivo')).length, 0);
  const a = D.CATALOGO[0];
  assert.deepEqual([a.id, a.nome, a.tipo, a.tamanho, a.preco, a.estado, a.vendedor.nome, a.vendedor.artigo, a.vendedor.curso, a.vendedor.nota, a.vendedor.vendas], ['jaqueta-jeans-ana', 'Jaqueta jeans', 'jaqueta jeans', 'M', 35, 'pouco uso', 'Ana', 'a', 'Administração', 4.8, 12]);
  const rafa = D.CATALOGO.find(p => p.id === 'blazer-preto-rafa'), carol = D.CATALOGO.find(p => p.id === 'blazer-bege-carol');
  assert.deepEqual([rafa.nome, rafa.preco, rafa.estado, rafa.pegadas, rafa.vendedor.nome, rafa.vendedor.artigo], ['Blazer preto', 38, 'pouco uso', ['social'], 'Rafa', 'o']);
  assert.deepEqual([carol.preco, carol.pegadas], [30, ['social']]);
});
test('créditos das fotos', () => { const c = fs.readFileSync(path.join(raiz, 'fotos/CREDITOS.md'), 'utf8'); for (const p of D.CATALOGO) assert.ok(c.includes(path.basename(p.foto)), p.foto); });
```

- [ ] **Step 2: Run** `node --test testes/dados.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** `dados.js`, baixe e olhe as fotos (Read em cada uma), escreva `CREDITOS.md`. Vendedores fictícios, só primeiro nome.
- [ ] **Step 4: Run**. Expected: PASS, 4 testes.
- [ ] **Step 5: Commit** `feat: catálogo de exemplo e fotos`.

---

### Task 3: Lógica de quem vê o quê

**Files:**
- Create: `logica.js` (substitui o provisório), `testes/logica.test.js`

**Interfaces:**
- Consumes: `DADOS` (Task 2). `Perfil = { nome, tamanho, pegadas: string[], teto: number|null, curso, email }`.
- Produces em `Logica`:
  - `emailValido(email: string): boolean` — sem espaços, algo antes do `@`, termina em `@dac.unicamp.br` ou `@unicamp.br`, sem diferenciar maiúsculas.
  - `serve(peca, perfil): boolean` — mesmo tamanho, preço até o teto (`null` = sem teto) e ao menos uma pegada em comum.
  - `extenso(n: number, genero: 'm'|'f'): string` — 1 a 20 por extenso ("uma"/"duas" no feminino, "catorze"), acima disso em algarismos.
  - `dinheiro(valor: number): string` — `'R$\u00A035'`, `'R$\u00A031,50'`.
  - `entenderPedido(texto: string, perfil): { tipos: string[], tamanho: string, teto: number|null }` — compara sem acento e sem caixa. `tipos`: os tipos cujo nome ou sinônimo aparece no texto; se nenhum aparece, os da ocasião citada; senão `[]`. `tamanho`: palavra solta PP, P, M, G ou GG que não seja seguida de `/`; senão o do perfil. `teto`: número depois de "até" (com ou sem "R$"); senão o do perfil.
  - `buscar(catalogo, pedido, fora: string[]): Peca[]` — tipo dentro de `pedido.tipos`, mesmo tamanho, preço até o teto, id fora de `fora`; `tipos` vazio devolve `[]`.
  - `ordenarPilha(catalogo, perfil, textoDoPedido: string|null, fora: string[]): Peca[]` — tira os ids de `fora`; primeiro as peças de `buscar(entenderPedido(texto))` (se houver texto), depois as que servem, depois o resto; dentro de cada grupo, a ordem do catálogo; sem repetir peça.
  - `sugerirPreco(tipo, estado): { min, max, sugerido }` — "pouco uso" usa a `faixa` do tipo; "novo com etiqueta" ×1,3 e "usado" ×0,7, arredondados para múltiplos de 5, mínimo 5 e `min < max`; `sugerido` é o meio arredondado para múltiplo de 5.

- [ ] **Step 1: Write the failing test** (`testes/logica.test.js`)

```js
const test = require('node:test'); const assert = require('node:assert/strict');
const L = require('../logica.js'); const D = require('../dados.js');
const deco = { nome: 'Deco', tamanho: 'M', pegadas: ['vintage', 'street'], teto: 40, curso: 'Administração', email: 'd000000@dac.unicamp.br' };
test('emailValido', () => {
  for (const [e, ok] of [['d000000@dac.unicamp.br', true], ['a@unicamp.br', true], ['A@DAC.UNICAMP.BR', true], ['a@gmail.com', false], ['a@unicamp.br.evil.com', false], ['a@xunicamp.br', false], ['@dac.unicamp.br', false], ['a b@unicamp.br', false], ['', false]]) assert.equal(L.emailValido(e), ok, e);
});
test('serve, extenso, dinheiro', () => {
  const ana = D.CATALOGO[0];
  assert.deepEqual([L.serve(ana, deco), L.serve(ana, { ...deco, teto: 30 }), L.serve(ana, { ...deco, teto: null }), L.serve(ana, { ...deco, tamanho: 'G' }), L.serve(ana, { ...deco, pegadas: ['social'] })], [true, false, true, false, false]);
  assert.deepEqual([L.extenso(1, 'f'), L.extenso(2, 'f'), L.extenso(2, 'm'), L.extenso(5, 'f'), L.extenso(13, 'f'), L.extenso(14, 'f'), L.extenso(20, 'm'), L.extenso(21, 'f')], ['uma', 'duas', 'dois', 'cinco', 'treze', 'catorze', 'vinte', '21']);
  assert.deepEqual([L.dinheiro(35), L.dinheiro(31.5), L.dinheiro(0)], ['R$\u00A035', 'R$\u00A031,50', 'R$\u00A00']);
});
test('entenderPedido', () => {
  assert.deepEqual(L.entenderPedido('preciso de um blazer M pra entrevista de quinta, até 40', deco), { tipos: ['blazer'], tamanho: 'M', teto: 40 });
  assert.deepEqual(L.entenderPedido('ALGO PARA A FESTA de sábado', { ...deco, tamanho: 'G', teto: null }), { tipos: D.OCASIOES.festa, tamanho: 'G', teto: null });
  const m = L.entenderPedido('moletom tamanho g até R$ 60!!!', deco); assert.deepEqual([m.tipos, m.tamanho, m.teto], [['moletom'], 'G', 60]);
  assert.equal(L.entenderPedido('camisa p/ festa', deco).tamanho, 'M');
  assert.ok(L.entenderPedido('uma jaqueta para o frio', deco).tipos.includes('jaqueta jeans'));
  assert.deepEqual(L.entenderPedido('calca jeans pp', deco).tipos, ['calça jeans']); assert.equal(L.entenderPedido('calca jeans pp', deco).tamanho, 'PP');
  assert.deepEqual(L.entenderPedido('preciso de um terno', deco).tipos, []); assert.deepEqual(L.entenderPedido('   ', deco).tipos, []);
  assert.deepEqual(L.entenderPedido('<img src=x onerror=alert(1)> BLAZER até r$40', deco), { tipos: ['blazer'], tamanho: 'M', teto: 40 });
});
test('buscar', () => {
  const pedido = { tipos: ['blazer'], tamanho: 'M', teto: 40 };
  assert.deepEqual(L.buscar(D.CATALOGO, pedido, []).map(p => p.id), ['blazer-preto-rafa', 'blazer-bege-carol']);
  assert.deepEqual(L.buscar(D.CATALOGO, pedido, ['blazer-preto-rafa']).map(p => p.id), ['blazer-bege-carol']);
  assert.deepEqual(L.buscar(D.CATALOGO, { ...pedido, tipos: [] }, []), []);
  assert.ok(L.buscar(D.CATALOGO, { tipos: D.OCASIOES.festa, tamanho: 'M', teto: 40 }, []).length >= 1);
});
test('ordenarPilha: o pedido, depois o que serve, depois o resto', () => {
  const p = L.ordenarPilha(D.CATALOGO, deco, null, []);
  assert.equal(p.length, 14); assert.equal(p[0].id, 'jaqueta-jeans-ana');
  assert.ok(p.slice(0, 5).every(x => L.serve(x, deco)) && p.slice(5).every(x => !L.serve(x, deco)));
  const q = L.ordenarPilha(D.CATALOGO, deco, 'um blazer para a entrevista de quinta', []);
  assert.deepEqual(q.slice(0, 2).map(x => x.id), ['blazer-preto-rafa', 'blazer-bege-carol']);
  assert.ok(q.slice(2, 7).every(x => L.serve(x, deco))); assert.equal(new Set(q.map(x => x.id)).size, 14);
  const r = L.ordenarPilha(D.CATALOGO, deco, 'preciso de um terno', ['jaqueta-jeans-ana']);
  assert.equal(r.length, 13); assert.ok(!r.some(x => x.id === 'jaqueta-jeans-ana') && L.serve(r[0], deco));
  assert.equal(L.ordenarPilha(D.CATALOGO, { ...deco, tamanho: 'GG', pegadas: ['esportivo'], teto: 20 }, null, []).length, 14);
});
test('sugerirPreco', () => {
  assert.deepEqual(L.sugerirPreco('jaqueta jeans', 'pouco uso'), { min: 30, max: 40, sugerido: 35 });
  assert.ok(L.sugerirPreco('jaqueta jeans', 'novo com etiqueta').sugerido > 35 && L.sugerirPreco('jaqueta jeans', 'usado').sugerido < 35);
  for (const t of Object.keys(D.TIPOS)) for (const e of D.ESTADOS) { const s = L.sugerirPreco(t, e); assert.ok(s.min >= 5 && s.min < s.max && s.min <= s.sugerido && s.sugerido <= s.max && [s.min, s.max, s.sugerido].every(v => v % 5 === 0), t + ' ' + e); }
});
```

- [ ] **Step 2: Run** `node --test testes/logica.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** as funções acima em `logica.js`.
- [ ] **Step 4: Run** `node --test testes/logica.test.js testes/dados.test.js`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: lógica do perfil, do pedido, da pilha e do preço`.

---

### Task 4: Lógica do dinheiro e da reserva

**Files:**
- Modify: `logica.js`
- Create: `testes/estado.test.js`

**Interfaces:**
- Consumes: `DADOS.COMISSAO`, `DADOS.CONTADOR_BASE`.
- Produces em `Logica` (todas puras: devolvem um estado novo e nunca alteram o recebido):
  - `estadoInicial(): Estado` = `{ perfil: null, creditos: 0, reservas: [], anuncios: [], pedido: null, acordar: false, realce: '#F0E4D6', ultimoAnuncioSeg: null, ensaio: null, drop: null }`
  - `valorVenda(preco): { pix, creditos }` — `pix` = preço menos a comissão, em centavos exatos.
  - `janelasDeRetirada(agora: Date): [string, string]` — as duas próximas janelas (terça e quinta, 12h às 13h), no formato `'quinta, das 12h às 13h'`. A de hoje só vale antes das 12h.
  - `gerarCodigo(rand = Math.random): string` — 4 caracteres de `'ABCDEFGHJKMNPQRSTUVWXYZ23456789'`.
  - `reservar(estado, peca, janela, codigo, dropInicio = null): Estado` — acrescenta `{ pecaId, codigo, janela, creditosUsados, aPagar, retirada: false, nota: null, drop: dropInicio }` usando os créditos primeiro. Peça já reservada: devolve o mesmo estado.
  - `trocarJanela(estado, pecaId, janela): Estado`
  - `cancelarReserva(estado, pecaId): Estado` — devolve os créditos e tira a reserva. Não mexe em reserva já retirada nem em id desconhecido.
  - `confirmarRetirada(estado, pecaId, nota: 'ótimo'|'ok'|'ruim'): Estado` — marca `retirada: true` e a nota. Repetir não muda nada.
  - `indisponiveis(estado): string[]` — `pecaId` de todas as reservas.
  - `contadorDoCurso(estado): number` — `CONTADOR_BASE` mais as reservas retiradas.
  - `anunciar(estado, { tipo, tamanho, estado, preco, foto, receber: 'creditos'|'pix' }, segundos, agoraMs): Estado` — acrescenta `{ id: 'a1', 'a2'…, …, criadoEm: agoraMs, vendida: false }` e grava `ultimoAnuncioSeg`.
  - `anuncioEsperando(estado, dropInicio): Anuncio|null` — o primeiro não vendido com `criadoEm < dropInicio`.
  - `venderSimulado(estado, dropInicio): Estado` — marca vendido o `anuncioEsperando`; se ele recebe em créditos, soma o preço cheio. Sem anúncio esperando: devolve o mesmo estado.
  - `pedir(estado, texto): Estado` (guarda o texto aparado), `esquecerPedido(estado): Estado`, `pedirParaAcordar(estado): Estado` (`acordar: true`).

- [ ] **Step 1: Write the failing test** (`testes/estado.test.js`)

```js
const test = require('node:test'); const assert = require('node:assert/strict'); const L = require('../logica.js');
const congelar = o => { Object.values(o).forEach(v => v && typeof v === 'object' && congelar(v)); return Object.freeze(o); };
const com = extra => congelar({ ...L.estadoInicial(), ...extra });
const Q = 'quinta, das 12h às 13h', T = 'terça, das 12h às 13h';
test('estadoInicial', () => assert.deepEqual(L.estadoInicial(), { perfil: null, creditos: 0, reservas: [], anuncios: [], pedido: null, acordar: false, realce: '#F0E4D6', ultimoAnuncioSeg: null, ensaio: null, drop: null }));
test('valorVenda: comissão de 10%', () => { assert.deepEqual(L.valorVenda(35), { pix: 31.5, creditos: 35 }); assert.deepEqual(L.valorVenda(18), { pix: 16.2, creditos: 18 }); });
test('janelasDeRetirada', () => {
  assert.deepEqual(L.janelasDeRetirada(new Date(2026, 10, 10, 9, 0)), [T, Q]);   // terça 9h
  assert.deepEqual(L.janelasDeRetirada(new Date(2026, 10, 10, 12, 0)), [Q, T]);  // terça 12h
  assert.deepEqual(L.janelasDeRetirada(new Date(2026, 10, 12, 11, 59)), [Q, T]); // quinta 11h59
  assert.deepEqual(L.janelasDeRetirada(new Date(2026, 10, 11, 20, 5)), [Q, T]);  // quarta, durante o drop
  assert.deepEqual(L.janelasDeRetirada(new Date(2026, 10, 14, 20, 0)), [T, Q]);  // sábado
});
test('gerarCodigo', () => { assert.equal(L.gerarCodigo(() => 0), 'AAAA'); for (let i = 0; i < 50; i++) assert.match(L.gerarCodigo(), /^[A-HJKMNP-Z2-9]{4}$/); });
test('reservar usa créditos primeiro e não duplica', () => {
  const e = L.reservar(com({ creditos: 35 }), { id: 'x', preco: 38 }, Q, '4K7P', 1000);
  assert.equal(e.creditos, 0);
  assert.deepEqual(e.reservas, [{ pecaId: 'x', codigo: '4K7P', janela: Q, creditosUsados: 35, aPagar: 3, retirada: false, nota: null, drop: 1000 }]);
  assert.deepEqual(L.reservar(congelar(e), { id: 'x', preco: 38 }, T, 'ZZZZ', 1000), e);
  assert.deepEqual(L.indisponiveis(e), ['x']);
  const sobra = L.reservar(com({ creditos: 35 }), { id: 'y', preco: 30 }, Q, 'AAAA'); assert.deepEqual([sobra.creditos, sobra.reservas[0].aPagar, sobra.reservas[0].drop], [5, 0, null]);
  const semCredito = L.reservar(com({}), { id: 'z', preco: 35 }, Q, 'AAAA'); assert.deepEqual([semCredito.reservas[0].creditosUsados, semCredito.reservas[0].aPagar], [0, 35]);
});
test('trocarJanela, cancelar e retirar', () => {
  let e = L.reservar(com({ creditos: 35 }), { id: 'x', preco: 38 }, T, '4K7P');
  assert.equal(L.trocarJanela(congelar(e), 'x', Q).reservas[0].janela, Q);
  const c = L.cancelarReserva(congelar(e), 'x'); assert.deepEqual([c.creditos, c.reservas, L.indisponiveis(c)], [35, [], []]);
  assert.deepEqual(L.cancelarReserva(congelar(e), 'nao-existe'), e);
  e = L.confirmarRetirada(congelar(e), 'x', 'ótimo');
  assert.deepEqual([e.reservas[0].retirada, e.reservas[0].nota, L.contadorDoCurso(e), L.indisponiveis(e)], [true, 'ótimo', 129, ['x']]);
  assert.equal(L.contadorDoCurso(L.confirmarRetirada(congelar(e), 'x', 'ruim')), 129);
  assert.deepEqual(L.cancelarReserva(congelar(e), 'x'), e);
  assert.equal(L.contadorDoCurso(L.estadoInicial()), 128);
});
test('anunciar e venda simulada', () => {
  const dados = { tipo: 'jaqueta jeans', tamanho: 'M', estado: 'pouco uso', preco: 35, foto: 'fotos/exemplo-venda.jpg', receber: 'creditos' };
  const e = L.anunciar(com({}), dados, 19, 500);
  assert.deepEqual(e.anuncios, [{ id: 'a1', ...dados, criadoEm: 500, vendida: false }]); assert.equal(e.ultimoAnuncioSeg, 19);
  assert.equal(L.anuncioEsperando(e, 1000).id, 'a1'); assert.equal(L.anuncioEsperando(e, 500), null);
  assert.deepEqual(L.venderSimulado(congelar(e), 500), e);
  const c = L.venderSimulado(congelar(e), 1000); assert.deepEqual([c.creditos, c.anuncios[0].vendida, L.anuncioEsperando(c, 1000)], [35, true, null]);
  assert.deepEqual(L.venderSimulado(congelar(c), 1000), c);
  const p = L.venderSimulado(L.anunciar(com({}), { ...dados, receber: 'pix' }, 12, 500), 1000); assert.deepEqual([p.creditos, p.anuncios[0].vendida], [0, true]);
  assert.equal(L.anunciar(congelar(c), { ...dados, tipo: 'moletom' }, 12, 2000).anuncios[1].id, 'a2');
});
test('pedido e acordar', () => {
  const e = L.pedir(com({}), '  um blazer  '); assert.equal(e.pedido, 'um blazer');
  assert.equal(L.esquecerPedido(congelar(e)).pedido, null); assert.equal(L.pedirParaAcordar(com({})).acordar, true);
});
```

- [ ] **Step 2: Run** `node --test testes/estado.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** as funções em `logica.js`.
- [ ] **Step 4: Run** `node --test testes/estado.test.js testes/logica.test.js`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: reserva, créditos, anúncio e venda simulada`.

---

### Task 5: O relógio do drop

**Files:**
- Modify: `logica.js`
- Create: `testes/drop.test.js`

**Interfaces:**
- Consumes: `DADOS.DROP`, `estadoInicial`, `reservar`, `ordenarPilha` (Tasks 3 e 4). Todos os instantes são milissegundos (`Date.now()`).
- Produces em `Logica`:
  - `dropDoCalendario(agoraMs): number` — início do drop do calendário que está no ar agora (`inicio <= agora < inicio + duracaoMs`) ou, se não houver, do próximo. Drops: dias `DROP.dias`, às `DROP.hora` horas, no relógio local.
  - `contagem(ms): string` — `'HH:MM:SS'` com os segundos arredondados para cima (as horas podem passar de 24); com 48 horas ou mais, `'N dias'` (arredondado para baixo).
  - `relogio(ms): string` — `'MM:SS'`, segundos arredondados para cima.
  - `diaDaSemana(ms): string` — `'domingo'`, `'segunda'`, `'terça'`, `'quarta'`, `'quinta'`, `'sexta'`, `'sábado'`.
  - `ensaiar(estado, agoraMs): Estado` — `ensaio = agoraMs + DROP.ensaioMs`.
  - `situacao(estado, agoraMs): { tela: 'espera'|'no-ar'|'fim', inicio, faltaMs, ensaio: boolean }` — ver o algoritmo abaixo.
  - `abrirDrop(estado, inicio): Estado` — se `estado.drop` já é desse `inicio`, devolve o mesmo estado; senão `drop = { inicio, passadas: [], levadas: [], fim: false, fechado: false }`.
  - `passar(estado, pecaId): Estado` — acrescenta a `drop.passadas`, sem repetir.
  - `levarUma(estado, pilha: Peca[]): Estado` — acrescenta a `drop.levadas` o id da **última** peça da pilha; com pilha de uma peça ou vazia, devolve o mesmo estado (a peça da tela nunca é levada).
  - `terminarDrop(estado): Estado` — `drop.fim = true`.
  - `fecharDrop(estado): Estado` — `drop.fechado = true`, `ensaio = null`, `pedido = null`.
  - `foraDaPilha(estado): string[]` — ids de todas as reservas, das passadas e das levadas. Sem `drop` ou com o drop fechado, só as reservas (o drop seguinte começa com a pilha cheia de novo).
  - `placar(estado, catalogo): { foram, total }` — `total` = peças do catálogo menos as reservadas fora deste drop; `foram` = levadas mais as reservas deste drop (`reserva.drop === drop.inicio`).

Algoritmo de `situacao` (o único trecho em que a ordem das regras importa):

```js
const { duracaoMs } = D.DROP, drop = estado.drop;
const ensaioVale = estado.ensaio != null && agoraMs < estado.ensaio + duracaoMs;
let inicio = ensaioVale ? estado.ensaio : dropDoCalendario(agoraMs);
let ensaio = ensaioVale;
// drop já fechado pela pessoa: a espera aponta para o próximo do calendário
if (drop && drop.fechado && drop.inicio === inicio) { inicio = dropDoCalendario(inicio + duracaoMs); ensaio = false; }
// drop aberto que terminou (pilha vazia ou tempo esgotado) e ainda não foi fechado: mostra o fim uma vez
if (drop && !drop.fechado && (drop.fim || agoraMs >= drop.inicio + duracaoMs)) return { tela: 'fim', inicio: drop.inicio, faltaMs: 0, ensaio };
const noAr = agoraMs >= inicio && agoraMs < inicio + duracaoMs;
return { tela: noAr ? 'no-ar' : 'espera', inicio, faltaMs: noAr ? inicio + duracaoMs - agoraMs : inicio - agoraMs, ensaio };
```

- [ ] **Step 1: Write the failing test** (`testes/drop.test.js`)

```js
const test = require('node:test'); const assert = require('node:assert/strict'); const L = require('../logica.js'); const D = require('../dados.js');
const congelar = o => { Object.values(o).forEach(v => v && typeof v === 'object' && congelar(v)); return Object.freeze(o); };
const com = extra => congelar({ ...L.estadoInicial(), ...extra });
const t = (dia, h, m = 0, s = 0) => new Date(2026, 10, dia, h, m, s).getTime(); // novembro de 2026: dia 9 é segunda, 10 é terça
const H = 3600e3, deco = { nome: 'Deco', tamanho: 'M', pegadas: ['vintage', 'street'], teto: 40, curso: 'Administração', email: 'd000000@dac.unicamp.br' };
test('dropDoCalendario: segunda e quarta, 20h', () => {
  assert.equal(L.dropDoCalendario(t(10, 9)), t(11, 20));
  assert.equal(L.dropDoCalendario(t(9, 19, 59)), t(9, 20));
  assert.equal(L.dropDoCalendario(t(9, 20, 5)), t(9, 20));
  assert.equal(L.dropDoCalendario(t(9, 20, 10)), t(11, 20));
  assert.equal(L.dropDoCalendario(t(11, 20, 10)), t(16, 20));
  assert.equal(L.dropDoCalendario(t(14, 12)), t(16, 20));
});
test('contagem, relogio, diaDaSemana', () => {
  assert.deepEqual([35 * H, 2 * H + 14 * 60e3 + 9e3, 10000, 999, 0, 48 * H - 1000].map(L.contagem), ['35:00:00', '02:14:09', '00:00:10', '00:00:01', '00:00:00', '47:59:59']);
  assert.deepEqual([48 * H, 5 * 24 * H - 1000].map(L.contagem), ['2 dias', '4 dias']);
  assert.deepEqual([600000, 581000, 12000, 3000, 200, 0].map(L.relogio), ['10:00', '09:41', '00:12', '00:03', '00:01', '00:00']);
  assert.deepEqual([t(11, 20), t(16, 20), t(14, 12), t(10, 9)].map(L.diaDaSemana), ['quarta', 'segunda', 'sábado', 'terça']);
});
test('situacao: espera, no ar, ensaio', () => {
  assert.deepEqual(L.situacao(com({}), t(10, 9)), { tela: 'espera', inicio: t(11, 20), faltaMs: 35 * H, ensaio: false });
  assert.deepEqual(L.situacao(com({}), t(11, 20, 0, 19)), { tela: 'no-ar', inicio: t(11, 20), faltaMs: 581000, ensaio: false });
  const e = L.ensaiar(com({}), t(10, 9)); assert.equal(e.ensaio, t(10, 9, 0, 10));
  assert.deepEqual(L.situacao(e, t(10, 9)), { tela: 'espera', inicio: t(10, 9, 0, 10), faltaMs: 10000, ensaio: true });
  assert.deepEqual(L.situacao(e, t(10, 9, 0, 10)), { tela: 'no-ar', inicio: t(10, 9, 0, 10), faltaMs: 600000, ensaio: true });
  assert.deepEqual(L.situacao(e, t(10, 10)), { tela: 'espera', inicio: t(11, 20), faltaMs: 34 * H, ensaio: false }); // ensaio velho, nunca aberto
});
test('abrir, terminar e fechar o drop', () => {
  const e = L.ensaiar(com({ pedido: 'um blazer' }), t(10, 9)), a = L.abrirDrop(congelar(e), e.ensaio);
  assert.deepEqual(a.drop, { inicio: e.ensaio, passadas: [], levadas: [], fim: false, fechado: false });
  assert.deepEqual(L.abrirDrop(congelar(a), e.ensaio), a);
  assert.equal(L.situacao(a, t(10, 9, 5)).tela, 'no-ar');
  assert.equal(L.situacao(L.terminarDrop(congelar(a)), t(10, 9, 1)).tela, 'fim');      // pilha acabou
  assert.equal(L.situacao(a, t(10, 9, 10, 10)).tela, 'fim');                            // tempo acabou
  assert.equal(L.situacao(a, t(11, 21)).tela, 'fim');                                   // acabou com o app fechado
  const f = L.fecharDrop(L.terminarDrop(congelar(a)));
  assert.deepEqual([f.drop.fechado, f.ensaio, f.pedido], [true, null, null]);
  assert.deepEqual(L.situacao(f, t(10, 9, 1)), { tela: 'espera', inicio: t(11, 20), faltaMs: t(11, 20) - t(10, 9, 1), ensaio: false });
  assert.equal(L.abrirDrop(congelar(f), t(11, 20)).drop.inicio, t(11, 20));             // drop novo zera a pilha
  const cedo = L.fecharDrop(L.terminarDrop(L.abrirDrop(com({}), t(9, 20))));            // drop do calendário fechado aos 3 min
  assert.deepEqual(L.situacao(cedo, t(9, 20, 3)), { tela: 'espera', inicio: t(11, 20), faltaMs: t(11, 20) - t(9, 20, 3), ensaio: false });
});
test('passar, levar, fora da pilha e placar', () => {
  const pilha = L.ordenarPilha(D.CATALOGO, deco, null, []);
  let e = L.abrirDrop(com({ perfil: deco }), 1000);
  e = L.passar(congelar(e), pilha[0].id); assert.deepEqual(L.passar(congelar(e), pilha[0].id), e);
  e = L.levarUma(congelar(e), pilha.slice(1)); assert.deepEqual(e.drop.levadas, [pilha[13].id]);
  assert.deepEqual(L.levarUma(congelar(e), [pilha[1]]), e); assert.deepEqual(L.levarUma(congelar(e), []), e);
  assert.deepEqual(L.foraDaPilha(e).sort(), [pilha[0].id, pilha[13].id].sort());
  assert.deepEqual(L.placar(e, D.CATALOGO), { foram: 1, total: 14 });
  e = L.reservar(congelar(e), pilha[1], 'terça, das 12h às 13h', 'AAAA', 1000);
  assert.deepEqual(L.placar(e, D.CATALOGO), { foram: 2, total: 14 }); assert.ok(L.foraDaPilha(e).includes(pilha[1].id));
  assert.deepEqual(L.foraDaPilha(L.fecharDrop(congelar(e))), [pilha[1].id]);
  const velho = L.abrirDrop(L.reservar(com({}), pilha[2], 'terça, das 12h às 13h', 'BBBB', 5), 1000);
  assert.deepEqual(L.placar(velho, D.CATALOGO), { foram: 0, total: 13 });
  assert.deepEqual(L.foraDaPilha(L.reservar(com({}), pilha[2], 'terça, das 12h às 13h', 'BBBB')), [pilha[2].id]);
});
```

- [ ] **Step 2: Run** `node --test testes/drop.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** as funções em `logica.js` (o corpo de `situacao` é o do bloco acima).
- [ ] **Step 4: Run** `node --test testes/drop.test.js testes/estado.test.js testes/logica.test.js`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: relógio do drop, ensaio e pilha`.

---

### Task 6: Casca do app e primeira vez

**Files:**
- Modify: `app.js` (substitui o provisório), `estilo.css`, `testes/apoio.js`
- Create: `testes/primeira-vez.e2e.test.js`

**Interfaces:**
- Consumes: `Logica.estadoInicial`, `emailValido`, `dinheiro`, `situacao`, `diaDaSemana`; `DADOS.PERFIL_PADRAO`, `TAMANHOS`, `PEGADAS`, `TETOS`, `CURSOS`, `DROP`.
- Produces em `app.js` (funções globais usadas pelas próximas tasks):
  - `estado` (variável), `mudar(novoEstado)` (troca, grava em `localStorage['brecho.v2']` dentro de `try/catch` e redesenha), `carregar()` (estado salvo ou `estadoInicial()` se faltar, estiver corrompido ou der erro).
  - `frase(...partes): HTMLParagraphElement` — `<p class="frase">`; texto vira nó de texto, nó é anexado. `apoio(...partes)` — igual, com classe `apoio`.
  - `palavra(texto, rotulo, opcoes: string[], aoEscolher(valor), { ate = 1 } = {}): HTMLButtonElement` — `<button class="palavra" aria-label="<rotulo>: <texto>" aria-expanded>`. Ao tocar, mostra logo depois do parágrafo um `<div class="opcoes">` com um botão `.palavra` por opção (nome acessível igual ao texto da opção). Com `ate: 2`, as opções ligam e desligam (`aria-pressed`), a terceira escolhida derruba a mais antiga, nunca fica sem nenhuma, e um botão "pronto" fecha. Abrir uma `palavra` fecha as opções de outra que esteja aberta.
  - `campo(valor, rotulo, placeholder, aoMudar(valor), tipo = 'text'): HTMLInputElement` — campo com cara de palavra sublinhada, `aria-label="<rotulo>"`.
  - `principal(texto, aoTocar): HTMLButtonElement` — `<button class="principal">`.
  - `rotas`: objeto indexado pelo primeiro trecho do hash (`''` é a tela principal); `desenhar()` lê `location.hash`, escolhe a tela, limpa `#tela` e a preenche. Hash desconhecido ou tela que devolve `false` leva a `#/` com `location.replace` (não suja o histórico). Sem `estado.perfil`, qualquer hash mostra a primeira vez. Cada rota diz se é escura; `desenhar()` liga ou desliga `body.escuro`.
  - `tique()` — chamado pelo único `setInterval(tique, 200)`; nesta task fica vazio. As próximas tasks colocam nele o que depende do tempo.
  - `#conta` mostra `"<nome> · R$ N em créditos"` quando há perfil; vazio na primeira vez.
- Primeira vez (spec 6.1, papel): frases exatas "Oi. Este é o brechó do campus de Limeira, só entre alunos."; "Eu sou [Seu nome], visto [Tamanho], gosto de [Pegada] e gasto [Teto] numa peça. Estudo [Curso]."; "Meu e-mail da Unicamp é [Seu e-mail da Unicamp]."; principal "Entrar"; apoio "Toque numa palavra sublinhada para mudar. Dá para trocar tudo depois." Os rótulos entre colchetes são os `rotulo`/`aria-label`. Pegadas juntam com " e ". As opções de teto são "até R$ 20", "até R$ 40", "até R$ 60", "até R$ 80" e "sem teto". Começa com `PERFIL_PADRAO`.
- Entrar: nome vazio mostra a frase "Como eu te chamo?" e foca o nome; e-mail inválido mostra "Preciso de um e-mail da Unicamp para deixar você entrar."; válido grava o perfil e vai para `#/`.
- Tela principal provisória desta task (escura): só `apoio('Próximo drop · ' + diaDaSemana(inicio) + ', ' + DROP.hora + 'h')`, com `id="rotulo"`.
- Produces (`testes/apoio.js`): `entrar(page, perfil = {})` preenche a primeira vez (padrão: Deco, M, vintage e street, até R$ 40, Administração, `d000000@dac.unicamp.br`; nas pegadas, liga primeiro as pedidas e depois desliga as que sobraram) e espera `#conta` conter "em créditos"; `salvo(page)` devolve `JSON.parse(localStorage['brecho.v2'])`.

- [ ] **Step 1: Write the failing test** (`testes/primeira-vez.e2e.test.js`)

```js
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
  await fechar();
});
test('localStorage corrompido ou bloqueado não derruba o app', async () => {
  let a = await abrir({ antes: () => localStorage.setItem('brecho.v2', '{quebrado') });
  await a.page.getByText('só entre alunos').waitFor(); await a.fechar();
  a = await abrir({ antes: () => { Storage.prototype.setItem = () => { throw new Error('cheio'); }; } });
  await entrar(a.page); await a.page.getByText('Próximo drop · quarta, 20h').waitFor(); await a.fechar();
});
test('nome com marcação aparece como texto', async () => {
  const { page, fechar } = await abrir();
  await entrar(page, { nome: '<b>Deco</b>' });
  assert.equal(await page.locator('#tela b, #conta b').count(), 0);
  assert.match(await page.locator('#conta').innerText(), /^<b>Deco<\/b> · /);
  await fechar();
});
```

- [ ] **Step 2: Run** `node --test testes/primeira-vez.e2e.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** `app.js`, o CSS de `.palavra`, `.opcoes` e do campo, e `entrar`/`salvo` no apoio.
- [ ] **Step 4: Run** `node --test --test-concurrency=2 "testes/*.test.js"`. Expected: PASS em tudo.
- [ ] **Step 5: Commit** `feat: casca do app e primeira vez`.

---

### Task 7: Espera, pedido e ensaio

**Files:**
- Modify: `app.js`, `estilo.css`
- Create: `testes/espera.e2e.test.js`

**Interfaces:**
- Consumes: `situacao`, `contagem`, `relogio`, `diaDaSemana`, `ensaiar`, `abrirDrop`, `ordenarPilha`, `foraDaPilha`, `serve`, `extenso`, `entenderPedido`, `pedir`, `esquecerPedido`, `pedirParaAcordar`; helpers da Task 6.
- A rota `''` (tela principal, escura) passa a escolher pela `situacao(estado, Date.now()).tela`. Nesta task: `espera` completa; `no-ar` provisória (`<section id="drop">` com `<span id="resta" class="pilula">AO VIVO · MM:SS</span>`); `fim` fica para a Task 8.
- `tique()`: recalcula a `situacao`; se a `tela` mudou desde o último desenho, chama `desenhar()`; senão só atualiza o texto de `#contagem` e `#resta`. Ao desenhar a tela principal em `no-ar` (pelo `tique()` ou ao abrir o app no meio de um drop), garante `abrirDrop(estado, inicio)` antes.
- Espera (spec 6.2), de cima para baixo:
  - (ponto de extensão `avisosDaEspera()`: devolve nós para o topo; aqui devolve o pedido anotado; a Task 8 acrescenta as reservas)
  - `apoio` `#rotulo`: "Próximo drop · quarta, 20h" ou, no ensaio, "Ensaio do drop".
  - `<p id="contagem" class="contagem">` com `contagem(faltaMs)`.
  - Frases: `"<Nome>, <extenso f do total> peças entram juntas. <Extenso f> são <Tamanho>, na sua pegada."` (com uma: "Uma é M, na sua pegada."; com nenhuma: `"<Nome>, catorze peças entram juntas. Nenhuma é <Tamanho> na sua pegada desta vez, mas vale olhar."`; total 1: "uma peça entra sozinha"). O tamanho é um link `.palavra` para `#/voce`. Total e contagem vêm de `ordenarPilha(CATALOGO, perfil, pedido, foraDaPilha(estado))`. Depois: "Cada peça é única. Quem tocar primeiro leva."
  - Três fotos borradas das primeiras peças da pilha (`alt=""`, `aria-hidden`), com "só abre na hora" por cima.
  - `principal` "Me acorde cinco minutos antes"; com `estado.acordar`, no lugar dela a frase "Combinado. Eu te acordo cinco minutos antes."
  - `apoio` com o link "vender uma peça para este drop" (`#/vender`) e o botão `.palavra` "ensaiar o drop agora" (`mudar(ensaiar(estado, Date.now()))`).
  - `#pedido` visível, fixo no rodapé, com folga para não cobrir conteúdo.
- Pedido (spec 6.7): enviar texto não vazio. Se `entenderPedido(texto, perfil).tipos` for vazio, mostra no topo, só até o próximo desenho, a frase `Não entendi que peça você procura. Tente algo como "um blazer para a entrevista".` Senão `mudar(pedir(estado, texto))` e limpa o campo. Com `estado.pedido`, o topo da espera mostra `Anotado: "<texto>". O que combinar com isso abre a sua pilha no próximo drop.` e o botão `.palavra` "esquecer". Vazio ou só espaços não faz nada.

- [ ] **Step 1: Write the failing test** (`testes/espera.e2e.test.js`)

```js
const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, salvo } = require('./apoio.js');
const pedir = async (page, texto) => { await page.getByLabel('Diga o que procura').fill(texto); await page.getByLabel('Diga o que procura').press('Enter'); };
test('espera do roteiro', async () => {
  const { page, passar, fechar } = await abrir({ largura: 360 }); await entrar(page);
  await page.getByText('Próximo drop · quarta, 20h').waitFor();
  assert.equal(await page.locator('#contagem').innerText(), '35:00:00');
  await passar(1000); assert.equal(await page.locator('#contagem').innerText(), '34:59:59');
  await page.getByText('Deco, catorze peças entram juntas. Cinco são M, na sua pegada.').waitFor();
  await page.getByText('Cada peça é única. Quem tocar primeiro leva.').waitFor();
  await page.getByText('só abre na hora').waitFor();
  assert.equal(await page.locator('#tela img[aria-hidden="true"]').count(), 3);
  assert.equal(await page.getByRole('link', { name: 'vender uma peça para este drop' }).getAttribute('href'), '#/vender');
  assert.equal(await page.getByRole('link', { name: 'M', exact: true }).getAttribute('href'), '#/voce');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  const [campo, fim] = await page.evaluate(() => [document.querySelector('#pedido'), [...document.querySelectorAll('#tela .apoio')].pop()].map(el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; }));
  assert.ok(Math.abs(campo.bottom - 844) <= 24 && fim.bottom <= campo.top);
  await page.getByRole('button', { name: 'Me acorde cinco minutos antes' }).click();
  await page.getByText('Combinado. Eu te acordo cinco minutos antes.').waitFor();
  await page.reload(); await page.getByText('Combinado. Eu te acordo cinco minutos antes.').waitFor();
  assert.equal((await salvo(page)).acordar, true);
  await fechar();
});
test('perfil fora do roteiro', async () => {
  const { page, fechar } = await abrir(); await entrar(page, { tamanho: 'GG', pegadas: ['esportivo'], teto: 20 });
  await page.getByText('Deco, catorze peças entram juntas. Nenhuma é GG na sua pegada desta vez, mas vale olhar.').waitFor();
  await fechar();
});
test('pedido anotado, esquecido e não entendido', async () => {
  const { page, fechar } = await abrir(); await entrar(page);
  await pedir(page, 'um blazer para a entrevista de quinta');
  await page.getByText('Anotado: "um blazer para a entrevista de quinta". O que combinar com isso abre a sua pilha no próximo drop.').waitFor();
  assert.equal(await page.getByLabel('Diga o que procura').inputValue(), '');
  await page.reload(); await page.getByText(/^Anotado: "um blazer para a entrevista de quinta"/).waitFor();
  await page.getByRole('button', { name: 'esquecer' }).click();
  assert.equal(await page.getByText(/^Anotado:/).count(), 0); assert.equal((await salvo(page)).pedido, null);
  await pedir(page, 'xyzzy');
  await page.getByText('Não entendi que peça você procura. Tente algo como "um blazer para a entrevista".').waitFor();
  assert.equal((await salvo(page)).pedido, null);
  await pedir(page, '   '); assert.equal((await salvo(page)).pedido, null);
  await pedir(page, '<img src=x onerror=alert(1)> BLAZER até r$40');
  await page.getByText(/^Anotado: "<img src=x onerror=alert\(1\)> BLAZER até r\$40"/).waitFor();
  assert.equal(await page.locator('#tela img[src="x"]').count(), 0);
  await fechar();
});
test('ensaio: a contagem zera e a tela vira o drop sozinha', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await page.getByRole('button', { name: 'ensaiar o drop agora' }).click();
  await page.getByText('Ensaio do drop').waitFor();
  assert.equal(await page.locator('#contagem').innerText(), '00:00:10');
  await passar(9000); assert.equal(await page.locator('#contagem').innerText(), '00:00:01');
  await page.reload(); assert.equal(await page.locator('#contagem').innerText(), '00:00:01');
  await passar(1000); await page.locator('#drop').waitFor();
  assert.equal(await page.locator('#resta').innerText(), 'AO VIVO · 10:00');
  const s = await salvo(page); assert.equal(s.drop.inicio, s.ensaio);
  await passar(19000); assert.equal(await page.locator('#resta').innerText(), 'AO VIVO · 09:41');
  await fechar();
});
```

- [ ] **Step 2: Run** `node --test testes/espera.e2e.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** a espera, o pedido, o `tique()` e o CSS da contagem, das fotos borradas e do rodapé fixo.
- [ ] **Step 4: Run** `node --test --test-concurrency=2 "testes/*.test.js"`. Expected: PASS em tudo.
- [ ] **Step 5: Commit** `feat: espera com contagem regressiva, pedido e ensaio`.

---

### Task 8: Drop no ar, É sua e retirada

**Files:**
- Modify: `app.js`, `estilo.css`, `testes/apoio.js`
- Create: `testes/drop.e2e.test.js`

**Interfaces:**
- Consumes: `ordenarPilha`, `foraDaPilha`, `placar`, `passar`, `levarUma`, `terminarDrop`, `fecharDrop`, `reservar`, `trocarJanela`, `cancelarReserva`, `confirmarRetirada`, `janelasDeRetirada`, `gerarCodigo`, `contadorDoCurso`, `serve`, `dinheiro`, `relogio`; `DADOS.DROP`, `TIPOS`.
- Produces: `pilhaAtual()` — `ordenarPilha(CATALOGO, perfil, pedido, foraDaPilha(estado))`; `avisoNoDrop(no)` — mostra um nó por 6 segundos em `<div id="aviso" aria-live="polite">`, que fica sobre a foto mas vem depois da frase da peça no DOM (a Task 9 usa). Em `testes/apoio.js`: `aoVivo(page, passar)` — toca "ensaiar o drop agora", faz `passar(10000)` e espera `#drop`.
- Drop no ar (spec 6.3, escura), `<section id="drop">`:
  - `<img id="peca" alt="<alt da peça>">` ocupando a tela; `#resta` "AO VIVO · MM:SS"; uma pílula "23 online" (`DROP.online`).
  - Frase `"<Nome>, <tamanho>, <estado>. R$ N."`; apoio `"<Vendedor>, <Curso> · nota <nota com vírgula>"`, mais `" · serve em você"` quando serve e `" · sai de graça com seus créditos"` quando os créditos cobrem o preço. Se a peça veio do pedido, mais uma linha de apoio `"Você pediu: <texto>"`.
  - Botão `.palavra` "passo" e `principal` "É minha". Barra fina de progresso e `<span id="placar">N de T já foram</span>` (de `placar`).
  - Passar: `mudar(passar(estado, id))`. Pegar: `mudar(reservar(estado, peca, janelasDeRetirada(new Date())[0], gerarCodigo(), drop.inicio))` e vai para `#/sua/<id>`.
  - Gesto: `pointerdown`/`pointermove`/`pointerup` na foto; a foto acompanha o dedo com leve rotação; soltar com 80 px ou mais para a direita pega, para a esquerda passa, menos que isso volta ao lugar. `touch-action: pan-y` na foto. Teclado: seta direita pega, seta esquerda passa (só com o drop na tela e fora de campos de texto).
  - No `tique()`, com o drop no ar: enquanto `drop.levadas.length < Math.floor((agora - inicio) / DROP.levaACadaMs)`, faz `mudar(levarUma(estado, pilhaAtual()))` (para se o estado não mudar). Pilha vazia, no `tique()` ou ao desenhar (depois do último "passo" o relógio pode não ter andado): `mudar(terminarDrop(estado))`.
- Fim (escura): `"O drop acabou. Você ficou com uma peça."` (`"com duas peças"`, pelo `extenso`; sem nenhuma: `"O drop acabou. Você não pegou nada desta vez."`), contando as reservas com `drop === estado.drop.inicio`; depois `"Próximo drop: <dia>, 20h."` (o do calendário depois deste) e `principal` "Voltar", que faz `mudar(fecharDrop(estado))`.
- Rota `#/sua/<pecaId>` (spec 6.4, papel). Sem reserva dessa peça: devolve `false`.
  - `"É su<a|o>. <A|O> <nome da peça em minúsculas> d<a|o> <vendedor> espera você [janela], no ponto da FCA. Mostre este código:"` (gênero pelo tipo; a janela é `palavra(janela, 'Retirada', janelas, …)`), depois `<p class="codigo">`.
  - Pagamento: sem crédito `"Você paga R$ N na hora, em Pix ou dinheiro."`; parcial `"Seus R$ C em créditos já entraram. Faltam R$ F, pagos na hora."`; total `"Seus créditos pagaram tudo."`
  - Com o drop no ar: `principal` "Voltar ao drop" (vai para `#/`). Fora dele: `principal` "Já retirei", que pergunta `"Como foi com <a|o> <vendedor>?"` com "ótimo", "ok", "ruim"; depois `"Obrigado. Uma peça a menos no lixo: <Curso> chegou a <N>."` (curso "outro curso" vira "Seu curso") e `principal` "Voltar". Reserva já retirada abre nesse fecho.
  - Apoio com o botão "Cancelar a reserva" (cancela e volta a `#/`), enquanto não retirada.
- `avisosDaEspera()` passa a incluir, para cada reserva não retirada, um link para `#/sua/<id>`: `"Su<a|o> <nome em minúsculas> espera você <janela>. Código XXXX."`

- [ ] **Step 1: Write the failing test** (`testes/drop.e2e.test.js`)

```js
const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, salvo, aoVivo } = require('./apoio.js');
const frase = page => page.locator('#drop .frase').first().innerText();
test('drop: uma peça por vez, passar e pegar', async () => {
  const { page, passar, fechar } = await abrir({ largura: 360 }); await entrar(page); await aoVivo(page, passar);
  assert.equal(await page.locator('#resta').innerText(), 'AO VIVO · 10:00');
  await page.getByText('23 online').waitFor();
  assert.match(await frase(page), /^Jaqueta jeans, M, pouco uso\. R\$\s35\.$/);
  await page.getByText('Ana, Administração · nota 4,8 · serve em você').waitFor();
  assert.ok((await page.locator('#peca').getAttribute('alt')).length > 5);
  assert.equal(await page.locator('#placar').innerText(), '0 de 14 já foram');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole('button', { name: 'passo' }).click();
  assert.doesNotMatch(await frase(page), /^Jaqueta jeans/);
  assert.deepEqual((await salvo(page)).drop.passadas, ['jaqueta-jeans-ana']);
  const segunda = await frase(page);
  await page.getByRole('button', { name: 'É minha' }).click();
  await page.getByText(/^É s(ua|eu)\. .+ espera você terça, das 12h às 13h, no ponto da FCA\. Mostre este código:/).waitFor();
  assert.match(await page.locator('.codigo').innerText(), /^[A-HJKMNP-Z2-9]{4}$/);
  await page.getByText(/Você paga R\$\s\d+ na hora, em Pix ou dinheiro\./).waitFor();
  assert.equal(await page.evaluate(() => document.body.classList.contains('escuro')), false);
  await page.getByRole('button', { name: /^Retirada: terça, das 12h às 13h/ }).click();
  await page.getByRole('button', { name: 'quinta, das 12h às 13h', exact: true }).click();
  assert.equal((await salvo(page)).reservas[0].janela, 'quinta, das 12h às 13h');
  assert.equal(await page.getByRole('button', { name: 'Já retirei' }).count(), 0);
  await page.getByRole('button', { name: 'Voltar ao drop' }).click();
  await page.locator('#drop').waitFor();
  assert.notEqual(await frase(page), segunda);
  assert.equal(await page.locator('#placar').innerText(), '1 de 14 já foram');
  await fechar();
});
test('arrastar com o dedo e teclado', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page); await aoVivo(page, passar);
  const arrastar = async dx => { const b = await page.locator('#peca').boundingBox(), x = b.x + b.width / 2, y = b.y + b.height / 2; await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + dx / 2, y, { steps: 4 }); await page.mouse.move(x + dx, y, { steps: 4 }); await page.mouse.up(); };
  await arrastar(30); assert.deepEqual((await salvo(page)).drop.passadas, []); assert.match(await frase(page), /^Jaqueta jeans/);
  await arrastar(-200); assert.deepEqual((await salvo(page)).drop.passadas, ['jaqueta-jeans-ana']);
  await page.keyboard.press('ArrowLeft'); assert.equal((await salvo(page)).drop.passadas.length, 2);
  await arrastar(200); await page.getByText(/^É s(ua|eu)\./).waitFor(); assert.equal((await salvo(page)).reservas.length, 1);
  await page.getByRole('button', { name: 'Voltar ao drop' }).click(); await page.locator('#drop').waitFor();
  await page.keyboard.press('ArrowRight'); await page.getByText(/^É s(ua|eu)\./).waitFor(); assert.equal((await salvo(page)).reservas.length, 2);
  await fechar();
});
test('outras peças são levadas e o tempo acaba', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page); await aoVivo(page, passar);
  await passar(8000); assert.equal(await page.locator('#placar').innerText(), '1 de 14 já foram');
  await passar(16000); assert.equal(await page.locator('#placar').innerText(), '3 de 14 já foram');
  assert.match(await frase(page), /^Jaqueta jeans/);
  assert.equal(await page.locator('#resta').innerText(), 'AO VIVO · 09:36');
  await page.reload(); await page.locator('#drop').waitFor(); assert.equal(await page.locator('#placar').innerText(), '3 de 14 já foram');
  await passar(576000);
  await page.getByText('O drop acabou. Você não pegou nada desta vez.').waitFor();
  await page.getByText('Próximo drop: quarta, 20h.').waitFor();
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByText('Próximo drop · quarta, 20h').waitFor();
  const s = await salvo(page); assert.deepEqual([s.drop.fechado, s.ensaio], [true, null]);
  await fechar();
});
test('a pilha termina antes do tempo', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page); await aoVivo(page, passar);
  for (let i = 0; i < 14; i++) await page.getByRole('button', { name: 'passo' }).click();
  await page.getByText('O drop acabou. Você não pegou nada desta vez.').waitFor();
  await page.reload(); await page.getByText('O drop acabou.').waitFor();
  await fechar();
});
test('o pedido abre a pilha e some depois do drop', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await page.getByLabel('Diga o que procura').fill('um blazer para a entrevista de quinta'); await page.getByLabel('Diga o que procura').press('Enter');
  await aoVivo(page, passar);
  assert.match(await frase(page), /^Blazer preto, M, pouco uso\. R\$\s38\.$/);
  await page.getByText('Você pediu: um blazer para a entrevista de quinta').waitFor();
  await page.getByRole('button', { name: 'É minha' }).click();
  await page.getByText('É seu. O blazer preto do Rafa espera você terça, das 12h às 13h, no ponto da FCA. Mostre este código:').waitFor();
  await page.getByRole('button', { name: 'Voltar ao drop' }).click(); await page.locator('#drop').waitFor();
  await passar(600000);
  await page.getByText('O drop acabou. Você ficou com uma peça.').waitFor();
  await page.getByRole('button', { name: 'Voltar' }).click();
  assert.equal((await salvo(page)).pedido, null);
  await page.getByText('Deco, treze peças entram juntas. Cinco são M, na sua pegada.').waitFor();
  await fechar();
});
test('retirada depois do drop, com o contador do curso', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page); await aoVivo(page, passar);
  await page.getByRole('button', { name: 'É minha' }).click();
  await page.getByText('É sua. A jaqueta jeans da Ana espera você terça, das 12h às 13h, no ponto da FCA. Mostre este código:').waitFor();
  await page.locator('#marca').click(); await page.locator('#drop').waitFor();
  await passar(600000); await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByText('Deco, treze peças entram juntas. Quatro são M, na sua pegada.').waitFor();
  await page.getByRole('link', { name: /^Sua jaqueta jeans espera você terça, das 12h às 13h\. Código [A-HJKMNP-Z2-9]{4}\.$/ }).click();
  await page.getByRole('button', { name: 'Já retirei' }).click();
  await page.getByText('Como foi com a Ana?').waitFor();
  await page.getByRole('button', { name: 'ótimo', exact: true }).click();
  await page.getByText('Obrigado. Uma peça a menos no lixo: Administração chegou a 129.').waitFor();
  await page.getByRole('button', { name: 'Voltar' }).click();
  assert.equal(await page.getByRole('link', { name: /^Sua jaqueta jeans espera você/ }).count(), 0);
  await fechar();
});
test('cancelar, toque duplo, endereço quebrado e voltar do navegador', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page); await aoVivo(page, passar);
  await page.getByRole('button', { name: 'É minha' }).evaluate(b => { b.click(); b.click(); });
  await page.getByText(/^É sua\./).waitFor(); assert.equal((await salvo(page)).reservas.length, 1);
  await page.goBack(); await page.locator('#drop').waitFor(); assert.doesNotMatch(await frase(page), /^Jaqueta jeans/);
  await page.goForward(); await page.getByRole('button', { name: 'Cancelar a reserva' }).click();
  await page.locator('#drop').waitFor(); assert.equal((await salvo(page)).reservas.length, 0);
  assert.match(await frase(page), /^Jaqueta jeans/);
  const base = page.url().split('#')[0];
  for (const h of ['#/sua/nao-existe', '#/sua/jaqueta-jeans-ana', '#/qualquer/coisa']) { await page.goto(base + h); await page.locator('#drop').waitFor(); }
  await fechar();
});
```

- [ ] **Step 2: Run** `node --test testes/drop.e2e.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** o drop, o fim, a rota `#/sua`, os avisos da espera, `aoVivo` no apoio e o CSS (foto em tela cheia, folha de texto embaixo, barra de progresso, código).
- [ ] **Step 4: Run** `node --test --test-concurrency=2 "testes/*.test.js"`. Expected: PASS em tudo.
- [ ] **Step 5: Commit** `feat: drop no ar com arrastar, reserva e retirada`.

---

### Task 9: Vender pela câmera e a venda no drop

**Files:**
- Modify: `app.js`, `estilo.css`
- Create: `fotos/exemplo-venda.jpg` (Unsplash `1611312449408-fcece27cdbb7`, `w=800&q=70`; acrescente em `CREDITOS.md`), `testes/vender.e2e.test.js`

**Interfaces:**
- Consumes: `sugerirPreco`, `valorVenda`, `anunciar`, `anuncioEsperando`, `venderSimulado`, `situacao`, `diaDaSemana`, `relogio`, `DADOS.PALPITES`, `TIPOS`, `COMPRADOR`, `DROP`; `avisoNoDrop` e helpers das Tasks 6 e 8.
- Rota `#/vender` (spec 6.5, escura). Enquanto ela está aberta, `#conta` dá lugar a `<span id="cronometro" class="pilula">` com `relogio(agora - entrada)`, atualizado pelo `tique()`.
  1. **Visor.** Ao entrar, tenta `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`. Deu certo: `<video id="visor" autoplay playsinline muted>` ocupando a tela. Falhou ou não existe: `<img id="visor" src="fotos/exemplo-venda.jpg">` e o apoio "Sem câmera aqui: usei uma peça de exemplo." Depois que o visor está decidido (e nunca antes): cantoneiras, `<button id="disparo" aria-label="Fotografar">` e o botão `.palavra` "escolher uma foto", que aciona `<input type="file" id="foto-entrada" accept="image/*" hidden>`.
  2. **Disparo.** Com vídeo: desenha o quadro num `canvas` de no máximo 600 px no lado maior e guarda `data:image/jpeg` (qualidade 0,7). Com a peça de exemplo: guarda só o caminho `fotos/exemplo-venda.jpg` (em `file://` o `canvas` ficaria bloqueado). Foto da galeria: reduz do mesmo jeito; arquivo que não abre como imagem mostra "Não consegui abrir essa foto. Tente outra ou use a peça de exemplo." e continua no visor; seletor cancelado não muda nada. Depois de ter a foto: para a câmera, mostra a foto parada e "Olhando…" por 1200 ms.
  3. **Palpite.** Sobre a foto, duas `.etiqueta`: `"<tipo> · <tamanho> · <estado>"` e o preço. Embaixo: `"Parece <artigo> [Tipo], tamanho [Tamanho], [Estado]. No campus, peças assim saem por R$ MIN a R$ MAX. Eu anunciaria por [Preço]."` e `"Vendendo, prefiro [Receber]."` O palpite é `PALPITES[anuncios.length % PALPITES.length]`, o tamanho começa no do perfil, o preço em `sugerido` e o receber em créditos. Rótulos das `palavra`: "Tipo", "Tamanho", "Estado", "Preço", "Receber". Opções de preço: sugerido −10, −5, 0, +5, +10 (só valores ≥ 5), formatadas com `dinheiro`. Opções de receber: `"R$ P em créditos"` e `"R$ X no Pix"` (de `valorVenda`). Trocar tipo ou estado refaz a faixa e volta o preço ao sugerido; as etiquetas acompanham. `principal` "Anunciar no drop".
  4. **Publicado.** `mudar(anunciar(estado, {…}, segundos, Date.now()))`, com `segundos = Math.floor((agora - entrada) / 1000)`. Frase: `"No drop em N segundos. Su<a|o> <tipo> entra <dia>, às 20h."` ("1 segundo" no singular; o dia é o do próximo drop que ainda não começou, pelo `situacao`/`dropDoCalendario`) e `principal` "Voltar" (vai para `#/`). O cronômetro para.
  - Sair da rota (inclusive pelo voltar do navegador) para a câmera.
- Venda no drop (spec 6.6), no `tique()` com o drop no ar: se `agora - inicio >= DROP.vendaAposMs` e existe `anuncioEsperando(estado, inicio)`, faz `mudar(venderSimulado(estado, inicio))` e `avisoNoDrop(frase(...))` com `"A Bia, de Nutrição, levou su<a|o> <tipo>. Entraram R$ P em créditos."` ou `"A Bia, de Nutrição, levou su<a|o> <tipo>. O Pix de R$ X cai depois da retirada."` Se a pessoa não estiver na tela do drop, a venda acontece do mesmo jeito, sem aviso.

- [ ] **Step 1: Write the failing test** (`testes/vender.e2e.test.js`)

```js
const test = require('node:test'); const assert = require('node:assert/strict'); const path = require('node:path'); const { abrir, entrar, salvo, aoVivo } = require('./apoio.js');
async function ateOPalpite(page, passar) {
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.getByText('Sem câmera aqui: usei uma peça de exemplo.').waitFor();
  await page.getByRole('button', { name: 'Fotografar' }).click();
  await page.getByText('Olhando…').waitFor(); await passar(1200);
}
async function anunciarExemplo(page, passar, espera = 17800) {
  await ateOPalpite(page, passar);
  await page.getByText(/Parece uma jaqueta jeans, tamanho M, pouco uso\. No campus, peças assim saem por R\$\s30 a R\$\s40\. Eu anunciaria por R\$\s35\./).waitFor();
  await passar(espera);
  await page.getByRole('button', { name: 'Anunciar no drop' }).click();
}
test('vender sem câmera: 19 segundos e a peça entra no próximo drop', async () => {
  const { page, passar, fechar } = await abrir({ largura: 360 }); await entrar(page);
  await ateOPalpite(page, passar);
  assert.equal(await page.evaluate(() => document.body.classList.contains('escuro')), true);
  assert.deepEqual((await page.locator('.etiqueta').allInnerTexts()).map(t => t.replace(/\s/g, ' ')), ['jaqueta jeans · M · pouco uso', 'R$ 35']);
  await page.getByText(/Vendendo, prefiro R\$\s35 em créditos\./).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await passar(17800); await page.getByRole('button', { name: 'Anunciar no drop' }).click();
  await page.getByText('No drop em 19 segundos. Sua jaqueta jeans entra quarta, às 20h.').waitFor();
  const s = await salvo(page); assert.equal(s.ultimoAnuncioSeg, 19);
  assert.deepEqual([s.anuncios[0].preco, s.anuncios[0].tamanho, s.anuncios[0].receber, s.anuncios[0].foto, s.anuncios[0].vendida], [35, 'M', 'creditos', 'fotos/exemplo-venda.jpg', false]);
  await page.getByRole('button', { name: 'Voltar' }).click(); await page.getByText('Próximo drop · quarta, 20h').waitFor();
  await page.getByText('Deco, catorze peças entram juntas.', { exact: false }).waitFor(); // a própria peça não entra na pilha
  await fechar();
});
test('cronômetro, tamanho do perfil, palavras que refazem o preço e Pix', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page, { tamanho: 'G' });
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await passar(3000); assert.equal(await page.locator('#cronometro').innerText(), '00:03');
  await page.getByRole('button', { name: 'Fotografar' }).click(); await passar(1200);
  await page.getByText(/tamanho G/).waitFor();
  await page.getByRole('button', { name: /^Estado:/ }).click(); await page.getByRole('button', { name: 'usado', exact: true }).click();
  const preco = Number((await page.getByRole('button', { name: /^Preço:/ }).innerText()).replace(/\D/g, ''));
  assert.ok(preco < 35 && preco % 5 === 0);
  assert.match((await page.locator('.etiqueta').first().innerText()), /jaqueta jeans · G · usado/);
  await page.getByRole('button', { name: /^Preço:/ }).click();
  await page.getByRole('button', { name: new RegExp('^R\\$\\s' + (preco + 5) + '$') }).click();
  await page.getByRole('button', { name: /^Receber:/ }).click(); await page.getByRole('button', { name: /^R\$\s[\d,]+ no Pix$/ }).click();
  await page.getByRole('button', { name: 'Anunciar no drop' }).click();
  const a = (await salvo(page)).anuncios[0]; assert.deepEqual([a.preco, a.receber, a.tamanho, a.estado], [preco + 5, 'pix', 'G', 'usado']);
  await fechar();
});
test('com câmera: visor ao vivo, foto reduzida e câmera desligada depois', async () => {
  const { page, passar, fechar } = await abrir({ camera: true }); await entrar(page);
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.locator('video#visor').waitFor();
  assert.equal(await page.getByText('Sem câmera aqui').count(), 0);
  await page.waitForFunction(() => document.querySelector('#visor').videoWidth > 0);
  await page.getByRole('button', { name: 'Fotografar' }).click();
  await page.getByText('Olhando…').waitFor(); await passar(1200);
  await page.getByRole('button', { name: 'Anunciar no drop' }).click();
  const foto = (await salvo(page)).anuncios[0].foto;
  assert.ok(foto.startsWith('data:image/jpeg') && foto.length < 200_000);
  assert.equal(await page.locator('video').count(), 0);
  await fechar();
});
test('foto da galeria é reduzida; arquivo que não é imagem vira frase', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.setInputFiles('#foto-entrada', { name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('oi') });
  await page.getByText('Não consegui abrir essa foto. Tente outra ou use a peça de exemplo.').waitFor();
  await page.setInputFiles('#foto-entrada', path.join(__dirname, '..', 'fotos', 'exemplo-venda.jpg'));
  await page.getByText('Olhando…').waitFor(); await passar(1200);
  await page.getByRole('button', { name: 'Anunciar no drop' }).click();
  await page.getByText(/^No drop em/).waitFor();
  const foto = (await salvo(page)).anuncios[0].foto;
  assert.ok(foto.startsWith('data:image/jpeg') && foto.length < 200_000);
  const lado = await page.evaluate(src => new Promise(ok => { const i = new Image(); i.onload = () => ok(Math.max(i.naturalWidth, i.naturalHeight)); i.src = src; }), foto);
  assert.ok(lado <= 600);
  await fechar();
});
test('anunciar funciona mesmo sem conseguir gravar', async () => {
  const { page, passar, fechar } = await abrir({ antes: () => { Storage.prototype.setItem = () => { throw new Error('cheio'); }; } });
  await entrar(page); await anunciarExemplo(page, passar);
  await page.getByText(/^No drop em 19 segundos\./).waitFor();
  await fechar();
});
test('sua peça é levada no drop e o crédito paga o blazer que você pediu', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await page.getByLabel('Diga o que procura').fill('um blazer para a entrevista de quinta'); await page.getByLabel('Diga o que procura').press('Enter');
  await anunciarExemplo(page, passar); await page.getByRole('button', { name: 'Voltar' }).click();
  await aoVivo(page, passar);
  await passar(4800); assert.equal((await salvo(page)).creditos, 0);
  await passar(200);
  await page.getByText(/A Bia, de Nutrição, levou sua jaqueta jeans\. Entraram R\$\s35 em créditos\./).waitFor();
  assert.match(await page.locator('#conta').innerText(), /R\$\s35 em créditos/);
  await page.getByRole('button', { name: 'passo' }).click();
  await page.getByText(/· sai de graça com seus créditos/).waitFor();                       // blazer bege, R$ 30
  await page.reload(); await page.locator('#drop').waitFor();
  assert.equal((await salvo(page)).anuncios[0].vendida, true);
  await fechar();
});
test('crédito parcial, crédito total e Pix', async () => {
  let a = await abrir(); await entrar(a.page);
  await a.page.getByLabel('Diga o que procura').fill('um blazer para a entrevista de quinta'); await a.page.getByLabel('Diga o que procura').press('Enter');
  await anunciarExemplo(a.page, a.passar); await a.page.getByRole('button', { name: 'Voltar' }).click();
  await aoVivo(a.page, a.passar); await a.passar(5000);
  await a.page.getByRole('button', { name: 'É minha' }).click();
  await a.page.getByText(/Seus R\$\s35 em créditos já entraram\. Faltam R\$\s3, pagos na hora\./).waitFor();
  assert.match(await a.page.locator('#conta').innerText(), /R\$\s0 em créditos/);
  await a.page.getByRole('button', { name: 'Cancelar a reserva' }).click(); await a.page.locator('#drop').waitFor();
  await a.page.getByRole('button', { name: 'passo' }).click(); await a.page.getByRole('button', { name: 'É minha' }).click();
  await a.page.getByText('Seus créditos pagaram tudo.').waitFor();
  assert.match(await a.page.locator('#conta').innerText(), /R\$\s5 em créditos/);
  await a.fechar();
  a = await abrir(); await entrar(a.page);
  await ateOPalpite(a.page, a.passar);
  await a.page.getByRole('button', { name: /^Receber:/ }).click(); await a.page.getByRole('button', { name: /^R\$\s31,50 no Pix$/ }).click();
  await a.page.getByRole('button', { name: 'Anunciar no drop' }).click(); await a.page.getByRole('button', { name: 'Voltar' }).click();
  await aoVivo(a.page, a.passar); await a.passar(5000);
  await a.page.getByText(/A Bia, de Nutrição, levou sua jaqueta jeans\. O Pix de R\$\s31,50 cai depois da retirada\./).waitFor();
  assert.match(await a.page.locator('#conta').innerText(), /R\$\s0 em créditos/);
  await a.fechar();
});
test('anúncio feito durante o drop espera o próximo', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page); await aoVivo(page, passar);
  await page.goto(page.url().split('#')[0] + '#/vender');
  await page.getByRole('button', { name: 'Fotografar' }).click(); await passar(1200);
  await page.getByRole('button', { name: 'Anunciar no drop' }).click();
  await page.getByText(/entra quarta, às 20h\./).waitFor();
  await page.getByRole('button', { name: 'Voltar' }).click(); await page.locator('#drop').waitFor();
  await passar(20000); assert.equal((await salvo(page)).anuncios[0].vendida, false);
  await fechar();
});
```

- [ ] **Step 2: Run** `node --test testes/vender.e2e.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** a rota, a câmera com as duas saídas, a redução da foto e a venda no `tique()`.
- [ ] **Step 4: Run** `node --test --test-concurrency=2 "testes/*.test.js"`. Expected: PASS em tudo.
- [ ] **Step 5: Commit** `feat: vender pela câmera e venda simulada no drop`.

---

### Task 10: Você, cor de realce, movimento e entrega

**Files:**
- Modify: `app.js`, `estilo.css`
- Create: `LEIA-ME.md`, `testes/voce.e2e.test.js`, `testes/roteiro.e2e.test.js`, `testes/capturas.js`, `.gitignore` (com `capturas/`)

**Interfaces:**
- Rota `#/voce` (spec 6.8, papel), de cima para baixo:
  - a frase do perfil da primeira vez, com as mesmas `palavra` e os mesmos rótulos (cada troca grava na hora; o e-mail só grava se for válido);
  - `"Você tem R$ N em créditos."`;
  - rótulo `.apoio` "Suas peças" e uma linha por anúncio: `"<tipo> · <tamanho> · R$ N · entra no próximo drop"` ou `"… · vendida em créditos"` / `"… · vendida no Pix"`; sem anúncio: `"Você ainda não anunciou nada."`;
  - rótulo "Suas reservas" e um link por reserva para `#/sua/<id>`: `"<Nome> · <janela> · código XXXX"` (mais `" · retirada"` quando for o caso); sem reserva: `"Nenhuma reserva por enquanto."`;
  - se houver: `"Seu último anúncio levou N s."`;
  - `"A cor do seu brechó é [Cor]."` (`palavra` com rótulo "Cor" e os cinco nomes de `DADOS.CORES`); a escolha grava `estado.realce` e aplica `--realce` no `documentElement`, inclusive ao carregar;
  - botão `.palavra` "ensaiar o drop agora" (ensaia e vai para `#/`);
  - botão `.palavra` "Recomeçar do zero": mostra `"Apagar tudo e começar de novo?"` com "sim" e "não"; "sim" apaga `brecho.v2`, volta o realce ao padrão e abre a primeira vez.
- Movimento, só por CSS: `.frase`, `.contagem` e `.codigo` entram com opacidade e um deslocamento curto (`@keyframes entrar`, cerca de 240 ms, atraso de 60 ms por item via `--i`); a foto do drop que sai gira e desliza para o lado escolhido (cerca de 180 ms) antes da próxima aparecer. Tudo desligado em `@media (prefers-reduced-motion: reduce)`.
- `testes/capturas.js`: script (`node testes/capturas.js`) que, em 360 e 390 px, grava `capturas/<largura>-<tela>.png` com `deviceScaleFactor: 2` de: primeira vez, espera, espera com pedido anotado, visor de vender, palpite, publicado, drop no ar, é sua, fim do drop e você; e sai com erro se alguma tela tiver `scrollWidth > innerWidth`.
- `LEIA-ME.md`: como abrir (duplo clique ou link); o roteiro de gravação sugerido (o do teste `roteiro`, em passos numerados); como regravar ("Recomeçar do zero"); como trocar uma foto (arquivo em `fotos/` e a linha em `dados.js`); o que é simulado (tabela da spec, seção 7); a regra do drop e como mudar dias e horário em `DADOS.DROP`; como rodar os testes.

- [ ] **Step 1: Write the failing tests**

`testes/voce.e2e.test.js`:
```js
const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, salvo } = require('./apoio.js');
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
```

`testes/roteiro.e2e.test.js` (o vídeo inteiro, numa passada):
```js
const test = require('node:test'); const assert = require('node:assert/strict'); const { abrir, entrar, aoVivo } = require('./apoio.js');
test('roteiro do vídeo de ponta a ponta', async () => {
  const { page, passar, fechar } = await abrir(); await entrar(page);
  await page.getByText('Deco, catorze peças entram juntas. Cinco são M, na sua pegada.').waitFor();
  await page.getByLabel('Diga o que procura').fill('um blazer para a entrevista de quinta'); await page.getByLabel('Diga o que procura').press('Enter');
  await page.getByText(/^Anotado: "um blazer para a entrevista de quinta"/).waitFor();
  await page.getByRole('link', { name: 'vender uma peça para este drop' }).click();
  await page.getByRole('button', { name: 'Fotografar' }).click(); await passar(19000);
  await page.getByRole('button', { name: 'Anunciar no drop' }).click();
  await page.getByText('No drop em 19 segundos. Sua jaqueta jeans entra quarta, às 20h.').waitFor();
  await page.getByRole('button', { name: 'Voltar' }).click();
  await aoVivo(page, passar);
  await page.getByText('Você pediu: um blazer para a entrevista de quinta').waitFor();
  await passar(5000);
  await page.getByText(/A Bia, de Nutrição, levou sua jaqueta jeans\. Entraram R\$\s35 em créditos\./).waitFor();
  await page.getByRole('button', { name: 'É minha' }).click();
  await page.getByText('É seu. O blazer preto do Rafa espera você terça, das 12h às 13h, no ponto da FCA. Mostre este código:').waitFor();
  await page.getByText(/Seus R\$\s35 em créditos já entraram\. Faltam R\$\s3, pagos na hora\./).waitFor();
  await page.getByRole('button', { name: 'Voltar ao drop' }).click(); await page.locator('#drop').waitFor();
  await passar(600000);
  await page.getByText('O drop acabou. Você ficou com uma peça.').waitFor();
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByRole('link', { name: /^Seu blazer preto espera você terça, das 12h às 13h\. Código [A-HJKMNP-Z2-9]{4}\.$/ }).click();
  await page.getByRole('button', { name: 'Já retirei' }).click();
  await page.getByRole('button', { name: 'ótimo', exact: true }).click();
  await page.getByText('Obrigado. Uma peça a menos no lixo: Administração chegou a 129.').waitFor();
  await page.locator('#conta').click();
  await page.getByText(/jaqueta jeans · M · R\$\s35 · vendida em créditos/).waitFor();
  await page.getByRole('link', { name: /Blazer preto · terça, das 12h às 13h · código [A-HJKMNP-Z2-9]{4} · retirada/ }).waitFor();
  await page.getByText('Seu último anúncio levou 19 s.').waitFor();
  await fechar();
});
```

- [ ] **Step 2: Run** `node --test testes/voce.e2e.test.js testes/roteiro.e2e.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement** a rota, o realce, as animações, `capturas.js`, `.gitignore` e `LEIA-ME.md`.
- [ ] **Step 4: Run** `node --test --test-concurrency=2 "testes/*.test.js"` e depois `node testes/capturas.js`. Expected: PASS em tudo e 20 capturas em `capturas/`. Abra as capturas de 390 px de espera, palpite, drop no ar e é sua e compare com `docs/referencia/identidade-v2.jpg`; corrija o que destoar (espaçamento, tamanho da serifa, peso do sublinhado, proporção da foto).
- [ ] **Step 5: Commit** `feat: área Você, cor de realce, movimento e guia de gravação`.
