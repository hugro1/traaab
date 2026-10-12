# Desenho Assinado

Nome: Hugo Augusto Variani  
RA: 2026108212  
URL: https://traaab.pages.dev

## Configuração desta atividade

Este projeto foi adaptado para a atividade **Desenho Assinado**.

Antes de considerar a atividade concluída:

1. Substitua `SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com` em `public/index.html` pelo Client ID OAuth do tipo Web application criado no Google Cloud Console.
2. Cadastre `https://traaab.pages.dev` em **Authorized JavaScript origins** no Google Cloud Console.
3. Publique no Cloudflare Pages com Framework preset `None`, Build command vazio e Build output directory `public`.
4. Configure a variável de ambiente `GOOGLE_CLIENT_ID` no Cloudflare Pages com o mesmo Client ID.
5. Entre no site com sua conta Google e gere o desenho usando o número `12`, correspondente aos dois últimos dígitos do RA `2026108212`.
6. Baixe o SVG gerado e salve-o em `evidencias/exemplo.svg`.
7. Confirme que os arquivos e as rotas atendem ao contrato da atividade.

Não coloque tokens, senhas ou arquivos `.env` no repositório.

## Estrutura da atividade

- `public/index.html`: formulário com o número e o botão de login Google, sem campo de e-mail.
- `public/script.js`: envia o número e o token para `/api/desenho` e exibe o SVG recebido.
- `lib/desenho.js`: contém a função de geração do SVG no servidor.
- `functions/api/desenho.js`: implementa a rota `POST /api/desenho` e valida método, corpo e token Google.
- `evidencias/exemplo.svg`: desenho real gerado no site publicado, assinado com o e-mail da conta Google autenticada.
