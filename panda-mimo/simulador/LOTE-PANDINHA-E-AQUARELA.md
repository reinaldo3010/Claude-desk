# Com o Pandinha e Aquarela — 61 modelos

Dois lotes de 23/09/2026. O dono gerou as imagens e pediu que elas fossem para o estúdio, para virar arte
de caneca: de manhã, 26 (20 poses do Pandinha e 6 aquarelas); à tarde, mais 39 (35 poses e 4 adesivos do
acervo). Acrescentam 61 composições ao catálogo, de 138 para **199 modelos**, sem tirar nenhum.

Junto veio uma decisão de marca: **a regra de um Pandinha por caneca caiu.** Na arte que a pessoa monta,
ela põe quantos Pandinhas, enfeites e elementos quiser (manual 6.2 e 10.3).

## Onde a pessoa encontra

| No estúdio | O que tem |
|---|---|
| Modelo › grupo **Com o Pandinha** | Pandinha nas ocasiões (11), nas profissões (10), na saúde (8), no esporte (15), nas paixões (11) |
| Modelo › grupo **Aquarela** | Aquarelas delicadas (6) |
| Os assuntos que já existiam | cada arte aparece também onde a pessoa já procurava: o Pandinha ciclista e a bicicleta florida em Ciclismo, a casinha em Casa nova, o buquê em Dia das Mães, o cachorrinho em Cachorros, os de saúde e engenharia em Profissões… (`tambemEm`) |
| Aba Enfeites › **Do acervo da Panda Mimo** | os 8 adesivos de antes e os 4 novos: laço pêssego, coração com folhas, margaridas, presente com laço |
| Aba Enfeites › **Em aquarela** | as 6 aquarelas, para acrescentar em qualquer arte |
| Aba Enfeites › **O Pandinha em 64 poses** | as 9 poses de sempre e as 55 novas; cada toque acrescenta um Pandinha |
| Cartão do Pandinha › Pose | a lista das 64, em seis grupos |

Busca por nome também acha: "dentista", "yoga", "casinha".

## As regras que valem para essas imagens

Estão no manual, 9.1 ("Imagem na arte"). Em uma linha cada:

- **Nunca abaixo de 300 dpi.** O controle de tamanho para antes (tolerância de 2%). `limiteDaImagem` em
  `modelos.js`; o teste é `qa/imagens-unit.test.mjs`.
- **A caixa abraça o desenho.** A caixa de seleção segue a proporção do arquivo. Isso valeu também para as
  17 imagens que já existiam, que tinham caixa quadrada: o desenho delas não mudou um pixel (medido nos
  138 modelos antigos, antes e depois), só as alças passaram a ficar em cima da imagem.
- **O confete de sempre não mexe.** O sorteio das bolinhas de fundo desvia da caixa das camadas; com a
  caixa verdadeira, o confete de "amizade-formatura" mudava de lugar. As nove poses de sempre continuam
  reservando o quadrado antigo, e `qa/artes-aprovadas-unit.test.mjs` guarda os 138 modelos aprovados.
- **Mestre no kit, versão no site.** `marca/kit/` não vai para o ar; o site usa `assets/`.
- **Não trocam de cor.** A cor é a pintura.

## Peso

A abertura do estúdio passou de 3.520 para 3.649 KB (+129 KB, medido depois dos dois lotes): 51 KB são o
código das coleções e da tabela, 71 KB as miniaturas da lista, que agora mostram o Pandinha (antes saíam
sem). O segundo lote, sozinho, somou 26 KB: as artes dele ficam mais abaixo na lista, e a miniatura só
desce quando chega perto da tela. As imagens inteiras
só descem quando a arte usa: um Pandinha temático tem uns 130 KB, uma aquarela 390 a 620 KB. Lista e
grades usam a versão de 320 px, de 10 a 30 KB.

## O que ficou para decidir

- **Vetorizar as 20 poses para o kit** (manual 13.5). O script está pronto
  (`marca/kit/vetoriza-poses-do-pandinha.py`), mas o degradê de volume dessas poses só passa dos 24 dB
  com o traçado mais fino: uns 3,5 MB por pose, perto de 190 MB as 55, sem efeito no site.
- **Onde os grupos novos aparecem no seletor.** Entraram antes de "Do dia a dia", sem empurrar nenhum
  grupo antigo; em "Todos", as 26 artes vêm depois das 138.
- **O teto de tamanho do Pandinha** continua o de antes (54 mm de largura), agora para qualquer pose.

## Arquivos

| Arquivo | Papel |
|---|---|
| `simulador/pandinha-temas.js` | as 20 poses, as 3 categorias e as 20 artes |
| `simulador/aquarelas.js` | as 6 aquarelas, a categoria e as 6 artes |
| `simulador/imagens-do-acervo.js` | **gerado**: o tamanho de cada imagem que o estúdio usa |
| `marca/kit/prepara-imagens-do-estudio.py` | faz as versões do site a partir dos mestres, e a tabela |
| `assets/panda-<tema>.webp`, `assets/aquarela-<nome>.webp` | versão do site, na resolução do mestre |
| `assets/mini/` | versão de 320 px, para a miniatura da lista e as grades |
| `marca/kit/png/pandinha-temas-20/`, `pandinha-temas-35/`, `piloto-aquarela/` | os mestres (as cópias de logo que vieram junto ficam fora do repositório) |
| `qa/provas-colecoes.html?lote=pandinha` e `?lote=aquarela` | as artes no tamanho de uso |

## Imagem nova no acervo, daqui para a frente

1. O mestre (PNG com fundo transparente) entra em `marca/kit/png/<pasta>/`.
2. Uma linha na lista `IMAGENS` de `marca/kit/prepara-imagens-do-estudio.py`, com o nome do site
   (pose do Pandinha: `panda-<pose>`, regra do manual 6.4).
3. `python marca/kit/prepara-imagens-do-estudio.py` (de `panda-mimo/`). Demora: o WebP sai no modo
   mais caprichado. Só a tabela: `--so-tabela`.
4. A imagem entra em `POSES_TEMATICAS` ou `AQUARELAS`, com nome de gente.
5. `npm run test:arte`. O teste reprova tabela velha, imagem sem mestre e tamanho que cai abaixo de 300 dpi.

## Três defeitos que vieram à tona no caminho

Todos já estavam no ar e todos estavam no caminho exato destas imagens:

1. **Elemento do acervo entrava invisível.** A grade "Do acervo da Panda Mimo" acrescentava a camada, mas
   só o Pandinha tinha a imagem carregada — o laço, a flor e os outros nunca apareciam na caneca.
2. **Miniatura de modelo sem o Pandinha.** A lista pintava a miniatura antes de a imagem chegar e não
   repintava. Agora cada miniatura espera as próprias imagens (e usa a versão leve).
3. **Elemento com nome de Pandinha.** Na lista de camadas o laço aparecia como "Pandinha", com 🐼, e sem
   controle de tamanho.

O guardião só contava camadas, por isso nada disso reprovava. Agora ele conta pixel: a aquarela acrescentada
tem de aparecer na vista aberta, e a miniatura do "Corações ao redor" tem de mostrar o Pandinha.
