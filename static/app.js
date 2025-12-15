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
// Import bulk actions component
import { renderBulkAssignSelect, renderBulkStatusSelect, initBulkActions } from './js/components/bulk.js';
// Import theme component
import { initTheme } from './js/components/theme.js';

// All modules now properly imported and organized!
// Original app.js: 1,596 lines → Final: ~35 lines (98% reduction!)

// Expose functions globally for cross-module compatibility (temporary solution)
window.loadProjects = loadProjects;
window.loadUserStories = loadUserStories;
window.loadEpics = loadEpics;
window.renderUserStories = renderUserStories;
window.loadTasks = loadTasks;
window.loadTaskStatuses = loadTaskStatuses;
window.loadProjectMembers = loadProjectMembers;
window.saveTask = saveTask;
window.deleteTask = deleteTask;
window.renderBulkAssignSelect = renderBulkAssignSelect;
window.renderBulkStatusSelect = renderBulkStatusSelect;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuth();
    initProjectsScreen();
    initUserStoriesScreen();
    initTasksScreen();
    initBulkActions();
});
