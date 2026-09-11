# Começar o site da Seu Mimo Studio no seu computador

Documento de passagem, escrito em 11 de setembro de 2026, ao mudar o trabalho da versão web do Claude
Code para o Claude Code instalado na sua máquina. Quem abrir uma sessão nova lê este arquivo primeiro.

---

## 1. O que já está pronto e o que falta

**Pronto, não precisa refazer:**

| O quê | Onde |
|---|---|
| Site da Panda Mimo, no ar e homologado | `panda-mimo/` · https://reinaldo3010.github.io/Claude-desk/ |
| Guardião de qualidade (14 telas, nitidez, acessibilidade) | `panda-mimo/qa/` |
| Páginas legais (sobre, trocas, termos, privacidade) | `panda-mimo/*.html` |
| Manual da marca Seu Mimo Studio | `seu-mimo-studio/MARCA.md` |
| Kit da marca: logotipo, símbolo, avatar em SVG, PDF e PNG | `seu-mimo-studio/kit/` |
| Fontes próprias (DM Serif Display, Montserrat, Playfair) | `seu-mimo-studio/kit/fontes/` |
| Roteiro para gerar imagens do mascote sempre iguais | `seu-mimo-studio/PROMPTS-MASCOTE.md` |
| Book da marca e mockup do site, em prancha editável | https://claude.ai/code/artifact/4c1abf96-6efc-4dd8-9831-bdbf4c551bde |

**Falta, e é o trabalho da nova sessão:**

O site da Seu Mimo Studio não existe como código. Existe só o desenho dele, no book acima. A primeira
sessão local constrói `seu-mimo-studio/site/`, com a mesma arquitetura do site da Panda Mimo e a
identidade da Seu Mimo Studio.

---

## 2. Passo a passo no seu computador

Abra o terminal (PowerShell ou Git Bash) e rode, uma linha por vez:

```bash
git clone https://github.com/reinaldo3010/Claude-desk.git
cd Claude-desk
git checkout claude/custom-items-brand-site-vi3ru8
```

O repositório tem cerca de 120 MB por causa das imagens e dos PDFs. O clone leva alguns minutos.

Depois, dentro da pasta:

```bash
cd panda-mimo
npm install
npx playwright install chromium
cd ..
```

Isso instala o que o guardião precisa. É uma vez só.

Por fim, abra o Claude Code nessa pasta e cole o conteúdo de `seu-mimo-studio/PROMPT-PRIMEIRA-SESSAO.md`.

### Antes de clonar, uma decisão

A branch `claude/custom-items-brand-site-vi3ru8` tem 47 commits e uma pull request aberta em rascunho
(a número 2). Duas opções:

- **Recomendado:** feche a pull request como mesclada no GitHub antes de clonar. Aí você trabalha na
  `main` e não precisa lembrar do nome da branch nunca mais.
- Ou clone e trabalhe na branch mesmo, como está no comando acima. Funciona igual, só exige lembrar o
  nome dela a cada sessão.

---

## 3. Decisões já tomadas, não reabrir

Estas foram discutidas e fechadas. Reabrir custa tempo e desfaz trabalho.

1. **São duas marcas separadas.** Panda Mimo fala com público feminino e infantil; Seu Mimo Studio fala
   com público geral adulto. Nunca misturar cor, fonte, mascote ou texto entre as duas.
2. **A identidade da Seu Mimo Studio está aprovada:** logotipo, símbolo, paleta e tipografia. Evoluir é
   acrescentar dentro das regras do `MARCA.md`, nunca redesenhar.
3. **O mascote é peça em aberto.** A construção vetorial foi reprovada. A referência aprovada é
   `kit/mestres/referencia-mascote-1400.jpg`. Imagens novas saem do roteiro do `PROMPTS-MASCOTE.md`.
   O desenho definitivo vai para um ilustrador. **Não tente desenhar o mascote de novo.**
4. **O site da Panda Mimo está homologado e no ar.** Não mexer nele para construir o novo.
5. **Site estático, sem framework.** HTML, CSS e JavaScript puros, sem build. Foi decisão de manutenção:
   qualquer pessoa consegue editar, e não quebra com atualização de dependência.
6. **Nada de cookie.** A medição é própria, sem identificar ninguém. Isso está escrito na página de
   privacidade e o guardião confere.

---

## 4. Decisões que a nova sessão precisa tomar

Estas ficaram em aberto de propósito, porque dependem de você.

**Onde o site vai ser publicado.** O GitHub Pages serve um site por repositório, e o da Panda Mimo já
ocupa a raiz. Três caminhos:

- Publicar a Seu Mimo Studio num subcaminho, tipo `/studio/`. Rápido, mas endereço feio.
- Usar **Cloudflare Pages** ou **Netlify**, que publicam dois projetos a partir de duas pastas do mesmo
  repositório, cada um com seu domínio. Gratuito. É o que eu recomendo quando os domínios existirem.
- Repositório separado só para a Seu Mimo Studio. Mais limpo, mas perde o site da Panda Mimo como
  referência de arquitetura ali do lado.

**Banco de dados.** O site da Panda Mimo usa o projeto Supabase `ckljoxxlyecljdwuuzfl`, com tabelas com
prefixo `pm_`. Para a Seu Mimo Studio: ou tabelas novas com prefixo `sms_` no mesmo projeto, ou um projeto
Supabase separado. O mesmo projeto é mais simples de administrar; separado isola melhor as duas marcas.

**Se o catálogo começa igual.** As peças da Seu Mimo Studio são as mesmas seis da Panda Mimo (garrafas,
canecas, copos, ecobags, tags, kits) ou o sortimento é outro?

---

## 5. O que você precisa ter em mãos

- Acesso ao GitHub, na conta `reinaldo3010`.
- Acesso ao painel do Supabase, se for mexer em banco.
- O número real de WhatsApp da Seu Mimo Studio. O site da Panda Mimo ainda usa um número de reserva, e o
  guardião avisa sobre isso. Não repita o erro no site novo.
- Os dados da loja para o rodapé: nome empresarial, CNPJ ou CPF, endereço e e-mail. A lei do comércio
  eletrônico exige (Decreto 7.962/2013) e o guardião reprova a publicação sem eles.
- As fotos reais das peças, quando existirem. Até lá o site usa marcas de lugar.

---

## 6. Como rodar o guardião

Ele existe hoje só para a Panda Mimo. A nova sessão adapta para o site novo.

```bash
cd panda-mimo
npm test                      # completo: 14 telas, nitidez e acessibilidade
QA_VIEWPORTS=390 npm test     # rápido, só no celular
npm run shots                 # só as capturas, sem reprovar
```

Regra da casa: **rodar o guardião antes de publicar qualquer mudança.** Ele já pegou página em branco,
texto ilegível, imagem esticada e falha de acessibilidade antes de o cliente ver.

---

## 7. Regras da casa, que valem em qualquer sessão

- Ler `MARCA.md` da marca antes de tocar em qualquer coisa dela.
- Cores e fontes vêm dos tokens do CSS, nunca valor solto no meio do código.
- Nunca apagar arquivo do acervo ao acrescentar coisa nova.
- Nunca esconder problema de layout com `overflow: hidden`.
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
