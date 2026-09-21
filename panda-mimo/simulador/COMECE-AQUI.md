# Estúdio da caneca em 360° — comece por aqui

Documento de passagem do simulador de caneca da Panda Mimo. Quem chegar numa sessão nova lê este
arquivo primeiro, depois `panda-mimo/MARCA.md` (o manual manda em cor, letra, mascote e tom de voz).

Última atualização: 21 de setembro de 2026.

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
npm run servir              # abre em http://127.0.0.1:8765 (o estúdio é /caneca-3d.html)
npm test                    # testes unitários + guardião + nitidez (demora)
QA_VIEWPORTS=390,1280 npm test   # a passada rápida, a mesma do GitHub Actions
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
| `simulador/modelos.js` | A arte em camadas: catálogos, os 38 modelos e o desenho em milímetros |
| `simulador/paleta.js` | A paleta da marca num lugar só; todo desenho pede cor por token |
| `simulador/esportes.js` | Desenha as ilustrações de coleção por curvas, com a tinta escolhida |
| `simulador/esportes-dados.js` | Os caminhos das 137 ilustrações e os 24 modelos esportivos |
| `simulador/arte.js` | Compõe a textura, calcula dpi e exporta (300 dpi, gabarito) |
| `simulador/caneca-3d.js` | A caneca em three.js: geometria, luz, cenas, acabamento, vídeo, clique |
| `simulador/fontes.js` | Biblioteca de 15 letras (3 da marca + 12 OFL em `assets/fontes/arte/`) |
| `simulador/rascunho.js` | Rascunho no IndexedDB do aparelho |
| `simulador/zip.js` | Empacotador ZIP sem compressão, para o lote de nomes |
| `simulador/estudio.css` | Estilo do estúdio, sobre os tokens de `styles.css` |
| `qa/audit.mjs` | Guardião: site inteiro + estúdio de ponta a ponta |
| `qa/*-unit.test.mjs` | Testes unitários da arte e dos modelos |
| `qa/provas.mjs` | Gera as artes dos modelos para revisão visual |
| `qa/esportes-provas.html` | Catálogo das 24 artes esportivas, desenhado pelo motor do editor |

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

**Arte.** 38 modelos em 18 categorias, agrupadas em quatro grupos com ordem decidida à mão
(`ORDEM_DOS_GRUPOS` em `modelos.js`) e busca. Camadas de foto, frase, enfeite (9 desenhos),
elemento do acervo (8 ilustrações da marca) e Pandinha (9 poses, um por peça). Biblioteca de 15 letras.
Cores da paleta. Frase em arco.
A coleção esportiva acrescenta 137 ilustrações desenhadas por curvas (seis modalidades, 24 modelos),
que entram na arte como camada comum e pintam só por token — a regra está no manual, seção 9.1. Tratamento de foto (6 filtros) e recorte do fundo claro. Cor do fundo da
arte. Centralizar na frente, no meio, no verso e na altura. Margem de segurança à vista.

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

A coleção esportiva é o molde. Uma coleção é:

1. **Um grupo e as suas categorias** em `CATEGORIAS` (`modelos.js`), com o grupo listado em
   `ORDEM_DOS_GRUPOS` — senão o teste reprova.
2. **As ilustrações**, como caminhos (`M`, `L`, `C`, `Z`) centrados na origem, num arquivo de dados
   próprio. Cada uma tem `width`, `height`, `primary` (a tinta que a pessoa troca) e `paths`.
   **Cor só por token da paleta**; o teste reprova hexadecimal solto.
3. **Os modelos**, cada um uma lista de camadas em fração da área de impressão: ilustrações (tipo
   `enfeite`), espaços de foto, frases e a semente dos enfeites de fundo.
4. **Prova visual e teste.** `npm run provas` desenha as artes em `qa/shots`; o teste unitário
   confere proporção, edição isolada e redistribuição do fundo.

A coleção esportiva veio de SVGs convertidos por um script em Python que vive fora do repositório
(`colecao-esportes/adaptar_modelos.py`, na pasta acima). Coleção nova não precisa daquele caminho:
dá para escrever os caminhos direto no arquivo de dados.

## 8. Como continuar sem quebrar nada

1. Leia `MARCA.md` antes de mexer em cor, letra, mascote ou texto.
2. Faça a mudança e rode `QA_VIEWPORTS=390,1280 npm test`.
3. Toda regra nova de marca entra no manual **e** no histórico do fim dele.
4. Toda regressão que passar despercebida vira checagem no guardião, com defeito de prova para
   confirmar que a checagem reprova de verdade.
5. Modelo novo: copie um item de `MODELOS` em `modelos.js` e rode `npm run test:arte`.
6. Antes de publicar, olhe as provas (`npm run provas`) no tamanho de uso. O guardião confere regras,
   não gosto.

Leia também `LICOES-APRENDIDAS.md`, ao lado deste arquivo.
