// ---------- Estado e armazenamento ----------
const CHAVE = 'brecho.v2';

function carregar() {
  const inicial = Logica.estadoInicial();
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (!salvo || typeof salvo !== 'object' || Array.isArray(salvo)) return inicial;
    const junto = { ...inicial, ...salvo };
    // na dúvida (listas que viraram outra coisa, perfil quebrado), recomeça do zero
    if (Object.keys(inicial).some(k => Array.isArray(inicial[k]) !== Array.isArray(junto[k]))) return inicial;
    if (typeof junto.creditos !== 'number' || !Array.isArray(junto.reservas) || !Array.isArray(junto.anuncios)) return inicial;
    const pf = junto.perfil;
    if (pf !== null && (typeof pf !== 'object' || typeof pf.nome !== 'string' || !Array.isArray(pf.pegadas))) return inicial;
    if (!DADOS.CORES.some(c => c.hex === junto.realce)) junto.realce = inicial.realce;
    return junto;
  } catch (e) { return inicial; }
}

let estado = carregar();

// a cor escolhida vale nas duas luzes: no escuro, o mesmo tom a 26% (sem color-mix, R7)
function aplicarRealce() {
  const h = estado.realce, s = document.documentElement.style;
  s.setProperty('--realce', h);
  s.setProperty('--realce-escuro', 'rgba(' + [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)).join(', ') + ', .26)');
}

function atualizarConta() {
  const conta = document.getElementById('conta');
  conta.hidden = !estado.perfil || !!venda; // em #/vender o cronômetro ocupa o lugar
  conta.textContent = estado.perfil ? estado.perfil.nome + ' · ' + Logica.dinheiro(estado.creditos) + ' em créditos' : '';
}

// troca o estado e grava, sem reconstruir a tela (o tique usa esta)
function guardar(novoEstado) {
  estado = novoEstado;
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* sem armazenamento: segue em memória */ }
  atualizarConta();
}

// ação da pessoa: guarda e redesenha
function mudar(novoEstado) { guardar(novoEstado); desenhar(); }

// ---------- Ajudantes de DOM ----------
function paragrafo(classe, partes) {
  const p = document.createElement('p');
  p.className = classe;
  partes.forEach(x => p.appendChild(typeof x === 'string' ? document.createTextNode(x) : x));
  return p;
}
const frase = (...partes) => paragrafo('frase', partes);
const apoio = (...partes) => paragrafo('apoio', partes);

let aberta = null;           // { botao, lista } da palavra com opções abertas
let rotuloParaFocar = null;  // rótulo da palavra que recebe o foco depois de redesenhar

function fechar() {
  if (!aberta) return;
  aberta.botao.setAttribute('aria-expanded', 'false');
  aberta.lista.remove();
  aberta = null;
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && aberta) { const b = aberta.botao; fechar(); b.focus(); }
});

// atuais: opções marcadas (padrão: o próprio texto). ate: 1 escolhe e fecha; 2 liga e desliga até duas.
function palavra(texto, rotulo, opcoes, aoEscolher, { ate = 1, atuais = [texto] } = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'palavra';
  b.textContent = texto;
  const nomear = () => b.setAttribute('aria-label', rotulo + ': ' + b.textContent);
  nomear();
  b.setAttribute('aria-expanded', 'false');
  atuais = atuais.slice();
  b.addEventListener('click', () => {
    const estavaAberta = aberta && aberta.botao === b;
    fechar();
    if (estavaAberta) return;
    const lista = document.createElement('div');
    lista.className = 'opcoes';
    const marcar = () => lista.querySelectorAll('button[data-o]').forEach(o => {
      o.setAttribute(ate > 1 ? 'aria-pressed' : 'aria-current', String(atuais.includes(o.textContent)));
    });
    opcoes.forEach(op => {
      const o = document.createElement('button');
      o.type = 'button';
      o.className = 'palavra';
      o.dataset.o = '1';
      o.textContent = op;
      o.addEventListener('click', () => {
        if (ate === 1) {
          rotuloParaFocar = rotulo;
          aoEscolher(op);
          rotuloParaFocar = null;
          if (b.isConnected) { fechar(); b.focus(); }
          return;
        }
        if (atuais.includes(op)) { if (atuais.length > 1) atuais.splice(atuais.indexOf(op), 1); }
        else { atuais.push(op); if (atuais.length > ate) atuais.shift(); }
        b.textContent = atuais.join(' e ');
        nomear();
        marcar();
        aoEscolher(atuais.slice());
      });
      lista.appendChild(o);
    });
    if (ate > 1) {
      const pronto = document.createElement('button');
      pronto.type = 'button';
      pronto.className = 'palavra';
      pronto.textContent = 'pronto';
      pronto.addEventListener('click', () => { fechar(); b.focus(); });
      lista.appendChild(pronto);
    }
    marcar();
    b.closest('p').after(lista);
    b.setAttribute('aria-expanded', 'true');
    aberta = { botao: b, lista };
  });
  return b;
}

// campo com cara de palavra sublinhada; digitar nunca reconstrói a tela
function campo(valor, rotulo, placeholder, aoMudar, tipo = 'text') {
  const c = document.createElement('input');
  c.className = 'campo';
  c.type = tipo;
  c.value = valor;
  c.placeholder = placeholder;
  c.setAttribute('aria-label', rotulo);
  c.autocomplete = 'off';
  c.setAttribute('autocapitalize', tipo === 'email' ? 'none' : 'words');
  c.spellcheck = false;
  if (tipo === 'email') c.inputMode = 'email';
  // largura real do texto, na fonte do campo; no máximo a largura da linha (max-width no CSS)
  const ctx = document.createElement('canvas').getContext('2d');
  const medir = () => {
    const css = getComputedStyle(c);
    ctx.font = css.fontStyle + ' ' + css.fontWeight + ' ' + css.fontSize + ' ' + css.fontFamily;
    c.style.width = Math.ceil(ctx.measureText(c.value || placeholder).width) + 3 + 'px';
  };
  c.addEventListener('input', () => { medir(); aoMudar(c.value); });
  document.fonts.ready.then(medir);
  return c;
}

function principal(texto, aoTocar) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'principal';
  b.textContent = texto;
  b.addEventListener('click', aoTocar);
  return b;
}

// ---------- Telas ----------
const textoDoTeto = t => t === null ? 'sem teto' : 'até ' + Logica.dinheiro(t);

// As duas frases do perfil. aoMudar(campo, valor) decide se redesenha; a tela de Você grava a cada troca.
function frasesDoPerfil(perfil, aoMudar) {
  const tetos = DADOS.TETOS.map(textoDoTeto);
  const f2 = frase(
    'Eu sou ', campo(perfil.nome, 'Seu nome', 'Seu nome', v => aoMudar('nome', v)),
    ', visto ', palavra(perfil.tamanho, 'Tamanho', DADOS.TAMANHOS, v => aoMudar('tamanho', v)),
    ', gosto de ', palavra(perfil.pegadas.join(' e '), 'Pegada', DADOS.PEGADAS, v => aoMudar('pegadas', v), { ate: 2, atuais: perfil.pegadas }),
    ' e gasto ', palavra(textoDoTeto(perfil.teto), 'Teto', tetos, v => aoMudar('teto', DADOS.TETOS[tetos.indexOf(v)])),
    ' numa peça. Estudo ', palavra(perfil.curso, 'Curso', DADOS.CURSOS, v => aoMudar('curso', v)), '.');
  const f3 = frase('Meu e-mail da Unicamp é ', campo(perfil.email, 'Seu e-mail da Unicamp', 'Seu e-mail da Unicamp', v => aoMudar('email', v), 'email'), '.');
  return [f2, f3];
}

const perfilPadrao = () => ({ ...DADOS.PERFIL_PADRAO, pegadas: DADOS.PERFIL_PADRAO.pegadas.slice() });
let rascunho = perfilPadrao();

function primeiraVez() {
  const aviso = frase('');
  aviso.hidden = true;
  const dizer = texto => { aviso.textContent = texto; aviso.hidden = false; };
  const campoDe = rotulo => document.querySelector('input[aria-label="' + rotulo + '"]');
  const entrar = () => {
    const nome = rascunho.nome.trim(), email = rascunho.email.trim();
    if (!nome) { dizer('Como eu te chamo?'); campoDe('Seu nome').focus(); return; }
    if (!Logica.emailValido(email)) { dizer('Preciso de um e-mail da Unicamp para deixar você entrar.'); campoDe('Seu e-mail da Unicamp').focus(); return; }
    mudar({ ...estado, perfil: { ...rascunho, nome, email } });
  };
  const aoMudar = (chave, valor) => {
    rascunho[chave] = valor;
    // digitar e ligar/desligar pegadas atualizam no lugar; o resto reconstrói a tela
    if (!['nome', 'email', 'pegadas'].includes(chave)) desenhar();
  };
  const frases = frasesDoPerfil(rascunho, aoMudar);
  frases.forEach(f => f.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); })));
  return [
    frase('Oi. Este é o brechó do campus de Limeira, só entre alunos.'),
    ...frases, aviso,
    principal('Entrar', entrar),
    apoio('Toque numa palavra sublinhada para mudar. Dá para trocar tudo depois.'),
  ];
}

let ultimaTela = null;      // tela principal desenhada por último (o tique compara com ela)
let naoEntendi = false;     // mostra a frase de "não entendi" só no próximo desenho

const rotaAtual = () => location.hash.replace(/^#\/?/, '').split('/')[0];

// o texto vem da pessoa: sempre textContent
function botaoPalavra(texto, aoTocar) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'palavra';
  b.textContent = texto;
  b.addEventListener('click', aoTocar);
  return b;
}

const pilhaAtual = () => Logica.ordenarPilha(DADOS.CATALOGO, estado.perfil, estado.pedido, Logica.foraDaPilha(estado));
const feminina = peca => DADOS.TIPOS[peca.tipo].genero === 'f';
const pecaPorId = id => DADOS.CATALOGO.find(p => p.id === id);

// nós que ficam acima do rótulo: reservas por retirar, "não entendi" e o pedido anotado
function avisosDaEspera() {
  const nos = [];
  estado.reservas.filter(r => !r.retirada).forEach(r => {
    const peca = pecaPorId(r.pecaId);
    if (!peca) return;
    nos.push(apoio(Object.assign(document.createElement('a'), {
      className: 'palavra', href: '#/sua/' + peca.id,
      textContent: (feminina(peca) ? 'Sua ' : 'Seu ') + peca.nome.toLowerCase() + ' espera você ' + r.janela + '. Código ' + r.codigo + '.',
    })));
  });
  if (naoEntendi) {
    nos.push(apoio('Não entendi que peça você procura. Tente algo como "um blazer para a entrevista".'));
    naoEntendi = false;
  }
  if (estado.pedido) {
    nos.push(apoio('Anotado: "' + estado.pedido + '". O que combinar com isso abre a sua pilha no próximo drop. ',
      botaoPalavra('esquecer', () => { mudar(Logica.esquecerPedido(estado)); document.getElementById('rotulo').focus(); })));
  }
  return nos;
}

const maiuscula = t => t.charAt(0).toUpperCase() + t.slice(1);
const focavel = el => { el.tabIndex = -1; return el; };

// os dois "ensaiar o drop agora": fecha o drop que ainda não foi fechado (no ar ou no fim) e ensaia
function ensaiarAgora() {
  guardar(Logica.ensaiar(estado.drop && !estado.drop.fechado ? Logica.fecharDrop(estado) : estado, Date.now()));
  if (rotaAtual() !== '') { location.hash = '#/'; return; }
  desenhar();
  const rotulo = document.getElementById('rotulo');
  if (rotulo) rotulo.focus();
}

function telaEspera(sit) {
  const perfil = estado.perfil;
  const pilha = pilhaAtual();
  const servem = pilha.filter(p => Logica.serve(p, perfil)).length;
  const total = pilha.length;
  const tamanho = Object.assign(document.createElement('a'), { className: 'palavra', href: '#/voce', textContent: perfil.tamanho });
  const rotulo = focavel(apoio(sit.ensaio ? 'Ensaio do drop' : 'Próximo drop · ' + Logica.diaDaSemana(sit.inicio) + ', ' + DADOS.DROP.hora + 'h'));
  rotulo.id = 'rotulo';
  rotulo.classList.add('lab');
  const contagem = document.createElement('p');
  contagem.id = 'contagem';
  contagem.className = 'contagem';
  contagem.textContent = Logica.contagem(sit.faltaMs);
  const entram = perfil.nome + ', ' + (total === 1 ? 'uma peça entra sozinha' : Logica.extenso(total, 'f') + ' peças entram juntas') + '.';
  const fraseTamanho = servem === 0
    ? frase(entram + ' Nenhuma é ', tamanho, ' na sua pegada desta vez, mas vale olhar.')
    : frase(entram + ' ' + maiuscula(Logica.extenso(servem, 'f')) + (servem === 1 ? ' é ' : ' são '), tamanho, ', na sua pegada.');
  const fotos = document.createElement('div');
  fotos.className = 'teaser';
  pilha.slice(0, 3).forEach(p => {
    const img = document.createElement('img');
    img.src = p.foto;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    fotos.appendChild(img);
  });
  const legenda = document.createElement('span');
  legenda.textContent = 'só abre na hora';
  fotos.appendChild(legenda);
  let acordar;
  if (estado.acordar) {
    acordar = focavel(frase('Combinado. Eu te acordo cinco minutos antes.'));
    acordar.id = 'combinado';
  } else {
    acordar = principal('Me acorde cinco minutos antes', () => { mudar(Logica.pedirParaAcordar(estado)); document.getElementById('combinado').focus(); });
  }
  acordar.classList.add('final');
  const vender = Object.assign(document.createElement('a'), { className: 'palavra', href: '#/vender', textContent: 'vender uma peça para este drop' });
  const ensaiar = botaoPalavra('ensaiar o drop agora', ensaiarAgora);
  return [...avisosDaEspera(), rotulo, contagem, fraseTamanho, frase('Cada peça é única. Quem tocar primeiro leva.'), fotos, acordar,
    apoio(DADOS.DROP.esperando + ' alunos esperando · ', vender, ' · ', ensaiar)];
}

// ---------- Drop no ar ----------
let pecaNaTela = null;   // a peça que "passo" e "É minha" tratam
let avisoTimer = null;

const placarTexto = () => { const p = Logica.placar(estado, DADOS.CATALOGO); return p.foram + ' de ' + p.total + ' já foram'; };
// a linha de apoio da peça; muda quando os créditos passam a cobri-la
const sobrePeca = peca => { const v = peca.vendedor; return v.nome + ', ' + v.curso + ' · nota ' + v.nota.toFixed(1).replace('.', ',')
  + (Logica.serve(peca, estado.perfil) ? ' · serve em você' : '') + (estado.creditos >= peca.preco ? ' · sai de graça com seus créditos' : ''); };

// Só visual: um fantasma da foto sai girando para o lado; o estado e a tela já mudaram por baixo.
function fantasma(lado) {
  const foto = document.querySelector('#drop .foto'), img = document.getElementById('peca');
  if (!foto || !img || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = foto.getBoundingClientRect();
  // a camada recorta o fantasma: ele nunca alarga a página
  const camada = el('div', { className: 'camada-fantasma' });
  camada.setAttribute('aria-hidden', 'true');
  const f = el('img', { src: img.src, alt: '', className: 'fantasma ' + lado });
  Object.assign(f.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', transform: img.parentNode.style.transform });
  ['animationend', 'animationcancel'].forEach(t => f.addEventListener(t, () => camada.remove()));
  camada.appendChild(f);
  document.body.appendChild(camada);
}

// Toda saída de peça passa por aqui.
function passarPeca() {
  fantasma('esquerda');
  const comFoco = document.activeElement && document.activeElement.id === 'passo';
  mudar(Logica.passar(estado, pecaNaTela.id));
  const passo = document.getElementById('passo');
  if (comFoco && passo) passo.focus();
}
function pegarPeca() {
  const peca = pecaNaTela;
  fantasma('direita');
  // reservar devolve o mesmo estado se a peça já é sua: o toque duplo não cria outra reserva
  guardar(Logica.reservar(estado, peca, Logica.janelasDeRetirada(new Date())[0], Logica.gerarCodigo(), estado.drop.inicio));
  location.hash = '#/sua/' + peca.id;
}

// mostra um nó sobre a foto por 6 segundos (a Task 9 usa)
function avisoNoDrop(no) {
  const aviso = document.getElementById('aviso');
  if (!aviso) return;
  clearTimeout(avisoTimer);
  aviso.textContent = '';
  aviso.appendChild(no);
  aviso.hidden = false;
  avisoTimer = setTimeout(() => { aviso.hidden = true; }, 6000);
}

// a foto acompanha o dedo; 80 px ou mais age, menos volta ao lugar
function arrastavel(cartao, carimbo) {
  let x0 = null;
  const mostrar = dx => {
    cartao.style.transform = dx ? 'translateX(' + dx + 'px) rotate(' + dx / 18 + 'deg)' : '';
    carimbo.hidden = Math.abs(dx) < 24;
    carimbo.className = 'carimbo ' + (dx > 0 ? 'direita' : 'esquerda');
    carimbo.textContent = dx > 0 ? 'é minha' : 'passo';
  };
  cartao.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    x0 = e.clientX;
    cartao.setPointerCapture(e.pointerId);
    cartao.classList.add('arrastando');
  });
  cartao.addEventListener('pointermove', e => { if (x0 !== null) mostrar(e.clientX - x0); });
  const soltar = (e, vale) => {
    if (x0 === null) return;
    const dx = vale ? e.clientX - x0 : 0;
    x0 = null;
    cartao.classList.remove('arrastando');
    if (dx >= 80) pegarPeca();
    else if (dx <= -80) passarPeca();
    else mostrar(0);
  };
  cartao.addEventListener('pointerup', e => soltar(e, true));
  cartao.addEventListener('pointercancel', e => soltar(e, false));
}

function el(tag, props) { return Object.assign(document.createElement(tag), props); }

function telaNoAr(sit) {
  const pilha = pilhaAtual(), peca = pilha[0], perfil = estado.perfil;
  pecaNaTela = peca;
  if (pilha[1]) new Image().src = pilha[1].foto; // a próxima já chega carregada
  const img = el('img', { id: 'peca', src: peca.foto, alt: peca.alt, draggable: false });
  const carimbo = el('span', { className: 'carimbo', hidden: true });
  carimbo.setAttribute('aria-hidden', 'true');
  const cartao = el('div', { className: 'cartao' });
  cartao.append(img, carimbo);
  arrastavel(cartao, carimbo);
  const pilulas = el('div', { className: 'pilulas' });
  pilulas.append(el('span', { id: 'resta', className: 'pilula', textContent: 'AO VIVO · ' + Logica.relogio(sit.faltaMs) }),
    el('span', { className: 'pilula', textContent: DADOS.DROP.online + ' online' }));
  const foto = el('div', { className: 'foto' });
  foto.append(cartao, pilulas);

  const linhas = [frase(peca.nome + ', ' + peca.tamanho + ', ' + peca.estado + '. ' + Logica.dinheiro(peca.preco) + '.'),
    el('p', { id: 'sobre', className: 'apoio', textContent: sobrePeca(peca) })];
  if (estado.pedido && Logica.buscar([peca], Logica.entenderPedido(estado.pedido, perfil), []).length) {
    linhas.push(apoio('Você pediu: ' + estado.pedido)); // texto da pessoa: só textContent
  }
  const aviso = el('div', { id: 'aviso', hidden: true });
  aviso.setAttribute('aria-live', 'polite');
  const passo = botaoPalavra('passo', passarPeca);
  passo.id = 'passo';
  const acoes = el('div', { className: 'acoes' });
  acoes.append(passo, principal('É minha', pegarPeca));
  const barra = el('div', { id: 'barra', className: 'barra' });
  barra.setAttribute('aria-hidden', 'true');
  const pl = Logica.placar(estado, DADOS.CATALOGO);
  for (let i = 0; i < pl.total; i++) barra.appendChild(el('i', { className: i < pl.foram ? 'f' : '' }));
  const folha = el('div', { className: 'folha' });
  folha.append(...linhas, aviso, acoes, barra, apoio(el('span', { id: 'placar', textContent: placarTexto() })));

  const drop = el('section', { id: 'drop' });
  drop.setAttribute('aria-label', 'Drop no ar');
  drop.append(foto, folha);
  return [drop];
}

function telaFim() {
  const n = estado.reservas.filter(r => r.drop === estado.drop.inicio).length;
  const proximo = Logica.dropDoCalendario(estado.drop.inicio + DADOS.DROP.duracaoMs);
  return [
    frase('O drop acabou. ' + (n ? 'Você ficou com ' + Logica.extenso(n, 'f') + (n === 1 ? ' peça.' : ' peças.') : 'Você não pegou nada desta vez.')),
    frase('Próximo drop: ' + Logica.diaDaSemana(proximo) + ', ' + DADOS.DROP.hora + 'h.'),
    principal('Voltar', () => mudar(Logica.fecharDrop(estado))),
  ];
}

function telaPrincipal() {
  let sit = Logica.situacao(estado, Date.now());
  if (sit.tela === 'no-ar') {
    guardar(Logica.abrirDrop(estado, sit.inicio));
    // depois do último "passo" o relógio pode não ter andado: a pilha vazia encerra aqui
    if (!pilhaAtual().length) { guardar(Logica.terminarDrop(estado)); sit = Logica.situacao(estado, Date.now()); }
  }
  ultimaTela = sit.tela;
  if (sit.tela === 'no-ar') return telaNoAr(sit);
  if (sit.tela === 'espera') return telaEspera(sit);
  return telaFim();
}

// ---------- É sua ----------
let comoFoi = null; // id da peça cuja pergunta "Como foi" está aberta; zera ao trocar de rota

function telaSua() {
  const id = location.hash.split('/')[2];
  const r = estado.reservas.find(x => x.pecaId === id), peca = r && pecaPorId(id);
  if (!peca) return false;
  const v = peca.vendedor, voltar = () => { location.hash = '#/'; };
  if (r.retirada) {
    const curso = estado.perfil.curso === 'outro curso' ? 'Seu curso' : estado.perfil.curso;
    return [focavel(frase('Obrigado. Uma peça a menos no lixo: ' + curso + ' chegou a ' + Logica.contadorDoCurso(estado) + '.')), principal('Voltar', voltar)];
  }
  if (comoFoi === id) {
    const notas = ['ótimo', 'ok', 'ruim'].map(n => botaoPalavra(n, () => mudar(Logica.confirmarRetirada(estado, id, n))));
    const pergunta = focavel(frase('Como foi com ' + v.artigo + ' ' + v.nome + '?'));
    pergunta.id = 'como-foi';
    return [pergunta, frase(notas[0], ', ', notas[1], ' ou ', notas[2], '.')];
  }
  const f = feminina(peca);
  const janela = palavra(r.janela, 'Retirada', Logica.janelasDeRetirada(new Date()), j => mudar(Logica.trocarJanela(estado, id, j)));
  const codigo = el('p', { className: 'codigo', textContent: r.codigo });
  const pagamento = r.creditosUsados === 0 ? 'Você paga ' + Logica.dinheiro(r.aPagar) + ' na hora, em Pix ou dinheiro.'
    : r.aPagar === 0 ? 'Seus créditos pagaram tudo.'
    : 'Seus ' + Logica.dinheiro(r.creditosUsados) + ' em créditos já entraram. Faltam ' + Logica.dinheiro(r.aPagar) + ', pagos na hora.';
  const noAr = Logica.situacao(estado, Date.now()).tela === 'no-ar';
  const acao = noAr ? principal('Voltar ao drop', voltar)
    : principal('Já retirei', () => { comoFoi = id; desenhar(); document.getElementById('como-foi').focus(); });
  const cancelar = botaoPalavra('Cancelar a reserva', () => { guardar(Logica.cancelarReserva(estado, id)); voltar(); });
  const fundo = apoio('Mudou de ideia? ', cancelar, '.');
  fundo.classList.add('final');
  return [
    frase((f ? 'É sua. A ' : 'É seu. O ') + peca.nome.toLowerCase() + ' d' + v.artigo + ' ' + v.nome + ' espera você ', janela, ', no ponto da FCA. Mostre este código:'),
    codigo, frase(pagamento), acao, fundo,
  ];
}

// ---------- Vender pela câmera ----------
// o fluxo de #/vender; nulo fora da rota. passo: visor, olhando, palpite ou publicado.
let venda = null;
const EXEMPLO = 'fotos/exemplo-venda.jpg';

const tempoDaVenda = () => Logica.relogio((venda.fim || Date.now()) - venda.entrada);

function pararCamera(v) {
  if (v.stream) v.stream.getTracks().forEach(t => t.stop());
  v.stream = null;
  v.video = null;
}

// a única saída da rota: para a câmera, o "Olhando…" e o cronômetro
function sairDaVenda() {
  clearTimeout(venda.timer);
  pararCamera(venda);
  venda = null;
  document.getElementById('cronometro').remove();
  atualizarConta();
}

function iniciarVenda() {
  const p = DADOS.PALPITES[estado.anuncios.length % DADOS.PALPITES.length];
  const v = venda = { passo: 'visor', entrada: Date.now(), fim: null, camera: null, stream: null, video: null, foto: null, erro: false, timer: null,
    anuncio: { tipo: p.tipo, tamanho: estado.perfil.tamanho, estado: p.estado, preco: Logica.sugerirPreco(p.tipo, p.estado).sugerido, receber: 'creditos' } };
  document.querySelector('.topo').appendChild(el('span', { id: 'cronometro', className: 'pilula', textContent: tempoDaVenda() }));
  atualizarConta();
  const md = navigator.mediaDevices; // não existe em origem insegura
  (md && md.getUserMedia ? md.getUserMedia({ video: { facingMode: 'environment' } }) : Promise.reject()).then(stream => {
    // chegou tarde: a pessoa saiu ou já escolheu uma foto
    if (venda !== v || v.passo !== 'visor') { stream.getTracks().forEach(t => t.stop()); return; }
    v.stream = stream;
    v.camera = true;
    v.video = el('video', { id: 'visor', srcObject: stream, muted: true });
    ['autoplay', 'playsinline', 'muted'].forEach(a => v.video.setAttribute(a, '')); // o iPhone exige os três
    desenhar();
  }, () => { if (venda === v) { v.camera = false; desenhar(); } });
}

// no máximo 600 px no lado maior, em JPEG
function reduzir(fonte, w, h) {
  const k = Math.min(1, 600 / Math.max(w, h));
  const c = el('canvas', { width: Math.round(w * k), height: Math.round(h * k) });
  c.getContext('2d').drawImage(fonte, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.7);
}

function fotografou(foto) {
  const v = venda;
  pararCamera(v);
  v.foto = foto;
  v.passo = 'olhando';
  desenhar();
  v.timer = setTimeout(() => { v.passo = 'palpite'; desenhar(); }, 1200);
}

function disparar() {
  const v = venda;
  if (v.passo !== 'visor') return; // toque repetido não tira segunda foto
  if (!v.camera) { fotografou(EXEMPLO); return; } // em file:// o canvas da peça de exemplo ficaria bloqueado
  if (v.video.videoWidth) fotografou(reduzir(v.video, v.video.videoWidth, v.video.videoHeight));
}

function abrirFoto(arquivo) {
  if (!arquivo) return;
  const v = venda, img = new Image(), url = URL.createObjectURL(arquivo);
  const vale = () => { URL.revokeObjectURL(url); return venda === v && v.passo === 'visor'; };
  img.onload = () => { if (vale()) fotografou(reduzir(img, img.naturalWidth, img.naturalHeight)); };
  img.onerror = () => { if (vale()) { v.erro = true; desenhar(); } };
  img.src = url;
}

function anunciarVenda() {
  const v = venda;
  if (v.passo !== 'palpite') return; // toque repetido não cria segundo anúncio
  const a = v.anuncio, agora = Date.now(), s = Math.floor((agora - v.entrada) / 1000);
  // o próximo drop do calendário que ainda não começou (ensaio ou drop no ar não contam)
  let dia = Logica.dropDoCalendario(agora);
  if (dia <= agora) dia = Logica.dropDoCalendario(dia + DADOS.DROP.duracaoMs);
  v.fim = v.entrada + s * 1000; // relogio arredonda para cima: o cronômetro para no mesmo número da frase
  v.passo = 'publicado';
  v.publicado = 'No drop em ' + (s === 1 ? '1 segundo' : s + ' segundos') + '. ' + (feminina(a) ? 'Sua ' : 'Seu ') + a.tipo
    + ' entra ' + Logica.diaDaSemana(dia) + ', às ' + DADOS.DROP.hora + 'h.';
  trocarTexto('cronometro', tempoDaVenda());
  mudar(Logica.anunciar(estado, { ...a, foto: v.foto }, s, agora));
}

function telaVender() {
  if (!venda) iniciarVenda();
  const v = venda, a = v.anuncio, din = Logica.dinheiro;
  // no visor e no "Olhando…" a imagem ocupa a tela inteira, com o texto por cima, embaixo
  const visor = el('div', { className: 'foto visor' + (v.passo === 'visor' || v.passo === 'olhando' ? ' cheio' : '') });
  const rodape = el('div', { className: 'rodape' });
  if (v.passo === 'visor') {
    if (v.camera === null) return [visor]; // nada de botões antes de o visor estar decidido
    visor.appendChild(v.camera ? v.video : el('img', { id: 'visor', src: EXEMPLO, alt: 'Peça de exemplo: jaqueta jeans num cabide' }));
    ['sup esq', 'sup dir', 'inf esq', 'inf dir'].forEach(c => visor.appendChild(el('i', { className: 'canto ' + c })));
    const disparo = el('button', { type: 'button', id: 'disparo', className: 'disparo' });
    disparo.setAttribute('aria-label', 'Fotografar');
    disparo.addEventListener('click', disparar);
    const entrada = el('input', { type: 'file', id: 'foto-entrada', accept: 'image/*', hidden: true });
    entrada.addEventListener('change', () => abrirFoto(entrada.files[0]));
    // redesenhar tira o vídeo da página, o que o pausa
    if (v.video) Promise.resolve().then(() => { const p = v.video && v.video.play(); if (p) p.catch(() => {}); });
    rodape.append(disparo,
      ...(v.camera ? [] : [apoio('Sem câmera aqui: usei uma peça de exemplo.')]),
      ...(v.erro ? [apoio('Não consegui abrir essa foto. Tente outra ou use a peça de exemplo.')] : []),
      apoio(botaoPalavra('escolher uma foto', () => entrada.click()), entrada));
    visor.appendChild(rodape);
    return [visor];
  }
  visor.appendChild(el('img', { id: 'visor', src: v.foto, alt: 'A foto da sua peça' }));
  if (v.passo === 'olhando') { rodape.appendChild(frase('Olhando…')); visor.appendChild(rodape); return [visor]; }
  const etiquetas = el('div', { className: 'etiquetas' });
  etiquetas.append(el('span', { className: 'etiqueta', textContent: a.tipo + ' · ' + a.tamanho + ' · ' + a.estado }),
    el('span', { className: 'etiqueta grande', textContent: din(a.preco) }));
  visor.appendChild(etiquetas);
  if (v.passo === 'publicado') return [visor, frase(v.publicado), principal('Voltar', () => { location.hash = '#/'; })];
  const faixa = Logica.sugerirPreco(a.tipo, a.estado);
  const precos = [-10, -5, 0, 5, 10].map(d => faixa.sugerido + d).filter(p => p >= 5);
  const valor = Logica.valorVenda(a.preco);
  const receber = r => r === 'pix' ? din(valor.pix) + ' no Pix' : din(valor.creditos) + ' em créditos';
  const trocar = mudanca => { Object.assign(a, mudanca); desenhar(); };
  // tipo e estado refazem a faixa e voltam o preço ao sugerido
  const refazer = mudanca => { Object.assign(a, mudanca); trocar({ preco: Logica.sugerirPreco(a.tipo, a.estado).sugerido }); };
  return [visor,
    frase('Parece ' + DADOS.TIPOS[a.tipo].artigo + ' ', palavra(a.tipo, 'Tipo', Object.keys(DADOS.TIPOS), t => refazer({ tipo: t })),
      ', tamanho ', palavra(a.tamanho, 'Tamanho', DADOS.TAMANHOS, t => trocar({ tamanho: t })),
      ', ', palavra(a.estado, 'Estado', DADOS.ESTADOS, e => refazer({ estado: e })),
      '. No campus, peças assim saem por ' + din(faixa.min) + ' a ' + din(faixa.max) + '. Eu anunciaria por ',
      palavra(din(a.preco), 'Preço', precos.map(din), p => trocar({ preco: precos[precos.map(din).indexOf(p)] })), '.'),
    frase('Vendendo, prefiro ', palavra(receber(a.receber), 'Receber', [receber('creditos'), receber('pix')],
      r => trocar({ receber: r === receber('pix') ? 'pix' : 'creditos' })), '.'),
    principal('Anunciar no drop', anunciarVenda)];
}

// ---------- Você ----------
let apagando = false; // a pergunta "Apagar tudo" está aberta; zera ao trocar de rota

function recomecar() {
  try { localStorage.removeItem(CHAVE); } catch (e) { /* sem armazenamento: nada a apagar */ }
  estado = Logica.estadoInicial();
  rascunho = perfilPadrao();
  comoFoi = null; naoEntendi = false; apagando = false; ultimaTela = null; pecaNaTela = null;
  clearTimeout(avisoTimer);
  document.getElementById('pedido-campo').value = '';
  aplicarRealce();
  atualizarConta();
  location.hash = '#/';
}

function telaVoce() {
  const din = Logica.dinheiro;
  // cada troca grava na hora; digitar e ligar/desligar pegadas não reconstroem a tela (R9)
  const aoMudar = (chave, valor) => {
    if (chave === 'nome' || chave === 'email') {
      valor = valor.trim();
      if (chave === 'nome' ? !valor : !Logica.emailValido(valor)) return;
    }
    const novo = { ...estado, perfil: { ...estado.perfil, [chave]: valor } };
    if (['nome', 'email', 'pegadas'].includes(chave)) guardar(novo); else mudar(novo);
  };
  const rotulo = t => { const p = apoio(t); p.classList.add('lab'); return p; };
  const pecas = estado.anuncios.length ? estado.anuncios.map(a => frase(a.tipo + ' · ' + a.tamanho + ' · ' + din(a.preco) + ' · '
    + (!a.vendida ? 'entra no próximo drop' : a.receber === 'pix' ? 'vendida no Pix' : 'vendida em créditos')))
    : [frase('Você ainda não anunciou nada.')];
  const reservas = estado.reservas.filter(r => pecaPorId(r.pecaId)).map(r => frase(el('a', { className: 'palavra', href: '#/sua/' + r.pecaId,
    textContent: pecaPorId(r.pecaId).nome + ' · ' + r.janela + ' · código ' + r.codigo + (r.retirada ? ' · retirada' : '') })));
  const cor = DADOS.CORES.find(c => c.hex === estado.realce);
  // quem usa teclado segue entre a pergunta e o botão
  const nao = botaoPalavra('não', () => { apagando = false; desenhar(); document.getElementById('recomecar').focus(); });
  const recomeco = botaoPalavra('Recomeçar do zero', () => { apagando = true; desenhar(); document.getElementById('nao').focus(); });
  nao.id = 'nao'; recomeco.id = 'recomecar';
  const fim = apagando ? [frase('Apagar tudo e começar de novo?'), frase(botaoPalavra('sim', recomecar), ' ou ', nao, '.')] : [apoio(recomeco)];
  return [
    ...frasesDoPerfil(estado.perfil, aoMudar),
    frase('Você tem ' + din(estado.creditos) + ' em créditos.'),
    rotulo('Suas peças'), ...pecas,
    rotulo('Suas reservas'), ...(reservas.length ? reservas : [frase('Nenhuma reserva por enquanto.')]),
    ...(estado.ultimoAnuncioSeg != null ? [frase('Seu último anúncio levou ' + estado.ultimoAnuncioSeg + ' s.')] : []),
    frase('A cor do seu brechó é ', palavra(cor.nome, 'Cor', DADOS.CORES.map(c => c.nome), n => {
      mudar({ ...estado, realce: DADOS.CORES.find(c => c.nome === n).hex });
      aplicarRealce();
    }), '.'),
    apoio(botaoPalavra('ensaiar o drop agora', ensaiarAgora)),
    ...fim,
  ];
}

// ---------- Rotas ----------
const rotas = { '': { escura: true, tela: telaPrincipal }, sua: { escura: false, tela: telaSua }, vender: { escura: true, tela: telaVender },
  voce: { escura: false, tela: telaVoce } };
let ultimaVista = null; // a entrada animada só toca quando a vista muda (rota, tela principal ou peça do drop)

function desenhar() {
  fechar();
  clearTimeout(avisoTimer);
  if (venda && rotaAtual() !== 'vender') sairDaVenda();
  const tela = document.getElementById('tela');
  const parte = location.hash.replace(/^#\/?/, '').split('/')[0];
  const rota = estado.perfil ? (Object.prototype.hasOwnProperty.call(rotas, parte) ? rotas[parte] : null) : { escura: false, tela: primeiraVez };
  const nos = rota ? rota.tela() : false;
  if (nos === false) { location.replace('#/'); return; }
  document.body.classList.toggle('escuro', !!rota.escura);
  const principalNa = tela => rota === rotas[''] && ultimaTela === tela;
  // o campo do pedido só existe na espera
  const comPedido = principalNa('espera');
  document.getElementById('pedido').hidden = !comPedido;
  document.body.classList.toggle('com-pedido', comPedido);
  document.body.classList.toggle('ao-vivo', principalNa('no-ar'));
  document.body.classList.toggle('vendendo', rota === rotas.vender);
  // o passo dentro da rota também é vista nova; trocar uma palavra no mesmo passo, não
  const reserva = rota === rotas.sua && estado.reservas.find(x => x.pecaId === location.hash.split('/')[2]);
  const vista = (estado.perfil ? parte : 'primeira') + '|' + (rota === rotas[''] ? ultimaTela + (ultimaTela === 'no-ar' ? pecaNaTela.id : '')
    : rota === rotas.vender ? venda.passo : reserva ? comoFoi + '|' + reserva.retirada : '');
  tela.classList.toggle('entra', vista !== ultimaVista);
  ultimaVista = vista;
  tela.textContent = '';
  nos.forEach((n, i) => { n.style.setProperty('--i', i); tela.appendChild(n); });
  if (rotuloParaFocar) {
    const alvo = Array.prototype.find.call(tela.querySelectorAll('button.palavra'), b => (b.getAttribute('aria-label') || '').indexOf(rotuloParaFocar + ': ') === 0);
    if (alvo) alvo.focus();
  }
}

// ---------- Tique ----------
function trocarTexto(id, texto) {
  const no = document.getElementById(id);
  if (no && no.textContent !== texto) no.textContent = texto;
}

function tique() {
  if (!estado.perfil) return;
  const agora = Date.now(), sit = Logica.situacao(estado, agora), drop = estado.drop;
  // outras pessoas levam peças, esteja quem estiver em qualquer rota
  if (drop && !drop.fim && !drop.fechado && drop.inicio === sit.inicio && sit.tela === 'no-ar') {
    while (estado.drop.levadas.length < Math.floor((agora - drop.inicio) / DADOS.DROP.levaACadaMs)) {
      const novo = Logica.levarUma(estado, pilhaAtual());
      if (novo === estado) break;
      guardar(novo);
    }
    // spec 6.6: alguém leva a sua peça; fora da tela do drop, sem aviso
    const a = Logica.anuncioEsperando(estado, drop.inicio);
    if (a && agora - drop.inicio >= DADOS.DROP.vendaAposMs) {
      guardar(Logica.venderSimulado(estado, drop.inicio));
      const c = DADOS.COMPRADOR;
      avisoNoDrop(frase(maiuscula(c.artigo) + ' ' + c.nome + ', de ' + c.curso + ', levou ' + (feminina(a) ? 'sua ' : 'seu ') + a.tipo + '. '
        + (a.receber === 'pix' ? 'O Pix de ' + Logica.dinheiro(Logica.valorVenda(a.preco).pix) + ' cai depois da retirada.'
          : 'Entraram ' + Logica.dinheiro(a.preco) + ' em créditos.')));
      if (pecaNaTela) trocarTexto('sobre', sobrePeca(pecaNaTela));
    }
  }
  if (venda) trocarTexto('cronometro', tempoDaVenda());
  if (rotaAtual() !== '') return;
  if (sit.tela !== ultimaTela) { desenhar(); return; }
  // R1: só os nós que mudaram, nunca a tela inteira
  if (sit.tela === 'espera') trocarTexto('contagem', Logica.contagem(sit.faltaMs));
  if (sit.tela !== 'no-ar') return;
  trocarTexto('resta', 'AO VIVO · ' + Logica.relogio(sit.faltaMs));
  trocarTexto('placar', placarTexto());
  const foram = Logica.placar(estado, DADOS.CATALOGO).foram;
  const barra = document.getElementById('barra');
  if (barra) Array.prototype.forEach.call(barra.children, (i, n) => { const c = n < foram ? 'f' : ''; if (i.className !== c) i.className = c; });
}

// ---------- Partida ----------
window.addEventListener('hashchange', () => { comoFoi = null; apagando = false; desenhar(); });
document.addEventListener('keydown', e => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  if (aberta || !document.getElementById('drop') || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  e.preventDefault();
  if (e.key === 'ArrowRight') pegarPeca(); else passarPeca();
});
document.getElementById('pedido').addEventListener('submit', e => {
  e.preventDefault();
  const c = document.getElementById('pedido-campo'), texto = c.value.trim();
  if (!texto) return;
  if (!Logica.entenderPedido(texto, estado.perfil).tipos.length) { naoEntendi = true; desenhar(); return; }
  c.value = '';
  mudar(Logica.pedir(estado, texto));
});
aplicarRealce();
atualizarConta();
desenhar();
setInterval(tique, 200);
