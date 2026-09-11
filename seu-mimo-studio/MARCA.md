# Manual da marca Seu Mimo Studio

Versão 1.4 · setembro de 2026 · documento vivo

Marca de presentes personalizados para público geral, irmã da Panda Mimo (que fala com o público
feminino e infantil). As duas nunca se misturam: cada uma tem nome, paleta, tipografia, mascote e site
próprios. Este manual nasce da prancha aprovada em `kit/mestres/prancha-aprovada.png` e registra como a
identidade foi construída a partir dela, para que qualquer arte futura saia do mesmo padrão: logotipo,
letreiro e símbolo **em vetor** (seção 4); o mascote como **ilustração** de alta resolução (seção 5).

## 1. A marca em uma página

- **Nome:** Seu Mimo Studio. "Seu Mimo" em serifa, "STUDIO" em caixa alta espaçada. Nunca "SeuMimo",
  nunca "Seu Mimo Studio" tudo em caixa alta, nunca sem o "Studio" em peça oficial.
- **Descritor:** Presentes personalizados para todos os momentos.
- **Assinatura manuscrita:** "Mais do que presentes, são histórias que ficam." (uso pontual).
- **Mascote:** a Caixinha, um presente de papel kraft com laço oliva, rosto sereno, braços e pernas café,
  etiqueta com coração e um coração nos braços. Desenho definitivo em `kit/mascote-2d/` (seção 5).
- **Sensação:** aconchego, elegância discreta, artesanal sem ser rústico.

## 2. Cores

| Nome | Uso | HEX | Token |
|---|---|---|---|
| Café essencial | texto, membros do mascote | `#3A2E21` | `--cafe` |
| Bege natural | destaque quente, botão sobre oliva | `#C0966D` | `--bege` |
| Verde oliva | cor principal do logo, fundos escuros, fita | `#2F2E1E` | `--oliva` |
| Off white | texto sobre oliva, fundos claros | `#D4C7B5` | `--offwhite` |
| Preto | versões monocromáticas de impressão | `#050505` | `--preto` |
| Fundo | papel da prancha | `#E6D9CA` | `--fundo` |
| Papel claro | blocos, cartões e páginas do manual sobre o fundo | `#EFE6D8` | `--papel` |

Pares aprovados: oliva sobre fundo, papel claro e off white; off white sobre oliva; café sobre bege.
Nunca bege sobre off white em texto (contraste insuficiente); em texto sobre fundo claro, use a versão
escurecida `#9C7444`.

### 2.1 Pares medidos

Todos conferidos em contraste WCAG ao construir o site (setembro de 2026). Texto normal precisa de
4,5:1; texto grande (24 px ou mais) e elemento de interface, de 3:1.

| Par | Razão | Onde usar |
|---|---|---|
| Café sobre fundo | 9,5 | texto corrido |
| Oliva sobre fundo | 9,9 | títulos |
| Café sobre papel claro | 10,7 | texto em cartão |
| Off white sobre oliva | 8,3 | texto na faixa escura |
| Café sobre bege | 4,9 | botão bege |
| Bege sobre oliva | 5,1 | desenho de linha na faixa escura |
| **Bege sobre fundo ou papel claro** | **1,9 e 2,2** | **nunca, em nada** |
| `#9C7444` sobre fundo ou papel, a 24 px ou mais | 3,0 e 3,4 | número de passo, algarismo grande |

Tons de apoio (o mesmo tom, com transparência) já calibrados para passar em 11 px:
`rgba(58,46,33,.75)` sobre fundo e papel claro (4,9 e 5,3); `rgba(212,199,181,.75)` sobre oliva (5,4).
Abaixo dessas transparências o texto reprova. Borda de botão contornado: `rgba(47,46,30,.55)`, que dá
3,0 — a 0,35 da prancha original dava 1,9 e não passava.

## 3. Tipografia

- **DM Serif Display** (OFL) para "Seu Mimo", títulos e números grandes. A prancha declarava Playfair
  Display, mas as letras desenhadas nela têm peso e contraste da DM Serif Display; o letreiro foi
  construído com ela e convertido em curvas. Playfair pode ser usada em textos de apoio longos.
- **Montserrat** (OFL) para "STUDIO", subtítulos em caixa alta espaçada e todo texto corrido (peso 400
  a 600). Espaçamento da caixa alta: 0,5 a 0,6 em no "STUDIO" e em títulos; 0,3 em em rótulos pequenos
  (11 px), onde o espaço maior quebra a palavra.
- Manuscrita, para a assinatura: **Caveat** (OFL), uma frase por peça, nunca em botão ou preço.
- Arquivos mestres em `kit/fontes/`, em TTF. Para uso em tela, os subconjuntos latinos em WOFF2 ficam
  em `site/assets/fontes/` e são servidos do próprio endereço do site: nenhuma página pública pede
  fonte a terceiros (Google Fonts incluído), por privacidade e por velocidade de primeira pintura.
  Para gerar de novo, veja o `site/LEIAME.md`.

## 4. Logotipo

Cinco peças, todas em `kit/svg/` com versões oliva, preta, branca e off white sobre oliva, e em
`kit/pdf/`:

| Peça | Arquivo | Quando |
|---|---|---|
| Principal | `logo-principal*` | cabeçalho de site, embalagem, assinatura de e-mail |
| Letreiro | `letreiro*` | quando o coração não cabe (faixas estreitas) |
| Vertical | `logo-vertical*` | avatar quadrado, etiqueta, carimbo, capa |
| Símbolo | `simbolo*` | favicon, marca d'água, bordado, gravação a laser |
| Avatar | `avatar*` | foto de perfil de redes sociais |

Regras: área de respiro igual à altura do "S" em todos os lados; largura mínima 120 px ou 30 mm para o
principal, 24 px ou 8 mm para o símbolo; nunca rotacionar, esticar, aplicar sombra ou contorno; sobre
foto, usar a versão branca ou off white com a foto escurecida.

## 5. Mascote: a Caixinha

**Resolvido.** O desenho definitivo chegou em 11 de setembro de 2026, com folha de modelo, folhas de
poses e as poses soltas em PNG transparente de alta resolução. Está em **`kit/mascote-2d/`**, e é o
único mascote que sai em material publicado.

**Estilo:** ilustração chapada, com contorno escuro contínuo e volume sugerido por sombra macia — não é
render 3D. O contorno é o que casa o mascote com o símbolo monolinha do logotipo: os dois têm a mesma
espessura de traço aparente e a mesma leitura a tamanho pequeno.

**Anatomia fixa**, confirmada pela arte definitiva e válida para qualquer pose nova: caixa de papel
kraft em três quartos, lateral mais escura e tampa com espessura; fita verde oliva cruzando a tampa,
laço no topo e ponta em andorinha caindo pela borda esquerda; nada cruza o rosto; rosto centrado na
frente, sobre kraft limpo, com dois arcos fechados, sorriso curto e bochechas em rosa suave; braços e
pernas café com pontas redondas; etiqueta off white à esquerda, com coração desenhado; no máximo um
coração solto por arte.

### 5.1 Paleta própria do mascote

Medida na arte definitiva, não escolhida a olho. Os valores estão em `kit/cores.json`, em `mascote`.

| Parte | HEX |
|---|---|
| Contorno | `#180B04` |
| Kraft, brilho | `#FFDCA7` |
| Kraft, frente | `#F0BA84` |
| Kraft, sombra | `#BA7E4E` |
| Fita, meio-tom | `#5A5A42` |
| Fita, sombra | `#363624` |
| Coração | `#54543C` |
| Café dos membros | `#422A1E` |
| Etiqueta | `#F6DEC0` |
| Bochecha | `#F7A180` |

O kraft do mascote é mais claro e mais rosado que o bege da marca (`#C0966D`), de propósito: o mascote
aparece sobre o fundo e sobre o oliva, e precisa de luz própria para se destacar nos dois. **Estas cores
são só do mascote**: não entram em texto, botão nem fundo de página.

### 5.2 O que existe na folha de modelo

`kit/mascote-2d/folha-de-modelo.png` é o documento que mantém o padrão. Pose nova se desenha a partir
dela, nunca de memória.

- **12 expressões:** feliz, sorrindo, piscando, surpreso, apaixonado, triste, bravo, com sono,
  assustado, rindo, determinado, encantado.
- **16 poses e ações:** em pé, acenando, pulando, pensativo, com presente, carregando, correndo,
  com balões, com flores, olhando para cima, olhando para baixo, abraçando, sorrindo e piscando,
  sentado, de costas, deitado.
- **6 variações de laço:** com tag e sem tag em oliva (as oficiais), mais vermelho, rosa, azul e branco
  para ocasião. Só o oliva entra em material da marca; os outros nunca no logotipo nem no símbolo.
- **6 elementos extras:** coração, tag, corações, balões, presente, flores.
- **3 tratamentos de fundo:** fundo claro, fundo escuro e ícone redondo.

### 5.3 Pose oficial e uso no site

A pose oficial é **`poses/abracando-coracao.png`**: em pé, de frente, sorriso sereno, coração nos
braços, sem sombra no chão. É a que abre o site.

As nove poses soltas da entrega são **variações da mesma pose** — mudam o sorriso (sereno ou aberto), a
posição das pernas, a sombra no chão e a presença de corações soltos. Os nomes dizem qual é qual. As
outras quinze ações da folha de modelo existem como desenho na folha, mas **ainda não** como arquivo
solto em alta resolução (seção 8).

O site nunca guarda arte original: `kit/mascote-2d/exporta-para-o-site.py` recorta a folga transparente
e grava as versões em WebP que o site usa, em 1x e @2x.

| Arquivo no site | Pose de origem | Onde aparece |
|---|---|---|
| `mascote-abertura` | `abracando-coracao` | abertura da home |
| `mascote-convite` | `abracando-coracao-sorrindo-2` | fecho, sobre a faixa oliva |
| `mascote-perdido` | `abracando-coracao-sereno-com-sombra` | página 404 |

Se a arte do mascote mudar no kit, rode o programa de novo e os arquivos do site se atualizam.

### 5.4 O que ficou para trás

Duas coisas não voltam, e o guardião do site reprova as duas:

- A **construção vetorial** de setembro de 2026 (`kit/mascote/*.py` e `kit/svg/mascote-*.svg`), reprovada
  pelo dono. Continua no kit só como registro de geometria; não sai publicada.
- O **render 3D** que servia de referência provisória (`kit/mestres/referencia-mascote-*`). Cumpriu o
  papel de segurar o padrão enquanto o desenho definitivo não existia. O mestre fica guardado, mas o
  mascote da marca agora é a ilustração chapada.

## 6. Voz

Calma, próxima e adulta. Fala com "você"; a marca é "a gente" ou "o Studio". Frases curtas. Nada de
diminutivo em excesso (isso é território da Panda Mimo). Palavras da casa: mimo, presente, história,
momento, cuidado, prévia.

## 7. Aplicações previstas

**Site próprio: existe, em `site/`.** Construído em setembro de 2026 com a arquitetura e o guardião do
site da Panda Mimo e a identidade desta marca. HTML, CSS e JavaScript puros, sem build. Cores e fontes
saem só dos tokens de `site/styles.css`; texto e chamadas seguem a voz da seção 6. Publicação no
Cloudflare Pages, banco Supabase próprio com prefixo `sms_`. Antes de qualquer mudança ir ao ar,
`cd site && npm test`. Detalhes em `site/LEIAME.md` e `site/qa/LEIA-ME.md`.

Demais aplicações: redes sociais (avatar `avatar.svg`, grade em fundo `#E6D9CA` e oliva alternados, com
bege em dose pequena), embalagem kraft com fita oliva e etiqueta off white com o símbolo, tag de produto
com o logotipo vertical.

## 8. O que este kit não resolve (e quem resolve)

- **Modelo 3D do mascote**, se algum dia a marca quiser render: um modelador (Blender), a partir da
  folha de modelo. Deixou de ser urgente — a identidade agora é ilustração chapada, e render 3D de IA
  é justamente o caminho que produzia um mascote diferente a cada imagem.
- **Mascote em vetor editável**: a arte definitiva chegou em PNG de alta resolução com fundo
  transparente, o que resolve site, redes e impressão. Não resolve bordado, gravação a laser e corte,
  que precisam de curva. Quem resolve: um ilustrador vetorizando a arte da seção 5, mantendo a
  anatomia e a paleta 5.1. É hoje a pendência mais importante da marca.
- **As outras quinze ações em arquivo solto**: a folha de modelo tem dezesseis poses, mas só a de
  abraçar o coração veio como PNG em alta resolução. As demais existem como desenho na folha e
  precisam ser exportadas uma a uma para virarem material de uso.
- **Registro da marca no INPI**: "Mimo" é termo fraco; "Seu Mimo Studio" precisa de busca prévia nas
  classes 21, 35 e 40 antes de qualquer pagamento. Um agente de propriedade industrial ajuda se houver
  colidência.
- **Fotografia de produto** e **modelo 3D das embalagens**: fotógrafo. É a pendência que mais aparece
  hoje: os seis quadros de peça do site estão com o desenho de linha e a legenda "foto da peça" no
  lugar da foto. O formato exigido é quadro **quadrado transparente**, peça inteira, folga em volta,
  760 px e @2x em 1520 px; o guardião confere os pixels e reprova fundo retangular ou peça encostando
  na borda.

## 9. Book da marca

O manual tem uma versão visual em prancha, com capa, a marca, logotipo e uso, cores, tipografia, mascote
e aplicações, mais a home do site em computador e celular. Ela é editável e exporta em PDF e PNG. Quando
uma regra mudar aqui, a prancha muda junto.

---

## Histórico

| Data | Versão | O que mudou |
|---|---|---|
| set/2026 | 1.4 | **Mascote resolvido.** Desenho definitivo entregue: folha de modelo com 12 expressões, 16 poses, 6 variações de laço, 6 elementos extras e 3 fundos, mais as poses soltas em PNG transparente, tudo em `kit/mascote-2d/` (5, 5.2, 5.3). Estilo fixado como ilustração chapada com contorno, não render 3D (5). Paleta própria do mascote medida na arte e registrada (5.1); o kraft dele não é mais descrito como o bege da marca (2). A construção vetorial reprovada e o render 3D de referência passam a registro (5.4). Site trocado para a arte definitiva na abertura, no fecho e na 404. Pendência do mascote muda de "desenho" para "vetor editável" e para as quinze ações que faltam em arquivo solto (8). |
| set/2026 | 1.3 | Site próprio construído em `site/`, com o guardião apontado para ele (7). Caveat entra no kit como a manuscrita da marca, não mais "ou similar", e os subconjuntos WOFF2 passam a ser servidos do próprio site (3). Pares de cor medidos em contraste e registrados; três tons da prancha original reprovavam em AA e foram corrigidos — bege nunca em texto sobre fundo claro, e o número de passo passa a usar `#9C7444` (2.1). |
| set/2026 | 1.2 | Mascote passa a constar como peça em aberto: construção vetorial reprovada pelo dono, referência aprovada e roteiro de geração assumem o lugar, desenho definitivo vai para ilustrador (5 e 8). Papel claro `#EFE6D8` entra na paleta (2). Espaçamento de caixa alta por tamanho (3). Correção: são cinco peças de logotipo, não quatro (4). Book visual da marca com o site (9). |
| set/2026 | 1.1 | Mascote redesenhado: caixa em perspectiva com tampa de espessura, laço grande assentado, fita pela borda direita, rosto limpo; símbolo de linha simplificado. Primeira construção do mascote descartada por não atingir o padrão. |
| set/2026 | 1.0 | Identidade construída em vetor a partir da prancha aprovada: letreiro em DM Serif Display e Montserrat, corações desenhados, símbolo monolinha, mascote 2D por peças com folha de modelo, kit em SVG e PDF, avatar. Traçados automáticos anteriores preservados em `kit/tracados-referencia/`. |
