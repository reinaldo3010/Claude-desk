# A galeria de artes prontas — 23/09/2026

Pedido do dono: ele criou umas 100 artes de caneca de volta inteira e quer oferecer ao cliente uma galeria
que "vai chegar a milhares de imagens". Ele pediu que eu decidisse onde elas moram, que as categorias
ficassem no banco (para ele mesmo subir as próximas escolhendo a categoria) e que cada imagem fosse lida
e categorizada.

## Onde as artes moram, e por quê

**No Supabase que o site já usa, não no repositório.** O site publicado tem 35 MB; cada arte pronta fica
com uns 1 MB (versão de impressão e miniatura), então mil artes passariam do limite de 1 GB do GitHub
Pages, e cada lote dependeria de commit, guardião e publicação. No banco, quem sobe é o dono, pelo painel,
e a arte aparece no estúdio sem publicar nada.

- `pm_arte_categorias`: as categorias da galeria. As que têm o mesmo id de uma ocasião do estúdio
  (`simulador/modelos.js`) somam as artes nela; as novas aparecem no grupo que dizem, na ordem que têm no
  banco. Semeadas com as 34 ocasiões da caneca e seis novas: Infância, Mundo encantado, Aventuras e diversão
  e Fé (em Momentos, logo depois de Casa nova), Destinos do Brasil (em Hobbies e paixões, logo depois de
  Viagens) e Motivação (Do dia a dia). As quatro de Momentos nasceram em dois grupos próprios ("Para os
  pequenos" e "Fé e espiritualidade"), mas com eles o cardápio passava a rolar por dentro em 1366 × 768 e
  1024 × 768; o dono escolheu Momentos (23/09/2026). Grupo novo criado no painel vai para o fim do cardápio,
  a não ser que entre em `ORDEM_DOS_GRUPOS`.
- `pm_artes`: uma linha por arte, com categoria, nome, peça e os caminhos no bucket `panda-mimo`
  (`artes/caneca/<id>.webp` e `-mini.webp`). `original` guarda o nome do arquivo-mestre, que fica com o dono.
- Mesma regra do catálogo: qualquer visitante lê o que está ativo e publicado; gravar exige `pm_e_admin()`.
  Migração `pm_galeria_de_artes` (23/09/2026).

**Custo e limite** (plano gratuito, conferido na documentação em 23/09/2026): 1 GB de arquivos e 5 GB + 5 GB
de tráfego por mês, umas mil artes e umas 2 mil pessoas por mês navegando na galeria. Passando disso, o
plano Pro (US$ 25/mês: 100 GB e 250 + 250 GB). Cuidado: o mesmo projeto guarda tabelas de outro sistema do
dono (compromissos, atas, resumos, clima), e no gratuito estourar a cota por muito tempo restringe o
projeto inteiro. Se o tráfego crescer muito, os arquivos podem ir para o Cloudflare R2 (sem cobrança de
tráfego) trocando só os caminhos em `pm_artes`.

## Como sobe (painel, aba Artes prontas)

O dono arrasta as artes (e, se tiver, o `galeria.json` da análise). O painel confere a proporção da volta
da caneca (21 × 9 cm, com 3% de tolerância), prepara a versão de impressão em **2480 × 1063 px** (300 dpi
na volta) sobre o branco da cerâmica e uma miniatura de 640 px, sobe as duas e grava a linha. Com o
`galeria.json`, cada arte chega com a categoria, o nome e o código da análise, e as que a análise deixou
de fora não sobem. Dá para criar categoria nova, trocar a categoria de uma arte, tirar do ar e apagar.

## Como aparece (estúdio)

`simulador/galeria.js` lê as categorias ativas e as artes publicadas uma vez por página. No estúdio:

- as artes entram na lista **depois** dos modelos da casa, em "Todos os modelos" e em cada ocasião: a
  primeira tela do estúdio continua a mesma; o cardápio soma a contagem e mostra as categorias novas;
- o cartão mostra a miniatura pronta; a arte maior (mouse e dedo) também;
- escolher a arte segue o caminho da arte do Canva: ela vira a arte livre, na volta inteira, e nome,
  Pandinhas e enfeites vão por cima, na Minha arte em camadas. Como qualquer modelo, **não troca de etapa**;
- a caneca gira para o meio da arte (vista `meio`, sem botão, em `caneca-3d.js`): a arte de volta inteira
  põe o Pandinha no lado oposto ao da alça, e a vista Frente mostrava só a borda dele;
- o pedido diz "Arte pronta da galeria: <nome> (<código>)" e não diz "Sem o Pandinha" (a arte já traz o dela);
- rascunho, projeto e link da montagem guardam a arte da galeria pelo código; o link, que não leva
  arquivo, busca a arte no banco;
- sem banco, ou sem resposta, a galeria só não aparece. A resposta é conferida: o que não tem a forma de
  uma categoria ou de uma arte não entra.

## O que o guardião cobra (bloco `galeria`)

Com um banco de mentira (Natal e uma categoria nova num grupo novo; três artes), em 1280 e 390: as artes
entram depois dos modelos da casa e o primeiro modelo não muda; as contagens de "Todos", de Natal e da
categoria nova estão certas, no grupo dela; a miniatura aparece; escolher a arte não troca de etapa, marca
o cartão dela (e não o "Trazer a minha arte"), põe a arte na arte aberta, vira a caneca para o meio da
arte e escreve o pedido; voltar a um modelo da casa desmarca. No painel: as categorias chegam ao seletor, o `galeria.json` dá nome e categoria,
a arte quadrada é recusada pela proporção, a arte boa sobe para `artes/caneca/<código>.webp` e
`-mini.webp`, a linha é gravada certa e a versão de impressão sai em 2480 × 1063.

Em todos os outros blocos a galeria chega vazia (rota posta em `browser.newPage` e `browser.newContext`):
sem isso, as contagens do cardápio mudariam a cada arte que o dono sobe. Cinco provas de defeito
reprovaram: galeria na frente dos modelos da casa, troca de etapa, pedido sem a arte, arte fora da medida e
a caneca sem virar para o meio da arte. A caneca da casa não mudou um pixel (`qa/mede-caneca.mjs`, 40
imagens e 8 medidas idênticas antes e depois).

## O primeiro lote (pasta `Downloads/Imagens Panda Mimo`)

120 arquivos, 102 artes (18 cópias idênticas), todas em 1916 × 821 px, a proporção exata da volta. Cada
uma foi lida em tamanho real, por quatro revisores e conferida de novo por mim. O resultado está em
`analise-da-galeria/` dentro da pasta (`revisao.html`, `catalogo.csv`, `galeria.json`); os arquivos foram
separados, nunca apagados:

| Onde ficou | Quantas | Por quê |
|---|---|---|
| pasta principal | 52 | prontas para a galeria |
| `fora-da-galeria/corrigir-antes` | 12 | boas, com algo a tirar: Nescau escrito (3), escudo da CBF e símbolo da Nike (1), um robô igual ao Astro do PlayStation (1) e 7 com símbolos ou cenários de franquia que o Pandinha não precisa (Harry Potter, Up, Avatar, Jurassic Park, Naruto, as lanternas do Enrolados) |
| `fora-da-galeria/texto-errado` | 17 | "Acrédite", "tormam", "Uniáo", "MANHÂ", "ViLA", "Praia do Cacimba", letras inventadas… (pedido do dono: texto errado sai) |
| `fora-da-galeria/personagens-licenciados` | 21 | o personagem da franquia, ou a roupa que é o desenho dele, está na arte (Stitch, Bob Esponja, Vingadores, Pokémon, Corinthians…) |
| `fora-da-galeria/copias` | 18 | cópia idêntica de outra |

**Tema não tem dono; o que identifica a obra tem.** Bruxo, ninja, dinossauro, pirata e festival de
lanternas são livres (Lei 9.610/98, art. 8º: a lei protege a obra, não a ideia). Protegido é o personagem,
o desenho da roupa dele e os símbolos e cenários que só existem na obra, e muitos são marcas registradas.
A pergunta prática é se a pessoa compraria a caneca "porque é do Harry Potter": se sim, ela usa a fama da
obra (aproveitamento parasitário), mesmo sem o nome e sem o Harry. Não é parecer jurídico: para vender
peça com tema de franquia, vale ouvir um advogado de propriedade intelectual.

## O que fica com o dono

1. **O nome Panda Mimo desenhado pela IA** em 25 das 52 artes prontas (placas, etiquetas, canecas). O
   manual (13.5) diz que a IA não desenha o logo sem o PNG oficial de referência e conferência, e (11.5,
   11.7) que a peça é do cliente; o nome da IA muda de letra e de cor de uma arte para outra (do salmão ao
   rosa-choque) e não é o logo oficial. Recomendação: sem o nome nas artes do cliente.
2. **O Pandinha em pelúcia 3D** na maior parte das artes. O manual (6.5) reserva o 3D para a tela e o
   proíbe em peça de cliente, porque perde detalhe em impressão pequena. Numa arte de volta inteira ele
   imprime como foto; recomendação: liberar o 3D na arte de volta inteira e manter a regra para tag e
   impressão pequena, com registro no manual.
3. **A resolução.** Os originais têm 1916 × 821 px: 232 dpi na volta de 21 × 9 cm. O painel amplia para
   2480 × 1063 (a medida dos 300 dpi), mas ampliar não cria detalhe (manual 13.7). Recomendação: uma prova
   impressa antes de vender em quantidade, e pedir ao Codex os próximos lotes na maior resolução que ele dá.
4. **As 12 de `corrigir-antes`**: refazer sem o que está anotado em cada uma (o `catalogo.csv` diz o quê),
   e as de texto errado, se valerem, refeitas com o texto certo.
5. **O cardápio de ocasiões** com as categorias da galeria: 537 px de altura (eram 468). Cabe inteiro em
   1280 × 800, 1366 × 768, 1024 × 768 e 1440 × 900; em 1024 × 634 rola 57 px por dentro. Cada categoria nova
   soma uma linha: quando passar de uma tela, o cardápio pede um desenho novo (seis colunas, ou dois níveis),
   e isso é decisão do dono.
