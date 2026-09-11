# Kit da marca Seu Mimo Studio

Logotipo, letreiro e símbolo **construídos em vetor** a partir da prancha aprovada
(`mestres/prancha-aprovada.png`). Manual: `../MARCA.md`. Nada aqui é traçado automático de imagem:
letreiro composto em fonte e convertido em curvas, corações e símbolo desenhados em curvas. Os traçados
automáticos da primeira rodada ficaram em `tracados-referencia/` só como registro.

O **mascote é ilustração**, não vetor: a arte definitiva chegou em 11/09/2026 e está em `mascote-2d/`.
A tentativa de construí-lo em vetor (`mascote/`) foi reprovada e continua aqui apenas como registro.

| Pasta / arquivo | Conteúdo |
|---|---|
| `svg/` | logotipo principal, letreiro, vertical, símbolo (oliva, preto, branco, sobre oliva) e avatar. Os `mascote-*.svg` e `expressao-*.svg` daqui são da construção reprovada; use `mascote-2d/` |
| `pdf/` | os mesmos arquivos em PDF vetorial, página do tamanho do desenho |
| `png/` | exportações em PNG com transparência, lado maior 2000 px, para redes, IA e gráfica |
| `mascote-2d/` | **a arte definitiva do mascote**: folha de modelo, três folhas de poses e as poses soltas em PNG transparente, mais `exporta-para-o-site.py` |
| `mascote/` | a construção vetorial do mascote, **reprovada pelo dono**: `mascote2.py` (gerador), `mascote.py` (primeira versão), `coracoes.py`, `logo.py`, `tipo.py`. Fica como registro de geometria; não sai publicada |
| `fontes/` | DM Serif Display, Montserrat, Playfair Display e Caveat (variáveis), com licenças OFL |
| `mestres/` | prancha aprovada e recortes ampliados. O `referencia-mascote-*` era o render 3D que segurava o padrão antes do desenho definitivo; fica guardado, mas não é mais o mascote da marca |
| `cores.json` | paleta da marca, paleta própria do mascote (medida na arte) e as variações de laço |

## Gerar de novo

```bash
python3 mascote/kit.py .          # remonta svg/ a partir do gerador (mascote reprovado incluído)
```

Isso vale para o logotipo, o letreiro, o símbolo e os corações. **Não use para o mascote:** o que sai
dali é a versão reprovada.

Dentro de `mascote/`, uma pose é um dicionário em `POSES` e uma expressão é uma tripla em
`EXPRESSOES`. Fica documentado porque o código continua aqui, mas a arte que sai dali está reprovada.

Pose nova do mascote se desenha a partir de `mascote-2d/folha-de-modelo.png`, que tem as 12 expressões e
as 16 ações, e entra em `mascote-2d/poses/` como PNG transparente de lado maior 1254 px ou mais.

## Para tela

As fontes daqui são os **mestres**, em TTF. O site usa subconjuntos latinos em WOFF2, que ficam em
`../site/assets/fontes/` e são servidos do próprio endereço do site. Caveat entrou em setembro de 2026,
quando o site foi construído: o manual já a nomeava como a manuscrita da assinatura (seção 3) e ela
faltava no kit.

Os ícones do navegador e a imagem de compartilhamento do site são gerados a partir destes vetores, não
desenhados à parte: `cd ../site && npm run imagens`. Se o logotipo, o símbolo ou o avatar mudarem aqui,
rode de novo.

O mascote do site também sai daqui, não de arte guardada lá:
`cd mascote-2d && python exporta-para-o-site.py` recorta a folga transparente e grava as versões em
WebP, em 1x e @2x. O guardião do site reprova mascote que não tenha vindo por esse caminho.

## Regra de ouro com IA

A IA não desenha logo, letreiro, mascote nem texto da marca. Ela faz cena, fundo e mockup; logotipo e
mascote entram depois, como camada, a partir dos arquivos daqui. Quando precisar do mascote dentro de
uma imagem gerada, use `mascote-2d/poses/abracando-coracao.png` como camada por cima — não peça para a
IA redesenhá-lo. Os roteiros de `../PROMPTS-MASCOTE.md` continuam servindo para cena e ocasião.
