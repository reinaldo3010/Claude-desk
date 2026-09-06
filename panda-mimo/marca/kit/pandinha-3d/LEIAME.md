# Pandinha em cena (3D)

Versão 3D de pelúcia do Pandinha, para os lugares da lista fechada da seção 6.5 do manual (hero do
site, imagem de compartilhamento, 404, capa de Reel, story e campanhas). Nunca em impressão pequena
nem em peça de cliente; para isso existe o Pandinha adesivo, em `../svg/`.

Arquivos: `panda3d-<pose>.png`, PNG com canal alpha real, lado maior de pelo menos 1500 px, um
Pandinha por imagem, sem texto nem marca desenhada. Xadrez desenhado na imagem não é transparência.
Toda pose nova nasce com o Pandinha adesivo como imagem de referência (olho piscando, bochecha rosa,
miolo rosa da orelha, almofadinhas rosa, paleta pêssego e creme).

## Arquivos

`panda3d-garrafa.png` (hero e imagem de compartilhamento) · `panda3d-dormindo.png` (404) ·
`panda3d-coracao.png` · `panda3d-presente.png` · `panda3d-carrinho.png` · `panda3d-joinha.png`.
Todos com lado maior de 2000 px, recortados ao conteúdo com 5% de folga, alpha real. Origem: imagens
do gerador com xadrez pintado, fundo removido por segmentação (isnet/u2net), borda limpa e ampliação
Real-ESRGAN (modelo de foto). Para o site, as versões WebP em 1x e 2x ficam em `assets/`.
