/* Cópia local do catálogo.

   O site nasce completo com estes dados, sem depender de rede. Quando o banco
   responder, o que vier de lá substitui esta lista (ver script.js). É a mesma
   mecânica do site irmão: a internet pode falhar, a página não.

   As chaves vão entre aspas de propósito: assim o arquivo continua sendo JSON
   válido e o guardião consegue ler o catálogo sem executar código.

   `fotos` fica vazio enquanto a fotografia real da peça não existe; até lá o
   quadro mostra o desenho de linha correspondente (`icone`), com a legenda
   "foto da peça". Assim o site é honesto sobre o que ainda falta.

   `tema` vira chip de filtro; `etiquetas` viram as marcas do cartão e entram na
   busca; `detalhes` é o texto que aparece quando a peça é aberta. */
window.SMS_PRODUTOS = [
  {
    "slug": "garrafas-termicas",
    "nome": "Garrafas térmicas",
    "material": "Aço inox, 1 litro",
    "preco_texto": "A partir de R$ 89",
    "icone": "ic-garrafa",
    "tema": "bebidas",
    "etiquetas": ["Inox 304", "Gela 24h", "Esquenta 12h", "Nome gravado"],
    "detalhes": "Parede dupla a vácuo, tampa rosqueável com vedação e pintura que não descasca. A personalização é gravada, não colada: resiste ao uso diário e à lavagem à mão. Cabe na maioria dos suportes de carro e de mochila.",
    "fotos": [],
    "mensagem": "Oi, Seu Mimo Studio! Quero uma garrafa térmica personalizada."
  },
  {
    "slug": "canecas",
    "nome": "Canecas",
    "material": "Cerâmica, 325 ml",
    "preco_texto": "A partir de R$ 49",
    "icone": "ic-caneca",
    "tema": "bebidas",
    "etiquetas": ["Cerâmica", "Vai ao micro-ondas", "Lava-louças", "Frase livre"],
    "detalhes": "Cerâmica esmaltada, com alça confortável e fundo plano. Aceita nome, frase, data ou desenho, na cor que combinar com a peça. Pode ir ao micro-ondas e à lava-louças sem perder a arte.",
    "fotos": [],
    "mensagem": "Oi, Seu Mimo Studio! Quero uma caneca personalizada."
  },
  {
    "slug": "copos-termicos",
    "nome": "Copos térmicos",
    "material": "Inox com tampa",
    "preco_texto": "A partir de R$ 79",
    "icone": "ic-copo",
    "tema": "bebidas",
    "etiquetas": ["Inox", "Tampa com trava", "Cabe no porta-copo", "Nome gravado"],
    "detalhes": "Formato afunilado que entra em qualquer porta-copo, tampa com trava e parede dupla. É a peça que mais sai para presente de trabalho, porque acompanha a pessoa o dia inteiro.",
    "fotos": [],
    "mensagem": "Oi, Seu Mimo Studio! Quero um copo térmico personalizado."
  },
  {
    "slug": "ecobags",
    "nome": "Ecobags",
    "material": "Algodão cru",
    "preco_texto": "A partir de R$ 59",
    "icone": "ic-ecobag",
    "tema": "dia-a-dia",
    "etiquetas": ["Algodão cru", "Alça reforçada", "Estampa firme", "Arte sua"],
    "detalhes": "Algodão cru de gramatura alta, com alça reforçada e costura dupla. A estampa é firme e aguenta lavagem em água fria. Aceita arte grande, então é onde o desenho de alguém rende mais.",
    "fotos": [],
    "mensagem": "Oi, Seu Mimo Studio! Quero uma ecobag personalizada."
  },
  {
    "slug": "tags-e-chaveiros",
    "nome": "Tags e chaveiros",
    "material": "MDF ou acrílico",
    "preco_texto": "R$ 15 cada · mínimo 10",
    "icone": "ic-tag",
    "tema": "lembrancinha",
    "etiquetas": ["MDF ou acrílico", "Corte a laser", "Mínimo 10", "Nome em cada um"],
    "detalhes": "Cortadas e gravadas a laser, uma a uma. Saem a partir de dez porque são produzidas em lote, e cada uma pode levar um nome diferente sem custo extra. É o item de lembrancinha de festa e de kit corporativo.",
    "fotos": [],
    "mensagem": "Oi, Seu Mimo Studio! Quero tags ou chaveiros personalizados (quantidade: ___)."
  },
  {
    "slug": "kits-presenteaveis",
    "nome": "Kits presenteáveis",
    "material": "Duas peças e bilhete",
    "preco_texto": "A partir de R$ 149",
    "icone": "ic-kit",
    "tema": "presente",
    "etiquetas": ["Duas peças", "Caixa kraft", "Bilhete à mão", "Pronto para dar"],
    "detalhes": "Duas peças combinando, na caixa kraft com fita oliva e o bilhete escrito à mão. Você diz a ocasião e a gente sugere a dupla; se já souber o que quer, é só dizer. Sai pronto para entregar, sem preço à vista.",
    "fotos": [],
    "mensagem": "Oi, Seu Mimo Studio! Quero um kit presenteável."
  }
];
