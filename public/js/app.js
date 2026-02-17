// API Configuration
const API_URL = 'http://localhost:3000/api';

// Get authentication token
function getToken() {
    return localStorage.getItem('token');
}

// Get user info
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getToken();
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth.html';
}

// Protected fetch with authentication
async function authenticatedFetch(url, options = {}) {
    const token = getToken();

    if (!token) {
        window.location.href = '/auth.html';
        throw new Error('Not authenticated');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    // If unauthorized, logout
    if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error('Session expired');
    }

    return response;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format datetime for display
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show loading state
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading" style="height: 100px; border-radius: var(--radius-md);"></div>';
    }
}

// Show error message
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="card" style="background: rgba(255, 82, 82, 0.1); border-color: var(--color-error); color: var(--color-error);">
      <p>⚠️ ${message}</p>
    </div>`;
    }
}
