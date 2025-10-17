-- Database Schema for 1socialChat

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_picture TEXT, -- Base64 encoded image
    links TEXT, -- JSON string of user links
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_type VARCHAR(20), -- 'image', 'video', or NULL for text-only
    media_data TEXT, -- Base64 encoded media
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chatrooms table
CREATE TABLE IF NOT EXISTS chatrooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_global BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chatroom_id INTEGER NOT NULL REFERENCES chatrooms(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post reactions table
CREATE TABLE IF NOT EXISTS post_reactions (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL, -- 'like', 'love', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id, reaction_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chatroom_id ON chat_messages(chatroom_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);

-- Insert default global chatroom
INSERT INTO chatrooms (name, is_global)
VALUES ('Global', true)
ON CONFLICT (name) DO NOTHING;
