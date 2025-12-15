// Configuration Manager
class Config {
    constructor() {
        this.loadConfig();
    }

    loadConfig() {
        // Try to load from .env file (would need a build step)
        // For now, using default values that can be overridden
        this.TAIGA_API_URL = 'https://pista.decea.mil.br/api/v1';
        this.TAIGA_AUTH_URL = 'https://pista.decea.mil.br/api/v1/auth';
        this.APP_NAME = 'Taiga Bulk Task Manager';

        // Load from localStorage if user has customized
        const savedUrl = localStorage.getItem('taiga_api_url');
        if (savedUrl) {
            this.TAIGA_API_URL = savedUrl;
            this.TAIGA_AUTH_URL = savedUrl.replace('/api/v1', '') + '/api/v1/auth';
        }
    }

    setApiUrl(url) {
        // Remove trailing slash if present
        url = url.replace(/\/$/, '');

        // Ensure it ends with /api/v1
        if (!url.endsWith('/api/v1')) {
            if (url.includes('/api/v1')) {
                url = url.substring(0, url.indexOf('/api/v1') + 7);
            } else {
                url = url + '/api/v1';
            }
        }

        this.TAIGA_API_URL = url;
        this.TAIGA_AUTH_URL = url.replace('/api/v1', '') + '/api/v1/auth';

        // Save to localStorage
        localStorage.setItem('taiga_api_url', url);
    }

    getApiUrl() {
        return this.TAIGA_API_URL;
    }

    getAuthUrl() {
        return this.TAIGA_AUTH_URL;
    }
}

// Create global config instance
const config = new Config();
