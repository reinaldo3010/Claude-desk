# A Caixinha — arte definitiva

O mascote da Seu Mimo Studio, entregue em **11 de setembro de 2026**. É a única arte de mascote que sai
em material publicado. As regras estão na seção 5 do `../../MARCA.md`.

Ilustração chapada, com contorno escuro contínuo e volume por sombra macia. **Não é render 3D.** É o
contorno que casa o mascote com o símbolo monolinha do logotipo.

## O que tem aqui

| Arquivo | O que é |
|---|---|
| `folha-de-modelo.png` | o documento que mantém o padrão: 12 expressões, 16 poses e ações, 6 variações de laço, 6 elementos extras, 3 tratamentos de fundo e a paleta |
| `folha-de-poses-clara.png` | 35 poses numa prancha, sobre fundo claro |
| `folha-de-poses-escura.png` | 32 poses numa prancha, sobre fundo escuro |
| `folha-de-poses-transparente.png` | 26 poses numa prancha, com fundo transparente |
| `poses/` | as poses soltas, PNG transparente, 1254x1254 |
| `exporta-para-o-site.py` | gera os arquivos que o site usa, a partir de `poses/` |

## As poses soltas

Atenção a isto: **as nove poses soltas são a mesma pose** — em pé, abraçando o coração. O que muda entre
elas é o sorriso, a posição das pernas, a sombra no chão e os corações soltos. O nome de cada arquivo diz
qual é qual.

| Arquivo | Sorriso | Pernas | Sombra |
|---|---|---|---|
| `abracando-coracao.png` — **a oficial** | sereno | em pé | não |
| `abracando-coracao-sereno-andando.png` | sereno | andando | não |
| `abracando-coracao-sereno-andando-2.png` | sereno | andando | não |
| `abracando-coracao-sereno-com-sombra.png` | sereno | andando | sim |
| `abracando-coracao-sorrindo.png` | aberto | andando | não |
| `abracando-coracao-sorrindo-2.png` | aberto | andando | não |
| `abracando-coracao-sorrindo-3.png` | aberto | andando | não |
| `abracando-coracao-sorrindo-com-sombra.png` | aberto | andando | sim |
| `abracando-coracao-sorrindo-coracoes.png` | aberto | andando | sim, e dois corações |

As **outras quinze ações** da folha de modelo (acenando, pulando, com presente, carregando, correndo,
com balões, com flores, sentado, deitado, de costas e as demais) existem como desenho na folha, mas
ainda **não** como arquivo solto em alta resolução. Enquanto não vierem, não dá para usá-las em
material: recortar da folha entrega no máximo 250 px de lado, o que fica macio em qualquer tela retina.
Está anotado como pendência na seção 8 do manual.

## Exportar para o site

O site nunca guarda arte original. Ele usa versões recortadas e redimensionadas, geradas daqui:

```bash
cd seu-mimo-studio/kit/mascote-2d
python exporta-para-o-site.py
```

Precisa do Pillow uma vez só: `python -m pip install pillow`.

| Arquivo gerado | Pose de origem | Onde aparece no site |
|---|---|---|
| `mascote-abertura` (1x e @2x) | `abracando-coracao` | abertura da home |
| `mascote-convite` (1x e @2x) | `abracando-coracao-sorrindo-2` | fecho, sobre a faixa oliva |
| `mascote-perdido` (1x e @2x) | `abracando-coracao-sereno-com-sombra` | página 404 |

Para trocar qual pose vai para onde, mexa na lista `EXPORTAR` do programa e rode de novo. O guardião do
site (`cd ../../site && npm test`) confere que os seis arquivos existem e que nenhuma arte antiga de
mascote voltou.

## O que não usar

- `../mascote/*.py` e `../svg/mascote-*.svg` — a construção vetorial de setembro de 2026, **reprovada
  pelo dono**. Fica como registro de geometria e proporção.
- `../mestres/referencia-mascote-*` — o render 3D que segurava o padrão antes desta entrega. Cumpriu o
  papel e fica guardado, mas não é mais o mascote da marca.

O guardião do site reprova os dois se aparecerem em página publicada.

## Pose nova

Se desenha a partir de `folha-de-modelo.png`, nunca de memória e nunca por IA. A anatomia que não muda
está na seção 5 do manual; a paleta, na 5.1. Entra aqui em `poses/`, PNG transparente, lado maior de
1254 px ou mais, com folga em volta do desenho.
