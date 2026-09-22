# Revisão dos modelos existentes — 21/09/2026

Direção escolhida pelo usuário: ilustrações delicadas e detalhadas, com acabamento de papelaria premium.

## Entrega

- 67 ilustrações reconstruídas: 16 de pets, 24 de datas comemorativas, 13 de bebê e 14 de convites.
- Os 64 modelos dessas quatro coleções recebem as matrizes novas. Os 14 modelos originais também recebem a revisão de tipografia e densidade de enfeites: 78 composições ajustadas.
- Os 24 modelos esportivos permanecem no catálogo. Total preservado: 102 modelos, sem novos IDs de modelo ou categoria.
- Contornos suaves, flores com pétalas e nervuras, laços com dobras, bichinhos com focinhos e detalhes próprios, acessórios com acabamento coordenado.
- Textos continuam sendo texto editável; fotos e ilustrações continuam como camadas independentes. O fundo mantém a redistribuição de enfeites ao mover fotos.

## Arquivos

- `marca/kit/svg/colecoes-refinadas/`: 67 matrizes SVG de verdade, área externa transparente, sem `<image>` e sem PNG incorporado.
- `marca/kit/fontes/colecoes-refinadas/gerar.py`: fonte de desenho e conversão, requer Python e PyMuPDF. Executar na pasta do site; os caminhos são resolvidos pelo arquivo.
- `simulador/ilustracoes-refinadas.js`: curvas para o motor nativo do estúdio. Não usa bitmaps.
- `simulador/acabamento.js`: ajuste dos modelos existentes, com Nunito nas frases antes em Fredoka, linhas horizontais e menor densidade de enfeites.
- `qa/revisao-papelaria.html`: comparativo das 67 ilustrações.
- `qa/provas-colecoes.html`: galeria das 102 composições, usando o mesmo motor do estúdio.

As 67 matrizes foram reconstruídas e têm diferenças visuais intencionais: anatomia, contornos, ornamentos e proporções internas. A integração contém cada nova matriz dentro do espaço reservado ao desenho antigo, sem deformá-la. Os temas e IDs foram preservados.

## Edição e impressão

As matrizes SVG são vetoriais e independem de DPI. A exportação da composição continua usando o fluxo existente em 21 × 9 cm / 300 dpi; fotos do cliente continuam sujeitas ao aviso de resolução efetiva. Esta revisão não converte a composição inteira em SVG nem transforma os textos editáveis em curvas.

Projetos já salvos conservam os textos, cores e posições definidos pelo cliente. Como as formas apontam para os mesmos IDs, passam a usar o novo desenho; é necessário conferir essas composições antigas antes de imprimir, especialmente se uma ilustração foi ampliada manualmente.

Validação concluída com `QA_VIEWPORTS=390,1280 npm test`: 39 testes unitários passaram, incluindo geometria, paleta, seleção, edição independente, ausência de bitmaps nas ilustrações e redistribuição dos enfeites. A auditoria geral passou nas duas larguras; a checagem de nitidez passou nas sete combinações de tela/densidade. Aviso preexistente da auditoria: o WhatsApp ainda está com o número de reserva. As 67 matrizes SVG também foram analisadas como XML e não contêm imagens incorporadas.

A prova física de sublimação não foi realizada; tons claros e detalhes finos precisam ser conferidos com o perfil e os insumos da produção.

Alterações locais, sem publicação nem envio ao GitHub.
