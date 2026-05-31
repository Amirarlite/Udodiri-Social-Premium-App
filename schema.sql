CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'Member',
  subscription_tier TEXT DEFAULT 'free',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_id TEXT NOT NULL,
  sent_via TEXT DEFAULT 'in-app',
  is_broadcast INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  attendees TEXT,
  google_doc_url TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meeting_action_items (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  description TEXT NOT NULL,
  responsible_person TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id)
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  location TEXT,
  description TEXT,
  attendees TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_calendar_start ON calendar_events(start_date);

CREATE TABLE IF NOT EXISTS financials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  user_id TEXT,
  status TEXT DEFAULT 'SUCCESS',
  date TEXT NOT NULL,
  payment_reference TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_financials_date ON financials(date DESC);

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT NOT NULL,
  tier TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  payment_reference TEXT,
  payment_gateway TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, tier)
);

CREATE TABLE IF NOT EXISTS member_activity (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON member_activity(created_at DESC);
