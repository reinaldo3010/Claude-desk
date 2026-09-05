# Panda Mimo — site da marca

Site estático (HTML, CSS e JS puros, sem build) da Panda Mimo, itens personalizados.

## Como publicar

Qualquer hospedagem de arquivos estáticos serve: GitHub Pages, Netlify, Vercel, Cloudflare Pages.
Aponte para a pasta `panda-mimo/` (o arquivo de entrada é `index.html`).

## O que ajustar antes de ir ao ar

WhatsApp, Instagram, TikTok e o aviso do topo se mudam pelo **painel** (`admin.html`), sem mexer em código.
O `CONTATO` em `script.js` é só o valor de reserva usado enquanto o banco não responde.

Coisas que dependem do domínio final e por isso ficaram marcadas (o guardião avisa enquanto não forem feitas):

- Em `index.html`, troque a `og:image` relativa por um endereço completo
  (`https://seudominio.com.br/assets/og.jpg`). WhatsApp e Facebook não aceitam caminho relativo.
- Ainda no `<head>`, acrescente `<link rel="canonical" href="https://seudominio.com.br/">`.
- Em `robots.txt` e `sitemap.xml`, substitua `SEU-DOMINIO` pelo endereço final.

Em `index.html`, revise também os textos que são propostas:

- Horário de atendimento, prazo e área de envio, na seção **Contato**.
- Regras de frete grátis (barra do topo e selo), forma de pagamento e política de refazer em 7 dias,
  nos selos de confiança e nas **Dúvidas frequentes**.
- Prazo de produção (3 a 5 dias úteis) e condições de pedidos em quantidade, na seção **Empresas**.

Os preços e o texto longo de cada produto se preenchem pelo painel (campos **Preço** e **Texto da tela de detalhe**).
Enquanto o preço estiver vazio, a tela de detalhe mostra "Valor sob consulta".

## Manual da marca

A marca tem um brand book próprio, escrito a partir da identidade aprovada no site:

- **`MARCA.md`**: o manual completo em texto (essência, tom de voz, nome e frases, logotipo, mascote,
  cores com HEX/RGB/CMYK, tipografia, elementos, fotografia, aplicações, governança e histórico).
- **`marca/index.html`**: a versão visual, com amostras de cor, tipo, logo, mascote e aplicações.
  Não é indexada nem linkada no site; abra direto no navegador.
- **`marca/manual-da-marca-panda-mimo.pdf`**: a mesma versão visual em PDF (A4, 20 páginas, fontes
  embutidas), para mandar a quem não abre o site. Para gerar de novo depois de uma mudança: abra
  `marca/index.html` no Chrome e imprima em PDF, A4, com "gráficos de fundo" ligados.

Regra da casa: qualquer evolução do site ou de material da marca começa consultando o manual, e
qualquer mudança de regra é registrada no histórico dele. O `CLAUDE.md` na raiz do repositório
aponta para lá, então quem trabalhar no projeto com o Claude parte das mesmas regras.

## Seções da página

Aviso de frete · Hero · Selos de confiança · Produtos · Monte seu mimo (simulador) · Ocasiões ·
Pedidos em quantidade · Como funciona · Diferenciais · Cuidados com a peça · Galeria ·
Dúvidas frequentes · Redes sociais · Contato · Rodapé · Botão flutuante do WhatsApp.

### Tela de detalhe do produto

Clicar na foto de um cartão ou em **Ver detalhes** abre uma janela com a foto grande, as miniaturas do
carrossel, o preço, o texto longo, as etiquetas, o botão do WhatsApp e **Ver com meu nome**, que leva ao
simulador já com aquela base escolhida e no modo foto real. Cada produto tem endereço próprio
(`#produto/canecas`, por exemplo), então dá para mandar o link direto de um item.

### Foto real no simulador

No "Monte seu mimo", a chave **Desenho / Foto real** troca a ilustração pela foto do produto com o nome
digitado desenhado na placa da peça. A posição e a cor da placa de cada base estão em `FOTO_REAL`
(`script.js`), em porcentagem da foto, e o nome encolhe sozinho até caber. No modo foto as cores da peça
ficam desligadas (a foto é da peça creme) e a mensagem do WhatsApp sai com "Cor: a combinar".

### Movimento

Três gestos, todos discretos e respeitando a preferência "reduzir movimento" do sistema: as seções abaixo
da dobra aparecem com um leve fade e subida de 12 px (uma vez só, ao rolar), o botão flutuante do WhatsApp
dá um aceno após 8 e 30 segundos, e as transições de detalhe e simulador são as já existentes.

### Medição

O site registra visitas, cliques no WhatsApp, abertura de detalhe, uso do carrossel e envio do simulador na
tabela `pm_eventos`, sem cookie e sem identificar pessoas (um número aleatório por aba, que morre ao fechar).
Quem ativa "não rastrear" no navegador não é contado. Os números aparecem na aba **Métricas** do painel.

## Guardião de qualidade

Antes de publicar qualquer mudança, rode o auditor. Ele abre a página em 14 resoluções (de 320x568 a
1920x1080) e falha se encontrar rolagem lateral, elemento fora da tela, imagem que não carregou, cortada ou
ampliada demais, texto cortado, sobreposição entre cartões, elemento fixo em tela estreita, âncora que para
debaixo do cabeçalho, menu do celular que não abre ou não fecha, botão flutuante cobrindo um CTA ou o teclado,
link sem destino ou de WhatsApp inválido, campo sem rótulo, erro de console, falha de rede, e o simulador,
o carrossel ou as dúvidas sem reagir. Também salva capturas por seção em `qa/shots/` para conferência visual.

Nesta versão ele também cobre a tela de detalhe (abre, fecha, foca, endereço `#produto/...`), o modo foto real
(foto aparece, desenho some, nome cabe na placa, placa dentro da foto), o movimento (seções acima da dobra
nunca ficam invisíveis), a medição (evento de visita e de clique chegam com sessão e largura) e o `<head>`:
favicon PNG, ícone da Apple, `og:image` em JPG ou PNG de 1200x630, cartão do Twitter, `robots.txt` e
`sitemap.xml` presentes. Endereço relativo na `og:image`, canonical ausente e `SEU-DOMINIO` nos arquivos
geram aviso, não reprovação, até o domínio existir.

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

## Painel de administração

O catálogo do site sai do banco de dados, e quem manda nele é o painel em **`admin.html`**
(`seusite.com.br/admin.html`). Lá dá para:

- criar, editar, publicar, tirar do ar, reordenar e excluir produtos;
- subir fotos, reordenar, escrever a descrição de cada uma e apagar;
- mudar o WhatsApp, o Instagram, o TikTok e o aviso da barra do topo;
- baixar a cópia de segurança do catálogo (`produtos.js`).

### Primeiro acesso

1. No painel do Supabase, em **Authentication → Users → Add user**, crie o usuário com o
   e-mail que já está na tabela `pm_admins` e marque para confirmar automaticamente.
2. Abra `admin.html` no navegador e entre com esse e-mail e a senha.

Para liberar outra pessoa, basta acrescentar o e-mail dela em `pm_admins`.

### Como as fotos são tratadas

Toda foto enviada pelo painel é preparada no próprio navegador antes de subir: ela é
reduzida, tem o fundo removido, é recortada no contorno da peça e centralizada num quadro
quadrado de 760 px com fundo transparente. Antes de aceitar, o painel confere as mesmas
regras que o guardião cobra do site e recusa a foto explicando o motivo quando:

- o fundo não saiu (canto opaco);
- a peça ficou encostando na borda (risco de estar cortada);
- o resultado é um retângulo de foto em vez da peça recortada;
- o recorte comeu quase tudo e sobrou só um pedacinho.

Se o recorte automático não der conta, há um controle de força e a saída sempre disponível:
mandar um PNG que já venha com fundo transparente.

### Estrutura no banco

| Tabela | Para que serve |
|---|---|
| `pm_produtos` | um registro por produto: nome, descrição, texto de detalhe, preço, etiquetas, mensagem do WhatsApp, ordem, publicado |
| `pm_produto_fotos` | as fotos de cada produto, na ordem em que aparecem no carrossel |
| `pm_config` | WhatsApp, Instagram, TikTok e o aviso do topo |
| `pm_eventos` | medição própria: visitas, cliques e uso do simulador (lida pela função `pm_metricas`) |
| `pm_admins` | os e-mails que podem alterar o catálogo |

As regras de acesso ficam no próprio banco: qualquer visitante lê o que está publicado,
mas gravar exige estar na lista de administradores. Por isso a chave que aparece em
`config.js` pode ficar visível no site sem risco.

### Se o banco não responder

O site nunca fica sem catálogo: ele nasce com a cópia de `produtos.js` e só troca pelo que
vem do banco quando a resposta chega. Depois de mexer bastante nos produtos, baixe a cópia
nova pelo painel e substitua esse arquivo no site.

## Estrutura

```
panda-mimo/
├── index.html   página única
├── styles.css   estilos (paleta e tipografia da marca)
├── script.js    catálogo, detalhe, simulador (desenho e foto real), medição e movimento
├── produtos.js  cópia do catálogo, usada quando o banco não responde
├── MARCA.md     manual da marca (brand book) em texto
├── marca/       manual da marca em versão visual (index.html)
├── config.js    endereço e chave pública do banco
├── admin.html   painel de administração
├── admin.js     conversa com o banco e prepara as fotos
├── admin.css    estilo do painel
├── qa/audit.mjs guardião: auditoria visual e funcional com Playwright
├── package.json scripts do guardião (npm test)
├── robots.txt / sitemap.xml   trocar SEU-DOMINIO antes de publicar
└── assets/      logo, mascote, adesivos, mockups (WebP), ícones PNG, apple-touch-icon e og.jpg 1200x630
```

## Identidade aplicada

- Cores: nanquim `#111111`, creme `#F6F4EF`, pêssego `#FFB59C`, sálvia `#A8C5A2`, areia `#E7D8C3`.
- Tipografia (Google Fonts): Fredoka para títulos, Caveat para os trechos manuscritos, Nunito para texto.
