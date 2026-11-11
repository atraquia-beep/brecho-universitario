# Take It: movimento entre telas e toque dos botões

Data: 10/11/2026. Pedido do André na thread "Animar transições e botões do Take It".

## Para que serve

O Take It (app do brechó do campus de MG900 – Empreendedorismo) vai ser gravado em vídeo para a Ativi-05, com entrega no Moodle em 16/11/2026 às 23:59. Hoje cada troca de tela é um corte seco: `desenhar()` apaga a tela (`tela.textContent = ''`) e só a entrada dos textos é animada. O André sentiu isso na passagem da espera do drop para a arara: nada liga o botão "Arara" à tela que abre.

Pedido dele: todas as transições animadas e intuitivas, e botões mais fáceis de entender. O movimento tem que dizer **onde a pessoa está**: se ela mudou de lugar ou se só abriu algo por cima do lugar onde estava.

## O que ele decidiu

- Viu três versões da passagem espera → arara num vídeo comparativo (`/mnt/project-files/MG900/Ativ05-motion/espera-para-arara_3-versoes.mp4`) e escolheu "A ou C".
- Aprovou a divisão proposta ("faz sentido, pode ser"):
  - **A, porta lateral, para trocar de lugar.** A tela nova entra pela direita, por cima da antiga, que recua uns 28% para a esquerda e escurece. Na volta acontece o contrário: a tela de cima sai pela direita e revela a de baixo.
  - **C, folha que sobe, para o que abre por cima e fecha.** A folha sobe de baixo com os cantos de cima arredondados. A tela de baixo encolhe um pouco (escala ~0,92), escurece e continua visível atrás. Ao fechar, a folha desce.
  - **Fica como está:** a abertura (TAKE IT com fotos), a cortina "AO VIVO" quando o drop abre e o cartão da peça que voa para o lado ao passar ou pegar.
  - **O mesmo toque em todos os botões:** o botão afunda um pouco ao ser apertado.
  - Com "Reduzir movimento" ligado, nada disso aparece.

## Mapa das passagens

Rotas: `#/` (primeira vez, espera, drop no ar, fim do drop), `#/arara`, `#/voce`, `#/sua/<peça>` (É seu), `#/vender`.

| Passagem | Movimento |
|---|---|
| Espera ↔ Arara (botão no topo; "voltar", cabide) | A. Ida entra pela direita; volta sai pela direita |
| Espera/Arara/drop ↔ Você (conta no topo) | A, igual |
| Qualquer tela → É seu (`#/sua/…`: pegar peça, aviso da reserva, reserva na tela Você) | C, folha sobe |
| É seu → qualquer tela ("Voltar ao drop", "continuar na arara", "Voltar", cancelar) | C, folha desce e revela a tela de destino |
| Espera → Vender (câmera) | C, folha sobe |
| Vender → qualquer tela (Voltar, cabide) | C, folha desce |
| Passos dentro de Vender (visor → olhando → palpite → publicado) | Sem troca de lugar: a entrada escalonada de hoje (`#tela.entra`) |
| Entrada: e-mail → código → perfil | A, ida (é uma sequência para a frente) **(minha decisão)** |
| Espera → drop no ar | Cortina "AO VIVO" (fica como está) |
| Peça → próxima peça (drop e arara) | Cartão que voa (fica como está) |
| Drop no ar → fim do drop; arara → "você viu a arara inteira" | Entrada escalonada de hoje **(minha decisão)** |
| Lista de opções de uma palavra (tamanho, curso, cor…) abre e fecha | As opções se desdobram logo abaixo da frase, com entrada escalonada curta. Hoje elas aparecem de uma vez **(minha decisão: "todas as transições" inclui isso)** |

Regra geral para o que o mapa não cobrir: ir mais fundo num lugar é A ida; voltar à tela principal é A volta; abrir algo que tem fim (uma reserva, um anúncio) é C.

## Toque dos botões

Valem para todos os elementos tocáveis: `.principal` (botão em bloco), `.palavra` (palavra sublinhada, link ou botão), `#ir-arara`, `#conta`, `#marca`, `#disparo` (botão redondo da câmera) e o botão do `#pedido`.

- Ao apertar (`:active`), o elemento afunda: escala ~0,97 em ~100 ms e volta com a curva `--expo` ao soltar. O preenchimento que já existe no `.principal` (faixa na cor do brechó) continua.
- A `.palavra` também afunda e tem o sublinhado engrossado enquanto é pressionada **(minha decisão)**.
- Nada de mudar texto, ordem ou hierarquia dos botões aqui: isso é da thread "Deixar o app Take It mais intuitivo" (ver Restrições).

## Como o vídeo vai ser feito

Resposta do André (10/11, 23:36 UTC): o vídeo não vai ser gravado à mão. Uma IA vai gravar a tela e o vídeo provavelmente sai no YouTube. Então o alvo principal é o Chromium automatizado (Playwright, com movimento permitido), na tela de celular (390 × 844) e na de computador (1280 × 720). O Safari do iPhone passa a ser só uma conferência de que nada quebra: ~~sem View Transition, o app troca de tela como hoje~~ [Correção de 11/11, revisão final: o iOS 18 em diante roda as passagens (View Transitions); só iOS mais antigo cai no app sem animação. A conferência no WebKit é feita com movimento permitido e uma vez com movimento reduzido.]

## Metas

1. Toda troca de rota da tabela acima é animada no Chromium, tanto na tela de celular quanto na de computador, e aparece certinha numa gravação feita pelo Playwright (`recordVideo`) em 30 fps.
2. Quem assiste ao vídeo entende, sem narração, que a arara e Você são lugares e que "É seu" e "Vender" são janelas que fecham.
3. Todos os botões respondem ao toque do mesmo jeito.

## Fora do escopo

- ~~Fechar a folha arrastando para baixo e a peça seguindo o dedo com mola.~~ ~~Esqueleto, `tabular-nums`, `text-wrap: balance`.~~ **Superado pela "Ampliação de 10/11, 23:44"**: a pedido do André, a folha que fecha arrastando, a pilha com mola, a varredura do "Olhando…", `tabular-nums` e `text-wrap: balance` agora entram. Esqueleto nas fotos continua fora (item 8).
- Texto, rótulo, ordem e hierarquia dos botões: ficam com a outra thread.
- Login de verdade e servidor (o André escolheu manter tudo simulado até o vídeo).

## O que tornaria isso um fracasso, mesmo funcionando

- Animação lenta que atrasa a gravação ou deixa o app parecendo pesado. Ida/volta lateral entre 350 e 500 ms; folha subindo entre 450 e 550 ms, descendo um pouco mais rápido.
- Dois movimentos brigando, por exemplo a tela inteira deslizando enquanto cada frase também sobe de forma escalonada, até virar bagunça.
- O topo (cabide, conta, Arara) pulando ou piscando no meio da passagem.
- Um toque rápido durante a animação travar a tela ou deixar duas telas misturadas.
- Quebrar a abertura, a cortina "AO VIVO", o arraste da peça ou a câmera.
- Qualquer animação aparecer com "Reduzir movimento" ligado.

## Restrições

- Site estático sem framework (`index.html`, `dados.js`, `logica.js`, `app.js`, `estilo.css`), sem dependência nova e sem build.
- Recurso de plataforma escolhido: **View Transitions API de mesmo documento** (`document.startViewTransition`). O teste descartável mostrou que ela resolve A e C com pouco código, envolvendo `desenhar()` disparado pelo `hashchange`. Onde não houver suporte (navegador antigo) ou com `prefers-reduced-motion: reduce`, o app troca de tela como hoje. **(minha decisão)**
- O sentido (lateral ida/volta ou folha sobe/desce) é decidido pela rota de origem e de destino, antes de `desenhar()`.
- Versão de computador (≥ 900 px, dois lados): mesmos movimentos, na janela inteira.
- Testes: os 83 de hoje continuam passando (`node --test --test-concurrency=2 "testes/*.test.js"`). Eles rodam com movimento reduzido, então o caminho sem animação continua coberto. Entram testes novos com movimento permitido que conferem o sentido certo em cada linha do mapa e que a tela final fica correta depois de um toque no meio da animação.
- Convivência com a outra thread: as duas mexem em `app.js` e `estilo.css` na branch `velvet` do repositório `atraquia-beep/brecho-universitario`. Quem constrói depois faz rebase sobre a outra. Cada uma avisa a outra antes de cada push e de cada publicação na Vercel. Animar os botões que vão existir depois da mudança dela, não os que vão sumir.
- Publicação: Vercel, projeto `take-it` (https://takeit-campus.vercel.app), com o mesmo procedimento de antes (push no `main`, depois deploy pelo Composio). Precisa estar no ar com folga antes de 16/11 para o André gravar.
- Branch e publicação **(minha decisão)**: `velvet` é a branch de trabalho e o `main` recebe a mesma versão por fast-forward, como na rodada anterior. O `gh-pages` segue o `main`, sem `docs/`. A publicação acontece depois dos testes passarem e de avisar a outra thread, sem pedir nova aprovação ao André, porque é reversível com um novo deploy.
- Ordem **(minha decisão)**: primeiro as passagens de tela, que não dependem da outra thread. O toque dos botões vai por último e é aplicado por classe (`.principal`, `.palavra` etc.), não por botão, para sobreviver a botões renomeados ou movidos pela outra thread.
- Ponto de partida: o teste descartável está em `/mnt/project-files/MG900/Ativ05-motion/teste-descartavel/` (`patch.js`, `patch.css` com A, B e C, `gravar.js`, e um LEIA.md explicando como foi ligado). Ele cobre só espera ↔ arara, com o topo deslizando junto. Serve de referência, não de código final.
- Os passos da entrada e a cortina "AO VIVO" chamam `desenhar()` direto, inclusive pelo `tique()`, e não pelo `hashchange`. A transição da entrada precisa ser ligada nesses pontos.

## O que fica com quem constrói

- As curvas e durações exatas, dentro das faixas acima.
- Se o topo fica parado durante a passagem lateral (nome próprio de view transition) ou desliza junto. Preferência: parado, se a troca de cor do topo entre telas claras e escuras não ficar estranha.
- Como a entrada escalonada de hoje (`#tela.entra`) convive com a tela deslizando: desligar, encurtar ou atrasar, desde que não vire bagunça.
- Como cancelar uma transição em andamento quando chega outro toque (`skipTransition` ou deixar terminar).
- Onde a lista de opções da palavra ganha a animação, sem mexer no foco nem no teclado (Escape, Enter), que já têm testes.

## Ampliação de 10/11, 23:44: auditoria dos 20 detalhes (skill ui-ux-improve)

Pedido do André: "aumentar o escopo, use a /ui-ux-improve para melhorarmos as animações do site", mantendo tudo o que está acima. Filtro: só entra o que aparece no vídeo gravado pela IA (Chromium) ou o que evita um erro real.

### Entram (em ordem de impacto ÷ esforço)

| # | Item | O que muda no Take It | Onde |
|---|---|---|---|
| 9 | View transitions | Já é o centro deste desenho (A e C acima) | `app.js` `desenhar()`/`hashchange`, `estilo.css` |
| 11 | Animação interrompível | **Pilha de verdade no drop e na arara.** A próxima peça já fica embaixo do cartão, um pouco menor e mais escura, e cresce até o tamanho cheio enquanto o dedo arrasta. Hoje ela só é pré-carregada (`new Image().src`) e surge de repente depois que o fantasma voa. **Volta com mola:** quando o arraste não passa do limite de 80 px, o cartão volta com um leve passar do ponto, em vez do `ease-out` de 0,25 s. **Carimbo progressivo:** "É MINHA"/"PASSO" aparece aos poucos, com opacidade e escala acompanhando a distância, em vez de liga/desliga aos 24 px | `secaoDaPeca`, `arrastavel`, `.cartao`, `.carimbo` |
| 1 | Skeleton / estado de carregando | **"Olhando…" na venda (1,2 s):** uma faixa de luz varre a foto de cima a baixo, como se o app estivesse lendo a peça, em vez de só trocar o texto | `fotografou()` (passo `olhando`), `telaVender` |
| 16 | Números tabulares | O relógio "AO VIVO · mm:ss" (`#resta`), o cronômetro da venda (`#cronometro`), o placar e os preços não tremem quando os dígitos mudam. A contagem da espera e o contador da abertura já têm (`estilo.css:93`, `:224`) | `estilo.css` |
| 10 | Folha que fecha arrastando | As folhas C (É seu, Vender) ganham uma alça no topo. Arrastar para baixo além de ~30% da altura fecha a folha, com o mesmo destino do "Voltar". Abaixo disso, a folha volta com mola. Na Vender, só a alça arrasta, para não brigar com a câmera | telas `sua` e `vender` |
| 17 | Títulos equilibrados | `text-wrap: balance` nas frases curtas da folha da peça e nos títulos de tela. Onde o navegador não suporta, nada muda | `estilo.css` |
| 13 | Área de toque | Cortado: o botão "Arara" do topo sai na mudança da thread de clareza | — |

### Já tem

- **2, resposta imediata:** tudo é local (`localStorage`), e a tela muda no mesmo toque.
- **15, código de uso único:** `inputMode: 'numeric'` e `autocomplete: 'one-time-code'` (`app.js:257`). Colar preenche as quatro caixas, e isso é coberto pelos testes.
- **19, toque duplo:** reservar a mesma peça devolve a reserva existente (`app.js:486`). Atenção nova: um toque durante uma View Transition não pode disparar duas vezes. Isso já está em "fracassos" acima.
- **16 em parte:** contagem e abertura.

### Ficam de fora (e por quê)

- **3 (⌘K), 4 (atalhos), 6 (dados remotos), 7 (pré-renderização), 20 (submenu):** não há servidor, menus aninhados nem muitas ações. O drop já mostra "No teclado: ← passa, → é minha" na tela larga.
- **8, borrão/cor média nas fotos:** as fotos são arquivos locais e pequenos e carregam na hora. O fundo `#262626` já cobre o instante de carga. Não aparece no vídeo.
- **12, voltar preditivo:** gesto do Android, sem equivalente útil na web.
- **14, áreas seguras do iPhone:** a gravação é no Chromium. Vale fazer antes de alguém usar no iPhone de verdade, mas não agora.
- **18, cantos contínuos:** a identidade Velvet é de blocos retos. Arredondar contraria o visual. Só as folhas C têm canto arredondado no topo, enquanto sobem.
- **5, desfazer em vez de confirmar:** "Cancelar a reserva" age na hora, sem confirmação e sem desfazer. É comportamento e texto, então é assunto da thread "Deixar o app Take It mais intuitivo". Repassado a ela.

### Referência de movimento (acervo)

Antes de escrever os itens 9 e 11, quem constrói abre o `src/` dos zips "clothes e-commerce laning page" (Velvet, de onde vem a curva `--expo`) e "Apple dock" (mola e interrupção) na pasta "UI Design" do Drive pessoal, pela CLI gws. Usa esses arquivos só como régua de tempo e de curva: nada é copiado, porque o repositório é público.

### Verificação extra

Gravar com o Playwright, com movimento permitido, a mesma sequência do roteiro do LEIA-ME nas telas 390 × 844 e 1280 × 720. Montar uma folha de contato com os quadros de cada passagem e mandar ao André junto com o aviso de publicação.

## Ajuste de 10/11, 23:46: nova tela de início da thread de clareza

A thread "Deixar o app Take It mais intuitivo" fechou com o André a nova tela de início (`2026-11-10-take-it-clareza-design.md`). **Saem** o botão "Arara" e os créditos do topo, o "Me acorde", a linha de links e as fotos borradas. **Entram** a vitrine horizontal com as peças da arara, o botão "Ver as N peças" (→ `#/arara`), os links "Me avise antes" e "ver um drop de teste agora (10 s)" e uma barra fixa embaixo: Comprar (`#/`), Vender (`#/vender`) e Você (`#/voce`). A barra some no drop ao vivo, na câmera, em É seu e na entrada. O topo fica só com o cabide e o nome (→ `#/voce`). O movimento se ajusta assim **(minhas decisões)**:

- **Vitrine → arara (o item 9 de verdade):** a foto tocada na vitrine cresce até virar a foto em tela cheia da arara, com nome próprio de view transition. O resto da tela faz a passagem lateral A. Se a peça tocada não for a primeira da pilha, a arara abre nela.
- **"Ver as N peças":** passagem lateral A, como no mapa.
- **Barra de baixo:** fica parada durante as passagens, com nome próprio de view transition. A marca da aba ativa desliza até a nova aba. Entre abas, o sentido segue a ordem da barra: ir para uma aba à direita entra pela direita, ir para a esquerda entra pela esquerda. Vender continua sendo folha C, porque a barra some na câmera.
- **Barra que some e volta** (drop ao vivo, câmera, É seu): desce para fora da tela e sobe de volta, sem corte.
- **Vitrine:** rolagem com encaixe (scroll-snap) e entrada escalonada das fotos quando a tela abre.
- A lista acima vale para os botões que existirem depois da mudança. O toque que afunda continua aplicado por classe.

- **Contrato com a thread de clareza (confirmado às 23:46):** cada foto da vitrine tem `data-peca="<id>"`; a barra é um único `<nav id="abas">` no `index.html`, com `aria-current="page"` na aba ativa, e fica escondida pela classe `sem-abas` no `body`; `#marca` e `#conta` continuam. Ela constrói primeiro e avisa no push; o movimento entra por rebase em cima.
