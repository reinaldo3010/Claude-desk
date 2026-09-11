# Começar o site da Seu Mimo Studio no seu computador

Documento de passagem. Escrito em 11 de setembro de 2026, ao mudar o trabalho da versão web do Claude
Code para o Claude Code instalado na sua máquina, e atualizado no mesmo dia, quando o site foi
construído. Quem abrir uma sessão nova lê este arquivo primeiro.

---

## 1. O que já está pronto e o que falta

**Pronto, não precisa refazer:**

| O quê | Onde |
|---|---|
| Site da Panda Mimo, no ar e homologado | `panda-mimo/` · https://reinaldo3010.github.io/Claude-desk/ |
| Guardião de qualidade da Panda Mimo | `panda-mimo/qa/` |
| Manual da marca Seu Mimo Studio | `seu-mimo-studio/MARCA.md` |
| Kit da marca: logotipo, símbolo, avatar em SVG, PDF e PNG | `seu-mimo-studio/kit/` |
| Fontes próprias (DM Serif Display, Montserrat, Playfair, Caveat) | `seu-mimo-studio/kit/fontes/` |
| **Arte definitiva do mascote**: folha de modelo, folhas de poses e poses soltas | **`seu-mimo-studio/kit/mascote-2d/`** |
| Roteiro de geração assistida, hoje só para cena e fundo | `seu-mimo-studio/PROMPTS-MASCOTE.md` |
| Book da marca e mockup do site, em prancha editável | https://claude.ai/code/artifact/4c1abf96-6efc-4dd8-9831-bdbf4c551bde |
| **Site da Seu Mimo Studio** | **`seu-mimo-studio/site/`** |
| **Guardião do site novo, passando nas 14 telas** | **`seu-mimo-studio/site/qa/`** |

A home tem 14 seções: aviso de envio, abertura, quatro garantias, as peças com busca, filtro por tema e
detalhe, o simulador "Veja como fica", seis ocasiões, pedidos em quantidade, como funciona, diferenciais,
cuidados por tipo de peça, depoimentos com formulário, dúvidas em sanfona, a frase da marca e o fecho.
Mais as quatro páginas de apoio na voz desta marca, a 404, os ícones, a imagem de compartilhamento, o
`robots.txt`, o `sitemap.xml`, o manifest e os dados estruturados (incluindo o FAQPage). Como usar e como
mudar está em `site/LEIAME.md`.

**Falta, e depende de coisas que só você tem:**

| O quê | Por que trava | Onde entra |
|---|---|---|
| O número real de WhatsApp | sem ele nenhum clique chega a ninguém | `site/script.js`, constante `CONTATO` |
| Razão social, CNPJ, endereço e e-mail | exigidos pelo Decreto 7.962/2013 | rodapé das cinco páginas, e no corpo de `sobre.html`, `termos.html` e `privacidade.html` |
| Uma frase sobre quem está por trás do Studio | é o único parágrafo do `sobre.html` que não pode ser inventado | `site/sobre.html` |
| A data de publicação das políticas | `termos.html` e `privacidade.html` | os dois arquivos |
| As fotos reais das seis peças | hoje o quadro mostra o desenho de linha e a legenda "foto da peça" | `site/produtos.js`, campo `fotos` |
| O projeto Supabase e o domínio | decididos, mas ainda não criados | `site/config.js` e `site/LEIAME.md` |

Todos esses dados estão **entre colchetes e destacados na tela**, de propósito: o guardião reprova
colchete escondido, e avisa em cada rodada quantos ainda faltam. É mais honesto do que sumir com a
falta.

---

## 2. Passo a passo no seu computador

O repositório já está clonado. Para preparar o guardião do site novo, uma vez só:

```bash
cd seu-mimo-studio/site
npm install
node node_modules/playwright/cli.js install chromium
```

> O caminho deste repositório tem um `&` (`OneDrive - MINGARDI & ELIAS`), e o `npx` do Windows quebra
> com isso. Por isso o comando do Chromium chama o `cli.js` direto. Vale para qualquer `npx` aqui
> dentro: troque por `node node_modules/<pacote>/cli.js`, ou mova o repositório para um caminho sem `&`.

O guardião da Panda Mimo é separado e tem a própria instalação, em `panda-mimo/`.

---

## 3. Decisões já tomadas, não reabrir

Estas foram discutidas e fechadas. Reabrir custa tempo e desfaz trabalho.

1. **São duas marcas separadas.** Panda Mimo fala com público feminino e infantil; Seu Mimo Studio fala
   com público geral adulto. Nunca misturar cor, fonte, mascote ou texto entre as duas. O guardião do
   site novo reprova qualquer cor, fonte ou menção da marca irmã dentro dele.
2. **A identidade da Seu Mimo Studio está aprovada:** logotipo, símbolo, paleta e tipografia. Evoluir é
   acrescentar dentro das regras do `MARCA.md`, nunca redesenhar.
3. **O mascote está resolvido** (11/09/2026). A arte definitiva está em `kit/mascote-2d/` e é a única
   que sai publicada: folha de modelo com 12 expressões e 16 ações, folhas de poses e as poses soltas em
   PNG transparente. A construção vetorial reprovada e o render 3D de referência ficam como registro.
   **Não tente desenhar o mascote nem gerá-lo por IA:** pose nova se desenha a partir da folha de modelo.
4. **O site da Panda Mimo está homologado e no ar.** Não mexer nele.
5. **Site estático, sem framework.** HTML, CSS e JavaScript puros, sem build. Decisão de manutenção:
   qualquer pessoa consegue editar, e não quebra com atualização de dependência.
6. **Nada de cookie.** A medição é própria, sem identificar ninguém, e quem pede "não rastrear" no
   navegador não entra na conta. Está escrito na página de privacidade e o guardião confere os dois.
7. **Publicação no Cloudflare Pages** (11/09/2026), com a pasta `seu-mimo-studio/site` como raiz
   publicada. O GitHub Pages serve um site por repositório e a Panda Mimo já ocupa a raiz. Endereço
   provisório: `seu-mimo-studio.pages.dev`. Configuração exata em `site/LEIAME.md`.
8. **Projeto Supabase próprio** (11/09/2026), separado do da Panda Mimo, com tabelas de prefixo `sms_`.
   Isola as duas marcas uma da outra. O projeto ainda não foi criado, e o site roda inteiro sem ele.
9. **O catálogo começa com as mesmas seis peças e os mesmos preços da Panda Mimo** (11/09/2026):
   garrafas R$ 89, canecas R$ 49, copos R$ 79, ecobags R$ 59, tags R$ 15 com mínimo de 10, kits R$ 149.
   É o que o mockup do book já desenhava.
10. **A Caveat é a manuscrita desta marca.** O manual já a nomeava; ela entrou no kit em 11/09/2026,
    com a licença OFL. Não é empréstimo da Panda Mimo: é a fonte que a seção 3 do `MARCA.md` pede.

---

## 4. O que a próxima sessão pode fazer

Em ordem de quanto destrava o resto:

1. **Preencher os dados que faltam** (tabela da seção 1). É o que separa o site de estar no ar.
2. **Criar o projeto Supabase** com as quatro tabelas de `site/LEIAME.md` e preencher `site/config.js`.
   Enquanto isso não existe, o catálogo vive na cópia local e o painel de administração não existe.
3. **Um painel de administração**, como o `panda-mimo/admin.html`, para o catálogo e os contatos serem
   editados sem tocar em código. Só faz sentido depois do banco.
4. **As fotos das peças**, no formato da seção 8 do `MARCA.md`.
5. **O mascote em vetor editável.** A arte definitiva resolve site, redes e impressão, mas é raster:
   bordado, gravação a laser e corte precisam de curva. É hoje a pendência mais importante da marca.
6. **As outras quinze ações do mascote em arquivo solto.** A folha de modelo tem dezesseis poses; só a
   de abraçar o coração veio em alta resolução. As demais precisam ser exportadas uma a uma.

---

## 5. O que você precisa ter em mãos

- Acesso ao GitHub, na conta `reinaldo3010`.
- Uma conta no Cloudflare, para publicar.
- Uma conta no Supabase, quando for criar o banco.
- O número real de WhatsApp da Seu Mimo Studio.
- Os dados da loja para o rodapé: nome empresarial, CNPJ ou CPF, endereço e e-mail.
- As fotos reais das peças, quando existirem.

---

## 6. Como rodar o guardião

```bash
cd seu-mimo-studio/site
npm test                      # completo: 14 telas, nitidez, banco simulado e acessibilidade
QA_VIEWPORTS=390 npm test     # rápido, só no celular
npm run shots                 # só as capturas, sem reprovar
```

O que ele confere, item por item, está em `site/qa/LEIA-ME.md`. Hoje ele passa limpo, com três avisos
que não bloqueiam: o WhatsApp de reserva, o endereço provisório e os dados da loja em branco.

Ele também roda sozinho no GitHub, a cada push na `main` e a cada pull request que toque o site ou o
kit. Mas **avisa, não bloqueia**: o Cloudflare publica sem esperar. Para virar porteira, ligue a
proteção da branch `main` em *Settings · Branches* e exija o check.

Regra da casa: **rodar o guardião antes de publicar qualquer mudança.** Ele já pegou página em branco,
texto ilegível, imagem esticada e falha de acessibilidade antes de o cliente ver. Na construção deste
site ele pegou, entre outras, uma âncora de menu que parava atrás do cabeçalho por causa da animação de
entrada, e cinco pares de cor que a prancha original usava e que reprovavam em contraste.

O guardião da Panda Mimo continua separado, em `panda-mimo/`, e roda com os mesmos comandos de lá.

---

## 7. Regras da casa, que valem em qualquer sessão

- Ler o `MARCA.md` da marca antes de tocar em qualquer coisa dela.
- Cores e fontes vêm dos tokens do CSS, nunca valor solto no meio do código.
- Nunca apagar arquivo do acervo ao acrescentar coisa nova.
- Nunca esconder problema de layout com `overflow: hidden`.
- Dado que falta fica entre colchetes e à vista, nunca inventado e nunca escondido.
- Ao mudar uma regra da marca, atualizar o manual e registrar no histórico no fim dele.
- A inteligência artificial nunca desenha logotipo, letreiro nem texto da marca. Isso entra por cima,
  com os arquivos do kit.

---

## 8. Histórico curto, para entender de onde viemos

O site da Panda Mimo nasceu primeiro e passou por uma versão de conversão, uma correção de página em
branco em navegador embutido, e uma homologação de loja que acrescentou as páginas legais, os dados da
loja no rodapé, fontes próprias e dados estruturados para o Google.

A Seu Mimo Studio nasceu de uma prancha gerada por inteligência artificial, aprovada por você. Dela saiu
o logotipo construído em vetor, o símbolo, a paleta e a tipografia. A tentativa de construir o mascote em
vetor foi reprovada duas vezes e o caminho mudou: referência aprovada mais geração assistida agora,
ilustrador depois.

Em 11 de setembro de 2026 o trabalho passou para o computador local e o site foi construído, com a
arquitetura técnica da Panda Mimo e a identidade desta marca, a partir do mockup do book.
