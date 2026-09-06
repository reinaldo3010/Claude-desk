# Kit da marca Panda Mimo

Pasta-mestre da identidade: tudo o que aparece no site, em vetor, mais as fontes oficiais e o
texto para usar com IA. É daqui que sai qualquer arte, mockup, post ou impressão. O manual
(`../../MARCA.md`) manda sobre o uso; esta pasta só guarda os arquivos.

**Regra de ouro:** a IA nunca desenha o logo, o Pandinha nem texto da marca. Ela faz cena, fundo,
pose nova e mockup; logo, nome do cliente e frases entram depois, como camada, com os arquivos
desta pasta e as fontes instaladas. Quando precisar do logo dentro da imagem gerada, mande o
PNG como imagem de referência e peça para manter exatamente, sem redesenhar; confira o resultado.

## O que tem aqui

| Pasta / arquivo | O que é | Quando usar |
|---|---|---|
| `svg/` | 56 vetores traçados a partir das ilustrações do site (logos, Pandinha, adesivos, ícones, selos) | Illustrator, Inkscape, Canva, Figma, CorelDRAW, plotter, gráfica. Escala sem perder nitidez. |
| `gera-png.mjs` | Gera PNG com fundo transparente a partir dos SVGs, no tamanho que você pedir | Quando precisar de PNG grande (4000 px, 6000 px) para DTF, sublimação, redes ou IA. |
| `fontes/` | Fredoka, Caveat e Nunito em TTF (variáveis) com a licença OFL | Instalar no computador antes de abrir qualquer arte; Canva e Figma aceitam upload das mesmas. |
| `fidelidade.md` | Tabela gerada na montagem: fonte, traçado, tamanho e fidelidade medida de cada vetor | Para saber o quanto confiar em cada arquivo e o que refazer quando houver arte melhor. |
| `prompt-de-marca.md` | Descrição curta da marca para colar em ChatGPT, Gemini, Nano Banana etc. | No lugar do PDF do manual, que essas IAs leem como inspiração, não como regra. |

### Vetores por grupo

- **Logotipo (3):** `logo-redondo` (selo, avatar e assinatura principal), `logo-pill` (pílula, cabeçalhos e
  tarja em foto), `logo-empilhado` (versão vertical para embalagem e tag).
- **Pandinha (11):** `mascote-hero` e `panda-caixa`, `panda-carinha`, `panda-carrinho`, `panda-copo`,
  `panda-coracao`, `panda-dormindo`, `panda-joinha`, `panda-novidades`, `panda-presente`, `panda-presente-2`.
- **Lançamentos (12):** `lanc-*`, poses e adesivos que ilustram as peças em teste.
- **Adesivos e enfeites (13):** `faixa-amor`, `faixa-carinho`, `faixa-momentos`, `coracao-costura`,
  `coracao-jeito`, `laco`, `flor`, `folha`, `pata-preta`, `pata-rosa`, `sino`, `tag-especial`, `mock-caixa`.
- **Balões, selos e ícones (17):** `balao-duvidas`, `balao-frase`, `celular-siga`, `badge-envio`,
  `badge-frete`, `badge-qualidade`, `badge-seguro`, `ic-camera`, `ic-caminhao`, `ic-coracao`, `ic-escudo`,
  `ic-ideia`, `ic-presente`, `ic-sacola`, `rede-instagram`, `rede-tiktok`, `rede-whatsapp`.

### O que não está em vetor, e por quê

As fotos de produto (`assets/prod-*`), as fotos em uso (`assets/uso-*`, `assets/foto-*`) e a imagem de
compartilhamento (`assets/og.jpg`) são fotografias: vetorizar uma foto não faz sentido. Os melhores
arquivos delas são os `@2x.webp` em `assets/` (1520 px nos quadros de catálogo). Quando entrarem
fotos reais em alta resolução, elas passam a ser os mestres.

## Como os vetores foram feitos (e o limite deles)

O logo e o Pandinha nasceram por IA em estilo "inflado", com sombra e brilho contínuos. Um vetor
de verdade é feito de formas chapadas; então cada arquivo aqui é um **traçado fiel** (vtracer, em
camadas de cor empilhadas) da ilustração ampliada em 2x por super-resolução (Real-ESRGAN, modelo de ilustração). Em tamanho normal e
em impressão ele é indistinguível do original e escala sem serrilhar; olhando com zoom forte,
o relevo aparece em degraus finos de cor. Cada arquivo recebeu o traçado mais leve que ainda
reproduz o original com fidelidade medida (renderizado de volta e comparado pixel a pixel na área
com tinta: todos em 24 dB de PSNR ou mais, exceto o Pandinha dormindo em 23,9; silhueta com mais de 98%
de coincidência); os logos usam
sempre o traçado mais fino. A borda foi endurecida antes do
traçado (o que tinha menos de 50% de opacidade virou transparente): por isso o contorno sai firme e sem
franja, e os poucos adesivos que tinham sombra difusa em volta (patas, sino, flor) ficam de recorte
limpo, como convém a um adesivo.

Isso resolve nitidez e escala, mas **não substitui um redesenho vetorial do logo**, feito à mão por
designer sobre estes arquivos, com poucas formas editáveis e uma versão chapada monocromática. Esse
redesenho é a pendência aberta na seção 14 do manual; quando existir, entra nesta pasta como
`logo-*-vetor.svg`, sem apagar os traçados.

## Gerar PNG

```bash
cd panda-mimo
npm install && npx playwright install chromium      # uma vez
node marca/kit/gera-png.mjs 4000                    # todos, lado maior 4000 px, em marca/kit/png/
node marca/kit/gera-png.mjs 3000 logo-redondo panda-joinha
node marca/kit/gera-png.mjs 2000 --pasta ~/Desktop/kit-panda-mimo
```

A pasta `png/` não vai para o repositório (é gerada quando precisa). Para a gráfica ou DTF, exporte
em 300 dpi no tamanho final: uma arte de 20 cm precisa de pelo menos 2400 px.

## Cores e fontes, para conferir

Nanquim `#171512` · Papel `#FBF6EF` · Creme `#F6F4EF` · Areia `#E7D8C3` · Areia suave `#F1E7D8` ·
Pêssego `#FFB59C` · Pêssego fundo `#E8916F` · Pêssego tinta `#A25030` · Tinta da mão `#CB6B44` ·
Sálvia `#A8C5A2` · Sálvia funda `#6E8C67` · Kraft `#C9A57E` · Branco quente `#FFFDF8`.

Fredoka (títulos, pesos 500 a 700) · Caveat (um trecho manuscrito, 600 a 700) · Nunito (texto,
400 a 800). Nunca fonte de sistema no lugar delas; nunca Caveat em parágrafo.
