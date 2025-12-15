# Favorites API

API para gerenciar favoritos de projetos e user stories.

## Endpoints

### Projetos Favoritos

#### Listar projetos favoritos

```
GET /api/favorites/projects
```

**Response:**

```json
[
  {
    "id": 1,
    "project_id": 133,
    "project_name": "ASA",
    "project_slug": "asa"
  }
]
```

#### Adicionar projeto aos favoritos

```
POST /api/favorites/projects
```

**Body:**

```json
{
  "project_id": 133,
  "project_name": "ASA",
  "project_slug": "asa"
}
```

**Response:**

```json
{
  "id": 1,
  "project_id": 133,
  "project_name": "ASA",
  "project_slug": "asa"
}
```

#### Remover projeto dos favoritos

```
DELETE /api/favorites/projects/{project_id}
```

**Response:**

```json
{
  "success": true,
  "message": "Project removed from favorites"
}
```

### User Stories Favoritas

#### Listar user stories favoritas

```
GET /api/favorites/userstories?project_id=133
```

**Query Parameters:**

- `project_id` (optional): Filtrar por projeto

**Response:**

```json
[
  {
    "id": 1,
    "user_story_id": 14846,
    "user_story_ref": 4861,
    "user_story_subject": "Feature X",
    "project_id": 133
  }
]
```

#### Adicionar user story aos favoritos

```
POST /api/favorites/userstories
```

**Body:**

```json
{
  "user_story_id": 14846,
  "user_story_ref": 4861,
  "user_story_subject": "Feature X",
  "project_id": 133
}
```

**Response:**

```json
{
  "id": 1,
  "user_story_id": 14846,
  "user_story_ref": 4861,
  "user_story_subject": "Feature X",
  "project_id": 133
}
```

#### Remover user story dos favoritos

```
DELETE /api/favorites/userstories/{user_story_id}
```

**Response:**

```json
{
  "success": true,
  "message": "User story removed from favorites"
}
```

## Banco de Dados

O sistema usa SQLite para armazenar os favoritos localmente em `favorites.db`.

### Estrutura das tabelas

**favorite_projects:**

- id (INTEGER, PRIMARY KEY)
- project_id (INTEGER, UNIQUE, NOT NULL)
- project_name (STRING, NOT NULL)
- project_slug (STRING, NOT NULL)
- created_at (DATETIME)

**favorite_user_stories:**

- id (INTEGER, PRIMARY KEY)
- user_story_id (INTEGER, UNIQUE, NOT NULL)
- user_story_ref (INTEGER, NOT NULL)
- user_story_subject (STRING, NOT NULL)
- project_id (INTEGER, NOT NULL)
- created_at (DATETIME)

## Exemplo de Uso

### JavaScript (Frontend)

```javascript
// Adicionar projeto aos favoritos
async function addFavoriteProject(project) {
  const response = await fetch("/api/favorites/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_id: project.id,
      project_name: project.name,
      project_slug: project.slug,
    }),
  });
  return await response.json();
}

// Listar projetos favoritos
async function getFavoriteProjects() {
  const response = await fetch("/api/favorites/projects");
  return await response.json();
}

// Remover projeto dos favoritos
async function removeFavoriteProject(projectId) {
  const response = await fetch(`/api/favorites/projects/${projectId}`, {
    method: "DELETE",
  });
  return await response.json();
}

// Adicionar user story aos favoritos
async function addFavoriteUserStory(story, projectId) {
  const response = await fetch("/api/favorites/userstories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_story_id: story.id,
      user_story_ref: story.ref,
      user_story_subject: story.subject,
      project_id: projectId,
    }),
  });
  return await response.json();
}

// Listar user stories favoritas
async function getFavoriteUserStories(projectId = null) {
  const url = projectId
    ? `/api/favorites/userstories?project_id=${projectId}`
    : "/api/favorites/userstories";
  const response = await fetch(url);
  return await response.json();
}

// Remover user story dos favoritos
async function removeFavoriteUserStory(userStoryId) {
  const response = await fetch(`/api/favorites/userstories/${userStoryId}`, {
    method: "DELETE",
  });
  return await response.json();
}
```
