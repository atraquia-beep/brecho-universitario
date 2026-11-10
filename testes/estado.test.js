const test = require('node:test'); const assert = require('node:assert/strict'); const L = require('../logica.js');
const congelar = o => { Object.values(o).forEach(v => v && typeof v === 'object' && congelar(v)); return Object.freeze(o); };
const com = extra => congelar({ ...L.estadoInicial(), ...extra });
const Q = 'quinta, das 12h às 13h', T = 'terça, das 12h às 13h';
test('estadoInicial', () => assert.deepEqual(L.estadoInicial(), { perfil: null, creditos: 0, reservas: [], anuncios: [], pedido: null, acordar: false, realce: '#FF0000', ultimoAnuncioSeg: null, ensaio: null, drop: null }));
test('valorVenda: comissão de 10%', () => { assert.deepEqual(L.valorVenda(35), { pix: 31.5, creditos: 35 }); assert.deepEqual(L.valorVenda(18), { pix: 16.2, creditos: 18 }); });
test('janelasDeRetirada', () => {
  assert.deepEqual(L.janelasDeRetirada(new Date(2026, 10, 10, 9, 0)), [T, Q]);   // terça 9h
  assert.deepEqual(L.janelasDeRetirada(new Date(2026, 10, 10, 12, 0)), [Q, T]);  // terça 12h
  assert.deepEqual(L.janelasDeRetirada(new Date(2026, 10, 12, 11, 59)), [Q, T]); // quinta 11h59
  assert.deepEqual(L.janelasDeRetirada(new Date(2026, 10, 11, 20, 5)), [Q, T]);  // quarta, durante o drop
  assert.deepEqual(L.janelasDeRetirada(new Date(2026, 10, 14, 20, 0)), [T, Q]);  // sábado
});
test('gerarCodigo', () => { assert.equal(L.gerarCodigo(() => 0), 'AAAA'); for (let i = 0; i < 50; i++) assert.match(L.gerarCodigo(), /^[A-HJKMNP-Z2-9]{4}$/); });
test('reservar usa créditos primeiro e não duplica', () => {
  const e = L.reservar(com({ creditos: 35 }), { id: 'x', preco: 38 }, Q, '4K7P', 1000);
  assert.equal(e.creditos, 0);
  assert.deepEqual(e.reservas, [{ pecaId: 'x', codigo: '4K7P', janela: Q, creditosUsados: 35, aPagar: 3, retirada: false, nota: null, drop: 1000 }]);
  assert.deepEqual(L.reservar(congelar(e), { id: 'x', preco: 38 }, T, 'ZZZZ', 1000), e);
  assert.deepEqual(L.indisponiveis(e), ['x']);
  const sobra = L.reservar(com({ creditos: 35 }), { id: 'y', preco: 30 }, Q, 'AAAA'); assert.deepEqual([sobra.creditos, sobra.reservas[0].aPagar, sobra.reservas[0].drop], [5, 0, null]);
  const semCredito = L.reservar(com({}), { id: 'z', preco: 35 }, Q, 'AAAA'); assert.deepEqual([semCredito.reservas[0].creditosUsados, semCredito.reservas[0].aPagar], [0, 35]);
});
test('trocarJanela, cancelar e retirar', () => {
  let e = L.reservar(com({ creditos: 35 }), { id: 'x', preco: 38 }, T, '4K7P');
  assert.equal(L.trocarJanela(congelar(e), 'x', Q).reservas[0].janela, Q);
  const c = L.cancelarReserva(congelar(e), 'x'); assert.deepEqual([c.creditos, c.reservas, L.indisponiveis(c)], [35, [], []]);
  assert.deepEqual(L.cancelarReserva(congelar(e), 'nao-existe'), e);
  e = L.confirmarRetirada(congelar(e), 'x', 'ótimo');
  assert.deepEqual([e.reservas[0].retirada, e.reservas[0].nota, L.contadorDoCurso(e), L.indisponiveis(e)], [true, 'ótimo', 129, ['x']]);
  assert.equal(L.contadorDoCurso(L.confirmarRetirada(congelar(e), 'x', 'ruim')), 129);
  assert.deepEqual(L.cancelarReserva(congelar(e), 'x'), e);
  assert.equal(L.contadorDoCurso(L.estadoInicial()), 128);
});
test('anunciar e venda simulada', () => {
  const dados = { tipo: 'jaqueta jeans', tamanho: 'M', estado: 'pouco uso', preco: 35, foto: 'fotos/exemplo-venda.jpg', receber: 'creditos' };
  const e = L.anunciar(com({}), dados, 19, 500);
  assert.deepEqual(e.anuncios, [{ id: 'a1', ...dados, criadoEm: 500, vendida: false }]); assert.equal(e.ultimoAnuncioSeg, 19);
  assert.equal(L.anuncioEsperando(e, 1000).id, 'a1'); assert.equal(L.anuncioEsperando(e, 500), null);
  assert.deepEqual(L.venderSimulado(congelar(e), 500), e);
  const c = L.venderSimulado(congelar(e), 1000); assert.deepEqual([c.creditos, c.anuncios[0].vendida, L.anuncioEsperando(c, 1000)], [35, true, null]);
  assert.deepEqual(L.venderSimulado(congelar(c), 1000), c);
  const p = L.venderSimulado(L.anunciar(com({}), { ...dados, receber: 'pix' }, 12, 500), 1000); assert.deepEqual([p.creditos, p.anuncios[0].vendida], [0, true]);
  assert.equal(L.anunciar(congelar(c), { ...dados, tipo: 'moletom' }, 12, 2000).anuncios[1].id, 'a2');
});
test('pedido e acordar', () => {
  const e = L.pedir(com({}), '  um blazer  '); assert.equal(e.pedido, 'um blazer');
  assert.equal(L.esquecerPedido(congelar(e)).pedido, null); assert.equal(L.pedirParaAcordar(com({})).acordar, true);
});
test('quando nada muda, devolve o mesmo estado', () => {
  const e = com({ pedido: 'um blazer', acordar: true, reservas: [{ pecaId: 'x', codigo: 'AAAA', janela: T, creditosUsados: 0, aPagar: 10, retirada: false, nota: null, drop: null }] });
  assert.equal(L.pedir(e, ' um blazer '), e); assert.equal(L.pedirParaAcordar(e), e);
  assert.equal(L.trocarJanela(e, 'x', T), e); assert.equal(L.trocarJanela(e, 'nao-existe', Q), e);
  const v = com({}); assert.equal(L.esquecerPedido(v), v);
});
