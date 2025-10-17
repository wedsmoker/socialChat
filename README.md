# 1socialChat

A fullstack social media platform with real-time chatroom functionality.

## Features

- User authentication (username/password)
- Customizable user profiles (bio, profile picture, links)
- Post text, images, and videos (up to 10MB)
- Edit and delete posts
- Real-time global chatroom
- User-created chatrooms
- Post reactions
- Clickable usernames linking to profiles

## Tech Stack

- **Backend**: Node.js, Express, Socket.io
- **Database**: PostgreSQL
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Auth**: bcrypt password hashing, express-session

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example` and configure your database connection.

3. Set up PostgreSQL database:
```bash
psql -U postgres
CREATE DATABASE socialchat;
```

4. Run the database schema (see server/schema.sql)

5. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

6. Open http://localhost:3000

## Deployment

Ready for Railway deployment with PostgreSQL plugin.
