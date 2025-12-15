// Import dependencies
import { taigaAPI } from '../core/api.js';
import { state } from '../core/state.js';
import { showScreen, showLoading, showToast } from './ui.js';
import { createTaskCard, attachTaskEventListeners } from './taskCard.js';
import { saveTask, deleteTask, bulkCreateTasks } from '../services/taskService.js';

// Load tasks for a project/user story
export async function loadTasks(projectId, userStoryId = null) {
    try {
        state.tasks = await taigaAPI.getTasks(projectId, userStoryId);
        renderTasks(state.tasks);
    } catch (error) {
        showToast('Erro ao carregar tarefas: ' + error.message, 'error');
    }
}

// Load task statuses for a project
export async function loadTaskStatuses(projectId) {
    try {
        state.taskStatuses = await taigaAPI.getTaskStatuses(projectId);
    } catch (error) {
        console.error('Error loading task statuses:', error);
    }
}

// Load project members
export async function loadProjectMembers(projectId) {
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

// Render tasks list
export function renderTasks(tasks) {
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

// Handle add new task
function handleAddTask() {
    const container = document.getElementById('newTasksContainer');
    const newTaskCard = document.createElement('div');
    newTaskCard.innerHTML = createTaskCard({}, true);

    container.appendChild(newTaskCard.firstElementChild);
    attachTaskEventListeners(newTaskCard);

    // Show save all button
    document.getElementById('saveAllTasksBtn').style.display = 'inline-flex';
}

// Handle reload tasks
async function handleReloadTasks() {
    if (!state.currentStory) {
        showToast('Nenhuma User Story selecionada', 'warning');
        return;
    }

    showToast('Atualizando tarefas...', 'info');
    await loadTasks(state.currentProject.id, state.currentStory.id);
    showToast('Tarefas atualizadas!', 'success');
}

// Handle bulk modal open
function handleBulkModalOpen() {
    if (!state.currentStory) {
        showToast('Selecione uma User Story primeiro', 'warning');
        return;
    }
    const modal = document.getElementById('bulkModal');
    modal.style.display = 'flex';
    document.getElementById('bulkTasksInput').value = '';
    document.getElementById('bulkTasksInput').focus();
    updateBulkCount();
}

// Handle bulk modal close
function handleBulkModalClose() {
    document.getElementById('bulkModal').style.display = 'none';
}

// Update bulk task count
function updateBulkCount() {
    const input = document.getElementById('bulkTasksInput');
    const count = input.value.split('\n').filter(line => line.trim() !== '').length;
    document.getElementById('bulkTaskCount').textContent = `${count} tarefa(s)`;
}

// Handle bulk save
async function handleBulkSave() {
    const bulkInput = document.getElementById('bulkTasksInput');
    const lines = bulkInput.value.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
        showToast('Digite pelo menos uma tarefa', 'warning');
        return;
    }

    if (!state.currentProject || !state.currentStory) {
        showToast('Selecione um projeto e user story', 'error');
        return;
    }

    document.getElementById('bulkModal').style.display = 'none';
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
}

// Handle save all tasks
async function handleSaveAll() {
    const newTasksContainer = document.getElementById('newTasksContainer');
    const cards = newTasksContainer.querySelectorAll('.task-card.new');

    if (cards.length === 0) {
        showToast('Nenhuma tarefa nova para salvar', 'info');
        return;
    }

    let hasErrors = false;
    const tasksData = [];

    cards.forEach(card => {
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
        showToast('Algumas tarefas têm erros. Corrija-os antes de salvar.', 'warning');
        return;
    }

    showLoading();
    await bulkCreateTasks(tasksData);
    showLoading(false);
}

// Initialize tasks screen event listeners
export function initTasksScreen() {
    // Add task button
    document.getElementById('addTaskBtn').addEventListener('click', handleAddTask);

    // Reload tasks button
    document.getElementById('reloadTasksBtn').addEventListener('click', handleReloadTasks);

    // Bulk modal
    document.getElementById('bulkAddBtn').addEventListener('click', handleBulkModalOpen);
    document.getElementById('closeBulkModal').addEventListener('click', handleBulkModalClose);
    document.getElementById('bulkTasksInput').addEventListener('input', updateBulkCount);
    document.getElementById('saveBulkBtn').addEventListener('click', handleBulkSave);

    // Save all tasks button
    document.getElementById('saveAllTasksBtn').addEventListener('click', handleSaveAll);

    // Close task details modal
    document.getElementById('closeTaskModal').addEventListener('click', () => {
        document.getElementById('taskDetailsModal').classList.remove('active');
    });
}
