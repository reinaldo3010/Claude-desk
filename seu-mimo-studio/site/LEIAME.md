# Site da Seu Mimo Studio

Site estático, em HTML, CSS e JavaScript puros. **Sem framework e sem etapa de build**: o que está
nesta pasta é exatamente o que vai para o ar. Foi decisão de manutenção — qualquer pessoa consegue
editar, e nada quebra com atualização de dependência.

Antes de mexer em qualquer coisa, leia `../MARCA.md` (o manual da marca) e o `CLAUDE.md` da raiz.

## Os arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | a home: cabeçalho, abertura, garantias, peças, como funciona, frase, fecho, rodapé |
| `sobre.html` `trocas.html` `termos.html` `privacidade.html` | as quatro páginas de apoio |
| `404.html` | página de endereço inexistente (usa endereços absolutos, de propósito) |
| `styles.css` | **todas** as cores e fontes, como tokens em `:root`. Nada de valor solto |
| `produtos.js` | a cópia local do catálogo: as seis peças, com preço. JSON válido de propósito |
| `config.js` | endereço e chave do banco. Em branco = site roda só com a cópia local |
| `script.js` | monta as peças, liga os botões de WhatsApp, mede sem cookie, abre o menu do celular |
| `assets/` | logotipo e símbolo em SVG, mascote, ícones, imagem de compartilhamento, fontes |
| `qa/` | o guardião (`npm test`) e o gerador de imagens (`npm run imagens`) |

## Mudanças do dia a dia

**Trocar o número de WhatsApp:** `script.js`, na constante `CONTATO`. Quando o banco existir, o valor
da tabela `sms_config` passa a mandar e esta linha só vale como reserva.

**Mudar preço ou acrescentar peça:** `produtos.js`. Mantenha as chaves entre aspas — é o que deixa o
arquivo legível pelo guardião. Se a peça for nova, escolha um dos desenhos de linha já definidos em
`index.html` (`ic-garrafa`, `ic-caneca`, `ic-copo`, `ic-ecobag`, `ic-tag`, `ic-kit`).

**Colocar a foto real de uma peça:** preencha `fotos` com `{ "url", "url_2x", "alt", "largura",
"altura" }`. A foto tem de ser um **quadro quadrado transparente**, com a peça inteira e folga em
volta, em 760 px e @2x em 1520 px. O guardião confere os pixels e reprova fundo retangular ou peça
encostando na borda. Enquanto `fotos` está vazio, o quadro mostra o desenho de linha com a legenda
"foto da peça", e isso é intencional: o site diz o que ainda falta em vez de fingir.

**Preencher os dados da loja:** os colchetes destacados (`[RAZÃO SOCIAL]`, `[00.000.000/0001-00]`,
`[endereço completo]`, `[e-mail de contato]`) estão no rodapé das cinco páginas e no corpo de
`sobre.html`, `termos.html` e `privacidade.html`. Substitua o texto e apague a classe `.falta`. São
exigidos pelo Decreto 7.962/2013 e o guardião avisa enquanto estiverem em branco.

**Gerar os ícones e a imagem de compartilhamento de novo** (se o kit da marca mudar):
`npm run imagens`.

## Antes de publicar

```bash
npm test
```

O guardião reprova a publicação se houver problema. O que está documentado em `qa/LEIA-ME.md`.

## Publicar no Cloudflare Pages

Decisão de 11 de setembro de 2026: o site vai para o **Cloudflare Pages**, porque o GitHub Pages serve
um site por repositório e a Panda Mimo já ocupa a raiz. Assim as duas marcas saem do mesmo
repositório, cada uma com seu endereço.

No painel do Cloudflare, em *Workers & Pages · Create · Pages · Connect to Git*:

| Campo | Valor |
|---|---|
| Repositório | `reinaldo3010/Claude-desk` |
| Nome do projeto | `seu-mimo-studio` |
| Branch de produção | a branch onde este site vive |
| Framework preset | **None** |
| Build command | *(deixar vazio)* |
| Build output directory | `seu-mimo-studio/site` |

Não há build: o Cloudflare só copia a pasta. O endereço sai como
`https://seu-mimo-studio.pages.dev`.

**Ao registrar o domínio próprio**, troque o endereço em seis lugares: `canonical`, `og:url` e
`og:image` de `index.html`; o `canonical` das quatro páginas de apoio; `robots.txt`; `sitemap.xml`; e
os endereços absolutos de `404.html`. O guardião reprova se eles ficarem inconsistentes entre si, e
avisa enquanto o endereço ainda for o provisório.

## Banco de dados

Decisão de 11 de setembro de 2026: **projeto Supabase próprio**, separado do da Panda Mimo, para
isolar as duas marcas. Tabelas com prefixo `sms_`:

| Tabela | Para quê |
|---|---|
| `sms_produtos` | o catálogo (`slug`, `nome`, `material`, `preco_texto`, `mensagem`, `icone`, `ordem`, `publicado`) |
| `sms_produto_fotos` | fotos de cada peça (`url`, `url_2x`, `alt`, `largura`, `altura`, `ordem`) |
| `sms_config` | `whatsapp`, `nome_empresarial`, `cnpj`, `endereco`, `email` |
| `sms_eventos` | medição sem cookie (`evento`, `rotulo`, `pagina`, `origem`, `largura`, `sessao`) |

O projeto ainda não existe. Enquanto `config.js` estiver com `URL` e `CHAVE` em branco, o site roda
inteiro com a cópia local e não mede nada — e isso não é um estado degradado: é o mesmo site.
