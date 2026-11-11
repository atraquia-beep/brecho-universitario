# Brechó Universitário: protótipo navegável para o vídeo do MVP

Desenho de 10/11/2026, **versão 2 (o drop do campus)** · MG900 – Empreendedorismo · Grupo G · Atividade 05 (MVP em vídeo, prazo 16/11/2026 23:59)

## 1. Por que isto existe

O Grupo G precisa gravar o vídeo do MVP do Brechó Digital Universitário: alunos do campus de Limeira (FCA e FT) vendem, compram e trocam roupas entre si, com entrada só por e-mail da Unicamp e retirada num ponto fixo do campus. O enunciado diz que o importante é testar a ideia e aceita qualquer meio de protótipo.

O André quer um app/site que **ilustre o quanto é fácil**. Palavras dele: não precisa ser 100% funcional; tem que ser prático, pessoal e personalizável; não pode ser "mais um app todo engessado de marketplace". Sobre a versão 1 deste desenho (um assistente com feed de fotos), ele disse que estava "muito padrãozinho de app" e pediu para garantir que "não seja só mais um aplicativo". Dos três caminhos que viu (`docs/referencia/caminhos-v2.jpg`), pediu para usar todos.

O que cada referência empresta:

- **A regra: o drop** (lançamentos de tênis da Nike, BeReal). As peças entram todas juntas, com hora marcada, e cada uma é única. É o protagonista.
- **O gesto: uma peça por vez** (Tinder, TikTok). Durante o drop não há grade nem busca: arrasta-se para querer ou passar.
- **A venda: abre na câmera** (Snapchat, Cal AI, Depop, Curtsy). Tocou em vender, já está na câmera; uma foto vira o anúncio.
- **A voz e a identidade visual: Instinct.** O app fala em frases e lembra de você (seção 5).

Por que o drop e não uma loja aberta: num campus de 3.919 alunos, uma loja aberta 24 horas parece vazia. A mesma oferta concentrada em dez minutos parece cheia e vira hábito.

Quem usa: integrantes do grupo, no celular ou no computador, enquanto gravam a tela. Depois, dois ou três colegas cronometrados, para o vídeo ter um número e não só opinião.

## 2. Objetivos

1. Cinco momentos funcionam de ponta a ponta, sem travar fora do roteiro: **primeira vez**, **espera** (contagem regressiva), **vender pela câmera**, **drop no ar** (arrastar e pegar) e **retirada**.
2. Um só protagonista. A tela de espera não é um menu: é uma contagem e duas ações discretas.
3. Facilidade com número: anunciar em até 30 s (do toque em vender até publicar), com o tempo exibido na tela. Pegar uma peça é um gesto.
4. O app tem a cara de quem usa: nome, tamanho, pegada, teto de gasto, curso, pedido e cor de realce mudam a ordem da pilha e as frases.
5. O ciclo do negócio aparece numa tomada só: vender gera crédito (100%) ou Pix (90%, comissão de 10%), e o crédito paga a próxima peça.
6. Dá para gravar quando quiser: "ensaiar o drop agora" começa um drop em 10 segundos, e "recomeçar do zero" limpa tudo.

## 3. Fora do escopo

Servidor, banco, login real, envio de e-mail, pagamento, IA de verdade, drop sincronizado entre aparelhos, aviso real antes do drop, o app aprender gosto pelos gestos, chat entre alunos, destaque pago, taxa de R$ 1 por troca, bazar, moderação, mais de um usuário real, loja de aplicativos.

## 4. O que seria fracasso

- Parecer marketplace genérico: barra de abas, grade de categorias, feed rolável, cartões com sombra, formulário com rótulos e botões.
- Três funções disputando atenção. Se a espera virar um menu, voltou a ser um app comum.
- Usar nome, logotipo, desenho ou arquivos de fonte do Instinct, do Depop ou de qualquer outra marca. Copia-se a linguagem, não a marca.
- Travar ou mostrar erro quando quem grava toca em algo fora do roteiro. Todo elemento tocável faz algo sensato.
- Esconder que o reconhecimento é simulado: nenhum texto do app afirma que há IA analisando a foto.

## 5. Identidade visual (decidida pelo André; tradução minha)

Medido no site instinct.com em 10/11/2026: fundo branco, tinta `#1F2322`, frases grandes numa serifa elegante (24 px, peso 400), textos de apoio numa grotesca de 13 px, nenhuma caixa nem botão, ações como trechos sublinhados dentro das frases, chamada principal com um realce quente por baixo e "›", e um desenho a nanquim feito à mão como marca.

No brechó:

- **Duas luzes.** Telas de papel (primeira vez, é sua, você): fundo `#FFFFFF`, tinta `#1F2322`, apoio `#6E7270`. Telas de drop (espera, drop no ar, câmera): fundo `#1F2322`, texto `#F4F1EA`, apoio `#A9ADAA`.
- Realce padrão areia `#F0E4D6` (nas telas de drop, o mesmo tom a 26% de opacidade).
- Frases em **Newsreader** (livre, embutida no projeto), cerca de 21 px no celular. Apoio em **Inter** 12,5 a 13 px. Contagem regressiva em Newsreader ~76 px, algarismos tabulares.
- O app fala em frases. Ação é palavra sublinhada. A ação principal de cada tela tem peso 600, realce por baixo e "›".
- Marca: um **cabide desenhado a nanquim**, nosso, com traço irregular. No topo à esquerda, leva à tela principal (a espera ou, se estiver no ar, o drop).
- As fotos das peças são a única cor. No drop e na câmera a foto ocupa a tela. Sem sombra, sem ícones de sistema, sem emoji.
- Movimento leve: frases e fotos entram em sequência curta; a peça acompanha o dedo ao arrastar e sai da tela inclinada. Respeita `prefers-reduced-motion`.
- Referência do visual: `docs/referencia/identidade-v2.jpg`. Ela vale para tipografia, cor, espaçamento e tom. Onde o texto deste documento e a imagem divergirem em conteúdo ou posição, vale o texto.

## 6. Como o app se comporta

Sem barra de navegação. O cabide no topo à esquerda leva à tela principal (espera ou drop). No topo à direita, "Nome · R$ N em créditos" abre **Você**. O voltar do navegador e o gesto de voltar do celular funcionam e não perdem o estado.

### 6.0 A regra do drop

- Os drops são **segunda e quarta, às 20h** (horário de Brasília) e duram **10 minutos**.
- Todas as peças disponíveis entram juntas. Cada peça é única: quem tocar primeiro leva.
- A retirada é no ponto da FCA, nas janelas de **terça e quinta, das 12h às 13h**. O app oferece as duas próximas.
- **Ensaio:** "ensaiar o drop agora" marca um drop para dali a 10 segundos, com as mesmas regras. Serve para gravar e para mostrar a alguém. Depois que o ensaio acaba, a contagem volta para o próximo drop do calendário.

### 6.1 Primeira vez (papel)

Uma frase editável no lugar de um formulário:

> Oi. Este é o brechó do campus de Limeira, só entre alunos.
> Eu sou **nome**, visto **M**, gosto de **vintage** e **street** e gasto **até R$ 40** numa peça. Estudo **Administração**.
> Meu e-mail da Unicamp é **…@dac.unicamp.br**.
> Entrar ›

Tocar numa palavra sublinhada abre as opções ali mesmo, em linha, como palavras sublinhadas (sem janela, sem seletor nativo). Nome e e-mail são digitados no próprio lugar da palavra. Opções: tamanho PP, P, M, G, GG; pegada (até duas) básico, vintage, street, social, esportivo; teto até R$ 20, 40, 60, 80 ou sem teto; curso numa lista curta da FCA e da FT mais "outro curso". O e-mail só passa se terminar em `@dac.unicamp.br` ou `@unicamp.br`; se não, o app responde com uma frase ("Preciso de um e-mail da Unicamp para deixar você entrar."), sem caixa de erro. Nenhum código é enviado.

### 6.2 Espera (drop)

É a tela principal fora do drop. De cima para baixo:

1. Rótulo de apoio: "Próximo drop · quarta, 20h" (no ensaio: "Ensaio do drop").
2. A contagem regressiva, grande: `02:14:09`. Com 48 horas ou mais, mostra "N dias".
3. Frases: "Deco, catorze peças entram juntas. Cinco são **M**, na sua pegada." e "Cada peça é única. Quem tocar primeiro leva." Os números são contagens reais do catálogo disponível; o tamanho sublinhado leva a Você. Sem nenhuma que sirva: "Deco, catorze peças entram juntas. Nenhuma é **M** na sua pegada desta vez, mas vale olhar."
4. Três fotos do drop, borradas, com a legenda "só abre na hora".
5. Ação principal: "Me acorde cinco minutos antes ›". Depois do toque vira a frase "Combinado. Eu te acordo cinco minutos antes." (o app guarda a escolha; nenhum aviso real é enviado).
6. Em letra de apoio: "**vender uma peça para este drop** · **ensaiar o drop agora**".
7. Campo fixo no rodapé, em uma linha: "Diga o que procura" (seção 6.7).

Acima do rótulo, quando existirem: a reserva que ainda não foi retirada ("Seu blazer preto espera você **terça, das 12h às 13h**. Código 4K7P.", que abre a tela É sua) e o pedido anotado (6.7).

Quando a contagem chega a zero, a tela vira o drop sozinha, sem toque.

### 6.3 Drop no ar (drop)

- Uma peça por vez, com a foto ocupando a tela. No topo: "AO VIVO · 09:41" (tempo que resta) e "23 online".
- Embaixo: "Jaqueta jeans, M, pouco uso. R$ 35." e, em apoio, "Ana, Administração · nota 4,8", seguido de "· serve em você" quando serve e de "· sai de graça com seus créditos" quando os créditos cobrem.
- **Arrastar para a direita** ou tocar "É minha ›" reserva a peça. **Arrastar para a esquerda** ou tocar "passo" mostra a próxima; a peça passada não volta. As setas do teclado fazem o mesmo.
- Ordem da pilha: primeiro o que a pessoa pediu (6.7), depois o que serve nela (tamanho igual, preço até o teto, ao menos uma pegada em comum), depois o resto do campus.
- Uma barra fina mostra "6 de 14 já foram". Outras peças vão sendo levadas enquanto a pessoa olha: uma a cada 8 segundos, sempre do fim da pilha e nunca a que está na tela.
- Fim, quando o tempo acaba ou a pilha termina: "O drop acabou. Você ficou com uma peça." (ou "com duas peças", ou "Você não pegou nada desta vez.") e "Próximo drop: quarta, 20h." com "Voltar ›".

### 6.4 É sua (papel)

- "É sua. A jaqueta jeans da Ana espera você **terça, das 12h às 13h**, no ponto da FCA. Mostre este código:" seguido de um código de 4 caracteres em corpo grande. A janela sublinhada troca entre as duas próximas.
- Créditos entram primeiro: "Seus R$ 35 em créditos já entraram. Faltam R$ 3, pagos na hora." Sem créditos: "Você paga R$ 35 na hora, em Pix ou dinheiro." Cobrindo tudo: "Seus créditos pagaram tudo."
- Com o drop no ar, a ação principal é "Voltar ao drop ›". Fora dele, é "Já retirei ›", que pergunta como foi (**ótimo**, **ok**, **ruim**) e fecha com o contador: "Obrigado. Uma peça a menos no lixo: Administração chegou a 129."
- "Cancelar a reserva" devolve os créditos e a peça.

### 6.5 Vender pela câmera (drop)

- "Vender uma peça" abre a câmera na hora: a imagem ao vivo ocupa a tela, com cantoneiras, um botão de disparo e um cronômetro no topo, que conta desde o toque em vender.
- Se o aparelho não entregar a câmera (sem permissão, sem câmera, navegador que bloqueia), a tela mostra a peça de exemplo no lugar da imagem ao vivo e avisa em apoio: "Sem câmera aqui: usei uma peça de exemplo." Sempre existe "escolher uma foto", que abre a galeria.
- O disparo congela a imagem. Depois de um instante ("Olhando…"), duas etiquetas aparecem sobre a foto ("jaqueta jeans · M · pouco uso" e "R$ 35") e, embaixo, as frases: "Parece uma **jaqueta jeans**, tamanho **M**, **pouco uso**. No campus, peças assim saem por R$ 30 a R$ 40. Eu anunciaria por **R$ 35**." e "Vendendo, prefiro **R$ 35 em créditos**." (a outra opção é "R$ 31,50 no Pix"). Cada palavra sublinhada troca em linha, e as etiquetas acompanham. O tamanho já vem com o da pessoa. Trocar tipo ou estado refaz a faixa e a sugestão.
- "Anunciar no drop ›" responde: "No drop em 19 segundos. Sua jaqueta jeans entra **quarta, às 20h**."
- O anúncio aparece em Você, e não na própria pilha.

### 6.6 Sua peça no drop (venda simulada)

Com um anúncio seu esperando, 5 segundos depois de um drop começar aparece sobre a tela, por alguns segundos: "A Bia, de Nutrição, levou sua jaqueta jeans. Entraram R$ 35 em créditos." (ou "O Pix de R$ 31,50 cai depois da retirada."). O saldo no topo muda na hora e a peça fica marcada como vendida em Você.

### 6.7 Pedir

- O campo "Diga o que procura" fica na espera. O texto vira uma busca por palavras: tipo de peça e sinônimos, tamanho (ou o da pessoa), teto ("até 40", ou o da pessoa) e ocasião (entrevista, festa, frio, treino).
- Resposta, na própria espera: "Anotado: "um blazer para a entrevista de quinta". O que combinar com isso abre a sua pilha no próximo drop." com "esquecer" ao lado. Se o texto não tiver peça nem ocasião que o app entenda: "Não entendi que peça você procura. Tente algo como "um blazer para a entrevista"."
- No drop, as peças que combinam vêm primeiro, e a primeira delas traz em apoio "Você pediu: um blazer para a entrevista de quinta".
- Vale um pedido por vez. Ele some quando o drop acaba.

### 6.8 Você (papel)

A frase do perfil, editável como na primeira vez; créditos; suas peças ("entra no próximo drop", "vendida em créditos" ou "vendida no Pix"); suas reservas (com código); "seu último anúncio levou N s"; cor de realce (cinco opções); "ensaiar o drop agora"; "recomeçar do zero".

## 7. O que é simulado

| Parece | É |
|---|---|
| Drop com o campus inteiro | Cada aparelho roda o seu. "23 online" e "38 esperando" são números fixos |
| Outros alunos levando peças | Uma peça do fim da pilha sai a cada 8 segundos |
| Reconhecer a foto | Palpite roteirizado (o primeiro é jaqueta jeans, pouco uso), sempre editável |
| Entender o pedido | Busca por palavras-chave sobre o catálogo de exemplo |
| Outro aluno comprando a sua peça | Evento fixo 5 segundos depois de o drop começar |
| Acordar antes do drop | Só guarda a escolha |
| Verificar e-mail | Checagem do final do endereço |
| Catálogo | 14 peças de exemplo, com vendedores fictícios. Pelo menos três peças M, duas P, duas G e uma em PP e GG (com cinco peças M que servem e dois blazers M, três de cada não cabem em 14). O perfil M, vintage e street, até R$ 40 tem exatamente cinco peças que servem, e existem exatamente dois blazers M até R$ 40 |

## 8. Restrições

- Site estático: HTML, CSS e JavaScript puros, sem framework, sem servidor, sem dependência nova. Abre por link e por duplo clique no arquivo (`file://`), então nada de `fetch` de arquivos locais nem módulos ES.
- Celular primeiro (360 a 430 px, sem rolagem horizontal). No computador, uma coluna central com largura de celular.
- Estado em memória e em `localStorage`, com proteção para quando ele não existir.
- Câmera pelo navegador quando houver; sem ela, o app continua com a peça de exemplo ou com uma foto da galeria.
- Todo gesto tem um equivalente em botão e em teclado.
- Português do Brasil, tratamento por "você".
- Acessível: ações são botões ou links de verdade, foco visível, contraste suficiente, fotos com texto alternativo.
- Fotos de exemplo de banco gratuito (licença Unsplash), reduzidas, com a lista de origens em `fotos/CREDITOS.md`. Trocar por foto real é trocar um arquivo e uma linha do catálogo.
- Diretrizes Karpathy do projeto: o mínimo de código que resolve e verificação definida antes.

## 9. Como saber que funcionou

- Teste das funções puras (calendário do drop, ordem da pilha, leitura do pedido, sugestão de preço, conta de crédito e comissão) com `node --test`.
- Um roteiro automático no navegador (Playwright, 390×844) percorre o vídeo inteiro: primeira vez, espera com as contagens certas, pedido de um blazer, venda pela câmera com o tempo exibido, ensaio do drop, a contagem zerando e virando o drop, a venda simulada somando R$ 35 de crédito, o blazer pedido abrindo a pilha, a reserva usando o crédito, retirada e recomeçar do zero. Também confere e-mail inválido, pedido que o app não entende, aparelho sem câmera, arrastar com o dedo e fim do drop por tempo.
- Capturas de cada tela em 360 e 390 px comparadas com `identidade-v2.jpg`.

## 10. Escolhas minhas (o André pode derrubar)

- O drop é o protagonista; arrastar e câmera servem a ele.
- Drops segunda e quarta às 20h, com 10 minutos; retirada terça e quinta, das 12h às 13h.
- Existe um "ensaiar o drop agora" visível no app, com esse nome, para gravar sem esperar o calendário.
- A forma de receber (créditos ou Pix) é escolhida ao anunciar, com créditos como padrão, para a venda não interromper o drop.
- O pedido em texto não mostra resultado na hora: ele muda a ordem da pilha do próximo drop.
- O app não aprende gosto pelos gestos nesta versão.
- Site próprio que abre no celular, e não um contato de WhatsApp. Nome exibido: "Brechó Universitário".
- Fontes livres parecidas com as do Instinct, e um cabide como marca.
- Toda peça tem preço; "troca" é pagar com créditos. Saldo começa em R$ 0.
- Só o tempo de anunciar aparece na tela.
- Prazo interno: versão gravável em 11/11/2026, para o grupo ter de 12 a 15/11 para cronometrar colegas, gravar e editar.

## 11. Em aberto com o André (não trava a construção)

1. Onde publicar para gravar no celular com endereço limpo. A nuvem não cria repositório; ele criaria um vazio no GitHub para o GitHub Pages. Sem isso, a gravação é no computador, abrindo o arquivo.
2. Trocar as fotos de exemplo por peças reais do grupo.
3. Fazer um drop de verdade no grupo de WhatsApp nesta semana, para o vídeo ter um número real (quantas peças saíram em dez minutos).

## 12. Deixado para quem constrói

Organização dos arquivos, nomes internos, textos exatos das frases fora dos exemplos acima, tabela de preços por tipo e estado, lista de sinônimos, lista de cursos, as 14 peças e fotos, desenho final do cabide, tempos das animações, limiar do gesto de arrastar, e se o computador mostra um contorno de celular em volta da coluna.

## 13. Decisões tomadas na construção (10/11/2026)

Durante a construção apareceram pontos que este desenho e o plano não resolviam, ou resolviam de dois jeitos. Decidi cada um e segui em frente. O André pode derrubar qualquer um. Cada linha diz o custo se a decisão estiver errada.

### Com efeito no que aparece

- **Topo no drop.** O cabide e o saldo continuam no topo da tela do drop, sobre a foto, com as duas pílulas logo abaixo. O esboço não tinha topo nessa tela. Custo: a tela difere do esboço em uma linha.
- **Visor em tela inteira.** No passo de fotografar, a imagem ocupa a tela toda, como a seção 6.5 pede. A foto só vai para a metade de cima quando o palpite aparece.
- **Catálogo.** Ficaram as 14 peças, com pelo menos três M, duas P, duas G, uma PP e uma GG. A mistura original (três P e três G) não cabia junto com as cinco peças M que servem e os dois blazers M. Custo: menos variedade em P e G.
- **Nomes de peças.** Criei o tipo "camisa xadrez" e chamei o blazer bege de "Blazer claro", pelo que as fotos mostram. Custo: nenhum.
- **Pedido em texto.** Se o pedido traz o nome completo de um tipo ("jaqueta jeans"), só ele conta. Sinônimos valem quando nenhum nome completo aparece, e ocasiões ("entrevista", "festa") quando nem sinônimo aparece. Custo: um pedido que mistura dois tipos, um pelo nome e outro por sinônimo, acha só o primeiro.
- **Dia na frase de quem vende.** Em "entra quarta, às 20h", o dia é sempre o do próximo drop do calendário. Ensaio não conta. Custo: uma peça anunciada segundos antes de um ensaio sai nesse ensaio, embora a frase cite o dia do calendário.
- **O drop abre na tela principal.** O drop só começa para a pessoa quando a tela principal é mostrada no horário. Quem fica em outra tela o drop inteiro não vê peças saindo nem a venda. Custo: fora do roteiro, alguém parado em "Você" durante o drop não vê nada acontecer.
- **Ensaio sempre limpo.** "Ensaiar o drop agora" fecha o drop que estiver aberto e esquece o pedido anotado antes de começar. Custo: ensaiar no meio de um drop perde o pedido.
- **"Escolher uma foto" desde o início.** O atalho da galeria aparece assim que a tela de vender abre, mesmo antes de a câmera responder. Custo: um link a mais embaixo do aviso de permissão.
- **Palpite da peça de exemplo.** A peça de exemplo sempre recebe "jaqueta jeans, pouco uso". Foto da câmera ou da galeria recebe os palpites do roteiro em rodízio. Custo: dois anúncios seguidos da peça de exemplo ficam iguais.
- **Concordância.** O estado concorda com a peça no drop ("Camisa xadrez, M, usada") e "vendida" ou "vendido" segue o tipo em Você. Custo: nenhum.
- **Título da aba.** "Brechó Universitário". Custo: nenhum.
- **Cronômetro de vender.** Conta segundos inteiros para baixo do tempo real (mostra 00:19 até completar 20 s) e termina no mesmo número da frase. Custo: nenhum.

### Técnicas, sem efeito visível

- **O relógio não redesenha a tela.** O relógio interno bate cinco vezes por segundo e troca só os números que mudaram. A tela só é refeita quando muda de fase (espera, drop, fim). Custo: nenhum visível; sem isso, a foto piscaria a cada peça levada.
- **Esperas únicas** (aviso de 6 s, "Olhando…" de 1,2 s) usam temporizador próprio. O relógio de 200 ms continua sendo o único que se repete.
- **A frase do perfil é uma só**, usada na primeira vez e em Você.
- **Piso de compatibilidade.** Nada de recurso de linguagem que celular mais velho não lê, porque uma linha ilegível derruba o app inteiro.
- **Foco do teclado** volta para a palavra que a pessoa acabou de trocar.
- **`logica.js` isolado** numa função, para não colidir com nomes de `app.js`.
- **Testes.** Corrigi no plano a expressão que aceita "É sua" e "É seu".

### Sabido e deixado como está

- Leitor de tela ouve a contagem a cada segundo (região viva no `main`).
- "Combinado. Eu te acordo…" continua valendo depois do drop, até recomeçar do zero.
- Uma tela de fim deixada aberta por dias pode citar o dia errado do próximo drop.
- "Você pediu: …" aparece em toda peça que combina, e não só na primeira.
- Nada foi testado em iPhone ou Android de verdade, nem no Safari. Tudo rodou em Chromium com tela de celular, toque e câmera simulados.
- As fotos são de banco de imagens e algumas mostram marcas (Lee, Situation Control, Brootz).

## 14. Abertura e cara do Velvet (pedido do André, 10/11/2026 19:35 UTC)

O André pediu: "inclua o Velvet · Loja de roupas que temos no acervo de templates react para ser a abertura da página" e "pode utilizar aquele repo pra ser a cara da parada". O Velvet está no Artifact dele "Acervo de Templates React", pasta `apps/clothes-e-commerce-laning-page`. Esta seção substitui a seção 5 (identidade no jeito do Instinct) no que as duas divergem. A regra do drop, os fluxos e as frases da seção 6 não mudam.

### Como li o pedido

1. **Abertura.** A abertura do Velvet vira a abertura do app: tela creme, a marca "BRECHÓ" subindo letra a letra na cor do brechó sobre uma pilha de sete fotos do catálogo, contador de 000 a 100, e a tela sai para cima em cerca de 4 segundos. Um toque pula. Depois vem a capa preta, com a marca de ponta a ponta, a régua, a linha de rótulos e a frase de entrada.
2. **Cara.** O app inteiro passa a usar creme `#EBE0D9`, preto e a cor do brechó (vermelho `#FF0000` por padrão), só Inter Tight, números e códigos gigantes, botão em bloco com preenchimento que corre da esquerda, e movimento com freio longo. Quando o drop abre, uma cortina "AO VIVO" passa na cor do brechó.
3. **O que não veio.** A grade de produtos do Velvet não entrou. O André já tinha dito que não queria "mais um app todo engessado de marketplace"; a vitrine do app continua sendo o drop, uma peça por vez.

### Decisões

- **Nenhum arquivo do template foi copiado.** O visual foi reescrito em HTML, CSS e JavaScript puros dentro do app, que continua sem framework e sem etapa de build. Motivo: o acervo avisa para confirmar a licença antes de revender, e o repositório do app é público. Custo: se o André quiser o template em React de verdade, é outro trabalho.
- **A serifa saiu.** Newsreader e Inter deram lugar à Inter Tight (licença SIL OFL), embutida em `fontes/`. Custo: a cara "Instinct" (papel branco e serifa) some; ela continua no commit `4c8d1f8`, branch `drop-v2`.
- **Cores do brechó.** Vermelho (padrão), verde, rosa, azul e amarelo. A cor escolhida em Você pinta a abertura, a cortina, o carimbo "É MINHA" e o toque dos botões. Custo: quem já tinha escolhido uma cor antiga volta ao vermelho ao recomeçar do zero.
- **Primeira vez em tela escura.** A capa é preta, como a do Velvet. As telas de leitura (É seu, Você, vender depois do palpite) ficam em creme.
- **Sem movimento quando o aparelho pede.** Com "Reduzir movimento" ligado não há abertura, cortina nem entradas animadas. Custo: num celular assim o vídeo sai sem a abertura; o LEIA-ME manda desligar antes de gravar.
- **Nada espera a animação.** A abertura e a cortina saem no fim da animação, num toque ou, na falta dos dois, depois de 5 segundos.
- **"Recomeçar do zero" repete a abertura**, para a regravação começar igual à primeira tomada.

### Não verificado

- iPhone, Android, Safari, câmera e toque de verdade. Tudo rodou em Chromium com tela de celular (390×844, 360×640 e 390×664), com e sem movimento.

### Revisão independente da abertura (10/11/2026)

Aprovada, sem achado grave: dez pontos pequenos. Sete foram corrigidos (o toque do botão aparece no iPhone, o contador não mostra número negativo, a cortina "AO VIVO" não entra por cima da abertura, a barra do navegador fica creme durante a abertura, o fundo acompanha a tela ao puxar além do fim, a linha "passo / É minha" não depende de `gap`, e dois testes novos para os caminhos de saída da cortina). A licença da fonte passou a ir junto, em `fontes/OFL.txt`.

Deixado como está:

- **A cortina "AO VIVO" segura um toque por cerca de 1,7 s.** Um toque nela só a tira da frente. Deixar o toque passar reservaria uma peça que a pessoa ainda não viu. Custo: tocar de novo.
- **"AO VIVO" também passa para quem volta de outra tela com o drop já no horário.** Pela regra da seção 13, é nesse momento que o drop abre para a pessoa. Custo: a cortina pode aparecer minutos depois das 20h.
- **Antes de a fonte carregar, "BRECHÓ" pode passar uns 13 px da coluna.** Cortar o excesso cortaria o acento do Ó. Custo: só na primeira carga com internet lenta.

## 15. Take It, entrada em três passos, computador e arara (pedidos do André, 10/11/2026 à noite)

- **Nome:** Take It, escolhido pelo André entre 100 nomes em inglês (cartão, 22:16 UTC). Tradução de "leva", de "quem tocar primeiro leva".
- **Entrada:** e-mail da Unicamp, código de quatro dígitos e perfil, no estilo do template "Login fintech" do acervo. O código é simulado e a tela diz isso; o André escolheu manter assim até o vídeo (cartão, 22:33 UTC). Para ser real faltam servidor, envio de e-mail com domínio próprio e sessão (Supabase Auth é o caminho mais curto), e peças e reservas compartilhadas.
- **Computador:** o mesmo endereço abre em dois lados a partir de 900 px: palco à esquerda, painel à direita, pé embaixo do palco. No celular a ordem de leitura não muda.
- **Sempre aberto:** "vamos deixar sempre aberto também" (22:06 UTC). Leitura minha: o drop continua o evento (segunda e quarta, 20h, 10 minutos) e a arara fica aberta o tempo todo, com peças próprias, uma por vez, sem relógio e sem outros alunos levando. Passar vale só para a visita; pegar vira reserva com retirada e código, como no drop. Para chegar nela, um botão **Arara** no canto de cima à direita, com o número de peças (pedido do André, 22:42 UTC: "faz um botão de arara no canto superior direito"). O botão sai no drop, na câmera e na própria arara, e a frase da espera voltou a falar só do drop. O fim do drop e o "É seu" também apontam para a arara.
- **Publicação:** https://takeit-campus.vercel.app (Vercel) e o código em `atraquia-beep/brecho-universitario`.
