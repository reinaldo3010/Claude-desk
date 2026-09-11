> **Leia antes: o desenho definitivo do mascote já existe.**
>
> Este documento nasceu como contorno, em agosto e setembro de 2026, para gerar imagens do mascote com
> alguma consistência enquanto o desenho definitivo não existia. Ele chegou em 11 de setembro de 2026 e
> está em `kit/mascote-2d/` (seção 5 do `MARCA.md`).
>
> O que muda: **não se gera mais o mascote.** Para qualquer material, use os arquivos do kit. A geração
> assistida continua útil para o que está **em volta** dele — cena, fundo, mockup de embalagem, foto de
> ambiente — com o mascote entrando depois, como camada, a partir do PNG transparente.
>
> A referência a subir numa IA de imagem, quando for o caso, passa a ser
> `kit/mascote-2d/poses/abracando-coracao.png`, e não mais o render 3D.

---

# Como fazer o mascote com IA, sempre igual

O problema não é a IA desenhar mal. É que ela desenha **diferente a cada vez**. A solução tem duas
fases: primeiro você gera um conjunto de imagens fiéis usando a referência aprovada; depois você
**treina** um modelo com esse conjunto, e a partir daí a Caixinha sai igual para sempre.

Os prompts estão em inglês de propósito: todos os geradores de imagem respondem melhor em inglês.
Você não precisa traduzir nada, é só copiar e colar.

---

## Qual ferramenta para quê

| Ferramenta | Para quê | Custo aproximado |
|---|---|---|
| **Nano Banana 2** (Gemini 3.1 Flash Image, no app do Gemini) | Gerar poses e cenas novas a partir da referência aprovada. É a melhor em manter o mesmo personagem. | plano gratuito ou Gemini Advanced |
| **LoRA treinada** (fal.ai ou Replicate) | A solução definitiva: um modelo que só sabe desenhar a *sua* Caixinha. | cerca de 2 a 10 dólares, uma vez |
| **Recraft V4 Pro** | Gerar a versão chapada em **SVG vetorial de verdade**, editável no Illustrator. | assinatura mensal |
| **Ilustrador humano** | O desenho-mestre definitivo e o refino artístico. | 300 a 2.000 reais |

Ordem recomendada: Nano Banana agora, LoRA quando tiver 15 a 30 imagens boas, Recraft para o vetor,
ilustrador quando o negócio justificar.

---

## O arquivo que você sobe como referência

`kit/mestres/referencia-mascote-1400.jpg`

É o mascote da prancha aprovada, recortado e limpo, no fundo creme da marca. **Suba sempre este
arquivo** antes de qualquer prompt. É ele que trava o padrão.

---

## Prompt 1 · O DNA da Caixinha

Este parágrafo descreve o personagem. Ele entra em **todo** prompt, sempre igual, sem mudar uma
palavra. É o que impede a IA de reinventar o mascote.

```
CHARACTER DNA — always reproduce exactly, never redesign:
A cute 3D character that is a kraft paper gift box. Cube-shaped body in warm tan kraft
paper (#C9A27B) with subtle paper grain, seen from a slight three-quarter angle so the left
side face is visible and slightly darker. A dark olive green (#2F2E1E) satin ribbon wraps the
box, with a large soft bow on top: two rounded loops, a small centre knot, and two short
tails. A small off-white paper gift tag (#EFE6D8) hangs on the left side from a thin dark
cord, with a simple hand-drawn heart outline on it. On the front face: two closed happy eyes
drawn as upward curved arcs in dark espresso (#3A2E21), a small closed smile below them, and
two soft coral blush ovals (#E0A48E) on the cheeks. Two rounded tube arms and two rounded
tube legs in dark espresso (#3A2E21), with simple mitten hands and rounded oval feet. Matte
soft-touch finish on the box, slightly glossy ribbon. Soft studio lighting from the upper
left, soft contact shadow on the ground. Warm cream background (#E6D9CA).
```

---

## Prompt 2 · Uma pose nova (Nano Banana)

Suba a referência, cole isto, e troque só a última linha.

```
Use the attached image as the exact reference for the character.

[cole aqui o CHARACTER DNA do Prompt 1]

CONSISTENCY CONSTRAINT: keep the character's identity, proportions, colours, materials,
lighting and art style EXACTLY as in the reference image. Do not redesign the box, the bow,
the tag or the face. Do not change the colour palette. Do not add text, logos or new props
that are not requested. Same camera distance, same soft studio lighting, same cream
background, full body visible with generous margin around the character.

NEW POSE: the character is walking to the right, leaning slightly forward, holding a small
cream envelope with both hands, looking happy.
```

Poses para gerar (uma por vez, trocando a última linha):

| Pose | Última linha |
|---|---|
| Feliz | `standing still, hugging a puffy dark olive green heart with both arms` |
| Piscando | `standing, winking with the right eye, one arm raised in a friendly wave` |
| Agradecido | `standing, both mitten hands pressed together in front of the chest, eyes closed, grateful` |
| Entregando | `walking to the right, leaning slightly forward, holding a small cream envelope with both hands` |
| Surpreso | `standing, both eyes wide open and round, small open mouth, arms raised in surprise` |
| Dormindo | `sitting on the ground, eyes closed with small sleep marks, head tilted, resting` |
| Com a peça | `standing, holding a personalised ceramic mug with both hands, proud` |

---

## Prompt 3 · Só a expressão (para os círculos do feed)

```
Use the attached image as the exact reference for the character.

[CHARACTER DNA]

CONSISTENCY CONSTRAINT: identical character, colours and style. Close-up crop of the front
face of the box only, centred, filling the frame, from just below the bow to just above the
arms. Same lighting and background.

EXPRESSION: eyes as small hearts, soft smile, blushing cheeks.
```

Variações: `closed happy arc eyes and a small smile` · `wide round eyes and a small open mouth` ·
`one eye winking` · `closed eyes and a wide open smile` · `half-closed determined eyes and a
straight mouth`.

---

## Prompt 4 · Folha de modelo (o arquivo mais valioso)

Peça isto uma vez e guarde o resultado. É o que um ilustrador pediria como ponto de partida, e é o
que alimenta o treino da LoRA.

```
Use the attached image as the exact reference for the character.

[CHARACTER DNA]

Create a character model sheet on a single image, flat cream background (#E6D9CA), evenly lit,
no shadows between views: the same character shown from the FRONT, from the SIDE (left),
from the BACK, and in a THREE-QUARTER view, all at the same height, standing in a neutral
pose with arms down, aligned on the same ground line. Keep proportions identical across all
four views. No text, no labels, no numbers.
```

---

## Prompt 5 · Cena e campanha (quando o mascote entra numa foto)

```
Use the attached image as the exact reference for the character.

[CHARACTER DNA]

CONSISTENCY CONSTRAINT: identical character, colours, materials and style. The character is
the only character in the scene.

SCENE: the character stands on a light wooden table beside a personalised stainless steel
water bottle, warm morning light from a window, soft shadows, shallow depth of field, cream
and olive colour palette, cosy and calm mood. Leave empty space in the upper right for text.
```

Regra da casa: **a IA nunca desenha o logotipo, o letreiro nem texto da marca.** Isso entra depois,
por cima, com os arquivos do kit. Se o texto aparecer na imagem gerada, peça de novo sem ele.

---

## Fase 2 · Treinar a LoRA (a solução definitiva)

Quando você tiver de 15 a 30 imagens boas e fiéis do mascote, vindas da fase 1:

1. Entre em **fal.ai** ou **Replicate** e procure por treino de LoRA (Flux LoRA training).
2. Suba as imagens num arquivo `.zip`.
3. Use a palavra-gatilho `SEUMIMOBOX` (uma palavra que não existe em nenhum outro lugar).
4. Escreva a legenda de cada imagem começando sempre igual:
   `SEUMIMOBOX kraft paper gift box character with olive ribbon bow, <o que a imagem mostra>`
5. Treine. Leva cerca de vinte minutos e custa poucos dólares.

Depois disso, qualquer imagem nova é só: `SEUMIMOBOX standing next to a birthday cake, warm
lighting, cream background`. O personagem sai idêntico, sempre, sem precisar subir referência.

Guarde o arquivo da LoRA junto com o kit da marca. **Ele passa a ser um ativo da empresa**, tão
importante quanto o logotipo.

---

## Fase 3 · A versão vetorial (Recraft V4 Pro)

O Recraft é o único que entrega SVG editável de verdade. Use para a versão chapada, de ícone.

```
Flat vector illustration of a cute kraft paper gift box character with a large dark olive
green ribbon bow on top, a small hanging gift tag with a heart, two closed happy curved eyes,
a small smile, rounded dark brown arms hugging an olive green heart, and rounded dark brown
legs. Simple geometric shapes, clean thick outlines, limited palette of tan #C9A27B, dark
olive #2F2E1E, dark brown #3A2E21, cream #EFE6D8. Centred, front view, white background,
no text, no gradients, no shadows.
```

Peça a saída em **SVG**, não em PNG.

---

## Antes de aceitar uma imagem, confira

- O laço tem duas alças e está no topo? A fita é verde oliva escura, não preta nem marrom?
- A etiqueta está à esquerda, com o coração desenhado?
- Os olhos são dois arcos fechados e felizes, e as bochechas têm o rosa suave?
- Braços e pernas são marrom espresso, com pontas redondas?
- A caixa é kraft, sem estampa nova, sem texto inventado?
- O fundo é o creme da marca?

Se dois itens falharem, gere de novo. Não use a imagem "quase certa": é assim que o padrão se perde.

---

## O mesmo vale para o Pandinha

A Panda Mimo tem o mesmo problema e a mesma solução. O DNA do Pandinha já está descrito na seção 6
do `panda-mimo/MARCA.md`, e a referência aprovada é `panda-mimo/marca/kit/pandinha-3d/`. Treine uma
LoRA separada, com a palavra-gatilho `PANDAMIMOBEAR`. **Nunca treine as duas marcas no mesmo
modelo**: elas se contaminam.
