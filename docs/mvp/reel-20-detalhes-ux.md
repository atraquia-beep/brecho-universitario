# Reel "20 UI tips to send to Claude" – conclusões para o Take It

Fonte: Instagram, @murphmaxxing (Aidan Murphy), 24 s, assistido em 10/11/2026. Legenda: "20 pequenos detalhes de UX de Apple, Linear, Gmail, Stripe e Amazon que fazem um app parecer caro". O áudio não foi transcrito (sem chave Whisper); a lista e as demos aparecem na tela, então o conteúdo está completo.

## Leitura crítica
- É um reel de captação ("comente UX para receber o prompt"). Cada item tem ~1 s de demo, sem explicação. Serve como checklist, não como método.
- A lista é pensada para SaaS de desktop (Linear, Stripe). Metade não aparece num vídeo de 2–3 min de um brechó no celular.
- Critério para o Take It até 16/11: só entra o que **aparece na gravação de tela** do MVP (MG900 – Empreendedorismo, Ativi-05) ou evita um tropeço ao vivo.

## Os 20 itens e o veredito

| # | Item | O que é | Take It | Thread |
|---|------|---------|---------|--------|
| 1 | Skeleton loaders | Contorno cinza no lugar do conteúdo enquanto carrega | Sim, nas fotos da arara e do drop | UI |
| 2 | Optimistic updates | A tela muda na hora (coração 42 → "salvo") antes do servidor | Sim: "levar"/reservar reage na hora | UX |
| 3 | Command menu (⌘K) | Busca de comandos | Não (sem uso no celular) | – |
| 4 | Shortcut hints | Atalhos de teclado no menu | Não | – |
| 5 | Undo toasts | "Mensagem apagada · Desfazer" | Sim: desfazer reserva/anúncio | UX |
| 6 | Stale-while-revalidate | Mostra o dado antigo e atualiza por baixo | Não (dados são locais) | – |
| 7 | Pre-rendering | Página carrega antes do clique | Não | – |
| 8 | BlurHash placeholders | Versão borrada da foto antes da foto | Sim, junto com o 1 | UI |
| 9 | View transitions | Card cresce e vira a tela de detalhe | Sim, maior ganho visual no vídeo | UI |
| 10 | Swipe-to-dismiss sheets | Painel de baixo que se fecha arrastando | Sim: detalhe da peça / compartilhar | UI |
| 11 | Interruptible animations | Animação pode ser pega no meio pelo dedo | Sim: arrastar peça no drop | UI |
| 12 | Predictive back | Voltar mostra a tela anterior durante o gesto | Talvez (Android); baixa prioridade | UI |
| 13 | Hit slop | Área de toque maior que o ícone | Sim: botão "Arara" no topo, ícones pequenos | UX |
| 14 | Safe area insets | Conteúdo fora do notch e da barra do iPhone | Sim, obrigatório para gravar no celular | UX |
| 15 | One-time code autofill | Código do SMS/e-mail preenche sozinho | Sim: login de 4 dígitos (colar/autopreencher, teclado numérico) | UX |
| 16 | Tabular numbers | Dígitos de largura fixa | Sim: preços e contador do drop não "tremem" | UI |
| 17 | Balanced headlines | Título quebra em linhas equilibradas | Sim, uma linha de CSS | UI |
| 18 | Continuous corners | Cantos "squircle" estilo iOS | Opcional, só se combinar com a cara Velvet | UI |
| 19 | Idempotency keys | Clique duplo em "Pagar" cobra uma vez | Sim, na versão simples: toque duplo em "levar" não reserva duas vezes | UX |
| 20 | Amazon safe triangle | Menu não fecha ao mover o mouse na diagonal | Não (sem submenus) | – |

## Para a thread de UX ("Deixar o app Take It mais intuitivo")
Em ordem de impacto no vídeo:
1. **Resposta imediata ao "levar"** (2): feedback na hora + estado "é seu" sem espera.
2. **Desfazer** (5): toast "Reservado · Desfazer" e "Anúncio publicado · Desfazer". Tira o medo de tocar errado, que é o ponto de "mostrar como é fácil".
3. **Login de 4 dígitos** (15): `inputmode="numeric"`, `autocomplete="one-time-code"`, colar o código inteiro preenche as 4 caixas.
4. **Áreas de toque ≥ 44 px** (13) no botão "Arara" e nos ícones.
5. **Safe area** (14): `env(safe-area-inset-*)` no topo e na barra inferior; conferir no iPhone antes de gravar.
6. **Toque duplo** (19): botão "levar" desativa após o 1º toque.

## Para a thread de movimento/transições (UI)
1. **View transitions** (9): card da arara → detalhe da peça, com a foto crescendo. É o detalhe que mais "vende" no vídeo.
2. **Sheet que fecha arrastando** (10) para detalhe/compartilhar.
3. **Animação interrompível** (11): a peça do drop segue o dedo e volta com mola se soltar no meio; nada de animação que trava o toque.
4. **Placeholders** (1 + 8): fundo com a cor média da foto ou skeleton enquanto carrega, para o vídeo não mostrar quadrado branco.
5. **Números tabulares** (16) no relógio do drop e nos preços: `font-variant-numeric: tabular-nums`.
6. **Títulos balanceados** (17): `text-wrap: balance`.
7. Respeitar `prefers-reduced-motion` em tudo que for novo.

## Riscos
- Prazo: vídeo do MVP em 16/11 e o PICO começa em 18/11. Cada item acima deve ser pequeno; se algo não aparece na gravação, fica de fora.
- View transitions têm suporte desigual (Safari antigo): precisa de fallback sem animação.
- Não mexer na estrutura do app só para caber na lista do reel.
