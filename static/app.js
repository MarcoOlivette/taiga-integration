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
// Import tasks components
import { loadTasks, loadTaskStatuses, loadProjectMembers, renderTasks, initTasksScreen } from './js/components/tasks.js';
import { saveTask, deleteTask } from './js/services/taskService.js';

// UI Helper Functions moved to js/components/ui.js
// Auth handlers moved to js/components/auth.js
// Projects and favorites moved to js/components/projects.js and js/services/favorites.js
// User stories moved to js/components/userStories.js

// Expose functions globally for other modules (temporary)
window.loadProjects = loadProjects;
window.loadUserStories = loadUserStories;
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
