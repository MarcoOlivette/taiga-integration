# Documentação: Como Criar Tarefas no Taiga via API

## Endpoint

```
POST https://pista.decea.mil.br/api/v1/tasks
```

## Headers Obrigatórios

```
Authorization: Bearer {seu_token}
Content-Type: application/json
```

## Campos do Payload

### Obrigatórios:

- **project** (int): ID do projeto
- **subject** (string): Título da tarefa

### Opcionais:

- **description** (string): Descrição da tarefa
- **status** (int): ID do status da tarefa
- **user_story** (int): ID da User Story à qual a tarefa pertence
- **assigned_to** (int): ID do usuário responsável
- **milestone** (int): ID do milestone
- **tags** (array): Array de strings com tags
- **is_blocked** (boolean): Se a tarefa está bloqueada
- **blocked_note** (string): Motivo do bloqueio
- **is_closed** (boolean): Se a tarefa está fechada
- **us_order** (int): Ordem na user story
- **taskboard_order** (int): Ordem no taskboard
- **is_iocaine** (boolean): Tarefa complexa/difícil
- **watchers** (array): Array de IDs de observadores

## Exemplo Mínimo

```bash
curl -X POST https://pista.decea.mil.br/api/v1/tasks \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project": 133,
    "subject": "Minha tarefa"
  }'
```

## Exemplo Completo com User Story

```bash
curl -X POST https://pista.decea.mil.br/api/v1/tasks \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project": 133,
    "subject": "Implementar funcionalidade X",
    "description": "Descrição detalhada da tarefa",
    "status": 667,
    "user_story": 14846
  }'
```

## Exemplo Python

```python
import requests

url = "https://pista.decea.mil.br/api/v1/tasks"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
payload = {
    "project": 133,
    "subject": "Minha tarefa",
    "description": "Descrição da tarefa",
    "status": 667,
    "user_story": 14846
}

response = requests.post(url, headers=headers, json=payload)

if response.status_code == 201:
    task = response.json()
    print(f"Tarefa criada: #{task['ref']} - {task['subject']}")
else:
    print(f"Erro: {response.status_code} - {response.text}")
```

## Resposta de Sucesso (201 Created)

```json
{
  "id": 15672,
  "ref": 4870,
  "subject": "Minha tarefa",
  "description": "Descrição da tarefa",
  "status": 667,
  "status_extra_info": {
    "name": "Em Análise",
    "color": "#999999"
  },
  "project": 133,
  "user_story": 14846,
  "assigned_to": null,
  "created_date": "2025-12-15T07:40:00Z",
  ...
}
```

## Erros Comuns

### 400 Bad Request

- Campos obrigatórios faltando (project, subject)
- IDs inválidos (projeto, status, user_story não existem)
- Permissões insuficientes para vincular à user_story

### 401 Unauthorized

- Token inválido ou expirado
- Faça login novamente

### 403 Forbidden

- Usuário sem permissão no projeto
- Usuário sem permissão para criar tarefas na user_story

## Dicas

1. **Obter Status Disponíveis:**

```bash
GET https://pista.decea.mil.br/api/v1/task-statuses?project=133
```

2. **Obter User Stories:**

```bash
GET https://pista.decea.mil.br/api/v1/userstories?project=133
```

3. **Obter Membros do Projeto:**

```bash
GET https://pista.decea.mil.br/api/v1/memberships?project=133
```

4. **Criar Tarefa SEM User Story:**

   - Simplesmente omita o campo `user_story` do payload
   - A tarefa ficará no backlog do projeto

5. **Criar Tarefa COM User Story:**
   - Certifique-se que a user_story pertence ao mesmo projeto
   - Você precisa ter permissão para editar a user_story
