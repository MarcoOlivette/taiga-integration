# Documentação: Atualizar Tarefas no Taiga

## Endpoint

```
PATCH https://pista.decea.mil.br/api/v1/tasks/{task_id}
```

## Headers Obrigatórios

```
Authorization: Bearer {seu_token}
Content-Type: application/json
```

## ⚠️ Campo Obrigatório: `version`

O Taiga usa **OCC (Optimistic Concurrency Control)** para evitar conflitos de edição simultânea.

### Como funciona:

1. Ao buscar uma tarefa, ela vem com um campo `version` (ex: `"version": 1`)
2. Ao atualizar, você **DEVE** enviar o `version` atual
3. Se outro usuário editou antes, o `version` será diferente e a API retornará erro
4. Se a atualização for bem-sucedida, o `version` é incrementado automaticamente

## Campos do Payload

### Obrigatórios:

- **version** (int): Versão atual da tarefa (para controle de concorrência)

### Opcionais (envie apenas o que quer alterar):

- **subject** (string): Título da tarefa
- **description** (string): Descrição
- **status** (int): ID do status
- **assigned_to** (int): ID do usuário responsável
- **user_story** (int): ID da User Story
- **milestone** (int): ID do milestone
- **tags** (array): Array de tags
- **is_blocked** (boolean): Se está bloqueada
- **blocked_note** (string): Motivo do bloqueio
- **is_closed** (boolean): Se está fechada

## Exemplo Mínimo (PATCH)

```bash
curl -X PATCH https://pista.decea.mil.br/api/v1/tasks/15664 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Novo título",
    "version": 1
  }'
```

## Exemplo Completo

```bash
curl -X PATCH https://pista.decea.mil.br/api/v1/tasks/15664 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Painel de monitoramento de equipes",
    "description": "Descrição atualizada",
    "status": 667,
    "assigned_to": 174,
    "version": 1
  }'
```

## Exemplo Python

```python
import requests

# 1. Buscar a tarefa para pegar a versão atual
response = requests.get(
    f"https://pista.decea.mil.br/api/v1/tasks/{task_id}",
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
)
task = response.json()
current_version = task['version']

# 2. Atualizar com a versão correta
response = requests.patch(
    f"https://pista.decea.mil.br/api/v1/tasks/{task_id}",
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    },
    json={
        "subject": "Novo título",
        "description": "Nova descrição",
        "version": current_version  # OBRIGATÓRIO!
    }
)

if response.status_code == 200:
    updated_task = response.json()
    print(f"Tarefa atualizada! Nova versão: {updated_task['version']}")
else:
    print(f"Erro: {response.status_code} - {response.text}")
```

## Exemplo JavaScript

```javascript
// 1. Buscar a tarefa atual
const taskResponse = await fetch(
  `https://pista.decea.mil.br/api/v1/tasks/${taskId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);
const task = await taskResponse.json();

// 2. Atualizar com a versão correta
const updateResponse = await fetch(
  `https://pista.decea.mil.br/api/v1/tasks/${taskId}`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: "Novo título",
      description: "Nova descrição",
      version: task.version, // OBRIGATÓRIO!
    }),
  }
);

const updatedTask = await updateResponse.json();
console.log("Nova versão:", updatedTask.version);
```

## Resposta de Sucesso (200 OK)

```json
{
  "id": 15664,
  "ref": 4862,
  "version": 2,  // Incrementado automaticamente
  "subject": "Painel de monitoramento de equipes",
  "description": "Descrição atualizada",
  "status": 667,
  "assigned_to": 174,
  ...
}
```

## Erros Comuns

### 400 Bad Request - "O parâmetro da versão não é válido"

**Causa**: Campo `version` ausente ou incorreto

**Solução**:

1. Busque a tarefa antes de atualizar
2. Use o `version` retornado na busca
3. Se outro usuário editou antes, busque novamente

```javascript
// ❌ ERRADO - Sem version
{
  "subject": "Novo título"
}

// ✅ CORRETO - Com version
{
  "subject": "Novo título",
  "version": 1
}
```

### 400 Bad Request - Version conflict

**Causa**: Outro usuário editou a tarefa antes de você

**Solução**:

1. Busque a tarefa novamente
2. Pegue o novo `version`
3. Reaplique suas mudanças

## PATCH vs PUT

### PATCH (Recomendado)

- Envia apenas os campos que quer alterar
- Mais eficiente
- Menos chance de sobrescrever dados

```json
{
  "subject": "Novo título",
  "version": 1
}
```

### PUT

- Deve enviar o objeto completo
- Sobrescreve todos os campos
- Mais verboso

```json
{
  "subject": "Novo título",
  "description": "...",
  "project": 133,
  "status": 667,
  "assigned_to": 174,
  "version": 1,
  ...
}
```

## Dicas

1. **Sempre busque antes de atualizar**: Para pegar o `version` atual
2. **Use PATCH**: Mais simples e seguro
3. **Trate conflitos**: Se receber erro de version, busque novamente
4. **Cache o version**: Se estiver editando em tempo real, mantenha o version atualizado
5. **Validação**: Sempre verifique se o `version` está presente antes de enviar

## Fluxo Recomendado

```javascript
async function updateTask(taskId, changes) {
  // 1. Buscar tarefa atual
  const task = await getTask(taskId);

  // 2. Atualizar com version
  const response = await fetch(`/api/v1/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...changes,
      version: task.version, // Sempre incluir!
    }),
  });

  // 3. Tratar conflitos
  if (response.status === 400) {
    const error = await response.json();
    if (error.message.includes("version")) {
      // Buscar novamente e tentar de novo
      return updateTask(taskId, changes);
    }
  }

  return response.json();
}
```
