# Brechó Universitário: o drop do campus

Protótipo para o vídeo do MVP (MG900, Empreendedorismo). É um site estático: HTML, CSS e JavaScript puros, sem servidor e sem instalação.

## Como abrir

- No computador: dois cliques em `index.html` (de preferência no Chrome).
- No celular: o link que acompanha a entrega.
- A câmera ao vivo só funciona em `https://` ou em `file://` no Chrome. Sem ela, o app usa a peça de exemplo (`fotos/exemplo-venda.jpg`) e o resto do fluxo é igual.

## Roteiro de gravação sugerido

É o mesmo roteiro do teste `testes/roteiro.e2e.test.js`, na mesma ordem. Anote o pedido do blazer **antes** de vender: assim a jaqueta do catálogo não aparece na hora em que a Bia leva a sua.

1. Na primeira vez, preencha a frase: nome Deco, tamanho M, vintage e street, até R$ 40, Administração e um e-mail `@dac.unicamp.br`. Toque em **Entrar**.
2. A espera mostra a contagem e "Deco, catorze peças entram juntas. Cinco são M, na sua pegada."
3. No campo de baixo, escreva "um blazer para a entrevista de quinta" e envie. Aparece "Anotado: …".
4. Toque em **vender uma peça para este drop**. O app abre na câmera e o cronômetro corre no topo.
5. Toque no botão redondo para fotografar. Depois de "Olhando…", o app sugere tipo, tamanho, estado e preço; toque em **Anunciar no drop**.
6. Aparece "No drop em N segundos. Sua jaqueta jeans entra quarta, às 20h." Toque em **Voltar**.
7. Toque em **ensaiar o drop agora**. Em 10 segundos o drop entra no ar.
8. A primeira peça é o blazer preto, com "Você pediu: um blazer para a entrevista de quinta".
9. Espere uns 5 segundos: aparece "A Bia, de Nutrição, levou sua jaqueta jeans. Entraram R$ 35 em créditos."
10. Toque em **É minha** (ou arraste a foto para a direita). A tela "É seu" mostra a retirada, o código e "Seus R$ 35 em créditos já entraram. Faltam R$ 3, pagos na hora."
11. Toque em **Voltar ao drop**. O drop acaba quando os 10 minutos passam ou quando a pilha esvazia. Para a gravação, o jeito rápido é passar as peças que restam (**passo**, ou arrastar para a esquerda) até aparecer "O drop acabou. Você ficou com uma peça." Toque em **Voltar**.
12. Na espera, toque em "Seu blazer preto espera você terça…", depois em **Já retirei** e em **ótimo**: "Obrigado. Uma peça a menos no lixo: Administração chegou a 129."
13. Toque em "Deco · R$ 0 em créditos" no topo. A área **Você** mostra a jaqueta vendida em créditos, a reserva retirada e "Seu último anúncio levou N s.". Dá para trocar a cor do brechó aqui.

## Como regravar

Em **Você**, toque em **Recomeçar do zero** e depois em **sim**. Tudo é apagado (perfil, créditos, reservas, anúncios, cor) e o app volta à primeira vez.

## Como trocar uma foto

1. Ponha o arquivo novo em `fotos/` (JPEG, de pé, com no máximo uns 1200 px no lado maior).
2. Em `dados.js`, na linha da peça dentro de `CATALOGO`, troque `foto: 'fotos/...'` pelo nome do arquivo e atualize `alt` com uma descrição curta da foto.

Os nomes de vendedores, cursos, notas e números do app são exemplos. Todos ficam em `dados.js` (`CATALOGO`, `COMPRADOR`, `CONTADOR_BASE`, `DROP.online`, `DROP.esperando`).

## O que é simulado

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

## A regra do drop

As peças entram todas juntas, segunda e quarta, às 20h, por 10 minutos. Fora disso o app é uma contagem regressiva. No drop aparece uma peça por vez: quem tocar primeiro leva. O ensaio abre um drop de verdade 10 segundos depois do toque.

Para mudar dias e horário, edite `DROP` em `dados.js`:

- `dias`: dias da semana, de 0 (domingo) a 6 (sábado). `[1, 3]` é segunda e quarta.
- `hora`: hora de início, no relógio do aparelho (`20` é 20h).
- `duracaoMs`: duração em milissegundos (`600000` são 10 minutos).
- `ensaioMs`: quanto o ensaio espera antes de abrir (`10000` são 10 segundos).

## Como rodar os testes

Precisa de Node 22 e do Playwright com o Chromium.

```
node --test --test-concurrency=2 "testes/*.test.js"
```

Um arquivo só: `node --test testes/roteiro.e2e.test.js`.

Capturas de tela das dez telas, em 360 e 390 px: `node testes/capturas.js` (grava em `capturas/`, que não vai para o git).
