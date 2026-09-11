Você vai construir o site da marca **Seu Mimo Studio**. Este repositório já tem tudo o que você precisa
para começar, e nada disso deve ser refeito.

**Antes de escrever qualquer código, leia, nesta ordem:**

1. `seu-mimo-studio/COMECE-AQUI.md` — o documento de passagem: o que existe, o que falta, o que já foi
   decidido e não se reabre, e o que ainda depende do dono.
2. `seu-mimo-studio/MARCA.md` — o manual da marca. Ele manda sobre cor, tipografia, logotipo, mascote,
   voz e aplicações.
3. `CLAUDE.md` na raiz — as regras que valem para as duas marcas do repositório.
4. `panda-mimo/index.html`, `panda-mimo/styles.css`, `panda-mimo/script.js` e `panda-mimo/qa/audit.mjs` —
   a arquitetura que você vai reaproveitar. O site da Panda Mimo está no ar e homologado; ele é o molde
   técnico, nunca o molde visual.

**O que construir**

Um site estático em `seu-mimo-studio/site/`, em HTML, CSS e JavaScript puros, sem framework e sem etapa
de build. A referência visual é o mockup em
https://claude.ai/code/artifact/4c1abf96-6efc-4dd8-9831-bdbf4c551bde (páginas "Site · computador" e
"Site · celular"). Reproduza a estrutura e o espírito dele; não precisa ser pixel a pixel.

Estrutura da home, na ordem: cabeçalho com logotipo e chamada para o WhatsApp; abertura com o título, a
frase de apoio e dois botões; faixa escura com as quatro garantias; as peças em grade, com preço "a
partir de"; como funciona em quatro passos; uma frase da marca; fecho com chamada para o WhatsApp;
rodapé com as páginas legais e os dados da loja.

**O que reaproveitar do site da Panda Mimo, adaptando**

- O guardião inteiro (`panda-mimo/qa/`): auditoria em 14 telas, nitidez, acessibilidade com axe-core.
  Ele precisa apontar para o site novo e continuar reprovando publicação com problema.
- As quatro páginas de apoio (`sobre.html`, `trocas.html`, `termos.html`, `privacidade.html`): a estrutura
  serve, o texto precisa ser reescrito na voz da Seu Mimo Studio.
- O padrão de ligação com o Supabase, a linha de dados da loja no rodapé, o carrossel de fotos do produto
  e a medição sem cookie.

**Identidade, sem inventar nada**

- Logotipo, símbolo e avatar: `seu-mimo-studio/kit/svg/`. Use os SVGs, não recrie.
- Fontes: `seu-mimo-studio/kit/fontes/` (DM Serif Display para títulos, Montserrat para texto). Sirva do
  próprio site, como o site da Panda Mimo faz. Nada de Google Fonts em página pública.
- Cores: a tabela da seção 2 do `MARCA.md`. Declare como tokens no CSS e use só os tokens.
- Mascote: **não desenhe**. Use `seu-mimo-studio/kit/mestres/referencia-mascote-1400.jpg` onde o mockup
  pede o mascote. Ele é peça em aberto e vai para um ilustrador.

**Pare e pergunte antes de construir**

Três decisões são do dono e estão na seção 4 do `COMECE-AQUI.md`. Pergunte as três de uma vez, em
linguagem simples, e espere a resposta:

1. Onde publicar o site, já que o GitHub Pages serve um site por repositório e a Panda Mimo ocupa a raiz.
2. Se o banco vai ser tabelas novas com prefixo `sms_` no projeto Supabase atual, ou um projeto separado.
3. Se o catálogo começa com as mesmas seis peças da Panda Mimo ou com outro sortimento.

**Como escrever os textos**

A voz é calma, próxima e adulta. Fala com "você"; a marca é "a gente" ou "o Studio". Frases curtas. Sem
diminutivo em excesso, sem exclamação em série, sem emoji. A seção 6 do `MARCA.md` tem o exemplo do que
fazer e do que não fazer.

Nada de texto de enchimento. Onde faltar um dado real (preço final, CNPJ, endereço, número de WhatsApp),
deixe entre colchetes, visível, para o dono preencher. Não invente.

**O que é estar pronto**

- A home e as quatro páginas de apoio funcionando, no celular e no computador.
- O guardião rodando sobre o site novo e passando.
- Nenhuma cor ou fonte fora dos tokens.
- Nenhum dado inventado: o que falta está entre colchetes.
- O `MARCA.md` atualizado, se alguma regra tiver mudado, com o registro no histórico no fim dele.

Comece lendo os quatro arquivos e depois faça as três perguntas.
