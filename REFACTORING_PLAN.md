# 📋 Plano de Refatoração - Frontend Modular

> ⚠️ **IMPORTANTE - COMO EXECUTAR ESTA REFATORAÇÃO:**  
> Esta é uma refatoração **completa e estrutural**. Não deve ser feita de forma incremental durante desenvolvimento ativo.  
> **Recomendação:** Reserve 1 dia completo, trabalhe em branch separada, teste extensivamente antes de mergear.  
> **Alternativa:** Manter código atual funcionando e fazer refatoração em sprint dedicado de melhoria.

## 📊 Situação Atual

**Problemas:**

- `static/app.js`: **1,596 linhas** (muito grande, difícil manutenção)
- `static/api.js`: **324 linhas** (razoável, mas pode melhorar)
- Código monolítico em um único arquivo
- Difícil de testar componentes isoladamente
- Difícil de manter e adicionar novas features

## 🎯 Objetivo da Refatoração

Dividir o código em **módulos por responsabilidade/tela**, seguindo o padrão:

```
static/
├── index.html
├── styles.css
├── bulk-modal-styles.css
├── js/
│   ├── main.js                    # Entry point (substitui app.js)
│   ├── config.js                  # Configurações (já existe)
│   ├── core/
│   │   ├── api.js                # Cliente HTTP (reformulado)
│   │   ├── state.js              # Gerenciamento de estado
│   │   └── utils.js              # Funções utilitárias
│   ├── components/
│   │   ├── auth.js               # Login/Logout
│   │   ├── projects.js           # Tela de projetos
│   │   ├── userStories.js        # Tela de user stories
│   │   ├── tasks.js              # Tela de tarefas
│   │   ├── taskCard.js           # Card de tarefa (reutilizável)
│   │   ├── bulk.js               # Ações em massa
│   │   └── ui.js                 # Componentes UI (toast, loading, etc)
│   └── services/
│       ├── favorites.js          # Gerenciamento de favoritos
│       ├── taskService.js        # Lógica de negócio de tasks
│       └── projectService.js     # Lógica de negócio de projetos
```

---

## 📝 Passo a Passo de Refatoração

### **Fase 1: Preparação (30 min)**

#### 1.1 Criar estrutura de diretórios

```bash
mkdir -p static/js/core
mkdir -p static/js/components
mkdir -p static/js/services
```

#### 1.2 Mover config.js

```bash
mv static/config.js static/js/config.js
```

#### 1.3 Atualizar index.html

- Trocar imports de `app.js`, `api.js`, `config.js` para os novos módulos
- Usar `type="module"` nos scripts

---

### **Fase 2: Criar Core Modules (1h)**

#### 2.1 `static/js/core/state.js`

**Linhas do app.js:** 1-15 (appState)

```javascript
// Gerenciamento centralizado de estado
export const state = {
  currentScreen: "login",
  currentProject: null,
  currentStory: null,
  currentEpic: null,
  projects: [],
  userStories: [],
  epics: [],
  tasks: [],
  taskStatuses: [],
  projectMembers: [],
  newTasks: [],
};

export function setState(updates) {
  Object.assign(state, updates);
}

export function getState() {
  return state;
}
```

#### 2.2 `static/js/core/api.js`

**De:** `static/api.js` (324 linhas)

```javascript
// Refatorar TaigaAPI para usar módulos ES6
export class TaigaAPI {
  // ... todo o código de api.js
}

export const taigaAPI = new TaigaAPI();
```

#### 2.3 `static/js/core/utils.js`

**Linhas do app.js:**

- `escapeHtml` (linha ~1274-1280)
- `normalizeString` (linha ~755-762)
- Outras funções auxiliares

```javascript
export function escapeHtml(text) {
  /* ... */
}
export function normalizeString(str) {
  /* ... */
}
export function getSortedMembers() {
  /* ... */
}
export function isCurrentUser(member) {
  /* ... */
}
```

---

### **Fase 3: Criar Components (2h)**

#### 3.1 `static/js/components/ui.js`

**Linhas do app.js:** 16-56

```javascript
export function showScreen(screenId) {
  /* ... */
}
export function showLoading(show = true) {
  /* ... */
}
export function showToast(message, type = "info") {
  /* ... */
}
export function showError(elementId, message) {
  /* ... */
}
export function hideError(elementId) {
  /* ... */
}
```

#### 3.2 `static/js/components/auth.js`

**Linhas do app.js:** 57-109 (Login/Logout)

```javascript
import { taigaAPI } from "../core/api.js";
import { setState } from "../core/state.js";
import { showScreen, showError } from "./ui.js";

export function initAuth() {
  // Event listeners de login
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
}

async function handleLogin(e) {
  /* ... */
}
async function handleLogout() {
  /* ... */
}
```

#### 3.3 `static/js/components/projects.js`

**Linhas do app.js:** 110-300 (Projects screen)

```javascript
import { state, setState } from "../core/state.js";
import { taigaAPI } from "../core/api.js";

export async function loadProjects() {
  /* ... */
}
export function renderProjects(projects) {
  /* ... */
}
export function selectProject(projectId) {
  /* ... */
}
export function initProjectsScreen() {
  // Event listeners
  document
    .getElementById("projectSearch")
    .addEventListener("input", handleSearch);
  document
    .getElementById("backToProjects")
    .addEventListener("click", handleBack);
}
```

#### 3.4 `static/js/components/userStories.js`

**Linhas do app.js:** 301-563 (User Stories + Epics)

```javascript
export async function loadUserStories(projectId) {
  /* ... */
}
export function renderUserStories(stories) {
  /* ... */
}
export async function searchUserStoriesAPI(query) {
  /* ... */
}
export function selectUserStory(storyId) {
  /* ... */
}
export function initUserStoriesScreen() {
  /* ... */
}
```

#### 3.5 `static/js/components/taskCard.js`

**Linhas do app.js:** 713-853 (Task card + form)

```javascript
import { escapeHtml, getSortedMembers } from "../core/utils.js";

export function createTaskCard(task, isNew = false) {
  /* ... */
}
export function createTaskForm(task = {}) {
  /* ... */
}
export function attachTaskEventListeners(container) {
  /* ... */
}
```

#### 3.6 `static/js/components/tasks.js`

**Linhas do app.js:** 631-1272 (Tasks screen)

```javascript
import { createTaskCard, attachTaskEventListeners } from "./taskCard.js";
import { saveTask, deleteTask } from "../services/taskService.js";

export async function loadTasks(projectId, userStoryId) {
  /* ... */
}
export function renderTasks(tasks) {
  /* ... */
}
export async function showTaskDetails(taskId) {
  /* ... */
}
export function initTasksScreen() {
  // Event listeners
  document
    .getElementById("addTaskBtn")
    .addEventListener("click", handleAddTask);
  document
    .getElementById("reloadTasksBtn")
    .addEventListener("click", handleReload);
  // ...
}
```

#### 3.7 `static/js/components/bulk.js`

**Linhas do app.js:** 1283-1507 (Bulk actions)

```javascript
export function renderBulkAssignSelect() {
  /* ... */
}
export function renderBulkStatusSelect() {
  /* ... */
}
export function initBulkActions() {
  document
    .getElementById("applyBulkAssignBtn")
    ?.addEventListener("click", handleBulkAssign);
  document
    .getElementById("applyBulkStatusBtn")
    ?.addEventListener("click", handleBulkStatus);
}
```

---

### **Fase 4: Criar Services (1h)**

#### 4.1 `static/js/services/taskService.js`

**Linhas do app.js:** Lógica de negócio de tasks

```javascript
import { taigaAPI } from "../core/api.js";
import { state } from "../core/state.js";
import { showToast, showLoading } from "../components/ui.js";

export async function saveTask(card) {
  // Toda lógica de save (linhas 1147-1208)
}

export async function deleteTask(card) {
  // Toda lógica de delete (linhas 1210-1230)
}

export async function bulkCreateTasks(tasksData) {
  /* ... */
}
```

#### 4.2 `static/js/services/favorites.js`

**Linhas do app.js:** 122-150, 411-427

```javascript
const FAVORITES_KEY = "taiga_favorite_projects";
const FAVORITES_US_KEY = "taiga_favorite_user_stories";

export const favoritesManager = {
  getFavorites() {
    /* ... */
  },
  isFavorite(projectId) {
    /* ... */
  },
  toggle(projectId) {
    /* ... */
  },
};

export function toggleFavoriteUserStory(storyId) {
  /* ... */
}
```

#### 4.3 `static/js/services/projectService.js`

```javascript
export async function loadProjectMembers(projectId) {
  /* ... */
}
export async function loadTaskStatuses(projectId) {
  /* ... */
}
```

---

### **Fase 5: Main Entry Point (30 min)**

#### 5.1 `static/js/main.js`

**Substitui:** `static/app.js`

```javascript
import { initAuth } from "./components/auth.js";
import { initProjectsScreen } from "./components/projects.js";
import { initUserStoriesScreen } from "./components/userStories.js";
import { initTasksScreen } from "./components/tasks.js";
import { initBulkActions } from "./components/bulk.js";
import { initTheme } from "./components/theme.js";
import { taigaAPI } from "./core/api.js";
import { loadProjects } from "./components/projects.js";

// Initialize all components
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initAuth();
  initProjectsScreen();
  initUserStoriesScreen();
  initTasksScreen();
  initBulkActions();

  // Check if user is already logged in
  const savedUser = localStorage.getItem("taiga_current_user");
  if (taigaAPI.authToken && savedUser) {
    // ... código de auto-login (linhas 1542-1564)
    loadProjects();
    showScreen("projectsScreen");
  }
});
```

---

### **Fase 6: Theme Management (15 min)**

#### 6.1 `static/js/components/theme.js`

**Linhas do app.js:** 1509-1540

```javascript
export function initTheme() {
  /* ... */
}
function updateThemeIcon(theme) {
  /* ... */
}
```

---

### **Fase 7: Atualizar HTML (30 min)**

#### 7.1 `static/index.html`

**De:**

```html
<script src="config.js"></script>
<script src="api.js"></script>
<script src="app.js"></script>
```

**Para:**

```html
<script type="module" src="js/main.js"></script>
```

---

## 🧪 Fase 8: Testes e Validação (1h)

### 8.1 Checklist de Testes

- [ ] Login funciona
- [ ] Listagem de projetos funciona
- [ ] Favoritar projetos funciona
- [ ] Seleção de projeto funciona
- [ ] Listagem de user stories funciona
- [ ] Busca de user stories funciona
- [ ] Seleção de user story funciona
- [ ] Listagem de tasks funciona
- [ ] Criar task funciona
- [ ] Editar task funciona (individual)
- [ ] Deletar task funciona
- [ ] Bulk assign funciona
- [ ] Bulk status funciona
- [ ] Theme toggle funciona
- [ ] Logout funciona

### 8.2 Verificar no Console

- Sem erros de import
- Sem variáveis undefined
- APIs funcionando

---

## 📦 Fase 9: Limpeza (15 min)

### 9.1 Remover arquivos antigos

```bash
# Criar backup primeiro!
mv static/app.js static/app.js.backup
mv static/api.js static/api.js.backup

# Depois de validar tudo:
rm static/app.js.backup
rm static/api.js.backup
```

---

## ⏱️ Tempo Estimado Total

| Fase                 | Tempo   |
| -------------------- | ------- |
| Fase 1: Preparação   | 30 min  |
| Fase 2: Core Modules | 1h      |
| Fase 3: Components   | 2h      |
| Fase 4: Services     | 1h      |
| Fase 5: Main Entry   | 30 min  |
| Fase 6: Theme        | 15 min  |
| Fase 7: HTML Update  | 30 min  |
| Fase 8: Testes       | 1h      |
| Fase 9: Limpeza      | 15 min  |
| **TOTAL**            | **~7h** |

---

## 🎁 Benefícios da Refatoração

1. ✅ **Manutenibilidade**: Código organizado e fácil de encontrar
2. ✅ **Testabilidade**: Módulos podem ser testados isoladamente
3. ✅ **Reusabilidade**: Components podem ser reutilizados
4. ✅ **Performance**: Módulos carregados sob demanda (code splitting futuro)
5. ✅ **Colaboração**: Múltiplos devs podem trabalhar sem conflitos
6. ✅ **Escalabilidade**: Fácil adicionar novas features/telas

---

## 📌 Regras de Ouro

1. **Um arquivo = Uma responsabilidade**
2. **Máx 300 linhas por arquivo** (ideal: <200)
3. **Export apenas o necessário**
4. **Imports no topo do arquivo**
5. **Comentários descrevem o "porquê", não o "como"**
6. **Testar após cada fase**

---

## 🚀 Ordem de Execução Recomendada

1. Fazer em **branch separada**: `git checkout -b refactor/modular-frontend`
2. Commitar após **cada fase** concluída
3. Testar **frequentemente**
4. Documentar **mudanças significativas**
5. Fazer **code review** antes de mergear

---

## 📝 Nota Final

Esta refatoração é uma **melhoria arquitetural importante**.

O sistema continuará funcionando da mesma forma para o usuário, mas o código ficará muito mais profissional e fácil de manter.

**Prioridade:** Média-Alta (fazer quando tiver ~1 dia disponível)

---

**Criado em:** 2025-12-15  
**Autor:** Gemini (via análise de app.js e api.js)  
**Versão:** 1.0
