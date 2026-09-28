# Testes de falha

## 1. Retorno sem cookie temporário

**Preparação:**  
Início do login em uma janela normal, interrompido na página do provedor. A URL de autorização foi aberta em uma janela privada sem o cookie `__Host-oauth-tx`.

**Pedido enviado:**  
Conclusão do fluxo de autorização e retorno para `/oauth/callback/google` sem o cookie temporário correspondente.

**Resultado esperado:**  
O callback deve rejeitar a requisição e nenhuma sessão deve ser criada.

**Resultado observado:**  
O callback rejeitou a requisição e nenhuma sessão foi criada.

---

## 2. State alterado

**Preparação:**  
Um novo login foi iniciado e interrompido antes da entrada das credenciais. Um caractere do parâmetro `state` foi alterado.

**Pedido enviado:**  
Retorno ao callback com o `state` diferente daquele armazenado na transação OAuth.

**Resultado esperado:**  
O callback deve rejeitar a requisição antes da troca do código por tokens.

**Resultado observado:**  
O callback rejeitou a requisição antes da troca do código por tokens.

---

## 3. Reutilização da transação

**Preparação:**  
Um login foi concluído com sucesso e a URL do callback foi obtida no Network.

**Pedido enviado:**  
A mesma URL de callback foi aberta novamente após a conclusão do login.

**Resultado esperado:**  
A segunda tentativa deve falhar porque a transação OAuth já foi consumida/removida.

**Resultado observado:**  
A segunda tentativa falhou porque a transação OAuth já havia sido consumida/removida.

---

## 4. Sessão expirada

**Preparação:**  
A sessão foi criada e, no D1, o campo `expires_at` das sessões foi alterado para `0`.

**Pedido enviado:**  
A página foi recarregada e foi realizada uma nova consulta a `/api/me`.

**Resultado esperado:**  
`/api/me` deve retornar HTTP 401 para a sessão expirada.

**Resultado observado:**  
`/api/me` retornou HTTP 401 e a sessão expirada não foi aceita.

---

## 5. Logout com Origin inválido

**Preparação:**  
Uma sessão válida foi mantida em `https://traaab.pages.dev`.

**Pedido enviado:**  
Foi enviada uma requisição `POST` para `/oauth/logout` a partir de uma origem diferente de `https://traaab.pages.dev`.

**Resultado esperado:**  
O logout deve ser rejeitado e a sessão original deve permanecer válida.

**Resultado observado:**  
A requisição de logout foi rejeitada e a sessão original permaneceu válida.

---

## 6. Reutilização de cookie de sessão revogado

**Preparação:**  
O valor do cookie `__Host-session` de uma sessão válida foi temporariamente copiado. Em seguida, foi realizado logout normalmente.

**Pedido enviado:**  
O mesmo valor antigo do cookie foi restaurado e `/api/me` foi consultado novamente.

**Resultado esperado:**  
A sessão revogada não deve ser restaurada e `/api/me` deve retornar HTTP 401.

**Resultado observado:**  
A sessão revogada não foi restaurada e `/api/me` retornou HTTP 401.
