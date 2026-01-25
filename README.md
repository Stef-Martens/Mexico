# Mexico - Dice Game Tracker

A mobile-first web app for tracking Mexico (2-1) dice game scores.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Database & Auth:** Supabase (Postgres + Auth)
- **Auth Library:** @supabase/ssr (Next.js App Router pattern)

## Features

- 🔐 Google OAuth authentication
- 👥 Player management
- 🎲 Quick Mexico event logging
- 📊 Time-based leaderboards (Tonight, Week, Year, All Time)
- 📱 Mobile-first responsive design
- 🔒 Access control via app_members table

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase account and project

### Setup

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up Supabase:**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Enable Google OAuth provider in Authentication > Providers
   - Run the SQL schema in the Supabase SQL Editor (see `/supabase/schema.sql`)

3. **Configure environment variables:**

   Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

   ```bash
   cp .env.local.example .env.local
   ```

   Update the values:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Add users to app_members:**

   After a user signs in for the first time, add them to the `app_members` table:

   ```sql
   INSERT INTO app_members (user_id)
   VALUES ('user-uuid-from-auth-users');
   ```

   Or enable the self-insert policy in the schema to allow automatic access.

5. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /api/mexico        # API route for logging Mexico events
  /auth
    /callback        # OAuth callback handler
  /leaderboard       # Leaderboard page with tabs
  /login             # Login page
  page.tsx           # Home page with players
  layout.tsx         # Root layout
  globals.css        # Global styles

/components
  /ui                # shadcn/ui components
  leaderboard.tsx    # Leaderboard display component
  leaderboard-client.tsx  # Client-side tabs
  player-card.tsx    # Player card with +1 button
  sign-out-button.tsx     # Sign out button

/lib
  /supabase
    client.ts        # Browser client (@supabase/ssr)
    server.ts        # Server client (@supabase/ssr)
    middleware.ts    # Middleware for auth refresh
  queries.ts         # Database queries
  time-ranges.ts     # Time filtering utilities
  utils.ts           # Utility functions

/supabase
  schema.sql         # Database schema and RLS policies

middleware.ts        # Next.js middleware for auth
```

## Database Schema

### Tables

- **players:** Player list
- **mexico_events:** Mexico throws/events
- **app_members:** Access control

### RLS Policies

Row Level Security ensures only authenticated app members can:

- Read and insert players
- Read and insert mexico_events
- Read their own app_members row

## Time Filtering

Leaderboards use the Europe/Brussels timezone for date calculations:

- **Tonight:** Events from midnight today (Brussels time)
- **This Week:** Events from Monday of current week
- **This Year:** Events from January 1st
- **All Time:** All events ever recorded

## Development Notes

- Uses `@supabase/ssr` for proper cookie handling in Next.js App Router
- Middleware refreshes auth sessions automatically
- Server Components fetch data directly from Supabase
- Client Components handle interactive elements (buttons, tabs)
- Mobile-first design with large touch targets

## Deployment

This app can be deployed to Vercel, Netlify, or any platform supporting Next.js:

1. Push code to GitHub
2. Connect to your deployment platform
3. Add environment variables
4. Deploy

## License

MIT
