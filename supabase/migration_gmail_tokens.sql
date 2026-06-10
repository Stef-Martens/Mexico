-- Store Gmail refresh token from admin OAuth connect (service role only)

CREATE TABLE IF NOT EXISTS gmail_tokens (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  refresh_token text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;

-- No policies — accessed via service role only
