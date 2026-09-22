# Pequenos Prazeres — 24 modelos

Lote criado em 22/09/2026, seguindo o acabamento de papelaria aprovado pelo usuário. Acrescenta 24 composições ao catálogo local, de 114 para **138 modelos**, sem substituir os anteriores.

## Categorias e modelos

| Categoria | Quatro composições |
|---|---|
| Leitura e livros | Só mais um capítulo; Mundos que cabem em mim; Nosso clube do livro; Meu cantinho de leitura |
| Café e pausas | Meu pequeno ritual; Café com conversa; Pausa bem merecida; Memórias à mesa |
| Música | Entre acordes e flores; Meu lado A; A nossa trilha sonora; A vida pede música |
| Jardinagem | Cultivar com carinho; Minha coleção de verdes; Tudo tem seu tempo; Raízes e lembranças |
| Viagens | Histórias na bagagem; Nossos cartões-postais; Colecionar caminhos; Meu pequeno álbum |
| Culinária | Meu tempero é carinho; Receita de bons momentos; Sabores de família; Um doce de pessoa |

As seis categorias entram no grupo **Hobbies e paixões**. O catálogo local tem 37 categorias e nove grupos. IDs dos modelos: `prazeres-*`; IDs das categorias e desenhos: `hobby-*`.

Cada modelo tem uma distribuição própria de fotos e textos. O lote combina retratos, fotos horizontais, colagens, frases protagonistas e cenas ilustradas. As frases são exemplos editáveis, não lettering achatado em imagem. As fotos ficam vazias até o cliente enviar suas imagens.

## Fontes e entrega

- `simulador/hobbies.js`: 24 modelos e seis categorias.
- `simulador/hobbies-desenhos.js`: 12 ilustrações autorais em curvas nativas — livro, marcador, prensa de café, grãos, violão, vinil, regador, ferramentas, mala, câmera, avental e fouet.
- `marca/kit/svg/prazeres/`: 12 SVGs transparentes, sem bitmaps incorporados, e `modelos.json` (cópia das camadas do catálogo, não arquivo de projeto importável).
- `marca/kit/fontes/prazeres/exportar.mjs`: exporta diretamente as matrizes do motor do editor. Executar `node marca/kit/fontes/prazeres/exportar.mjs` na pasta do site.
- `qa/provas-colecoes.html?lote=prazeres`: galeria filtrada dos 24 modelos, no motor real do estúdio.
- `qa/prazeres-ilustracoes.png`: prancha de referência visual dos novos desenhos.

Flores, laços, xícaras e outros detalhes reaproveitam ilustrações aprovadas dos lotes anteriores. Fotos, textos e ilustrações continuam como camadas independentes; seleção, movimentação, escala, rotação e recoloração usam os controles existentes. Não há editor de nós vetoriais.

## Impressão e conferência

Área padrão: 21 × 9 cm, exportação pelo fluxo existente de 300 dpi. Os SVGs são vetoriais; a resolução efetiva das fotos depende das imagens do cliente. Prova física de sublimação não realizada.

Os 24 modelos foram incluídos nos testes existentes de coleções: diversidade de composição, limites de impressão, categorias, cores, seleção e desenho sem bitmaps. Os 39 testes unitários passaram. As 24 composições e os 12 desenhos foram revisados visualmente. SVGs analisados como XML, sem elementos de imagem incorporada.

Auditoria completa concluída com `QA_VIEWPORTS=390,1280 npm test`: duas larguras aprovadas, incluindo edição e recoloração de modelos novos de leitura e música; nitidez aprovada nas sete combinações de tela/densidade. Permanece apenas o aviso preexistente sobre o WhatsApp de reserva. Testes unitários repetidos e aprovados após o ajuste final das cordas do violão e do êmbolo da prensa.

Alterações locais, sem publicação nem envio ao GitHub.
