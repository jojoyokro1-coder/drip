# DRIP - Plateforme Sociale Mode Streetwear

## 1. Concept & Vision

DRIP est une plateforme sociale immersive dédiée à la mode streetwear. Les utilisateurs partagent leurs looks en photo, likent les styles qui les inspirent, suivent les tendances et connectent avec la communauté mode. L'expérience est centrée sur un feed vertical full-screen style TikTok, avec une esthétique sombre et audacieuse.

## 2. Design Language

### Aesthetic Direction
Style "Dark Luxe Street" - fond très sombre avec accents rouges vibrants et touches dorées. Ambiance premium underground streetwear.

### Color Palette
- **Primary (Accent):** `#FF3B5C` - Rouge vibrant pour likes, CTA, highlights
- **Secondary (Gold):** `#FFC107` - Or pour classements, badges, podium
- **Background:** `#0a0a0a` - Noir profond
- **Surface:** `#141414` - Cartes et containers
- **Surface Hover:** `#1a1a1a` - États hover
- **Text Primary:** `#ffffff`
- **Text Secondary:** `#888888`
- **Border:** `#2a2a2a`

### Typography
- **Headings:** Syne (Google Fonts) - Bold, moderne, streetwear vibes
- **Body:** Space Grotesk (Google Fonts) - Lisible, contemporain
- **Fallback:** system-ui, sans-serif

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64
- Border radius: 8px (cards), 12px (buttons), 9999px (pills)
- Max content width: 480px (mobile-first feed)

### Motion Philosophy
- Transitions: 200ms ease-out
- Like animation: Scale bounce 1.2 → 1.0
- Page transitions: Fade 150ms
- Skeleton loading pour images

### Visual Assets
- Icons: Lucide React (outline style)
- Images: Uploads utilisateur stockés dans Supabase Storage
- Avatar placeholder: Gradient rouge/or

## 3. Layout & Structure

### Pages
1. **/** - Feed principal (looks récents, swipe vertical)
2. **/auth** - Toggle inscription/connexion
3. **/upload** - Formulaire upload look
4. **/profile/[username]** - Profil utilisateur public
5. **/profile/edit** - Édition profil (protégé)
6. **/ranking** - Top 10 looks semaine
7. **/trends** - Hashtags populaires

### Navigation
- Bottom navigation mobile: Feed, Upload (+), Ranking, Profil
- Header avec logo DRIP et actions contextuelles

### Responsive Strategy
- Mobile-first (375px-480px optimal)
- Tablet: 2 colonnes dans grille profil
- Desktop: Max-width 480px centré pour feed

## 4. Features & Interactions

### Authentification
- Inscription: pseudo, email, mot de passe
- Connexion: email + mot de passe
- Sessions gérées par Supabase Auth
- Mots de passe hashés (bcrypt via Supabase)
- Protection routes via middleware

### Upload Look
- Photo obligatoire (drag & drop ou click)
- Description optionnelle (max 500 chars)
- Extraction automatique #hashtags
- Validation: image uniquement, max 5MB
- Preview avant submit
- Upload vers Supabase Storage

### Feed Principal
- Affichage vertical full-screen style TikTok
- Swipe ou scroll pour naviguer
- Photo look en fond (cover)
- Overlay: pseudo, description, likes
- Actions: like, commenter (future), share (future)

### Système de Likes
- Toggle like via API route (POST /api/likes)
- Compteur mis à jour en temps réel
- Animation cœur pulsant
- État liké visible (rempli vs outline)

### Profil Utilisateur
- Photo avatar + pseudo + bio
- Stats: looks postés, total likes reçus, followers, following
- Grille 3 colonnes des looks postés
- Bouton Suivre/Ne plus suivre (si pas propre profil)

### Système de Follows
- Toggle follow via API route (POST /api/follows)
- Mise à jour instantanée compteur
- Notifications follow (future)

### Classements
- Top 10 looks de la semaine (par likes)
- Podium visuel: or, argent, bronze
- Badge "Top de la semaine" sur looks

### Tendances
- Extraction hashtags des descriptions
- Classement hashtags 7 derniers jours
- Liste looks par hashtag

## 5. Component Inventory

### Button
- **Default:** bg-primary text-white rounded-xl
- **Hover:** brightness-110
- **Disabled:** opacity-50 cursor-not-allowed
- **Loading:** spinner + texte "Chargement..."
- **Variants:** primary (red), secondary (outline), ghost

### Input
- **Default:** bg-surface border-border rounded-lg
- **Focus:** ring-2 ring-primary
- **Error:** border-destructive
- **Disabled:** opacity-50

### Card (Look)
- Full-screen ou grid selon contexte
- Image cover avec overlay gradient
- Actions en overlay bas droite
- Badge hashtag en haut gauche

### Avatar
- **Sizes:** sm (32px), md (48px), lg (80px)
- **Fallback:** Initiales sur gradient
- **Online indicator:** future

### NavBar (Bottom)
- 4 items: Home, Upload, Trophy, User
- Active state: icon filled + text primary
- Upload: FAB style (cercle rouge accent)

### Modal/Sheet
- Overlay semi-transparent
- Slide up animation
- Close on overlay click

### Skeleton
- Pulse animation gris
- Formes: avatar, card, text lines

## 6. Technical Approach

### Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Components:** Radix UI + shadcn/ui
- **Auth & DB:** Supabase (@supabase/supabase-js)
- **Icons:** Lucide React

### Architecture
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/
│   │   ├── page.tsx (feed)
│   │   ├── upload/page.tsx
│   │   ├── ranking/page.tsx
│   │   ├── trends/page.tsx
│   │   └── profile/
│   │       ├── [username]/page.tsx
│   │       └── edit/page.tsx
│   ├── api/
│   │   ├── likes/route.ts
│   │   ├── follows/route.ts
│   │   └── upload/route.ts
│   └── layout.tsx
├── components/
│   ├── look-card.tsx
│   ├── look-grid.tsx
│   ├── user-avatar.tsx
│   ├── follow-button.tsx
│   ├── like-button.tsx
│   └── bottom-nav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── utils.ts
└── types/
    └── index.ts
```

### Database Schema (Supabase)

**users** (via Supabase Auth + profiles)
```sql
profiles: id (uuid), username, bio, avatar_url, created_at
```

**looks**
```sql
id: uuid
user_id: uuid (references profiles)
image_url: text
description: text
created_at: timestamp
```

**likes**
```sql
id: uuid
user_id: uuid
look_id: uuid
created_at: timestamp
UNIQUE(user_id, look_id)
```

**follows**
```sql
id: uuid
follower_id: uuid
following_id: uuid
created_at: timestamp
UNIQUE(follower_id, following_id)
```

### API Endpoints

**POST /api/likes**
- Body: { lookId: string }
- Response: { liked: boolean, count: number }

**POST /api/follows**
- Body: { userId: string }
- Response: { following: boolean, count: number }

**POST /api/upload**
- Body: FormData (image, description)
- Response: { look: Look }

### Security
- Row Level Security sur toutes les tables
- Validation côté serveur de tous les inputs
- Rate limiting sur endpoints sensibles
- CSRF protection via Supabase
