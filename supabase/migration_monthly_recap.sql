-- Track monthly recap runs to prevent duplicate emails/coin awards

CREATE TABLE IF NOT EXISTS monthly_recap_runs (
  year_month text PRIMARY KEY,
  ran_at timestamptz DEFAULT now(),
  emails_sent int NOT NULL DEFAULT 0,
  coins_awarded jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE monthly_recap_runs ENABLE ROW LEVEL SECURITY;

-- No direct access — cron uses service role
