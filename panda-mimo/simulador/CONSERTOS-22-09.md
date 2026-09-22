# Consertos na revisão de papelaria — 22/09/2026

Três defeitos da revisão do Codex (`REVISAO-PAPELARIA.md`, `LOTE-ATELIE.md`, `LOTE-PRAZERES.md`),
achados por medição e consertados **sem tocar em nenhuma curva**. Os desenhos são os dele.

## 1. A recoloração tinha morrido em boa parte do acervo

`desenho.js` pinta com a tinta escolhida a parte marcada com o `primary` da ilustração. Ao
reconstruir as matrizes, `gerar.py` manteve o `primary` antigo sempre que aquele token aparecesse em
qualquer lugar do desenho novo — inclusive num traço fino. Resultado medido em 87 ilustrações,
desenhando cada uma com duas tintas e contando pixels:

| | antes | depois |
|---|---|---|
| a cor escolhida não muda nada (< 2% da área) | 6 | **0** |
| muda pouco (2% a 15%) | 24 | 1 |
| responde bem (≥ 15%) | 57 | **86** |

Foram trocados 39 `primary`, escolhidos pela **área renderizada** de cada token. A tabela ficou em
`marca/kit/fontes/colecoes-refinadas/primarios.json`, e `gerar.py` passou a lê-la: regenerar não
desfaz mais o conserto.

## 2. A aposta do chá revelação saía com dois balões rosa

`bebe-revelacao-azul-rosa` ("Aposte comigo") pede um balão `--sage` e um `--peach` — a aposta entre
os dois times. Como o corpo do balão era `--peach` fixo e o `primary` apontava para o nó, os dois
saíam pêssego. Com o `primary` no corpo, o verde voltou.

Os outros dois modelos de balão pediam `--sand`, que na prática nunca foi usado: mudei para
`--peach` em `bebe.js` para a aparência aprovada não mudar. Se você quiser o balão neutro em
"Menino ou menina?", é trocar de volta para `--sand` — agora ele obedece de verdade.

## 3. O cliente lia id interno na lista de camadas

Os lotes Ateliê e Pequenos Prazeres montam a camada num atalho próprio, que gerava o rótulo a partir
do id: `convite aliancas`, `data xicara flor`, `estetoscopio`, `graos`, `violao`. Os 28 nomes agora
vivem em `simulador/nomes-de-ilustracao.js`, com acento e maiúscula.

## A prova

As 138 artes foram desenhadas antes e depois, na escala da página de provas (1260 × 540, `scale(6)`),
e comparadas pixel a pixel:

- **136 idênticas**, zero diferença;
- `bebe-revelacao-azul-rosa`: 3,17% — é o balão verde, o conserto;
- `bebe-revelacao-lembranca`: 0,08% — o nó do balão volta a aparecer na cor em que foi desenhado,
  em vez de ser coberto pelo corpo.

Nenhuma curva e nenhuma medida mudaram: conferido nas 87 ilustrações, comparando `partes`, `largura`
e `altura` com o estado anterior.

## O que impede de voltar

- `qa/colecoes-unit.test.mjs`: ao menos um preenchimento usa a cor principal; toda camada de
  ilustração tem nome de gente. 41 testes.
- `qa/audit.mjs`: trocar a cor da ilustração no estúdio mexe em pelo menos 0,5% da arte. A checagem
  antiga comparava uma assinatura amostrada e passava com 2% respondendo. Conferida com defeito
  inserido de propósito: pega (0,16%) e libera quando consertado.

## O que **não** foi mexido

O contraste na cerâmica. 12 ilustrações não têm nenhum traço a 3:1 contra o fundo claro
(`atelie-chaves`, `hobby-mala`, `atelie-halter`, `bebe-nuvem`, `convite-tacas`, `hobby-livro`,
`hobby-fouet`, `pet-estrela`, `bebe-movel`, `convite-concha`, `data-canecas-casal`,
`data-xicara-flor`). Engrossar ou escurecer traço é decisão de desenho, e depende da prova física de
sublimação, que ainda não foi feita.

Também não foi mexido: a coleção esportiva segue em Fredoka enquanto as outras seis foram para
Nunito, e "Profissões e vocações" tem uma categoria só com quatro artes.
