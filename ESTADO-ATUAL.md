# Estado atual do trabalho

**O estúdio dentro do site — 23/09/2026 (fim do dia, não publicado):** a pedido do dono ("ficou perfeito; não quero que ele fique fora do meu site"), a seção **Monte seu mimo** da página inicial passou a ser o estúdio da caneca em 360°, no lugar do simulador de desenho de garrafa, caneca e copo. Decisão dele: só o novo, porque o próximo passo é o estúdio crescer para garrafas, ecobags e outras peças. Uma marcação só (`caneca-3d.html`, que continua no ar para links de montagem); a home busca o `.studio-layout` e carrega o estúdio quando a seção se aproxima (`carregaEstudio()` em `script.js`). A caneca gruda abaixo da barra do topo, o botão flutuante sai do caminho, "Ver com meu nome" fica só no detalhe da caneca e leva ao estúdio. Conserto no caminho: ao fechar o detalhe de um produto, o foco devolvido ao cartão puxava a página de volta e desfazia a ida ao estúdio. Guardião: bloco `estudio-no-site`. Manual 4.7, 7.4, 10.3 e histórico 2.20, texto e visual.

**Minha arte em camadas — 23/09/2026 (fim do dia, não publicado):** a pedido do dono. A arte trazida pronta vira o fundo de uma arte em camadas, na altura inteira; nome, Pandinhas (quantos quiser), enfeites e elementos entram por cima, livres, pelas abas Frases e Enfeites, que a Minha arte ganhou. Rascunho antigo abre com o nome virado frase no mesmo lugar. Três consertos no caminho: a letra do nome não carregava ao reabrir; **o rascunho se apagava ao abrir a página** (a caneca vazia era gravada por cima 1,2 s depois); e o item novo nascia embaixo do anterior. O guardião passou a rodar por bloco (`QA_SO`): prova de defeito em ~30 s em vez de 5 min. Leia `panda-mimo/simulador/MINHA-ARTE-EM-CAMADAS.md`.

**Estúdio leve e layout de vez — 23/09/2026 (fim do dia, não publicado):** a pedido do dono, em duas rodadas com print. A caneca não sobrepõe mais o painel em largura nenhuma (duas colunas a partir de 760 px; abaixo disso a caneca gruda na largura inteira e nunca passa de 45% da altura da tela — no 320×568 ela tomava 94%). Escolher o modelo não pula para Fotos: a aba fica em Modelo com a cor do fundo no topo, e o avanço é o botão de continuar. A roda do mouse volta a dar zoom e devolve a rolagem no limite. Na segunda rodada: cores da peça (bolinhas de interior e alça), acabamento, cena e a arte aberta saíram da faixa do pé da página e ficam à vista logo abaixo da caneca; a arte aberta passou de 240 para 618 px de largura em 1280. A coluna da peça gruda pelo pé quando passa da janela. O seletor de ocasião virou um cardápio em colunas (folha no celular), com a contagem de modelos em cada ocasião. Arte do modelo maior ao descansar o mouse (e segurando o dedo no celular). Traço de 1 px, botões na medida de ferramenta e o escolhido leve, sem pílula preta. A prova de defeito agora usa uma pasta sobreposta (`QA_SOBREPOR`) e não toca mais nos arquivos do site: o dono chegou a abrir a versão com o defeito recolocado. Leia `panda-mimo/simulador/REDESENHO-LEVE.md`; manual 9 e 10.3, histórico 2.19.

**As 65 imagens no estúdio — 23/09/2026 (publicado):** a pedido do dono, em dois lotes no mesmo dia, 55 poses do Pandinha, 6 aquarelas e 4 adesivos do acervo viraram arte de caneca. Duas coleções novas, **Com o Pandinha** (55 artes em cinco assuntos: ocasiões, profissões, saúde, esporte, paixões) e **Aquarela** (6), que aparecem também nos assuntos que já existiam. Catálogo: **199 modelos, 43 categorias, onze grupos**. Na aba Enfeites, as grades das aquarelas e das 64 poses. **A regra de um Pandinha por caneca caiu** (decisão do dono): quantos a pessoa quiser. Três defeitos que já estavam no ar foram consertados no caminho: elemento do acervo entrava invisível, miniatura de modelo saía sem o Pandinha, e o elemento aparecia como "Pandinha" na lista. As 138 artes aprovadas até 22/09 saem idênticas (teste `qa/artes-aprovadas-unit.test.mjs`). Manual: 6.2, 6.3, 6.4, 9.1 ("Imagem na arte"), 10.3, 13.5 e histórico 2.17 e 2.18, texto e visual. Leia `panda-mimo/simulador/LOTE-PANDINHA-E-AQUARELA.md`. Pendente, com o dono: vetorizar as poses para o kit (uns 190 MB), a posição dos grupos novos no seletor e o teto de tamanho do Pandinha.

**Acervo PNG local — 22/09/2026:** a pedido do dono, geradas seis ilustrações delicadas de teste e 20 poses temáticas do Pandinha com referência oficial. Arquivos em `panda-mimo/marca/kit/png/piloto-aquarela/` e `pandinha-temas-20/`, cada pasta com `index.html` e catálogo de prompts/dimensões. PNGs com alpha, sem ampliação; não são vetores. Ver `pandinha-temas-20/LEIA-ME.md` para limites de impressão e autorização específica dos temas. (Em 23/09 entraram no estúdio: ver a entrada acima.) Versionados e no ar desde 22/09/2026 como arquivos do repositório — **nenhuma página do site aponta para eles**, então o visitante não vê diferença nenhuma. A integração como bloco novo do editor continua em aberto. O Pandinha temático é exceção pedida pelo dono à regra 6.4 do manual e segue material de revisão: o guardião (`qa/acervo-unit.test.mjs`) reprova página servida que aponte para essas artes.

**Lote local seguinte — 22/09/2026:** Pequenos Prazeres acrescenta 24 modelos, 12 matrizes vetoriais e seis categorias no novo grupo Hobbies e paixões. Catálogo local atual: **138 modelos, 37 categorias e nove grupos**. Leia `panda-mimo/simulador/LOTE-PRAZERES.md`; galeria em `qa/provas-colecoes.html?lote=prazeres`. Publicado em 22/09 (conferido no ar em 23/09).

**Atualização local — 22/09/2026:** a revisão de papelaria aprovada pelo dono e o lote Ateliê estão nesta cópia e foram publicados em 22/09 (conferido no ar em 23/09). O catálogo local tem **114 modelos**, em 31 categorias e oito grupos. O lote acrescenta 12 composições, oito ilustrações vetoriais e as categorias Casa nova e Profissões e vocações. Leia `panda-mimo/simulador/REVISAO-PAPELARIA.md` e `panda-mimo/simulador/LOTE-ATELIE.md`. A galeria filtrada fica em `qa/provas-colecoes.html?lote=atelie`. Os números de 102 modelos abaixo descrevem a versão publicada em 21/09, anterior a essas alterações locais.

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

138 modelos, em nove grupos no seletor (a ordem é escrita à mão em `ORDEM_DOS_GRUPOS`):

| Grupo | Assuntos | Artes |
|---|---|---|
| Datas comemorativas | Natal, Mães, Pais, Namorados, Professores, Páscoa | 24 |
| Momentos | Aniversário, Amizade e formatura, Casa nova | 7 |
| Bebê e maternidade | Chegada, Chá de bebê, Chá revelação, Gravidez e primeiro Dia das Mães | 16 |
| Convites e agradecimentos | Padrinhos de casamento, Padrinhos de batismo, Madrinhas e daminhas, Agradecimento | 17 |
| Pets e bichinhos | Várias fotos, Cachorros, Gatos, Homenagem, Mãe e pai de pet | 17 |
| Esportes e movimento | funcional, musculação, ciclismo, corrida, yoga e pilates, futebol | 26 |
| Profissões e vocações | Profissões e vocações (uma categoria só, por enquanto) | 4 |
| Hobbies e paixões | Leitura, Café, Música, Jardinagem, Viagens, Culinária | 24 |
| Do dia a dia | Só fotos | 3 |

As ilustrações foram refeitas em setembro de 2026 com acabamento de papelaria (contorno suave,
preenchimento em camadas, Nunito no lugar de Fredoka, metade do confete). O antes e depois dos 67
desenhos está em `panda-mimo/qa/revisao-papelaria.html`.

Cada assunto tem pelo menos quatro artes, e o teste cobra. As exceções ficam numa lista à vista
(`AINDA_MAGROS` em `qa/colecoes-unit.test.mjs`): hoje só Aniversário e Amizade e formatura.

## Como está a qualidade

- 41 testes unitários (`npm run test:arte`), verdes.
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
| Celebrações e novas fases | noivado, formatura, aposentadoria | Aniversário com 1 arte; Casa nova já tem 4 |
| Humor e personalidade | frases engraçadas, signo, jeito de ser, piada entre amigos | não existe |
| Fé e espiritualidade | frases de fé, celebrações, símbolos | não existe |
| Empresas e equipes | boas-vindas, reconhecimento, evento, brinde, conquista | não existe |

Prontas: datas comemorativas, bebê e maternidade, convites e agradecimentos, pets, esportes,
hobbies e paixões. **Profissões e vocações** existe mas é um balde só, com quatro artes: a lista
aprovada pedia professor, enfermagem, medicina, direito, veterinária, engenharia e quem empreende
como assuntos separados.

**Três pontas da revisão de papelaria ficaram em aberto** (detalhe em
`panda-mimo/simulador/CONSERTOS-22-09.md`): 12 ilustrações não têm nenhum traço a 3:1 contra a
cerâmica clara e precisam de prova física antes de mexer no traço; a coleção esportiva é a única que
ainda usa Fredoka; e "Profissões e vocações" precisa virar assuntos de verdade.

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
