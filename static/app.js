// Import utilities
import { escapeHtml, normalizeString, isCurrentUser, getSortedMembers } from './js/core/utils.js';
// Import API client
import { taigaAPI } from './js/core/api.js';
// Import state management
import { state, setState, getState, resetState } from './js/core/state.js';
// Import UI components
import { showScreen, showLoading, showToast, showError, hideError } from './js/components/ui.js';
// Import auth component
import { initAuth } from './js/components/auth.js';
// Import projects component
import { loadProjects, renderProjects, selectProject, initProjectsScreen } from './js/components/projects.js';
// Import favorites service
import { favoritesManager, toggleFavoriteUserStory } from './js/services/favorites.js';
// Import user stories component
import { loadUserStories, renderUserStories, loadEpics, renderEpics, searchUserStoriesAPI, selectUserStory, selectEpic, initUserStoriesScreen } from './js/components/userStories.js';

// UI Helper Functions moved to js/components/ui.js
// Auth handlers moved to js/components/auth.js
// Projects and favorites moved to js/components/projects.js and js/services/favorites.js
// User stories moved to js/components/userStories.js

// Expose functions globally for other modules (temporary)
window.loadProjects = loadProjects;
window.loadUserStories = loadUserStories;
window.loadEpics = loadEpics;
window.renderUserStories = renderUserStories;

// Load Tasks
async function loadTasks(projectId, userStoryId = null) {
    try {
        state.tasks = await taigaAPI.getTasks(projectId, userStoryId);
        renderTasks(state.tasks);
    } catch (error) {
        showToast('Erro ao carregar tarefas: ' + error.message, 'error');
    }
}

async function loadTaskStatuses(projectId) {
    try {
        state.taskStatuses = await taigaAPI.getTaskStatuses(projectId);
    } catch (error) {
        console.error('Error loading task statuses:', error);
    }
}

async function loadProjectMembers(projectId) {
    // If already loaded in state, skip
    if (state.projectMembers && state.projectMembers.length > 0) {
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
                        state.projectMembers = members;
                        return;
                    }
                }
            } catch (e) {
                console.error('Error parsing cached members:', e);
            }
        }

        console.log('Fetching members from API');
        const slug = state.currentProject?.slug;
        state.projectMembers = await taigaAPI.getProjectMembers(projectId, slug);

        // Save to cache
        localStorage.setItem('projectMembers', JSON.stringify(state.projectMembers));

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
        <div class="task-card ${isNew ? 'new' : ''}" 
             data-task-id="${task.id || 'new-' + Date.now()}" 
             data-task-version="${task.version || 1}"
             data-original-subject="${escapeHtml(task.subject || '')}"
             data-original-description="${escapeHtml(task.description || '')}"
             data-original-status="${task.status || ''}"
             data-original-assigned="${task.assigned_to || ''}">
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

// Utility functions moved to js/core/utils.js

function createTaskForm(task = {}) {
    const isNew = !task.id;

    return `
        <input type="text" class="task-subject" placeholder="Título da tarefa" value="${escapeHtml(task.subject || '')}" required>
        <textarea class="task-description" placeholder="Descrição (opcional)">${escapeHtml(task.description || '')}</textarea>
        <select class="task-status">
            <option value="">Selecione um status</option>
            ${state.taskStatuses.map(status => `
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
    if (!state.currentStory) {
        showToast('Nenhuma User Story selecionada', 'warning');
        return;
    }

    showToast('Atualizando tarefas...', 'info');
    await loadTasks(state.currentProject.id, state.currentStory.id);
    showToast('Tarefas atualizadas!', 'success');
});

// Bulk Creation Modal
const bulkModal = document.getElementById('bulkModal');
const bulkInput = document.getElementById('bulkTasksInput');
const bulkCount = document.getElementById('bulkTaskCount');

// Open bulk modal
document.getElementById('bulkAddBtn').addEventListener('click', () => {
    if (!state.currentStory) {
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

    if (!state.currentProject || !state.currentStory) {
        showToast('Selecione um projeto e user story', 'error');
        return;
    }

    bulkModal.style.display = 'none';
    showLoading();

    try {
        const tasks = lines.map(line => ({
            subject: line.trim(),
            description: '',
            project: state.currentProject.id,
            user_story: state.currentStory.id,
            status: state.taskStatuses[0]?.id
        }));

        showToast(`Criando ${tasks.length} tarefas...`, 'info');

        const results = await taigaAPI.bulkCreateTasks(tasks);

        const successful = results.filter(r => !r.error).length;
        const failed = results.filter(r => r.error).length;

        if (successful > 0) {
            showToast(`✅ ${successful} tarefa(s) criada(s) com sucesso!`, 'success');
            await loadTasks(state.currentProject.id, state.currentStory.id);
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

    showLoading();
    try {
        if (isNew) {
            // For new tasks, send all fields
            const taskData = {
                subject,
                description,
                project: state.currentProject.id,
                status: status || state.taskStatuses[0]?.id,
            };

            if (state.currentStory) {
                taskData.user_story = state.currentStory.id;
            }

            // Always send assigned_to, even if null (to allow unassignment)
            if (assignedTo) {
                taskData.assigned_to = parseInt(assignedTo);
            } else {
                taskData.assigned_to = null;
            }

            const newTask = await taigaAPI.createTask(taskData);
            showToast('Tarefa criada com sucesso!', 'success');

            // Remove from new tasks and add to existing
            card.remove();
            await loadTasks(state.currentProject.id, state.currentStory?.id);
        } else {
            // For existing tasks, compare with original values and send ONLY changed fields
            const taskData = {};

            // Always include version for OCC
            const version = parseInt(card.dataset.taskVersion) || 1;
            taskData.version = version;

            // Get original values from data attributes
            const originalSubject = card.dataset.originalSubject || '';
            const originalDescription = card.dataset.originalDescription || '';
            const originalStatus = card.dataset.originalStatus || '';
            const originalAssigned = card.dataset.originalAssigned || '';

            // Compare and add only changed fields
            if (subject !== originalSubject) {
                taskData.subject = subject;
            }

            if (description !== originalDescription) {
                taskData.description = description;
            }

            if (status && status !== originalStatus) {
                taskData.status = parseInt(status);
            }

            // For assigned_to, handle both change and unassignment
            const currentAssigned = assignedTo ? parseInt(assignedTo) : null;
            const origAssigned = originalAssigned ? parseInt(originalAssigned) : null;
            if (currentAssigned !== origAssigned) {
                taskData.assigned_to = currentAssigned;
            }

            // Only proceed if there are changes (besides version)
            if (Object.keys(taskData).length === 1) {
                showToast('Nenhuma alteração detectada', 'info');
                showLoading(false);
                return;
            }

            await taigaAPI.updateTask(parseInt(taskId), taskData);
            showToast('Tarefa atualizada com sucesso!', 'success');
            await loadTasks(state.currentProject.id, state.currentStory?.id);
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
        await loadTasks(state.currentProject.id, state.currentStory?.id);
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
            project: state.currentProject.id,
            status: status || state.taskStatuses[0]?.id,
        };

        if (state.currentStory) {
            taskData.user_story = state.currentStory.id;
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
        await loadTasks(state.currentProject.id, state.currentStory?.id);
    } catch (error) {
        showToast('Erro ao criar tarefas: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
});

// Utility function to escape HTML
// escapeHtml moved to js/core/utils.js

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
    const tasks = state.tasks || [];
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
            // Taiga accepts partial PATCH - send only the field being changed + version
            await taigaAPI.updateTask(task.id, {
                assigned_to: assignedToId,
                version: task.version // OCC
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
    if (updatedCount > 0 && state.currentStory) {
        await loadTasks(state.currentProject.id, state.currentStory.id);
    }
});

/* Bulk Status Implementation */
function renderBulkStatusSelect() {
    const container = document.getElementById('bulkStatusContainer');
    if (!container) return;

    if (!state.taskStatuses || state.taskStatuses.length === 0) {
        container.innerHTML = '<span style="color: var(--text-secondary);">Nenhum status disponível</span>';
        return;
    }

    const options = state.taskStatuses.map(status => `
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
    const tasks = state.tasks || [];
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
            // Taiga accepts partial PATCH - send only the field being changed + version
            await taigaAPI.updateTask(task.id, {
                status: statusId,
                version: task.version // OCC
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
    if (updatedCount > 0 && state.currentStory) {
        await loadTasks(state.currentProject.id, state.currentStory.id);
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
    initAuth();
    initProjectsScreen();
    initUserStoriesScreen();
});
