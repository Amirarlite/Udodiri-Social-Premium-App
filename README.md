# Udodiri Social Club — Cloudflare Platform Edition

![Udodiri Social Club Logo](https://i.postimg.cc/bJQgWxd8/udodiri-young-social-club.jpg)

Complete social club management app, **re-architected for Cloudflare** — one platform for everything.

## Architecture

| Component | Cloudflare Service | Purpose |
|---|---|---|
| **Frontend** | Pages (Assets) | React SPA, served globally |
| **Backend API** | Workers + Hono | REST API with JWT auth |
| **Database** | D1 (SQLite) | Users, meetings, events, financials |
| **Real-time Chat** | Durable Objects | WebSocket chat rooms |
| **Auth** | JWT (Worker-side) | Register/login with hashed passwords |

**Zero external platforms.** Everything runs on Cloudflare.

## Features

- 🔐 JWT authentication (register + login)
- 📢 Announcement channel (feed + broadcasts)
- 💬 Real-time member chat (Durable Objects)
- 👥 Member activity feed
- 📋 Meeting minutes with action items
- 🗓️ Event calendar
- 💰 Financial tracking (admin only)
- ⭐ Premium subscriptions (Paystack/Flutterwave)

## Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create D1 database
wrangler d1 create udodiri-db

# 3. Update wrangler.jsonc with your D1 database_id
#    Replace "PLACEHOLDER_DB_ID" with the real id

# 4. Run migrations
wrangler d1 execute udodiri-db --file=./schema.sql --remote

# 5. Develop locally
npm run dev

# 6. Deploy
npm run deploy
```

## Project Structure

```
udodiri-social-app/
├── wrangler.jsonc          # Cloudflare config (Worker + Pages assets)
├── schema.sql              # D1 database schema
├── worker/
│   ├── src/
│   │   └── index.ts        # Hono API + Durable Object (chat)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx         # Router + layout
│   │   ├── index.css       # Full CSS (dark theme)
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   └── api.ts       # Axios instance
│   │   ├── components/
│   │   │   ├── Login.tsx
│   │   │   └── Sidebar.tsx
│   │   └── screens/
│   │       ├── Dashboard.tsx
│   │       ├── Announcements.tsx
│   │       ├── MemberChat.tsx
│   │       ├── Activity.tsx
│   │       ├── Meetings.tsx
│   │       ├── Calendar.tsx
│   │       ├── Financials.tsx
│   │       └── Subscription.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
└── package.json
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login, returns JWT
- `GET /api/auth/me` — Current user (auth required)

### Announcements
- `GET /api/announcements` — List all
- `POST /api/announcements` — Create (auth required)
- `DELETE /api/announcements/:id` — Delete (admin only)

### Chat
- `GET /api/chat/:roomId/messages` — Get messages
- `POST /api/chat/:roomId/messages` — Send message (auth required)

### Activity
- `GET /api/activity` — Member activity feed

### Meetings
- `GET /api/meetings` — List meetings
- `POST /api/meetings` — Create meeting (auth required)
- `POST /api/meetings/:id/action-items` — Add action item

### Calendar
- `GET /api/calendar` — List events
- `POST /api/calendar` — Create event (auth required)
- `DELETE /api/calendar/:id` — Delete event

### Financials (Admin/Treasurer)
- `GET /api/financials` — List transactions
- `POST /api/financials` — Record transaction

### Subscriptions
- `GET /api/subscriptions` — Current subscription
- `POST /api/subscriptions/premium` — Initiate upgrade
- `POST /api/subscriptions/verify` — Verify payment

## Cost

Cloudflare Workers/D1/Pages: **~$0–5/month** for typical social club usage. Generous free tier included.

## Cleanup

```bash
# Delete Cloudflare resources
wrangler delete
wrangler d1 delete udodiri-db
```

---

Built with ❤️ for Udodiri Young Social Club
**100% Cloudflare • Zero Third-Party Platforms • Low Cost • Production Ready**
