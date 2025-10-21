// Profile page functionality

let currentUser = null;
let profileUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadProfile();
    await loadFriendsPanel();
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
    } else {
        // Show friend actions for other users' profiles
        loadFriendshipStatus(user.id);
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

    // Render media based on type
    let mediaHtml = '';
    if (post.media_type === 'image' && post.media_data) {
        mediaHtml = `<img src="${post.media_data}" alt="Post image" class="post-media">`;
    } else if (post.media_type === 'video' && post.media_data) {
        mediaHtml = `<video src="${post.media_data}" controls class="post-media"></video>`;
    } else if (post.media_type === 'audio' && post.media_data) {
        const duration = post.audio_duration ? formatDuration(post.audio_duration) : '';
        mediaHtml = `
            <div class="post-audio">
                <audio controls class="audio-player">
                    <source src="${post.media_data}" type="audio/${post.audio_format || 'mpeg'}">
                    Your browser does not support audio playback.
                </audio>
                ${duration ? `<span class="audio-duration">${duration}</span>` : ''}
            </div>
        `;
    }

    // Render tags
    let tagsHtml = '';
    if (post.tags && Array.isArray(post.tags) && post.tags.length > 0) {
        tagsHtml = `
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="tag" data-tag="${tag.name}">#${tag.name}</span>`).join('')}
            </div>
        `;
    }

    // Visibility indicator
    let visibilityHtml = '';
    if (post.visibility === 'friends') {
        visibilityHtml = '<span class="visibility-indicator" title="Friends Only">👥 Friends</span>';
    } else if (post.visibility === 'private') {
        visibilityHtml = '<span class="visibility-indicator" title="Private">🔒 Private</span>';
    }

    // Linkify hashtags, URLs, and embed YouTube videos in content
    const escapedContent = escapeHtml(post.content);
    const contentWithHashtags = linkifyHashtags(escapedContent);
    const contentWithUrls = linkifyUrls(contentWithHashtags);
    const contentWithLinks = embedYouTubeVideos(contentWithUrls);

    return `
        <div class="post" data-post-id="${post.id}">
            <div class="post-header">
                <img src="${avatarUrl}" alt="${post.username}" class="post-avatar">
                <div class="post-user-info">
                    <span class="post-username">${post.username}</span>
                    <span class="post-time">${formatDate(post.created_at)}</span>
                    ${post.updated_at !== post.created_at ? '<span class="post-edited">(edited)</span>' : ''}
                    ${visibilityHtml}
                </div>
            </div>
            <div class="post-content">${contentWithLinks}</div>
            ${mediaHtml}
            ${tagsHtml}
        </div>
    `;
}

function linkifyHashtags(text) {
    return text.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
}

function linkifyUrls(text) {
    // Match URLs but exclude those that will be YouTube embeds
    const urlRegex = /(?<!href="|src=")(https?:\/\/(?:www\.)?(?!(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/))[^\s<]+)/gi;

    return text.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="post-link">${url}</a>`;
    });
}

function embedYouTubeVideos(text) {
    // Match YouTube URLs: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&][^\s]*)?/g;

    return text.replace(youtubeRegex, (match, videoId) => {
        return `<div class="youtube-embed">
            <iframe
                width="100%"
                height="315"
                src="https://www.youtube.com/embed/${videoId}"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>
        </div>`;
    });
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

// Friendship functionality
async function loadFriendshipStatus(userId) {
    const friendshipActions = document.getElementById('friendshipActions');

    try {
        const response = await fetch(`/api/friends/status/${userId}`);
        const data = await response.json();

        if (data.status === 'none') {
            friendshipActions.innerHTML = `
                <button class="btn-primary" onclick="sendFriendRequest(${userId})">
                    Send Friend Request
                </button>
            `;
        } else if (data.status === 'pending') {
            if (data.isRequester) {
                friendshipActions.innerHTML = `
                    <button class="btn-secondary" disabled>Friend Request Sent</button>
                    <button class="btn-danger" onclick="cancelFriendRequest(${data.friendshipId})">Cancel Request</button>
                `;
            } else {
                friendshipActions.innerHTML = `
                    <button class="btn-primary" onclick="acceptFriendRequest(${data.friendshipId})">Accept Friend Request</button>
                    <button class="btn-danger" onclick="rejectFriendRequest(${data.friendshipId})">Reject</button>
                `;
            }
        } else if (data.status === 'accepted') {
            friendshipActions.innerHTML = `
                <button class="btn-success" disabled>Friends ✓</button>
                <button class="btn-danger" onclick="unfriend(${data.friendshipId})">Unfriend</button>
            `;
        }
    } catch (error) {
        console.error('Load friendship status error:', error);
    }
}

async function sendFriendRequest(userId) {
    try {
        const response = await fetch('/api/friends/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ receiver_id: userId })
        });

        if (response.ok) {
            await loadFriendshipStatus(userId);
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to send friend request');
        }
    } catch (error) {
        console.error('Send friend request error:', error);
        alert('Failed to send friend request');
    }
}

async function acceptFriendRequest(friendshipId) {
    try {
        const response = await fetch(`/api/friends/${friendshipId}/accept`, {
            method: 'PUT'
        });

        if (response.ok) {
            await loadFriendshipStatus(profileUser.id);
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to accept friend request');
        }
    } catch (error) {
        console.error('Accept friend request error:', error);
        alert('Failed to accept friend request');
    }
}

async function rejectFriendRequest(friendshipId) {
    try {
        const response = await fetch(`/api/friends/${friendshipId}/reject`, {
            method: 'PUT'
        });

        if (response.ok) {
            await loadFriendshipStatus(profileUser.id);
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to reject friend request');
        }
    } catch (error) {
        console.error('Reject friend request error:', error);
        alert('Failed to reject friend request');
    }
}

async function cancelFriendRequest(friendshipId) {
    if (!confirm('Are you sure you want to cancel this friend request?')) return;

    try {
        const response = await fetch(`/api/friends/${friendshipId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadFriendshipStatus(profileUser.id);
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to cancel friend request');
        }
    } catch (error) {
        console.error('Cancel friend request error:', error);
        alert('Failed to cancel friend request');
    }
}

async function unfriend(friendshipId) {
    if (!confirm('Are you sure you want to unfriend this user?')) return;

    try {
        const response = await fetch(`/api/friends/${friendshipId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadFriendshipStatus(profileUser.id);
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to unfriend');
        }
    } catch (error) {
        console.error('Unfriend error:', error);
        alert('Failed to unfriend');
    }
}

// ===== Friends Panel (MySpace-style Top Friends) =====

let friendsList = [];
let draggedElement = null;

async function loadFriendsPanel() {
    if (!profileUser) {
        console.log('loadFriendsPanel: profileUser is null');
        return;
    }

    console.log('loadFriendsPanel: Loading friends for user ID', profileUser.id);
    const friendsPanelList = document.getElementById('friendsPanelList');

    try {
        const response = await fetch(`/api/friends/user/${profileUser.id}`);
        console.log('loadFriendsPanel: Response status', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('loadFriendsPanel: Error response', errorData);
            friendsPanelList.innerHTML = '<p class="no-results">No friends yet</p>';
            return;
        }

        const data = await response.json();
        console.log('loadFriendsPanel: Received data', data);
        friendsList = data.friends || [];
        console.log('loadFriendsPanel: Friends list length', friendsList.length);

        if (friendsList.length === 0) {
            friendsPanelList.innerHTML = '<p class="no-results">No friends yet</p>';
            return;
        }

        renderFriendsList();
    } catch (error) {
        console.error('Load friends panel error:', error);
        friendsPanelList.innerHTML = '<p class="error">Failed to load friends</p>';
    }
}

function renderFriendsList() {
    const friendsPanelList = document.getElementById('friendsPanelList');
    const isOwnProfile = currentUser && profileUser && currentUser.id === profileUser.id;

    friendsPanelList.innerHTML = friendsList.map((friend, index) => {
        const avatarUrl = friend.profile_picture || `https://ui-avatars.com/api/?name=${friend.username}&background=random`;

        return `
            <div class="friend-panel-item ${isOwnProfile ? 'draggable' : ''}"
                 data-friend-id="${friend.friend_id}"
                 data-friendship-id="${friend.id}"
                 data-index="${index}"
                 ${isOwnProfile ? 'draggable="true"' : ''}>
                ${isOwnProfile ? '<span class="drag-handle">☰</span>' : ''}
                <img src="${avatarUrl}" alt="${friend.username}" class="friend-panel-avatar">
                <div class="friend-panel-info">
                    <a href="/profile.html?username=${friend.username}" class="friend-panel-name">${friend.username}</a>
                </div>
            </div>
        `;
    }).join('');

    // Setup drag and drop if it's the user's own profile
    if (isOwnProfile) {
        setupDragAndDrop();
    }
}

function setupDragAndDrop() {
    const items = document.querySelectorAll('.friend-panel-item.draggable');

    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');

    // Remove drag-over class from all items
    document.querySelectorAll('.friend-panel-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }

    e.dataTransfer.dropEffect = 'move';

    if (this !== draggedElement) {
        this.classList.add('drag-over');
    }

    return false;
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    this.classList.remove('drag-over');

    if (draggedElement !== this) {
        const draggedIndex = parseInt(draggedElement.dataset.index);
        const targetIndex = parseInt(this.dataset.index);

        // Reorder the friendsList array
        const [removed] = friendsList.splice(draggedIndex, 1);
        friendsList.splice(targetIndex, 0, removed);

        // Re-render the list
        renderFriendsList();

        // Save the new order to the server
        saveFriendOrder();
    }

    return false;
}

async function saveFriendOrder() {
    try {
        // Build array of {friendshipId, displayOrder}
        const friendOrders = friendsList.map((friend, index) => ({
            friendshipId: friend.id,
            displayOrder: friendsList.length - index // Higher number = higher priority
        }));

        const response = await fetch('/api/friends/reorder', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ friendOrders })
        });

        if (!response.ok) {
            const data = await response.json();
            console.error('Failed to save friend order:', data.error);
        }
    } catch (error) {
        console.error('Save friend order error:', error);
    }
}
