-- Migration: More cosmetics variety
-- Run this in Supabase SQL Editor AFTER migration_coins_shop_adfundum.sql

-- ─────────────────────────────────────────────────────────────
-- 1. Extend the type CHECK constraint to allow new cosmetic types
-- ─────────────────────────────────────────────────────────────
ALTER TABLE cosmetics DROP CONSTRAINT IF EXISTS cosmetics_type_check;
ALTER TABLE cosmetics
  ADD CONSTRAINT cosmetics_type_check
  CHECK (type IN (
    'border_color',
    'bg_gradient',
    'avatar_ring',
    'full_card',
    'card_glow',
    'avatar_badge',
    'card_title'
  ));

-- ─────────────────────────────────────────────────────────────
-- 2. More border_color (common)
-- ─────────────────────────────────────────────────────────────
INSERT INTO cosmetics (name, description, type, value, preview, rarity) VALUES
  ('Sky Blue',    'Clear sky blue border',      'border_color', '#38bdf8', 'linear-gradient(135deg,#38bdf8,#0ea5e9)', 'common'),
  ('Lime Burst',  'Electric lime green border', 'border_color', '#84cc16', 'linear-gradient(135deg,#84cc16,#65a30d)', 'common'),
  ('Hot Pink',    'Loud hot pink border',        'border_color', '#ec4899', 'linear-gradient(135deg,#ec4899,#db2777)', 'common'),
  ('Deep Orange', 'Warm deep orange border',     'border_color', '#f97316', 'linear-gradient(135deg,#f97316,#ea580c)', 'common'),
  ('Teal Rush',   'Cool teal border',            'border_color', '#14b8a6', 'linear-gradient(135deg,#14b8a6,#0d9488)', 'common'),
  ('Indigo Pop',  'Rich indigo border',          'border_color', '#6366f1', 'linear-gradient(135deg,#6366f1,#4f46e5)', 'common')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 3. More bg_gradient (rare)
-- ─────────────────────────────────────────────────────────────
INSERT INTO cosmetics (name, description, type, value, preview, rarity) VALUES
  ('Lava Flow',        'Burning lava background',        'bg_gradient', 'linear-gradient(135deg,rgba(239,68,68,0.22),rgba(245,158,11,0.22))',  'linear-gradient(135deg,#ef4444,#f59e0b)', 'rare'),
  ('Northern Lights',  'Aurora borealis background',     'bg_gradient', 'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(16,185,129,0.2),rgba(99,102,241,0.2))', 'linear-gradient(135deg,#06b6d4,#10b981,#6366f1)', 'rare'),
  ('Cotton Candy',     'Sweet pastel gradient',          'bg_gradient', 'linear-gradient(135deg,rgba(244,114,182,0.22),rgba(167,139,250,0.22))', 'linear-gradient(135deg,#f472b6,#a78bfa)', 'rare'),
  ('Deep Sea',         'Dark abyssal ocean',             'bg_gradient', 'linear-gradient(135deg,rgba(15,23,42,0.6),rgba(6,182,212,0.15))',       'linear-gradient(135deg,#0f172a,#06b6d4)', 'rare'),
  ('Moss & Stone',     'Earthy natural gradient',        'bg_gradient', 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(120,113,108,0.25))',  'linear-gradient(135deg,#10b981,#78716c)', 'rare')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 4. More avatar_ring (epic)
-- ─────────────────────────────────────────────────────────────
INSERT INTO cosmetics (name, description, type, value, preview, rarity) VALUES
  ('Nature Ring',  'Fresh nature green ring',    'avatar_ring', 'linear-gradient(135deg,#84cc16,#10b981)', 'linear-gradient(135deg,#84cc16,#10b981)', 'epic'),
  ('Sunset Ring',  'Vibrant sunset ring',        'avatar_ring', 'linear-gradient(135deg,#f97316,#ec4899)', 'linear-gradient(135deg,#f97316,#ec4899)', 'epic'),
  ('Toxic Ring',   'Glowing toxic green ring',   'avatar_ring', 'linear-gradient(135deg,#22c55e,#84cc16)', 'linear-gradient(135deg,#22c55e,#84cc16)', 'epic'),
  ('Blood Ring',   'Deep crimson ring',          'avatar_ring', 'linear-gradient(135deg,#dc2626,#9f1239)', 'linear-gradient(135deg,#dc2626,#9f1239)', 'epic')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 5. Card Glow (rare/epic) — glowing box-shadow around the card
-- ─────────────────────────────────────────────────────────────
INSERT INTO cosmetics (name, description, type, value, preview, rarity) VALUES
  ('Neon Blue',    'Electric neon blue glow',    'card_glow', '0 0 18px 5px rgba(6,182,212,0.55), 0 0 35px 10px rgba(6,182,212,0.2)',      'linear-gradient(135deg,#06b6d4,#0891b2)', 'rare'),
  ('Crimson Aura', 'Burning crimson aura',       'card_glow', '0 0 18px 5px rgba(239,68,68,0.55), 0 0 35px 10px rgba(239,68,68,0.2)',      'linear-gradient(135deg,#ef4444,#b91c1c)', 'rare'),
  ('Toxic Glow',   'Radioactive toxic glow',     'card_glow', '0 0 18px 5px rgba(34,197,94,0.6),  0 0 40px 12px rgba(34,197,94,0.25)',     'linear-gradient(135deg,#22c55e,#16a34a)', 'epic'),
  ('Solar Flare',  'Multi-color solar explosion','card_glow', '0 0 18px 5px rgba(245,158,11,0.6), 0 0 40px 12px rgba(239,68,68,0.3)',      'linear-gradient(135deg,#f59e0b,#ef4444)', 'epic'),
  ('Void Pulse',   'Deep space void energy',     'card_glow', '0 0 18px 5px rgba(139,92,246,0.6), 0 0 40px 12px rgba(99,102,241,0.3)',     'linear-gradient(135deg,#8b5cf6,#6366f1)', 'epic'),
  ('Holy Aura',    'Blinding white divine glow', 'card_glow', '0 0 18px 5px rgba(248,250,252,0.5),0 0 40px 12px rgba(203,213,225,0.25)',   'linear-gradient(135deg,#f8fafc,#94a3b8)', 'legendary')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 6. Avatar Badge (common/rare) — emoji pinned to avatar corner
-- ─────────────────────────────────────────────────────────────
INSERT INTO cosmetics (name, description, type, value, preview, rarity) VALUES
  ('Crown Badge',     'Royal crown on your avatar',     'avatar_badge', '👑', 'linear-gradient(135deg,#fbbf24,#f59e0b)', 'common'),
  ('Fire Badge',      'Blazing fire on your avatar',    'avatar_badge', '🔥', 'linear-gradient(135deg,#f97316,#ef4444)', 'common'),
  ('Lightning Badge', 'Electric lightning bolt',        'avatar_badge', '⚡', 'linear-gradient(135deg,#fbbf24,#a16207)', 'common'),
  ('Skull Badge',     'Spooky skull for the brave',     'avatar_badge', '💀', 'linear-gradient(135deg,#64748b,#1e293b)', 'common'),
  ('Star Badge',      'You are a star',                 'avatar_badge', '⭐', 'linear-gradient(135deg,#fbbf24,#ca8a04)', 'common'),
  ('Dice Badge',      'Always rolling dice',            'avatar_badge', '🎲', 'linear-gradient(135deg,#64748b,#334155)', 'common'),
  ('Beer Badge',      'Proud beer lover',               'avatar_badge', '🍺', 'linear-gradient(135deg,#d97706,#92400e)', 'common'),
  ('Devil Badge',     'Pure evil energy',               'avatar_badge', '😈', 'linear-gradient(135deg,#dc2626,#7f1d1d)', 'rare'),
  ('Alien Badge',     'Out of this world',              'avatar_badge', '👾', 'linear-gradient(135deg,#22c55e,#166534)', 'rare'),
  ('Clown Badge',     'Honk honk',                      'avatar_badge', '🤡', 'linear-gradient(135deg,#ef4444,#f97316)', 'rare')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 7. Card Title (rare/epic) — custom title text under player name
-- ─────────────────────────────────────────────────────────────
INSERT INTO cosmetics (name, description, type, value, preview, rarity) VALUES
  ('El Jefe',       'The Boss title',            'card_title', '🤝 El Jefe',       'linear-gradient(135deg,#f59e0b,#d97706)', 'rare'),
  ('El Borracho',   'The Drunk title',           'card_title', '🍺 El Borracho',   'linear-gradient(135deg,#d97706,#92400e)', 'rare'),
  ('Party Animal',  'Wild party title',          'card_title', '🎉 Party Animal',  'linear-gradient(135deg,#f472b6,#ec4899)', 'rare'),
  ('The Legend',    'Legendary player title',    'card_title', '👑 The Legend',    'linear-gradient(135deg,#fbbf24,#f59e0b)', 'epic'),
  ('Mexico God',    'Absolute deity title',      'card_title', '⚡ Mexico God',    'linear-gradient(135deg,#8b5cf6,#6366f1)', 'epic'),
  ('Dice King',     'Master of the dice',        'card_title', '🎲 Dice King',     'linear-gradient(135deg,#06b6d4,#0891b2)', 'epic'),
  ('The Punisher',  'Fear this player',          'card_title', '😈 The Punisher',  'linear-gradient(135deg,#dc2626,#7f1d1d)', 'epic'),
  ('Untouchable',   'Cannot be beaten',          'card_title', '🛡️ Untouchable',   'linear-gradient(135deg,#94a3b8,#64748b)', 'legendary'),
  ('El Diablo',     'The devil himself',         'card_title', '🔥 El Diablo',     'linear-gradient(135deg,#dc2626,#f97316)', 'legendary')
ON CONFLICT DO NOTHING;
