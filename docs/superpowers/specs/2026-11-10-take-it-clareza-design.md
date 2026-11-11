# Take It: tela de início que se explica sozinha

Data: 10/11/2026. Pedido do André na thread "Deixar o app Take It mais intuitivo".

## Para que serve

O Take It (app do brechó do campus, MG900 – Empreendedorismo) vai ser gravado em vídeo para a Ativi-05 (Moodle, 16/11/2026 23:59). A gravação é feita por uma IA com Playwright, em tela de celular (390 × 844) e de computador (1280 × 720), e deve sair no YouTube (informação da thread de movimento, 10/11 23:36 UTC).

Ao abrir o app, quem nunca o viu fica com uma cara de "ué" na tela de espera do drop. O André confirmou os quatro motivos e a leitura geral:

1. Não há nenhuma peça à venda na tela, só um relógio de ~23 h.
2. O único botão de destaque é "Me acorde cinco minutos antes". Comprar (arara), vender e ensaiar o drop estão em links pequenos no rodapé ou no botão "Arara" do canto.
3. Palavras de dentro do projeto: "drop" sem explicação, "pegada", "arara", "R$ 0 em créditos", o cabide sozinho.
4. "Diga o que procura" parece um campo solto.

Leitura confirmada por ele: o app fala do drop como evento, mas não mostra o que a pessoa ganha nem o que ela pode fazer agora.

**Sucesso:** quem assiste ao vídeo entende em ~5 segundos que é um brechó de alunos, que dá para comprar já, vender pela câmera e esperar o drop, sem narração.

## O que o André decidiu

- Viu três versões da tela de início (A vitrine primeiro, B três portas, C drop com prévia; `/mnt/project-files/MG900/Ativ05-ux/inicio-3-versoes.png`) e escolheu **A**, na identidade visual do app.
- Aprovou a versão A refeita com o `estilo.css` do app: `/mnt/project-files/MG900/Ativ05-ux/inicio-A-identidade.png` (hoje à esquerda, A à direita). O mockup em HTML está em `/mnt/project-files/MG900/Ativ05-ux/mockup-A/a2.html`.
- Vai mostrar um drop ao vivo no vídeo, então o drop de teste ("ensaiar") continua na tela de início.
- **O pedido sai do app** (cartão de decisão, 10/11 23:50 UTC): some o campo "Diga o que procura" (`#pedido`), o aviso "Anotado: … · esquecer" da espera e o "Você pediu: …" do drop. O drop passa a abrir sempre na ordem sem pedido. Um `pedido` já gravado no `localStorage` de alguém é só ignorado pela interface (não se apaga dado). As funções de pedido em `logica.js` e os testes delas ficam como estão **(minha decisão: menor mudança; podem ser apagadas depois)**. O roteiro do vídeo deixa de ter a cena do blazer pedido.
- Aprovou o resumo (10/11 23:43 UTC): tela de início A, barra fixa embaixo, linguagem simples, resto do app igual, detalhes de toque listados abaixo.

## Tela de início (espera do drop), de cima para baixo

Vale para a rota `#/` quando a situação é `espera` (inclui o ensaio). Continua na luz escura (`body.escuro`), com a mesma fonte, cores, régua e botão em bloco.

1. **Topo:** cabide à esquerda (como hoje, leva para `#/`). À direita só o nome da pessoa, ligado a `#/voce`. Some o botão "Arara" e some "R$ x em créditos" do topo.
2. **Avisos de reserva** (`avisosDaEspera`): continuam aqui, acima de tudo, como hoje.
3. **Rótulo** em caixa alta (`.lab`/`.ficha`): "À venda agora" à esquerda, "5 peças" à direita (número real de `pilhaDaArara(true)`).
4. **Frase** no tamanho normal: "Roupa de quem estuda aqui. Gostou, toque em **É minha** e ela é sua." ("É minha" com o realce `.amostra`, que é o rótulo do botão da arara).
5. **Vitrine:** fileira horizontal das peças da arara (as que ainda não foram reservadas), foto retangular sem cantos arredondados, etiqueta de preço creme (`.etiqueta`) no canto de baixo da foto e, abaixo, "nome curto · tamanho" em texto de apoio. A fileira passa da borda direita para sugerir que rola. Tocar numa foto abre `#/arara`.
6. **Botão em bloco** (`.principal`): "Ver as N peças" → `#/arara`. É a ação principal da tela.
7. **Bloco do drop:** rótulo "Próximo drop · quarta, 20h" com "faltam" à direita; relógio grande, menor que hoje (cabe na largura sem dominar a tela); régua; frase "Catorze peças novas entram juntas, só por 10 minutos. Duas são M." O "M" continua ligado a `#/voce`. No ensaio, o rótulo vira "Drop de teste" e a frase continua igual.
8. **Dois links** (`.palavra`) logo abaixo da frase: "Me avise antes" e "ver um drop de teste agora (10 s)". Depois de tocar em "Me avise antes", aparece no lugar "Combinado. Te aviso cinco minutos antes."
9. **Barra fixa embaixo** (ver abaixo), com "Comprar" ativo.

O que sai da tela de início: o botão "Me acorde cinco minutos antes", a linha "38 alunos esperando · vender uma peça para este drop · ensaiar o drop agora", a palavra "pegada", o campo "Diga o que procura" e as fotos borradas do próximo drop (`.teaser`).

## Barra fixa embaixo

- Três palavras, lado a lado: **Comprar** (`#/`), **Vender** (`#/vender`), **Você** (`#/voce`). Só texto, sem ícones, na fonte do app. A ativa fica em tinta cheia, com o realce vermelho embaixo (o mesmo de `.opcoes [aria-current]`); as outras em cor de apoio.
- Aparece em: tela de início (espera e fim do drop), arara e Você. **Some** no drop ao vivo, na câmera (`#/vender`), em "É seu" (`#/sua/…`) e na entrada (primeira vez). Mesma regra de hoje do botão "Arara", mais "É seu".
- Na arara, "Comprar" fica ativo.
- Fica na luz da tela onde está (escura ou creme) e respeita a área segura de baixo do iPhone (`env(safe-area-inset-bottom)`).
- Cada palavra tem área de toque de pelo menos 44 px de altura.
- No computador (≥ 900 px, dois lados), a barra fica embaixo da coluna da direita **(minha decisão; o builder pode ajustar se ficar estranho)**.

## Detalhes de toque (aparecem na gravação)

- "É minha" (arara e drop) responde no mesmo toque e ignora o segundo toque rápido (não reserva duas vezes nem pula peça).
- O código de 4 dígitos do login: teclado numérico (`inputmode="numeric"`), `autocomplete="one-time-code"` e colar "1234" preenche as quatro caixas.
- Toda área tocável nova tem pelo menos 44 × 44 px.

## Fica igual

O login simulado (decisão do André de 10/11 22:33 UTC), as cores, a fonte, a abertura, a cortina "AO VIVO", o drop ao vivo, a arara (exceto a barra embaixo e o "voltar", que pode sair porque a barra cobre), a câmera de vender, as telas Você e É seu, os dados e o `localStorage['brecho.v2']`.

## Metas

1. Na tela de início, a primeira dobra do iPhone 13 (390 × 664 úteis no Playwright) mostra: o rótulo "À venda agora", pelo menos duas fotos com preço, o botão "Ver as N peças" e o começo do bloco do drop. A barra embaixo fica sempre visível.
2. Nenhum texto da tela de início usa "pegada", "arara" ou "créditos".
3. De qualquer tela com barra, dá para chegar a comprar, vender e Você em um toque.
4. Os testes existentes continuam passando, ajustados onde testavam textos ou botões que mudaram; testes novos cobrem a vitrine, a barra (onde aparece e onde some) e o toque duplo no "É minha".

## Fora do escopo

- Animações e transições: são da thread "Animar transições e botões do Take It" (spec `2026-11-10-take-it-movimento-design.md`). Ela anima o botão "Arara" do topo, que esta mudança remove: a lista final de botões vai para lá antes de construir.
- Mudar as outras telas além do que está escrito aqui.
- Login de verdade, backend, fotos novas.
- Toast "Desfazer" depois de reservar ou anunciar (não foi pedido; fica para depois se sobrar tempo).

## Anti-metas (falha mesmo funcionando)

- Parecer "só mais um aplicativo" de marketplace: nada de cantos arredondados, ícones genéricos, cartões com sombra ou cores fora da paleta.
- O drop sumir ou parecer secundário a ponto de o vídeo não mostrar o que diferencia o Take It.
- Quebrar a gravação do drop ao vivo, da câmera ou do login.

## Restrições

- Site estático, sem framework (`dados.js`, `logica.js`, `app.js`, `estilo.css`). Nada de dependência nova.
- Diretrizes Karpathy: menor mudança que resolve, sem mexer no que não foi pedido.
- A outra thread mexe em `app.js` e `estilo.css` na mesma branch `velvet`: quem construir depois faz rebase sobre a outra, e cada push ou deploy na Vercel é avisado antes.
- Código no repositório `atraquia-beep/brecho-universitario` (público, branches `main` e `gh-pages`, sem `docs/`). O espelho fica em `/mnt/project-files/MG900/Ativ05-mvp/app/`. Publicar na Vercel seguindo a memória do projeto (`VERCEL_CREATE_NEW_DEPLOYMENT`, projeto `take-it`).

## Contrato com a thread de movimento (combinado em 10/11 23:46 UTC)

Esta thread constrói primeiro; a de movimento faz rebase em cima e anima.
- Cada foto da vitrine leva `data-peca="<id da peça>"`.
- A barra de baixo é um único elemento `<nav id="abas">`, criado uma vez no `index.html`; cada aba é um `<a>` e a ativa tem `aria-current="page"`. Ela some por uma classe no `body` (ex.: `sem-abas`), nunca removendo o nó.
- O topo mantém `id="marca"` e `id="conta"`.
- Avisar a outra thread antes de cada push e deploy.

## Decisões minhas (para o André conferir)

- Tocar numa foto da vitrine abre a arara do começo, não na peça tocada.
- A frase "Cada peça é única. Quem tocar primeiro leva." sai da espera; a explicação curta vai no bloco do drop.
- Barra no computador embaixo da coluna da direita.
- "Me acorde" vira "Me avise antes".
- A regra da linguagem (sem "pegada", "arara", "créditos") vale também para a tela de fim do drop (`telaFim`): só o texto muda ("a arara continua aberta" → "as peças à venda continuam lá"), e o "Voltar" dela pode sair porque a barra cobre.
- A meta da primeira dobra vale sem avisos de reserva. Com reserva, cada aviso fica numa linha curta ("Sua jaqueta bomber: retirada terça, 12h–13h. Código 4821.") e pode empurrar a vitrine; não se esconde o aviso.
- "Vender uma peça para este drop" sai como link e fica só na barra ("Vender"); o roteiro do vídeo (`testes/roteiro.e2e.test.js`) e `capturas.js` passam a usar a barra, a vitrine e o drop de teste. Reescrever esse roteiro faz parte do trabalho.
- Ordem de construção com a thread de movimento: esta mudança remove o botão "Arara" do topo, que a outra anima. A lista de botões foi mandada para lá em 10/11 23:50 UTC; quem construir depois faz rebase sobre a outra.

## Deixado para quem constrói

Tamanho exato do relógio menor, quantas fotos cabem na vitrine em cada largura, o texto exato do nome curto de cada peça e como a barra convive com os dois lados no computador, dentro das metas acima.
