# Manual da marca Seu Mimo Studio

Versão 1.1 · setembro de 2026 · documento vivo

Marca de presentes personalizados para público geral, irmã da Panda Mimo (que fala com o público
feminino e infantil). As duas nunca se misturam: cada uma tem nome, paleta, tipografia, mascote e site
próprios. Este manual nasce da prancha aprovada em `kit/mestres/prancha-aprovada.png` e registra como a
identidade foi **construída em vetor** a partir dela, para que qualquer arte futura saia do mesmo padrão.

## 1. A marca em uma página

- **Nome:** Seu Mimo Studio. "Seu Mimo" em serifa, "STUDIO" em caixa alta espaçada. Nunca "SeuMimo",
  nunca "Seu Mimo Studio" tudo em caixa alta, nunca sem o "Studio" em peça oficial.
- **Descritor:** Presentes personalizados para todos os momentos.
- **Assinatura manuscrita:** "Mais do que presentes, são histórias que ficam." (uso pontual).
- **Mascote:** a Caixinha, um presente de papel kraft com laço oliva, rosto sereno, braços e pernas café,
  etiqueta com coração e um coração nos braços.
- **Sensação:** aconchego, elegância discreta, artesanal sem ser rústico.

## 2. Cores

| Nome | Uso | HEX | Token |
|---|---|---|---|
| Café essencial | texto, membros do mascote | `#3A2E21` | `--cafe` |
| Bege natural | destaque quente, kraft do mascote (`#C9A27B` no mascote) | `#C0966D` | `--bege` |
| Verde oliva | cor principal do logo, fundos escuros, fita | `#2F2E1E` | `--oliva` |
| Off white | texto sobre oliva, fundos claros | `#D4C7B5` | `--offwhite` |
| Preto | versões monocromáticas de impressão | `#050505` | `--preto` |
| Fundo | papel da prancha | `#E6D9CA` | `--fundo` |

Pares aprovados: oliva sobre fundo/off white; off white sobre oliva; café sobre bege. Nunca bege sobre
off white em texto (contraste insuficiente).

## 3. Tipografia

- **DM Serif Display** (OFL) para "Seu Mimo", títulos e números grandes. A prancha declarava Playfair
  Display, mas as letras desenhadas nela têm peso e contraste da DM Serif Display; o letreiro foi
  construído com ela e convertido em curvas. Playfair pode ser usada em textos de apoio longos.
- **Montserrat** (OFL) para "STUDIO", subtítulos em caixa alta espaçada (espaçamento 0,5 a 0,6 em) e
  todo texto corrido (peso 400 a 600).
- Manuscrita, para a assinatura: **Caveat** ou similar, uma frase por peça, nunca em botão ou preço.
- Arquivos em `kit/fontes/`.

## 4. Logotipo

Quatro peças, todas em `kit/svg/` com versões oliva, preta, branca e off white sobre oliva, e em
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

O mascote é um desenho vetorial 2D construído por peças, em `kit/mascote/mascote2.py` (gerador) e
`kit/svg/mascote-*.svg` (poses prontas). A **folha de modelo** (`kit/svg/folha-de-modelo.svg`) mostra as
cinco poses (feliz, piscando, agradecido, entregando, surpreso), as seis expressões (feliz, surpreso,
piscando, encantado, sorrindo, determinado) e o símbolo, todos com as mesmas peças e proporções.

Regras: caixa em kraft com lateral mais escura e tampa com espessura e beiral; laço oliva grande,
assentado no centro da tampa; a fita corre pela tampa até o canto direito e cai em ponta de andorinha pela
borda direita da frente, longe do rosto; rosto centrado na frente, sempre sobre kraft limpo; braços e pernas café com pontas redondas; etiqueta à esquerda com coração; no máximo um
coração solto por pose. Nova pose ou expressão nasce do gerador, nunca desenhada à parte.

O render 3D da prancha é referência de sensação, não peça da marca. Enquanto não houver um modelo 3D
(veja seção 8), imagens 3D não entram em material oficial.

## 6. Voz

Calma, próxima e adulta. Fala com "você"; a marca é "a gente" ou "o Studio". Frases curtas. Nada de
diminutivo em excesso (isso é território da Panda Mimo). Palavras da casa: mimo, presente, história,
momento, cuidado, prévia.

## 7. Aplicações previstas

Site próprio (mesma arquitetura e guardião do site da Panda Mimo, com esta identidade), redes sociais
(avatar `avatar.svg`, grade em fundo `#E6D9CA` e oliva alternados), embalagem kraft com fita oliva e
etiqueta off white com o símbolo, tag de produto com o logotipo vertical.

## 8. O que este kit não resolve (e quem resolve)

- **Modelo 3D do mascote** para renders consistentes: um modelador 3D (Blender), a partir da folha de
  modelo. Sem isso, cada imagem 3D de IA será um mascote diferente.
- **Refino artístico do mascote 2D** (volume, expressividade, mãos): um ilustrador pode trabalhar em cima
  dos SVGs, mantendo as proporções da folha de modelo.
- **Registro da marca no INPI**: "Mimo" é termo fraco; "Seu Mimo Studio" precisa de busca prévia nas
  classes 21, 35 e 40 antes de qualquer pagamento. Um agente de propriedade industrial ajuda se houver
  colidência.
- **Fotografia de produto** e **modelo 3D das embalagens**: fotógrafo.

## Histórico

| Data | Versão | O que mudou |
|---|---|---|
| set/2026 | 1.1 | Mascote redesenhado: caixa em perspectiva com tampa de espessura, laço grande assentado, fita pela borda direita, rosto limpo; símbolo de linha simplificado. Primeira construção do mascote descartada por não atingir o padrão. |
| set/2026 | 1.0 | Identidade construída em vetor a partir da prancha aprovada: letreiro em DM Serif Display e Montserrat, corações desenhados, símbolo monolinha, mascote 2D por peças com folha de modelo, kit em SVG e PDF, avatar. Traçados automáticos anteriores preservados em `kit/tracados-referencia/`. |
