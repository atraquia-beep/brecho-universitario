const test = require('node:test'); const assert = require('node:assert/strict');
const L = require('../logica.js'); const D = require('../dados.js');
const deco = { nome: 'Deco', tamanho: 'M', pegadas: ['vintage', 'street'], teto: 40, curso: 'Administração', email: 'd000000@dac.unicamp.br' };
test('emailValido', () => {
  for (const [e, ok] of [['d000000@dac.unicamp.br', true], ['a@unicamp.br', true], ['A@DAC.UNICAMP.BR', true], ['a@gmail.com', false], ['a@unicamp.br.evil.com', false], ['a@xunicamp.br', false], ['@dac.unicamp.br', false], ['a b@unicamp.br', false], ['', false]]) assert.equal(L.emailValido(e), ok, e);
});
test('serve, extenso, dinheiro', () => {
  const ana = D.CATALOGO[0];
  assert.deepEqual([L.serve(ana, deco), L.serve(ana, { ...deco, teto: 30 }), L.serve(ana, { ...deco, teto: null }), L.serve(ana, { ...deco, tamanho: 'G' }), L.serve(ana, { ...deco, pegadas: ['social'] })], [true, false, true, false, false]);
  assert.deepEqual([L.extenso(1, 'f'), L.extenso(2, 'f'), L.extenso(2, 'm'), L.extenso(5, 'f'), L.extenso(13, 'f'), L.extenso(14, 'f'), L.extenso(20, 'm'), L.extenso(21, 'f')], ['uma', 'duas', 'dois', 'cinco', 'treze', 'catorze', 'vinte', '21']);
  assert.deepEqual([L.dinheiro(35), L.dinheiro(31.5), L.dinheiro(0)], ['R$ 35', 'R$ 31,50', 'R$ 0']);
});
test('entenderPedido', () => {
  assert.deepEqual(L.entenderPedido('preciso de um blazer M pra entrevista de quinta, até 40', deco), { tipos: ['blazer'], tamanho: 'M', teto: 40 });
  assert.deepEqual(L.entenderPedido('ALGO PARA A FESTA de sábado', { ...deco, tamanho: 'G', teto: null }), { tipos: D.OCASIOES.festa, tamanho: 'G', teto: null });
  const m = L.entenderPedido('moletom tamanho g até R$ 60!!!', deco); assert.deepEqual([m.tipos, m.tamanho, m.teto], [['moletom'], 'G', 60]);
  assert.equal(L.entenderPedido('camisa p/ festa', deco).tamanho, 'M');
  assert.ok(L.entenderPedido('uma jaqueta para o frio', deco).tipos.includes('jaqueta jeans'));
  assert.deepEqual(L.entenderPedido('calca jeans pp', deco).tipos, ['calça jeans']); assert.equal(L.entenderPedido('calca jeans pp', deco).tamanho, 'PP');
  assert.deepEqual(L.entenderPedido('preciso de um terno', deco).tipos, []); assert.deepEqual(L.entenderPedido('   ', deco).tipos, []);
  assert.deepEqual(L.entenderPedido('<img src=x onerror=alert(1)> BLAZER até r$40', deco), { tipos: ['blazer'], tamanho: 'M', teto: 40 });
  assert.deepEqual(L.entenderPedido('uma jaqueta jeans', deco).tipos, ['jaqueta jeans']);
  assert.deepEqual(L.entenderPedido('uma camisa', deco).tipos, ['camisa social', 'camisa xadrez']);
  assert.equal(L.entenderPedido('quero gg', deco).tamanho, 'GG');
});
test('buscar', () => {
  const pedido = { tipos: ['blazer'], tamanho: 'M', teto: 40 };
  assert.deepEqual(L.buscar(D.CATALOGO, pedido, []).map(p => p.id), ['blazer-preto-rafa', 'blazer-bege-carol']);
  assert.deepEqual(L.buscar(D.CATALOGO, pedido, ['blazer-preto-rafa']).map(p => p.id), ['blazer-bege-carol']);
  assert.deepEqual(L.buscar(D.CATALOGO, { ...pedido, tipos: [] }, []), []);
  assert.ok(L.buscar(D.CATALOGO, { tipos: D.OCASIOES.festa, tamanho: 'M', teto: 40 }, []).length >= 1);
});
test('ordenarPilha: o pedido, depois o que serve, depois o resto', () => {
  const p = L.ordenarPilha(D.CATALOGO, deco, null, []);
  assert.equal(p.length, 14); assert.equal(p[0].id, 'jaqueta-jeans-ana');
  assert.ok(p.slice(0, 5).every(x => L.serve(x, deco)) && p.slice(5).every(x => !L.serve(x, deco)));
  const q = L.ordenarPilha(D.CATALOGO, deco, 'um blazer para a entrevista de quinta', []);
  assert.deepEqual(q.slice(0, 2).map(x => x.id), ['blazer-preto-rafa', 'blazer-bege-carol']);
  assert.ok(q.slice(2, 7).every(x => L.serve(x, deco))); assert.equal(new Set(q.map(x => x.id)).size, 14);
  const r = L.ordenarPilha(D.CATALOGO, deco, 'preciso de um terno', ['jaqueta-jeans-ana']);
  assert.equal(r.length, 13); assert.ok(!r.some(x => x.id === 'jaqueta-jeans-ana') && L.serve(r[0], deco));
  assert.equal(L.ordenarPilha(D.CATALOGO, { ...deco, tamanho: 'GG', pegadas: ['esportivo'], teto: 20 }, null, []).length, 14);
});
test('sugerirPreco', () => {
  assert.deepEqual(L.sugerirPreco('jaqueta jeans', 'pouco uso'), { min: 30, max: 40, sugerido: 35 });
  assert.ok(L.sugerirPreco('jaqueta jeans', 'novo com etiqueta').sugerido > 35 && L.sugerirPreco('jaqueta jeans', 'usado').sugerido < 35);
  for (const t of Object.keys(D.TIPOS)) for (const e of D.ESTADOS) { const s = L.sugerirPreco(t, e); assert.ok(s.min >= 5 && s.min < s.max && s.min <= s.sugerido && s.sugerido <= s.max && [s.min, s.max, s.sugerido].every(v => v % 5 === 0), t + ' ' + e); }
});
test('passagem: lugares deslizam de lado, folhas sobem e descem', () => {
  const p = L.passagem;
  assert.equal(p('', 'arara'), 'ida');
  assert.equal(p('arara', ''), 'volta');
  assert.equal(p('', 'voce'), 'ida');
  assert.equal(p('voce', ''), 'volta');
  assert.equal(p('arara', 'voce'), 'ida');
  assert.equal(p('', 'sua'), 'sobe');
  assert.equal(p('arara', 'sua'), 'sobe');
  assert.equal(p('voce', 'sua'), 'sobe');
  assert.equal(p('', 'vender'), 'sobe');
  assert.equal(p('sua', 'arara'), 'desce');
  assert.equal(p('sua', ''), 'desce');
  assert.equal(p('vender', ''), 'desce');
  assert.equal(p('vender', 'voce'), 'desce');
  assert.equal(p('arara', 'arara'), null);
  assert.equal(p('sua', 'sua'), null);
});
