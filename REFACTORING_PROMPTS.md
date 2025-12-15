# 🎯 Guia de Refatoração Incremental - Prompt por Tela

> **Como usar:** Copie e cole cada prompt abaixo, **um de cada vez**, na ordem indicada.  
> Após cada prompt, teste se a tela continua funcionando antes de prosseguir para o próximo.

---

## 📋 Ordem de Execução

1. ✅ **Core Utils** (Fundação - sem quebrar nada)
2. ✅ **Core API** (Refatorar API client)
3. ✅ **Core State** (Gerenciamento de estado)
4. ✅ **Component UI** (Toast, loading, etc)
5. ✅ **Component Auth** (Login/Logout)
6. ✅ **Component Projects** (Tela de projetos)
7. ✅ **Component User Stories** (Tela de US/Epics)
8. ✅ **Component Tasks** (Tela de tarefas)
9. ✅ **Component Bulk** (Bulk actions)
10. ✅ **Main Entry Point** (Integrar tudo)

---

## 🚀 PROMPT 1: Core Utils

```
Refatore o app.js criando o módulo static/js/core/utils.js:

1. Crie static/js/core/utils.js com as funções:
   - escapeHtml (linha ~1274-1280 do app.js)
   - normalizeString (linha ~755-762)
   - isCurrentUser (linha ~759-780)
   - getSortedMembers (linha ~782-804)

2. Exporte todas as funções como named exports

3. NO app.js:
   - Adicione no topo: import { escapeHtml, normalizeString, isCurrentUser, getSortedMembers } from './js/core/utils.js';
   - REMOVA as definições dessas funções
   - Mantenha todas as chamadas usando as funções normalmente

4. NO index.html:
   - Adicione type="module" no script do app.js

5. Teste se a aplicação ainda funciona (abra no navegador)

6. Commit: "refactor(core): extract utilities to utils.js module"
```

**Teste:** Login deve funcionar, projetos devem carregar normalmente

---

## 🚀 PROMPT 2: Core API

```
Refatore o api.js para módulo ES6:

1. Crie static/js/core/api.js movendo TODO conteúdo de static/api.js

2. NO static/js/core/api.js:
   - Transforme em módulo ES6
   - Import config: import config from '../config.js';
   - Mantenha a classe TaigaAPI
   - NO FINAL do arquivo, adicione:
     export default TaigaAPI;
     export const taigaAPI = new TaigaAPI();

3. NO app.js:
   - Adicione no topo: import { taigaAPI } from './js/core/api.js';
   - REMOVA a linha antiga que referenciava api.js

4. NO index.html:
   - REMOVA: <script src="api.js"></script>
   - Mantenha apenas: <script type="module" src="app.js"></script>

5. Teste se API funciona (login, carregar projetos)

6. Commit: "refactor(core): convert api.js to ES6 module"
```

**Teste:** Login e carregamento de projetos deve funcionar

---

## 🚀 PROMPT 3: Core State

```
Crie o módulo de gerenciamento de estado:

1. Crie static/js/core/state.js com:
   - Copie o objeto appState do app.js (linhas 1-15)
   - Renomeie para 'state' e exporte
   - Crie funções: setState(), getState(), resetState()
   - Export todas

2. NO app.js:
   - Import: import { state, setState, getState, resetState } from './js/core/state.js';
   - SUBSTITUA todas referências de 'appState' por 'state' (use find/replace)
   - REMOVA a definição const appState = {...}

3. Teste toda a navegação (projetos → US → tasks)

4. Commit: "refactor(core): extract state management to module"
```

**Teste:** Navegação entre telas deve funcionar, estado deve persistir

---

## 🚀 PROMPT 4: Component UI

```
Extraia componentes de UI:

1. Crie static/js/components/ui.js com:
   - showScreen() (linhas ~16-23)
   - showLoading() (linhas ~25-32)
   - showToast() (linhas ~34-45)
   - showError() (linhas ~47-51)
   - hideError() (linhas ~53-56)
   - Exporte todas

2. NO app.js:
   - Import: import { showScreen, showLoading, showToast, showError, hideError } from './js/components/ui.js';
   - REMOVA as definições dessas funções
   - Mantenha todas as chamadas

3. Teste toast, loading e mudança de telas

4. Commit: "refactor(components): extract UI helpers to module"
```

**Teste:** Toasts, loading spinner e navegação devem funcionar

---

## 🚀 PROMPT 5: Component Auth

```
Crie o módulo de autenticação:

1. Crie static/js/components/auth.js com:
   - Função initAuth() que adiciona event listeners
   - Função handleLogin() (código do event listener de loginForm)
   - Função handleLogout() (código do event listener de logoutBtn)
   - Export initAuth

2. NO app.js:
   - Import: import { initAuth } from './js/components/auth.js';
   - No DOMContentLoaded, adicione: initAuth();
   - REMOVA os event listeners de login/logout do app.js

3. Teste login e logout

4. Commit: "refactor(components): extract auth to module"
```

**Teste:** Login e logout devem funcionar perfeitamente

---

## 🚀 PROMPT 6: Component Projects

```
Extraia o módulo de projetos:

1. Crie static/js/components/projects.js com:
   - loadProjects()
   - renderProjects()
   - selectProject()
   - initProjectsScreen() (event listeners)
   - Export todas

2. Crie static/js/services/favorites.js com:
   - favoritesManager object
   - toggleFavoriteUserStory()
   - Export

3. NO app.js:
   - Import projects e favorites
   - REMOVA as funções movidas
   - No DOMContentLoaded, adicione: initProjectsScreen();

4. Teste carregar e selecionar projetos

5. Commit: "refactor(components): extract projects module"
```

**Teste:** Tela de projetos, favoritos, busca devem funcionar

---

## 🚀 PROMPT 7: Component User Stories

```
Extraia o módulo de user stories:

1. Crie static/js/components/userStories.js com:
   - loadUserStories()
   - renderUserStories()
   - loadEpics()
   - renderEpics()
   - searchUserStoriesAPI()
   - selectUserStory()
   - selectEpic()
   - initUserStoriesScreen()
   - Export todas

2. NO app.js:
   - Import userStories
   - REMOVA as funções movidas
   - No DOMContentLoaded, adicione: initUserStoriesScreen();

3. Teste navegar para US, buscar, selecionar

4. Commit: "refactor(components): extract user stories module"
```

**Teste:** Tela de US/Epics, busca e seleção devem funcionar

---

## 🚀 PROMPT 8: Component Tasks

```
Extraia o módulo de tarefas:

1. Crie static/js/components/taskCard.js com:
   - createTaskCard()
   - createTaskForm()
   - attachTaskEventListeners()
   - Export

2. Crie static/js/components/tasks.js com:
   - loadTasks()
   - renderTasks()
   - loadTaskStatuses()
   - loadProjectMembers()
   - showTaskDetails()
   - initTasksScreen()
   - Export

3. Crie static/js/services/taskService.js com:
   - saveTask()
   - deleteTask()
   - bulkCreateTasks()
   - Export

4. NO app.js:
   - Import tasks e taskService
   - REMOVA as funções movidas
   - No DOMContentLoaded, adicione: initTasksScreen();

5. Teste criar, editar, deletar tasks

6. Commit: "refactor(components): extract tasks module"
```

**Teste:** CRUD de tasks deve funcionar completamente

---

## 🚀 PROMPT 9: Component Bulk

```
Extraia as ações em massa:

1. Crie static/js/components/bulk.js com:
   - renderBulkAssignSelect()
   - renderBulkStatusSelect()
   - handleBulkAssign() (código do event listener)
   - handleBulkStatus() (código do event listener)
   - initBulkActions()
   - Export initBulkActions

2. NO app.js:
   - Import: import { initBulkActions } from './js/components/bulk.js';
   - REMOVA as funções movidas
   - No DOMContentLoaded, adicione: initBulkActions();

3. Teste bulk assign e bulk status

4. Commit: "refactor(components): extract bulk actions module"
```

**Teste:** Bulk assign e bulk status devem funcionar

---

## 🚀 PROMPT 10: Component Theme

```
Extraia o theme toggle:

1. Crie static/js/components/theme.js com:
   - initTheme()
   - updateThemeIcon()
   - Export initTheme

2. NO app.js:
   - Import: import { initTheme } from './js/components/theme.js';
   - REMOVA o código de theme
   - No DOMContentLoaded, adicione: initTheme();

3. Teste trocar tema

4. Commit: "refactor(components): extract theme module"
```

**Teste:** Theme toggle deve funcionar

---

## 🎉 PROMPT 11: Finalizar

```
Reorganize e limpe o código:

1. NO app.js, reorganize os imports no topo por categoria:
   // Core
   import { state } from './js/core/state.js';
   import { taigaAPI } from './js/core/api.js';

   // Components
   import { initAuth } from './js/components/auth.js';
   import { initProjectsScreen } from './js/components/projects.js';
   // ... etc

2. Verifique se app.js ficou com ~100 linhas (só imports + DOMContentLoaded)

3. DELETE static/api.js e static/config.js (já movidos)

4. Teste TUDO:
   - [ ] Login/Logout
   - [ ] Carregar projetos
   - [ ] Favoritar projetos
   - [ ] Buscar US
   - [ ] Criar task
   - [ ] Editar task
   - [ ] Bulk assign
   - [ ] Bulk status
   - [ ] Theme toggle

5. Se tudo funcionar, commit: "refactor: complete modular frontend restructure"

6. Merge na main e celebre! 🎉
```

---

## 📝 Notas Importantes

- ✅ **Teste após cada prompt**
- ✅ **Commi após cada mudança bem-sucedida**
- ✅ **Se algo quebrar, reverta o commit**
- ✅ **Não pule etapas**
- ✅ **Mantenha o servidor rodando para testar**

---

## 🆘 Se Algo Quebrar

```bash
# Ver último commit
git log -1

# Reverter último commit mantendo mudanças
git reset --soft HEAD~1

# Reverter completamente
git reset --hard HEAD~1

# Ver status
git status
```

---

**Tempo estimado:** 30-45 min por prompt = ~6-8 horas total  
**Segurança:** Alta (cada passo é testável e revertível)  
**Resultado:** Código modular, organizado e funcional
