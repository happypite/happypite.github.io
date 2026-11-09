-- Run once on the private authentication database. No article content is stored here.
CREATE TABLE IF NOT EXISTS auth_state (
  key TEXT PRIMARY KEY,
  sealed TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_state_expiry ON auth_state(expires);
CREATE TABLE IF NOT EXISTS auth_rate (
  key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_rate_expiry ON auth_rate(expires);
