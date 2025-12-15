# Documentação: Listar Membros/Usuários de um Projeto no Taiga

## Endpoint

```
GET https://pista.decea.mil.br/api/v1/memberships?project={project_id}
```

## Headers Obrigatórios

```
Authorization: Bearer {seu_token}
Content-Type: application/json
```

## Parâmetros de Query

### Obrigatórios:

- **project** (int): ID do projeto

### Opcionais:

- **role** (int): Filtrar por ID do papel/role

## Exemplo de Requisição

```bash
curl -X GET "https://pista.decea.mil.br/api/v1/memberships?project=133" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json"
```

## Exemplo Python

```python
import requests

url = "https://pista.decea.mil.br/api/v1/memberships"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
params = {
    "project": 133
}

response = requests.get(url, headers=headers, params=params)

if response.status_code == 200:
    memberships = response.json()
    for member in memberships:
        print(f"- {member['full_name']} ({member['user_email']}) - ID: {member['user']}")
```

## Resposta de Sucesso (200 OK)

```json
[
  {
    "id": 1234,
    "user": 174,
    "project": 133,
    "project_name": "DASA",
    "project_slug": "asa",
    "role": 5,
    "role_name": "Developer",
    "full_name": "Marco Olivette",
    "user_email": "marco@example.com",
    "color": "#FC8EAC",
    "photo": "https://pista.decea.mil.br/media/user/...",
    "gravatar_id": "...",
    "is_active": true,
    "is_admin": false,
    "is_owner": false,
    "invited_by": null,
    "invitation_extra_text": null,
    "created_at": "2024-01-15T10:00:00Z",
    "token": null
  },
  ...
]
```

## Campos Importantes para "Atribuído À"

Para popular um dropdown de "Atribuído À", você precisa:

1. **user** (int): ID do usuário - use este valor ao criar/editar tarefas
2. **full_name** (string): Nome completo para exibir
3. **user_email** (string): Email do usuário
4. **photo** (string): URL da foto do perfil
5. **is_active** (boolean): Se o usuário está ativo
6. **role_name** (string): Nome do papel no projeto

## Exemplo de Uso no Frontend

```javascript
// Buscar membros do projeto
async function loadProjectMembers(projectId) {
  const response = await fetch(
    `https://pista.decea.mil.br/api/v1/memberships?project=${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const memberships = await response.json();

  // Filtrar apenas membros ativos
  const activeMembers = memberships.filter((m) => m.is_active);

  // Popular select/dropdown
  const select = document.getElementById("assignedTo");
  select.innerHTML = '<option value="">Não atribuído</option>';

  activeMembers.forEach((member) => {
    const option = document.createElement("option");
    option.value = member.user; // ID do usuário
    option.textContent = `${member.full_name} (${member.role_name})`;
    select.appendChild(option);
  });
}

// Criar tarefa com usuário atribuído
async function createTask(projectId, subject, assignedToUserId) {
  const response = await fetch("https://pista.decea.mil.br/api/v1/tasks", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project: projectId,
      subject: subject,
      assigned_to: assignedToUserId, // ID do usuário
    }),
  });

  return response.json();
}
```

## Dicas

1. **Cache os membros**: Não é necessário buscar a cada tarefa, busque uma vez ao selecionar o projeto
2. **Filtre ativos**: Use apenas membros com `is_active: true`
3. **Mostre o papel**: Exiba o `role_name` junto com o nome para contexto
4. **Foto de perfil**: Use o campo `photo` para mostrar avatares
5. **Ordenação**: Ordene alfabeticamente por `full_name` para melhor UX

## Erros Comuns

### 401 Unauthorized

- Token inválido ou expirado

### 403 Forbidden

- Usuário sem permissão para ver membros do projeto

### 404 Not Found

- Projeto não existe ou você não tem acesso
