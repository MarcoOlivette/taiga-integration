// Import state management
import { state } from './state.js';

// Core utility functions

// Normalize string for comparison (remove accents, lowercase, alphanumeric only)
export function normalizeString(str) {
    if (!str) return '';
    return str.toString()
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]/g, ""); // Remove non-alphanumeric (spaces, dots, etc)
}

// Helper to identify current user in member list
export function isCurrentUser(member) {
    if (!state.currentUser) return false;

    // 1. Exact ID Match (most reliable)
    const memberId = member.user || member.id;
    if (memberId && state.currentUser.id && memberId === state.currentUser.id) return true;

    // 2. Fuzzy Name/Username Match
    // Collect all possible identifiers for the member
    const memberIdentifiers = [
        member.full_name,
        member.full_name_display,
        member.username,
        member.slug
    ].map(normalizeString).filter(s => s && s.length > 2); // Filter short noise

    // Collect all possible identifiers for the current user
    const userIdentifiers = [
        state.currentUser.full_name,
        state.currentUser.username,
        state.currentUser.slug
    ].map(normalizeString).filter(s => s && s.length > 2);

    // Check if any identifier matches any other identifier
    // This handles "Marco Olivette" matches "marcoolivette"
    return memberIdentifiers.some(m => userIdentifiers.includes(m));
}

// Sort members: current user first, then alphabetically
export function getSortedMembers() {
    if (!state.projectMembers) return [];

    const members = [...state.projectMembers];

    return members.sort((a, b) => {
        // Current user always first
        const aIsUser = isCurrentUser(a);
        const bIsUser = isCurrentUser(b);

        if (aIsUser && !bIsUser) return -1;
        if (!aIsUser && bIsUser) return 1;

        // Then sort alphabetically by full_name
        const nameA = (a.full_name || a.full_name_display || '').toLowerCase();
        const nameB = (b.full_name || b.full_name_display || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
}

// Escape HTML to prevent XSS
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
