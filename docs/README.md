# Take It: material para o vídeo explicativo

O app está na raiz deste repositório e no ar em https://takeit-campus.vercel.app. Esta pasta guarda as gravações, o desenho e a história de como ele chegou à versão de hoje.

## O Take It em três frases

- É o brechó do campus de Limeira, só entre alunos.
- As peças novas entram todas juntas no drop (segunda e quarta, 20h, por 10 minutos), uma por vez, e quem tocar primeiro em "É minha" leva. A arara fica sempre aberta, com uma peça por vez e sem relógio.
- Vender começa pela câmera, e a retirada é no campus, terça ou quinta, das 12h às 13h.

## Onde está cada coisa

| Pasta | O que tem | Serve para |
|---|---|---|
| `video/` | O roteiro do LEIA-ME gravado com todas as transições, no celular (390 × 844) e no computador (1280 × 720), cerca de 1 min 45 s cada. Também tem as folhas de contato, com 4 quadros de cada passagem. | Imagem pronta do app em uso |
| `movimento/` | `decisoes-que-tomei.md`, com as 43 escolhas de movimento e o motivo de cada uma. Também tem o teste das 3 versões da passagem da espera para a arara e a prévia do ícone. | Explicar por que cada transição é assim |
| `clareza/` | O antes e depois das telas, as 3 versões do início e a versão escolhida (vitrine primeiro). | Mostrar a evolução |
| `mvp/` | O primeiro esboço, as telas no ar e o protótipo de 5 telas. Também tem o plano do MVP (com o primeiro roteiro de vídeo), os 100 nomes que viraram "Take It" e a referência de UX. | Contar de onde veio |
| `referencia/` | As identidades v1 e v2, os caminhos de desenho e a cara antiga (Instinct). | Bastidores do visual |
| `superpowers/specs/` | O desenho de cada etapa (app, clareza e movimento), com o porquê de cada escolha. | Base do roteiro |
| `superpowers/plans/` | Os planos de construção, passo a passo. | Detalhe técnico |

## Regravar as imagens do app

Rode na raiz do repositório, com o Playwright (Chromium) e o ffmpeg instalados:

```
node docs/video/gravar-movimento.js .
```

O script grava o roteiro do LEIA-ME com o relógio dos testes (terça, 9h) e com a pessoa de teste (Deco). Ele substitui os MP4 e as folhas de contato desta pasta. Para gravar em outro tamanho de tela, mude `TELAS` no começo do script.
