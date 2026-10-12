
Nome: PREENCHER SEU NOME
RA: PREENCHER SEU RA
URL: PREENCHER URL PAGES.DEV

## Configuração desta atividade

Este projeto foi adaptado para a atividade **Desenho Assinado**. Antes de publicar:

1. Substitua `SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com` em `public/index.html` pelo Client ID OAuth do tipo Web application criado no Google Cloud Console.
2. No Google Cloud Console, cadastre a URL publicada do site em **Authorized JavaScript origins**.
3. Publique no Cloudflare Pages com Framework preset `None`, Build command vazio e Build output directory `public`.
4. No painel do Cloudflare Pages, configure a variável de ambiente `GOOGLE_CLIENT_ID` com o mesmo Client ID. Não coloque tokens, senhas ou arquivos `.env` no repositório.
5. Depois de publicar, entre com sua conta Google, gere o desenho usando os dois últimos dígitos do RA (se forem `00`, use `100`), baixe o SVG e substitua `evidencias/exemplo.svg` por esse arquivo.
6. Atualize as linhas `Nome:`, `RA:` e `URL:` acima, mantendo exatamente esse formato.

### Estrutura da atividade

- `public/index.html`: formulário com número e login Google, sem campo de e-mail.
- `public/app.js`: envia número e token para `/api/desenho` e exibe/baixa o SVG.
- `lib/desenho.js`: geração do SVG no servidor.
- `functions/api/desenho.js`: valida método, corpo e token Google.
- `evidencias/exemplo.svg`: evidência que deve ser substituída pelo desenho real gerado após o login.

**Importante:** o Client ID, seu nome, RA e URL publicada ainda precisam ser preenchidos. O SVG de evidência só será válido para a correção depois de ser gerado no site publicado com a sua conta Google e o número derivado do seu RA.
