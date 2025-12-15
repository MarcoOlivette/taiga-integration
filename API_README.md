# API REST - Taiga Bulk Manager

API REST para gerenciar tarefas do Taiga programaticamente, sem necessidade de interface web.

## 🚀 Início Rápido

### 1. Iniciar o servidor

```bash
python main.py
```

O servidor estará disponível em `http://localhost:3000`

### 2. Fazer login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "seu_usuario",
    "password": "sua_senha",
    "taiga_url": "https://pista.decea.mil.br/api/v1"
  }'
```

Guarde o `auth_token` retornado.

### 3. Criar tarefas em massa

```bash
curl -X POST http://localhost:3000/api/projects/133/userstories/5258/tasks/bulk \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {"subject": "Tarefa A", "description": "Descrição A"},
      {"subject": "Tarefa B", "description": "Descrição B"},
      {"subject": "Tarefa C"}
    ]
  }'
```

## 📚 Endpoints Disponíveis

### Autenticação

- `POST /api/auth/login` - Fazer login no Taiga

### Projetos

- `GET /api/projects` - Listar todos os projetos
- `GET /api/projects/{id}` - Obter detalhes de um projeto
- `GET /api/projects/{id}/task-statuses` - Listar status de tarefas
- `GET /api/projects/{id}/members` - Listar membros do projeto

### User Stories

- `GET /api/projects/{id}/userstories` - Listar user stories
- `GET /api/projects/{id}/userstories/search` - Buscar user stories (com paginação)
- `GET /api/userstories/{id}` - Obter detalhes de uma user story

### Tarefas

- `GET /api/projects/{id}/tasks` - Listar tarefas de um projeto
- `GET /api/tasks/{id}` - Obter detalhes de uma tarefa
- `POST /api/tasks` - Criar uma tarefa
- `PATCH /api/tasks/{id}` - Atualizar uma tarefa
- `DELETE /api/tasks/{id}` - Deletar uma tarefa
- `POST /api/tasks/bulk` - Criar múltiplas tarefas
- **`POST /api/projects/{project_id}/userstories/{user_story_id}/tasks/bulk`** - Criar tarefas para uma US específica ⭐

## 🎯 Endpoint Principal: Criar Tarefas em Massa

### Rota

```
POST /api/projects/{project_id}/userstories/{user_story_id}/tasks/bulk
```

### Parâmetros

| Parâmetro        | Tipo  | Obrigatório | Descrição                                         |
| ---------------- | ----- | ----------- | ------------------------------------------------- |
| `project_id`     | int   | Sim         | ID do projeto                                     |
| `user_story_id`  | int   | Sim         | ID da user story                                  |
| `tasks`          | array | Sim         | Lista de tarefas a criar                          |
| `status_id`      | int   | Não         | ID do status (padrão: primeiro status do projeto) |
| `assigned_to_id` | int   | Não         | ID do usuário responsável                         |

### Estrutura de cada tarefa

```json
{
  "subject": "Título da tarefa",
  "description": "Descrição opcional"
}
```

### Exemplo Completo

```json
{
  "tasks": [
    {
      "subject": "Implementar login",
      "description": "Criar tela e lógica de autenticação"
    },
    {
      "subject": "Criar testes",
      "description": "Testes unitários para o login"
    },
    {
      "subject": "Documentar API"
    }
  ],
  "status_id": 456,
  "assigned_to_id": 174
}
```

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "3 tasks created successfully",
  "data": [
    {
      "id": 12345,
      "ref": 5001,
      "subject": "Implementar login",
      "description": "Criar tela e lógica de autenticação",
      "status": 456,
      "user_story": 5258,
      "assigned_to": 174
    },
    ...
  ]
}
```

## 💡 Exemplos de Uso

### Python

Veja o arquivo completo em [`examples/create_tasks_api.py`](examples/create_tasks_api.py)

```python
import requests

# Login
response = requests.post("http://localhost:3000/api/auth/login", json={
    "username": "usuario",
    "password": "senha",
    "taiga_url": "https://pista.decea.mil.br/api/v1"
})
token = response.json()["data"]["auth_token"]

# Criar tarefas
tasks = [
    {"subject": "Tarefa A", "description": "Desc A"},
    {"subject": "Tarefa B", "description": "Desc B"},
    {"subject": "Tarefa C"}
]

response = requests.post(
    "http://localhost:3000/api/projects/133/userstories/5258/tasks/bulk",
    headers={"Authorization": f"Bearer {token}"},
    json={"tasks": tasks}
)

print(response.json())
```

### cURL

Veja mais exemplos em [`examples/API_EXAMPLES.md`](examples/API_EXAMPLES.md)

```bash
# Criar 3 tarefas de uma vez
curl -X POST http://localhost:3000/api/projects/133/userstories/5258/tasks/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {"subject": "Tarefa A"},
      {"subject": "Tarefa B"},
      {"subject": "Tarefa C"}
    ]
  }'
```

### JavaScript/Node.js

```javascript
const axios = require("axios");

async function createTasks() {
  // Login
  const loginRes = await axios.post("http://localhost:3000/api/auth/login", {
    username: "usuario",
    password: "senha",
    taiga_url: "https://pista.decea.mil.br/api/v1",
  });

  const token = loginRes.data.data.auth_token;

  // Criar tarefas
  const tasksRes = await axios.post(
    "http://localhost:3000/api/projects/133/userstories/5258/tasks/bulk",
    {
      tasks: [
        { subject: "Tarefa A", description: "Desc A" },
        { subject: "Tarefa B", description: "Desc B" },
        { subject: "Tarefa C" },
      ],
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  console.log(tasksRes.data);
}

createTasks();
```

## 🔍 Como Descobrir IDs

### ID do Projeto

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/projects | jq '.data[] | {id, name, slug}'
```

### ID da User Story

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/projects/133/userstories/search?q=nome_da_us" \
  | jq '.data.stories[] | {id, ref, subject}'
```

### ID do Status

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/projects/133/task-statuses \
  | jq '.data[] | {id, name}'
```

### ID do Usuário

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/projects/133/members \
  | jq '.data[] | {user, full_name_display}'
```

## 📖 Documentação Interativa

Acesse a documentação Swagger em:

```
http://localhost:3000/docs
```

## ⚠️ Notas Importantes

1. **Autenticação**: Todas as rotas (exceto `/auth/login`) requerem o header `Authorization: Bearer {token}`
2. **Token**: O token do Taiga expira após algum tempo. Faça login novamente se receber erro 401
3. **Rate Limiting**: Respeite os limites da API do Taiga
4. **Validação**: O `subject` é obrigatório, `description` é opcional
5. **Status Padrão**: Se não informar `status_id`, será usado o primeiro status disponível do projeto

## 🐛 Troubleshooting

### Erro 401 - Unauthorized

- Verifique se o token está correto
- Faça login novamente para obter um novo token

### Erro 500 - Internal Server Error

- Verifique se os IDs (project_id, user_story_id, status_id) existem
- Verifique os logs do servidor para mais detalhes

### Tarefas não aparecem no Taiga

- Aguarde alguns segundos e recarregue a página
- Verifique se a user story está no projeto correto

## 📝 Licença

MIT
