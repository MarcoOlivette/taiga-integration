// Import configuration
import config from '../config.js';

// Taiga API Client
class TaigaAPI {
    constructor() {
        this.authToken = localStorage.getItem('taiga_auth_token');
        this.refreshToken = localStorage.getItem('taiga_refresh_token');
        this.currentUser = null;
    }

    // Authentication
    async login(username, password, taigaUrl) {
        try {
            // Update config with custom URL if provided
            if (taigaUrl) {
                config.setApiUrl(taigaUrl);
            }

            const response = await fetch(`${config.getAuthUrl()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'normal',
                    username: username,
                    password: password
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error._error_message || 'Falha na autenticação');
            }

            const data = await response.json();
            this.authToken = data.auth_token;
            this.refreshToken = data.refresh;

            // Save tokens
            localStorage.setItem('taiga_auth_token', this.authToken);
            localStorage.setItem('taiga_refresh_token', this.refreshToken);

            // Get user info
            await this.getCurrentUser();

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout() {
        this.authToken = null;
        this.refreshToken = null;
        this.currentUser = null;
        localStorage.removeItem('taiga_auth_token');
        localStorage.removeItem('taiga_refresh_token');
        localStorage.removeItem('taiga_current_user');
    }

    async getCurrentUser() {
        try {
            const response = await this.request('/users/me');
            this.currentUser = response;
            localStorage.setItem('taiga_current_user', JSON.stringify(response));
            return response;
        } catch (error) {
            console.error('Get current user error:', error);
            throw error;
        }
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${config.getApiUrl()}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, try to refresh
                await this.refreshAuthToken();
                // Retry the request
                return this.request(endpoint, options);
            }

            const error = await response.json().catch(() => ({}));
            throw new Error(error._error_message || `HTTP ${response.status}: ${response.statusText}`);
        }

        // Handle empty responses
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    async refreshAuthToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(`${config.getAuthUrl()}/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh: this.refreshToken
                })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            this.authToken = data.auth_token;
            localStorage.setItem('taiga_auth_token', this.authToken);
        } catch (error) {
            console.error('Token refresh error:', error);
            await this.logout();
            throw error;
        }
    }

    // Projects
    async getProjects() {
        try {
            const projects = await this.request('/projects');
            return projects;
        } catch (error) {
            console.error('Get projects error:', error);
            throw error;
        }
    }

    async getProject(projectId) {
        try {
            const project = await this.request(`/projects/${projectId}`);
            return project;
        } catch (error) {
            console.error('Get project error:', error);
            throw error;
        }
    }

    // User Stories
    async getUserStories(projectId) {
        try {
            const stories = await this.request(`/userstories?project=${projectId}`);
            return stories;
        } catch (error) {
            console.error('Get user stories error:', error);
            throw error;
        }
    }

    async getUserStory(storyId) {
        try {
            const story = await this.request(`/userstories/${storyId}`);
            return story;
        } catch (error) {
            console.error('Get user story error:', error);
            throw error;
        }
    }

    // Epics
    async getEpics(projectId) {
        try {
            const epics = await this.request(`/epics?project=${projectId}`);
            return epics;
        } catch (error) {
            console.error('Get epics error:', error);
            throw error;
        }
    }

    async getEpic(epicId) {
        try {
            const epic = await this.request(`/epics/${epicId}`);
            return epic;
        } catch (error) {
            console.error('Get epic error:', error);
            throw error;
        }
    }

    // Tasks
    async getTasks(projectId, userStoryId = null) {
        try {
            let endpoint = `/tasks?project=${projectId}`;
            if (userStoryId) {
                endpoint += `&user_story=${userStoryId}`;
            }
            // Add x-disable-pagination header to fetch all tasks (not capped at 30)
            const tasks = await this.request(endpoint, {
                headers: {
                    'x-disable-pagination': '1'
                }
            });
            return tasks;
        } catch (error) {
            console.error('Get tasks error:', error);
            throw error;
        }
    }

    async getTask(taskId) {
        try {
            const task = await this.request(`/tasks/${taskId}`);
            return task;
        } catch (error) {
            console.error('Get task error:', error);
            throw error;
        }
    }

    async createTask(taskData) {
        try {
            const task = await this.request('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData)
            });
            return task;
        } catch (error) {
            console.error('Create task error:', error);
            throw error;
        }
    }

    async updateTask(taskId, taskData) {
        try {
            const task = await this.request(`/tasks/${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify(taskData)
            });
            return task;
        } catch (error) {
            console.error('Update task error:', error);
            throw error;
        }
    }

    async deleteTask(taskId) {
        try {
            await this.request(`/tasks/${taskId}`, {
                method: 'DELETE'
            });
            return true;
        } catch (error) {
            console.error('Delete task error:', error);
            throw error;
        }
    }

    // Bulk task creation
    async bulkCreateTasks(tasksData) {
        try {
            const response = await this.request('/tasks/bulk_create', {
                method: 'POST',
                body: JSON.stringify({
                    bulk_tasks: tasksData
                })
            });
            return response;
        } catch (error) {
            // If bulk endpoint doesn't exist, create one by one
            console.warn('Bulk create not available, creating tasks individually');
            const createdTasks = [];
            for (const taskData of tasksData) {
                try {
                    const task = await this.createTask(taskData);
                    createdTasks.push(task);
                } catch (err) {
                    console.error('Error creating task:', err);
                    createdTasks.push({ error: err.message, data: taskData });
                }
            }
            return createdTasks;
        }
    }

    // Get task statuses for a project
    async getTaskStatuses(projectId) {
        try {
            const statuses = await this.request(`/task-statuses?project=${projectId}`);
            return statuses;
        } catch (error) {
            console.error('Get task statuses error:', error);
            throw error;
        }
    }

    // Get project members
    async getProjectMembers(projectId, slug = null) {
        try {
            let url = `/memberships?project=${projectId}`;
            if (slug) {
                url += `&slug=${slug}`;
            }
            const members = await this.request(url);
            return members;
        } catch (error) {
            console.error('Get project members error:', error);
            throw error;
        }
    }
}

// Export class and instance
export default TaigaAPI;
export const taigaAPI = new TaigaAPI();
