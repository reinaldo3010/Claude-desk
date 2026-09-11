# Manual da marca Seu Mimo Studio

Versão 1.2 · setembro de 2026 · documento vivo

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
| Papel claro | blocos, cartões e páginas do manual sobre o fundo | `#EFE6D8` | `--papel` |

Pares aprovados: oliva sobre fundo, papel claro e off white; off white sobre oliva; café sobre bege.
Nunca bege sobre off white em texto (contraste insuficiente); em texto sobre fundo claro, use a versão
escurecida `#9C7444`.

## 3. Tipografia

- **DM Serif Display** (OFL) para "Seu Mimo", títulos e números grandes. A prancha declarava Playfair
  Display, mas as letras desenhadas nela têm peso e contraste da DM Serif Display; o letreiro foi
  construído com ela e convertido em curvas. Playfair pode ser usada em textos de apoio longos.
- **Montserrat** (OFL) para "STUDIO", subtítulos em caixa alta espaçada e todo texto corrido (peso 400
  a 600). Espaçamento da caixa alta: 0,5 a 0,6 em no "STUDIO" e em títulos; 0,3 em em rótulos pequenos
  (11 px), onde o espaço maior quebra a palavra.
- Manuscrita, para a assinatura: **Caveat** ou similar, uma frase por peça, nunca em botão ou preço.
- Arquivos em `kit/fontes/`.

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

**Peça em aberto.** O desenho definitivo do mascote ainda não existe. A construção vetorial feita em
setembro de 2026 (`kit/mascote/mascote2.py` e `kit/svg/mascote-*.svg`) foi **reprovada pelo dono** e
continua no kit apenas como registro de geometria e proporção; não sai em material publicado.

**A referência aprovada** é o render da prancha, recortado em `kit/mestres/referencia-mascote-1400.jpg`.
É dela que saem as imagens enquanto o desenho definitivo não chega, pelo roteiro de `../PROMPTS-MASCOTE.md`
(referência mais Nano Banana agora, LoRA treinada em seguida). Toda imagem gerada passa pelo checklist
daquele documento antes de ser usada.

**Anatomia fixa**, que vale para qualquer versão futura: caixa de papel kraft em três quartos, lateral
mais escura e tampa com espessura; fita verde oliva cruzando a tampa, laço no topo e ponta em andorinha
caindo pela borda direita; nada cruza o rosto; rosto centrado na frente, sobre kraft limpo, com dois arcos
fechados, sorriso curto e bochechas em rosa suave (tom do mascote, não da paleta da marca); braços e
pernas café com pontas redondas; etiqueta off white à esquerda, com coração desenhado; no máximo um
coração solto por arte.

**O definitivo** sai de um ilustrador, a partir desta referência e destas regras, com folha de poses
(seção 8). Enquanto isso, o mascote não aparece em peça impressa nem em embalagem.

## 6. Voz

Calma, próxima e adulta. Fala com "você"; a marca é "a gente" ou "o Studio". Frases curtas. Nada de
diminutivo em excesso (isso é território da Panda Mimo). Palavras da casa: mimo, presente, história,
momento, cuidado, prévia.

## 7. Aplicações previstas

Site próprio (mesma arquitetura e guardião do site da Panda Mimo, com esta identidade), redes sociais
(avatar `avatar.svg`, grade em fundo `#E6D9CA` e oliva alternados, com bege em dose pequena), embalagem kraft com fita oliva e
etiqueta off white com o símbolo, tag de produto com o logotipo vertical.

## 8. O que este kit não resolve (e quem resolve)

- **Modelo 3D do mascote** para renders consistentes: um modelador 3D (Blender), a partir da folha de
  modelo. Sem isso, cada imagem 3D de IA será um mascote diferente.
- **Desenho definitivo do mascote 2D**: um ilustrador, a partir da referência aprovada e da anatomia da
  seção 5, entregando vetor editável e folha de poses. É a pendência mais importante da marca.
- **Registro da marca no INPI**: "Mimo" é termo fraco; "Seu Mimo Studio" precisa de busca prévia nas
  classes 21, 35 e 40 antes de qualquer pagamento. Um agente de propriedade industrial ajuda se houver
  colidência.
- **Fotografia de produto** e **modelo 3D das embalagens**: fotógrafo.

## 9. Book da marca

O manual tem uma versão visual em prancha, com capa, a marca, logotipo e uso, cores, tipografia, mascote
e aplicações, mais a home do site em computador e celular. Ela é editável e exporta em PDF e PNG. Quando
uma regra mudar aqui, a prancha muda junto.

---

## Histórico

| Data | Versão | O que mudou |
|---|---|---|
| set/2026 | 1.2 | Mascote passa a constar como peça em aberto: construção vetorial reprovada pelo dono, referência aprovada e roteiro de geração assumem o lugar, desenho definitivo vai para ilustrador (5 e 8). Papel claro `#EFE6D8` entra na paleta (2). Espaçamento de caixa alta por tamanho (3). Correção: são cinco peças de logotipo, não quatro (4). Book visual da marca com o site (9). |
| set/2026 | 1.1 | Mascote redesenhado: caixa em perspectiva com tampa de espessura, laço grande assentado, fita pela borda direita, rosto limpo; símbolo de linha simplificado. Primeira construção do mascote descartada por não atingir o padrão. |
| set/2026 | 1.0 | Identidade construída em vetor a partir da prancha aprovada: letreiro em DM Serif Display e Montserrat, corações desenhados, símbolo monolinha, mascote 2D por peças com folha de modelo, kit em SVG e PDF, avatar. Traçados automáticos anteriores preservados em `kit/tracados-referencia/`. |
