// Import dependencies
import { state } from '../core/state.js';
import { escapeHtml, getSortedMembers, isCurrentUser } from '../core/utils.js';
import { taigaAPI } from '../core/api.js';
import { showLoading, showToast } from './ui.js';

// Create task card HTML
export function createTaskCard(task, isNew = false) {
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

// Create task form HTML
export function createTaskForm(task = {}) {
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

// Show task details modal
export async function showTaskDetails(taskId) {
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
                        <span class="task-detail-value">${task.assigned_to_extra_info?.full_name_display || 'Não atribuído'}</span>
                    </div>
                    <div class="task-detail-item">
                        <span class="task-detail-label">Criado em:</span>
                        <span class="task-detail-value">${new Date(task.created_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div class="task-detail-item">
                        <span class="task-detail-label">Modificado em:</span>
                        <span class="task-detail-value">${new Date(task.modified_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    } catch (error) {
        showToast('Erro ao carregar detalhes: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Attach event listeners to task cards
export function attachTaskEventListeners(container) {
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
            // Call global saveTask for now
            await window.saveTask(e.target.closest('.task-card'));
        });
    });

    // Delete buttons
    container.querySelectorAll('.delete-task').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
                // Call global deleteTask for now
                await window.deleteTask(e.target.closest('.task-card'));
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
