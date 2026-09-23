# Estúdio da caneca em 360° — comece por aqui

Documento de passagem do simulador de caneca da Panda Mimo. Quem chegar numa sessão nova lê este
arquivo primeiro, depois `panda-mimo/MARCA.md` (o manual manda em cor, letra, mascote e tom de voz).

Última atualização: 23 de setembro de 2026. O redesenho leve e o layout estão em `REDESENHO-LEVE.md`; a
Minha arte em camadas, em `MINHA-ARTE-EM-CAMADAS.md`.

**O estúdio mora em dois lugares com uma marcação só.** A fonte é `caneca-3d.html`. A seção Monte seu mimo
da página inicial (`#estudio-no-site`) busca o `.studio-layout` dessa página, põe a folha `estudio.css` e
importa `estudio.js` quando a seção se aproxima da tela (`carregaEstudio()` em `script.js`). Mudou o
estúdio? Muda em `caneca-3d.html` e vale nos dois. Dentro da home, `--estudio-topo` é a altura da barra do
topo do site, para a caneca grudar abaixo dela; o guardião cobra isso no bloco `estudio-no-site`. Os lotes e a revisão estão documentados em `LOTE-PANDINHA-E-AQUARELA.md`, `LOTE-PRAZERES.md`, `LOTE-ATELIE.md` e `REVISAO-PAPELARIA.md`.

---

## 1. O que é

`panda-mimo/caneca-3d.html` é um estúdio onde a pessoa monta a arte de uma caneca e vê a peça girando
em 3D. Ela escolhe um modelo por ocasião, coloca fotos, escreve frases, acrescenta enfeites e o
Pandinha, e sai com a prévia para mandar no WhatsApp e a arte plana em 300 dpi para a produção.

Tudo acontece no navegador. Nenhuma foto sai do aparelho: o pedido segue por WhatsApp com a prévia
anexada, que é o fluxo de venda da casa.

## 2. Como rodar e conferir

```bash
cd panda-mimo
npm install                 # só na primeira vez
npm run servir              # abre em http://127.0.0.1:8765 (o estúdio está na página inicial, em #monte, e em /caneca-3d.html)
npm test                    # testes unitários + guardião + nitidez (uns 25 min; antes de publicar)
QA_VIEWPORTS=390,1280 npm test   # a passada rápida, a mesma do GitHub Actions
QA_SO=cardapio,minha-arte QA_VIEWPORTS=1280 node qa/audit.mjs   # só esses blocos (segundos a 2 min)
npm run test:arte           # só os testes unitários (segundos)
npm run provas              # gera as artes dos modelos em qa/shots, para revisão humana
```

Três armadilhas que já custaram tempo:

- **`npx` não funciona neste repositório** (o caminho tem `&`). Use `node node_modules/<pacote>/cli.js`.
- **Abrir o estúdio por `file://` não funciona**: o navegador trata cada imagem como de outra origem e
  bloqueia a leitura do canvas. Sempre `npm run servir`.
- **O guardião do estúdio sobe o próprio servidor** (`qa/servidor.mjs`), então não precisa de nada
  rodando antes.

## 3. Os arquivos

| Arquivo | Papel |
|---|---|
| `caneca-3d.html` | A página: prévia à esquerda, painel da arte em abas à direita |
| `simulador/estudio.js` | Liga tudo: abas, cartões, gestos, histórico, salvar, WhatsApp, Canva |
| `simulador/modelos.js` | A arte em camadas: catálogo de 199 modelos e desenho em milímetros |
| `simulador/pandinha-temas.js` | Com o Pandinha: 55 poses (ocasiões, profissões, saúde, esporte, paixões), uma arte para cada, e 4 adesivos do acervo |
| `simulador/aquarelas.js` | Aquarela: 6 ilustrações em aquarela e uma arte para cada |
| `simulador/imagens-do-acervo.js` | **Gerado**: o tamanho de cada imagem do acervo, para a caixa e o limite de 300 dpi |
| `simulador/hobbies.js` e `hobbies-desenhos.js` | Pequenos Prazeres: 24 modelos e 12 ilustrações vetoriais |
| `simulador/atelie.js` | Lote Ateliê: 12 modelos e oito novas ilustrações vetoriais |
| `simulador/paleta.js` | A paleta da marca num lugar só; todo desenho pede cor por token |
| `simulador/camadas.js` | Os atalhos para escrever uma camada: `foto`, `fotoRedonda`, `frase`, `ilustra`, `panda`, `elemento` |
| `simulador/colecoes.js` | O balcão das coleções: junta categorias, modelos e ilustrações |
| `simulador/nomes-de-ilustracao.js` | O nome que o cliente lê na camada de cada desenho |
| `simulador/ilustracoes-refinadas.js` | As 67 matrizes de papelaria; gerado, não se edita à mão |
| `simulador/desenho.js` | O vocabulário de desenho das ilustrações escritas à mão; mede e centra sozinho |
| `simulador/pets.js` | Coleção de pets: 16 ilustrações e 16 artes |
| `simulador/datas.js` | Coleção das datas comemorativas: 24 ilustrações e 18 artes |
| `simulador/bebe.js` | Coleção de bebê e maternidade: 13 ilustrações e 15 artes |
| `simulador/convites.js` | Coleção de convites e agradecimentos: 14 ilustrações e 15 artes |
| `simulador/esportes.js` | Desenha as ilustrações esportivas, convertidas de SVG |
| `simulador/esportes-dados.js` | Os caminhos das 137 ilustrações e os 24 modelos esportivos |
| `simulador/arte.js` | Compõe a textura, calcula dpi e exporta (300 dpi, gabarito) |
| `simulador/caneca-3d.js` | A caneca em three.js: geometria, luz, cenas, acabamento, vídeo, clique |
| `simulador/fontes.js` | Biblioteca de 15 letras (3 da marca + 12 OFL em `assets/fontes/arte/`) |
| `simulador/rascunho.js` | Rascunho no IndexedDB do aparelho |
| `simulador/zip.js` | Empacotador ZIP sem compressão, para o lote de nomes |
| `simulador/estudio.css` | Estilo do estúdio, sobre os tokens de `styles.css` |
| `qa/audit.mjs` | Guardião: site inteiro + estúdio de ponta a ponta |
| `qa/*-unit.test.mjs` | Testes unitários da arte e dos modelos |
| `qa/artes-aprovadas-unit.test.mjs` | A impressão digital das 138 artes aprovadas até 22/09: mexer no motor não pode mover um traço delas |
| `qa/imagens-unit.test.mjs` | As imagens do acervo: tabela certa, 300 dpi no tamanho máximo, caixa que abraça o desenho |
| `qa/provas.mjs` | Gera as artes dos modelos para revisão visual, em `qa/shots` |
| `qa/provas-colecoes.html` | Catálogo das artes das coleções, com filtro por coleção e assunto |

## 4. Como a arte funciona (o que não dá para esquecer)

- **Tudo em milímetros, em fração da área de impressão.** A área é 210 × 90 mm (21 × 9 cm), que a
  300 dpi dá 2480 × 1063 px. `x=0` é a borda junto da alça, `x=1` a outra borda; `y=0` é o topo.
- **A frente da caneca fica em `FRENTE` (≈0,193) e o verso em `VERSO` (≈0,807)**, derivados da volta
  (π × 82 mm) e da área impressa. Esses valores existem em `modelos.js` e são conferidos por teste.
- **O mesmo desenho serve para os três lugares**: textura do 3D, vista aberta e arquivo de 300 dpi.
  Não existe arte "só de tela". Se algo aparecer só na prévia, é bug.
- **Um modelo é só um conjunto inicial de camadas.** Depois de escolhido, tudo pode mudar.
- **Contorno de seleção e alças vivem só na vista aberta.** Nunca entram na textura, na prévia baixada
  nem no arquivo de impressão.
- **A UV do 3D é invertida de propósito** (`uvs.push(1 - u, …)`) para a arte ler da esquerda para a
  direita. As luzes e as vistas foram espelhadas junto. Mexer em uma coisa sem a outra espelha a arte.

## 5. O que já está pronto

**Peça e prévia.** Caneca reta de 325 ml em 3D, vistas (frente, verso, alça, interior), zoom, cores do
interior e da alça, quatro cenas (fundo claro, mesa de madeira, mesa clara, caixa de presente kraft),
acabamento brilhante ou fosco, vídeo de cinco segundos girando em WebM, prévia em PNG e em 4K.

**Arte.** 199 modelos em 43 categorias, agrupadas em onze grupos com ordem decidida à mão
(`ORDEM_DOS_GRUPOS` em `modelos.js`) e busca. Cada assunto tem pelo menos quatro artes, com teste. Camadas de foto, frase, enfeite (9 desenhos),
elemento do acervo (12 da marca e 6 aquarelas) e Pandinha (64 poses, quantos a pessoa quiser —
a regra de um por caneca caiu em 23/09/2026). Imagem do acervo nunca cresce a ponto de imprimir abaixo
de 300 dpi, e a caixa dela segue a proporção do arquivo (manual 9.1, "Imagem na arte"). Biblioteca de 15 letras.
Cores da paleta. Frase em arco.
Cinco coleções acrescentam ilustração própria, que entra na arte como camada comum e pinta só por
token: datas comemorativas (24), bebê e maternidade (13), convites e agradecimentos (14),
esportes (137) e pets (16). A regra está no manual, seção 9.1. Tratamento de foto (6 filtros) e recorte do fundo claro. Cor do fundo da
arte. Centralizar na frente, no meio, no verso e na altura. Margem de segurança à vista.

**Duas regras da ilustração de coleção que têm teste e já foram quebradas uma vez:**

1. **A cor principal (`primary`) é a que cobre o corpo do desenho**, porque é ela que recebe a tinta
   escolhida pela pessoa no estúdio. Se o `primary` apontar para um detalhe, trocar a cor não muda
   nada visível — foi o que aconteceu com 37 matrizes em setembro de 2026, e a aposta do chá
   revelação saiu com os dois balões rosa. A tabela medida vive em
   `marca/kit/fontes/colecoes-refinadas/primarios.json`, e o gerador a lê. O teste unitário cobra
   que ao menos um preenchimento use o `primary`; o guardião cobra que trocar a cor no estúdio mexa
   em pelo menos 0,5% da arte.
2. **Toda camada de ilustração tem nome de gente**, escrito em `nomes-de-ilustracao.js` ou no
   próprio modelo. Coleção nova sem nome deixa vazar id interno ("convite aliancas") para a lista de
   camadas que o cliente lê.

**Edição.** Clique e arrasto na própria caneca (com cadeado, fechado por padrão), alças de girar e
redimensionar na vista aberta, desfazer e refazer (60 passos, Ctrl+Z), duplicar, ordem, apagar.

**Saída.** Prévia, arte plana em 300 dpi, gabarito, projeto em arquivo, link da montagem (sem fotos),
rascunho automático no aparelho, compartilhamento direto no celular, ida e volta com o Canva, e
"vários nomes de uma vez" gerando uma arte por nome num ZIP.

## 6. O que está pendente (decisão do dono)

1. **Outros tipos de caneca** (mágica, cônica, alça de coração, 15 oz) e **cor externa e do anel**:
   cada um tem medida própria de área de impressão. Precisa da lista real do fornecedor para modelar.
2. **Cena "caixa de presente"**: foi refeita depois de uma primeira versão ruim. Vale um olhar do dono
   para manter ou tirar.
3. **O WhatsApp do site ainda é o número de reserva** (`5500000000000`). O guardião avisa a cada
   execução. Troca-se pelo painel ou em `script.js`.
4. **Remover fundo por inteligência artificial** ficou de fora de propósito: exigiria embarcar um
   modelo de vários megabytes com licença comercial. O recorte atual funciona em fundo liso e avisa
   quando não dá.

## 7. Como nasce uma coleção nova

`simulador/pets.js` é o molde: um arquivo só, com as ilustrações em cima e os modelos embaixo.

1. **As ilustrações.** Cada uma é `ilustracao({ primary, partes })`, com as partes no vocabulário de
   `desenho.js`: `{ circulo }`, `{ elipse }`, `{ retangulo }`, `{ linha }` e `{ d: 'M … C … Z' }`
   (só comandos maiúsculos; o minúsculo do SVG é relativo e o código recusa). Coordenadas em volta
   da origem, y para baixo — **o tamanho e o centro são medidos sozinhos**, não se declara nada.
   Cor só por token da paleta, e a cor `primary` é a que a pessoa troca.
2. **As categorias**, todas com o mesmo `grupo`, e o grupo listado em `ORDEM_DOS_GRUPOS`
   (`modelos.js`) — senão o teste reprova.
3. **Os modelos**, com os atalhos de `camadas.js`: `ilustra`, `foto`, `fotoRedonda`, `frase`. Tudo em
   fração da área de impressão. Cada arte muda de planta; repetir a planta e trocar a frase reprova.
4. **Registrar no balcão**: três linhas em `simulador/colecoes.js`.
5. **Olhar e testar.** `npm run servir` e `qa/provas-colecoes.html` para ver as artes no tamanho de
   uso; `npm run test:arte` para conferir tamanho, sobreposição, cor e proporção.

O jeito de trabalhar que funcionou: desenhar, **olhar**, corrigir. As primeiras versões das
ilustrações sempre têm alguma coisa fora do lugar, e isso só aparece olhando.

A coleção esportiva seguiu outro caminho: veio de SVGs convertidos por um script em Python que vive
fora do repositório (`colecao-esportes/adaptar_modelos.py`, na pasta acima). Por isso o formato dela
é outro — lista de comandos em vez de partes. Os dois formatos convivem no balcão de propósito;
coleção nova não precisa do Python.

## 8. Como continuar sem quebrar nada

1. Leia `MARCA.md` antes de mexer em cor, letra, mascote ou texto.
2. Faça a mudança e rode `QA_VIEWPORTS=390,1280 npm test`.
3. Toda regra nova de marca entra no manual **e** no histórico do fim dele.
4. Toda regressão que passar despercebida vira checagem no guardião, com defeito de prova para
   confirmar que a checagem reprova de verdade. O defeito vai numa pasta à parte, nunca no arquivo do
   site: `QA_SOBREPOR=<pasta> QA_SO=<bloco> QA_VIEWPORTS=1280 node qa/audit.mjs`, com a pasta imitando
   os caminhos (`<pasta>/simulador/estudio.js`) e só o bloco que tem de pegar o defeito (o nome está no
   `roda('...')` de cada bloco do `qa/audit.mjs`). Quem estiver com o estúdio aberto não vê o defeito, e
   cada prova leva menos de um minuto.
5. Modelo novo: copie um item de `MODELOS` em `modelos.js` e rode `npm run test:arte`. Coleção
   nova: seção 7 aqui em cima.
6. Antes de publicar, olhe as provas (`npm run provas`) no tamanho de uso. O guardião confere regras,
   não gosto.

Leia também `LICOES-APRENDIDAS.md`, ao lado deste arquivo.
