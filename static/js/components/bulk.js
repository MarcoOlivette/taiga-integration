// Import dependencies
import { taigaAPI } from '../core/api.js';
import { state } from '../core/state.js';
import { showLoading, showToast } from './ui.js';
import { escapeHtml, getSortedMembers, isCurrentUser } from '../core/utils.js';

// Render bulk assign select
export function renderBulkAssignSelect() {
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

// Render bulk status select
export function renderBulkStatusSelect() {
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

// Handle bulk assign
async function handleBulkAssign() {
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
        await window.loadTasks(state.currentProject.id, state.currentStory.id);
    }
}

// Handle bulk status
async function handleBulkStatus() {
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

    if (!confirm('Deseja aplicar este status a TODAS as tarefas listadas?')) {
        return;
    }

    showLoading();
    let updatedCount = 0;
    let errorCount = 0;

    // 1. Update existing tasks
    for (const task of tasks) {
        if (task.status === statusId) continue;

        try {
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
            selectStatus.value = statusId.toString();
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
        await window.loadTasks(state.currentProject.id, state.currentStory.id);
    }
}

// Initialize bulk actions
export function initBulkActions() {
    document.getElementById('applyBulkAssignBtn')?.addEventListener('click', handleBulkAssign);
    document.getElementById('applyBulkStatusBtn')?.addEventListener('click', handleBulkStatus);
}
