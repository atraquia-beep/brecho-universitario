# Take It: o drop do campus

Protótipo do brechó digital universitário para o vídeo do MVP de MG900 – Empreendedorismo. É um site estático: HTML, CSS e JavaScript puros, sem servidor e sem instalação.

"Take It" é o nome escolhido pelo André em 10/11/2026: o "leva" de "quem tocar primeiro leva", em inglês. Se um dia mudar, veja **Como trocar o nome**.

## Como abrir

- No computador: dois cliques em `index.html` (de preferência no Chrome).
- No celular ou no computador, pelo link publicado: https://takeit-campus.vercel.app (Vercel). O endereço antigo do GitHub Pages também recebe cada versão nova.
- O mesmo endereço serve aos dois: em janela com 900 px ou mais de largura o app abre em dois lados (versão de computador); abaixo disso, na coluna do celular.
- A câmera ao vivo só funciona em `https://` ou em `file://` no Chrome. Sem ela, o app usa a peça de exemplo (`fotos/exemplo-venda.jpg`) e o resto do fluxo é igual.

## Antes de gravar

- Abra o link uma vez com internet, para as fotos e a fonte ficarem carregadas.
- A abertura ("TAKE IT" subindo sobre as fotos, com o contador até 100) roda sozinha por uns 4 segundos toda vez que a página é aberta ou recarregada. Um toque pula. Para a tomada começar por ela, recarregue a página com a gravação já rodando.
- Se o celular estiver com **Reduzir movimento** ligado (Acessibilidade), o app não mostra a abertura, a cortina "AO VIVO" nem as entradas animadas. Desligue para gravar.
- Abra **vender uma peça para este drop** uma vez e permita a câmera: assim a pergunta de permissão não cai dentro da tomada cronometrada.
- Faça uma tomada de ensaio inteira e depois, em **Você**, **Recomeçar do zero**.
- Os dias citados no roteiro ("quarta", "terça") são os de uma gravação numa terça; em outros dias eles mudam. Quando o próximo drop está a dois dias ou mais, a espera mostra os dias em vez do relógio correndo: gravando no domingo, na segunda, na terça ou na quarta (antes das 20h), o relógio corre.
- Numa tela baixa, a espera pode precisar de uma pequena rolagem.
- No computador, uma janela de 1280 × 720 mostra todas as telas do roteiro sem rolar. No drop e na arara, a seta para a esquerda passa a peça e a seta para a direita pega.

## Roteiro de gravação sugerido

É o mesmo roteiro do teste `testes/roteiro.e2e.test.js`, na mesma ordem. Anote o pedido do blazer **antes** de vender: assim a jaqueta do catálogo não aparece na hora em que a Bia leva a sua.

1. A abertura passa sozinha e cai na capa preta, com "TAKE IT" de ponta a ponta. A entrada tem três passos. **E-mail**: escreva um e-mail `@dac.unicamp.br` e toque em **Receber o código**. **Código**: digite quatro dígitos quaisquer; as células giram, se juntam e viram o visto. **Você**: preencha a frase (nome Deco, tamanho M, vintage e street, até R$ 40, Administração) e toque em **Entrar**.
2. A espera mostra a contagem, "Deco, catorze peças entram juntas. Cinco são M, na sua pegada." e, logo abaixo, "Não quer esperar? A arara fica sempre aberta, com cinco peças agora."
3. No campo de baixo, escreva "um blazer para a entrevista de quinta" e envie. Aparece "Anotado: …".
4. Toque em **vender uma peça para este drop**. O app abre na câmera e o cronômetro corre no topo.
5. Aponte a câmera para uma jaqueta jeans (o primeiro palpite é sempre "jaqueta jeans, pouco uso") e toque no botão redondo para fotografar. Com foto de verdade, o palpite muda a cada anúncio novo, a não ser que você recomece do zero; a peça de exemplo sempre ganha o palpite da jaqueta. Depois de "Olhando…", o app sugere tipo, tamanho, estado e preço; toque em **Anunciar no drop**.
6. Aparece "No drop em N segundos. Sua jaqueta jeans entra quarta, às 20h." Toque em **Voltar**.
7. Toque em **ensaiar o drop agora**. Em 10 segundos a cortina "AO VIVO" passa na cor do brechó e o drop entra no ar.
8. A primeira peça é o blazer preto, com "Você pediu: um blazer para a entrevista de quinta".
9. Espere uns 5 segundos: aparece "A Bia, de Nutrição, levou sua jaqueta jeans. Entraram R$ 35 em créditos."
10. Toque em **É minha** (ou arraste a foto para a direita). A tela "É seu" mostra a retirada, o código e "Seus R$ 35 em créditos já entraram. Faltam R$ 3, pagos na hora."
11. Toque em **Voltar ao drop**. O drop acaba quando os 10 minutos passam ou quando a pilha esvazia. Os outros alunos levam uma peça a cada 8 segundos, então a pilha também se esvazia sozinha em cerca de 1 min 45 s. Para a gravação, o jeito rápido é passar as peças que restam (**passo**, ou arrastar para a esquerda) até aparecer "O drop acabou. Você ficou com uma peça." Toque em **Voltar**.
12. Na espera, toque em "Seu blazer preto espera você terça…", depois em **Já retirei** e em **ótimo**: "Obrigado. Uma peça a menos no lixo: Administração chegou a 129."
13. Toque em "Deco · R$ 0 em créditos" no topo. A área **Você** mostra a jaqueta vendida em créditos, a reserva retirada e "Seu último anúncio levou N s.". Dá para trocar a cor do brechó aqui (vermelho, verde, rosa, azul ou amarelo): ela muda a abertura, a cortina, o carimbo "É MINHA" e o toque dos botões.

### Mostrar a arara (opcional)

A arara é a loja aberta o tempo todo: cinco peças próprias, uma por vez, como no drop, mas sem relógio e sem ninguém levando nada. Na espera, toque em **arara**. Passe a primeira peça (**passo** ou arraste para a esquerda) e pegue a segunda (**É minha**): a tela "É seu" mostra a retirada e o código, como no drop. **continuar na arara** volta para as peças que faltam. Quem passa a arara inteira vê "Você viu a arara inteira." e pode **olhar de novo**. Faça isso antes do passo 7 ou depois do passo 12; durante o drop a arara também abre, mas o roteiro fica mais limpo sem ela.

## Como regravar

Em **Você**, toque em **Recomeçar do zero** e depois em **sim**. Tudo é apagado (perfil, créditos, reservas, anúncios, cor) e o app volta à primeira vez, passando de novo pela abertura.

## Como trocar uma foto

1. Ponha o arquivo novo em `fotos/` (JPEG, de pé, com no máximo uns 1200 px no lado maior e menos de 200 KB).
2. Em `dados.js`, na linha da peça dentro de `CATALOGO`, troque `foto: 'fotos/...'` pelo nome do arquivo e atualize `alt` com uma descrição curta da foto.
3. Ponha a linha da foto (arquivo e origem) em `fotos/CREDITOS.md`. Os testes conferem o tamanho e o crédito.

Os nomes de vendedores, cursos, notas e números do app são exemplos. Todos ficam em `dados.js` (`CATALOGO`, `ARARA`, `COMPRADOR`, `CONTADOR_BASE`, `DROP.online`, `DROP.esperando`). As fotos da arara seguem as mesmas regras.

## Como trocar o nome

1. Em `dados.js`, troque `MARCA` (em maiúsculas). O tamanho das letras na capa e na abertura se ajusta sozinho ao nome novo.
2. Em `app.js`, troque a frase "Oi. O Take It é o brechó do campus de Limeira, só entre alunos."
3. Em `index.html`, troque o `<title>`.

Os testes citam o nome em três lugares (`testes/primeira-vez.e2e.test.js` e `testes/abertura.e2e.test.js`).

## A cara do app

O visual segue o template Velvet (loja de roupas) do acervo de templates: creme `#EBE0D9`, preto e vermelho, letras gigantes, botão em bloco e movimento com freio longo. A entrada em três passos segue o template "Login fintech" do mesmo acervo: tela dividida no computador e as células do código que giram, se juntam e viram o visto. Nenhum arquivo dos templates foi copiado: tudo foi reescrito em HTML, CSS e JavaScript puros, dentro de `estilo.css` e `app.js`. A fonte é a Inter Tight, embutida em `fontes/` com a licença dela (`fontes/OFL.txt`, SIL OFL 1.1).

## O que é simulado

| Parece | É |
|---|---|
| Drop com o campus inteiro | Cada aparelho roda o seu. "23 online" e "38 esperando" são números fixos |
| Outros alunos levando peças | Uma peça do fim da pilha sai a cada 8 segundos |
| Reconhecer a foto | Palpite roteirizado (o primeiro é jaqueta jeans, pouco uso), sempre editável |
| Entender o pedido | Busca por palavras-chave sobre o catálogo de exemplo |
| Outro aluno comprando a sua peça | Evento fixo 5 segundos depois de o drop começar |
| Acordar antes do drop | Só guarda a escolha |
| Código por e-mail | Nenhum e-mail é enviado e qualquer código de quatro dígitos entra (a tela do código avisa). O e-mail só passa pela checagem do final do endereço |
| Catálogo | 14 peças de exemplo no drop e 5 na arara, com vendedores fictícios |

## A regra do drop e a arara

As peças novas entram todas juntas, segunda e quarta, às 20h, por 10 minutos. No drop aparece uma peça por vez: quem tocar primeiro leva. O ensaio abre um drop de verdade 10 segundos depois do toque.

A arara fica aberta o tempo todo, com as peças de `ARARA` em `dados.js` (mesmo formato do `CATALOGO`). Uma peça passada sai só desta visita; uma peça pega vira reserva e sai de vez.

Para mudar dias e horário, edite `DROP` em `dados.js`:

- `dias`: dias da semana, de 0 (domingo) a 6 (sábado), com pelo menos um dia. `[1, 3]` é segunda e quarta.
- `hora`: hora de início, no relógio do aparelho (`20` é 20h).
- `duracaoMs`: duração em milissegundos (`600000` são 10 minutos).
- `ensaioMs`: quanto o ensaio espera antes de abrir (`10000` são 10 segundos).

## Como rodar os testes

Precisa de Node 22 e do Playwright com o Chromium.

```
node --test --test-concurrency=2 "testes/*.test.js"
```

Um arquivo só: `node --test testes/roteiro.e2e.test.js`.

Capturas de tela das telas principais, no celular (360 e 390 px) e no computador (1280 × 720): `node testes/capturas.js` (grava em `capturas/`, que não vai para o git).
