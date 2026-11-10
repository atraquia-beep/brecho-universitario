const DADOS = {
  TAMANHOS: ['PP', 'P', 'M', 'G', 'GG'],
  PEGADAS: ['básico', 'vintage', 'street', 'social', 'esportivo'],
  TETOS: [20, 40, 60, 80, null],
  ESTADOS: ['novo com etiqueta', 'pouco uso', 'usado'],
  CURSOS: ['Administração', 'Administração Pública', 'Ciências do Esporte', 'Engenharia de Manufatura', 'Engenharia de Produção', 'Nutrição', 'Engenharia Ambiental', 'Engenharia de Telecomunicações', 'Engenharia de Transportes', 'Sistemas de Informação', 'Análise e Desenvolvimento de Sistemas', 'outro curso'],
  CORES: [{ nome: 'areia', hex: '#F0E4D6' }, { nome: 'verde', hex: '#DDEBD9' }, { nome: 'rosa', hex: '#F6DDE3' }, { nome: 'azul', hex: '#DCE8F5' }, { nome: 'amarelo', hex: '#F7EBC0' }],
  TIPOS: {
    'jaqueta jeans': { artigo: 'uma', genero: 'f', sinonimos: ['jaqueta'], faixa: [30, 40] },
    'jaqueta de couro': { artigo: 'uma', genero: 'f', sinonimos: ['jaqueta', 'couro'], faixa: [55, 70] },
    'blazer': { artigo: 'um', genero: 'm', sinonimos: ['paleto'], faixa: [30, 40] },
    'camiseta': { artigo: 'uma', genero: 'f', sinonimos: ['camisa basica', 'tshirt'], faixa: [10, 15] },
    'moletom': { artigo: 'um', genero: 'm', sinonimos: ['casaco de capuz', 'blusa de frio'], faixa: [30, 45] },
    'camisa social': { artigo: 'uma', genero: 'f', sinonimos: ['camisa', 'social'], faixa: [20, 30] },
    'camisa xadrez': { artigo: 'uma', genero: 'f', sinonimos: ['camisa', 'xadrez'], faixa: [20, 30] },
    'vestido': { artigo: 'um', genero: 'm', sinonimos: ['vestidinho'], faixa: [35, 50] },
    'calça jeans': { artigo: 'uma', genero: 'f', sinonimos: ['calca', 'jeans'], faixa: [30, 40] }
  },
  OCASIOES: {
    entrevista: ['blazer', 'camisa social', 'calça jeans'],
    festa: ['jaqueta jeans', 'jaqueta de couro', 'vestido'],
    frio: ['moletom', 'jaqueta de couro', 'jaqueta jeans', 'blazer'],
    treino: ['camiseta', 'moletom']
  },
  CATALOGO: [
    { id: 'jaqueta-jeans-ana', tipo: 'jaqueta jeans', nome: 'Jaqueta jeans', tamanho: 'M', preco: 35, estado: 'pouco uso', pegadas: ['vintage'], foto: 'fotos/jaqueta-jeans-ana.jpg', alt: 'Jaqueta jeans clara com gola de pelúcia, pendurada numa porta branca', vendedor: { nome: 'Ana', artigo: 'a', curso: 'Administração', nota: 4.8, vendas: 12 } },
    { id: 'blazer-preto-rafa', tipo: 'blazer', nome: 'Blazer preto', tamanho: 'M', preco: 38, estado: 'pouco uso', pegadas: ['social'], foto: 'fotos/blazer-preto.jpg', alt: 'Blazer preto sobre camisa branca num cabide, em cima de uma mesa de madeira', vendedor: { nome: 'Rafa', artigo: 'o', curso: 'Engenharia de Produção', nota: 4.7, vendas: 9 } },
    { id: 'blazer-bege-carol', tipo: 'blazer', nome: 'Blazer claro', tamanho: 'M', preco: 30, estado: 'usado', pegadas: ['social'], foto: 'fotos/blazer-bege.jpg', alt: 'Blazer cinza-esverdeado claro num cabide, pendurado numa passarela de vidro', vendedor: { nome: 'Carol', artigo: 'a', curso: 'Administração Pública', nota: 4.9, vendas: 21 } },
    { id: 'camisa-xadrez-leo', tipo: 'camisa xadrez', nome: 'Camisa xadrez', tamanho: 'M', preco: 25, estado: 'usado', pegadas: ['vintage'], foto: 'fotos/camisa-xadrez.jpg', alt: 'Camisa de flanela xadrez vermelha e preta num cabide, com duas mãos ao lado', vendedor: { nome: 'Leo', artigo: 'o', curso: 'Sistemas de Informação', nota: 4.6, vendas: 5 } },
    { id: 'moletom-preto-caio', tipo: 'moletom', nome: 'Moletom preto', tamanho: 'M', preco: 40, estado: 'pouco uso', pegadas: ['street'], foto: 'fotos/moletom-preto.jpg', alt: 'Moletom preto com estampa grande nas costas, pendurado num corrimão', vendedor: { nome: 'Caio', artigo: 'o', curso: 'Engenharia Ambiental', nota: 4.5, vendas: 7 } },
    { id: 'calca-jeans-duda', tipo: 'calça jeans', nome: 'Calça jeans', tamanho: 'M', preco: 35, estado: 'pouco uso', pegadas: ['street', 'básico'], foto: 'fotos/calca-jeans-azul.jpg', alt: 'Calça jeans azul dobrada sobre fundo cinza claro', vendedor: { nome: 'Duda', artigo: 'a', curso: 'Nutrição', nota: 4.8, vendas: 14 } },
    { id: 'camiseta-azul-theo', tipo: 'camiseta', nome: 'Camiseta azul', tamanho: 'M', preco: 15, estado: 'usado', pegadas: ['vintage', 'básico'], foto: 'fotos/camiseta-azul.jpg', alt: 'Camiseta azul clara mesclada num cabide de madeira, contra uma parede branca', vendedor: { nome: 'Theo', artigo: 'o', curso: 'Engenharia de Manufatura', nota: 4.4, vendas: 3 } },
    { id: 'vestido-renda-julia', tipo: 'vestido', nome: 'Vestido de renda', tamanho: 'PP', preco: 48, estado: 'pouco uso', pegadas: ['vintage', 'social'], foto: 'fotos/vestido-renda.jpg', alt: 'Vestido longo branco de renda num cabide, pendurado numa porta de madeira', vendedor: { nome: 'Júlia', artigo: 'a', curso: 'Ciências do Esporte', nota: 5.0, vendas: 8 } },
    { id: 'camisa-social-davi', tipo: 'camisa social', nome: 'Camisa social branca', tamanho: 'P', preco: 28, estado: 'novo com etiqueta', pegadas: ['social'], foto: 'fotos/camisa-social.jpg', alt: 'Camisa social branca num cabide de madeira, ao lado de uma azul clara', vendedor: { nome: 'Davi', artigo: 'o', curso: 'Engenharia de Telecomunicações', nota: 4.6, vendas: 6 } },
    { id: 'camiseta-marinho-livia', tipo: 'camiseta', nome: 'Camiseta azul-marinho', tamanho: 'P', preco: 12, estado: 'pouco uso', pegadas: ['básico', 'esportivo'], foto: 'fotos/camiseta-marinho.jpg', alt: 'Camiseta azul-marinho lisa num cabide amarelo, contra um fundo branco', vendedor: { nome: 'Lívia', artigo: 'a', curso: 'Engenharia de Transportes', nota: 4.7, vendas: 10 } },
    { id: 'jaqueta-couro-nando', tipo: 'jaqueta de couro', nome: 'Jaqueta de couro', tamanho: 'P', preco: 70, estado: 'pouco uso', pegadas: ['street'], foto: 'fotos/jaqueta-couro-a.jpg', alt: 'Jaqueta preta de couro com zíperes prateados, aberta sobre um lençol branco', vendedor: { nome: 'Nando', artigo: 'o', curso: 'Análise e Desenvolvimento de Sistemas', nota: 4.9, vendas: 18 } },
    { id: 'moletom-azul-bruna', tipo: 'moletom', nome: 'Moletom azul', tamanho: 'G', preco: 32, estado: 'usado', pegadas: ['street', 'esportivo'], foto: 'fotos/moletom-azul.jpg', alt: 'Moletom azul desbotado com capuz, aberto no chão de madeira ao lado de uma calça jeans escura', vendedor: { nome: 'Bruna', artigo: 'a', curso: 'Ciências do Esporte', nota: 4.5, vendas: 4 } },
    { id: 'calca-jeans-escura-gabi', tipo: 'calça jeans', nome: 'Calça jeans escura', tamanho: 'G', preco: 38, estado: 'pouco uso', pegadas: ['básico'], foto: 'fotos/calca-jeans-escura.jpg', alt: 'Calça jeans azul escura dobrada sobre fundo cinza claro', vendedor: { nome: 'Gabi', artigo: 'a', curso: 'outro curso', nota: 4.3, vendas: 2 } },
    { id: 'moletom-branco-marina', tipo: 'moletom', nome: 'Moletom branco', tamanho: 'GG', preco: 45, estado: 'pouco uso', pegadas: ['básico'], foto: 'fotos/moletom-branco.jpg', alt: 'Moletom branco com capuz num cabide, ao lado de uma calça jeans clara rasgada', vendedor: { nome: 'Marina', artigo: 'a', curso: 'Engenharia de Produção', nota: 4.8, vendas: 11 } }
  ],
  PALPITES: [{ tipo: 'jaqueta jeans', estado: 'pouco uso' }, { tipo: 'moletom', estado: 'usado' }, { tipo: 'vestido', estado: 'pouco uso' }],
  COMPRADOR: { nome: 'Bia', artigo: 'a', curso: 'Nutrição' },
  CONTADOR_BASE: 128,
  COMISSAO: 0.10,
  PERFIL_PADRAO: { nome: '', tamanho: 'M', pegadas: ['básico'], teto: 40, curso: 'Administração', email: '' },
  DROP: { dias: [1, 3], hora: 20, duracaoMs: 600000, ensaioMs: 10000, levaACadaMs: 8000, vendaAposMs: 5000, online: 23, esperando: 38 }
};
if (typeof module !== 'undefined') module.exports = DADOS;
