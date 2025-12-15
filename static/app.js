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

        // Helper to format members
        if (appState.currentProject.members && appState.currentProject.members.length > 0) {
            console.log('Caching members from project data', appState.currentProject.members.length);
            localStorage.setItem('projectMembers', JSON.stringify(appState.currentProject.members));
            appState.projectMembers = appState.currentProject.members;
        }

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
// Load User Stories
async function loadUserStories(projectId) {
    try {
        const favoriteId = localStorage.getItem('favoriteUserStory');

        // Fetch list and favorite (if exists) in parallel
        const promises = [taigaAPI.getUserStories(projectId)];

        if (favoriteId) {
            // Fetch specific favorite story, catch error if not found/access denied
            promises.push(taigaAPI.getUserStory(favoriteId).catch(() => null));
        }

        const [stories, favoriteStory] = await Promise.all(promises);

        let allStories = stories;

        // If favorite story exists and belongs to current project
        if (favoriteStory && String(favoriteStory.project) === String(projectId)) {
            // Remove favorite from main list if present to avoid duplication
            allStories = allStories.filter(s => String(s.id) !== String(favoriteStory.id));
            // Add to beginning of list
            allStories.unshift(favoriteStory);
        }

        appState.userStories = allStories;
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

    // Get favorite US
    const favoriteUS = localStorage.getItem('favoriteUserStory');

    // Sort: favorite first, then by ref
    const sortedStories = [...stories].sort((a, b) => {
        const aIsFavorite = String(a.id) === favoriteUS;
        const bIsFavorite = String(b.id) === favoriteUS;

        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;

        return b.ref - a.ref; // Descending by ref
    });

    list.innerHTML = sortedStories.map(story => {
        const isFavorite = String(story.id) === favoriteUS;
        return `
            <div class="story-card ${isFavorite ? 'favorite' : ''}" data-story-id="${story.id}">
                <div class="story-ref">#${story.ref}</div>
                <div class="story-content">
                    <h4>${isFavorite ? '⭐ ' : ''}${escapeHtml(story.subject)}</h4>
                    ${story.description ? `<p>${escapeHtml(story.description.substring(0, 100))}${story.description.length > 100 ? '...' : ''}</p>` : ''}
                </div>
                <div class="story-actions">
                    <button 
                        class="favorite-btn ${isFavorite ? 'active' : ''}" 
                        data-story-id="${story.id}"
                        title="${isFavorite ? 'Remover dos favoritos' : 'Marcar como favorita'}"
                    >
                        ${isFavorite ? '⭐' : '☆'}
                    </button>
                </div>
                <div class="story-status" style="background: ${story.status_extra_info?.color || '#666'}">${escapeHtml(story.status_extra_info?.name || 'N/A')}</div>
            </div>
        `;
    }).join('');

    // Add click handlers for cards
    list.querySelectorAll('.story-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't select if clicking favorite button
            if (e.target.closest('.favorite-btn')) return;

            const storyId = card.dataset.storyId;
            selectUserStory(storyId);
        });
    });

    // Add favorite button handlers
    list.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavoriteUserStory(btn.dataset.storyId);
        });
    });
}

// Toggle favorite user story
function toggleFavoriteUserStory(storyId) {
    const currentFavorite = localStorage.getItem('favoriteUserStory');

    if (currentFavorite === String(storyId)) {
        // Remove favorite
        localStorage.removeItem('favoriteUserStory');
        showToast('User Story removida dos favoritos', 'info');
    } else {
        // Set as favorite (only one allowed)
        localStorage.setItem('favoriteUserStory', String(storyId));
        showToast('⭐ User Story marcada como favorita!', 'success');
    }

    // Re-render to update UI
    renderUserStories(appState.userStories);
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
        if (typeof renderBulkAssignSelect === 'function') {
            renderBulkAssignSelect();
        }
        if (typeof renderBulkStatusSelect === 'function') {
            renderBulkStatusSelect();
        }
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
    // If already loaded in state, skip
    if (appState.projectMembers && appState.projectMembers.length > 0) {
        return;
    }

    try {
        // Try localStorage 'projectMembers' (the unified key)
        const cached = localStorage.getItem('projectMembers');
        if (cached) {
            try {
                const members = JSON.parse(cached);
                // Simple validation: check if not empty. 
                // We assume selectProject handles the correct project context and overwrites this key.
                if (members && members.length > 0) {
                    // Optional: verify project ID match if available in member object
                    if (members[0].project && parseInt(members[0].project) !== parseInt(projectId)) {
                        console.warn('Cached members do not match current project ID');
                    } else {
                        console.log('Using cached members from localStorage');
                        appState.projectMembers = members;
                        return;
                    }
                }
            } catch (e) {
                console.error('Error parsing cached members:', e);
            }
        }

        console.log('Fetching members from API');
        const slug = appState.currentProject?.slug;
        appState.projectMembers = await taigaAPI.getProjectMembers(projectId, slug);

        // Save to cache
        localStorage.setItem('projectMembers', JSON.stringify(appState.projectMembers));

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
        <div class="task-card ${isNew ? 'new' : ''}" data-task-id="${task.id || 'new-' + Date.now()}" data-task-version="${task.version || 1}">
            <div class="task-header">
                ${task.ref ? `<div class="task-ref">#${task.ref}</div>` : '<div class="task-ref">Nova</div>'}
                <div class="task-actions">
                    ${!isNew ? `
                    <button class="view-task-details" title="Ver Detalhes">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        Detalhes
                    </button>` : ''}
                    <button class="edit-task" title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Editar
                    </button>
                    <button class="delete delete-task" title="Excluir">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        Excluir
                    </button>
                </div>
            </div>
            <div class="task-view">
                <h4>${escapeHtml(task.subject || 'Nova Tarefa')}</h4>
                ${task.description ? `<p class="task-description-preview">${escapeHtml(task.description.substring(0, 100))}${task.description.length > 100 ? '...' : ''}</p>` : ''}
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

// Sort members: current user first, then alphabetically
function normalizeString(str) {
    if (!str) return '';
    return str.toString()
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]/g, ""); // Remove non-alphanumeric (spaces, dots, etc)
}

// Helper to identify current user in member list
function isCurrentUser(member) {
    if (!appState.currentUser) return false;

    // 1. Exact ID Match (most reliable)
    const memberId = member.user || member.id;
    if (memberId && appState.currentUser.id && memberId === appState.currentUser.id) return true;

    // 2. Fuzzy Name/Username Match
    // Collect all possible identifiers for the member
    const memberIdentifiers = [
        member.full_name,
        member.full_name_display,
        member.username,
        member.slug
    ].map(normalizeString).filter(s => s && s.length > 2); // Filter short noise

    // Collect all possible identifiers for the current user
    const userIdentifiers = [
        appState.currentUser.full_name,
        appState.currentUser.username,
        appState.currentUser.slug
    ].map(normalizeString).filter(s => s && s.length > 2);

    // Check if any identifier matches any other identifier
    // This handles "Marco Olivette" matches "marcoolivette"
    return memberIdentifiers.some(m => userIdentifiers.includes(m));
}

function getSortedMembers() {
    if (!appState.projectMembers) return [];

    const members = [...appState.projectMembers];

    return members.sort((a, b) => {
        // Current user always first
        const aIsUser = isCurrentUser(a);
        const bIsUser = isCurrentUser(b);

        if (aIsUser && !bIsUser) return -1;
        if (!aIsUser && bIsUser) return 1;

        // Then sort alphabetically by full_name
        const nameA = (a.full_name || a.full_name_display || '').toLowerCase();
        const nameB = (b.full_name || b.full_name_display || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
}

function createTaskForm(task = {}) {
    const isNew = !task.id;

    return `
        <input type="text" class="task-subject" placeholder="Título da tarefa" value="${escapeHtml(task.subject || '')}" required>
        <textarea class="task-description" placeholder="Descrição (opcional)">${escapeHtml(task.description || '')}</textarea>
        <select class="task-status">
            <option value="">Selecione um status</option>
            ${appState.taskStatuses.map(status => `
                <option value="${status.id}" ${task.status === status.id ? 'selected' : ''}>${escapeHtml(status.name)}</option>
            `).join('')}
        </select>
        <div class="member-select-container">
            <input 
                type="text" 
                class="member-search" 
                placeholder="🔍 Buscar membro..."
                autocomplete="off"
            />
            <select class="task-assigned" size="8">
                <option value="">Não atribuído</option>
                ${getSortedMembers().map(member => {
        const memberId = member.user || member.id;
        const isUser = isCurrentUser(member);
        const displayName = member.full_name || member.full_name_display || 'Sem nome';
        const star = isUser ? '⭐ ' : '';
        // Pre-select if assigned match OR (is new task AND is current user)
        const isSelected = task.assigned_to === memberId || (isNew && isUser && !task.assigned_to);

        return `
                        <option 
                            value="${memberId}" 
                            ${isSelected ? 'selected' : ''}
                            data-search="${displayName.toLowerCase()} ${member.role_name?.toLowerCase() || ''}"
                            style="${isUser ? 'font-weight: bold; background: #f0f7ff;' : ''}"
                        >
                            ${star}${escapeHtml(displayName)}${member.role_name ? ` (${member.role_name})` : ''}
                        </option>
                    `;
    }).join('')}
            </select>
        </div>
        <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-primary save-task">Salvar</button>
            <button class="btn cancel-task">Cancelar</button>
        </div>
    `;
}

function attachTaskEventListeners(container) {
    // View Details buttons
    container.querySelectorAll('.view-task-details').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const card = e.target.closest('.task-card');
            const taskId = parseInt(card.dataset.taskId);
            await showTaskDetails(taskId);
        });
    });

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

    // Member search
    container.querySelectorAll('.member-search').forEach(input => {
        input.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const select = e.target.nextElementSibling;
            const options = select.querySelectorAll('option');

            options.forEach(option => {
                if (option.value === '') {
                    option.style.display = ''; // Always show "Não atribuído"
                    return;
                }

                const searchData = option.getAttribute('data-search') || '';
                if (searchData.includes(searchTerm)) {
                    option.style.display = '';
                } else {
                    option.style.display = 'none';
                }
            });
        });
    });
}

// Show Task Details Modal
async function showTaskDetails(taskId) {
    showLoading();
    try {
        const task = await taigaAPI.getTask(taskId);

        const modal = document.getElementById('taskDetailsModal');
        const modalTitle = document.getElementById('modalTaskTitle');
        const modalBody = document.getElementById('modalTaskBody');

        modalTitle.textContent = `#${task.ref}: ${task.subject}`;

        modalBody.innerHTML = `
            <div class="task-detail-section">
                <h4>📝 Descrição</h4>
                <div class="task-detail-content">
                    ${task.description ? escapeHtml(task.description).replace(/\n/g, '<br>') : '<em>Sem descrição</em>'}
                </div>
            </div>
            
            <div class="task-detail-section">
                <h4>ℹ️ Informações</h4>
                <div class="task-detail-grid">
                    <div class="task-detail-item">
                        <span class="task-detail-label">Status:</span>
                        <span class="task-detail-value" style="background: ${task.status_extra_info?.color || '#666'}; padding: 4px 8px; border-radius: 4px;">
                            ${task.status_extra_info?.name || 'N/A'}
                        </span>
                    </div>
                    <div class="task-detail-item">
                        <span class="task-detail-label">Atribuído a:</span>
                        <span class="task-detail-value">
                            ${task.assigned_to_extra_info?.full_name_display || 'Não atribuído'}
                        </span>
                    </div>
                    <div class="task-detail-item">
                        <span class="task-detail-label">User Story:</span>
                        <span class="task-detail-value">
                            ${task.user_story ? `#${task.user_story}` : 'N/A'}
                        </span>
                    </div>
                    <div class="task-detail-item">
                        <span class="task-detail-label">ID da Tarefa:</span>
                        <span class="task-detail-value">${task.id}</span>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    } catch (error) {
        showToast('Erro ao carregar detalhes da tarefa: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Close Task Details Modal
document.getElementById('closeTaskModal').addEventListener('click', () => {
    document.getElementById('taskDetailsModal').classList.remove('active');
});

// Close modal when clicking outside
document.getElementById('taskDetailsModal').addEventListener('click', (e) => {
    if (e.target.id === 'taskDetailsModal') {
        document.getElementById('taskDetailsModal').classList.remove('active');
    }
});

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

// Reload Tasks Button
document.getElementById('reloadTasksBtn').addEventListener('click', async () => {
    if (!appState.currentStory) {
        showToast('Nenhuma User Story selecionada', 'warning');
        return;
    }

    showToast('Atualizando tarefas...', 'info');
    await loadTasks(appState.currentProject.id, appState.currentStory.id);
    showToast('Tarefas atualizadas!', 'success');
});

// Bulk Creation Modal
const bulkModal = document.getElementById('bulkModal');
const bulkInput = document.getElementById('bulkTasksInput');
const bulkCount = document.getElementById('bulkTaskCount');

// Open bulk modal
document.getElementById('bulkAddBtn').addEventListener('click', () => {
    if (!appState.currentStory) {
        showToast('Selecione uma User Story primeiro', 'warning');
        return;
    }
    bulkModal.style.display = 'flex';
    bulkInput.value = '';
    bulkInput.focus();
    updateBulkCount();
});

// Close bulk modal
document.getElementById('closeBulkModal').addEventListener('click', () => {
    bulkModal.style.display = 'none';
});

document.getElementById('cancelBulkBtn').addEventListener('click', () => {
    bulkModal.style.display = 'none';
});

// Update task count
bulkInput.addEventListener('input', updateBulkCount);

function updateBulkCount() {
    const lines = bulkInput.value.split('\n').filter(line => line.trim() !== '');
    const count = lines.length;
    bulkCount.textContent = `${count} tarefa${count !== 1 ? 's' : ''}`;
}

// Save bulk tasks
document.getElementById('saveBulkBtn').addEventListener('click', async () => {
    const lines = bulkInput.value.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
        showToast('Digite pelo menos uma tarefa', 'warning');
        return;
    }

    if (!appState.currentProject || !appState.currentStory) {
        showToast('Selecione um projeto e user story', 'error');
        return;
    }

    bulkModal.style.display = 'none';
    showLoading();

    try {
        const tasks = lines.map(line => ({
            subject: line.trim(),
            description: '',
            project: appState.currentProject.id,
            user_story: appState.currentStory.id,
            status: appState.taskStatuses[0]?.id
        }));

        showToast(`Criando ${tasks.length} tarefas...`, 'info');

        const results = await taigaAPI.bulkCreateTasks(tasks);

        const successful = results.filter(r => !r.error).length;
        const failed = results.filter(r => r.error).length;

        if (successful > 0) {
            showToast(`✅ ${successful} tarefa(s) criada(s) com sucesso!`, 'success');
            await loadTasks(appState.currentProject.id, appState.currentStory.id);
        }

        if (failed > 0) {
            showToast(`⚠️ ${failed} tarefa(s) falharam`, 'warning');
        }

    } catch (error) {
        showToast('Erro ao criar tarefas: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
});

// Close modal on outside click
bulkModal.addEventListener('click', (e) => {
    if (e.target === bulkModal) {
        bulkModal.style.display = 'none';
    }
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

    // Always send assigned_to, even if null (to allow unassignment)
    if (assignedTo) {
        taskData.assigned_to = parseInt(assignedTo);
    } else {
        taskData.assigned_to = null;
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
            // Add version for OCC (Optimistic Concurrency Control)
            const version = parseInt(card.dataset.taskVersion) || 1;
            taskData.version = version;

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
/* Bulk Assignment Implementation */
function renderBulkAssignSelect() {
    const container = document.getElementById('bulkAssignMemberContainer');
    if (!container) return;

    // Build options
    const options = getSortedMembers().map(member => {
        const memberId = member.user || member.id;
        const isUser = isCurrentUser(member);
        const displayName = member.full_name || member.full_name_display || 'Sem nome';
        const star = isUser ? '⭐ ' : '';
        return `
            <option 
                value="${memberId}" 
                ${isUser ? 'selected' : ''} 
                data-search="${displayName.toLowerCase()} ${member.role_name?.toLowerCase() || ''}"
                style="${isUser ? 'font-weight: bold; background: #f0f7ff;' : ''}"
            >
                ${star}${escapeHtml(displayName)}${member.role_name ? ` (${member.role_name})` : ''}
            </option>
        `;
    }).join('');

    container.innerHTML = `
        <input 
            type="text" 
            class="member-search" 
            placeholder="🔍 Buscar membro..." 
            autocomplete="off"
            style="width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.5rem; margin-bottom: 0.5rem;"
        />
        <select class="bulk-task-assigned" size="5" style="width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.5rem;">
            <option value="">Não atribuído</option>
            ${options}
        </select>
    `;

    // Filter logic
    container.querySelector('.member-search').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const select = container.querySelector('select');
        select.querySelectorAll('option').forEach(option => {
            if (option.value === '') {
                option.style.display = '';
                return;
            }
            const searchData = option.getAttribute('data-search') || '';
            option.style.display = searchData.includes(searchTerm) ? '' : 'none';
        });
    });
}

// Bulk Assign Action
document.getElementById('applyBulkAssignBtn')?.addEventListener('click', async () => {
    const select = document.querySelector('.bulk-task-assigned');
    if (!select) return;

    // Check if there are tasks
    const tasks = appState.tasks || [];
    const newTasks = document.querySelectorAll('.task-card.new');

    if (tasks.length === 0 && newTasks.length === 0) {
        showToast('Não há tarefas para vincular', 'warning');
        return;
    }

    const assignedTo = select.value;
    const assignedToId = assignedTo ? parseInt(assignedTo) : null;

    if (!confirm('Deseja aplicar esta atribuição a TODAS as tarefas listadas?')) {
        return;
    }

    showLoading();
    let updatedCount = 0;
    let errorCount = 0;

    // 1. Update existing tasks
    for (const task of tasks) {
        if (task.assigned_to === assignedToId) continue;

        try {
            // Fetch full task details to preserve all fields (especially description)
            const fullTask = await taigaAPI.getTask(task.id);

            // Update with complete data to avoid overwriting description
            await taigaAPI.updateTask(task.id, {
                subject: fullTask.subject,
                description: fullTask.description,
                status: fullTask.status,
                assigned_to: assignedToId,
                version: fullTask.version // OCC
            });
            updatedCount++;
        } catch (e) {
            console.error(`Failed to update task ${task.id}`, e);
            errorCount++;
        }
    }

    // 2. Update new tasks (UI only)
    newTasks.forEach(card => {
        const selectAssigned = card.querySelector('.task-assigned');
        if (selectAssigned) {
            selectAssigned.value = assignedTo || "";
        }
    });

    showLoading(false);

    const msg = [];
    if (updatedCount > 0) msg.push(`${updatedCount} atualizadas.`);
    if (errorCount > 0) msg.push(`${errorCount} erros.`);
    if (newTasks.length > 0) msg.push(`${newTasks.length} novas pré-preenchidas.`);

    if (msg.length > 0) {
        showToast(msg.join(' '), errorCount > 0 ? 'warning' : 'success');
    } else {
        showToast('Nenhuma alteração necessária.', 'info');
    }

    // Refresh list
    if (updatedCount > 0 && appState.currentStory) {
        await loadTasks(appState.currentProject.id, appState.currentStory.id);
    }
});

/* Bulk Status Implementation */
function renderBulkStatusSelect() {
    const container = document.getElementById('bulkStatusContainer');
    if (!container) return;

    if (!appState.taskStatuses || appState.taskStatuses.length === 0) {
        container.innerHTML = '<span style="color: var(--text-secondary);">Nenhum status disponível</span>';
        return;
    }

    const options = appState.taskStatuses.map(status => `
        <option value="${status.id}">${escapeHtml(status.name)}</option>
    `).join('');

    container.innerHTML = `
        <select class="bulk-task-status" style="width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.5rem; height: 100%;">
            <option value="">Selecione um status...</option>
            ${options}
        </select>
    `;
}

// Bulk Status Action
document.getElementById('applyBulkStatusBtn')?.addEventListener('click', async () => {
    const select = document.querySelector('.bulk-task-status');
    if (!select || !select.value) {
        showToast('Selecione um status para aplicar', 'warning');
        return;
    }

    // Check if there are tasks
    const tasks = appState.tasks || [];
    const newTasks = document.querySelectorAll('.task-card.new');

    if (tasks.length === 0 && newTasks.length === 0) {
        showToast('Não há tarefas para atualizar', 'warning');
        return;
    }

    const statusId = parseInt(select.value);
    const statusName = select.options[select.selectedIndex].text;

    if (!confirm(`Deseja alterar o status de TODAS as tarefas listadas para "${statusName}"?`)) {
        return;
    }

    showLoading();
    let updatedCount = 0;
    let errorCount = 0;

    // 1. Update existing tasks
    for (const task of tasks) {
        if (task.status === statusId) continue;

        try {
            // Fetch full task details to preserve all fields (especially description)
            const fullTask = await taigaAPI.getTask(task.id);

            // Update with complete data to avoid overwriting description
            await taigaAPI.updateTask(task.id, {
                subject: fullTask.subject,
                description: fullTask.description,
                status: statusId,
                assigned_to: fullTask.assigned_to,
                version: fullTask.version // OCC
            });
            updatedCount++;
        } catch (e) {
            console.error(`Failed to update task ${task.id}`, e);
            errorCount++;
        }
    }

    // 2. Update new tasks (UI only)
    newTasks.forEach(card => {
        const selectStatus = card.querySelector('.task-status');
        if (selectStatus) {
            selectStatus.value = statusId;
        }
    });

    showLoading(false);

    const msg = [];
    if (updatedCount > 0) msg.push(`${updatedCount} atualizadas.`);
    if (errorCount > 0) msg.push(`${errorCount} erros.`);
    if (newTasks.length > 0) msg.push(`${newTasks.length} novas pré-preenchidas.`);

    if (msg.length > 0) {
        showToast(msg.join(' '), errorCount > 0 ? 'warning' : 'success');
    } else {
        showToast('Nenhuma alteração necessária.', 'info');
    }

    // Refresh list
    if (updatedCount > 0 && appState.currentStory) {
        await loadTasks(appState.currentProject.id, appState.currentStory.id);
    }
});

/* Theme Management */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.onclick = () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateThemeIcon(next);
        };
    }
}

function updateThemeIcon(theme) {
    const lightIcon = document.querySelector('.theme-icon-light');
    const darkIcon = document.querySelector('.theme-icon-dark');
    if (!lightIcon || !darkIcon) return;

    if (theme === 'light') {
        lightIcon.style.display = 'none';
        darkIcon.style.display = 'block';
    } else {
        lightIcon.style.display = 'block';
        darkIcon.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
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
