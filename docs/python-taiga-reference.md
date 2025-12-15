# Referência: python-taiga

Documentação de referência rápida da biblioteca `python-taiga` para uso no projeto.

## 📚 Documentação Oficial

- **Documentação**: https://python-taiga.readthedocs.io/
- **GitHub**: https://github.com/nephila/python-taiga
- **PyPI**: https://pypi.org/project/python-taiga/

## 🚀 Instalação

```bash
pip install python-taiga
```

## 🔐 Autenticação

### Autenticação Básica (Username/Password)

```python
from taiga import TaigaAPI

api = TaigaAPI(host='https://pista.decea.mil.br')
api.auth(username='seu_usuario', password='sua_senha')
```

### Autenticação com Token

```python
api = TaigaAPI(token='seu_token_aqui')
```

### Autenticação LDAP

```python
api = TaigaAPI(host='https://pista.decea.mil.br', auth_type='ldap')
api.auth(username='seu_usuario', password='sua_senha')
```

### Ignorar Verificação SSL (não recomendado)

```python
api = TaigaAPI(host='https://pista.decea.mil.br', tls_verify=False)
```

## 👤 Usuário Atual

```python
# Obter informações do usuário logado
me = api.me()
print(me.username)
print(me.full_name)
print(me.email)
```

## 📁 Projetos

### Listar Projetos

```python
# Listar todos os projetos
projects = api.projects.list()

for project in projects:
    print(f"{project.id}: {project.name}")
```

### Obter Projeto por ID

```python
project = api.projects.get(123)
```

### Obter Projeto por Slug

```python
project = api.projects.get_by_slug('asa')
print(project.name)
print(project.description)
```

### Criar Projeto

```python
new_project = api.projects.create('Nome do Projeto', 'Descrição do projeto')
```

### Duplicar Projeto

```python
old_project = api.projects.get_by_slug('projeto-antigo')
new_project = old_project.duplicate('Novo Projeto', 'Descrição')
```

### Propriedades do Projeto

```python
project = api.projects.get(123)

# Informações básicas
print(project.id)
print(project.name)
print(project.slug)
print(project.description)
print(project.total_story_points)

# Membros
for member in project.members:
    print(f"{member.full_name_display} - {member.role_name}")

# Status de tarefas
for status in project.task_statuses:
    print(f"{status.name} (color: {status.color})")

# Status de user stories
for status in project.us_statuses:
    print(f"{status.name}")

# Prioridades
for priority in project.priorities:
    print(f"{priority.name}")

# Severidades
for severity in project.severities:
    print(f"{severity.name}")
```

## 📖 User Stories

### Listar User Stories

```python
# Todas as user stories
stories = api.user_stories.list()

# User stories de um projeto específico
stories = api.user_stories.list(project=123)

# Com filtros
stories = api.user_stories.list(project=123, status=456)
```

### Obter User Story por ID

```python
story = api.user_stories.get(789)
```

### Obter User Story por Ref (dentro de um projeto)

```python
project = api.projects.get_by_slug('asa')
story = project.get_userstory_by_ref(1111)
```

### Criar User Story

```python
project = api.projects.get(123)

# User story simples
story = project.add_user_story(
    'Título da User Story',
    description='Descrição detalhada'
)

# Com milestone
milestone = project.add_milestone('Sprint 1', '2025-01-01', '2025-01-15')
story = project.add_user_story(
    'Título da User Story',
    description='Descrição',
    milestone=milestone.id
)
```

### Propriedades da User Story

```python
story = api.user_stories.get(789)

print(story.id)
print(story.ref)
print(story.subject)
print(story.description)
print(story.status)
print(story.status_extra_info)  # Dict com name, color, etc
print(story.assigned_to)
print(story.assigned_to_extra_info)
```

## 🎯 Épicos

### Listar Épicos

```python
# Todos os épicos
epics = api.epics.list()

# Épicos de um projeto
epics = api.epics.list(project=123)
```

### Obter Épico

```python
epic = api.epics.get(456)
```

### Criar Épico

```python
project = api.projects.get(123)
epic = project.add_epic(
    'Título do Épico',
    description='Descrição do épico'
)
```

## ✅ Tarefas (Tasks)

### Listar Tarefas

```python
# Todas as tarefas
tasks = api.tasks.list()

# Tarefas de um projeto
tasks = api.tasks.list(project=123)

# Tarefas de uma user story
tasks = api.tasks.list(project=123, user_story=789)

# Com filtros
tasks = api.tasks.list(project=123, status=456, assigned_to=999)
```

### Obter Tarefa por ID

```python
task = api.tasks.get(999)
```

### Obter Tarefa por Ref (dentro de um projeto)

```python
project = api.projects.get_by_slug('asa')
task = project.get_task_by_ref(1112)
```

### Criar Tarefa

```python
project = api.projects.get(123)

# Obter o primeiro status disponível
status = project.task_statuses[0].id

# Criar tarefa simples
task = project.add_task(
    'Título da Tarefa',
    status
)

# Criar tarefa completa
task = project.add_task(
    subject='Título da Tarefa',
    status=status,
    description='Descrição detalhada',
    assigned_to=999,  # ID do usuário
    user_story=789    # ID da user story
)
```

### Atualizar Tarefa

```python
task = api.tasks.get(999)

# Modificar atributos
task.subject = 'Novo título'
task.description = 'Nova descrição'
task.status = 456
task.assigned_to = 888

# Salvar alterações
task.update()
```

### Deletar Tarefa

```python
task = api.tasks.get(999)
task.delete()
```

### Adicionar Tarefa a uma User Story

```python
story = api.user_stories.get(789)
project = api.projects.get(story.project)

task = story.add_task(
    'Título da Tarefa',
    project.task_statuses[0].id
)
```

### Propriedades da Tarefa

```python
task = api.tasks.get(999)

print(task.id)
print(task.ref)
print(task.subject)
print(task.description)
print(task.status)
print(task.status_extra_info)  # Dict com name, color
print(task.assigned_to)
print(task.assigned_to_extra_info)  # Dict com full_name_display
print(task.user_story)
print(task.project)
```

## 🐛 Issues

### Listar Issues

```python
issues = api.issues.list(project=123)
```

### Obter Issue

```python
issue = api.issues.get(456)
```

### Criar Issue

```python
project = api.projects.get(123)

issue = project.add_issue(
    'Título do Issue',
    priority=project.priorities.get(name='High').id,
    status=project.issue_statuses.get(name='New').id,
    type=project.issue_types.get(name='Bug').id,
    severity=project.severities.get(name='Minor').id,
    description='Descrição do bug'
)
```

## 🏊 Swimlanes

```python
project = api.projects.get(123)
swimlane = project.add_swimlane('Nome da Swimlane')
```

## 🎨 Atributos Customizados

### Criar Atributo Customizado

```python
project = api.projects.get(123)

# Para issues
project.add_issue_attribute(
    'Device',
    description='(iPad, iPod, iPhone, Desktop, etc.)'
)

# Para user stories
project.add_us_attribute(
    'Complexity',
    description='Low, Medium, High'
)

# Para tarefas
project.add_task_attribute(
    'Environment',
    description='Dev, Staging, Production'
)
```

### Definir Valor de Atributo

```python
issue = api.issues.get(456)
issue.set_attribute('1', 'Desktop')  # attribute_id, value
```

## 📎 Anexos

### Adicionar Anexo

```python
# A uma user story
story = api.user_stories.get(789)
attachment = story.attach('path/to/file.pdf', description='Documento importante')

# A uma tarefa
task = api.tasks.get(999)
attachment = task.attach('path/to/image.png')

# A um issue
issue = api.issues.get(456)
attachment = issue.attach('path/to/screenshot.jpg')
```

## 🔍 Busca

```python
# Buscar em todo o Taiga
results = api.search('termo de busca')

# Buscar em um projeto específico
results = api.search('termo de busca', project=123)

# Resultados
for item in results:
    print(f"{item.type}: {item.subject}")
```

## 📊 Paginação

Por padrão, `.list()` retorna todos os objetos, buscando automaticamente páginas adicionais.

Para controlar a paginação manualmente:

```python
# Primeira página (30 itens por padrão)
tasks = api.tasks.list(project=123, paginate=True)

# Próxima página
next_tasks = tasks.next()

# Verificar se há próxima página
if tasks.has_next():
    next_tasks = tasks.next()
```

## 📜 Histórico

```python
# Obter histórico de uma user story
story = api.user_stories.get(789)
history = story.history()

for entry in history:
    print(f"{entry.user['name']} - {entry.created_at}")
    print(entry.comment)

    # Ver mudanças
    for key, values in entry.values_diff.items():
        print(f"{key}: {values[0]} -> {values[1]}")
```

## 🎯 Exemplos Práticos

### Criar Múltiplas Tarefas em uma User Story

```python
project = api.projects.get_by_slug('asa')
story = project.get_userstory_by_ref(1234)
status = project.task_statuses[0].id

tasks_to_create = [
    'Implementar frontend',
    'Implementar backend',
    'Escrever testes',
    'Documentar API',
    'Code review'
]

for task_name in tasks_to_create:
    task = story.add_task(task_name, status)
    print(f"✅ Criada: {task.subject}")
```

### Atribuir Todas as Tarefas de uma US para um Usuário

```python
story = api.user_stories.get(789)
tasks = api.tasks.list(user_story=story.id)
user_id = 999

for task in tasks:
    task.assigned_to = user_id
    task.update()
    print(f"✅ {task.subject} atribuída")
```

### Mover Todas as Tarefas para um Novo Status

```python
project = api.projects.get(123)
tasks = api.tasks.list(project=project.id, status=old_status_id)
new_status = project.task_statuses.get(name='In Progress').id

for task in tasks:
    task.status = new_status
    task.update()
```

### Relatório de Tarefas por Usuário

```python
project = api.projects.get(123)
tasks = api.tasks.list(project=project.id)

tasks_by_user = {}
for task in tasks:
    if task.assigned_to_extra_info:
        user = task.assigned_to_extra_info['full_name_display']
        if user not in tasks_by_user:
            tasks_by_user[user] = []
        tasks_by_user[user].append(task.subject)

for user, user_tasks in tasks_by_user.items():
    print(f"\n{user} ({len(user_tasks)} tarefas):")
    for task_name in user_tasks:
        print(f"  - {task_name}")
```

## ⚠️ Notas Importantes

1. **Autenticação**: Sempre autentique antes de fazer qualquer operação
2. **Rate Limiting**: O Taiga pode ter limites de requisições
3. **Objetos vs Dicts**: A biblioteca retorna objetos Python, não dicionários
4. **Atualização**: Use `.update()` após modificar atributos de um objeto
5. **IDs vs Slugs**: Prefira usar slugs para projetos quando possível
6. **Paginação**: Por padrão, `.list()` busca todos os resultados automaticamente

## 🔗 Links Úteis

- **API REST do Taiga**: http://taigaio.github.io/taiga-doc/dist/api.html
- **Documentação python-taiga**: https://python-taiga.readthedocs.io/
- **Exemplos**: https://python-taiga.readthedocs.io/usage.html

## 🆘 Troubleshooting

### Erro de Autenticação

```python
# Verificar se está autenticado
if api.token:
    print("Autenticado!")
else:
    print("Não autenticado")
```

### SSL Certificate Error

```python
# Desabilitar verificação SSL (não recomendado em produção)
api = TaigaAPI(host='https://pista.decea.mil.br', tls_verify=False)
```

### Objeto não tem atributo esperado

```python
# Alguns atributos podem não estar presentes
# Use getattr com valor padrão
description = getattr(task, 'description', '')
```

---

**Última atualização**: 2025-12-15
