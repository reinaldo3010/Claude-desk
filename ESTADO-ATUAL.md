# Estado atual do trabalho

Frente aberta, o que ficou pronto e o que vem a seguir. Atualizado em 21 de setembro de 2026.

---

## Onde estamos

**Frente:** estúdio da caneca em 360° da Panda Mimo (`panda-mimo/caneca-3d.html`) e as **coleções de
arte** que enchem o catálogo de modelos.

**Publicado em 21/09/2026**, com o estúdio no ar pela primeira vez:
<https://reinaldo3010.github.io/Claude-desk/caneca-3d.html>

**O caminho até o ar tem três pernas**, e a do meio costuma ser esquecida:

1. este repositório (`Downloads/imagens site panda mimo/Claude-desk-simulador`), onde o trabalho é
   feito e mesclado na `main`;
2. o repositório do dono (`OneDrive - MINGARDI & ELIAS/Área de Trabalho/Claude-desk`), que é o
   `origin` daqui. Como ele está com a `main` aberta, não dá para empurrar direto: de lá se puxa,
   com `git pull --ff-only <caminho deste repositório> main`;
3. o GitHub (`reinaldo3010/Claude-desk`). O `git push origin main` de lá dispara o workflow
   "Panda Mimo · publicar no GitHub Pages". Leva uns cinco minutos para o ar.

**Antes de publicar de novo:** o WhatsApp do site ainda é o número de reserva (`5500000000000`), em
`script.js`. Quem clicar em "fazer o pedido" no estúdio não chega em ninguém.

## O catálogo hoje

102 modelos, em sete grupos no seletor (a ordem é escrita à mão em `ORDEM_DOS_GRUPOS`):

| Grupo | Assuntos | Artes |
|---|---|---|
| Datas comemorativas | Natal, Mães, Pais, Namorados, Professores, Páscoa | 24 |
| Momentos | Aniversário, Amizade e formatura | 2 |
| Bebê e maternidade | Chegada, Chá de bebê, Chá revelação, Gravidez e primeiro Dia das Mães | 16 |
| Convites e agradecimentos | Padrinhos de casamento, Padrinhos de batismo, Madrinhas e daminhas, Agradecimento | 16 |
| Pets e bichinhos | Várias fotos, Cachorros, Gatos, Homenagem, Mãe e pai de pet | 17 |
| Esportes e movimento | funcional, musculação, ciclismo, corrida, yoga e pilates, futebol | 24 |
| Do dia a dia | Só fotos | 3 |

Cada assunto tem pelo menos quatro artes, e o teste cobra. As exceções ficam numa lista à vista
(`AINDA_MAGROS` em `qa/colecoes-unit.test.mjs`): hoje só Aniversário e Amizade e formatura.

## Como está a qualidade

- 39 testes unitários (`npm run test:arte`), verdes.
- Guardião funcional em 390 e 1280 px, verde, cobrindo o site, o estúdio de ponta a ponta, as duas
  coleções e a página de provas.
- Nitidez em sete combinações de tela e densidade, verde. axe-core sem violação.
- Um aviso que não bloqueia e é decisão do dono: o WhatsApp do site ainda é o número de reserva.

## Como fazer uma coleção nova

Está escrito com detalhe em `panda-mimo/simulador/COMECE-AQUI.md`, seção 7. O resumo:
`simulador/pets.js` é o molde — ilustrações em cima (no vocabulário de `desenho.js`, que mede e
centra sozinho), modelos embaixo (com os atalhos de `camadas.js`), e três linhas em
`simulador/colecoes.js` para registrar. Depois: olhar as provas em `qa/provas-colecoes.html` e rodar
`npm run test:arte`.

## O que vem a seguir

### 1. Mais coleções (a lista que o dono aprovou)

Em ordem de valor, na minha leitura — o dono decide a ordem de verdade:

| Coleção | Assuntos | Situação |
|---|---|---|
| Profissões e vocações | professor, enfermagem, medicina, direito, veterinária, engenharia, quem empreende | não existe |
| Pessoas especiais | amiga, casal, mãe, pai, avós, irmãos, filhos, colegas | não existe |
| Celebrações e novas fases | aniversário, noivado, formatura, aposentadoria, casa nova | Aniversário e Amizade com 1 arte cada |
| Hobbies e paixões | livros, café, música, games, viagens, jardinagem, culinária, fotografia | 1 arte |
| Humor e personalidade | frases engraçadas, signo, jeito de ser, piada entre amigos | não existe |
| Fé e espiritualidade | frases de fé, celebrações, símbolos | não existe |
| Empresas e equipes | boas-vindas, reconhecimento, evento, brinde, conquista | não existe |

Prontas: datas comemorativas, bebê e maternidade, convites e agradecimentos, pets, esportes.

Uma ideia registrada e ainda não feita: **uma arte pode aparecer em mais de um caminho** (a caneca da
amiga ciclista podia estar em Esportes → Ciclismo *e* em Pessoas especiais → Amigas). Hoje cada arte
tem uma categoria só. Vale quando o catálogo crescer mais.

### 2. Pendências que dependem do dono

1. **Tipos de caneca e cores da peça.** Depende da lista real do fornecedor: quais peças existem
   (mágica, cônica, alça de coração, 15 oz) e a área de impressão de cada uma.
2. **Decidir a cena "caixa de presente".** Foi refeita; o dono quer olhar antes de manter.
3. **Trocar o número do WhatsApp** pelo real, no painel ou em `script.js`.
4. **Republicar** depois de trocar o WhatsApp: o caminho das três pernas está no começo deste arquivo.

### 3. Ideias recusadas de propósito

Não voltar a elas sem decisão nova: extrator de arte de terceiros por inteligência artificial, loja
com checkout embutido, biblioteca de milhares de cliparts genéricos, mapas e fase da lua, e arte
gerada por inteligência artificial na peça.

## Por onde começar depois da compactação

1. `panda-mimo/simulador/COMECE-AQUI.md` — o que é, como rodar, como a arte funciona, como nasce uma
   coleção.
2. `panda-mimo/simulador/LICOES-APRENDIDAS.md` — as armadilhas que já custaram tempo.
3. `panda-mimo/MARCA.md` — o manual; manda em cor, letra, mascote e tom de voz. A seção 9.1 é a das
   ilustrações de coleção. O histórico no fim conta o que mudou e por quê.
4. Este arquivo, para o estado da frente.
