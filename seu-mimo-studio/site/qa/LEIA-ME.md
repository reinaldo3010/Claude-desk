# O guardião do site

Um programa que abre o site num navegador de verdade, em 14 tamanhos de tela, mexe em tudo o que dá
para mexer e **reprova a publicação** se achar problema. É a última conferência antes de o cliente ver.

Regra da casa: **rodar o guardião antes de publicar qualquer mudança.**

## Como rodar

```bash
cd seu-mimo-studio/site
npm test                      # completo: 14 telas, nitidez, banco simulado e acessibilidade
QA_VIEWPORTS=390 npm test     # rápido: só no celular
npm run shots                 # só as capturas, sem reprovar
```

Uma vez só, na primeira vez:

```bash
npm install
node node_modules/playwright/cli.js install chromium
```

> O caminho deste repositório tem um `&` (`OneDrive - MINGARDI & ELIAS`), e o `npx` do Windows quebra
> com isso. Por isso o comando do Chromium chama o `cli.js` direto em vez de `npx playwright`.

## O que ele confere

**Layout, em 14 telas de 320 a 1920 px**

- rolagem lateral e elemento saindo da tela
- texto cortado e sobreposição entre cartões, passos e garantias
- imagem que não carregou, com `width`/`height` fora da proporção real, esticada, cortada pelo
  contêiner ou sem `alt`
- nitidez em telas 2x e 3x: nenhuma imagem pode aparecer ampliada mais de 10%
- elemento `sticky` dentro do conteúdo em tela estreita

**Funcionamento**

- menu do celular: abre, fecha ao clicar num link e fecha com Escape
- âncora do menu para **abaixo** do cabeçalho fixo, nunca atrás dele
- botão flutuante do WhatsApp sai do caminho na seção de contato e volta depois
- todo link de WhatsApp tem número válido; nenhuma âncora aponta para o vazio
- as seis peças têm nome, material, preço e botão de WhatsApp que leva o nome da peça
- as quatro garantias, os quatro passos em ordem e a frase da marca estão na tela

**Identidade (as regras do `../MARCA.md` e do `CLAUDE.md` da raiz)**

- nenhuma cor ou fonte fora dos tokens de `styles.css`
- os sete tokens de cor batem, hexadecimal por hexadecimal, com a tabela da seção 2 do manual
- **nada da Panda Mimo dentro deste site**: nem cor, nem fonte, nem o nome da marca irmã
- o mascote vetorial reprovado não aparece em nenhum arquivo publicado (MARCA.md 5)
- todo dado que ainda falta está entre colchetes e marcado com a classe `.falta`, à vista

**Conteúdo sempre visível** (o erro que já deixou o site irmão em branco no celular)

- página carregada num webview sem altura, como o do Instagram e do WhatsApp
- navegador sem `IntersectionObserver`
- navegador com JavaScript desligado: título, preços e caminho para o WhatsApp continuam legíveis

**Banco e privacidade** (com o Supabase simulado, sem tocar em banco de verdade)

- a visita e o clique no WhatsApp são registrados, com o nome da peça clicada
- quem pede "não rastrear" no navegador **não** é medido
- o site não grava **nenhum** cookie, como a página de privacidade promete
- o catálogo do banco substitui a cópia local; o mesmo conteúdo não remonta a tela
- com o banco fora do ar, as seis peças da cópia local seguram o site inteiro

**Loja e busca**

- ícones PNG e de toque, imagem de compartilhamento em 1200x630, manifest, `robots.txt`,
  `sitemap.xml` e `404.html`, todos apontando para o mesmo endereço do `canonical`
- as quatro páginas de apoio existem, estão linkadas no rodapé e têm `canonical`, título e descrição
  próprios, além da identificação da loja exigida pelo Decreto 7.962/2013
- `trocas.html` informa a garantia legal de 90 dias (CDC art. 26) e explica o art. 49
- `privacidade.html` tem a seção de cookies e afirma que o site não usa nenhum
- fontes servidas do próprio site, nada de Google Fonts em página pública
- dados estruturados: `Organization`, `WebSite`, `WebPage` e `ItemList` com preço por peça
- hierarquia de títulos sem saltos e um `<h1>` por página
- `axe-core` (WCAG 2.2 AA + boas práticas) sem violação moderada, séria ou crítica, no celular e no
  computador, nas seis páginas

## Avisos que não bloqueiam

O que aparece sob `⚠ antes de ir ao ar` não reprova, mas precisa ser resolvido antes de o site
receber a primeira visita de verdade:

- o WhatsApp ainda é o número de reserva
- o endereço ainda é o provisório do Cloudflare Pages
- os dados da loja ainda estão entre colchetes

## Provar que o guardião funciona

Um guardião que só aprova não serve para nada. Para conferir que ele reprova mesmo, quebre algo de
propósito e rode: apague o preço de uma peça em `produtos.js`, troque um token por uma cor da Panda
Mimo, tire a assinatura da marca da abertura. Ele tem de reclamar de cada uma.

## Capturas

`npm run shots` salva uma imagem por seção em `qa/shots/<largura>/`, mais a página inteira em
`00-pagina.png`. Servem para comparar antes e depois de uma mudança. A pasta não vai para o
repositório.
