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

## Estrutura

```
panda-mimo/
├── index.html   página única
├── styles.css   estilos (paleta e tipografia da marca)
├── script.js    links de WhatsApp e o simulador "Monte seu mimo"
└── assets/      logo, mascote, adesivos, mockups e ícones extraídos das folhas transparentes da marca (WebP)
```

## Identidade aplicada

- Cores: nanquim `#111111`, creme `#F6F4EF`, pêssego `#FFB59C`, sálvia `#A8C5A2`, areia `#E7D8C3`.
- Tipografia (Google Fonts): Fredoka para títulos, Caveat para os trechos manuscritos, Nunito para texto.
