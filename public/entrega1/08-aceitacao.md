# Checklist de aceitação

- [ ] URL de produção em pages.dev
- [ ] Conteúdo estático e Functions no mesmo domínio/origem
- [ ] Publicação realizada pela integração com GitHub
- [ ] Projeto sem Node, npm, npx ou Wrangler
- [ ] URLs de retorno do Google e GitHub configuradas exatamente
- [ ] Authorization Code com PKCE S256
- [ ] Client Secret utilizado somente na troca do código por token
- [ ] Transação rejeitada quando ausente, expirada, alterada ou reutilizada
- [ ] ID Token do Google validado criptograficamente e semanticamente
- [ ] Access token do GitHub utilizado somente para consultar `/user` e revogado antes da criação da sessão local
- [ ] Sessão local opaca em cookie Secure, HttpOnly e SameSite=Strict
- [ ] D1 armazena somente o resumo da sessão, sem o valor bruto do cookie
- [ ] `/api/me` retorna somente o perfil mínimo necessário
- [ ] Logout valida a origem, remove a sessão no D1 e expira o cookie
- [ ] Cookie de sessão revogado não consegue restaurar a sessão
- [ ] Tokens e segredos não aparecem no HTML, URLs salvas, Web Storage ou logs
- [ ] Conteúdo estático permanece público
- [ ] Sessões administrativas foram encerradas no computador compartilhado
