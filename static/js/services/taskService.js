// Import dependencies
import { taigaAPI } from '../core/api.js';
import { state } from '../core/state.js';
import { showLoading, showToast } from '../components/ui.js';

// Save task (create or update)
export async function saveTask(card) {
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
            await window.loadTasks(state.currentProject.id, state.currentStory?.id);
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
            await window.loadTasks(state.currentProject.id, state.currentStory?.id);
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

// Delete task
export async function deleteTask(card) {
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
        await window.loadTasks(state.currentProject.id, state.currentStory?.id);
    } catch (error) {
        showToast('Erro ao excluir tarefa: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Bulk create tasks
export async function bulkCreateTasks(tasksData) {
    try {
        await taigaAPI.bulkCreateTasks(tasksData);
        showToast(`${tasksData.length} tarefa(s) criada(s) com sucesso!`, 'success');

        // Clear new tasks
        document.getElementById('newTasksContainer').innerHTML = '';
        document.getElementById('saveAllTasksBtn').style.display = 'none';

        // Reload tasks
        await window.loadTasks(state.currentProject.id, state.currentStory?.id);
    } catch (error) {
        showToast('Erro ao criar tarefas: ' + error.message, 'error');
    }
}
