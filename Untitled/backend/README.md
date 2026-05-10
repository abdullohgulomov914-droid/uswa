# Identity Shift Backend API

Backend API for the Identity Shift recovery app built with Node.js, Express, and SQLite.

## Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **User Management**: Streak tracking, XP/level system, brain stats
- **STAR+ Journal**: Track triggers, tackles, accountability, rewards
- **Relapse Logging**: Data-driven relapse analysis
- **Emergency Sessions**: Urge surfing session tracking
- **Community**: Anonymous posts and accountability partners

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Initialize Database

```bash
npm run db:init
```

### 3. Run Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### User
- `GET /api/user/me` - Get current user profile
- `PATCH /api/user/me` - Update profile
- `GET /api/user/stats` - Get dashboard stats
- `POST /api/user/relapse` - Record relapse (reset streak)
- `POST /api/user/check-in` - Daily check-in (increment streak)

### Journal (STAR+ System)
- `GET /api/journal` - List entries
- `POST /api/journal` - Create entry
- `GET /api/journal/:id` - Get single entry
- `PATCH /api/journal/:id` - Update entry
- `DELETE /api/journal/:id` - Delete entry
- `GET /api/journal/stats/triggers` - Get trigger analytics

### Relapse
- `GET /api/relapse` - List relapses
- `POST /api/relapse` - Log relapse
- `GET /api/relapse/stats` - Relapse statistics
- `DELETE /api/relapse/:id` - Delete relapse record

### Community
- `GET /api/community` - List posts (paginated)
- `POST /api/community` - Create post
- `GET /api/community/my-posts` - Get own posts
- `DELETE /api/community/:id` - Delete own post
- `GET /api/community/buddy` - Get accountability partner

### Emergency
- `POST /api/emergency/start` - Start urge surfing session
- `POST /api/emergency/complete/:id` - Complete session
- `GET /api/emergency/stats` - Session statistics
- `GET /api/emergency/tips` - Get quick action tips

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | JWT signing secret | (required) |
| `DB_PATH` | SQLite database path | ./data/app.db |

## Data Models

### User
- Streak tracking (current, longest)
- XP and level system
- Brain stats (dopamine sensitivity, prefrontal strength)

### Journal Entry (STAR+)
- Types: trigger, tackle, account, reward
- Trigger details (time, location, feeling)

### Emergency Session
- Start/completion tracking
- Success/failure logging
- Duration and technique used

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled server
- `npm run db:init` - Initialize database tables
