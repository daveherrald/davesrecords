# Dave's Records - Vinyl Collection Viewer

A beautiful, mobile-first web application for sharing vinyl collections from Discogs via QR code.

## Features

- Scan a QR code to instantly browse a vinyl collection on mobile
- Beautiful album art grid view
- Search, filter, and sort functionality
- Detailed album information
- Secure Discogs OAuth integration
- Mobile-first, responsive design

## Project Status

### Phase 1: Project Setup ✓
- Next.js 15 + TypeScript + Tailwind CSS
- shadcn/ui components
- Prisma with PostgreSQL
- Environment configuration

### Phase 2: Authentication ✓
- Custom Discogs OAuth 1.0a flow
- Encrypted token storage
- Session management
- Sign-in & error pages

### Phase 3: Discogs API Integration ✓
- Discogs API client wrapper
- Collection fetching with caching
- Rate limiting
- TypeScript types

### Phase 4: User Dashboard & QR System ✓
- User dashboard with collection info
- QR code generation & download
- User settings page
- Settings API endpoint

### Phase 5: Collection Viewer UI ✓
- Public collection viewer (mobile-first)
- Album grid with optimized images
- Search functionality
- Filter panel (year, format, genre)
- Sort options
- Album detail modal

### Phase 6: Polish ✓
- Loading skeletons
- Empty states
- Responsive design
- Build successful

## Setup Instructions

### 1. Environment Variables

Copy the example file:
```bash
cp .env.example .env.local
```

Configure these variables in `.env.local`:

**Discogs API** - Get from https://www.discogs.com/settings/developers
```
DISCOGS_CONSUMER_KEY="your_key"
DISCOGS_CONSUMER_SECRET="your_secret"
```

**Database** - Vercel Postgres or local PostgreSQL
```
POSTGRES_PRISMA_URL="postgresql://..."
```

**Cache** - Vercel KV or local Redis
```
KV_URL="redis://..."
```

**Secrets** - Generate with `openssl rand -base64 32`
```
NEXTAUTH_SECRET="..."
ENCRYPTION_KEY="..."
```

**URLs**
```
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Database Setup

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 3. Run Development Server

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Auth**: Custom OAuth 1.0a
- **Hosting**: Vercel (planned)

## Available Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Lint code
npx prisma studio    # Database GUI
```

## Documentation

See detailed implementation plan at `.claude/plans/inherited-roaming-lighthouse.md`
