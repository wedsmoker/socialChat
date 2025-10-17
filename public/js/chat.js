// Real-time chat functionality with Socket.io

let socket = null;
let currentChatroomId = null;
let typingTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chatSection')) {
        initializeChat();
    }
});

function initializeChat() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to chat server');
        loadChatrooms();
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
    });

    socket.on('joined_chatroom', (data) => {
        console.log('Joined chatroom:', data.chatroomName);
        loadMessages(data.chatroomId);
    });

    socket.on('new_message', (message) => {
        displayMessage(message);
    });

    socket.on('message_deleted', (data) => {
        removeMessage(data.messageId);
    });

    socket.on('user_typing', (data) => {
        showTypingIndicator(data.username);
    });

    socket.on('user_stop_typing', () => {
        hideTypingIndicator();
    });

    socket.on('error', (data) => {
        console.error('Socket error:', data.message);
        alert(data.message);
    });

    setupChatUI();
}

function setupChatUI() {
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const chatroomSelect = document.getElementById('chatroomSelect');
    const createChatroomBtn = document.getElementById('createChatroomBtn');
    const expandChatBtn = document.getElementById('expandChatBtn');
    const minimizeChatBtn = document.getElementById('minimizeChatBtn');

    sendMessageBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    messageInput.addEventListener('input', () => {
        handleTyping();
    });

    chatroomSelect.addEventListener('change', (e) => {
        const chatroomId = parseInt(e.target.value);
        switchChatroom(chatroomId);
    });

    createChatroomBtn.addEventListener('click', createChatroom);

    expandChatBtn.addEventListener('click', toggleChatExpansion);
    minimizeChatBtn.addEventListener('click', toggleChatMinimize);
}

async function loadChatrooms() {
    try {
        const response = await fetch('/api/chatrooms');
        const data = await response.json();

        const chatroomSelect = document.getElementById('chatroomSelect');
        chatroomSelect.innerHTML = data.chatrooms.map(room =>
            `<option value="${room.id}">${room.name}</option>`
        ).join('');

        // Join the first chatroom (Global by default)
        if (data.chatrooms.length > 0) {
            const firstChatroomId = data.chatrooms[0].id;
            chatroomSelect.value = firstChatroomId;
            switchChatroom(firstChatroomId);
        }
    } catch (error) {
        console.error('Load chatrooms error:', error);
    }
}

function switchChatroom(chatroomId) {
    if (currentChatroomId) {
        socket.emit('leave_chatroom', currentChatroomId);
    }

    currentChatroomId = chatroomId;
    socket.emit('join_chatroom', chatroomId);

    // Update chatroom name
    const select = document.getElementById('chatroomSelect');
    const selectedOption = select.options[select.selectedIndex];
    document.getElementById('currentChatroomName').textContent = selectedOption.text;
}

async function loadMessages(chatroomId) {
    try {
        const response = await fetch(`/api/chatrooms/${chatroomId}/messages?limit=100`);
        const data = await response.json();

        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';

        data.messages.forEach(message => {
            displayMessage(message, false);
        });

        scrollToBottom();
    } catch (error) {
        console.error('Load messages error:', error);
    }
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (!message) return;

    socket.emit('send_message', {
        chatroomId: currentChatroomId,
        message
    });

    messageInput.value = '';
    socket.emit('stop_typing', { chatroomId: currentChatroomId });
}

function displayMessage(message, scrollDown = true) {
    const chatMessages = document.getElementById('chatMessages');
    const isOwn = currentUser && message.user_id === currentUser.id;

    const avatarUrl = message.profile_picture || `https://ui-avatars.com/api/?name=${message.username}&background=random`;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isOwn ? 'own-message' : ''}`;
    messageDiv.dataset.messageId = message.id;

    messageDiv.innerHTML = `
        <img src="${avatarUrl}" alt="${message.username}" class="message-avatar">
        <div class="message-content">
            <div class="message-header">
                <a href="/profile.html?username=${message.username}" class="message-username">${message.username}</a>
                <span class="message-time">${formatDate(message.created_at)}</span>
            </div>
            <div class="message-text">${escapeHtml(message.message)}</div>
            ${isOwn ? `<button class="btn-delete-message" data-message-id="${message.id}">Delete</button>` : ''}
        </div>
    `;

    chatMessages.appendChild(messageDiv);

    // Attach delete listener
    if (isOwn) {
        const deleteBtn = messageDiv.querySelector('.btn-delete-message');
        deleteBtn.addEventListener('click', () => deleteMessage(message.id));
    }

    if (scrollDown) {
        scrollToBottom();
    }
}

function deleteMessage(messageId) {
    if (!confirm('Delete this message?')) return;

    socket.emit('delete_message', {
        messageId,
        chatroomId: currentChatroomId
    });
}

function removeMessage(messageId) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        messageElement.remove();
    }
}

function handleTyping() {
    socket.emit('typing', { chatroomId: currentChatroomId });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stop_typing', { chatroomId: currentChatroomId });
    }, 1000);
}

function showTypingIndicator(username) {
    const typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.querySelector('span').textContent = `${username} is typing...`;
    typingIndicator.style.display = 'block';

    setTimeout(hideTypingIndicator, 3000);
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.style.display = 'none';
}

function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function createChatroom() {
    const name = prompt('Enter chatroom name:');
    if (!name) return;

    try {
        const response = await fetch('/api/chatrooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            await loadChatrooms();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to create chatroom');
        }
    } catch (error) {
        console.error('Create chatroom error:', error);
        alert('Failed to create chatroom');
    }
}

function toggleChatExpansion() {
    const chatSection = document.getElementById('chatSection');

    // Remove minimized if it's minimized
    if (chatSection.classList.contains('minimized')) {
        chatSection.classList.remove('minimized');
    }

    chatSection.classList.toggle('expanded');

    const expandBtn = document.getElementById('expandChatBtn');
    expandBtn.textContent = chatSection.classList.contains('expanded') ? '⬇️' : '⬆️';
}

function toggleChatMinimize() {
    const chatSection = document.getElementById('chatSection');
    const minimizeBtn = document.getElementById('minimizeChatBtn');

    chatSection.classList.toggle('minimized');

    // Remove expanded class if minimizing
    if (chatSection.classList.contains('minimized')) {
        chatSection.classList.remove('expanded');
        minimizeBtn.textContent = '➕';
    } else {
        minimizeBtn.textContent = '➖';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
