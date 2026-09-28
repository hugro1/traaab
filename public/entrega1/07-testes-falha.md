# Testes de falha

## 1. Retorno sem cookie temporário

- Preparação: iniciar o login normalmente e interromper na página do provedor. Abrir a URL de autorização em uma janela privada sem o cookie `__Host-oauth-tx`.
- Requisição enviada: fluxo de callback do provedor sem o cookie temporário.
- Resultado esperado: o callback deve rejeitar a requisição e não criar uma sessão.
- Resultado observado: não executado.

## 2. State alterado

- Preparação: iniciar um novo login e alterar um caractere do parâmetro `state` antes de continuar.
- Requisição enviada: callback contendo um `state` diferente daquele armazenado na transação.
- Resultado esperado: o callback deve rejeitar a requisição antes da troca do código.
- Resultado observado: não executado.

## 3. Reutilização da transação

- Preparação: concluir um login com sucesso, obter a URL de callback e tentar acessá-la novamente.
- Requisição enviada: segunda requisição usando a mesma URL de callback.
- Resultado esperado: a transação já removida deve ser rejeitada.
- Resultado observado: não executado.

## 4. Sessão expirada

- Preparação: executar no D1 `UPDATE sessions SET expires_at = 0;` e recarregar a aplicação.
- Requisição enviada: consulta de `/api/me` utilizando a sessão expirada.
- Resultado esperado: `/api/me` deve responder 401.
- Resultado observado: não executado.

## 5. Logout com Origin inválida

- Preparação: manter uma sessão válida e enviar uma requisição de logout a partir de outra origem.
- Requisição enviada: POST para `/oauth/logout` com `Origin` diferente da URL de produção.
- Resultado esperado: a requisição deve ser rejeitada e a sessão original deve continuar válida.
- Resultado observado: não executado.

## 6. Reutilização de cookie revogado

- Preparação: copiar temporariamente o cookie `__Host-session`, fazer logout e restaurar o mesmo valor.
- Requisição enviada: consulta de `/api/me` utilizando o cookie revogado.
- Resultado esperado: `/api/me` deve responder 401.
- Resultado observado: não executado.
