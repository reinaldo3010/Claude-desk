/* Ligação com o banco (Supabase).

   Decisão tomada em 11 de setembro de 2026: a Seu Mimo Studio tem projeto
   Supabase **próprio**, separado do da Panda Mimo, para as duas marcas ficarem
   isoladas uma da outra. As tabelas usam prefixo `sms_`:

     sms_produtos, sms_produto_fotos, sms_config, sms_eventos

   Enquanto o projeto não existir, deixe URL e CHAVE em branco: o site funciona
   inteiro com a cópia local (produtos.js) e simplesmente não mede nem busca
   nada. Quando o projeto estiver criado, preencha as duas linhas abaixo.

   A chave publicável é pública de propósito: ela só permite ler o que está
   marcado como publicado. Gravar exige login de administrador, garantido por
   regras no próprio banco.

   Se algo já tiver definido SMS_CONFIG antes deste arquivo (a hospedagem
   injetando a configuração, ou o guardião simulando o banco), o que está aqui
   não sobrescreve. */
window.SMS_CONFIG = window.SMS_CONFIG || {
  URL: "",
  CHAVE: "",
  BUCKET: "seu-mimo-studio",
};
