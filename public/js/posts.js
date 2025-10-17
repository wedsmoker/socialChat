// Posts feed functionality

let currentMediaData = null;
let currentMediaType = null;
let currentAudioDuration = null;
let currentAudioFormat = null;

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('postsContainer')) {
        loadPosts();
        setupPostCreation();
        loadTrendingTags();
    }
});

function setupPostCreation() {
    const createPostBtn = document.getElementById('createPostBtn');
    const postContent = document.getElementById('postContent');
    const imageUpload = document.getElementById('imageUpload');
    const videoUpload = document.getElementById('videoUpload');
    const audioUpload = document.getElementById('audioUpload');
    const removeMediaBtn = document.getElementById('removeMediaBtn');

    createPostBtn.addEventListener('click', createPost);

    postContent.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            createPost();
        }
    });

    imageUpload.addEventListener('change', handleImageUpload);
    videoUpload.addEventListener('change', handleVideoUpload);
    audioUpload.addEventListener('change', handleAudioUpload);
    removeMediaBtn.addEventListener('click', clearMedia);
}

async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB');
        e.target.value = '';
        return;
    }

    try {
        currentMediaData = await fileToBase64(file);
        currentMediaType = 'image';

        const mediaPreview = document.getElementById('mediaPreview');
        const mediaPreviewImg = document.getElementById('mediaPreviewImg');
        const mediaPreviewVideo = document.getElementById('mediaPreviewVideo');
        const mediaPreviewAudio = document.getElementById('mediaPreviewAudio');

        mediaPreviewImg.src = currentMediaData;
        mediaPreviewImg.style.display = 'block';
        mediaPreviewVideo.style.display = 'none';
        if (mediaPreviewAudio) mediaPreviewAudio.style.display = 'none';
        mediaPreview.style.display = 'block';
    } catch (error) {
        console.error('Image upload error:', error);
        alert('Failed to load image');
    }
}

async function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        alert('Video must be less than 10MB');
        e.target.value = '';
        return;
    }

    try {
        currentMediaData = await fileToBase64(file);
        currentMediaType = 'video';

        const mediaPreview = document.getElementById('mediaPreview');
        const mediaPreviewImg = document.getElementById('mediaPreviewImg');
        const mediaPreviewVideo = document.getElementById('mediaPreviewVideo');
        const mediaPreviewAudio = document.getElementById('mediaPreviewAudio');

        mediaPreviewVideo.src = currentMediaData;
        mediaPreviewVideo.style.display = 'block';
        mediaPreviewImg.style.display = 'none';
        if (mediaPreviewAudio) mediaPreviewAudio.style.display = 'none';
        mediaPreview.style.display = 'block';
    } catch (error) {
        console.error('Video upload error:', error);
        alert('Failed to load video');
    }
}

async function handleAudioUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
        alert('Audio must be less than 20MB');
        e.target.value = '';
        return;
    }

    // Get audio format from file extension
    const format = file.name.split('.').pop().toLowerCase();
    if (!['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(format)) {
        alert('Unsupported audio format. Please use MP3, WAV, OGG, FLAC, or M4A');
        e.target.value = '';
        return;
    }

    try {
        currentMediaData = await fileToBase64(file);
        currentMediaType = 'audio';
        currentAudioFormat = format;

        // Create temporary audio element to get duration
        const audio = new Audio(currentMediaData);
        audio.addEventListener('loadedmetadata', () => {
            currentAudioDuration = Math.floor(audio.duration);
        });

        const mediaPreview = document.getElementById('mediaPreview');
        const mediaPreviewImg = document.getElementById('mediaPreviewImg');
        const mediaPreviewVideo = document.getElementById('mediaPreviewVideo');
        const mediaPreviewAudio = document.getElementById('mediaPreviewAudio');

        if (mediaPreviewAudio) {
            mediaPreviewAudio.src = currentMediaData;
            mediaPreviewAudio.style.display = 'block';
        }
        mediaPreviewImg.style.display = 'none';
        mediaPreviewVideo.style.display = 'none';
        mediaPreview.style.display = 'block';
    } catch (error) {
        console.error('Audio upload error:', error);
        alert('Failed to load audio');
    }
}

function clearMedia() {
    currentMediaData = null;
    currentMediaType = null;
    currentAudioDuration = null;
    currentAudioFormat = null;

    document.getElementById('mediaPreview').style.display = 'none';
    document.getElementById('mediaPreviewImg').src = '';
    document.getElementById('mediaPreviewVideo').src = '';
    const audioPreview = document.getElementById('mediaPreviewAudio');
    if (audioPreview) audioPreview.src = '';
    document.getElementById('imageUpload').value = '';
    document.getElementById('videoUpload').value = '';
    const audioUpload = document.getElementById('audioUpload');
    if (audioUpload) audioUpload.value = '';
}

async function createPost() {
    const content = document.getElementById('postContent').value.trim();
    const visibility = document.getElementById('postVisibility')?.value || 'public';

    if (!content && !currentMediaData) {
        alert('Please add some content or media');
        return;
    }

    try {
        const postData = {
            content,
            media_type: currentMediaType,
            media_data: currentMediaData,
            visibility: visibility
        };

        // Add audio metadata if audio post
        if (currentMediaType === 'audio') {
            postData.audio_duration = currentAudioDuration;
            postData.audio_format = currentAudioFormat;
        }

        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.error || 'Failed to create post');
            return;
        }

        // Clear form
        document.getElementById('postContent').value = '';
        if (document.getElementById('postVisibility')) {
            document.getElementById('postVisibility').value = 'public';
        }
        clearMedia();

        // Reload posts and trending tags
        await loadPosts();
        await loadTrendingTags();
    } catch (error) {
        console.error('Create post error:', error);
        alert('Failed to create post');
    }
}

async function loadPosts(tagFilter = null) {
    const postsContainer = document.getElementById('postsContainer');

    try {
        let url = '/api/posts?limit=50';
        if (tagFilter) {
            url = `/api/tags/${tagFilter}/posts`;
        }

        const response = await fetch(url);
        const data = await response.json();
        const posts = data.posts || data;

        if (posts.length === 0) {
            postsContainer.innerHTML = '<p class="no-posts">No posts yet. Be the first to post!</p>';
            return;
        }

        postsContainer.innerHTML = posts.map(post => renderPost(post)).join('');

        // Attach event listeners
        attachPostEventListeners();
    } catch (error) {
        console.error('Load posts error:', error);
        postsContainer.innerHTML = '<p class="error">Failed to load posts</p>';
    }
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
                ${post.tags.map(tag => `<span class="tag" data-tag="${tag.name}" onclick="filterByTag('${tag.name}')">#${tag.name}</span>`).join('')}
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

    // Linkify hashtags in content
    const contentWithLinks = linkifyHashtags(escapeHtml(post.content));

    return `
        <div class="post" data-post-id="${post.id}">
            <div class="post-header">
                <img src="${avatarUrl}" alt="${post.username}" class="post-avatar">
                <div class="post-user-info">
                    <a href="/profile.html?username=${post.username}" class="post-username">${post.username}</a>
                    <span class="post-time">${formatDate(post.created_at)}</span>
                    ${post.updated_at !== post.created_at ? '<span class="post-edited">(edited)</span>' : ''}
                    ${visibilityHtml}
                </div>
                ${isOwner ? `
                    <div class="post-actions-menu">
                        <button class="btn-edit-post" data-post-id="${post.id}">Edit</button>
                        <button class="btn-delete-post" data-post-id="${post.id}">Delete</button>
                    </div>
                ` : `
                    <div class="post-actions-menu">
                        <button class="btn-report-post" data-post-id="${post.id}" data-user-id="${post.user_id}">🚩 Report</button>
                    </div>
                `}
            </div>
            <div class="post-content">${contentWithLinks}</div>
            ${mediaHtml}
            ${tagsHtml}
            <div class="post-footer">
                <button class="btn-reaction" data-post-id="${post.id}" data-reaction="like">
                    👍 Like <span class="reaction-count">${post.reaction_count || 0}</span>
                </button>
            </div>
        </div>
    `;
}

function linkifyHashtags(text) {
    return text.replace(/#(\w+)/g, '<span class="hashtag" onclick="filterByTag(\'$1\')">#$1</span>');
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function filterByTag(tagName) {
    loadPosts(tagName);
    // Update UI to show active filter
    const filterIndicator = document.getElementById('activeFilter');
    if (filterIndicator) {
        filterIndicator.innerHTML = `Filtering by: <span class="active-tag">#${tagName}</span> <button onclick="clearTagFilter()">Clear</button>`;
        filterIndicator.style.display = 'block';
    }
}

function clearTagFilter() {
    loadPosts();
    const filterIndicator = document.getElementById('activeFilter');
    if (filterIndicator) {
        filterIndicator.style.display = 'none';
    }
}

async function loadTrendingTags() {
    try {
        const response = await fetch('/api/tags/trending?limit=10');
        const tags = await response.json();

        const trendingContainer = document.getElementById('trendingTags');
        if (trendingContainer && tags.length > 0) {
            trendingContainer.innerHTML = `
                <h3>Trending Tags</h3>
                <div class="trending-tags-list">
                    ${tags.map(tag => `
                        <span class="trending-tag" onclick="filterByTag('${tag.name}')">
                            #${tag.name} <span class="tag-count">(${tag.use_count})</span>
                        </span>
                    `).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Load trending tags error:', error);
    }
}

function attachPostEventListeners() {
    // Edit post buttons
    document.querySelectorAll('.btn-edit-post').forEach(btn => {
        btn.addEventListener('click', handleEditPost);
    });

    // Delete post buttons
    document.querySelectorAll('.btn-delete-post').forEach(btn => {
        btn.addEventListener('click', handleDeletePost);
    });

    // Report post buttons
    document.querySelectorAll('.btn-report-post').forEach(btn => {
        btn.addEventListener('click', handleReportPost);
    });

    // Reaction buttons
    document.querySelectorAll('.btn-reaction').forEach(btn => {
        btn.addEventListener('click', handleReaction);
    });
}

async function handleEditPost(e) {
    const postId = e.target.dataset.postId;
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    const contentElement = postElement.querySelector('.post-content');
    const currentContent = contentElement.textContent;

    const newContent = prompt('Edit your post:', currentContent);
    if (!newContent || newContent === currentContent) return;

    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: newContent })
        });

        if (response.ok) {
            await loadPosts();
            await loadTrendingTags();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to edit post');
        }
    } catch (error) {
        console.error('Edit post error:', error);
        alert('Failed to edit post');
    }
}

async function handleDeletePost(e) {
    const postId = e.target.dataset.postId;

    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadPosts();
            await loadTrendingTags();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to delete post');
        }
    } catch (error) {
        console.error('Delete post error:', error);
        alert('Failed to delete post');
    }
}

async function handleReportPost(e) {
    const postId = e.target.dataset.postId;
    const userId = e.target.dataset.userId;

    const reason = prompt('Please provide a reason for reporting this post:');
    if (!reason || reason.trim().length === 0) return;

    try {
        const response = await fetch('/api/moderation/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                report_type: 'post',
                reported_user_id: parseInt(userId),
                content_id: parseInt(postId),
                reason: reason.trim()
            })
        });

        if (response.ok) {
            alert('Post reported successfully. Moderators will review your report.');
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to report post');
        }
    } catch (error) {
        console.error('Report post error:', error);
        alert('Failed to report post');
    }
}

async function handleReaction(e) {
    const postId = e.currentTarget.dataset.postId;
    const reactionType = e.currentTarget.dataset.reaction;

    try {
        const response = await fetch(`/api/posts/${postId}/react`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reaction_type: reactionType })
        });

        if (response.ok) {
            await loadPosts();
        }
    } catch (error) {
        console.error('Reaction error:', error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
