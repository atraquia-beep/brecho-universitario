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

// a cor escolhida vale nas duas luzes: no escuro, o mesmo tom a 40% (sem color-mix, R7)
function aplicarRealce() {
  const h = estado.realce, s = document.documentElement.style;
  s.setProperty('--realce', h);
  s.setProperty('--realce-escuro', 'rgba(' + [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)).join(', ') + ', .4)');
}

function atualizarConta() {
  const conta = document.getElementById('conta');
  conta.hidden = !estado.perfil || !!venda; // em #/vender o cronômetro ocupa o lugar
  conta.textContent = estado.perfil ? estado.perfil.nome : '';
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
  for (let i = 0; i < partes.length; i++) {
    const x = partes[i], pontos = typeof partes[i + 1] === 'string' && /^[.,;:!?]+/.exec(partes[i + 1]);
    if (typeof x === 'string') p.appendChild(document.createTextNode(x));
    else if (!pontos || !(x.classList.contains('palavra') || x.classList.contains('campo'))) p.appendChild(x);
    else {
      // a pontuação depois de uma palavra ou de um campo nunca cai sozinha na linha de baixo
      const junto = document.createElement('span');
      junto.className = 'junto';
      junto.append(x, pontos[0]);
      p.append(junto, partes[++i].slice(pontos[0].length));
    }
  }
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
    const texto = c.value || placeholder;
    // o canvas mede sem o letter-spacing que o navegador aplica a cada letra
    c.style.width = Math.ceil(ctx.measureText(texto).width + texto.length * (parseFloat(css.letterSpacing) || 0)) + 1 + 'px';
  };
  c.addEventListener('input', () => { medir(); aoMudar(c.value); });
  // mede de novo quando a fonte do campo chegar: antes disso o canvas mede com a fonte reserva, que é mais larga
  document.fonts.ready.then(() => { medir(); document.fonts.load(ctx.font).then(medir, () => {}); });
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
function el(tag, props) { return Object.assign(document.createElement(tag), props); }

// título em letras soltas, para subirem uma a uma; quem ouve a tela recebe a palavra inteira
function letras(tag, classe, texto) {
  const no = el(tag, { className: classe });
  no.setAttribute('aria-label', texto);
  texto.split('').forEach((c, i) => {
    const l = el('span', { className: 'letra', textContent: c });
    l.setAttribute('aria-hidden', 'true');
    l.style.setProperty('--i', i);
    no.appendChild(l);
  });
  return no;
}
const regua = () => { const r = el('i', { className: 'regua' }); r.setAttribute('aria-hidden', 'true'); return r; };

// Um lado da tela larga: palco (esquerda), painel (direita) ou pe (embaixo do palco). No celular o grupo some e os nós seguem em fila (estilo.css).
const lado = (classe, ...nos) => { const d = el('div', { className: 'lado ' + classe }); d.append(...nos); return d; };

// Palavra gigante de ponta a ponta: mede a 100 px e escala para a largura pedida. O nome pode mudar; o tamanho se ajusta.
// A tinta da primeira e da última letra não encosta na caixa: as folgas saem da conta.
// Sem largura, vale a da própria caixa e a palavra anda até encostar na margem esquerda.
function encaixar(no, largura) {
  no.style.fontSize = '100px';
  no.style.marginLeft = '';
  const rente = !largura, r = document.createRange(), css = getComputedStyle(no), ctx = document.createElement('canvas').getContext('2d'), t = no.getAttribute('aria-label');
  r.selectNodeContents(no);
  ctx.font = css.fontWeight + ' 100px ' + css.fontFamily;
  const a = ctx.measureText(t.charAt(0)), z = ctx.measureText(t.slice(-1));
  const esq = -a.actualBoundingBoxLeft || 0, dir = z.width - z.actualBoundingBoxRight + parseFloat(css.letterSpacing) || 0;
  const k = (largura || no.clientWidth) / (r.getBoundingClientRect().width - esq - dir);
  no.style.fontSize = Math.floor(1000 * k) / 10 + 'px';
  if (rente) no.style.marginLeft = -esq * k + 'px';
}
function encaixarTudo() {
  const t = document.querySelector('h1.titulo');
  if (t) encaixar(t);
  document.querySelectorAll('.cortina .ab-marca').forEach(m => encaixar(m, Math.min(innerWidth * .8, innerHeight * 1.3)));
}

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

// ---------- Entrada ----------
// Três passos: e-mail da Unicamp, código de quatro dígitos e a frase do perfil. O código é simulado: nenhum e-mail sai, qualquer um entra.
let acesso = 'email';     // email, codigo ou perfil
let acessoTimer = null;   // os 1,5 s em que as células giram, se juntam e viram o visto (só para quem aceita movimento)

function passosDaEntrada() {
  const p = el('p', { className: 'passos lab' });
  [['email', 'E-mail'], ['codigo', 'Código'], ['perfil', 'Você']].forEach((x, i) => {
    const s = el('span', { textContent: '0' + (i + 1) + ' ' + x[1] });
    if (x[0] === acesso) s.setAttribute('aria-current', 'step');
    p.appendChild(s);
  });
  return p;
}

// Quatro células de um dígito: digitar anda para a frente, apagar volta, colar espalha. Cheias, chamam aoCompletar.
function celulasDoCodigo(aoCompletar) {
  const grupo = el('div', { className: 'digitos' });
  grupo.setAttribute('role', 'group');
  grupo.setAttribute('aria-label', 'Código de quatro dígitos');
  const cs = [0, 1, 2, 3].map(i => {
    const c = el('input', { className: 'digito', type: 'text', inputMode: 'numeric', autocomplete: i ? 'off' : 'one-time-code' });
    c.setAttribute('aria-label', 'Dígito ' + (i + 1) + ' de 4');
    c.style.setProperty('--n', i);
    c.addEventListener('focus', () => c.select());
    c.addEventListener('input', () => {
      const d = c.value.replace(/\D/g, '').slice(0, 4 - i);
      c.value = '';
      d.split('').forEach((x, k) => { cs[i + k].value = x; });
      if (d) cs[Math.min(i + d.length, 3)].focus();
      if (cs.every(x => x.value)) aoCompletar(grupo);
    });
    c.addEventListener('keydown', e => { if (e.key === 'Backspace' && !c.value && i) { cs[i - 1].value = ''; cs[i - 1].focus(); } });
    return c;
  });
  const visto = el('span', { className: 'visto' });
  visto.setAttribute('aria-hidden', 'true');
  visto.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  grupo.append(...cs, visto);
  return grupo;
}

function primeiraVez() {
  const aviso = frase('');
  aviso.hidden = true;
  const dizer = texto => { aviso.textContent = texto; aviso.hidden = false; };
  // troca de passo: redesenha, faz o painel chegar e leva o foco ao primeiro campo
  const ir = (passo, foco) => {
    clearTimeout(acessoTimer); acessoTimer = null;
    acesso = passo;
    desenhar();
    document.querySelector('#tela .painel').classList.add('chega');
    document.querySelector(foco).focus();
  };
  const d = DADOS.DROP, ficha = el('p', { className: 'ficha lab' });
  ficha.append(el('span', { textContent: 'O brechó do campus' }), el('span', { textContent: 'Limeira · ' + new Date().getFullYear() }));
  const fecho = el('p', { className: 'fecho', textContent: 'Roupa boa não acaba.' });
  fecho.appendChild(el('span', { textContent: 'Troca de dono.' }));
  let passo;
  if (acesso === 'email') {
    const email = campo(rascunho.email, 'Seu e-mail da Unicamp', 'Seu e-mail da Unicamp', v => { rascunho.email = v; }, 'email');
    const pedir = () => {
      const valor = rascunho.email.trim();
      if (!Logica.emailValido(valor)) { dizer('Preciso de um e-mail da Unicamp para deixar você entrar.'); email.focus(); return; }
      rascunho.email = valor;
      ir('codigo', '.digito');
    };
    email.addEventListener('keydown', e => { if (e.key === 'Enter') pedir(); });
    passo = [
      frase('Oi. O Take It é o brechó do campus de Limeira, só entre alunos.'),
      frase('As peças novas entram juntas, ' + d.dias.map(n => Logica.DIAS_DA_SEMANA[n]).join(' e ') + ', às ' + d.hora
        + 'h. Quem tocar primeiro leva. A arara fica sempre aberta.'),
      frase('Meu e-mail da Unicamp é ', email, '.'), aviso,
      principal('Receber o código', pedir),
      apoio('Sem senha. Mando um código de quatro dígitos para esse e-mail.'),
    ];
  } else if (acesso === 'codigo') {
    const nota = apoio('Demonstração: nenhum e-mail sai daqui e qualquer código entra. ', botaoPalavra('trocar o e-mail', () => ir('email', '.campo')), '.');
    const conferir = grupo => {
      if (acessoTimer) return;
      const seguir = () => ir('perfil', 'input[aria-label="Seu nome"]');
      // a espera existe só para a animação: quem pede menos movimento segue na hora
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { seguir(); return; }
      grupo.classList.add('confere');
      grupo.querySelectorAll('input').forEach(c => { c.readOnly = true; c.blur(); });
      nota.textContent = 'Conferindo…';
      acessoTimer = setTimeout(seguir, 1500);
    };
    passo = [frase('Mandei quatro dígitos para ' + rascunho.email + '. Digite aqui:'), celulasDoCodigo(conferir), nota];
  } else {
    const entrar = () => {
      const nome = rascunho.nome.trim();
      if (!nome) { dizer('Como eu te chamo?'); document.querySelector('input[aria-label="Seu nome"]').focus(); return; }
      mudar({ ...estado, perfil: { ...rascunho, nome } });
    };
    const aoMudar = (chave, valor) => {
      rascunho[chave] = valor;
      // digitar e ligar/desligar pegadas atualizam no lugar; o resto reconstrói a tela
      if (!['nome', 'pegadas'].includes(chave)) desenhar();
    };
    const perfil = frasesDoPerfil(rascunho, aoMudar)[0];
    perfil.querySelector('input').addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); });
    passo = [
      frase('Código certo. Agora me conte de você:'), perfil, aviso,
      principal('Entrar', entrar),
      apoio('Toque numa palavra sublinhada para mudar. Dá para trocar tudo depois.'),
    ];
  }
  return [
    lado('palco', letras('h1', 'titulo', DADOS.MARCA), regua(), ficha),
    lado('painel', passosDaEntrada(), ...passo),
    lado('pe', fecho, apoio('Feito por alunos, para alunos.')),
  ];
}

let ultimaTela = null;      // tela principal desenhada por último (o tique compara com ela)

const rotaAtual = () => location.hash.replace(/^#\/?/, '').split('/')[0];

function botaoPalavra(texto, aoTocar) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'palavra';
  b.textContent = texto;
  b.addEventListener('click', aoTocar);
  return b;
}

const pilhaAtual = () => Logica.ordenarPilha(DADOS.CATALOGO, estado.perfil, null, Logica.foraDaPilha(estado));
const feminina = peca => DADOS.TIPOS[peca.tipo].genero === 'f';
const pecaPorId = id => DADOS.CATALOGO.concat(DADOS.ARARA).find(p => p.id === id);
const daArara = id => DADOS.ARARA.some(p => p.id === id);

// nós que abrem a tela de início: reservas por retirar
function avisosDaEspera() {
  const nos = [];
  estado.reservas.filter(r => !r.retirada).forEach(r => {
    const peca = pecaPorId(r.pecaId);
    if (!peca) return;
    nos.push(apoio(Object.assign(document.createElement('a'), {
      className: 'palavra', href: '#/sua/' + peca.id,
      textContent: (feminina(peca) ? 'Sua ' : 'Seu ') + peca.nome.toLowerCase() + ': retirada ' + r.janela.replace('das ', '').replace(' às ', '–') + '. Código\u00a0' + r.codigo + '.',
    })));
  });
  return nos;
}

const maiuscula = t => t.charAt(0).toUpperCase() + t.slice(1);
const focavel = el => { el.tabIndex = -1; return el; };

// os dois "ver um drop de teste agora" (início e Você): fecha o drop que ainda não foi fechado (no ar ou no fim) e ensaia
function ensaiarAgora() {
  guardar(Logica.ensaiar(estado.drop && !estado.drop.fechado ? Logica.fecharDrop(estado) : estado, Date.now()));
  if (rotaAtual() !== '') { location.hash = '#/'; return; }
  desenhar();
  const rotulo = document.getElementById('rotulo');
  if (rotulo) rotulo.focus();
}
const botaoDoTeste = () => botaoPalavra('ver um drop de teste agora (' + DADOS.DROP.ensaioMs / 1000 + ' s)', ensaiarAgora);

// as peças à venda, lado a lado; qualquer foto abre a arara do começo
function vitrine(pecas) {
  const fila = el('div', { className: 'vitrine' });
  pecas.forEach(p => {
    const img = el('img', { src: p.foto, alt: '' });
    img.dataset.peca = p.id;
    const foto = el('span', { className: 'vitrine-foto' });
    foto.append(img, el('span', { className: 'etiqueta', textContent: Logica.dinheiro(p.preco) }));
    const a = el('a', { className: 'vitrine-peca', href: '#/arara' });
    a.append(foto, el('span', { className: 'vitrine-nome apoio', textContent: maiuscula(p.tipo) + ' · ' + p.tamanho }));
    fila.appendChild(a);
  });
  return fila;
}

// Primeiro o que dá para comprar já (no computador, o painel); depois o drop, com os números gigantes (o palco)
function telaEspera(sit) {
  const perfil = estado.perfil;
  const pilha = pilhaAtual();
  const arara = pilhaDaArara(true), n = arara.length;
  const ficha = el('p', { className: 'ficha lab' });
  ficha.appendChild(el('span', { textContent: 'À venda agora' }));
  if (n) ficha.appendChild(el('span', { textContent: n + (n === 1 ? ' peça' : ' peças') }));
  const aVenda = n ? [
    frase('Roupa de quem estuda aqui. Gostou, toque em ', el('span', { className: 'amostra', textContent: 'É minha' }), ' e ela é sua.'),
    vitrine(arara),
    principal(n === 1 ? 'Ver a peça' : 'Ver as ' + n + ' peças', () => { location.hash = '#/arara'; }),
  ] : [frase('Nada à venda agora. As próximas peças entram no drop.')];
  const rotulo = focavel(el('p', { id: 'rotulo', className: 'ficha lab' }));
  rotulo.append(el('span', { textContent: sit.ensaio ? 'Drop de teste' : 'Próximo drop · ' + Logica.diaDaSemana(sit.inicio) + ', ' + DADOS.DROP.hora + 'h' }),
    el('span', { textContent: 'faltam' }));
  const contagem = document.createElement('p');
  contagem.id = 'contagem';
  contagem.className = 'contagem';
  contagem.textContent = Logica.contagem(sit.faltaMs);
  // conta só o tamanho: "sete são M" é verdade ao pé da letra
  const total = pilha.length, doTamanho = pilha.filter(p => p.tamanho === perfil.tamanho).length;
  const tamanho = Object.assign(document.createElement('a'), { className: 'palavra', href: '#/voce', textContent: perfil.tamanho });
  const entram = (total === 1 ? 'Uma peça nova entra sozinha' : maiuscula(Logica.extenso(total, 'f')) + ' peças novas entram juntas')
    + ', só por ' + DADOS.DROP.duracaoMs / 60000 + ' minutos. Quem tocar primeiro leva. ';
  const fraseDoDrop = doTamanho === 0
    ? frase(entram + 'Nenhuma é ', tamanho, ' desta vez.')
    : frase(entram + maiuscula(Logica.extenso(doTamanho, 'f')) + (doTamanho === 1 ? ' é ' : ' são '), tamanho, '.');
  let acordar;
  if (estado.acordar) {
    acordar = focavel(el('span', { id: 'combinado', textContent: 'Combinado. Te aviso cinco minutos antes.' }));
  } else {
    acordar = botaoPalavra('Me avise antes', () => { mudar(Logica.pedirParaAcordar(estado)); document.getElementById('combinado').focus(); });
  }
  const atalhos = el('p', { className: 'atalhos' });
  atalhos.append(acordar, botaoDoTeste());
  return [
    lado('painel', ...avisosDaEspera(), ficha, ...aVenda),
    lado('palco', rotulo, contagem, regua(), fraseDoDrop, atalhos),
  ];
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
  // a camada recorta o fantasma na coluna do celular: ele nunca alarga a página
  const camada = el('div', { className: 'camada-fantasma' });
  camada.setAttribute('aria-hidden', 'true');
  document.body.appendChild(camada);
  const f = el('img', { src: img.src, alt: '', className: 'fantasma ' + lado });
  Object.assign(f.style, { left: r.left - camada.getBoundingClientRect().left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', transform: img.parentNode.style.transform });
  ['animationend', 'animationcancel'].forEach(t => f.addEventListener(t, () => camada.remove()));
  camada.appendChild(f);
}

// Toda saída de peça passa por aqui. Na arara, passar só vale para esta visita: nada é gravado.
function passarPeca() {
  fantasma('esquerda');
  const comFoco = document.activeElement && document.activeElement.id === 'passo';
  if (rotaAtual() === 'arara') { araraPassadas.push(pecaNaTela.id); desenhar(); }
  else mudar(Logica.passar(estado, pecaNaTela.id));
  const alvo = document.getElementById('passo') || document.getElementById('arara-fim');
  if (comFoco && alvo) alvo.focus();
}
function pegarPeca() {
  const peca = pecaNaTela;
  fantasma('direita');
  // reservar devolve o mesmo estado se a peça já é sua: o toque duplo não cria outra reserva. Peça da arara não pertence a drop nenhum
  // (pela peça e não pela rota: no segundo toque o endereço já é #/sua/…).
  guardar(Logica.reservar(estado, peca, Logica.janelasDeRetirada(new Date())[0], Logica.gerarCodigo(), daArara(peca.id) ? null : estado.drop.inicio));
  location.hash = '#/sua/' + peca.id;
}

// mostra um nó sobre a foto por 6 segundos
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

// A peça em tela cheia, com a folha embaixo (no computador, ao lado). Serve ao drop e à arara: "meio" entra antes das ações, "fim" depois.
function secaoDaPeca(rotulo, peca, proxima, pilulas, meio, fim) {
  pecaNaTela = peca;
  if (proxima) new Image().src = proxima.foto; // a próxima já chega carregada
  const img = el('img', { id: 'peca', src: peca.foto, alt: peca.alt, draggable: false });
  const carimbo = el('span', { className: 'carimbo', hidden: true });
  carimbo.setAttribute('aria-hidden', 'true');
  const cartao = el('div', { className: 'cartao' });
  cartao.append(img, carimbo);
  arrastavel(cartao, carimbo);
  const topo = el('div', { className: 'pilulas' });
  topo.append(...pilulas);
  const foto = el('div', { className: 'foto' });
  foto.append(cartao, topo);
  const passo = botaoPalavra('passo', passarPeca);
  passo.id = 'passo';
  const acoes = el('div', { className: 'acoes' });
  acoes.append(passo, principal('É minha', pegarPeca));
  const teclas = apoio('No teclado: ← passa, → é minha.');
  teclas.classList.add('largo');
  const folha = el('div', { className: 'folha' });
  folha.append(frase(peca.nome + ', ' + peca.tamanho + ', ' + (feminina(peca) ? peca.estado.replace(/^(usad|nov)o/, '$1a') : peca.estado) + '. ' + Logica.dinheiro(peca.preco) + '.'),
    el('p', { id: 'sobre', className: 'apoio', textContent: sobrePeca(peca) }), ...meio, acoes, ...fim, teclas);
  const secao = el('section', { id: 'drop' });
  secao.setAttribute('aria-label', rotulo);
  secao.append(foto, folha);
  return secao;
}

function telaNoAr(sit) {
  const pilha = pilhaAtual(), peca = pilha[0];
  const meio = [];
  const aviso = el('div', { id: 'aviso', hidden: true });
  aviso.setAttribute('aria-live', 'polite');
  meio.push(aviso);
  const barra = el('div', { id: 'barra', className: 'barra' });
  barra.setAttribute('aria-hidden', 'true');
  const pl = Logica.placar(estado, DADOS.CATALOGO);
  for (let i = 0; i < pl.total; i++) barra.appendChild(el('i', { className: i < pl.foram ? 'f' : '' }));
  return [secaoDaPeca('Drop no ar', peca, pilha[1],
    [el('span', { id: 'resta', className: 'pilula', textContent: 'AO VIVO · ' + Logica.relogio(sit.faltaMs) }), el('span', { className: 'pilula', textContent: DADOS.DROP.online + ' online' })],
    meio, [barra, apoio(el('span', { id: 'placar', textContent: placarTexto() }))])];
}

function telaFim() {
  const n = estado.reservas.filter(r => r.drop === estado.drop.inicio).length;
  const proximo = Logica.dropDoCalendario(estado.drop.inicio + DADOS.DROP.duracaoMs);
  return [lado('palco',
    frase('O drop acabou. ' + (n ? 'Você ficou com ' + Logica.extenso(n, 'f') + (n === 1 ? ' peça.' : ' peças.') : 'Você não pegou nada desta vez.')),
    frase('Próximo drop: ' + Logica.diaDaSemana(proximo) + ', ' + DADOS.DROP.hora + 'h.'),
    frase('Enquanto isso, ', linkDaArara(), ' continuam lá.'),
    principal('Voltar', () => mudar(Logica.fecharDrop(estado))))];
}

// ---------- Arara ----------
// Aberta o tempo todo: uma peça por vez, como no drop, sem relógio e sem ninguém levando nada.
let araraPassadas = []; // passadas nesta visita; zeram com "olhar de novo", ao recarregar e ao chegar de outra tela que não "é sua"
const pilhaDaArara = todas => Logica.ordenarPilha(DADOS.ARARA, estado.perfil, null, Logica.indisponiveis(estado).concat(todas ? [] : araraPassadas));
const linkDaArara = () => el('a', { className: 'palavra', href: '#/arara', textContent: 'as peças à venda' });

function telaArara() {
  const pilha = pilhaDaArara();
  if (!pilha.length) {
    pecaNaTela = null;
    const resta = pilhaDaArara(true).length;
    const fim = focavel(frase(resta ? 'Você viu a arara inteira.' : 'A arara está vazia agora.'));
    fim.id = 'arara-fim';
    const denovo = resta ? [frase('Dá para ', botaoPalavra('olhar de novo', () => { araraPassadas = []; desenhar(); document.getElementById('passo').focus(); }), '.')] : [];
    return [lado('palco', fim, ...denovo, principal('Voltar', () => { location.hash = '#/'; }))];
  }
  return [secaoDaPeca('Arara', pilha[0], pilha[1],
    [el('span', { className: 'pilula', textContent: 'Arara · sempre aberta' }), el('span', { className: 'pilula', textContent: pilha.length + (pilha.length === 1 ? ' peça' : ' peças') })],
    [], [])];
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
  // na tela larga, a foto da peça ocupa o lado direito
  const retrato = lado('painel', el('img', { className: 'retrato largo', src: peca.foto, alt: '' }));
  if (r.retirada) {
    const curso = estado.perfil.curso === 'outro curso' ? 'Seu curso' : estado.perfil.curso;
    return [lado('palco', focavel(frase('Obrigado. Uma peça a menos no lixo: ' + curso + ' chegou a ' + Logica.contadorDoCurso(estado) + '.')), principal('Voltar', voltar)), retrato];
  }
  if (comoFoi === id) {
    const notas = ['ótimo', 'ok', 'ruim'].map(n => botaoPalavra(n, () => mudar(Logica.confirmarRetirada(estado, id, n))));
    const pergunta = focavel(frase('Como foi com ' + v.artigo + ' ' + v.nome + '?'));
    pergunta.id = 'como-foi';
    return [lado('palco', pergunta, frase(notas[0], ', ', notas[1], ' ou ', notas[2], '.')), retrato];
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
  const fundo = apoio(...(daArara(id) ? [el('a', { className: 'palavra', href: '#/arara', textContent: 'continuar na arara' }), ' · '] : []), 'Mudou de ideia? ', cancelar, '.');
  fundo.classList.add('final');
  return [
    lado('palco', frase((f ? 'É sua. A ' : 'É seu. O ') + peca.nome.toLowerCase() + ' d' + v.artigo + ' ' + v.nome + ' espera você ', janela, ', no ponto da FCA. Mostre este código:'),
      codigo, regua(), frase(pagamento)),
    lado('pe', acao, fundo), retrato,
  ];
}

// ---------- Vender pela câmera ----------
// o fluxo de #/vender; nulo fora da rota. passo: visor, olhando, palpite ou publicado.
let venda = null;
const EXEMPLO = 'fotos/exemplo-venda.jpg';

// segundos inteiros já passados (relogio arredonda para cima, certo só para contagem regressiva)
const tempoDaVenda = () => Logica.relogio(Math.floor(((venda.fim || Date.now()) - venda.entrada) / 1000) * 1000);

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
  const v = venda = { passo: 'visor', entrada: Date.now(), fim: null, camera: null, stream: null, video: null, foto: null, erro: false, timer: null,
    anuncio: { tamanho: estado.perfil.tamanho, receber: 'creditos' } };
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
  // a peça de exemplo é sempre a jaqueta; foto de verdade alterna os palpites
  const p = DADOS.PALPITES[foto === EXEMPLO ? 0 : estado.anuncios.length % DADOS.PALPITES.length];
  Object.assign(v.anuncio, { tipo: p.tipo, estado: p.estado, preco: Logica.sugerirPreco(p.tipo, p.estado).sugerido });
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
  v.fim = v.entrada + s * 1000; // o cronômetro para no mesmo número da frase
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
    // "escolher uma foto" sempre existe; o disparo e os cantos só depois de o visor estar decidido
    if (v.camera !== null) {
      visor.appendChild(v.camera ? v.video : el('img', { id: 'visor', src: EXEMPLO, alt: 'Peça de exemplo: jaqueta jeans num cabide' }));
      ['sup esq', 'sup dir', 'inf esq', 'inf dir'].forEach(c => visor.appendChild(el('i', { className: 'canto ' + c })));
      const disparo = el('button', { type: 'button', id: 'disparo', className: 'disparo' });
      disparo.setAttribute('aria-label', 'Fotografar');
      disparo.addEventListener('click', disparar);
      rodape.appendChild(disparo);
    }
    const entrada = el('input', { type: 'file', id: 'foto-entrada', accept: 'image/*', hidden: true });
    entrada.addEventListener('change', () => abrirFoto(entrada.files[0]));
    // redesenhar tira o vídeo da página, o que o pausa
    if (v.video) Promise.resolve().then(() => { const p = v.video && v.video.play(); if (p) p.catch(() => {}); });
    rodape.append(
      ...(v.camera === false ? [apoio('Sem câmera aqui: usei uma peça de exemplo.')] : []),
      ...(v.erro ? [apoio('Não consegui abrir essa foto. Tente outra ou use a peça de exemplo.')] : []),
      apoio(botaoPalavra('escolher uma foto', () => entrada.click()), entrada));
    visor.appendChild(rodape);
    const dica = frase('Fotografe a peça. Eu digo o que é e sugiro o preço.');
    dica.classList.add('largo');
    return [lado('palco', visor), lado('painel', dica)];
  }
  visor.appendChild(el('img', { id: 'visor', src: v.foto, alt: 'A foto da sua peça' }));
  if (v.passo === 'olhando') { rodape.appendChild(frase('Olhando…')); visor.appendChild(rodape); return [lado('palco', visor)]; }
  const etiquetas = el('div', { className: 'etiquetas' });
  etiquetas.append(el('span', { className: 'etiqueta', textContent: a.tipo + ' · ' + a.tamanho + ' · ' + a.estado }),
    el('span', { className: 'etiqueta grande', textContent: din(a.preco) }));
  visor.appendChild(etiquetas);
  if (v.passo === 'publicado') return [lado('palco', visor), lado('painel', frase(v.publicado), principal('Voltar', () => { location.hash = '#/'; }))];
  const faixa = Logica.sugerirPreco(a.tipo, a.estado);
  const precos = [-10, -5, 0, 5, 10].map(d => faixa.sugerido + d).filter(p => p >= 5);
  const valor = Logica.valorVenda(a.preco);
  const receber = r => r === 'pix' ? din(valor.pix) + ' no Pix' : din(valor.creditos) + ' em créditos';
  const trocar = mudanca => { Object.assign(a, mudanca); desenhar(); };
  // tipo e estado refazem a faixa e voltam o preço ao sugerido
  const refazer = mudanca => { Object.assign(a, mudanca); trocar({ preco: Logica.sugerirPreco(a.tipo, a.estado).sugerido }); };
  return [lado('palco', visor), lado('painel',
    frase('Parece ' + DADOS.TIPOS[a.tipo].artigo + ' ', palavra(a.tipo, 'Tipo', Object.keys(DADOS.TIPOS), t => refazer({ tipo: t })),
      ', tamanho ', palavra(a.tamanho, 'Tamanho', DADOS.TAMANHOS, t => trocar({ tamanho: t })),
      ', ', palavra(a.estado, 'Estado', DADOS.ESTADOS, e => refazer({ estado: e })),
      '. No campus, peças assim saem por ' + din(faixa.min) + ' a ' + din(faixa.max) + '. Eu anunciaria por ',
      palavra(din(a.preco), 'Preço', precos.map(din), p => trocar({ preco: precos[precos.map(din).indexOf(p)] })), '.'),
    frase('Vendendo, prefiro ', palavra(receber(a.receber), 'Receber', [receber('creditos'), receber('pix')],
      r => trocar({ receber: r === receber('pix') ? 'pix' : 'creditos' })), '.'),
    principal('Anunciar no drop', anunciarVenda))];
}

// ---------- Você ----------
let apagando = false; // a pergunta "Apagar tudo" está aberta; zera ao trocar de rota

function recomecar() {
  try { localStorage.removeItem(CHAVE); } catch (e) { /* sem armazenamento: nada a apagar */ }
  estado = Logica.estadoInicial();
  rascunho = perfilPadrao();
  comoFoi = null; apagando = false; ultimaTela = null; pecaNaTela = null; acesso = 'email';
  clearTimeout(avisoTimer);
  aplicarRealce();
  atualizarConta();
  abertura(); // regravar começa pela abertura
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
    + (!a.vendida ? 'entra no próximo drop' : (feminina(a) ? 'vendida' : 'vendido') + (a.receber === 'pix' ? ' no Pix' : ' em créditos'))))
    : [frase('Você ainda não anunciou nada.')];
  const reservas = estado.reservas.filter(r => pecaPorId(r.pecaId)).map(r => frase(el('a', { className: 'palavra', href: '#/sua/' + r.pecaId,
    textContent: pecaPorId(r.pecaId).nome + ' · ' + r.janela + ' · código ' + r.codigo + (r.retirada ? ' · retirada' : '') })));
  const cor = DADOS.CORES.find(c => c.hex === estado.realce);
  const amostra = palavra(cor.nome, 'Cor', DADOS.CORES.map(c => c.nome), n => {
    mudar({ ...estado, realce: DADOS.CORES.find(c => c.nome === n).hex });
    aplicarRealce();
  });
  amostra.classList.add('amostra'); // a palavra mostra a própria cor
  // quem usa teclado segue entre a pergunta e o botão
  const nao = botaoPalavra('não', () => { apagando = false; desenhar(); document.getElementById('recomecar').focus(); });
  const recomeco = botaoPalavra('Recomeçar do zero', () => { apagando = true; desenhar(); document.getElementById('nao').focus(); });
  nao.id = 'nao'; recomeco.id = 'recomecar';
  const fim = apagando ? [frase('Apagar tudo e começar de novo?'), frase(botaoPalavra('sim', recomecar), ' ou ', nao, '.')] : [apoio(recomeco)];
  return [
    lado('palco', ...frasesDoPerfil(estado.perfil, aoMudar),
      frase('Você tem ' + din(estado.creditos) + ' em créditos.')),
    lado('painel', rotulo('Suas peças'), ...pecas,
      rotulo('Suas reservas'), ...(reservas.length ? reservas : [frase('Nenhuma reserva por enquanto.')]),
      ...(estado.ultimoAnuncioSeg != null ? [frase('Seu último anúncio levou ' + estado.ultimoAnuncioSeg + ' s.')] : [])),
    // no celular a cor vem depois das reservas, como sempre foi; no computador fica embaixo do perfil
    lado('pe', frase('A cor do seu brechó é ', amostra, '.'), apoio(botaoDoTeste()), ...fim),
  ];
}

// ---------- Cortinas ----------
// Painel de tela cheia com uma palavra que sobe letra a letra e sai sozinho para cima (estilo.css).
// Só visual: o app já está desenhado por baixo e nada espera por ele. Um toque pula; quem pede menos movimento não vê.
// A barra do navegador acompanha a luz da tela; enquanto a abertura está na frente, o creme dela.
function barra() {
  document.querySelector('meta[name="theme-color"]').content =
    document.getElementById('abertura') || !document.body.classList.contains('escuro') ? '#EBE0D9' : '#000000';
}

function cortina(id, texto) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const velha = document.getElementById(id);
  if (velha) velha.remove();
  const no = el('div', { id, className: 'cortina' });
  no.setAttribute('aria-hidden', 'true');
  no.appendChild(letras('p', 'ab-marca', texto));
  const tirar = () => { no.remove(); if (!document.getElementById('abertura')) document.body.classList.remove('abrindo'); barra(); };
  no.addEventListener('animationend', e => { if (e.target === no) tirar(); });
  no.addEventListener('click', tirar);
  setTimeout(tirar, 5000); // reserva: uma aba em segundo plano pode não avisar o fim da animação
  document.body.appendChild(no);
  encaixarTudo();
  return no;
}

// A abertura do site: tela creme, o nome na cor da pessoa, as peças passando atrás e o contador indo a 100.
function abertura() {
  const no = cortina('abertura', DADOS.MARCA);
  if (!no) return;
  document.body.classList.add('abrindo'); // segura a entrada da tela de baixo até a cortina sair
  const pilha = el('div', { className: 'ab-pilha' });
  [-7, 5, -3, 8, -5, 3, -2].forEach((giro, i) => {
    const img = el('img', { src: DADOS.CATALOGO[i].foto, alt: '' });
    img.style.setProperty('--i', i);
    img.style.transform = 'rotate(' + giro + 'deg)';
    pilha.appendChild(img);
  });
  no.insertBefore(pilha, no.firstChild);
  const conta = el('span', { className: 'ab-conta', textContent: '000' });
  no.lastChild.appendChild(conta);
  const t0 = performance.now();
  (function contar(t) {
    conta.textContent = ('00' + Math.round(Math.max(0, Math.min(1, (t - t0) / 2500)) * 100)).slice(-3);
    if (t - t0 < 2500 && no.parentNode) requestAnimationFrame(contar);
  })(t0);
}

// ---------- Rotas ----------
const rotas = { '': { escura: true, tela: telaPrincipal }, sua: { escura: false, tela: telaSua }, vender: { escura: true, tela: telaVender },
  voce: { escura: false, tela: telaVoce }, arara: { escura: true, tela: telaArara } };
let ultimaVista = null; // a entrada animada só toca quando a vista muda (rota, tela principal ou peça do drop)

function desenhar() {
  fechar();
  clearTimeout(avisoTimer);
  if (venda && rotaAtual() !== 'vender') sairDaVenda();
  const tela = document.getElementById('tela');
  const parte = location.hash.replace(/^#\/?/, '').split('/')[0];
  const rota = estado.perfil ? (Object.prototype.hasOwnProperty.call(rotas, parte) ? rotas[parte] : null) : { escura: true, tela: primeiraVez };
  const telaAntes = ultimaTela;
  const nos = rota ? rota.tela() : false;
  if (nos === false) { location.replace('#/'); return; }
  document.body.classList.toggle('escuro', !!rota.escura);
  barra();
  // a barra de baixo some onde o drop ao vivo, a câmera ou a reserva ocupam a tela, e na entrada; na arara, Comprar fica ativo
  document.body.classList.toggle('sem-abas', !(estado.perfil && (rota === rotas.arara || rota === rotas.voce || (rota === rotas[''] && ultimaTela !== 'no-ar'))));
  const aba = rota === rotas.voce ? '#/voce' : '#/';
  document.querySelectorAll('#abas a').forEach(a => { if (a.getAttribute('href') === aba) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  // a peça em tela cheia (drop ou arara) põe o topo claro sobre a foto
  document.body.classList.toggle('ao-vivo', nos.some(n => n.id === 'drop'));
  document.body.classList.toggle('vendendo', rota === rotas.vender);
  document.body.classList.toggle('entrada', !estado.perfil);
  // o passo dentro da rota também é vista nova; trocar uma palavra no mesmo passo, não
  const reserva = rota === rotas.sua && estado.reservas.find(x => x.pecaId === location.hash.split('/')[2]);
  const vista = (estado.perfil ? parte : 'primeira') + '|' + (rota === rotas[''] ? ultimaTela + (ultimaTela === 'no-ar' ? pecaNaTela.id : '')
    : rota === rotas.vender ? venda.passo : rota === rotas.arara ? (pecaNaTela ? pecaNaTela.id : 'vazia')
    : reserva ? comoFoi + '|' + reserva.retirada : '');
  // o drop abriu na frente da pessoa: a cortina na cor dela marca a virada
  if (rota === rotas[''] && telaAntes === 'espera' && ultimaTela === 'no-ar' && !document.getElementById('abertura')) cortina('ao-vivo', 'AO VIVO');
  tela.classList.toggle('entra', vista !== ultimaVista);
  ultimaVista = vista;
  tela.textContent = '';
  let i = 0; // a ordem de entrada conta os nós de dentro de cada lado
  nos.forEach(n => {
    tela.appendChild(n);
    (n.classList.contains('lado') ? Array.prototype.slice.call(n.children) : [n]).forEach(f => f.style.setProperty('--i', i++));
  });
  encaixarTudo();
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
window.addEventListener('hashchange', e => {
  comoFoi = null; apagando = false;
  // a arara lembra as peças passadas só no vai e volta com "é sua"
  if (rotaAtual() === 'arara' && (e.oldURL.split('#')[1] || '').replace(/^\/?/, '').split('/')[0] !== 'sua') araraPassadas = [];
  desenhar();
});
document.addEventListener('keydown', e => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return; // Alt+seta é o voltar do navegador
  if (aberta || !document.getElementById('drop') || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  e.preventDefault();
  if (e.key === 'ArrowRight') pegarPeca(); else passarPeca();
});
document.addEventListener('touchstart', () => {}, { passive: true }); // o Safari do iPhone só mostra :active (o toque do botão) com um ouvinte de toque
window.addEventListener('resize', encaixarTudo);
document.fonts.load('700 100px "Inter Tight"').then(encaixarTudo, () => {}); // antes de a fonte chegar a medida sai com a fonte reserva
aplicarRealce();
abertura();
atualizarConta();
desenhar();
setInterval(tique, 200);
