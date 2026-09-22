# Ateliê — 12 novos modelos

Criados em 22/09/2026, após a aprovação do acabamento de papelaria da revisão anterior. O catálogo local passa de 102 para 114 modelos. Nenhum dos 102 existentes foi substituído por este lote.

## Modelos

| Categoria | Modelo | Composição |
|---|---|---|
| Profissões e vocações | Cuidar floresce | Retrato circular botânico e dedicatória de enfermagem |
| Profissões e vocações | Quem ensina, semeia | Tipografia em duas linhas e foto ampla |
| Profissões e vocações | Ideias que viram lar | Díptico fotográfico e prancheta de arquitetura |
| Profissões e vocações | Feito por mim | Foto horizontal do trabalho e caderno ilustrado |
| Casa nova | Nossas primeiras chaves | Chaveiro, retrato floral e data da mudança |
| Casa nova | Aqui mora a gente | Casinha, endereço, planta e pequena foto |
| Casa nova | Onde a vida floresce | Duas fotos verticais, planta e chaveiro |
| Casa nova | Café de casa nova | Três fotos redondas e cena de café |
| Ciclismo | Flores pelo caminho | Bicicleta com cesta floral e retrato |
| Musculação | Forte do meu jeito | Frase em destaque, foto e halter |
| Padrinhos de casamento | Ao nosso lado | Convite, retrato em coração e alianças |
| Amizade e formatura | Nossos pequenos infinitos | Três fotos em formatos distintos e dedicatória |

Novas categorias: `profissoes` (grupo Profissões e vocações) e `casa-nova` (grupo Momentos), com quatro modelos cada. Esportes, padrinhos e amizade usam as categorias existentes. Todos os IDs novos começam com `atelie-`.

## Arquivos e continuidade

- `simulador/atelie.js`: oito ilustrações novas, categorias e doze modelos; esta é a fonte editável do lote.
- `marca/kit/svg/atelie/`: matrizes SVG com área externa transparente, sem bitmap incorporado, e `modelos.json` com as camadas. O JSON é uma cópia dos dados do catálogo, não um arquivo de projeto para importar diretamente no editor.
- `marca/kit/fontes/atelie/exportar.mjs`: regenera SVGs e JSON diretamente das mesmas curvas usadas pelo editor. Executar `node marca/kit/fontes/atelie/exportar.mjs` na pasta `panda-mimo`.
- `qa/provas-colecoes.html?lote=atelie`: galeria filtrada dos 12 novos modelos, desenhada pelo motor real do estúdio.
- `qa/atelie-ilustracoes.png`: prancha de referência dos oito desenhos novos.

As oito ilustrações são casa, chaves, planta, estetoscópio, prancheta, caderno, bicicleta e halter. Flores, laços, livros e alianças reaproveitam as matrizes vetoriais refinadas e aprovadas anteriormente.

Fotos, textos e ilustrações permanecem em camadas distintas. As ilustrações podem ser movidas, giradas, redimensionadas e recoloridas; não há edição de nós no estúdio. Textos continuam editáveis. A exportação de impressão usa o fluxo existente de 21 × 9 cm em 300 dpi; a resolução das fotos ainda depende do arquivo enviado pelo cliente.

## Validação

Os 12 modelos foram incluídos na bateria existente de testes de coleções, incluindo diversidade de composição, cores, seleção, proporções e desenho sem bitmaps. Os 39 testes unitários passaram. Revisão visual dos 12 realizada na galeria. Busca por profissão conferida no estúdio, sem alterar o rascunho salvo do usuário.

`QA_VIEWPORTS=390,1280 npm test` concluído com sucesso: auditoria geral nas duas larguras, incluindo seleção e recoloração dos novos modelos de casa e profissões; nitidez aprovada nas sete combinações de tela/densidade. O teste de ciclismo agora compara os modelos exibidos com o catálogo, pois o assunto passou de quatro para cinco artes. Permanece o aviso preexistente sobre o número de WhatsApp de reserva.

As cores e detalhes finos ainda dependem de prova física nos insumos da produção. Alterações locais, sem publicação e sem envio ao GitHub.
