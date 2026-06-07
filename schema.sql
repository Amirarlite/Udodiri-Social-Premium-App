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

-- Notifications table for real-time alerts
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'announcement', 'chat_mention', 'payment', 'meeting'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  related_id TEXT, -- ID of related entity (announcement, chat, etc.)
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = 0;

-- Chat messages persistence (for Durable Object backup to D1)
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  is_broadcast INTEGER DEFAULT 0
);

-- Table to store likes for announcements. Each record represents a user who liked a specific announcement.
CREATE TABLE IF NOT EXISTS announcement_likes (
  id TEXT PRIMARY KEY,
  announcement_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, timestamp);

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT NOT NULL,
  announcement_notifications INTEGER DEFAULT 1,
  chat_notifications INTEGER DEFAULT 1,
  meeting_notifications INTEGER DEFAULT 1,
  payment_notifications INTEGER DEFAULT 1,
  PRIMARY KEY (user_id)
);
