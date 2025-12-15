// Import dependencies
import { taigaAPI } from '../core/api.js';
import { state } from '../core/state.js';
import { showScreen, showLoading, showToast } from './ui.js';
import { escapeHtml } from '../core/utils.js';
import { favoritesManager } from '../services/favorites.js';

// Load projects from API
export async function loadProjects() {
    showLoading();
    try {
        state.projects = await taigaAPI.getProjects();
        renderProjects(state.projects);
    } catch (error) {
        showToast('Erro ao carregar projetos: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Render projects grid
export function renderProjects(projects) {
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
            renderProjects(state.projects);

            showToast(
                isFavorite ? 'Projeto adicionado aos favoritos' : 'Projeto removido dos favoritos',
                'success'
            );
        });
    });
}

// Select a project and navigate to user stories screen
export async function selectProject(projectId) {
    showLoading();
    try {
        state.currentProject = await taigaAPI.getProject(projectId);

        // Update header
        document.getElementById('projectTitle').textContent = state.currentProject.name;
        document.getElementById('projectDescription').textContent = 'Selecione uma User Story ou Épico';

        // Cache members if available
        if (state.currentProject.members && state.currentProject.members.length > 0) {
            console.log('Caching members from project data', state.currentProject.members.length);
            localStorage.setItem('projectMembers', JSON.stringify(state.currentProject.members));
            state.projectMembers = state.currentProject.members;
        }

        // Load user stories and epics (call global functions for now)
        await Promise.all([
            window.loadUserStories(projectId),
            window.loadEpics(projectId)
        ]);

        showScreen('userStoriesScreen');
    } catch (error) {
        showToast('Erro ao carregar projeto: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Handle project search
function handleProjectSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = state.projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm) ||
        (project.description && project.description.toLowerCase().includes(searchTerm))
    );
    renderProjects(filtered);
}

// Handle back to projects button
function handleBackToProjects() {
    showScreen('projectsScreen');
    state.currentProject = null;
}

// Initialize projects screen event listeners
export function initProjectsScreen() {
    document.getElementById('projectSearch').addEventListener('input', handleProjectSearch);
    document.getElementById('backToProjects').addEventListener('click', handleBackToProjects);
}
