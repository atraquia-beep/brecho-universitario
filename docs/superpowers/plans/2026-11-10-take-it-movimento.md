# Take It: movimento entre telas e toque dos botões. Plano de construção

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer cada troca de tela do Take It ter um sentido visível. Trocar de lugar desliza de lado (A). Abrir e fechar algo por cima sobe e desce como folha (C). Além disso, a pilha de peças, a venda e os botões ganham o acabamento da auditoria de 20 detalhes.

**Architecture:** Uma função pura `Logica.passagem(de, para)` decide o sentido da troca. Em `app.js`, uma função `trocar(passagem, fazer)` envolve o redesenho em `document.startViewTransition` e marca `<html data-passagem="…">`. O CSS de cada sentido fica em `estilo.css`, sob `html[data-passagem=…]`. Sem suporte à API ou com movimento reduzido, `trocar` só chama `fazer()`, e o app fica como hoje.

**Tech Stack:** HTML, CSS e JS puros, sem build e sem dependência nova. Testes: `node:test` com Playwright (Chromium já instalado).

**Spec:** `docs/superpowers/specs/2026-11-10-take-it-movimento-design.md` (ler inteiro, inclusive "Ampliação 23:44" e "Ajuste 23:46").

## Global Constraints

- Nada de dependência nova, framework ou build. Só `index.html`, `dados.js`, `logica.js`, `app.js` e `estilo.css`, mais os testes em `testes/`.
- Com `prefers-reduced-motion: reduce`, nenhuma animação nova roda: `trocar` não abre View Transition e o CSS novo fica dentro de `@media (prefers-reduced-motion: no-preference)` ou é anulado no bloco `reduce` que já existe.
- Sem `document.startViewTransition`, o app troca de tela como hoje, sem erro no console.
- Durações: lateral (ida e volta) entre 350 e 500 ms; folha subindo entre 450 e 550 ms; folha descendo mais rápida que a subida. Curva base: `var(--expo)`. Para sair, uma curva de aceleração, por exemplo `cubic-bezier(.7,0,.84,0)`.
- Ficam como estão: a abertura (`abertura()`), a cortina "AO VIVO" (`cortina('ao-vivo', …)`) e o fantasma que voa (`fantasma()`).
- Contrato com a thread de clareza: fotos da vitrine com `data-peca="<id>"`; barra `<nav id="abas">` no `index.html`, com `aria-current="page"` na aba ativa e escondida pela classe `sem-abas` no `body`; `#marca` e `#conta` continuam existindo.
- Suíte inteira: `node --test --test-concurrency=2 "testes/*.test.js"`. Não passe a pasta: no Node 22 isso falha. Os testes que já existem rodam com `movimento: 'reduce'` (padrão de `abrir()` em `testes/apoio.js`) e têm que continuar passando sem mudança. Os testes novos de movimento usam `abrir({ movimento: 'no-preference' })`.
- Trailer de commit sem nome de modelo. Texto visível ao usuário em português, no tom do app.

## Review Focus

1. **Toque durante a animação.** Tocar em outro link ou botão enquanto a passagem roda deve terminar na tela do segundo toque, inteira, sem duas telas misturadas. O teste fica na Task 2: `toque no meio da passagem termina na tela certa`.
2. **Tique de 200 ms redesenhando no meio da passagem.** O `tique()` chama `desenhar()` quando a situação muda, por exemplo quando o ensaio de 10 s vira drop. Isso não pode quebrar a View Transition em curso nem disparar uma passagem lateral por cima da cortina "AO VIVO". O teste fica na Task 2: `ensaio vira drop com a cortina e sem passagem lateral`.
3. **Foco e teclado depois da passagem.** Escape e Enter nas listas de opções, o foco no primeiro campo da entrada e as setas no drop devem funcionar logo depois de uma troca animada. O teste fica na Task 3: `entrada animada mantém o foco no campo novo`.
4. **Folha arrastada que não fecha.** Soltar abaixo do limite volta a folha com mola, deixa o hash e o estado iguais e não cria reserva nem anúncio. O teste fica na Task 6: `arrastar pouco devolve a folha e não muda nada`.
5. **Tela larga (≥ 900 px, dois lados).** As passagens rodam na janela inteira, sem barra de rolagem horizontal e sem o fantasma ou a folha vazando para fora. O teste fica na Task 2: `tela larga: passagem lateral sem rolagem horizontal`.

---

### Task 0: Preparar o repositório (sem código de produto)

**Files:** nenhum arquivo do app.

- [ ] **Step 1:** Esperar o aviso de push da thread "Deixar o app Take It mais intuitivo". Só começar a Task 1 depois disso.
- [ ] **Step 2:** O repositório já está clonado em `/home/user/brecho-universitario`, desde 10/11 às 23:56 UTC. No GitHub só existem `main` e `gh-pages`: a `velvet` era uma branch local do container antigo. Rodar `git fetch origin main` e criar a branch `movimento` a partir do `main` que a outra thread publicou.
- [ ] **Step 3:** Rodar a suíte. Esperado: todos os testes passam, e o número de testes fica anotado para comparar no fim. A referência é de antes da outra thread: 83 de 83 passando no `main` em `fbdb444`, em 10/11 às 23:57 UTC.
- [ ] **Step 4:** Conferir que o contrato existe: `grep -n 'id="abas"' index.html` e `grep -n "data-peca" app.js`. Se faltar algo, avisar a outra thread antes de seguir.

### Task 1: Sentido da passagem (função pura)

**Files:**
- Modify: `logica.js` (exportar junto das outras funções de `Logica`)
- Test: `testes/logica.test.js`

**Interfaces:**
- Produces: `Logica.passagem(de: string, para: string) -> 'ida' | 'volta' | 'sobe' | 'desce' | null`. `de` e `para` são a primeira parte do hash sem `#/`: `''` (tela principal), `'arara'`, `'voce'`, `'sua'` e `'vender'`.

- [ ] **Step 1: Teste que falha**

```js
test('passagem: lugares deslizam de lado, folhas sobem e descem', () => {
  const p = Logica.passagem;
  assert.equal(p('', 'arara'), 'ida');
  assert.equal(p('arara', ''), 'volta');
  assert.equal(p('', 'voce'), 'ida');
  assert.equal(p('voce', ''), 'volta');
  assert.equal(p('arara', 'voce'), 'ida');
  assert.equal(p('', 'sua'), 'sobe');
  assert.equal(p('arara', 'sua'), 'sobe');
  assert.equal(p('voce', 'sua'), 'sobe');
  assert.equal(p('', 'vender'), 'sobe');
  assert.equal(p('sua', 'arara'), 'desce');
  assert.equal(p('sua', ''), 'desce');
  assert.equal(p('vender', ''), 'desce');
  assert.equal(p('vender', 'voce'), 'desce');
  assert.equal(p('arara', 'arara'), null);
  assert.equal(p('sua', 'sua'), null);
});
```

- [ ] **Step 2:** Rodar `node --test testes/logica.test.js`. Esperado: FAIL, `Logica.passagem is not a function`.
- [ ] **Step 3:** Implementar. Regra: mesma rota dá `null`. Destino `sua` ou `vender` dá `'sobe'`. Origem `sua` ou `vender` dá `'desce'`. Destino `''` dá `'volta'`. O resto dá `'ida'`. A tela principal é a aba mais à esquerda e Você a mais à direita, por isso a ordem da barra já fica certa.
- [ ] **Step 4:** Rodar o mesmo arquivo. Esperado: PASS.
- [ ] **Step 5:** Commit `movimento: sentido de cada passagem entre telas`.

### Task 2: Passagens A e C nas trocas de rota

**Files:**
- Modify: `app.js` (ouvinte de `hashchange`; nova função `trocar` perto de `desenhar`)
- Modify: `estilo.css` (bloco "Movimento", perto de `@keyframes entrar`)
- Create: `testes/passagem.e2e.test.js`

**Interfaces:**
- Consumes: `Logica.passagem`.
- Produces: `trocar(passagem: string|null, fazer: () => void) -> void` em `app.js`. Enquanto a transição roda, `<html>` fica com `data-passagem` igual ao sentido. O atributo sai em `finished`, a não ser que já tenha começado outra transição. Variável de módulo `transicao` (a View Transition em curso ou `null`).

- [ ] **Step 1: Testes que falham** em `testes/passagem.e2e.test.js`, todos com `abrir({ movimento: 'no-preference' })`, `entrar(page)` e esperar `#abertura` sumir (`waitFor({ state: 'detached', timeout: 8000 })`). Para ler o sentido, use `const sentido = page => page.evaluate(() => document.documentElement.dataset.passagem || '')`, lido logo depois do clique, sem `await` no meio.
  - `espera → arara desliza para a frente e volta`: clicar em "Ver as N peças" (o botão da outra thread) e ler `sentido === 'ida'`. Depois `#drop` aparece e, ao terminar, `sentido === ''`. Clicar em `#marca` e ler `sentido === 'volta'`.
  - `É seu sobe e desce`: na arara, clicar em "É minha" e ler `'sobe'`. Clicar em "continuar na arara" e ler `'desce'`.
  - `vender sobe`: clicar na aba Vender do `#abas` e ler `'sobe'`.
  - `toque no meio da passagem termina na tela certa`: clicar em "Ver as N peças" e, sem esperar, clicar em `#marca`. Ao final, `location.hash` é `#/` ou vazio, existe uma única `section` de tela, `#drop` não existe e `sentido === ''`.
  - `ensaio vira drop com a cortina e sem passagem lateral`: tocar em "ver um drop de teste agora (10 s)" e chamar `passar(10000)`. Esperado: `#ao-vivo` aparece, e `sentido` nunca vale `'ida'` nem `'volta'`. Para conferir, acumule em `window.__vistos` por `MutationObserver` no atributo, instalado por `addInitScript`.
  - `tela larga: passagem lateral sem rolagem horizontal`: `abrir({ largura: 1280, altura: 720, movimento: 'no-preference' })`. Ir à arara e, no meio da passagem e depois dela, `document.documentElement.scrollWidth <= innerWidth`.
  - `movimento reduzido: nenhuma passagem`: `abrir()` padrão, ir à arara e `sentido === ''` logo após o clique.
- [ ] **Step 2:** Rodar `node --test testes/passagem.e2e.test.js`. Esperado: FAIL (sentido vazio).
- [ ] **Step 3:** Implementar `trocar`. Se não houver `passagem`, se `document.startViewTransition` não existir ou se `matchMedia('(prefers-reduced-motion: reduce)').matches`, ela só chama `fazer()`. Se houver uma `transicao` em curso, chamar `transicao.skipTransition()` antes da nova. No ouvinte de `hashchange`, calcular `de` a partir de `e.oldURL` e `para` a partir de `location.hash`, os dois como `.replace(/^\/?/, '').split('/')[0]`, e envolver o corpo atual do ouvinte em `trocar(Logica.passagem(de, para), () => { … })`.
- [ ] **Step 4:** CSS, partindo de `/mnt/project-files/MG900/Ativ05-motion/teste-descartavel/patch.css` (versões A e C; a B não entra):
  - `ida`: a tela antiga recua para `translateX(-28%)` com `brightness(.6)`; a nova entra de `translateX(100%)`.
  - `volta`: o contrário, com a antiga por cima (`z-index: 2`).
  - `sobe`: a antiga vai a `scale(.92)` com `brightness(.55)` e `border-radius: 18px`; a nova sobe de `translateY(100%)` com cantos de cima arredondados (22 px).
  - `desce`: o reverso, mais curto.
  - `.topo` ganha `view-transition-name: topo` e `#abas` ganha `view-transition-name: abas`, para os dois ficarem parados. Se a troca de cor do topo entre tela clara e escura piscar, tirar o nome do topo e deixá-lo deslizar junto. Registrar a escolha no commit.
  - Barra que some ou aparece: `::view-transition-old(abas):only-child` desce para `translateY(100%)` e `::view-transition-new(abas):only-child` sobe dali.
  - Enquanto `html[data-passagem]` existir, as animações de `#tela.entra` (frases, títulos, régua, contagem) ficam desligadas: a tela inteira já está se movendo.
- [ ] **Step 5:** Rodar o arquivo novo. Esperado: PASS. Depois rodar a suíte inteira. Esperado: todos passam.
- [ ] **Step 6:** Commit `movimento: lugares deslizam de lado, folhas sobem e descem`.

### Task 3: Entrada, listas de opções e marca da aba

**Files:**
- Modify: `app.js` (`primeiraVez` → `ir`; `palavra` → criação da lista; o ponto onde a outra thread marca `aria-current` em `#abas`)
- Modify: `estilo.css`
- Test: `testes/passagem.e2e.test.js`

**Interfaces:**
- Consumes: `trocar` da Task 2.

- [ ] **Step 1: Testes que falham**
  - `entrada desliza para a frente a cada passo`: abrir sem perfil e com movimento, esperar a abertura sair, preencher o e-mail e tocar em "Receber o código". Esperado: `sentido === 'ida'`.
  - `entrada animada mantém o foco no campo novo`: depois da passagem, `document.activeElement` é a primeira célula do código (`aria-label` "Dígito 1 de 4").
  - `opções se desdobram uma a uma`: na tela Você, tocar numa palavra com opções. Esperado: `.opcoes > button` têm `--j` 0, 1, 2… e `getComputedStyle(...).animationName` contém `entrar`.
  - `marca da aba desliza`: tocar na aba Você. Esperado: `#abas` tem `--aba` igual ao índice da aba ativa (Comprar 0, Vender 1, Você 2).
- [ ] **Step 2:** Rodar e ver FAIL.
- [ ] **Step 3:** Em `ir(passo, foco)`, colocar o corpo atual dentro de `trocar('ida', () => { … })`: `desenhar()`, `.chega` e foco, tudo dentro de `fazer`. Na lista de `palavra()`, cada opção recebe `style.setProperty('--j', n)`, e o CSS faz `.opcoes > * { animation: entrar .35s var(--expo) both; animation-delay: calc(var(--j) * 30ms) }`. **Decisão:** a lista fecha sem animação, porque `fechar()` é chamado por todo `desenhar()` e atrasar a remoção quebraria o foco. Em `#abas`, onde a outra thread marca `aria-current`, definir `--aba`. Um `#abas::after` posicionado por `--aba` desliza com `transition: transform .45s var(--expo)`. Enquanto existir a transição `abas`, esconder `::view-transition-old(abas)` quando as duas existirem, para a marca não aparecer duas vezes.
- [ ] **Step 4:** Rodar o arquivo e a suíte inteira. Esperado: PASS.
- [ ] **Step 5:** Commit `movimento: entrada, listas e abas animadas`.

### Task 4: A foto da vitrine vira a peça da arara

**Files:**
- Modify: `app.js` (clique nas fotos `[data-peca]` da vitrine; `telaArara` / `pilhaDaArara`; rota `#/arara/<id>`)
- Modify: `estilo.css`
- Test: `testes/arara.e2e.test.js` (comportamento) e `testes/passagem.e2e.test.js` (movimento)

**Interfaces:**
- Consumes: `trocar`, `data-peca` (contrato).
- Produces: a rota `#/arara/<id>` abre a arara com a peça `<id>` na frente, se ela ainda estiver na pilha. Se não estiver, a arara abre na ordem normal.

- [ ] **Step 1: Testes que falham**
  - Em `arara.e2e.test.js`, `arara abre na peça tocada da vitrine`: com movimento reduzido, tocar na terceira foto da vitrine. Esperado: `nomeNaTela(page)` é o nome dessa peça, e "passo" leva à primeira peça da ordem normal que ainda não foi vista.
  - Em `passagem.e2e.test.js`, `a foto tocada cresce até a arara`: com movimento, no clique, a `img[data-peca]` tocada tem `style.viewTransitionName === 'peca'`. Depois da passagem, nenhum elemento tem esse nome.
- [ ] **Step 2:** Rodar e ver FAIL.
- [ ] **Step 3:** O link da foto vai para `#/arara/<id>`. No clique, antes de mudar o hash, a foto ganha `viewTransitionName = 'peca'`. Enquanto `data-passagem` existir, `#peca` também tem `view-transition-name: peca`. Nos dois, limpar em `transicao.finished`. Em `telaArara`, se o segundo pedaço do hash for um id da `pilhaDaArara()`, essa peça vai para a frente. O hash de origem `arara/<id>` continua contando como `'arara'` na Task 1.
- [ ] **Step 4:** Rodar os dois arquivos e a suíte. Esperado: PASS.
- [ ] **Step 5:** Commit `movimento: a foto da vitrine cresce até a arara`.

### Task 5: Pilha de verdade, mola e carimbo progressivo

**Files:**
- Modify: `app.js` (`secaoDaPeca`, `arrastavel`)
- Modify: `estilo.css` (`.cartao`, `.carimbo`, nova `.proxima`)
- Test: `testes/drop.e2e.test.js` ou `testes/passagem.e2e.test.js`

**Interfaces:**
- Produces: `.foto` recebe a variável `--puxa` (0 a 1) durante o arraste. `img.proxima` (alt vazio, `aria-hidden`) fica atrás do `.cartao` quando há próxima peça.

- [ ] **Step 1: Testes que falham** (com movimento)
  - `a próxima peça espera embaixo e cresce com o arraste`: na arara, `img.proxima` existe com `src` da segunda peça. Arrastar o cartão 40 px para a direita com `page.mouse`, sem soltar. Esperado: `--puxa` em `.foto` fica entre 0,4 e 0,6 e a opacidade do carimbo fica entre 0 e 1, sem incluir os extremos.
  - `soltar antes do limite volta com mola`: soltar aos 40 px. Esperado: `getComputedStyle(cartao).transitionTimingFunction` contém um `cubic-bezier` com o segundo valor > 1 (passa do ponto). A peça na tela continua a mesma.
  - Última peça: sem próxima, `img.proxima` não existe.
- [ ] **Step 2:** Rodar e ver FAIL.
- [ ] **Step 3:** Em `secaoDaPeca`, quando houver `proxima`, criar `img.proxima` antes do `.cartao`, dentro de `.foto`, e trocar o pré-carregamento `new Image()` por ela. Em `mostrar(dx)`, definir `--puxa = min(|dx| / 80, 1)` em `.foto`. O carimbo continua `hidden` abaixo de 24 px; acima disso, a opacidade é `(|dx| - 24) / 56`, limitada a 1, e a escala vai de 0,85 até 1. CSS: `.proxima` com `scale(calc(.94 + .06 * var(--puxa, 0)))` e `brightness(calc(.6 + .4 * var(--puxa, 0)))`. A transição de volta do `.cartao` passa a ser `transform .5s cubic-bezier(.34, 1.56, .64, 1)`. Quando a peça troca (vista nova com `#tela.entra` e sem `data-passagem`), o `#peca` novo anima `from { transform: scale(.94); filter: brightness(.6) }`, para continuar de onde a `.proxima` estava.
- [ ] **Step 4:** Rodar o arquivo, `drop.e2e.test.js`, `arara.e2e.test.js` e a suíte inteira. Esperado: PASS.
- [ ] **Step 5:** Commit `movimento: pilha de peças com mola e carimbo progressivo`.

### Task 6: Folhas que fecham arrastando

**Files:**
- Modify: `app.js` (`telaSua`, `telaVender`, `trocar`)
- Modify: `estilo.css`
- Test: `testes/passagem.e2e.test.js`

**Interfaces:**
- Consumes: `trocar('desce', …)`.
- Produces: elemento `.alca` (`role="button"`, `aria-label="Fechar"`) no topo das telas `sua` e `vender`. Tocar nele faz o mesmo que "Voltar". A variável `--arraste` (px) no `<html>` é lida pela animação `desce`.

- [ ] **Step 1: Testes que falham** (com movimento)
  - `arrastar a folha para baixo fecha`: em É seu de uma peça da arara, arrastar `.alca` 60% da altura da janela e soltar. Esperado: `sentido === 'desce'` e, ao final, hash `#/arara`.
  - `arrastar pouco devolve a folha e não muda nada`: arrastar 15% e soltar. Esperado: o hash continua `#/sua/<id>`, `#tela` volta a `transform: none` e `salvo(page).reservas` não muda.
  - `alça tocada fecha`: um clique em `.alca` leva ao mesmo destino de "Voltar".
  - Com movimento reduzido: `.alca` existe e o clique fecha.
- [ ] **Step 2:** Rodar e ver FAIL.
- [ ] **Step 3:** O destino de fechar é o mesmo do "Voltar" de cada tela. Em `sua`, é `#/arara` para peça da arara (`daArara(id)`) e `#/` para as outras. Em `vender`, é `#/`. Arraste com `pointerdown`, `pointermove` e `pointerup` na `.alca` (só nela, para não brigar com a câmera): `#tela` acompanha `translateY(dy)` para baixo, e para cima com resistência (`dy / 4`). Durante o arraste, `body.arrastando-folha` pinta o fundo de preto. Soltar acima de 30% de `innerHeight`: gravar `--arraste = dy + 'px'` no `<html>`, zerar o `transform` de `#tela` e ir ao destino. A animação `desce` da tela antiga parte de `translateY(var(--arraste, 0px))`. Soltar abaixo: `#tela` volta com a mesma mola da Task 5.
- [ ] **Step 4:** Rodar o arquivo, `vender.e2e.test.js` e a suíte inteira. Esperado: PASS.
- [ ] **Step 5:** Commit `movimento: folhas fecham arrastando para baixo`.

### Task 7: "Olhando…", números firmes, títulos equilibrados e toque dos botões

**Files:**
- Modify: `app.js` (`telaVender`: classe `olhando` no visor quando `v.passo === 'olhando'`)
- Modify: `estilo.css`
- Test: `testes/vender.e2e.test.js` e `testes/identidade.e2e.test.js`

- [ ] **Step 1: Testes que falham**
  - `olhando varre a foto`: com movimento, vender sem câmera e fotografar. Esperado: `.visor.olhando` existe e `getComputedStyle(visor, '::after').animationName` não é `none`. No palpite, a classe sai.
  - `números não tremem`: `#resta`, `#cronometro`, `#placar` e `#conta`, quando existirem, têm `fontVariantNumeric` contendo `tabular-nums`.
  - `frases da peça equilibradas`: `.folha .frase` tem `textWrap` igual a `balance` (no Chromium).
  - `botões afundam ao toque`: com `page.mouse.down()` sobre "É minha", `transform` de `.principal` vale `matrix(0.97, …)`. Numa `.palavra` pressionada, `textDecorationThickness` é maior que solta.
- [ ] **Step 2:** Rodar e ver FAIL.
- [ ] **Step 3:** CSS:
  - `.visor.olhando::after`: faixa de luz em gradiente, com uns 18% de altura, que varre de cima a baixo em 1,1 s, em loop.
  - `tabular-nums` nos quatro ids acima. **Decisão:** os preços dentro das frases ficam proporcionais, porque não mudam ao vivo e dígitos tabulares no meio do texto ficam estranhos.
  - `text-wrap: balance` em `.folha .frase`.
  - Toque: `.principal`, `#marca`, `#conta`, `#disparo` e as abas de `#abas` (o campo `#pedido` sai na mudança da outra thread) com `:active { transform: scale(.97) }`, transição de transform de 100 ms na descida e `var(--expo)` na volta. **Decisão:** a `.palavra` é texto corrido, e `transform` não age em elemento inline. Ela ganha `text-decoration-thickness` maior e `opacity: .7` em `:active`, sem mudar `display`.
  - Tudo isso fica anulado no bloco `prefers-reduced-motion: reduce`, menos `tabular-nums` e `balance`, que não são movimento.
- [ ] **Step 4:** Rodar os arquivos e a suíte inteira. Esperado: PASS.
- [ ] **Step 5:** Commit `movimento: venda olhando, números firmes e toque dos botões`.

### Task 8: Gravar, conferir e publicar

**Files:** `LEIA-ME.md` (uma linha em "Antes de gravar" sobre o movimento) e a pasta de entrega `/mnt/project-files/MG900/Ativ05-motion/`.

- [ ] **Step 1:** Adaptar `/mnt/project-files/MG900/Ativ05-motion/teste-descartavel/gravar.js` para gravar, com movimento permitido, o roteiro do LEIA-ME nas telas 390 × 844 e 1280 × 720 (sem o patch do teste descartável). Gerar uma folha de contato (ffmpeg `tile`) com 4 quadros de cada passagem do mapa.
- [ ] **Step 2:** Olhar a folha de contato e conferir cada linha da tabela "Mapa das passagens" e da seção "Ajuste 23:46" do desenho. Também conferir os fracassos listados: nada piscando no topo, nenhuma tela misturada, abertura, cortina e câmera intactas.
- [ ] **Step 3:** Rodar a suíte inteira. Esperado: o número de testes da Task 0 mais os novos, todos passando.
- [ ] **Step 4:** Rodar o roteiro com o perfil WebKit do Playwright (iPhone 13) com `movimento: 'no-preference'` (o iOS 18+ roda as passagens) e mais uma vez com `'reduce'`, só para conferir que nada quebra: as telas trocam sem erro no console; olhar os primeiros quadros do fechar arrastando (`<html>` deslocado), a mola de `--arraste` e a foto que cresce. [Ajuste de 11/11, revisão final.]
- [ ] **Step 5:** Avisar a thread "Deixar o app Take It mais intuitivo" antes do push. Depois, fazer fast-forward do `main` para `movimento`, push do `main` e atualizar o `gh-pages` sem `docs/`. Por fim, fazer o deploy na Vercel pelo Composio: `VERCEL_CREATE_NEW_DEPLOYMENT` com `gitSource {type github, repoId "1453074389", ref main}`, projeto `take-it`, target production.
- [ ] **Step 6:** Abrir https://takeit-campus.vercel.app nos perfis iPhone 13 e Pixel 7 e na tela 1280 × 720 do Playwright, e conferir uma passagem de cada tipo. Mandar ao André a folha de contato e o vídeo do roteiro.
