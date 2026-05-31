import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Context, MiddlewareHandler, Next } from 'hono';
import type { D1Database, DurableObjectNamespace, DurableObjectState, WebSocketPair } from '@cloudflare/workers-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Env {
  DB: D1Database;
  CHAT_ROOM: DurableObjectNamespace;
  ASSETS: Fetcher;
  JWT_SECRET: string;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  subscription_tier: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  subscriptionTier: string;
  iat: number;
  exp: number;
}

// Extend Hono context to carry user
interface AuthContext extends Context {
  env: Env;
  user?: AuthUser;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const genId = (): string => `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

// Simple SHA-256 + salt for demo passwords (replace with bcrypt in production)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode('udodiri-salt-' + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// JWT helpers
async function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, secret: string, expiresMs = 7 * 86400_000): Promise<string> {
  const now = Date.now();
  const full: JwtPayload = { ...payload, iat: Math.floor(now / 1000), exp: Math.floor((now + expiresMs) / 1000) };
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(full));
  const data = new TextEncoder().encode(`${header}.${body}`);
  const keyData = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${header}.${body}.${sigBase64}`;
}

async function verifyToken(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const keyData = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const sigBytes = Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
    if (!valid) return null;
    const payload: JwtPayload = JSON.parse(atob(parts[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------

const requireAuth: MiddlewareHandler<Env> = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.slice(7);
  const secret = c.env.JWT_SECRET || 'dev-secret-change-in-production';
  const payload = await verifyToken(token, secret);
  if (!payload) return c.json({ error: 'Invalid token' }, 401);

  const user = await c.env.DB.prepare('SELECT id, email, name, role, subscription_tier FROM users WHERE id = ?')
    .bind(payload.userId).first<AuthUser>();

  if (!user) return c.json({ error: 'User not found' }, 401);

  (c as any).user = user;
  await next();
};

const requireAdmin: MiddlewareHandler<Env> = async (c: Context, next: Next) => {
  const user = (c as any).user as AuthUser;
  if (user.role !== 'Admin' && user.role !== 'Executive') {
    return c.json({ error: 'Forbidden: Admin/Executive access required' }, 403);
  }
  await next();
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ---------------------------------------------------------------------------
// Auth Routes
// ---------------------------------------------------------------------------

app.post('/api/auth/register', async c => {
  const body = await c.req.json();
  const { email, password, name } = body;
  if (!email || !password || !name) return c.json({ error: 'Missing email, password, name' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return c.json({ error: 'Email already registered' }, 409);

  const id = `user_${genId()}`;
  const hash = await hashPassword(password);
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'INSERT INTO users (id, email, name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, email, name, hash, now, now).run();

  return c.json({ message: 'User registered', userId: id }, 201);
});

app.post('/api/auth/login', async c => {
  const body = await c.req.json();
  const { email, password } = body;
  if (!email || !password) return c.json({ error: 'Missing email, password' }, 400);

  const hash = await hashPassword(password);
  const user = await c.env.DB.prepare(
    'SELECT id, email, name, role, subscription_tier FROM users WHERE email = ? AND password_hash = ?'
  ).bind(email, hash).first<AuthUser>();

  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  const secret = c.env.JWT_SECRET || 'dev-secret-change-in-production';
  const token = await signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    subscriptionTier: user.subscription_tier,
  }, secret);

  await c.env.DB.prepare(
    'INSERT INTO member_activity (id, user_id, user_name, action_type, action_text) VALUES (?, ?, ?, ?, ?)'
  ).bind(genId(), user.id, user.name, 'login', 'Logged in').run();

  return c.json({ message: 'Login successful', token, user });
});

app.get('/api/auth/me', requireAuth, async c => {
  const user = (c as any).user as AuthUser;
  return c.json({ user });
});

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

app.get('/api/announcements', async c => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM announcements ORDER BY created_at DESC LIMIT 50'
  ).all();
  return c.json({ announcements: results || [] });
});

app.post('/api/announcements', requireAuth, async c => {
  const user = (c as any).user as AuthUser;
  const body = await c.req.json();
  const { title, content, is_broadcast } = body;
  if (!title || !content) return c.json({ error: 'Missing title, content' }, 400);

  const id = `ann_${genId()}`;
  await c.env.DB.prepare(
    'INSERT INTO announcements (id, title, content, author, author_id, is_broadcast) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, title, content, user.name, user.id, is_broadcast ? 1 : 0).run();

  await c.env.DB.prepare(
    'INSERT INTO member_activity (id, user_id, user_name, action_type, action_text) VALUES (?, ?, ?, ?, ?)'
  ).bind(genId(), user.id, user.name, 'announcement', `Posted: ${title}`).run();

  return c.json({ message: 'Announcement created', id }, 201);
});

app.delete('/api/announcements/:id', requireAuth, requireAdmin, async c => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM announcements WHERE id = ?').bind(id).run();
  return c.json({ message: 'Deleted' });
});

// ---------------------------------------------------------------------------
// Member Chat (via Durable Objects)
// ---------------------------------------------------------------------------

app.get('/api/chat/:roomId/messages', async c => {
  const roomId = c.req.param('roomId') || 'default';
  const id = c.env.CHAT_ROOM.idFromName(roomId);
  const stub = c.env.CHAT_ROOM.get(id);
  return stub.fetch(new Request('http://internal/api/messages'));
});

app.post('/api/chat/:roomId/messages', requireAuth, async c => {
  const roomId = c.req.param('roomId') || 'default';
  const user = (c as any).user as AuthUser;
  const body = await c.req.json();
  const { text } = body;
  if (!text?.trim()) return c.json({ error: 'Empty message' }, 400);

  const id = c.env.CHAT_ROOM.idFromName(roomId);
  const stub = c.env.CHAT_ROOM.get(id);
  const payload = JSON.stringify({ senderId: user.id, senderName: user.name, text: text.trim(), role: user.role });
  return stub.fetch(new Request('http://internal/api/messages', {
    method: 'POST',
    body: payload,
    headers: { 'Content-Type': 'application/json' },
  }));
});

// ---------------------------------------------------------------------------
// Member Activity
// ---------------------------------------------------------------------------

app.get('/api/activity', async c => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM member_activity ORDER BY created_at DESC LIMIT 100'
  ).all();
  return c.json({ activities: results || [] });
});

// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------

app.get('/api/meetings', async c => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM meetings ORDER BY created_at DESC LIMIT 50'
  ).all();
  const meetings: any[] = results || [];
  for (const m of meetings) {
    const { results: items } = await c.env.DB.prepare(
      'SELECT * FROM meeting_action_items WHERE meeting_id = ? ORDER BY created_at'
    ).bind(m.id).all();
    m.actionItems = items || [];
  }
  return c.json({ meetings });
});

app.post('/api/meetings', requireAuth, async c => {
  const user = (c as any).user as AuthUser;
  const body = await c.req.json();
  const { title, attendees, googleDocUrl } = body;
  if (!title || !attendees) return c.json({ error: 'Missing title, attendees' }, 400);

  const id = `meeting_${genId()}`;
  await c.env.DB.prepare(
    'INSERT INTO meetings (id, title, attendees, google_doc_url, created_by) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, title, JSON.stringify(attendees), googleDocUrl || null, user.id).run();

  await c.env.DB.prepare(
    'INSERT INTO member_activity (id, user_id, user_name, action_type, action_text) VALUES (?, ?, ?, ?, ?)'
  ).bind(genId(), user.id, user.name, 'meeting', `Created meeting: ${title}`).run();

  return c.json({ message: 'Meeting created', id }, 201);
});

app.post('/api/meetings/:id/action-items', requireAuth, async c => {
  const meetingId = c.req.param('id');
  const body = await c.req.json();
  const { description, responsiblePerson, dueDate } = body;
  if (!description || !responsiblePerson || !dueDate) return c.json({ error: 'Missing fields' }, 400);

  const itemId = `action_${genId()}`;
  await c.env.DB.prepare(
    'INSERT INTO meeting_action_items (id, meeting_id, description, responsible_person, due_date) VALUES (?, ?, ?, ?, ?)'
  ).bind(itemId, meetingId, description, responsiblePerson, dueDate).run();

  return c.json({ message: 'Action item added', id: itemId }, 201);
});

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

app.get('/api/calendar', async c => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM calendar_events ORDER BY start_date LIMIT 100'
  ).all();
  return c.json({ events: results || [] });
});

app.post('/api/calendar', requireAuth, async c => {
  const user = (c as any).user as AuthUser;
  const body = await c.req.json();
  const { title, startDate, endDate, location, description, attendees } = body;
  if (!title || !startDate || !endDate) return c.json({ error: 'Missing title, startDate, endDate' }, 400);

  const id = `event_${genId()}`;
  await c.env.DB.prepare(
    'INSERT INTO calendar_events (id, title, start_date, end_date, location, description, attendees, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, title, startDate, endDate, location || null, description || null, attendees ? JSON.stringify(attendees) : null, user.id).run();

  await c.env.DB.prepare(
    'INSERT INTO member_activity (id, user_id, user_name, action_type, action_text) VALUES (?, ?, ?, ?, ?)'
  ).bind(genId(), user.id, user.name, 'calendar', `Created event: ${title}`).run();

  return c.json({ message: 'Event created', id }, 201);
});

app.delete('/api/calendar/:id', requireAuth, async c => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM calendar_events WHERE id = ?').bind(id).run();
  return c.json({ message: 'Event deleted' });
});

// ---------------------------------------------------------------------------
// Financials (admin only)
// ---------------------------------------------------------------------------

app.get('/api/financials', requireAuth, requireAdmin, async c => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM financials ORDER BY date DESC, created_at DESC LIMIT 100'
  ).all();
  return c.json({ transactions: results || [] });
});

app.post('/api/financials', requireAuth, requireAdmin, async c => {
  const body = await c.req.json();
  const { title, amount, type, userId, paymentReference } = body;
  if (!title || !amount || !type) return c.json({ error: 'Missing title, amount, type' }, 400);

  const id = `txn_${genId()}`;
  const now = new Date().toISOString().split('T')[0];
  await c.env.DB.prepare(
    'INSERT INTO financials (id, title, amount, type, user_id, status, date, payment_reference) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, title, parseFloat(amount), type, userId || null, 'SUCCESS', now, paymentReference || null).run();

  return c.json({ message: 'Transaction recorded', id }, 201);
});

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

app.get('/api/subscriptions', requireAuth, async c => {
  const user = (c as any).user as AuthUser;
  const sub = await c.env.DB.prepare(
    'SELECT * FROM subscriptions WHERE user_id = ? AND tier = ?'
  ).bind(user.id, 'premium').first() as any;

  if (!sub) {
    return c.json({ subscription: { userId: user.id, tier: 'free', isActive: false } });
  }

  const isActive = !!sub.is_active && new Date(sub.end_date) > new Date();
  return c.json({ subscription: { ...sub, isActive } });
});

app.post('/api/subscriptions/premium', requireAuth, async c => {
  const user = (c as any).user as AuthUser;
  const body = await c.req.json();
  const { paymentGateway } = body;
  if (!paymentGateway || !['paystack', 'flutterwave'].includes(paymentGateway)) {
    return c.json({ error: 'Invalid payment gateway' }, 400);
  }

  const reference = `sub_${genId()}`;
  return c.json({
    message: 'Payment initialization',
    reference,
    authorizationUrl: `https://${paymentGateway}.com/pay/${reference}`,
    amount: 5000,
    currency: 'NGN',
  });
});

app.post('/api/subscriptions/verify', requireAuth, async c => {
  const user = (c as any).user as AuthUser;
  const body = await c.req.json();
  const { reference, gateway } = body;
  if (!reference) return c.json({ error: 'Missing reference' }, 400);

  const now = new Date();
  const end = new Date(now);
  end.setFullYear(end.getFullYear() + 1);

  await c.env.DB.prepare(
    `INSERT INTO subscriptions (user_id, tier, start_date, end_date, is_active, payment_reference, payment_gateway)
     VALUES (?, 'premium', ?, ?, 1, ?, ?)
     ON CONFLICT(user_id, tier) DO UPDATE SET start_date=?, end_date=?, is_active=1, payment_reference=?, payment_gateway=?`
  ).bind(user.id, now.toISOString(), end.toISOString(), reference, gateway,
    now.toISOString(), end.toISOString(), reference, gateway).run();

  await c.env.DB.prepare(
    'UPDATE users SET subscription_tier = ? WHERE id = ?'
  ).bind('premium', user.id).run();

  await c.env.DB.prepare(
    'INSERT INTO member_activity (id, user_id, user_name, action_type, action_text) VALUES (?, ?, ?, ?, ?)'
  ).bind(genId(), user.id, user.name, 'subscription', 'Upgraded to Premium').run();

  return c.json({ message: 'Upgraded to premium', subscription: { userId: user.id, tier: 'premium', isActive: true } });
});

// ---------------------------------------------------------------------------
// Serve SPA for non-API routes
// ---------------------------------------------------------------------------

app.notFound(async c => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// ---------------------------------------------------------------------------
// Durable Object for real-time chat
// ---------------------------------------------------------------------------

export class ChatRoom {
  private state: DurableObjectState;
  private messages: Array<{ id: string; senderId: string; senderName: string; text: string; timestamp: string; isBroadcast: boolean }> = [];
  private webSockets: WebSocket[] = [];

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/messages' && request.method === 'GET') {
      return Response.json({ messages: this.messages });
    }

    if (url.pathname === '/api/messages' && request.method === 'POST') {
      const body = await request.json() as { senderId: string; senderName: string; text: string; role: string };
      const msg = {
        id: genId(),
        senderId: body.senderId,
        senderName: body.senderName,
        text: body.text,
        timestamp: new Date().toISOString(),
        isBroadcast: body.role === 'Executive' || body.role === 'Admin',
      };
      this.messages.push(msg);
      if (this.messages.length > 500) this.messages = this.messages.slice(-500);

      const data = JSON.stringify({ type: 'message', message: msg });
      for (const ws of this.webSockets) {
        try { ws.send(data); } catch { /* ignore */ }
      }

      return Response.json({ message: msg });
    }

    // WebSocket upgrade
    const upgrade = request.headers.get('Upgrade')?.toLowerCase();
    if (upgrade === 'websocket') {
      const pair = new WebSocketPair();
      pair[1].accept();
      this.webSockets.push(pair[1]);

      pair[1].addEventListener('close', () => {
        this.webSockets = this.webSockets.filter(ws => ws !== pair[1]);
      });

      pair[1].addEventListener('message', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data as string);
          if (data.type === 'message' && data.text) {
            const msg = {
              id: genId(),
              senderId: data.senderId || 'anonymous',
              senderName: data.senderName || 'Unknown',
              text: data.text,
              timestamp: new Date().toISOString(),
              isBroadcast: data.isBroadcast || false,
            };
            this.messages.push(msg);
            if (this.messages.length > 500) this.messages = this.messages.slice(-500);
            for (const ws of this.webSockets) {
              try { ws.send(JSON.stringify({ type: 'message', message: msg })); } catch { /* ignore */ }
            }
          }
        } catch { /* ignore */ }
      });

      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    return new Response('Not found', { status: 404 });
  }
}

export default app;
