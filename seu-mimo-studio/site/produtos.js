/* Cópia local do catálogo.

   O site nasce completo com estes dados, sem depender de rede. Quando o banco
   responder, o que vier de lá substitui esta lista (ver script.js). É a mesma
   mecânica do site irmão: a internet pode falhar, a página não.

   As chaves vão entre aspas de propósito: assim o arquivo continua sendo JSON
   válido e o guardião consegue ler o catálogo sem executar código.

   `fotos` fica vazio enquanto a fotografia real da peça não existe; até lá o
   quadro mostra o desenho de linha correspondente (`icone`), com a legenda
   "foto da peça". Assim o site é honesto sobre o que ainda falta. */
window.SMS_PRODUTOS = [
  {
    "slug": "garrafas-termicas",
    "nome": "Garrafas térmicas",
    "material": "Aço inox, 1 litro",
    "preco_texto": "A partir de R$ 89",
    "icone": "ic-garrafa",
    "fotos": [],
    "mensagem": "Oi, Seu Mimo Studio! Quero uma garrafa térmica personalizada."
  },
  {
    "slug": "canecas",
    "nome": "Canecas",
    "material": "Cerâmica, 325 ml",
    "preco_texto": "A partir de R$ 49",
    "icone": "ic-caneca",
    "fotos": [],
    "mensagem": "Oi, Seu Mimo Studio! Quero uma caneca personalizada."
  },
  {
    "slug": "copos-termicos",
    "nome": "Copos térmicos",
    "material": "Inox com tampa",
    "preco_texto": "A partir de R$ 79",
    "icone": "ic-copo",
    "fotos": [],
    "mensagem": "Oi, Seu Mimo Studio! Quero um copo térmico personalizado."
  },
  {
    "slug": "ecobags",
    "nome": "Ecobags",
    "material": "Algodão cru",
    "preco_texto": "A partir de R$ 59",
    "icone": "ic-ecobag",
    "fotos": [],
    "mensagem": "Oi, Seu Mimo Studio! Quero uma ecobag personalizada."
  },
  {
    "slug": "tags-e-chaveiros",
    "nome": "Tags e chaveiros",
    "material": "MDF ou acrílico",
    "preco_texto": "R$ 15 cada · mínimo 10",
    "icone": "ic-tag",
    "fotos": [],
    "mensagem": "Oi, Seu Mimo Studio! Quero tags ou chaveiros personalizados (quantidade: ___)."
  },
  {
    "slug": "kits-presenteaveis",
    "nome": "Kits presenteáveis",
    "material": "Duas peças e bilhete",
    "preco_texto": "A partir de R$ 149",
    "icone": "ic-kit",
    "fotos": [],
    "mensagem": "Oi, Seu Mimo Studio! Quero um kit presenteável."
  }
];
