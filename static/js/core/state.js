// Application State Management
export const state = {
    currentScreen: 'login',
    currentProject: null,
    currentStory: null,
    currentEpic: null,
    currentUser: null,
    projects: [],
    userStories: [],
    epics: [],
    tasks: [],
    taskStatuses: [],
    projectMembers: [],
    newTasks: []
};

export function setState(updates) {
    Object.assign(state, updates);
}

export function getState() {
    return state;
}

export function resetState() {
    state.currentProject = null;
    state.currentStory = null;
    state.currentEpic = null;
    state.projects = [];
    state.userStories = [];
    state.epics = [];
    state.tasks = [];
    state.newTasks = [];
}
