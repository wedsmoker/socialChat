// Profile page functionality

let currentUser = null;
let profileUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadProfile();
    setupProfileUI();
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
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/login.html';
    }
}

async function loadProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');

    if (!username) {
        alert('No username provided');
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch(`/api/profiles/${username}`);

        if (!response.ok) {
            alert('User not found');
            window.location.href = '/';
            return;
        }

        const data = await response.json();
        profileUser = data.user;

        displayProfile(data.user, data.posts);
    } catch (error) {
        console.error('Load profile error:', error);
        alert('Failed to load profile');
    }
}

function displayProfile(user, posts) {
    // Set profile info
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileBio').textContent = user.bio || 'No bio yet';

    // Set avatar
    const avatarUrl = user.profile_picture || `https://ui-avatars.com/api/?name=${user.username}&background=random&size=200`;
    document.getElementById('profileAvatar').src = avatarUrl;

    // Set joined date
    const joinedDate = new Date(user.created_at).toLocaleDateString();
    document.getElementById('profileJoined').textContent = joinedDate;

    // Display links
    const linksContainer = document.getElementById('profileLinks');
    if (user.links) {
        try {
            const links = JSON.parse(user.links);
            linksContainer.innerHTML = Object.entries(links).map(([label, url]) =>
                `<a href="${url}" target="_blank" class="profile-link">${label}</a>`
            ).join('');
        } catch (error) {
            linksContainer.innerHTML = '';
        }
    } else {
        linksContainer.innerHTML = '';
    }

    // Show edit button if own profile
    if (currentUser && currentUser.id === user.id) {
        document.getElementById('editProfileBtn').style.display = 'block';
    }

    // Display posts
    displayPosts(posts);
}

function displayPosts(posts) {
    const postsContainer = document.getElementById('profilePostsContainer');

    if (posts.length === 0) {
        postsContainer.innerHTML = '<p class="no-posts">No posts yet</p>';
        return;
    }

    postsContainer.innerHTML = posts.map(post => renderPost(post)).join('');
}

function renderPost(post) {
    const isOwner = currentUser && post.user_id === currentUser.id;
    const avatarUrl = post.user_profile_picture || `https://ui-avatars.com/api/?name=${post.username}&background=random`;

    let mediaHtml = '';
    if (post.media_type === 'image' && post.media_data) {
        mediaHtml = `<img src="${post.media_data}" alt="Post image" class="post-media">`;
    } else if (post.media_type === 'video' && post.media_data) {
        mediaHtml = `<video src="${post.media_data}" controls class="post-media"></video>`;
    }

    return `
        <div class="post" data-post-id="${post.id}">
            <div class="post-header">
                <img src="${avatarUrl}" alt="${post.username}" class="post-avatar">
                <div class="post-user-info">
                    <span class="post-username">${post.username}</span>
                    <span class="post-time">${formatDate(post.created_at)}</span>
                    ${post.updated_at !== post.created_at ? '<span class="post-edited">(edited)</span>' : ''}
                </div>
            </div>
            <div class="post-content">${escapeHtml(post.content)}</div>
            ${mediaHtml}
        </div>
    `;
}

function setupProfileUI() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const closeEditModal = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editProfileForm = document.getElementById('editProfileForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openEditModal);
    }

    if (closeEditModal) {
        closeEditModal.addEventListener('click', closeModal);
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeModal);
    }

    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleProfileUpdate);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function openEditModal() {
    // Populate form with current values
    document.getElementById('editBio').value = profileUser.bio || '';

    if (profileUser.links) {
        try {
            const links = JSON.parse(profileUser.links);
            document.getElementById('editLinks').value = JSON.stringify(links, null, 2);
        } catch (error) {
            document.getElementById('editLinks').value = '';
        }
    } else {
        document.getElementById('editLinks').value = '';
    }

    document.getElementById('editProfileModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('editProfileModal').style.display = 'none';
    document.getElementById('editErrorMessage').textContent = '';
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const bio = document.getElementById('editBio').value.trim();
    const linksText = document.getElementById('editLinks').value.trim();
    const profilePictureFile = document.getElementById('editProfilePicture').files[0];
    const errorMessage = document.getElementById('editErrorMessage');

    errorMessage.textContent = '';

    // Validate links JSON
    let links = null;
    if (linksText) {
        try {
            links = JSON.parse(linksText);
        } catch (error) {
            errorMessage.textContent = 'Invalid JSON format for links';
            return;
        }
    }

    // Handle profile picture
    let profilePicture = null;
    if (profilePictureFile) {
        if (profilePictureFile.size > 10 * 1024 * 1024) {
            errorMessage.textContent = 'Profile picture must be less than 10MB';
            return;
        }

        try {
            profilePicture = await fileToBase64(profilePictureFile);
        } catch (error) {
            errorMessage.textContent = 'Failed to load profile picture';
            return;
        }
    }

    try {
        const response = await fetch('/api/profiles/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bio: bio || null,
                profile_picture: profilePicture,
                links: links ? JSON.stringify(links) : null
            })
        });

        if (response.ok) {
            closeModal();
            location.reload(); // Reload to show updated profile
        } else {
            const data = await response.json();
            errorMessage.textContent = data.error || 'Failed to update profile';
        }
    } catch (error) {
        console.error('Update profile error:', error);
        errorMessage.textContent = 'Failed to update profile';
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

// Helper functions
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

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
