# Kit da marca Seu Mimo Studio

Identidade **construída em vetor** a partir da prancha aprovada (`mestres/prancha-aprovada.png`). Manual:
`../MARCA.md`. Nada aqui é traçado automático de imagem: letreiro composto em fonte e convertido em
curvas, corações e símbolo desenhados em curvas, mascote gerado por peças. Os traçados automáticos da
primeira rodada ficaram em `tracados-referencia/` só como registro.

| Pasta / arquivo | Conteúdo |
|---|---|
| `svg/` | logotipo principal, letreiro, vertical, símbolo (oliva, preto, branco, sobre oliva), avatar, 5 poses do mascote (transparente e com fundo), 6 expressões, folha de modelo |
| `pdf/` | os mesmos arquivos em PDF vetorial, página do tamanho do desenho |
| `png/` | exportações em PNG com transparência, lado maior 2000 px, para redes, IA e gráfica |
| `mascote/` | `mascote2.py` (gerador de poses, expressões e símbolo; `mascote.py` é a primeira versão, descartada), `coracoes.py`, `logo.py`, `tipo.py` |
| `fontes/` | DM Serif Display, Montserrat, Playfair Display (variáveis), com licenças OFL |
| `mestres/` | prancha aprovada e recortes ampliados |
| `cores.json` | paleta da marca e cores do mascote |

## Gerar de novo

```bash
python3 mascote/kit.py .          # remonta svg/ a partir do gerador
```

Uma pose nova é um dicionário em `POSES` (olhos, boca, item nos braços, inclinação, corações soltos);
uma expressão nova é uma tripla em `EXPRESSOES`. Nada é desenhado à parte: é isso que mantém o padrão.

## Regra de ouro com IA

A IA não desenha logo, letreiro nem mascote. Ela faz cena, fundo e mockup; logo e mascote entram
depois, como camada, a partir destes arquivos. Quando precisar do mascote dentro de uma imagem gerada,
use `png/mascote-feliz.png` como referência e peça para manter exatamente. Confira o resultado com a
folha de modelo.
