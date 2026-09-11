# Kit vetorial · Seu Mimo Studio

Vetorização da prancha aprovada (`mestres/prancha-aprovada.png`, 1254 × 1254 px), feita em setembro de
2026. Este kit é independente da Panda Mimo: outra marca, outra paleta, outra tipografia.

**Método, em uma frase:** cada elemento foi recortado da prancha, ampliado 4 vezes por super-resolução
(Real-ESRGAN, modelo de ilustração para logo e símbolo, modelo fotográfico para o mascote), traçado
automaticamente (vtracer, curvas spline) e comparado de volta com a fonte, pixel a pixel.

## O que tem aqui

| Pasta | Conteúdo |
|---|---|
| `svg/` | 19 vetores editáveis, com grupos nomeados (`seu-mimo`, `studio`, `coracao`, `simbolo`, `mascote`, `rosto`) e cores da marca |
| `pdf/` | os mesmos 19 arquivos em PDF vetorial, página do tamanho do desenho, para gráfica e Illustrator |
| `fontes/` | Playfair Display e Montserrat (variáveis, licença OFL), as famílias declaradas na prancha |
| `mestres/` | prancha aprovada, recortes ampliados 4x e o mascote recortado com transparência (PNG) |
| `cores.json` | as cinco cores amostradas da prancha |

### Arquivos

- **Logotipo principal** (`logo-principal*`): coração, "Seu Mimo" e "STUDIO" na mesma posição e proporção
  da prancha. Versões oliva, preta, branca e off-white sobre oliva.
- **Letreiro** (`letreiro*`): só "Seu Mimo" + "STUDIO".
- **Símbolo** (`simbolo*`): o desenho de linha da própria prancha (caixinha com laço, rosto e coração),
  traçado do painel oliva. Versões oliva, preta, branca e sobre oliva.
- **Logotipo vertical** (`logo-vertical*`): símbolo sobre o letreiro, como no painel oliva da prancha.
- **Mascote** (`mascote.svg`): versão vetorial chapada do render 3D, em 9 tons da paleta, com o rosto e o
  coração da etiqueta numa camada própria (`#rosto`), nítidos. `mascote-uma-cor`, `mascote-preto` e
  `mascote-sobre-oliva`: silhueta em uma cor com o rosto em negativo.

## Cores (amostradas da prancha)

Café essencial `#3A2E21` · Bege natural `#C0966D` · Verde oliva `#2F2E1E` · Off white `#D4C7B5` · Preto `#050505`.
Fundo da prancha `#E6D9CA`; painel oliva `#323023`.

## Fidelidade medida

Cada vetor foi renderizado de volta e comparado com o recorte ampliado. Para as peças de uma cor, a
medida é a coincidência da área com tinta (1,000 = idêntico); para o mascote, a silhueta e o erro de cor.

| Peça | Medida | Resultado |
|---|---|---|
| "Seu Mimo" | coincidência de tinta | 0,977 |
| "STUDIO" | coincidência de tinta | 0,964 |
| Coração | coincidência de tinta | 0,939 |
| Símbolo | coincidência de tinta | 0,944 |
| Mascote | coincidência da silhueta | 0,994 |
| Mascote | PSNR de cor na área com tinta | 23,1 dB (chapado, sem o volume 3D) |

## Sobre a tipografia (o que a prancha realmente usa)

- **"Seu Mimo"** se parece com a Playfair Display, mas não é a fonte: as letras da prancha são mais
  largas e os traços finos são mais grossos do que em qualquer peso da Playfair (600 a 900). Por isso o
  letreiro foi traçado letra por letra a partir da prancha, e não composto em fonte. A Playfair fica
  no kit para textos de apoio, títulos e novas aplicações.
- **"STUDIO"** coincide com a Montserrat 400–500 com espaçamento largo. Foi traçado da prancha também,
  para manter exatamente o espaçamento; para novas peças, compor em Montserrat 500 dá o mesmo resultado.

## Limites (para não prometer o que o arquivo não tem)

- Traçado automático reproduz a forma vista na prancha, ampliada 4x. Em zoom muito forte aparecem
  pequenas ondulações nas curvas do letreiro e do símbolo. Um designer pode alisar os pontos em cima
  destes arquivos sem redesenhar.
- O mascote 3D virou vetor chapado. Sombra, brilho e a textura do papel kraft não existem em vetor a
  partir de uma única imagem; o que se preserva é silhueta, proporção, laço, rosto, braços, pernas,
  etiqueta e coração. Para o efeito 3D, use o PNG do mestre (`mestres/mascote-recorte-4x.png`).
- As cinco variações de expressão do mascote e as seis "expressões" em círculo da prancha não foram
  vetorizadas nesta etapa; são renders 3D pequenos e o mesmo método se aplica quando forem necessárias.

## Próximos passos possíveis

Aplicações e variações (avatar, tag, etiqueta, embalagem, assinatura de e-mail), manual da marca no
mesmo formato do da Panda Mimo, e vetorização das expressões do mascote.
