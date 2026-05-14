# DRIP - Plateforme Sociale Mode Streetwear

## Overview
DRIP est une plateforme sociale immersive dédiée à la mode streetwear. Les utilisateurs partagent leurs looks en photo, likent les styles qui les inspirent, suivent les tendances et connectent avec la communauté mode.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **UI**: Tailwind CSS v4 + shadcn/ui (Radix UI)
- **Icons**: Lucide React
- **Fonts**: Google Fonts (Syne, Space Grotesk)

## Directory Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Feed TikTok style)
│   │   ├── upload/page.tsx
│   │   ├── ranking/page.tsx
│   │   ├── trends/page.tsx
│   │   └── profile/
│   │       ├── [username]/page.tsx
│   │       └── edit/page.tsx
│   ├── api/
│   │   ├── likes/route.ts
│   │   ├── follows/route.ts
│   │   ├── upload/route.ts
│   │   └── upload-avatar/route.ts
│   └── layout.tsx
├── components/
│   ├── bottom-nav.tsx
│   ├── follow-button.tsx
│   ├── like-button.tsx
│   ├── look-card.tsx
│   └── user-avatar.tsx
├── hooks/
│   └── useAuth.tsx
├── integrations/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
└── types/
    └── index.ts
```

## Database Schema

### Tables
- **profiles**: id, username, bio, avatar_url, created_at
- **looks**: id, user_id, image_url, description, likes_count, created_at
- **likes**: id, user_id, look_id, created_at (UNIQUE user_id + look_id)
- **follows**: id, follower_id, following_id, created_at (UNIQUE follower_id + following_id)

### RLS Policies
- Profiles: Public read, owner write
- Looks: Public read, authenticated create, owner delete
- Likes: Public read, authenticated create/delete
- Follows: Public read, authenticated create/delete

### Triggers
- Auto-create profile on user signup
- Increment/decrement likes_count on look

## Core Systems

### Authentication
- **Status**: Implemented
- **Location**: src/hooks/useAuth.tsx
- **Features**: Email/password signup, login, logout, session management
- **Protected routes**: /upload, /profile/edit

### Feed Principal
- **Status**: Implemented
- **Location**: src/app/(main)/page.tsx
- **Features**: Full-screen vertical scroll style TikTok, infinite scroll ready

### Upload de Looks
- **Status**: Implemented
- **Location**: src/app/(main)/upload/page.tsx
- **Features**: Drag & drop, validation image (5MB max), hashtag preview

### Système de Likes
- **Status**: Implemented
- **Location**: src/app/api/likes/route.ts, src/components/like-button.tsx
- **Features**: Toggle AJAX, mise à jour optimiste, animation cœur

### Profil Utilisateur
- **Status**: Implemented
- **Location**: src/app/(main)/profile/[username]/page.tsx
- **Features**: Stats (looks, likes, followers, following), grille looks

### Système de Follows
- **Status**: Implemented
- **Location**: src/app/api/follows/route.ts, src/components/follow-button.tsx
- **Features**: Toggle AJAX, mise à jour compteur

### Classements
- **Status**: Implemented
- **Location**: src/app/(main)/ranking/page.tsx
- **Features**: Top 10 looks semaine, podium visuel or/argent/bronze

### Tendances
- **Status**: Implemented
- **Location**: src/app/(main)/trends/page.tsx
- **Features**: Extraction hashtags, classement 7 derniers jours, navigation par tag

## Design System

### Colors
- **Primary (Accent)**: #FF3B5C
- **Secondary (Gold)**: #FFC107
- **Background**: #0a0a0a
- **Surface**: #141414
- **Text**: #ffffff / #888888

### Typography
- **Headings**: Syne (Google Fonts)
- **Body**: Space Grotesk (Google Fonts)

## Current State
- [x] Authentification (register, login, logout)
- [x] Feed style TikTok vertical
- [x] Upload de looks avec validation
- [x] Système de likes AJAX
- [x] Pages profil utilisateur
- [x] Système de follows AJAX
- [x] Classements Top 10
- [x] Page tendances hashtags
- [x] Édition profil
- [x] Bottom navigation

## Maintenance Log
- 2026-05-12: Initial DRIP application setup with authentication, feed, upload, likes, follows, rankings and trends features
