// Import dependencies
import { taigaAPI } from '../core/api.js';
import { state } from '../core/state.js';
import { showScreen, showToast, showError, hideError } from './ui.js';
import config from '../config.js';

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    hideError('loginError');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const taigaUrl = document.getElementById('taigaUrl').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner');

    btnText.style.display = 'none';
    spinner.style.display = 'block';
    submitBtn.disabled = true;

    try {
        await taigaAPI.login(username, password, taigaUrl);

        // Update user info in header
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        userName.textContent = taigaAPI.currentUser.full_name || taigaAPI.currentUser.username;
        userAvatar.textContent = (taigaAPI.currentUser.full_name || taigaAPI.currentUser.username).charAt(0).toUpperCase();
        userInfo.style.display = 'flex';

        showToast('Login realizado com sucesso!', 'success');

        // Load projects (call global function)
        await loadProjects();
        showScreen('projectsScreen');
    } catch (error) {
        showError('loginError', error.message);
    } finally {
        btnText.style.display = 'block';
        spinner.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Handle logout
async function handleLogout() {
    await taigaAPI.logout();
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('loginForm').reset();
    showScreen('loginScreen');
    showToast('Logout realizado com sucesso', 'info');
}

// Check if user is already logged in and restore session
function checkAutoLogin() {
    const savedUser = localStorage.getItem('taiga_current_user');
    if (taigaAPI.authToken && savedUser) {
        taigaAPI.currentUser = JSON.parse(savedUser);
        state.currentUser = taigaAPI.currentUser;

        // Update user info in header
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        userName.textContent = taigaAPI.currentUser.full_name || taigaAPI.currentUser.username;
        userAvatar.textContent = (taigaAPI.currentUser.full_name || taigaAPI.currentUser.username).charAt(0).toUpperCase();
        userInfo.style.display = 'flex';

        // Load projects (call global function)
        loadProjects();
        showScreen('projectsScreen');
    } else {
        // Set default Taiga URL
        document.getElementById('taigaUrl').value = config.getApiUrl();
    }
}

// Initialize authentication
export function initAuth() {
    // Add event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Check for auto-login
    checkAutoLogin();
}
