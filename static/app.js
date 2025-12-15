// Application State
const appState = {
    currentScreen: 'login',
    currentProject: null,
    currentStory: null,
    currentEpic: null,
    projects: [],
    userStories: [],
    epics: [],
    tasks: [],
    taskStatuses: [],
    projectMembers: [],
    newTasks: []
};

// UI Helper Functions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    appState.currentScreen = screenId;
}

function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 250ms ease reverse';
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function hideError(elementId) {
    const errorEl = document.getElementById(elementId);
    errorEl.style.display = 'none';
}

// Login Handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('loginError');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const taigaUrl = document.getElementById('taigaUrl').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner');

    btnText.style.display = 'none';
    spinner.style.display = 'block';
    submitBtn.disabled = true;

    try {
        await taigaAPI.login(username, password, taigaUrl);

        // Update user info in header
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        userName.textContent = taigaAPI.currentUser.full_name || taigaAPI.currentUser.username;
        userAvatar.textContent = (taigaAPI.currentUser.full_name || taigaAPI.currentUser.username).charAt(0).toUpperCase();
        userInfo.style.display = 'flex';

        showToast('Login realizado com sucesso!', 'success');

        // Load projects
        await loadProjects();
        showScreen('projectsScreen');
    } catch (error) {
        showError('loginError', error.message);
    } finally {
        btnText.style.display = 'block';
        spinner.style.display = 'none';
        submitBtn.disabled = false;
    }
});

// Logout Handler
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await taigaAPI.logout();
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('loginForm').reset();
    showScreen('loginScreen');
    showToast('Logout realizado com sucesso', 'info');
});

// Load Projects
async function loadProjects() {
    showLoading();
    try {
        appState.projects = await taigaAPI.getProjects();
        renderProjects(appState.projects);
    } catch (error) {
        showToast('Erro ao carregar projetos: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Favorites Management
const favoritesManager = {
    key: 'taiga_favorite_projects',

    getFavorites() {
        const saved = localStorage.getItem(this.key);
        return saved ? JSON.parse(saved) : [];
    },

    isFavorite(projectId) {
        return this.getFavorites().includes(projectId);
    },

    toggle(projectId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(projectId);

        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(projectId);
        }

        localStorage.setItem(this.key, JSON.stringify(favorites));
        return index === -1; // Return true if now favorite
    }
};

function renderProjects(projects) {
    const grid = document.getElementById('projectsGrid');

    if (projects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="9" x2="15" y2="9"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <h3>Nenhum projeto encontrado</h3>
                <p>Você não tem acesso a nenhum projeto no momento.</p>
            </div>
        `;
        return;
    }

    // Sort projects: favorites first
    const sortedProjects = [...projects].sort((a, b) => {
        const aFav = favoritesManager.isFavorite(a.id);
        const bFav = favoritesManager.isFavorite(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0;
    });

    grid.innerHTML = sortedProjects.map(project => {
        const isFavorite = favoritesManager.isFavorite(project.id);
        return `
        <div class="project-card ${isFavorite ? 'favorite' : ''}" data-project-id="${project.id}">
            <div class="project-header">
                <h3>${escapeHtml(project.name)}</h3>
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                        data-project-id="${project.id}"
                        title="${isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                    <svg viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </button>
            </div>
            <p>${escapeHtml(project.description || 'Sem descrição')}</p>
            <div class="project-meta">
                <div class="project-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    ${project.total_story_points || 0} pontos
                </div>
                <div class="project-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    ${project.members?.length || 0} membros
                </div>
            </div>
        </div>
    `;
    }).join('');

    // Add click handlers for cards
    grid.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking favorite button
            if (e.target.closest('.favorite-btn')) return;

            const projectId = card.dataset.projectId;
            selectProject(projectId);
        });
    });

    // Add click handlers for favorite buttons
    grid.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            const projectId = parseInt(btn.dataset.projectId);
            const isFavorite = favoritesManager.toggle(projectId);

            // Update button state
            btn.classList.toggle('active', isFavorite);
            btn.title = isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos';

            // Update SVG fill
            const svg = btn.querySelector('svg');
            svg.setAttribute('fill', isFavorite ? 'currentColor' : 'none');

            // Update card class
            const card = btn.closest('.project-card');
            card.classList.toggle('favorite', isFavorite);

            // Re-render to re-sort
            renderProjects(appState.projects);

            showToast(
                isFavorite ? 'Projeto adicionado aos favoritos' : 'Projeto removido dos favoritos',
                'success'
            );
        });
    });
}

// Project Search
document.getElementById('projectSearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = appState.projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm) ||
        (project.description && project.description.toLowerCase().includes(searchTerm))
    );
    renderProjects(filtered);
});

// Select Project
async function selectProject(projectId) {
    showLoading();
    try {
        appState.currentProject = await taigaAPI.getProject(projectId);

        // Update header
        document.getElementById('projectTitle').textContent = appState.currentProject.name;
        document.getElementById('projectDescription').textContent = 'Selecione uma User Story ou Épico';

        // Load user stories and epics
        await Promise.all([
            loadUserStories(projectId),
            loadEpics(projectId)
        ]);

        showScreen('userStoriesScreen');
    } catch (error) {
        showToast('Erro ao carregar projeto: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Back to Projects
document.getElementById('backToProjects').addEventListener('click', () => {
    showScreen('projectsScreen');
    appState.currentProject = null;
});

// Load User Stories
async function loadUserStories(projectId) {
    try {
        appState.userStories = await taigaAPI.getUserStories(projectId);
        renderUserStories(appState.userStories);
    } catch (error) {
        showToast('Erro ao carregar user stories: ' + error.message, 'error');
    }
}

function renderUserStories(stories) {
    const list = document.getElementById('storiesList');

    if (stories.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                </svg>
                <h3>Nenhuma User Story encontrada</h3>
                <p>Este projeto não possui user stories.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = stories.map(story => `
        <div class="story-card" data-story-id="${story.id}">
            <div class="story-ref">#${story.ref}</div>
            <div class="story-content">
                <h4>${escapeHtml(story.subject)}</h4>
                ${story.description ? `<p>${escapeHtml(story.description.substring(0, 100))}${story.description.length > 100 ? '...' : ''}</p>` : ''}
            </div>
            <div class="story-status" style="background: ${story.status_extra_info?.color || '#666'}">${escapeHtml(story.status_extra_info?.name || 'N/A')}</div>
        </div>
    `).join('');

    // Add click handlers
    list.querySelectorAll('.story-card').forEach(card => {
        card.addEventListener('click', () => {
            const storyId = card.dataset.storyId;
            selectUserStory(storyId);
        });
    });
}

// Load Epics
async function loadEpics(projectId) {
    try {
        appState.epics = await taigaAPI.getEpics(projectId);
        renderEpics(appState.epics);
    } catch (error) {
        showToast('Erro ao carregar épicos: ' + error.message, 'error');
    }
}

function renderEpics(epics) {
    const list = document.getElementById('epicsList');

    if (epics.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                </svg>
                <h3>Nenhum Épico encontrado</h3>
                <p>Este projeto não possui épicos.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = epics.map(epic => `
        <div class="story-card" data-epic-id="${epic.id}">
            <div class="story-ref">#${epic.ref}</div>
            <div class="story-content">
                <h4>${escapeHtml(epic.subject)}</h4>
                ${epic.description ? `<p>${escapeHtml(epic.description.substring(0, 100))}${epic.description.length > 100 ? '...' : ''}</p>` : ''}
            </div>
            <div class="story-status" style="background: ${epic.status_extra_info?.color || '#666'}">${escapeHtml(epic.status_extra_info?.name || 'N/A')}</div>
        </div>
    `).join('');

    // Add click handlers
    list.querySelectorAll('.story-card').forEach(card => {
        card.addEventListener('click', () => {
            const epicId = card.dataset.epicId;
            selectEpic(epicId);
        });
    });
}

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        // Update active tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        if (tabName === 'userstories') {
            document.getElementById('userStoriesTab').classList.add('active');
        } else {
            document.getElementById('epicsTab').classList.add('active');
        }
    });
});

// US/Epic Search with debounce
let searchTimeout;
document.getElementById('usSearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();

    // Clear previous timeout
    clearTimeout(searchTimeout);

    // If empty, show all loaded stories
    if (!searchTerm) {
        renderUserStories(appState.userStories);
        renderEpics(appState.epics);
        return;
    }

    // Debounce search (wait 300ms after user stops typing)
    searchTimeout = setTimeout(async () => {
        await searchUserStoriesAPI(searchTerm);
    }, 300);
});

// Search user stories using paginated API
async function searchUserStoriesAPI(query) {
    if (!appState.currentProject) return;

    try {
        showLoading();

        // Use the Taiga API directly with pagination parameters
        const url = `${config.getApiUrl()}/userstories?project=${appState.currentProject.id}&q=${encodeURIComponent(query)}&milestone=null&page_size=100`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${taigaAPI.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar user stories');
        }

        const stories = await response.json();

        // Get pagination info from headers
        const totalCount = parseInt(response.headers.get('x-pagination-count') || stories.length);

        // Update UI with search results
        renderUserStories(stories);

        // Show pagination info
        if (totalCount > 0) {
            showToast(`${totalCount} user story(ies) encontrada(s)`, 'info');
        } else {
            showToast('Nenhuma user story encontrada', 'warning');
        }
    } catch (error) {
        console.error('Search error:', error);
        showToast('Erro ao buscar: ' + error.message, 'error');

        // Fallback to local search
        const filteredStories = appState.userStories.filter(story =>
            story.subject.toLowerCase().includes(query.toLowerCase()) ||
            (story.description && story.description.toLowerCase().includes(query.toLowerCase()))
        );
        renderUserStories(filteredStories);
    } finally {
        showLoading(false);
    }
}

// Select User Story
async function selectUserStory(storyId) {
    showLoading();
    try {
        appState.currentStory = await taigaAPI.getUserStory(storyId);
        appState.currentEpic = null;

        // Update header
        document.getElementById('storyTitle').textContent = `US #${appState.currentStory.ref}: ${appState.currentStory.subject}`;
        document.getElementById('storyDescription').textContent = 'Gerencie tarefas desta user story';

        // Load tasks and metadata
        await Promise.all([
            loadTasks(appState.currentProject.id, storyId),
            loadTaskStatuses(appState.currentProject.id),
            loadProjectMembers(appState.currentProject.id)
        ]);

        showScreen('tasksScreen');
    } catch (error) {
        showToast('Erro ao carregar user story: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Select Epic
async function selectEpic(epicId) {
    showLoading();
    try {
        appState.currentEpic = await taigaAPI.getEpic(epicId);
        appState.currentStory = null;

        // Update header
        document.getElementById('storyTitle').textContent = `Épico #${appState.currentEpic.ref}: ${appState.currentEpic.subject}`;
        document.getElementById('storyDescription').textContent = 'Gerencie tarefas deste épico';

        // Load tasks and metadata
        await Promise.all([
            loadTasks(appState.currentProject.id),
            loadTaskStatuses(appState.currentProject.id),
            loadProjectMembers(appState.currentProject.id)
        ]);

        showScreen('tasksScreen');
    } catch (error) {
        showToast('Erro ao carregar épico: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Back to Stories
document.getElementById('backToStories').addEventListener('click', () => {
    showScreen('userStoriesScreen');
    appState.currentStory = null;
    appState.currentEpic = null;
    appState.newTasks = [];
});

// Load Tasks
async function loadTasks(projectId, userStoryId = null) {
    try {
        appState.tasks = await taigaAPI.getTasks(projectId, userStoryId);
        renderTasks(appState.tasks);
    } catch (error) {
        showToast('Erro ao carregar tarefas: ' + error.message, 'error');
    }
}

async function loadTaskStatuses(projectId) {
    try {
        appState.taskStatuses = await taigaAPI.getTaskStatuses(projectId);
    } catch (error) {
        console.error('Error loading task statuses:', error);
    }
}

async function loadProjectMembers(projectId) {
    try {
        appState.projectMembers = await taigaAPI.getProjectMembers(projectId);
    } catch (error) {
        console.error('Error loading project members:', error);
    }
}

function renderTasks(tasks) {
    const container = document.getElementById('tasksContainer');

    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                <h3>Nenhuma tarefa encontrada</h3>
                <p>Adicione novas tarefas usando o botão acima.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tasks.map(task => createTaskCard(task, false)).join('');

    // Add event listeners
    attachTaskEventListeners(container);
}

function createTaskCard(task, isNew = false) {
    return `
        <div class="task-card ${isNew ? 'new' : ''}" data-task-id="${task.id || 'new-' + Date.now()}">
            <div class="task-header">
                ${task.ref ? `<div class="task-ref">#${task.ref}</div>` : '<div class="task-ref">Nova</div>'}
                <div class="task-actions">
                    <button class="edit-task">Editar</button>
                    <button class="delete delete-task">Excluir</button>
                </div>
            </div>
            <div class="task-view">
                <h4>${escapeHtml(task.subject || 'Nova Tarefa')}</h4>
                ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    ${task.status_extra_info ? `<div class="task-meta-item" style="background: ${task.status_extra_info.color}">${escapeHtml(task.status_extra_info.name)}</div>` : ''}
                    ${task.assigned_to_extra_info ? `<div class="task-meta-item">👤 ${escapeHtml(task.assigned_to_extra_info.full_name_display)}</div>` : ''}
                </div>
            </div>
            <div class="task-form" style="display: none;">
                ${createTaskForm(task)}
            </div>
        </div>
    `;
}

function createTaskForm(task = {}) {
    return `
        <input type="text" class="task-subject" placeholder="Título da tarefa" value="${escapeHtml(task.subject || '')}" required>
        <textarea class="task-description" placeholder="Descrição (opcional)">${escapeHtml(task.description || '')}</textarea>
        <select class="task-status">
            <option value="">Selecione um status</option>
            ${appState.taskStatuses.map(status => `
                <option value="${status.id}" ${task.status === status.id ? 'selected' : ''}>${escapeHtml(status.name)}</option>
            `).join('')}
        </select>
        <select class="task-assigned">
            <option value="">Não atribuído</option>
            ${appState.projectMembers.map(member => `
                <option value="${member.user}" ${task.assigned_to === member.user ? 'selected' : ''}>${escapeHtml(member.full_name_display)}</option>
            `).join('')}
        </select>
        <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-primary save-task">Salvar</button>
            <button class="btn cancel-task">Cancelar</button>
        </div>
    `;
}

function attachTaskEventListeners(container) {
    // Edit buttons
    container.querySelectorAll('.edit-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.task-card');
            card.classList.add('editing');
            card.querySelector('.task-view').style.display = 'none';
            card.querySelector('.task-form').style.display = 'flex';
        });
    });

    // Cancel buttons
    container.querySelectorAll('.cancel-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.task-card');
            card.classList.remove('editing');
            card.querySelector('.task-view').style.display = 'block';
            card.querySelector('.task-form').style.display = 'none';
        });
    });

    // Save buttons
    container.querySelectorAll('.save-task').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await saveTask(e.target.closest('.task-card'));
        });
    });

    // Delete buttons
    container.querySelectorAll('.delete-task').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
                await deleteTask(e.target.closest('.task-card'));
            }
        });
    });
}

// Add Task
document.getElementById('addTaskBtn').addEventListener('click', () => {
    const newTaskCard = document.createElement('div');
    newTaskCard.className = 'task-card new editing';
    newTaskCard.dataset.taskId = 'new-' + Date.now();
    newTaskCard.innerHTML = `
        <div class="task-header">
            <div class="task-ref">Nova</div>
            <div class="task-actions">
                <button class="delete delete-task">Excluir</button>
            </div>
        </div>
        <div class="task-form" style="display: flex;">
            ${createTaskForm()}
        </div>
    `;

    document.getElementById('newTasksContainer').appendChild(newTaskCard);
    attachTaskEventListeners(newTaskCard);

    // Show save all button
    document.getElementById('saveAllTasksBtn').style.display = 'inline-flex';
});

// Save Task
async function saveTask(card) {
    const taskId = card.dataset.taskId;
    const isNew = taskId.startsWith('new-');

    const subject = card.querySelector('.task-subject').value.trim();
    const description = card.querySelector('.task-description').value.trim();
    const status = card.querySelector('.task-status').value;
    const assignedTo = card.querySelector('.task-assigned').value;

    if (!subject) {
        showToast('O título da tarefa é obrigatório', 'warning');
        return;
    }

    const taskData = {
        subject,
        description,
        project: appState.currentProject.id,
        status: status || appState.taskStatuses[0]?.id,
    };

    if (appState.currentStory) {
        taskData.user_story = appState.currentStory.id;
    }

    if (assignedTo) {
        taskData.assigned_to = parseInt(assignedTo);
    }

    showLoading();
    try {
        if (isNew) {
            const newTask = await taigaAPI.createTask(taskData);
            showToast('Tarefa criada com sucesso!', 'success');

            // Remove from new tasks and add to existing
            card.remove();
            await loadTasks(appState.currentProject.id, appState.currentStory?.id);
        } else {
            await taigaAPI.updateTask(parseInt(taskId), taskData);
            showToast('Tarefa atualizada com sucesso!', 'success');
            await loadTasks(appState.currentProject.id, appState.currentStory?.id);
        }

        // Hide save all button if no more new tasks
        if (document.getElementById('newTasksContainer').children.length === 0) {
            document.getElementById('saveAllTasksBtn').style.display = 'none';
        }
    } catch (error) {
        showToast('Erro ao salvar tarefa: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Delete Task
async function deleteTask(card) {
    const taskId = card.dataset.taskId;
    const isNew = taskId.startsWith('new-');

    if (isNew) {
        card.remove();
        if (document.getElementById('newTasksContainer').children.length === 0) {
            document.getElementById('saveAllTasksBtn').style.display = 'none';
        }
        return;
    }

    showLoading();
    try {
        await taigaAPI.deleteTask(parseInt(taskId));
        showToast('Tarefa excluída com sucesso!', 'success');
        await loadTasks(appState.currentProject.id, appState.currentStory?.id);
    } catch (error) {
        showToast('Erro ao excluir tarefa: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Save All Tasks
document.getElementById('saveAllTasksBtn').addEventListener('click', async () => {
    const newTaskCards = document.getElementById('newTasksContainer').querySelectorAll('.task-card');

    if (newTaskCards.length === 0) {
        return;
    }

    const tasksData = [];
    let hasErrors = false;

    newTaskCards.forEach(card => {
        const subject = card.querySelector('.task-subject').value.trim();
        const description = card.querySelector('.task-description').value.trim();
        const status = card.querySelector('.task-status').value;
        const assignedTo = card.querySelector('.task-assigned').value;

        if (!subject) {
            hasErrors = true;
            card.querySelector('.task-subject').style.borderColor = 'var(--danger)';
            return;
        }

        const taskData = {
            subject,
            description,
            project: appState.currentProject.id,
            status: status || appState.taskStatuses[0]?.id,
        };

        if (appState.currentStory) {
            taskData.user_story = appState.currentStory.id;
        }

        if (assignedTo) {
            taskData.assigned_to = parseInt(assignedTo);
        }

        tasksData.push(taskData);
    });

    if (hasErrors) {
        showToast('Preencha todos os títulos obrigatórios', 'warning');
        return;
    }

    showLoading();
    try {
        await taigaAPI.bulkCreateTasks(tasksData);
        showToast(`${tasksData.length} tarefa(s) criada(s) com sucesso!`, 'success');

        // Clear new tasks
        document.getElementById('newTasksContainer').innerHTML = '';
        document.getElementById('saveAllTasksBtn').style.display = 'none';

        // Reload tasks
        await loadTasks(appState.currentProject.id, appState.currentStory?.id);
    } catch (error) {
        showToast('Erro ao criar tarefas: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
});

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('taiga_current_user');
    if (taigaAPI.authToken && savedUser) {
        taigaAPI.currentUser = JSON.parse(savedUser);

        // Update user info in header
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        userName.textContent = taigaAPI.currentUser.full_name || taigaAPI.currentUser.username;
        userAvatar.textContent = (taigaAPI.currentUser.full_name || taigaAPI.currentUser.username).charAt(0).toUpperCase();
        userInfo.style.display = 'flex';

        // Load projects
        loadProjects();
        showScreen('projectsScreen');
    } else {
        // Set default Taiga URL
        document.getElementById('taigaUrl').value = config.getApiUrl();
    }
});
