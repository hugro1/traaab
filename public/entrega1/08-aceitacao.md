# Critérios de aceitação

- ☑ o site é servido pelo endereço pages.dev atribuído à equipe;
- ☑ os arquivos estáticos e as Functions compartilham a mesma origem;
- ☑ o projeto foi publicado por integração com GitHub;
- ☑ a equipe não instalou nem executou Node.js, npm, npx ou Wrangler;
- ☑ cada provedor usa uma URL de retorno própria e exata;
- ☑ os pedidos de autorização usam código e PKCE S256;
- ☑ a Function apresenta o Client Secret correto somente na troca de tokens;
- ☑ transações ausentes, expiradas, com state alterado ou já consumidas são rejeitadas;
- ☑ o id_token do Google passa por validação criptográfica e semântica;
- ☑ o access_token do GitHub é usado somente para /user e é revogado antes da sessão local;
- ☑ o cookie de sessão é opaco, Secure, HttpOnly, SameSite=Strict e sem Domain;
- ☑ o D1 armazena somente o resumo necessário da sessão, nunca o cookie bruto;
- ☑ /api/me devolve apenas o perfil mínimo necessário;
- ☑ /oauth/logout exige POST, confere Origin, remove a sessão e expira o cookie;
- ☑ um cookie revogado não consegue restaurar a sessão;
- ☑ tokens, secrets, HTML, URLs salvas, Web Storage e logs não contêm credenciais sensíveis;
- ☑ a equipe consegue explicar por que os arquivos estáticos continuam públicos;
- ☑ as sessões administrativas foram encerradas no computador compartilhado.
