# Mexico App - Setup and Implementation Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Supabase Setup

#### A. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to be provisioned

#### B. Enable Google OAuth

1. Go to **Authentication** > **Providers**
2. Enable **Google** provider
3. Follow Supabase docs to set up Google OAuth credentials:
   - Create OAuth credentials in Google Cloud Console
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Add Client ID and Secret to Supabase

#### C. Run Database Schema

1. Go to **SQL Editor** in Supabase
2. Open [`/supabase/schema.sql`](supabase/schema.sql)
3. Copy and paste the entire SQL script
4. Click **Run** to execute

This will create:

- `players` table with 5 default players
- `mexico_events` table for tracking Mexico throws
- `app_members` table for access control
- RLS policies for security

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Find these values in Supabase:

- Go to **Project Settings** > **API**
- Copy the **Project URL** and **anon/public** key

### 4. Add App Members

After signing in for the first time, you need to add your user to `app_members`:

**Option 1: SQL Query (Manual)**

1. Sign in to the app once
2. Go to Supabase **SQL Editor**
3. Run:

```sql
-- Get your user ID first
SELECT id, email FROM auth.users;

-- Add yourself as an app member
INSERT INTO app_members (user_id)
VALUES ('paste-your-user-id-here');
```

**Option 2: Self-Registration (Already enabled)**
The schema includes a policy allowing users to self-insert into `app_members`. The first time you sign in, you can automatically grant yourself access.

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📊 How Time Filtering Works

### Overview

The app provides 4 leaderboard time ranges:

- **Tonight** - Same calendar day
- **This Week** - From Monday of current week
- **This Year** - From January 1st
- **All Time** - All events ever

### Timezone Handling

All time calculations use **Europe/Brussels** timezone (UTC+1/UTC+2 with DST).

#### Implementation in `lib/time-ranges.ts`

```typescript
export function getStartDateForRange(range: TimeRange): string | null {
  const now = new Date();

  // Convert to Europe/Brussels timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  const year = parseInt(get("year")!);
  const month = parseInt(get("month")!);
  const day = parseInt(get("day")!);

  switch (range) {
    case "tonight":
      // Start of today in Brussels timezone
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+01:00`;

    case "week":
      // Calculate start of week (Monday)
      const todayInBrussels = new Date(year, month - 1, day);
      const dayOfWeek = todayInBrussels.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(todayInBrussels);
      monday.setDate(monday.getDate() - daysToMonday);

      return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}T00:00:00+01:00`;

    case "year":
      // Start of this year
      return `${year}-01-01T00:00:00+01:00`;

    case "all":
      return null; // No filter
  }
}
```

### Database Query

The leaderboard query in `lib/queries.ts` uses these timestamps:

```typescript
export async function getLeaderboard(startDate: string | null) {
  const supabase = await createClient();

  let query = supabase.from("mexico_events").select(`
      player_id,
      players!inner(name)
    `);

  // Apply time filter if provided
  if (startDate) {
    query = query.gte("created_at", startDate);
  }

  const { data, error } = await query;

  // Aggregate by player
  const aggregated = (data || []).reduce(
    (acc, row) => {
      const playerId = row.player_id;
      const playerName = (row.players as any).name;

      if (!acc[playerId]) {
        acc[playerId] = {
          player_id: playerId,
          player_name: playerName,
          mexico_count: 0,
        };
      }
      acc[playerId].mexico_count++;
      return acc;
    },
    {} as Record<string, LeaderboardEntry>,
  );

  // Sort by count descending
  return Object.values(aggregated).sort(
    (a, b) => b.mexico_count - a.mexico_count,
  );
}
```

### Why This Approach?

1. **Timezone-aware:** Uses Brussels timezone for "tonight" calculations
2. **Simple:** Single timestamp comparison, no complex date math
3. **Efficient:** Postgres handles the filtering
4. **Accurate:** Respects DST changes

---

## 🔒 Security (RLS Policies)

### How It Works

1. **Authentication:** Users sign in with Google OAuth
2. **Access Control:** Only users in `app_members` can access the app
3. **RLS Enforcement:** Postgres Row Level Security enforces access at the database level

### Policy Details

**app_members:**

- Users can read their own row
- Users can insert their own row (self-registration)

**players & mexico_events:**

- Only users who exist in `app_members` can SELECT
- Only users who exist in `app_members` can INSERT

```sql
CREATE POLICY "Authenticated members can read players"
  ON players
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_members
      WHERE app_members.user_id = auth.uid()
    )
  );
```

This ensures:

- Unauthenticated users cannot access data
- Authenticated but unauthorized users cannot access data
- Only approved members can use the app

---

## 🏗️ Architecture

### Auth Flow

1. User clicks "Continue with Google" on `/login`
2. Supabase redirects to Google OAuth
3. Google redirects back to `/auth/callback` with code
4. Callback exchanges code for session
5. Middleware refreshes session on each request
6. Server Components check `app_members` access

### Data Flow

**Logging a Mexico:**

1. User clicks "+1 Mexico" button (Client Component)
2. POST request to `/api/mexico`
3. API route calls `logMexico()` (Server)
4. Insert into `mexico_events` table
5. Page refreshes to show updated leaderboard

**Viewing Leaderboards:**

1. Server Component fetches data from Supabase
2. Time range utility calculates start date
3. Query filters `mexico_events` by `created_at`
4. Aggregates by player and sorts
5. Renders leaderboard

### Key Files

| File                         | Purpose                                          |
| ---------------------------- | ------------------------------------------------ |
| `lib/supabase/server.ts`     | Server-side Supabase client with cookie handling |
| `lib/supabase/client.ts`     | Browser Supabase client for auth actions         |
| `lib/supabase/middleware.ts` | Session refresh logic                            |
| `middleware.ts`              | Next.js middleware for auth protection           |
| `lib/queries.ts`             | Database query functions                         |
| `lib/time-ranges.ts`         | Time filtering utilities                         |

---

## 📱 Mobile-First Design

- Large touch targets (h-14 buttons)
- Responsive grid layout
- Clear visual hierarchy
- Fast interactions
- No animations (as requested)

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Update Google OAuth redirect URIs:
   - Add `https://your-app.vercel.app/auth/callback`
5. Deploy!

### Post-Deployment

1. Update Supabase Google OAuth settings with production URL
2. Test sign-in flow
3. Add team members to `app_members` table

---

## 🛠️ Customization

### Adding More Players

```sql
INSERT INTO players (name) VALUES ('New Player Name');
```

### Changing Default Players

Edit `supabase/schema.sql` before running it, or delete/add players manually.

### Adjusting Time Ranges

Edit `lib/time-ranges.ts` to change timezone or add new ranges.

---

## 📝 Notes

- No sessions tracking (as requested)
- No undo functionality (as requested)
- No realtime sync (as requested)
- No extra dice rules (Mexico only!)
- Uses `@supabase/ssr` (not deprecated auth-helpers)

Enjoy your Mexico game tracking! 🎲
