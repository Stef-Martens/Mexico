-- Migration: Coins, Shop, Cosmetics, Badges, Ad Fundums
-- Run this in Supabase SQL Editor

-- ─────────────────────────────────────────────────────────────
-- 1. Add coins to players
-- ─────────────────────────────────────────────────────────────
ALTER TABLE players ADD COLUMN IF NOT EXISTS coins int NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────
-- 2. Cosmetics table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cosmetics (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  type        text NOT NULL CHECK (type IN ('border_color','bg_gradient','avatar_ring','full_card')),
  value       text NOT NULL,   -- CSS value or JSON string for full_card
  preview     text NOT NULL,   -- CSS gradient string for shop swatch
  rarity      text NOT NULL CHECK (rarity IN ('common','rare','epic','legendary')),
  created_at  timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 3. Player cosmetics (inventory)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_cosmetics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  cosmetic_id uuid NOT NULL REFERENCES cosmetics(id) ON DELETE CASCADE,
  equipped    boolean NOT NULL DEFAULT false,
  obtained_at timestamptz DEFAULT now(),
  UNIQUE(player_id, cosmetic_id)
);

-- ─────────────────────────────────────────────────────────────
-- 4. Badges
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text NOT NULL,
  emoji           text NOT NULL,
  condition_type  text NOT NULL CHECK (condition_type IN (
                    'mexico_alltime','mexico_year',
                    'ad_fundum_completed','ad_fundum_assigned',
                    'cosmetics_owned','manual'
                  )),
  condition_value int,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_badges (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  badge_id   uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(player_id, badge_id)
);

-- ─────────────────────────────────────────────────────────────
-- 5. Ad Fundums
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_fundums (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_player_id       uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  assigned_by_player_id  uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  reason                 text,
  status                 text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  media_url              text,
  media_type             text CHECK (media_type IN ('image','video')),
  completed_at           timestamptz,
  created_at             timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_fundum_likes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_fundum_id  uuid NOT NULL REFERENCES ad_fundums(id) ON DELETE CASCADE,
  player_id     uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(ad_fundum_id, player_id)
);

CREATE TABLE IF NOT EXISTS ad_fundum_comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_fundum_id  uuid NOT NULL REFERENCES ad_fundums(id) ON DELETE CASCADE,
  player_id     uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content       text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 6. Enable RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE cosmetics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_cosmetics   ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_badges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_fundums         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_fundum_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_fundum_comments ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 7. RLS Policies
-- ─────────────────────────────────────────────────────────────

-- cosmetics: all members can read
CREATE POLICY "Members can read cosmetics"
  ON cosmetics FOR SELECT
  USING (EXISTS (SELECT 1 FROM app_members WHERE app_members.user_id = auth.uid()));

-- player_cosmetics
CREATE POLICY "Members can read player_cosmetics"
  ON player_cosmetics FOR SELECT
  USING (EXISTS (SELECT 1 FROM app_members WHERE app_members.user_id = auth.uid()));

CREATE POLICY "Members can insert own player_cosmetics"
  ON player_cosmetics FOR INSERT
  WITH CHECK (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

CREATE POLICY "Players can update own player_cosmetics"
  ON player_cosmetics FOR UPDATE
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- badges
CREATE POLICY "Members can read badges"
  ON badges FOR SELECT
  USING (EXISTS (SELECT 1 FROM app_members WHERE app_members.user_id = auth.uid()));

-- player_badges
CREATE POLICY "Members can read player_badges"
  ON player_badges FOR SELECT
  USING (EXISTS (SELECT 1 FROM app_members WHERE app_members.user_id = auth.uid()));

CREATE POLICY "Members can insert player_badges"
  ON player_badges FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM app_members WHERE app_members.user_id = auth.uid()));

-- ad_fundums
CREATE POLICY "Members can read ad_fundums"
  ON ad_fundums FOR SELECT
  USING (EXISTS (SELECT 1 FROM app_members WHERE app_members.user_id = auth.uid()));

CREATE POLICY "Members can insert ad_fundums"
  ON ad_fundums FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM app_members WHERE app_members.user_id = auth.uid()));

CREATE POLICY "Target player or admin can update ad_fundum"
  ON ad_fundums FOR UPDATE
  USING (
    target_player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM app_members
      WHERE app_members.user_id = auth.uid() AND app_members.is_admin = true
    )
  );

-- ad_fundum_likes
CREATE POLICY "Members can read ad_fundum_likes"
  ON ad_fundum_likes FOR SELECT
  USING (EXISTS (SELECT 1 FROM app_members WHERE app_members.user_id = auth.uid()));

CREATE POLICY "Players can insert own likes"
  ON ad_fundum_likes FOR INSERT
  WITH CHECK (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

CREATE POLICY "Players can delete own likes"
  ON ad_fundum_likes FOR DELETE
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- ad_fundum_comments
CREATE POLICY "Members can read ad_fundum_comments"
  ON ad_fundum_comments FOR SELECT
  USING (EXISTS (SELECT 1 FROM app_members WHERE app_members.user_id = auth.uid()));

CREATE POLICY "Players can insert own comments"
  ON ad_fundum_comments FOR INSERT
  WITH CHECK (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

CREATE POLICY "Players can delete own comments"
  ON ad_fundum_comments FOR DELETE
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- 8. Allow players to update their own coins (shop purchases)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "Players can update own record"
  ON players FOR UPDATE
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 9. Seed Cosmetics
-- ─────────────────────────────────────────────────────────────
INSERT INTO cosmetics (name, description, type, value, preview, rarity) VALUES
  -- Common: card border colors
  ('Cyan Spark',    'A cool cyan glow around your card',    'border_color', '#06b6d4', 'linear-gradient(135deg,#06b6d4,#0891b2)', 'common'),
  ('Rose Bloom',    'A vibrant rose border',                 'border_color', '#f43f5e', 'linear-gradient(135deg,#f43f5e,#e11d48)', 'common'),
  ('Amber Flash',   'A warm amber border',                   'border_color', '#f59e0b', 'linear-gradient(135deg,#f59e0b,#d97706)', 'common'),
  ('Emerald Glow',  'A lush emerald border',                 'border_color', '#10b981', 'linear-gradient(135deg,#10b981,#059669)', 'common'),
  ('Violet Haze',   'A dreamy violet border',                'border_color', '#8b5cf6', 'linear-gradient(135deg,#8b5cf6,#7c3aed)', 'common'),
  ('Coral Wave',    'Coral pink energy',                     'border_color', '#fb7185', 'linear-gradient(135deg,#fb7185,#f43f5e)', 'common'),
  -- Rare: card background gradients
  ('Ocean Depths',   'Deep ocean background',                'bg_gradient', 'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(59,130,246,0.2))',    'linear-gradient(135deg,#06b6d4,#3b82f6)', 'rare'),
  ('Sunset Haze',    'Warm sunset background',               'bg_gradient', 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(239,68,68,0.2))',     'linear-gradient(135deg,#f59e0b,#ef4444)', 'rare'),
  ('Forest Mist',    'Cool forest atmosphere',               'bg_gradient', 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(6,182,212,0.2))',     'linear-gradient(135deg,#10b981,#06b6d4)', 'rare'),
  ('Midnight Dream', 'Deep purple night',                    'bg_gradient', 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))',    'linear-gradient(135deg,#6366f1,#8b5cf6)', 'rare'),
  ('Cherry Blossom', 'Soft pink petals',                     'bg_gradient', 'linear-gradient(135deg,rgba(244,114,182,0.2),rgba(251,113,133,0.2))',  'linear-gradient(135deg,#f472b6,#fb7185)', 'rare'),
  -- Epic: avatar rings (gradient border around avatar)
  ('Fire Ring',     'Burning fire avatar ring',              'avatar_ring', 'linear-gradient(135deg,#f97316,#ef4444)', 'linear-gradient(135deg,#f97316,#ef4444)', 'epic'),
  ('Ice Ring',      'Frozen ice avatar ring',                'avatar_ring', 'linear-gradient(135deg,#22d3ee,#3b82f6)', 'linear-gradient(135deg,#22d3ee,#3b82f6)', 'epic'),
  ('Gold Ring',     'Shimmering gold avatar ring',           'avatar_ring', 'linear-gradient(135deg,#fbbf24,#f59e0b)', 'linear-gradient(135deg,#fbbf24,#f59e0b)', 'epic'),
  ('Electric Ring', 'Electric violet energy',                'avatar_ring', 'linear-gradient(135deg,#a78bfa,#6366f1)', 'linear-gradient(135deg,#a78bfa,#6366f1)', 'epic'),
  -- Legendary: full card makeover (JSON value with border + bg)
  ('Rainbow Storm', 'Full rainbow card',      'full_card', '{"border":"linear-gradient(135deg,#f43f5e,#f59e0b,#10b981,#06b6d4,#8b5cf6)","bg":"linear-gradient(135deg,rgba(244,63,94,0.12),rgba(99,102,241,0.12))"}', 'linear-gradient(135deg,#f43f5e,#f59e0b,#10b981,#06b6d4,#8b5cf6)', 'legendary'),
  ('Galaxy',        'Deep space galaxy',      'full_card', '{"border":"linear-gradient(135deg,#312e81,#4c1d95,#7e22ce)","bg":"linear-gradient(135deg,rgba(30,27,75,0.6),rgba(76,29,149,0.3))"}',                  'linear-gradient(135deg,#312e81,#4c1d95,#7e22ce)', 'legendary'),
  ('Blood Moon',    'Dark crimson card',      'full_card', '{"border":"linear-gradient(135deg,#7f1d1d,#dc2626,#7f1d1d)","bg":"linear-gradient(135deg,rgba(127,29,29,0.35),rgba(220,38,38,0.1))"}',              'linear-gradient(135deg,#7f1d1d,#dc2626)', 'legendary'),
  ('Diamond',       'Shimmering diamond',     'full_card', '{"border":"linear-gradient(135deg,#e2e8f0,#94a3b8,#f8fafc,#94a3b8)","bg":"linear-gradient(135deg,rgba(248,250,252,0.12),rgba(148,163,184,0.12))"}'  , 'linear-gradient(135deg,#e2e8f0,#94a3b8,#f8fafc)', 'legendary')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 10. Seed Badges
-- ─────────────────────────────────────────────────────────────
INSERT INTO badges (name, description, emoji, condition_type, condition_value) VALUES
  ('First Blood',      'Get your first Mexico ever',              '🩸', 'mexico_alltime',       1),
  ('El Borracho',      'Reach 10 Mexicos all time',               '🍺', 'mexico_alltime',       10),
  ('Mexico Regular',   'Reach 50 Mexicos all time',               '🎲', 'mexico_alltime',       50),
  ('Mexico Legend',    'Reach 250 Mexicos all time',              '👑', 'mexico_alltime',       250),
  ('Mexico God',       'Reach 1000 Mexicos all time',             '⚡', 'mexico_alltime',       1000),
  ('Hot Streak',       'Get 10 Mexicos in one year',              '🔥', 'mexico_year',           10),
  ('Year Dominator',   'Get 100 Mexicos in one year',             '💥', 'mexico_year',           100),
  ('Ad Fundum Done',   'Complete your first ad fundum',           '🍻', 'ad_fundum_completed',   1),
  ('Triple Fundum',    'Complete 3 ad fundums',                   '🏅', 'ad_fundum_completed',   3),
  ('The Punisher',     'Assign 3 ad fundums to others',           '😈', 'ad_fundum_assigned',    3),
  ('Collector',        'Own 5 cosmetics',                         '🎨', 'cosmetics_owned',       5)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SETUP NOTES
-- ─────────────────────────────────────────────────────────────
-- After running this migration:
-- 1. Create a storage bucket named "ad-fundums" in Supabase Storage
--    with public access enabled (for media uploads)
-- 2. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local
--    (find it in Supabase project settings > API > service_role key)
