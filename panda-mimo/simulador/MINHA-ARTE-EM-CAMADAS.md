# Minha arte em camadas — 23/09/2026

Pedido do dono, testando a arte de 360° dele: "o nome eu não consigo mexer, ele sempre vai ficar
embaixo"; "se eu coloco o Pandinha, a foto eu não consigo expandir"; "quero ter a liberdade de mover o
nome, aumentar, diminuir, colocar mais de um Pandinha", e enfeites e elementos também na Minha arte.

## A causa

A Minha arte era um modo à parte, sem camadas. Quando havia nome ou Pandinha, `computePlacement`
reservava um rodapé de 18 mm no pé da caneca; a arte era encaixada no que sobrava acima, o nome era
desenhado no centro do rodapé e o Pandinha era um só, de 16 mm, no canto. Nada disso se movia.

## Como ficou

- A arte trazida pronta é o **fundo** de uma arte em camadas (`modelo: 'minha-arte'`, sem cor de fundo:
  aparece o branco da cerâmica). Ela é posta como sempre foi ("Onde vai a arte?", tamanho, lado, altura,
  inclinação), mas **na altura inteira**: nada reserva mais espaço (`computeArtePlacement` recebe a arte
  e a desenha por baixo das camadas, por `antesDasCamadas` em `desenhaArte`).
- Abas da Minha arte: **Modelo, Minha arte, Frases e Enfeites**. Nome é frase (move, aumenta, letra,
  cor, curva, giro); Pandinha, enfeites, elementos do acervo e aquarelas vêm da aba Enfeites, quantos a
  pessoa quiser, e se sobrepõem à vontade.
- Na aba Minha arte, "+ Nome ou frase" e "+ Pandinha" criam a camada e abrem o cartão dela. Os campos
  antigos (nome, letra, "Com o Pandinha") saíram.
- Arquivo solto em cima da caneca ou da arte aberta troca a arte, como no quadro de soltar.
- **Montagem antiga abre como estava** (`entraNaMinhaArte`): o nome do rodapé vira frase no mesmo lugar e
  tamanho (repetida nos dois lados quando a arte vai nos dois), e o Pandinha vira adesivo onde estava.
  Vale para rascunho, link e arquivo de projeto, que agora passam todos por `aplicaMontagem`.

## Consertos que vieram junto

- **A letra do nome não carregava** ao reabrir um rascunho: o nome saía na letra padrão do navegador
  (com serifa). Agora a frase carrega a letra dela.
- **O rascunho se apagava ao abrir a página.** A abertura desenha a caneca vazia antes de ler o rascunho,
  e esse desenho gravava a caneca vazia por cima dele 1,2 s depois: quem recarregava duas vezes sem tocar
  em "Continuar de onde parei" perdia o trabalho, e em aparelho lento o rascunho sumia antes de ser
  oferecido. Só se guarda o que valeria a pena oferecer de volta.
- **Item novo nascia embaixo do anterior**: "+ Pandinha" duas vezes punha os dois no mesmo ponto. Agora
  o novo anda para o lado até achar lugar. Arquivo solto fica onde foi solto.
- Frase que ainda diz "escreva aqui" conta como frase de exemplo na barra de passos, em qualquer arte.

## O que o guardião cobra (bloco `minha-arte`)

Com um rascunho de antes das camadas — arte ao redor, "Prof. Amanda" em Indie Flower, sem Pandinha —
aberto duas vezes sem tocar em nada: o rascunho continua oferecido; abre com as quatro abas; o nome é
frase, na letra carregada; a arte ocupa a altura inteira; arrastar o nome com o mouse o leva junto; e dois
"+ Pandinha" dão dois Pandinhas lado a lado. No bloco `estudio`, o nome da arte de exemplo nasce pelo
"+ Nome ou frase" e vai para a mensagem do pedido, e a arte do Canva abre a Minha arte com as quatro abas.
As sete checagens novas reprovaram com o defeito reinserido.
