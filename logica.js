// Tudo dentro de uma função: o único nome global que sobra é Logica (scripts clássicos dividem escopo).
const Logica = (() => {
const D = typeof require !== 'undefined' ? require('./dados.js') : DADOS;
const Logica = {};

const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const multiplo5 = n => Math.round(n / 5) * 5;

Logica.emailValido = email => /^[^\s@]+@(dac\.)?unicamp\.br$/i.test(email);

Logica.serve = (peca, perfil) => peca.tamanho === perfil.tamanho
  && (perfil.teto === null || peca.preco <= perfil.teto)
  && peca.pegadas.some(g => perfil.pegadas.includes(g));

const NUMEROS = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove', 'vinte'];
Logica.extenso = (n, genero) => {
  if (!(n >= 1 && n <= 20)) return String(n);
  if (genero === 'f' && n <= 2) return n === 1 ? 'uma' : 'duas';
  return NUMEROS[n];
};

Logica.dinheiro = valor => 'R$ ' + (Number.isInteger(valor) ? String(valor) : valor.toFixed(2).replace('.', ','));

Logica.entenderPedido = (texto, perfil) => {
  const t = semAcento(texto);
  const nomes = Object.keys(D.TIPOS);
  const achar = ach => nomes.filter(ach);
  let tipos = achar(n => t.includes(semAcento(n)));
  if (!tipos.length) tipos = achar(n => D.TIPOS[n].sinonimos.some(s => t.includes(semAcento(s))));
  if (!tipos.length) {
    const citadas = Object.keys(D.OCASIOES).filter(o => t.includes(semAcento(o)));
    tipos = achar(n => citadas.some(o => D.OCASIOES[o].includes(n)));
  }
  const tam = t.match(/(?:^|[^a-z0-9])(pp|p|m|g|gg)(?![a-z0-9/])/);
  const ate = t.match(/(?:^|[^a-z0-9])ate\s*(?:r\$\s*)?(\d+)/);
  return { tipos, tamanho: tam ? tam[1].toUpperCase() : perfil.tamanho, teto: ate ? Number(ate[1]) : perfil.teto };
};

Logica.buscar = (catalogo, pedido, fora) => catalogo.filter(p => pedido.tipos.includes(p.tipo)
  && p.tamanho === pedido.tamanho && (pedido.teto === null || p.preco <= pedido.teto) && !fora.includes(p.id));

Logica.ordenarPilha = (catalogo, perfil, textoDoPedido, fora) => {
  const resto = catalogo.filter(p => !fora.includes(p.id));
  const pedidas = textoDoPedido ? Logica.buscar(resto, Logica.entenderPedido(textoDoPedido, perfil), []) : [];
  const grupo = p => pedidas.includes(p) ? 0 : Logica.serve(p, perfil) ? 1 : 2;
  return resto.map((p, i) => [p, i]).sort((a, b) => grupo(a[0]) - grupo(b[0]) || a[1] - b[1]).map(x => x[0]);
};

Logica.sugerirPreco = (tipo, estado) => {
  const f = estado === 'novo com etiqueta' ? 1.3 : estado === 'usado' ? 0.7 : 1;
  const min = Math.max(5, multiplo5(D.TIPOS[tipo].faixa[0] * f));
  const max = Math.max(min + 5, multiplo5(D.TIPOS[tipo].faixa[1] * f));
  return { min, max, sugerido: multiplo5((min + max) / 2) };
};

Logica.estadoInicial = () => ({ perfil: null, creditos: 0, reservas: [], anuncios: [], pedido: null, acordar: false, realce: '#FF0000', ultimoAnuncioSeg: null, ensaio: null, drop: null });

Logica.valorVenda = preco => ({ pix: Math.round(preco * (1 - D.COMISSAO) * 100) / 100, creditos: preco });

const JANELAS = { 2: 'terça, das 12h às 13h', 4: 'quinta, das 12h às 13h' };
Logica.janelasDeRetirada = agora => {
  const achadas = [];
  for (let dia = 0; achadas.length < 2; dia++) {
    const janela = JANELAS[(agora.getDay() + dia) % 7];
    if (janela && (dia > 0 || agora.getHours() < 12)) achadas.push(janela);
  }
  return achadas;
};

const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
Logica.gerarCodigo = (rand = Math.random) => {
  let codigo = '';
  for (let i = 0; i < 4; i++) codigo += ALFABETO[Math.floor(rand() * ALFABETO.length)];
  return codigo;
};

const reserva = (estado, pecaId) => estado.reservas.find(r => r.pecaId === pecaId);
const trocarReserva = (estado, pecaId, mudanca) => ({ ...estado, reservas: estado.reservas.map(r => r.pecaId === pecaId ? { ...r, ...mudanca } : r) });

Logica.reservar = (estado, peca, janela, codigo, dropInicio = null) => {
  if (reserva(estado, peca.id)) return estado;
  const creditosUsados = Math.min(estado.creditos, peca.preco);
  const nova = { pecaId: peca.id, codigo, janela, creditosUsados, aPagar: peca.preco - creditosUsados, retirada: false, nota: null, drop: dropInicio };
  return { ...estado, creditos: estado.creditos - creditosUsados, reservas: [...estado.reservas, nova] };
};

Logica.trocarJanela = (estado, pecaId, janela) => {
  const r = reserva(estado, pecaId);
  return !r || r.janela === janela ? estado : trocarReserva(estado, pecaId, { janela });
};

Logica.cancelarReserva = (estado, pecaId) => {
  const r = reserva(estado, pecaId);
  if (!r || r.retirada) return estado;
  return { ...estado, creditos: estado.creditos + r.creditosUsados, reservas: estado.reservas.filter(x => x !== r) };
};

Logica.confirmarRetirada = (estado, pecaId, nota) => {
  const r = reserva(estado, pecaId);
  return !r || r.retirada ? estado : trocarReserva(estado, pecaId, { retirada: true, nota });
};

Logica.indisponiveis = estado => estado.reservas.map(r => r.pecaId);

Logica.contadorDoCurso = estado => D.CONTADOR_BASE + estado.reservas.filter(r => r.retirada).length;

Logica.anunciar = (estado, dados, segundos, agoraMs) => {
  const anuncio = { id: 'a' + (estado.anuncios.length + 1), ...dados, criadoEm: agoraMs, vendida: false };
  return { ...estado, anuncios: [...estado.anuncios, anuncio], ultimoAnuncioSeg: segundos };
};

Logica.anuncioEsperando = (estado, dropInicio) => estado.anuncios.find(a => !a.vendida && a.criadoEm < dropInicio) || null;

Logica.venderSimulado = (estado, dropInicio) => {
  const a = Logica.anuncioEsperando(estado, dropInicio);
  if (!a) return estado;
  return {
    ...estado,
    creditos: estado.creditos + (a.receber === 'creditos' ? a.preco : 0),
    anuncios: estado.anuncios.map(x => x === a ? { ...x, vendida: true } : x),
  };
};

Logica.pedir = (estado, texto) => estado.pedido === texto.trim() ? estado : { ...estado, pedido: texto.trim() };
Logica.esquecerPedido = estado => estado.pedido === null ? estado : { ...estado, pedido: null };
Logica.pedirParaAcordar = estado => estado.acordar ? estado : { ...estado, acordar: true };

const dois = n => String(n).padStart(2, '0');
const segundosAcima = ms => Math.ceil(Math.max(0, ms) / 1000);
const DIAS_DA_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

Logica.dropDoCalendario = agoraMs => {
  const { dias, hora, duracaoMs } = D.DROP;
  for (let i = 0; ; i++) {
    const dia = new Date(agoraMs);
    dia.setDate(dia.getDate() + i);
    if (!dias.includes(dia.getDay())) continue;
    const inicio = dia.setHours(hora, 0, 0, 0);
    if (agoraMs < inicio + duracaoMs) return inicio;
  }
};

Logica.contagem = ms => {
  if (ms >= 48 * 3600e3) return Math.floor(ms / (24 * 3600e3)) + ' dias';
  const s = segundosAcima(ms);
  return dois(Math.floor(s / 3600)) + ':' + dois(Math.floor(s / 60) % 60) + ':' + dois(s % 60);
};

Logica.relogio = ms => { const s = segundosAcima(ms); return dois(Math.floor(s / 60)) + ':' + dois(s % 60); };

Logica.diaDaSemana = ms => DIAS_DA_SEMANA[new Date(ms).getDay()];
Logica.DIAS_DA_SEMANA = DIAS_DA_SEMANA;

Logica.ensaiar = (estado, agoraMs) => ({ ...estado, ensaio: agoraMs + D.DROP.ensaioMs });

Logica.situacao = (estado, agoraMs) => {
  const { duracaoMs } = D.DROP, drop = estado.drop;
  const ensaioVale = estado.ensaio != null && agoraMs < estado.ensaio + duracaoMs;
  let inicio = ensaioVale ? estado.ensaio : Logica.dropDoCalendario(agoraMs);
  let ensaio = ensaioVale;
  // drop já fechado pela pessoa: a espera aponta para o próximo do calendário
  if (drop && drop.fechado && drop.inicio === inicio) { inicio = Logica.dropDoCalendario(inicio + duracaoMs); ensaio = false; }
  // drop aberto que terminou (pilha vazia ou tempo esgotado) e ainda não foi fechado: mostra o fim uma vez
  if (drop && !drop.fechado && (drop.fim || agoraMs >= drop.inicio + duracaoMs)) return { tela: 'fim', inicio: drop.inicio, faltaMs: 0, ensaio };
  const noAr = agoraMs >= inicio && agoraMs < inicio + duracaoMs;
  return { tela: noAr ? 'no-ar' : 'espera', inicio, faltaMs: noAr ? inicio + duracaoMs - agoraMs : inicio - agoraMs, ensaio };
};

const comDrop = (estado, mudanca) => ({ ...estado, drop: { ...estado.drop, ...mudanca } });

Logica.abrirDrop = (estado, inicio) => estado.drop && estado.drop.inicio === inicio ? estado
  : { ...estado, drop: { inicio, passadas: [], levadas: [], fim: false, fechado: false } };

Logica.passar = (estado, pecaId) => !estado.drop || estado.drop.passadas.includes(pecaId) ? estado
  : comDrop(estado, { passadas: [...estado.drop.passadas, pecaId] });

Logica.levarUma = (estado, pilha) => {
  if (!estado.drop || pilha.length < 2) return estado;
  const id = pilha[pilha.length - 1].id;
  return estado.drop.levadas.includes(id) ? estado : comDrop(estado, { levadas: [...estado.drop.levadas, id] });
};

Logica.terminarDrop = estado => !estado.drop || estado.drop.fim ? estado : comDrop(estado, { fim: true });

Logica.fecharDrop = estado => !estado.drop || (estado.drop.fechado && estado.ensaio === null && estado.pedido === null) ? estado
  : { ...comDrop(estado, { fechado: true }), ensaio: null, pedido: null };

const dropAberto = estado => estado.drop && !estado.drop.fechado ? estado.drop : null;

Logica.foraDaPilha = estado => {
  const drop = dropAberto(estado);
  return Logica.indisponiveis(estado).concat(drop ? drop.passadas.concat(drop.levadas) : []);
};

Logica.placar = (estado, catalogo) => {
  const inicio = estado.drop ? estado.drop.inicio : null;
  const doDrop = estado.reservas.filter(r => inicio !== null && r.drop === inicio);
  const foraDeste = estado.reservas.filter(r => !doDrop.includes(r)).map(r => r.pecaId);
  return {
    foram: (estado.drop ? estado.drop.levadas.length : 0) + doDrop.length,
    total: catalogo.filter(p => !foraDeste.includes(p.id)).length,
  };
};

return Logica;
})();

if (typeof module !== 'undefined') module.exports = Logica;
