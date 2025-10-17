// Main application logic

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    setupNavigation();
});

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me');

        if (!response.ok) {
            window.location.href = '/login.html';
            return;
        }

        const data = await response.json();
        currentUser = data.user;

        // Update UI with user info
        if (document.getElementById('navUsername')) {
            document.getElementById('navUsername').textContent = `@${currentUser.username}`;
        }

        if (document.getElementById('createPostUsername')) {
            document.getElementById('createPostUsername').textContent = currentUser.username;
        }

        // Set user avatar
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            if (currentUser.profile_picture) {
                userAvatar.src = currentUser.profile_picture;
            } else {
                userAvatar.src = `https://ui-avatars.com/api/?name=${currentUser.username}&background=random`;
            }
        }

    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/login.html';
    }
}

function setupNavigation() {
    const logoutBtn = document.getElementById('logoutBtn');
    const viewProfile = document.getElementById('viewProfile');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (viewProfile) {
        viewProfile.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `/profile.html?username=${currentUser.username}`;
        });
    }
}

async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Helper function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

// Helper function to convert file to Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
