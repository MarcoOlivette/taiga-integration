// Import dependencies
import { showToast } from '../components/ui.js';
import { state } from '../core/state.js';

// Favorites Management for Projects
export const favoritesManager = {
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

// Toggle favorite user story (only one allowed)
export function toggleFavoriteUserStory(storyId) {
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

    // Re-render to update UI (call global function for now)
    if (window.renderUserStories && state.userStories) {
        window.renderUserStories(state.userStories);
    }
}
