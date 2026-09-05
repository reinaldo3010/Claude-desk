# Panda Mimo — site da marca

Site estático (HTML, CSS e JS puros, sem build) da Panda Mimo, itens personalizados.

## Como publicar

Qualquer hospedagem de arquivos estáticos serve: GitHub Pages, Netlify, Vercel, Cloudflare Pages.
Aponte para a pasta `panda-mimo/` (o arquivo de entrada é `index.html`).

## O que ajustar antes de ir ao ar

Em `script.js`, no bloco `CONFIG`:

- `WHATSAPP`: número com DDI e DDD, só dígitos (ex.: `5511999998888`). Todos os botões
  "Pedir no WhatsApp" e o "Monte seu mimo" usam esse número.
- `INSTAGRAM` e `TIKTOK`: o @ da marca em cada rede, sem o arroba.

Em `index.html`:

- Horário de atendimento, prazo e área de envio, na seção **Contato**.
- Tamanhos, cores e quantidades mínimas nos cartões da seção **Produtos** (são exemplos).
- Regras de frete grátis (barra do topo e selo), forma de pagamento e política de refazer em 7 dias,
  nos selos de confiança e nas **Dúvidas frequentes**. São propostas: confirme antes de publicar.
- Prazo de produção (3 a 5 dias úteis) e condições de pedidos em quantidade, na seção **Empresas**.

## Seções da página

Aviso de frete · Hero · Selos de confiança · Produtos · Monte seu mimo (simulador) · Ocasiões ·
Pedidos em quantidade · Como funciona · Diferenciais · Cuidados com a peça · Galeria ·
Dúvidas frequentes · Redes sociais · Contato · Rodapé · Botão flutuante do WhatsApp.

## Guardião de qualidade

Antes de publicar qualquer mudança, rode o auditor. Ele abre a página em 14 resoluções (de 320x568 a
1920x1080) e falha se encontrar rolagem lateral, elemento fora da tela, imagem que não carregou, cortada ou
ampliada demais, texto cortado, sobreposição entre cartões, elemento fixo em tela estreita, âncora que para
debaixo do cabeçalho, menu do celular que não abre ou não fecha, botão flutuante cobrindo um CTA ou o teclado,
link sem destino ou de WhatsApp inválido, campo sem rótulo, erro de console, falha de rede, e o simulador,
o carrossel ou as dúvidas sem reagir. Também salva capturas por seção em `qa/shots/` para conferência visual.

Duas travas cuidam especificamente das fotos de produto, lendo os pixels de cada imagem:

- **fundo retangular**: se algum canto da foto for opaco, o auditor reprova. É o que impede aquele
  retângulo branco aparecendo atrás da peça.
- **peça encostando na borda**: se houver conteúdo colado na borda da imagem, o auditor reprova, porque
  isso indica produto cortado ou pedaço de uma peça vizinha que entrou no recorte.

Toda foto de produto precisa ser um **quadro quadrado com fundo transparente**, com a peça inteira e folga
em volta. As duas travas foram testadas plantando erros de propósito, e reprovaram como esperado.

```
npm install
npx playwright install chromium
npm test                          # auditoria completa (14 resoluções)
npm run shots                     # só as capturas
QA_VIEWPORTS=390 npm test         # uma largura só, para checagem rápida
node qa/audit.mjs --links         # lista todos os links e botões testados
```

O mesmo auditor roda no GitHub Actions em todo pull request que toque em `panda-mimo/`
(`.github/workflows/panda-mimo-qa.yml`), com as capturas anexadas ao resultado.

## Estrutura

```
panda-mimo/
├── index.html   página única
├── styles.css   estilos (paleta e tipografia da marca)
├── script.js    links de WhatsApp e o simulador "Monte seu mimo"
├── qa/audit.mjs guardião: auditoria visual e funcional com Playwright
├── package.json scripts do guardião (npm test)
└── assets/      logo, mascote, adesivos, mockups e ícones extraídos das folhas transparentes da marca (WebP)
```

## Identidade aplicada

- Cores: nanquim `#111111`, creme `#F6F4EF`, pêssego `#FFB59C`, sálvia `#A8C5A2`, areia `#E7D8C3`.
- Tipografia (Google Fonts): Fredoka para títulos, Caveat para os trechos manuscritos, Nunito para texto.
