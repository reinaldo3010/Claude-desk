# Estado atual do trabalho

**A galeria de artes prontas — 23/09/2026 (local, sem publicar):** a pedido do dono ("criei umas 100 artes de caneca... a galeria vai chegar a milhares"; "como meu especialista, decida"). Decisão: as artes moram no Supabase que o site já usa (tabelas `pm_arte_categorias` e `pm_artes`, bucket `panda-mimo`, migração `pm_galeria_de_artes` já aplicada no banco), não no repositório. O painel ganhou a aba **Artes prontas** (sobe, prepara em 2480 × 1063 e miniatura, cria categoria, troca, tira do ar, apaga) e o estúdio mostra as artes no cardápio, depois dos modelos da casa, pelo caminho da arte do Canva. Guardião: bloco `galeria` com banco de mentira, galeria vazia nos outros blocos, quatro provas de defeito reprovadas. O primeiro lote (`Downloads/Imagens Panda Mimo`, 120 arquivos, 102 artes) foi lido uma a uma: **52 prontas**, 12 a consertar, 17 com texto errado, 21 com personagem licenciado, 18 cópias, separadas em subpastas (nada apagado). **Nada subiu ainda:** a subida pede o login do dono no painel (a senha não é minha). Leia `panda-mimo/simulador/GALERIA-DE-ARTES.md`. Fica com o dono: o nome Panda Mimo que a IA desenhou em 25 das 52, o Pandinha 3D na arte de volta inteira (6.5), a resolução dos originais (232 dpi, ampliados para 300) e o lugar dos grupos novos.

**O estúdio com garrafa e ecobag — 23/09/2026 (publicado em 23/09/2026, merge 5d2b347):** a pedido do dono ("vamos começar a evoluir o estúdio para garrafas e ecobags"), com as três recomendações que ele escolheu: modelos próprios de cada peça, medidas de referência e "Qual peça? Caneca · Garrafa · Ecobag" numa linha no topo do estúdio. A garrafa térmica de 1 L (arte de 23 × 18 cm envolvendo, nas quatro cores das peças) e a ecobag de algodão cru (arte de 25 × 30 cm só na frente) têm 3D próprio, 8 modelos cada (duas ocasiões de quatro), a arte sobre a cor da peça, arquivo de 300 dpi sem fundo, frases que acompanham a cor (7.4) e "Ver com meu nome" no detalhe delas. **A caneca não mudou um pixel** (40 imagens idênticas; a linha nova desce o estúdio 52 px). Três defeitos meus no caminho viraram checagem (bloco novo `pecas`) e doze provas de defeito reprovaram; o guardião inteiro passou nas 14 resoluções. Manual 4.7, 7.4, 10.3, 13.3 e histórico 2.21. Leia `panda-mimo/simulador/PECAS-NO-ESTUDIO.md`. Fica com o dono: a tinta na garrafa pêssego (7.4 × 7.3), medidas e cores do fornecedor, estampa no verso da ecobag, o copo e o campo de quantidade.

**O estúdio dentro do site — 23/09/2026 (publicado em 23/09/2026, merge 341c9e4):** a pedido do dono ("ficou perfeito; não quero que ele fique fora do meu site"), a seção **Monte seu mimo** da página inicial passou a ser o estúdio da caneca em 360°, no lugar do simulador de desenho de garrafa, caneca e copo. Decisão dele: só o novo, porque o próximo passo é o estúdio crescer para garrafas, ecobags e outras peças. Uma marcação só (`caneca-3d.html`, que continua no ar para links de montagem); a home busca o `.studio-layout` e carrega o estúdio quando a seção se aproxima (`carregaEstudio()` em `script.js`). A caneca gruda abaixo da barra do topo, o botão flutuante sai do caminho, "Ver com meu nome" fica só no detalhe da caneca e leva ao estúdio. Conserto no caminho: ao fechar o detalhe de um produto, o foco devolvido ao cartão puxava a página de volta e desfazia a ida ao estúdio. Guardião: bloco `estudio-no-site`. Manual 4.7, 7.4, 10.3 e histórico 2.20, texto e visual.

**Minha arte em camadas — 23/09/2026 (publicado em 23/09/2026, merge 341c9e4):** a pedido do dono. A arte trazida pronta vira o fundo de uma arte em camadas, na altura inteira; nome, Pandinhas (quantos quiser), enfeites e elementos entram por cima, livres, pelas abas Frases e Enfeites, que a Minha arte ganhou. Rascunho antigo abre com o nome virado frase no mesmo lugar. Três consertos no caminho: a letra do nome não carregava ao reabrir; **o rascunho se apagava ao abrir a página** (a caneca vazia era gravada por cima 1,2 s depois); e o item novo nascia embaixo do anterior. O guardião passou a rodar por bloco (`QA_SO`): prova de defeito em ~30 s em vez de 5 min. Leia `panda-mimo/simulador/MINHA-ARTE-EM-CAMADAS.md`.

**Estúdio leve e layout de vez — 23/09/2026 (publicado em 23/09/2026, merge 341c9e4):** a pedido do dono, em duas rodadas com print. A caneca não sobrepõe mais o painel em largura nenhuma (duas colunas a partir de 760 px; abaixo disso a caneca gruda na largura inteira e nunca passa de 45% da altura da tela — no 320×568 ela tomava 94%). Escolher o modelo não pula para Fotos: a aba fica em Modelo com a cor do fundo no topo, e o avanço é o botão de continuar. A roda do mouse volta a dar zoom e devolve a rolagem no limite. Na segunda rodada: cores da peça (bolinhas de interior e alça), acabamento, cena e a arte aberta saíram da faixa do pé da página e ficam à vista logo abaixo da caneca; a arte aberta passou de 240 para 618 px de largura em 1280. A coluna da peça gruda pelo pé quando passa da janela. O seletor de ocasião virou um cardápio em colunas (folha no celular), com a contagem de modelos em cada ocasião. Arte do modelo maior ao descansar o mouse (e segurando o dedo no celular). Traço de 1 px, botões na medida de ferramenta e o escolhido leve, sem pílula preta. A prova de defeito agora usa uma pasta sobreposta (`QA_SOBREPOR`) e não toca mais nos arquivos do site: o dono chegou a abrir a versão com o defeito recolocado. Leia `panda-mimo/simulador/REDESENHO-LEVE.md`; manual 9 e 10.3, histórico 2.19.

**As 65 imagens no estúdio — 23/09/2026 (publicado):** a pedido do dono, em dois lotes no mesmo dia, 55 poses do Pandinha, 6 aquarelas e 4 adesivos do acervo viraram arte de caneca. Duas coleções novas, **Com o Pandinha** (55 artes em cinco assuntos: ocasiões, profissões, saúde, esporte, paixões) e **Aquarela** (6), que aparecem também nos assuntos que já existiam. Catálogo: **199 modelos, 43 categorias, onze grupos**. Na aba Enfeites, as grades das aquarelas e das 64 poses. **A regra de um Pandinha por caneca caiu** (decisão do dono): quantos a pessoa quiser. Três defeitos que já estavam no ar foram consertados no caminho: elemento do acervo entrava invisível, miniatura de modelo saía sem o Pandinha, e o elemento aparecia como "Pandinha" na lista. As 138 artes aprovadas até 22/09 saem idênticas (teste `qa/artes-aprovadas-unit.test.mjs`). Manual: 6.2, 6.3, 6.4, 9.1 ("Imagem na arte"), 10.3, 13.5 e histórico 2.17 e 2.18, texto e visual. Leia `panda-mimo/simulador/LOTE-PANDINHA-E-AQUARELA.md`. Pendente, com o dono: vetorizar as poses para o kit (uns 190 MB), a posição dos grupos novos no seletor e o teto de tamanho do Pandinha.

**Acervo PNG local — 22/09/2026:** a pedido do dono, geradas seis ilustrações delicadas de teste e 20 poses temáticas do Pandinha com referência oficial. Arquivos em `panda-mimo/marca/kit/png/piloto-aquarela/` e `pandinha-temas-20/`, cada pasta com `index.html` e catálogo de prompts/dimensões. PNGs com alpha, sem ampliação; não são vetores. Ver `pandinha-temas-20/LEIA-ME.md` para limites de impressão e autorização específica dos temas. (Em 23/09 entraram no estúdio: ver a entrada acima.) Versionados e no ar desde 22/09/2026 como arquivos do repositório — **nenhuma página do site aponta para eles**, então o visitante não vê diferença nenhuma. A integração como bloco novo do editor continua em aberto. O Pandinha temático é exceção pedida pelo dono à regra 6.4 do manual e segue material de revisão: o guardião (`qa/acervo-unit.test.mjs`) reprova página servida que aponte para essas artes.

**Lote local seguinte — 22/09/2026:** Pequenos Prazeres acrescenta 24 modelos, 12 matrizes vetoriais e seis categorias no novo grupo Hobbies e paixões. Catálogo local atual: **138 modelos, 37 categorias e nove grupos**. Leia `panda-mimo/simulador/LOTE-PRAZERES.md`; galeria em `qa/provas-colecoes.html?lote=prazeres`. Publicado em 22/09 (conferido no ar em 23/09).

**Atualização local — 22/09/2026:** a revisão de papelaria aprovada pelo dono e o lote Ateliê estão nesta cópia e foram publicados em 22/09 (conferido no ar em 23/09). O catálogo local tem **114 modelos**, em 31 categorias e oito grupos. O lote acrescenta 12 composições, oito ilustrações vetoriais e as categorias Casa nova e Profissões e vocações. Leia `panda-mimo/simulador/REVISAO-PAPELARIA.md` e `panda-mimo/simulador/LOTE-ATELIE.md`. A galeria filtrada fica em `qa/provas-colecoes.html?lote=atelie`. Os números de 102 modelos abaixo descrevem a versão publicada em 21/09, anterior a essas alterações locais.

Frente aberta, o que ficou pronto e o que vem a seguir. Atualizado em 21 de setembro de 2026.

---

## Onde estamos (fim de 23/09/2026)

**Frente:** o estúdio em 360° da Panda Mimo, que desde 23/09/2026 monta caneca, garrafa e ecobag
(`PECAS-NO-ESTUDIO.md`). O dono considerou o da caneca "perfeito" em 23/09/2026 — é a base a preservar, e
a caneca não mudou um pixel com as peças novas. Ele mora em dois lugares com uma marcação só:

- na seção **Monte seu mimo** da página inicial (<https://reinaldo3010.github.io/Claude-desk/#monte>),
  no lugar do simulador de desenho, que saiu; a home busca o `.studio-layout` de `caneca-3d.html` e
  carrega o estúdio quando a seção se aproxima (`carregaEstudio()` em `script.js`);
- em `caneca-3d.html`, que continua no ar para os links de montagem e as páginas de fora.

**Publicado em 23/09/2026 (merge `5d2b347`):** a garrafa e a ecobag estão no ar, conferidas com
navegador de verdade em 1280 e 390 (a primeira visita logo depois da publicação levou dois 503 do GitHub
Pages, que ainda espalhava os arquivos; a segunda passou sem erro). Próximo passo: o olhar do dono sobre
as duas peças; depois, mais modelos para elas, o copo e as outras peças (item 1 abaixo).

Antes disso, no mesmo dia, o estúdio da caneca foi para dentro do site (merge `341c9e4`). O registro do
fim da sessão das peças (este arquivo, `COMECE-AQUI.md`, `LICOES-APRENDIDAS.md` e as ferramentas
`qa/folha-de-modelos.mjs` e `qa/confere-no-ar.mjs`) ficou num commit só de registro na `main` daqui, sem
push: sobe junto com a próxima publicação, e não muda nada no site.

**O caminho até o ar tem três pernas**, e a do meio costuma ser esquecida:

1. este repositório (`Downloads/imagens site panda mimo/Claude-desk-simulador`), onde o trabalho é
   feito num ramo e mesclado na `main`;
2. o repositório do dono (`OneDrive - MINGARDI & ELIAS/Área de Trabalho/Claude-desk`), que é o
   `origin` daqui. Como ele está com a `main` aberta, não dá para empurrar direto: de lá se puxa,
   com `git pull --ff-only <caminho deste repositório> main`;
3. o GitHub (`reinaldo3010/Claude-desk`). O `git push origin main` de lá dispara o "guardião de
   qualidade" e o "publicar no GitHub Pages" (só quando o commit mexe em `panda-mimo/**`: commit só de
   documentação na raiz não dispara nada). Leva **uns 15 minutos** para o ar (o guardião roda lá
   antes de publicar). Conferir pela API pública, sem `gh`:
   `curl -s "https://api.github.com/repos/reinaldo3010/Claude-desk/actions/runs?per_page=6"`.

**Número de WhatsApp:** o site ainda usa o de reserva (`5500000000000`, em `script.js`). É decisão do
dono esperar; o guardião avisa sem bloquear. Enquanto isso, o pedido do estúdio não chega em ninguém.

## O catálogo hoje

Na caneca, 199 modelos e 42 ocasiões em onze grupos (a ordem é escrita à mão em `ORDEM_DOS_GRUPOS`).
Desde 23/09/2026 (no ar), a garrafa tem 8 modelos em Com o seu nome e Treino, e a
ecobag 8 em Com o seu nome e Pequenos prazeres; cada peça só mostra as ocasiões dela. A caneca:

| Grupo | Ocasiões | Artes |
|---|---|---|
| Datas comemorativas | Natal, Mães, Pais, Namorados, Professores, Páscoa | 24 |
| Momentos | Aniversário, Amizade e formatura, Casa nova | 7 |
| Bebê e maternidade | Chegada, Chá de bebê, Chá revelação, Gravidez e primeiro Dia das Mães | 16 |
| Convites e agradecimentos | Padrinhos de casamento, Padrinhos de batismo, Madrinhas e daminhas, Agradecimento | 17 |
| Pets e bichinhos | Várias fotos, Cachorros, Gatos, Homenagem, Mãe e pai de pet | 17 |
| Esportes e movimento | funcional, musculação, ciclismo, corrida, yoga e pilates, futebol | 26 |
| Profissões e vocações | Profissões e vocações (uma ocasião só, por enquanto) | 4 |
| Hobbies e paixões | Leitura, Café, Música, Jardinagem, Viagens, Culinária | 24 |
| Com o Pandinha | ocasiões, profissões, saúde, esporte, paixões (imagens do acervo) | 55 |
| Aquarela | Aquarelas delicadas (imagens do acervo) | 6 |
| Do dia a dia | Só fotos | 3 |

Artes do Pandinha e das aquarelas aparecem também nas ocasiões que já existiam (`tambemEm`). Cada
ocasião tem pelo menos quatro artes, e o teste cobra; as exceções ficam à vista (`AINDA_MAGROS` em
`qa/colecoes-unit.test.mjs`): hoje só Aniversário. As 138 artes aprovadas até 22/09 saem idênticas
pixel a pixel (`qa/artes-aprovadas-unit.test.mjs`).

## Como está a qualidade

- 58 testes unitários (`npm run test:arte`), verdes, com `qa/pecas-unit.test.mjs` para as peças.
- Guardião completo em 14 resoluções, verde (uns 11 minutos, `npm test`), com nitidez em sete
  combinações de tela e densidade e axe-core sem violação.
- **O guardião roda por bloco:** `QA_SO=<bloco> QA_VIEWPORTS=1280 node qa/audit.mjs` leva de 20 s a
  2 min. Blocos: `site`, `cabecalho`, `conversao`, `conteudo`, `nitidez`, `medicao`, `banco`,
  `painel`, `paginas`, `estudio`, `sobreposicao`, `layout`, `arte-maior`, `toque`, `passo`, `peca`,
  `peca-a-vista`, `cardapio`, `minha-arte`, `miniaturas`, `camera`, `provas`, `estudio-no-site`, `pecas`.
  No trabalho, só os blocos que a mudança toca; o guardião inteiro uma vez, antes de publicar.
- **Três ferramentas de olhar** (fora do guardião, na pasta `qa/`): `mede-caneca.mjs` prova pixel a
  pixel que uma mudança não moveu a caneca; `folha-de-modelos.mjs` monta a folha de contato dos modelos
  de uma peça; `confere-no-ar.mjs` confere o site publicado com navegador de verdade.
- **Prova de defeito** numa pasta sobreposta, nunca no arquivo do site:
  `QA_SOBREPOR=<pasta> QA_SO=<bloco> QA_VIEWPORTS=1280 node qa/audit.mjs`.
- Um aviso que não bloqueia e é decisão do dono: o WhatsApp de reserva.

## Como fazer uma coleção nova

Está escrito com detalhe em `panda-mimo/simulador/COMECE-AQUI.md`, seção 7. O resumo:
`simulador/pets.js` é o molde — ilustrações em cima (no vocabulário de `desenho.js`, que mede e
centra sozinho), modelos embaixo (com os atalhos de `camadas.js`), e três linhas em
`simulador/colecoes.js` para registrar. Imagem do acervo segue
`simulador/LOTE-PANDINHA-E-AQUARELA.md`. Depois: olhar as provas em `qa/provas-colecoes.html` e rodar
`npm run test:arte`.

## O que vem a seguir

### 1. O estúdio para outras peças (garrafa e ecobag no ar desde 23/09/2026)

A garrafa e a ecobag já estão no estúdio e no ar (`PECAS-NO-ESTUDIO.md`, merge `5d2b347`). O que vem:
o dono olhar as duas; mais ocasiões para elas (a leva é curta de
propósito: Com o seu nome e Treino na garrafa, Com o seu nome e Pequenos prazeres na ecobag); o copo
térmico e as outras peças, pelo passo a passo do fim de `PECAS-NO-ESTUDIO.md`. A quantidade (1 a 500),
que o simulador de desenho levava na mensagem, continua sem campo no estúdio (sugerido; sem resposta).

### 2. Mais coleções (a lista que o dono aprovou)

Em ordem de valor, na minha leitura — o dono decide a ordem de verdade:

| Coleção | Assuntos | Situação |
|---|---|---|
| Profissões e vocações | professor, enfermagem, medicina, direito, veterinária, engenharia, quem empreende | um balde só: 4 artes próprias; a ocasião mostra 21, contando as do Pandinha que aparecem ali também |
| Pessoas especiais | amiga, casal, mãe, pai, avós, irmãos, filhos, colegas | não existe |
| Celebrações e novas fases | noivado, formatura, aposentadoria | Aniversário com 2 artes; Casa nova com 6 |
| Humor e personalidade | frases engraçadas, signo, jeito de ser, piada entre amigos | não existe |
| Fé e espiritualidade | frases de fé, celebrações, símbolos | não existe |
| Empresas e equipes | boas-vindas, reconhecimento, evento, brinde, conquista | não existe |

**Três pontas da revisão de papelaria ficaram em aberto** (detalhe em
`panda-mimo/simulador/CONSERTOS-22-09.md`): 12 ilustrações não têm nenhum traço a 3:1 contra a
cerâmica clara e precisam de prova física antes de mexer no traço; a coleção esportiva é a única que
ainda usa Fredoka; e "Profissões e vocações" precisa virar assuntos de verdade.

### 3. Pendências que dependem do dono

1. **Trocar o número do WhatsApp** pelo real, no painel ou em `script.js`, e republicar.
2. **A tinta na garrafa pêssego.** O manual manda a arte em papel na peça pêssego (7.4), com contraste de
   1,6:1; a 7.3 proíbe branco sobre pêssego. Nanquim daria 11:1. Uma linha em `simulador/pecas.js`.
3. **Medidas e cores do fornecedor da garrafa e da ecobag**, e se a ecobag tem estampa no verso.
4. **Tipos de caneca e cores da peça.** Depende da lista real do fornecedor: quais peças existem
   (mágica, cônica, alça de coração, 15 oz) e a área de impressão de cada uma.
5. **A cena "caixa de presente".** Foi refeita; o dono quer olhar antes de manter.
6. **Vetorizar as 55 poses do Pandinha para o kit** (uns 190 MB no preset que passa na qualidade).
7. **O lugar dos grupos novos no seletor** (Com o Pandinha e Aquarela estão perto do fim) e **o teto de
   tamanho do Pandinha** (54 mm, pelo piso de 300 dpi).

### 4. Ideias recusadas de propósito

Não voltar a elas sem decisão nova: extrator de arte de terceiros por inteligência artificial, loja
com checkout embutido, biblioteca de milhares de cliparts genéricos, mapas e fase da lua, e arte
gerada por inteligência artificial na peça.

## Por onde começar depois da compactação

1. `panda-mimo/simulador/COMECE-AQUI.md` — o que é, como rodar, como a arte funciona, como nasce uma
   coleção, e onde o estúdio mora (nas duas páginas).
2. `panda-mimo/simulador/PECAS-NO-ESTUDIO.md` — caneca, garrafa e ecobag no mesmo estúdio: o que mora em
   `pecas.js`, o 3D de cada peça, os modelos delas, o que o guardião cobra e o passo a passo de peça nova.
3. `panda-mimo/simulador/LICOES-APRENDIDAS.md` — as armadilhas que já custaram tempo, inclusive as do
   processo (guardião por bloco, prova de defeito em pasta sobreposta, aba do navegador compartilhada).
4. `panda-mimo/simulador/REDESENHO-LEVE.md` e `MINHA-ARTE-EM-CAMADAS.md` — o desenho de 23/09/2026 e
   por que cada escolha foi feita.
5. `panda-mimo/MARCA.md` — o manual; manda em cor, letra, mascote e tom de voz. O histórico no fim
   conta o que mudou e por quê (a última versão é a 2.21).
6. Este arquivo, para o estado da frente.
