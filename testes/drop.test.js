const test = require('node:test'); const assert = require('node:assert/strict'); const L = require('../logica.js'); const D = require('../dados.js');
const congelar = o => { Object.values(o).forEach(v => v && typeof v === 'object' && congelar(v)); return Object.freeze(o); };
const com = extra => congelar({ ...L.estadoInicial(), ...extra });
const t = (dia, h, m = 0, s = 0) => new Date(2026, 10, dia, h, m, s).getTime(); // novembro de 2026: dia 9 é segunda, 10 é terça
const H = 3600e3, deco = { nome: 'Deco', tamanho: 'M', pegadas: ['vintage', 'street'], teto: 40, curso: 'Administração', email: 'd000000@dac.unicamp.br' };
test('dropDoCalendario: segunda e quarta, 20h', () => {
  assert.equal(L.dropDoCalendario(t(10, 9)), t(11, 20));
  assert.equal(L.dropDoCalendario(t(9, 19, 59)), t(9, 20));
  assert.equal(L.dropDoCalendario(t(9, 20, 5)), t(9, 20));
  assert.equal(L.dropDoCalendario(t(9, 20, 10)), t(11, 20));
  assert.equal(L.dropDoCalendario(t(11, 20, 10)), t(16, 20));
  assert.equal(L.dropDoCalendario(t(14, 12)), t(16, 20));
});
test('contagem, relogio, diaDaSemana', () => {
  assert.deepEqual([35 * H, 2 * H + 14 * 60e3 + 9e3, 10000, 999, 0, 48 * H - 1000].map(L.contagem), ['35:00:00', '02:14:09', '00:00:10', '00:00:01', '00:00:00', '47:59:59']);
  assert.deepEqual([48 * H, 5 * 24 * H - 1000].map(L.contagem), ['2 dias', '4 dias']);
  assert.deepEqual([600000, 581000, 12000, 3000, 200, 0].map(L.relogio), ['10:00', '09:41', '00:12', '00:03', '00:01', '00:00']);
  assert.deepEqual([t(11, 20), t(16, 20), t(14, 12), t(10, 9)].map(L.diaDaSemana), ['quarta', 'segunda', 'sábado', 'terça']);
});
test('situacao: espera, no ar, ensaio', () => {
  assert.deepEqual(L.situacao(com({}), t(10, 9)), { tela: 'espera', inicio: t(11, 20), faltaMs: 35 * H, ensaio: false });
  assert.deepEqual(L.situacao(com({}), t(11, 20, 0, 19)), { tela: 'no-ar', inicio: t(11, 20), faltaMs: 581000, ensaio: false });
  const e = L.ensaiar(com({}), t(10, 9)); assert.equal(e.ensaio, t(10, 9, 0, 10));
  assert.deepEqual(L.situacao(e, t(10, 9)), { tela: 'espera', inicio: t(10, 9, 0, 10), faltaMs: 10000, ensaio: true });
  assert.deepEqual(L.situacao(e, t(10, 9, 0, 10)), { tela: 'no-ar', inicio: t(10, 9, 0, 10), faltaMs: 600000, ensaio: true });
  assert.deepEqual(L.situacao(e, t(10, 10)), { tela: 'espera', inicio: t(11, 20), faltaMs: 34 * H, ensaio: false }); // ensaio velho, nunca aberto
});
test('abrir, terminar e fechar o drop', () => {
  const e = L.ensaiar(com({ pedido: 'um blazer' }), t(10, 9)), a = L.abrirDrop(congelar(e), e.ensaio);
  assert.deepEqual(a.drop, { inicio: e.ensaio, passadas: [], levadas: [], fim: false, fechado: false });
  assert.deepEqual(L.abrirDrop(congelar(a), e.ensaio), a);
  assert.equal(L.situacao(a, t(10, 9, 5)).tela, 'no-ar');
  assert.equal(L.situacao(L.terminarDrop(congelar(a)), t(10, 9, 1)).tela, 'fim');      // pilha acabou
  assert.equal(L.situacao(a, t(10, 9, 10, 10)).tela, 'fim');                            // tempo acabou
  assert.equal(L.situacao(a, t(11, 21)).tela, 'fim');                                   // acabou com o app fechado
  const f = L.fecharDrop(L.terminarDrop(congelar(a)));
  assert.deepEqual([f.drop.fechado, f.ensaio, f.pedido], [true, null, null]);
  assert.deepEqual(L.situacao(f, t(10, 9, 1)), { tela: 'espera', inicio: t(11, 20), faltaMs: t(11, 20) - t(10, 9, 1), ensaio: false });
  assert.equal(L.abrirDrop(congelar(f), t(11, 20)).drop.inicio, t(11, 20));             // drop novo zera a pilha
  const cedo = L.fecharDrop(L.terminarDrop(L.abrirDrop(com({}), t(9, 20))));            // drop do calendário fechado aos 3 min
  assert.deepEqual(L.situacao(cedo, t(9, 20, 3)), { tela: 'espera', inicio: t(11, 20), faltaMs: t(11, 20) - t(9, 20, 3), ensaio: false });
});
test('passar, levar, fora da pilha e placar', () => {
  const pilha = L.ordenarPilha(D.CATALOGO, deco, null, []);
  let e = L.abrirDrop(com({ perfil: deco }), 1000);
  e = L.passar(congelar(e), pilha[0].id); assert.deepEqual(L.passar(congelar(e), pilha[0].id), e);
  e = L.levarUma(congelar(e), pilha.slice(1)); assert.deepEqual(e.drop.levadas, [pilha[13].id]);
  assert.deepEqual(L.levarUma(congelar(e), [pilha[1]]), e); assert.deepEqual(L.levarUma(congelar(e), []), e);
  assert.deepEqual(L.foraDaPilha(e).sort(), [pilha[0].id, pilha[13].id].sort());
  assert.deepEqual(L.placar(e, D.CATALOGO), { foram: 1, total: 14 });
  e = L.reservar(congelar(e), pilha[1], 'terça, das 12h às 13h', 'AAAA', 1000);
  assert.deepEqual(L.placar(e, D.CATALOGO), { foram: 2, total: 14 }); assert.ok(L.foraDaPilha(e).includes(pilha[1].id));
  assert.deepEqual(L.foraDaPilha(L.fecharDrop(congelar(e))), [pilha[1].id]);
  const velho = L.abrirDrop(L.reservar(com({}), pilha[2], 'terça, das 12h às 13h', 'BBBB', 5), 1000);
  assert.deepEqual(L.placar(velho, D.CATALOGO), { foram: 0, total: 13 });
  assert.deepEqual(L.foraDaPilha(L.reservar(com({}), pilha[2], 'terça, das 12h às 13h', 'BBBB')), [pilha[2].id]);
});
test('sem mudança, devolve o mesmo estado (identidade); sem drop, tolera null', () => {
  const pilha = L.ordenarPilha(D.CATALOGO, deco, null, []);
  const a = L.abrirDrop(com({ perfil: deco }), 1000), e = L.passar(a, pilha[0].id), z = L.estadoInicial();
  assert.equal(L.abrirDrop(a, a.drop.inicio), a);
  assert.equal(L.passar(e, pilha[0].id), e);
  assert.equal(L.levarUma(e, [pilha[1]]), e);
  assert.equal(L.levarUma(e, []), e);
  const fim = L.terminarDrop(a); assert.equal(L.terminarDrop(fim), fim);
  const fechado = L.fecharDrop(fim); assert.equal(L.fecharDrop(fechado), fechado);
  assert.equal(L.passar(z, 'x'), z); assert.equal(L.levarUma(z, pilha), z);
  assert.equal(L.terminarDrop(z), z); assert.equal(L.fecharDrop(z), z);
  assert.deepEqual(L.foraDaPilha(z), []); assert.deepEqual(L.placar(z, D.CATALOGO), { foram: 0, total: 14 });
  assert.deepEqual([L.contagem(-5), L.relogio(-5)], ['00:00:00', '00:00']);
});
