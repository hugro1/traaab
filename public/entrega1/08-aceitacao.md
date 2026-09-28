# Aceitação final

- [x] o site é servido pelo endereço pages.dev atribuído à equipe;
- [x] os arquivos estáticos e as Functions compartilham a mesma origem;
- [x] o projeto foi publicado por integração com GitHub;
- [x] a equipe não instalou nem executou Node.js, npm, npx ou Wrangler;
- [x] cada provedor usa uma URL de retorno própria e exata;
- [x] os pedidos de autorização usam código e PKCE S256;
- [x] a Function apresenta o Client Secret correto somente na troca de tokens;
- [x] o retorno sem cookie temporário é rejeitado;
- [x] um state alterado é rejeitado;
- [x] uma transação reutilizada é rejeitada;
- [ ] uma sessão expirada é rejeitada;
- [ ] um logout com Origin inválido é rejeitado;
- [ ] um cookie de sessão já revogado não pode restaurar a sessão;
- [x] o conteúdo estático permanece público;
- [x] nenhum token ou Client Secret é exposto no HTML, armazenamento do navegador ou evidências;
- [x] o logout remove a sessão local;
- [x] /api/me devolve somente o perfil mínimo;
