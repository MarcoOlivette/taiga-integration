# Exemplos de uso da API via curl

## 1. Fazer Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "seu_usuario",
    "password": "sua_senha",
    "taiga_url": "https://pista.decea.mil.br/api/v1"
  }'
```

**Resposta:**

```json
{
  "success": true,
  "data": {
    "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...",
    "user": {
      "id": 174,
      "username": "marcoolivette",
      "full_name": "Marco Olivette",
      "email": "marco.vieira.olivette@gmail.com"
    }
  }
}
```

---

## 2. Criar Tarefas em Massa para uma User Story

**Endpoint:** `POST /api/projects/{project_id}/userstories/{user_story_id}/tasks/bulk`

### Exemplo: Criar tarefas A, B e C na US #5258 do projeto DASA (ID: 133)

```bash
TOKEN="seu_token_aqui"

curl -X POST http://localhost:3000/api/projects/133/userstories/5258/tasks/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "subject": "Tarefa A - Implementar funcionalidade X",
        "description": "Descrição detalhada da tarefa A"
      },
      {
        "subject": "Tarefa B - Criar testes unitários",
        "description": "Criar testes para a funcionalidade X"
      },
      {
        "subject": "Tarefa C - Documentar código"
      }
    ]
  }'
```

**Resposta:**

```json
{
  "success": true,
  "message": "3 tasks created successfully",
  "data": [
    {
      "id": 12345,
      "ref": 5001,
      "subject": "Tarefa A - Implementar funcionalidade X",
      "description": "Descrição detalhada da tarefa A",
      "status": 123,
      "user_story": 5258
    },
    {
      "id": 12346,
      "ref": 5002,
      "subject": "Tarefa B - Criar testes unitários",
      "description": "Criar testes para a funcionalidade X",
      "status": 123,
      "user_story": 5258
    },
    {
      "id": 12347,
      "ref": 5003,
      "subject": "Tarefa C - Documentar código",
      "description": "",
      "status": 123,
      "user_story": 5258
    }
  ]
}
```

---

## 3. Criar Tarefas com Status e Responsável Específicos

```bash
curl -X POST http://localhost:3000/api/projects/133/userstories/5258/tasks/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "subject": "Tarefa A",
        "description": "Descrição A"
      },
      {
        "subject": "Tarefa B",
        "description": "Descrição B"
      }
    ],
    "status_id": 456,
    "assigned_to_id": 174
  }'
```

---

## 4. Listar User Stories de um Projeto (para pegar IDs)

```bash
curl -X GET "http://localhost:3000/api/projects/133/userstories/search?milestone=null&page_size=100" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. Listar Status Disponíveis (para pegar status_id)

```bash
curl -X GET http://localhost:3000/api/projects/133/task-statuses \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Listar Membros do Projeto (para pegar assigned_to_id)

```bash
curl -X GET http://localhost:3000/api/projects/133/members \
  -H "Authorization: Bearer $TOKEN"
```

---

## Fluxo Completo em Bash

```bash
#!/bin/bash

# Configurações
API_URL="http://localhost:3000/api"
TAIGA_URL="https://pista.decea.mil.br/api/v1"
USERNAME="seu_usuario"
PASSWORD="sua_senha"
PROJECT_ID=133
USER_STORY_ID=5258

# 1. Login
echo "🔐 Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\",
    \"taiga_url\": \"$TAIGA_URL\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.auth_token')
echo "✅ Token obtido: ${TOKEN:0:20}..."

# 2. Criar tarefas
echo ""
echo "📝 Criando tarefas..."
curl -X POST "$API_URL/projects/$PROJECT_ID/userstories/$USER_STORY_ID/tasks/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {"subject": "Tarefa A", "description": "Descrição A"},
      {"subject": "Tarefa B", "description": "Descrição B"},
      {"subject": "Tarefa C", "description": "Descrição C"}
    ]
  }' | jq '.'

echo ""
echo "✅ Tarefas criadas com sucesso!"
```

---

## Notas Importantes

1. **Autenticação**: Sempre inclua o header `Authorization: Bearer {token}` nas requisições
2. **Token**: O token expira após algum tempo, faça login novamente se necessário
3. **IDs**: Use os endpoints de listagem para descobrir os IDs corretos
4. **Descrição**: O campo `description` é opcional
5. **Status**: Se não informar `status_id`, será usado o status padrão do projeto
