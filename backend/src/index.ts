import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  SESSIONS: KVNamespace;
};

type Variables = {
  userId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS for our frontend pages and local development
app.use(
  '/api/*',
  cors({
    origin: '*', // Allow all origins for flexibility; can restrict to Pages domain later
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
);

// Password Hashing helpers using Web Crypto API
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ==========================================================================
// AUTHENTICATION ROUTES
// ==========================================================================

app.post('/api/auth/signup', async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password || password.length < 6) {
    return c.json({ error: 'Valid email and password (min 6 chars) required' }, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    )
      .bind(normalizedEmail)
      .first();

    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    const userId = crypto.randomUUID();
    const salt = generateSalt();
    const hash = await hashPassword(password, salt);
    const passwordHash = `${salt}:${hash}`;
    const now = Date.now();

    // Insert user into D1
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)'
    )
      .bind(userId, normalizedEmail, passwordHash, now)
      .run();

    // Generate session token
    const token = generateToken();
    await c.env.SESSIONS.put(`session:${token}`, userId, {
      expirationTtl: 30 * 24 * 3600, // 30 days session
    });

    return c.json({ success: true, token, email: normalizedEmail });
  } catch (err: any) {
    return c.json({ error: 'Signup failed: ' + err.message }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Find user
    const user = await c.env.DB.prepare(
      'SELECT id, password_hash FROM users WHERE email = ?'
    )
      .bind(normalizedEmail)
      .first<{ id: string; password_hash: string }>();

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const [salt, hash] = user.password_hash.split(':');
    const inputHash = await hashPassword(password, salt);

    if (inputHash !== hash) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Generate session token
    const token = generateToken();
    await c.env.SESSIONS.put(`session:${token}`, user.id, {
      expirationTtl: 30 * 24 * 3600, // 30 days session
    });

    return c.json({ success: true, token, email: normalizedEmail });
  } catch (err: any) {
    return c.json({ error: 'Login failed: ' + err.message }, 500);
  }
});

// Middleware to secure sync endpoints
app.use('/api/sync/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing token' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const userId = await c.env.SESSIONS.get(`session:${token}`);

  if (!userId) {
    return c.json({ error: 'Unauthorized: Invalid or expired session' }, 401);
  }

  c.set('userId', userId);
  await next();
});

// ==========================================================================
// SYNC PULL ROUTE
// ==========================================================================
app.get('/api/sync/pull', async (c) => {
  const userId = c.var.userId;
  const lastPulledAt = parseInt(c.req.query('last_pulled_at') || '0', 10);

  try {
    // Query D1 tables for updates since lastPulledAt
    const exercisesPromise = c.env.DB.prepare(
      'SELECT id, name, muscle, category, instructions, updated_at, deleted FROM exercises WHERE user_id = ? AND updated_at > ?'
    )
      .bind(userId, lastPulledAt)
      .all();

    const templatesPromise = c.env.DB.prepare(
      'SELECT id, name, notes, exercises_json, updated_at, deleted FROM templates WHERE user_id = ? AND updated_at > ?'
    )
      .bind(userId, lastPulledAt)
      .all();

    const historyPromise = c.env.DB.prepare(
      'SELECT id, name, notes, start_time, end_time, exercises_json, updated_at, deleted FROM history WHERE user_id = ? AND updated_at > ?'
    )
      .bind(userId, lastPulledAt)
      .all();

    const settingsPromise = c.env.DB.prepare(
      'SELECT unit, default_rest, updated_at FROM settings WHERE user_id = ? AND updated_at > ?'
    )
      .bind(userId, lastPulledAt)
      .first();

    const [exercisesRes, templatesRes, historyRes, settingsRes] = await Promise.all([
      exercisesPromise,
      templatesPromise,
      historyPromise,
      settingsPromise,
    ]);

    // Parse JSON lists
    const exercises = exercisesRes.results || [];
    
    const templates = (templatesRes.results || []).map((t: any) => ({
      ...t,
      exercises: JSON.parse(t.exercises_json),
    }));

    const history = (historyRes.results || []).map((h: any) => ({
      ...h,
      exercises: JSON.parse(h.exercises_json),
    }));

    return c.json({
      exercises,
      templates,
      history,
      settings: settingsRes || null,
      server_time: Date.now(),
    });
  } catch (err: any) {
    return c.json({ error: 'Sync pull failed: ' + err.message }, 500);
  }
});

// ==========================================================================
// SYNC PUSH ROUTE
// ==========================================================================
app.post('/api/sync/push', async (c) => {
  const userId = c.var.userId;
  const { exercises, templates, history, settings } = await c.req.json();

  try {
    const statements: D1PreparedStatement[] = [];

    // Batch upsert exercises
    if (Array.isArray(exercises)) {
      for (const ex of exercises) {
        statements.push(
          c.env.DB.prepare(
            `INSERT INTO exercises (id, user_id, name, muscle, category, instructions, updated_at, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               name = excluded.name,
               muscle = excluded.muscle,
               category = excluded.category,
               instructions = excluded.instructions,
               updated_at = excluded.updated_at,
               deleted = excluded.deleted`
          ).bind(
            ex.id,
            userId,
            ex.name,
            ex.muscle,
            ex.category,
            ex.instructions || '',
            ex.updated_at || Date.now(),
            ex.deleted ? 1 : 0
          )
        );
      }
    }

    // Batch upsert templates
    if (Array.isArray(templates)) {
      for (const temp of templates) {
        statements.push(
          c.env.DB.prepare(
            `INSERT INTO templates (id, user_id, name, notes, exercises_json, updated_at, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               name = excluded.name,
               notes = excluded.notes,
               exercises_json = excluded.exercises_json,
               updated_at = excluded.updated_at,
               deleted = excluded.deleted`
          ).bind(
            temp.id,
            userId,
            temp.name,
            temp.notes || '',
            JSON.stringify(temp.exercises),
            temp.updated_at || Date.now(),
            temp.deleted ? 1 : 0
          )
        );
      }
    }

    // Batch upsert history
    if (Array.isArray(history)) {
      for (const hist of history) {
        statements.push(
          c.env.DB.prepare(
            `INSERT INTO history (id, user_id, name, notes, start_time, end_time, exercises_json, updated_at, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               name = excluded.name,
               notes = excluded.notes,
               start_time = excluded.start_time,
               end_time = excluded.end_time,
               exercises_json = excluded.exercises_json,
               updated_at = excluded.updated_at,
               deleted = excluded.deleted`
          ).bind(
            hist.id,
            userId,
            hist.name,
            hist.notes || '',
            hist.startTime,
            hist.endTime,
            JSON.stringify(hist.exercises),
            hist.updated_at || Date.now(),
            hist.deleted ? 1 : 0
          )
        );
      }
    }

    // Upsert settings
    if (settings) {
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO settings (user_id, unit, default_rest, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             unit = excluded.unit,
             default_rest = excluded.default_rest,
             updated_at = excluded.updated_at`
        ).bind(
          userId,
          settings.unit || 'lbs',
          settings.default_rest || 90,
          settings.updated_at || Date.now()
        )
      );
    }

    // Execute all D1 queries in a single atomic batch
    if (statements.length > 0) {
      await c.env.DB.batch(statements);
    }

    return c.json({ success: true, synced_at: Date.now() });
  } catch (err: any) {
    return c.json({ error: 'Sync push failed: ' + err.message }, 500);
  }
});

export default app;
