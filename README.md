# Birthday diagnosis site

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/techguru0411s-projects/v0-birthday-diagnosis-site)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/4IbCymVLwCd)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/techguru0411s-projects/v0-birthday-diagnosis-site](https://vercel.com/techguru0411s-projects/v0-birthday-diagnosis-site)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/4IbCymVLwCd](https://v0.app/chat/projects/4IbCymVLwCd)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Features

### Authentication System
- User registration and login
- Session management using JWT
- Password hashing with bcrypt
- Secure cookie-based sessions

### Database
- PostgreSQL database with Drizzle ORM
- User management schema
- Database migration support

### Pages
- **Top Page** (`/`): Simple landing page with navigation
- **Diagnosis Page** (`/diagnosis`): Birthday diagnosis feature

## Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your database URL and session secret
   - See `DATABASE_SETUP.md` for detailed instructions

3. Set up the database:
```bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:push
```

4. Run the development server:
```bash
npm run dev
```

For more details, see `DATABASE_SETUP.md`.
