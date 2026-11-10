const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const path = require('node:path');
const D = require('../dados.js'); const raiz = path.join(__dirname, '..');
test('catálogo íntegro', () => {
  assert.equal(D.CATALOGO.length, 14);
  assert.equal(new Set(D.CATALOGO.map(p => p.id)).size, 14);
  for (const p of D.CATALOGO) {
    assert.ok(fs.statSync(path.join(raiz, p.foto)).size < 200_000, p.foto);
    assert.ok(D.TIPOS[p.tipo] && D.TAMANHOS.includes(p.tamanho) && D.ESTADOS.includes(p.estado), p.id);
    assert.ok(Number.isInteger(p.preco) && p.preco >= 10 && p.preco <= 80, p.id);
    assert.ok(p.pegadas.length && p.pegadas.every(x => D.PEGADAS.includes(x)), p.id);
    assert.ok(p.alt && p.nome && p.vendedor.nome && ['a', 'o'].includes(p.vendedor.artigo) && D.CURSOS.includes(p.vendedor.curso), p.id);
  }
});
test('tabelas', () => {
  for (const t of Object.values(D.TIPOS)) { assert.ok(['um', 'uma'].includes(t.artigo) && ['m', 'f'].includes(t.genero) && t.sinonimos.length); assert.ok(t.faixa[0] >= 10 && t.faixa[0] < t.faixa[1] && t.faixa.every(v => v % 5 === 0)); }
  assert.deepEqual(D.TIPOS['jaqueta jeans'].faixa, [30, 40]); assert.equal(D.TIPOS.terno, undefined);
  const sin = t => D.TIPOS[t].sinonimos;
  assert.ok(sin('jaqueta jeans').includes('jaqueta') && sin('jaqueta de couro').includes('jaqueta') && !sin('jaqueta jeans').includes('jeans'));
  assert.ok(!Object.values(D.TIPOS).some(t => t.sinonimos.includes('terno')));
  for (const lista of Object.values(D.OCASIOES)) assert.ok(lista.length && lista.every(t => D.TIPOS[t]));
  assert.ok(D.OCASIOES.festa.includes('jaqueta jeans'));
  assert.deepEqual(D.PALPITES[0], { tipo: 'jaqueta jeans', estado: 'pouco uso' });
  assert.equal(D.CORES.length, 5); assert.equal(D.CORES[0].hex, '#FF0000'); assert.equal(D.CONTADOR_BASE, 128); assert.equal(D.COMISSAO, 0.10);
  assert.deepEqual(D.DROP, { dias: [1, 3], hora: 20, duracaoMs: 600000, ensaioMs: 10000, levaACadaMs: 8000, vendaAposMs: 5000, online: 23, esperando: 38 });
});
test('distribuição que o roteiro precisa', () => {
  const de = t => D.CATALOGO.filter(p => p.tamanho === t).length;
  assert.ok(de('P') >= 2 && de('M') >= 3 && de('G') >= 2 && de('PP') >= 1 && de('GG') >= 1);
  const roteiro = p => p.tamanho === 'M' && p.preco <= 40 && p.pegadas.some(x => ['vintage', 'street'].includes(x));
  assert.equal(D.CATALOGO.filter(roteiro).length, 5);
  assert.deepEqual(D.CATALOGO.filter(p => p.tipo === 'blazer' && p.tamanho === 'M' && p.preco <= 40).map(p => p.id), ['blazer-preto-rafa', 'blazer-bege-carol']);
  assert.equal(D.CATALOGO.filter(p => p.tamanho === 'GG' && p.preco <= 20 && p.pegadas.includes('esportivo')).length, 0);
  const a = D.CATALOGO[0];
  assert.deepEqual([a.id, a.nome, a.tipo, a.tamanho, a.preco, a.estado, a.vendedor.nome, a.vendedor.artigo, a.vendedor.curso, a.vendedor.nota, a.vendedor.vendas], ['jaqueta-jeans-ana', 'Jaqueta jeans', 'jaqueta jeans', 'M', 35, 'pouco uso', 'Ana', 'a', 'Administração', 4.8, 12]);
  const rafa = D.CATALOGO.find(p => p.id === 'blazer-preto-rafa'), carol = D.CATALOGO.find(p => p.id === 'blazer-bege-carol');
  assert.deepEqual([rafa.nome, rafa.preco, rafa.estado, rafa.pegadas, rafa.vendedor.nome, rafa.vendedor.artigo], ['Blazer preto', 38, 'pouco uso', ['social'], 'Rafa', 'o']);
  assert.deepEqual([carol.preco, carol.pegadas], [30, ['social']]);
});
test('créditos das fotos', () => { const c = fs.readFileSync(path.join(raiz, 'fotos/CREDITOS.md'), 'utf8'); for (const p of D.CATALOGO) assert.ok(c.includes(path.basename(p.foto)), p.foto); });
