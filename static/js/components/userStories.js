// Import dependencies
import { taigaAPI } from '../core/api.js';
import { state } from '../core/state.js';
import { showScreen, showLoading, showToast } from './ui.js';
import { escapeHtml } from '../core/utils.js';
import { toggleFavoriteUserStory } from '../services/favorites.js';
import config from '../config.js';

// Load User Stories for a project
export async function loadUserStories(projectId) {
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

        state.userStories = allStories;
        renderUserStories(state.userStories);
    } catch (error) {
        showToast('Erro ao carregar user stories: ' + error.message, 'error');
    }
}

// Render user stories list
export function renderUserStories(stories) {
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

// Load Epics for a project
export async function loadEpics(projectId) {
    try {
        state.epics = await taigaAPI.getEpics(projectId);
        renderEpics(state.epics);
    } catch (error) {
        showToast('Erro ao carregar épicos: ' + error.message, 'error');
    }
}

// Render epics list
export function renderEpics(epics) {
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

// Search user stories using API
export async function searchUserStoriesAPI(query) {
    if (!state.currentProject) return;

    try {
        showLoading();

        // Use the Taiga API directly with pagination parameters
        const url = `${config.getApiUrl()}/userstories?project=${state.currentProject.id}&q=${encodeURIComponent(query)}&milestone=null&page_size=100`;

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
        const filteredStories = state.userStories.filter(story =>
            story.subject.toLowerCase().includes(query.toLowerCase()) ||
            (story.description && story.description.toLowerCase().includes(query.toLowerCase()))
        );
        renderUserStories(filteredStories);
    } finally {
        showLoading(false);
    }
}

// Select a user story and navigate to tasks screen
export async function selectUserStory(storyId) {
    showLoading();
    try {
        state.currentStory = await taigaAPI.getUserStory(storyId);
        state.currentEpic = null;

        // Update header
        document.getElementById('storyTitle').textContent = `US #${state.currentStory.ref}: ${state.currentStory.subject}`;
        document.getElementById('storyDescription').textContent = 'Gerencie tarefas desta user story';

        // Load tasks and metadata (call global functions for now)
        await Promise.all([
            window.loadTasks(state.currentProject.id, storyId),
            window.loadTaskStatuses(state.currentProject.id),
            window.loadProjectMembers(state.currentProject.id)
        ]);

        showScreen('tasksScreen');
        if (typeof window.renderBulkAssignSelect === 'function') {
            window.renderBulkAssignSelect();
        }
        if (typeof window.renderBulkStatusSelect === 'function') {
            window.renderBulkStatusSelect();
        }
    } catch (error) {
        showToast('Erro ao carregar user story: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Select an epic and navigate to tasks screen
export async function selectEpic(epicId) {
    showLoading();
    try {
        state.currentEpic = await taigaAPI.getEpic(epicId);
        state.currentStory = null;

        // Update header
        document.getElementById('storyTitle').textContent = `Épico #${state.currentEpic.ref}: ${state.currentEpic.subject}`;
        document.getElementById('storyDescription').textContent = 'Gerencie tarefas deste épico';

        // Load tasks and metadata (call global functions for now)
        await Promise.all([
            window.loadTasks(state.currentProject.id),
            window.loadTaskStatuses(state.currentProject.id),
            window.loadProjectMembers(state.currentProject.id)
        ]);

        showScreen('tasksScreen');
    } catch (error) {
        showToast('Erro ao carregar épico: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Handle tab switching
function handleTabSwitch(e) {
    const tab = e.currentTarget;
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
}

// Handle search with debounce
let searchTimeout;
function handleSearch(e) {
    const searchTerm = e.target.value.trim();

    // Clear previous timeout
    clearTimeout(searchTimeout);

    // If empty, show all loaded stories
    if (!searchTerm) {
        renderUserStories(state.userStories);
        renderEpics(state.epics);
        return;
    }

    // Debounce search (wait 300ms after user stops typing)
    searchTimeout = setTimeout(async () => {
        await searchUserStoriesAPI(searchTerm);
    }, 300);
}

// Handle back to stories button
function handleBackToStories() {
    showScreen('userStoriesScreen');
    state.currentStory = null;
    state.currentEpic = null;
    state.newTasks = [];
}

// Initialize user stories screen event listeners
export function initUserStoriesScreen() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', handleTabSwitch);
    });

    // Search
    document.getElementById('usSearch').addEventListener('input', handleSearch);

    // Back to stories button
    document.getElementById('backToStories').addEventListener('click', handleBackToStories);
}
