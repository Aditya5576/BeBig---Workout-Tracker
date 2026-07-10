import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  SESSIONS: KVNamespace;
  AI: any;
  ADMIN_PASSWORD_HASH?: string;
};


type Variables = {
  userId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS for our frontend pages, all preview deploys, and local development
function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  // Exact matches
  if (origin === 'https://bebigfit.pages.dev') return true;
  if (origin === 'http://localhost:8080') return true;
  if (origin === 'http://localhost:8787') return true;
  if (origin === 'http://localhost:3000') return true;
  // Any Cloudflare Pages preview deploy for this project (*.bebigfit.pages.dev)
  if (/^https:\/\/[a-z0-9-]+\.bebigfit\.pages\.dev$/.test(origin)) return true;
  return false;
}

app.use(
  '/api/*',
  cors({
    origin: (origin) => (isAllowedOrigin(origin) ? origin : 'https://bebigfit.pages.dev'),
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
);

// Self-healing database column and index addition
app.use('/api/*', async (c, next) => {
  try {
    await c.env.DB.prepare("ALTER TABLE settings ADD COLUMN active_workout_json TEXT").run();
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    await c.env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id)").run();
    await c.env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id)").run();
    await c.env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_history_user_id ON history(user_id)").run();
  } catch (e) {
    // Indexes already exist, ignore
  }
  await next();
});



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

async function addActivityLog(sessions: KVNamespace, email: string, message: string) {
  const currentLogsStr = await sessions.get('activity:logs');
  let logs: any[] = [];
  if (currentLogsStr) {
    try {
      logs = JSON.parse(currentLogsStr);
    } catch (e) {}
  }
  logs.unshift({
    email,
    message,
    timestamp: Date.now()
  });
  if (logs.length > 50) {
    logs = logs.slice(0, 50);
  }
  await sessions.put('activity:logs', JSON.stringify(logs));
}

// Simple KV-based rate-limiting for Auth endpoints (max 15 requests/min per IP)
app.use('/api/auth/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Real-IP') || '127.0.0.1';
  const limitKey = `rate-limit:${ip}`;
  
  try {
    const currentCountStr = await c.env.SESSIONS.get(limitKey);
    const count = currentCountStr ? parseInt(currentCountStr, 10) : 0;
    
    if (count >= 15) {
      return c.json({ error: 'Too many login or signup attempts. Please try again in a minute.' }, 429);
    }
    
    await c.env.SESSIONS.put(limitKey, (count + 1).toString(), { expirationTtl: 60 });
  } catch (e) {
    console.error("Rate limiting KV error:", e);
  }
  await next();
});

// ==========================================================================
// AUTHENTICATION ROUTES
// ==========================================================================


app.post('/api/auth/signup', async (c) => {
  const { email, password, name } = await c.req.json();

  if (!email || !password || password.length < 6) {
    return c.json({ error: 'Valid email and password (min 6 chars) required' }, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const userName = (name || '').trim();

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
      'INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(userId, normalizedEmail, passwordHash, userName, now)
      .run();

    // Generate session token
    const token = generateToken();
    await c.env.SESSIONS.put(`session:${token}`, userId, {
      expirationTtl: 30 * 24 * 3600, // 30 days session
    });

    await addActivityLog(c.env.SESSIONS, normalizedEmail, `${userName || normalizedEmail} registered a new account!`);

    return c.json({ success: true, token, email: normalizedEmail, name: userName });
  } catch (err: any) {
    console.error("Signup failed:", err);
    return c.json({ error: 'Signup failed. Please try again later.' }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Intercept special admin account
    if (normalizedEmail === 'adityapatil2348@gmail.com') {
      const adminHash = c.env.ADMIN_PASSWORD_HASH || 'bebigadminsalt:747094f0d786a452aa5d287eaabaa414b0570897f710169e0f3c857f453ff234';
      const [salt, hash] = adminHash.split(':');
      const inputHash = await hashPassword(password, salt);
      if (inputHash !== hash) {
        return c.json({ error: 'Invalid email or password' }, 401);
      }


      // Check if admin exists in database, seed if missing
      let user = await c.env.DB.prepare(
        'SELECT id, name FROM users WHERE email = ?'
      )
        .bind(normalizedEmail)
        .first<{ id: string; name: string }>();

      if (!user) {
        const adminId = crypto.randomUUID();
        const salt = generateSalt();
        const hash = await hashPassword(password, salt);
        const passwordHash = `${salt}:${hash}`;
        const now = Date.now();

        await c.env.DB.prepare(
          'INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)'
        )
          .bind(adminId, normalizedEmail, passwordHash, 'Aditya Patil', now)
          .run();

        user = { id: adminId, name: 'Aditya Patil' };
      }

      // Generate session token
      const token = generateToken();
      await c.env.SESSIONS.put(`session:${token}`, user.id, {
        expirationTtl: 30 * 24 * 3600, // 30 days session
      });

      return c.json({ success: true, token, email: normalizedEmail, name: user.name || 'Aditya Patil', isAdmin: true });
    }

    // Find normal user
    const user = await c.env.DB.prepare(
      'SELECT id, password_hash, name, banned FROM users WHERE email = ?'
    )
      .bind(normalizedEmail)
      .first<{ id: string; password_hash: string; name: string; banned: number }>();

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    if (user.banned === 1) {
      return c.json({ error: 'Your account has been banned/disabled by the administrator.' }, 403);
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

    return c.json({ success: true, token, email: normalizedEmail, name: user.name || '', isAdmin: false });
  } catch (err: any) {
    console.error("Login failed:", err);
    return c.json({ error: 'Login failed. Please try again later.' }, 500);
  }
});

app.post('/api/auth/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ error: 'Email address is required.' }, 400);
    }
    const normalizedEmail = email.toLowerCase().trim();

    // Verify user exists
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(normalizedEmail).first();
    if (!user) {
      return c.json({ error: 'Email address not registered.' }, 404);
    }

    // Generate 6-digit recovery code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in KV with 15 minutes expiration
    await c.env.SESSIONS.put(`reset-code:${normalizedEmail}`, code, {
      expirationTtl: 900
    });

    await addActivityLog(c.env.SESSIONS, normalizedEmail, `Requested a password recovery code`);

    // In a real application, we would send this code via email.
    // For this deployment, we return it in the response so the frontend can securely handle it.
    return c.json({ success: true, message: "Recovery code generated successfully.", code });
  } catch (err: any) {
    console.error("Forgot password request failed:", err);
    return c.json({ error: 'Request failed: ' + err.message }, 500);
  }
});

app.post('/api/auth/reset-password', async (c) => {
  try {
    const { email, code, newPassword } = await c.req.json();
    if (!email || !code || !newPassword || newPassword.length < 6) {
      return c.json({ error: 'Valid email, recovery code, and new password (min 6 characters) required.' }, 400);
    }
    const normalizedEmail = email.toLowerCase().trim();

    // Verify reset code in KV
    const storedCode = await c.env.SESSIONS.get(`reset-code:${normalizedEmail}`);
    if (!storedCode || storedCode !== code.trim()) {
      return c.json({ error: 'Invalid or expired recovery code.' }, 400);
    }

    const salt = generateSalt();
    const hash = await hashPassword(newPassword, salt);
    const passwordHash = `${salt}:${hash}`;

    // Update password in database
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE email = ?').bind(passwordHash, normalizedEmail).run();

    // Clear KV code
    await c.env.SESSIONS.delete(`reset-code:${normalizedEmail}`);

    await addActivityLog(c.env.SESSIONS, normalizedEmail, `Successfully reset account password`);

    return c.json({ success: true });
  } catch (err: any) {
    console.error("Reset password failed:", err);
    return c.json({ error: 'Reset failed: ' + err.message }, 500);
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

  // Check if the user exists and is banned
  const user = await c.env.DB.prepare(
    'SELECT banned FROM users WHERE id = ?'
  )
    .bind(userId)
    .first<{ banned: number }>();

  if (!user) {
    // Session is active but user is deleted from database
    await c.env.SESSIONS.delete(`session:${token}`);
    return c.json({ error: 'Unauthorized: Account has been deleted' }, 401);
  }

  if (user.banned === 1) {
    return c.json({ error: 'Your account has been banned/disabled by the administrator.' }, 403);
  }

  c.set('userId', userId);
  await next();
});

// Heartbeat to update online status
app.post('/api/sync/heartbeat', async (c) => {
  const userId = c.var.userId;
  try {
    const { activeWorkoutName, currentExerciseName, currentMuscle, deviceInfo } = await c.req.json();
    
    // Fetch user details
    const user = await c.env.DB.prepare('SELECT email, name FROM users WHERE id = ?').bind(userId).first<{ email: string; name: string }>();
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const userAgent = c.req.header('User-Agent') || 'Unknown';
    const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Real-IP') || '127.0.0.1';
    const now = Date.now();

    // Resolve a friendly device label from User-Agent
    let resolvedDevice = deviceInfo || 'Unknown';
    if (!deviceInfo) {
      const ua = userAgent.toLowerCase();
      if (ua.includes('iphone')) resolvedDevice = 'iPhone';
      else if (ua.includes('ipad')) resolvedDevice = 'iPad';
      else if (ua.includes('android') && ua.includes('mobile')) resolvedDevice = 'Android Phone';
      else if (ua.includes('android')) resolvedDevice = 'Android Tablet';
      else if (ua.includes('macintosh') || ua.includes('mac os')) resolvedDevice = 'Mac Desktop';
      else if (ua.includes('windows')) resolvedDevice = 'Windows PC';
      else if (ua.includes('linux')) resolvedDevice = 'Linux PC';
      else resolvedDevice = 'Browser';
    }
    
    // Persist last_seen and device into the D1 users table
    await c.env.DB.prepare('UPDATE users SET last_seen = ?, device = ? WHERE id = ?')
      .bind(now, resolvedDevice, userId)
      .run();

    // Save to KV with 30s TTL
    const activeState = {
      userId,
      email: user.email,
      name: user.name || '',
      activeWorkoutName: activeWorkoutName || null,
      currentExerciseName: currentExerciseName || null,
      currentMuscle: currentMuscle || null,
      deviceInfo: resolvedDevice,
      ipAddress,
      timestamp: now
    };
    
    await c.env.SESSIONS.put(`active-user:${userId}`, JSON.stringify(activeState), { expirationTtl: 30 });
    
    return c.json({ success: true });
  } catch (err: any) {
    console.error("Heartbeat failed:", err);
    return c.json({ error: 'Heartbeat failed. Please try again later.' }, 500);
  }
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
      'SELECT unit, default_rest, active_workout_json, updated_at FROM settings WHERE user_id = ?'
    )
      .bind(userId)
      .first<any>();

    const [exercisesRes, templatesRes, historyRes, settingsRes] = await Promise.all([
      exercisesPromise,
      templatesPromise,
      historyPromise,
      settingsPromise,
    ]);

    // Parse JSON lists safely
    const exercises = exercisesRes.results || [];
    
    const templates = (templatesRes.results || []).map((t: any) => {
      let parsedEx = [];
      try {
        parsedEx = t.exercises_json ? JSON.parse(t.exercises_json) : [];
      } catch (e) {
        console.error("Failed to parse exercises_json for template", t.id, e);
      }
      return {
        ...t,
        exercises: Array.isArray(parsedEx) ? parsedEx : [],
      };
    });

    const history = (historyRes.results || []).map((h: any) => {
      let parsedEx = [];
      try {
        parsedEx = h.exercises_json ? JSON.parse(h.exercises_json) : [];
      } catch (e) {
        console.error("Failed to parse exercises_json for history", h.id, e);
      }
      return {
        id: h.id,
        name: h.name,
        notes: h.notes,
        startTime: h.start_time,
        endTime: h.end_time,
        exercises: Array.isArray(parsedEx) ? parsedEx : [],
        updated_at: h.updated_at,
        deleted: h.deleted
      };
    });

    const broadcastStr = await c.env.SESSIONS.get('broadcast:global');
    const broadcast = broadcastStr ? JSON.parse(broadcastStr) : null;

    let activeWorkout = null;
    try {
      activeWorkout = settingsRes?.active_workout_json ? JSON.parse(settingsRes.active_workout_json) : null;
    } catch (e) {
      console.error("Failed to parse active_workout_json", e);
    }
    
    let settingsPayload = null;
    if (settingsRes && (settingsRes.updated_at || 0) > lastPulledAt) {
      settingsPayload = {
        unit: settingsRes.unit,
        default_rest: settingsRes.default_rest,
        updated_at: settingsRes.updated_at
      };
    }

    return c.json({
      exercises,
      templates,
      history,
      settings: settingsPayload,
      activeWorkout,
      broadcast,
      server_time: Date.now(),
    });

  } catch (err: any) {
    console.error("Sync pull failed:", err);
    return c.json({ error: 'Sync pull failed. Please try again later.' }, 500);
  }
});

// ==========================================================================
// SYNC PUSH ROUTE
// ==========================================================================
app.post('/api/sync/push', async (c) => {
  const userId = c.var.userId;
  const { exercises, templates, history, settings, activeWorkout } = await c.req.json();


  try {
    const now = Date.now();
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
               deleted = excluded.deleted
             WHERE excluded.updated_at > exercises.updated_at`
          ).bind(
            ex.id,
            userId,
            ex.name,
            ex.muscle,
            ex.category,
            ex.instructions || '',
            ex.updated_at || now,
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
               deleted = excluded.deleted
             WHERE excluded.updated_at > templates.updated_at`
          ).bind(
            temp.id,
            userId,
            temp.name,
            temp.notes || '',
            JSON.stringify(temp.exercises),
            temp.updated_at || now,
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
               deleted = excluded.deleted
             WHERE excluded.updated_at > history.updated_at`
          ).bind(
            hist.id,
            userId,
            hist.name,
            hist.notes || '',
            hist.startTime,
            hist.endTime,
            JSON.stringify(hist.exercises),
            hist.updated_at || now,
            hist.deleted ? 1 : 0
          )
        );
      }
    }

    // Upsert settings & activeWorkout
    if (settings || activeWorkout !== undefined) {
      const existing = await c.env.DB.prepare('SELECT unit, default_rest FROM settings WHERE user_id = ?').bind(userId).first<any>();
      const unit = settings?.unit || existing?.unit || 'lbs';
      const defaultRest = settings?.default_rest || existing?.default_rest || 90;
      const settingsUpdate = settings?.updated_at || now;

      statements.push(
        c.env.DB.prepare(
          `INSERT INTO settings (user_id, unit, default_rest, active_workout_json, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             unit = excluded.unit,
             default_rest = excluded.default_rest,
             active_workout_json = excluded.active_workout_json,
             updated_at = excluded.updated_at
           WHERE excluded.updated_at >= settings.updated_at`
        ).bind(
          userId,
          unit,
          defaultRest,
          activeWorkout ? JSON.stringify(activeWorkout) : null,
          settingsUpdate
        )
      );
    }


    // Execute all D1 queries in a single atomic batch
    if (statements.length > 0) {
      await c.env.DB.batch(statements);
    }

    // Write activity log for any history created/pushed
    if (Array.isArray(history) && history.length > 0) {
      const user = await c.env.DB.prepare('SELECT email, name FROM users WHERE id = ?').bind(userId).first<{ email: string; name: string }>();
      if (user) {
        for (const hist of history) {
          if (!hist.deleted) {
            const logMsg = `${user.name || user.email} completed workout: "${hist.name}" (${hist.exercises ? hist.exercises.length : 0} exercises)`;
            await addActivityLog(c.env.SESSIONS, user.email, logMsg);
          }
        }
      }
    }

    return c.json({ success: true, synced_at: now });
  } catch (err: any) {
    console.error("Sync push failed:", err);
    return c.json({ error: 'Sync push failed. Please try again later.' }, 500);
  }
});

// ==========================================================================
// ADMIN ACCESS CONTROL MIDDLEWARE
// ==========================================================================
app.use('/api/admin/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing token' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const userId = await c.env.SESSIONS.get(`session:${token}`);

  if (!userId) {
    return c.json({ error: 'Unauthorized: Invalid or expired session' }, 401);
  }

  // Verify this user is the admin
  const user = await c.env.DB.prepare(
    'SELECT email FROM users WHERE id = ?'
  )
    .bind(userId)
    .first<{ email: string }>();

  if (!user || user.email !== 'adityapatil2348@gmail.com') {
    return c.json({ error: 'Forbidden: Admin access only' }, 403);
  }

  c.set('userId', userId);
  await next();
});

// ==========================================================================
// ADMIN ENDPOINTS
// ==========================================================================

// Get all clients (logins) and their details / stats
app.get('/api/admin/clients', async (c) => {
  try {
    // Select all users including last_seen and device columns
    const res = await c.env.DB.prepare(`
      SELECT 
        u.id, 
        u.email, 
        u.name,
        u.created_at,
        u.banned,
        u.last_seen,
        u.device,
        (SELECT COUNT(*) FROM history h WHERE h.user_id = u.id AND h.deleted = 0) as workouts_count,
        (SELECT COUNT(*) FROM templates t WHERE t.user_id = u.id AND t.deleted = 0) as templates_count,
        (SELECT MAX(h.end_time) FROM history h WHERE h.user_id = u.id AND h.deleted = 0) as last_workout_time
      FROM users u
      WHERE u.email != 'adityapatil2348@gmail.com'
      ORDER BY u.created_at DESC
    `).all();

    return c.json({ success: true, clients: res.results || [] });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch clients: ' + err.message }, 500);
  }
});

// Fetch online users active sessions
app.get('/api/admin/online', async (c) => {
  try {
    const list = await c.env.SESSIONS.list({ prefix: 'active-user:' });
    const onlineUsers: any[] = [];
    for (const key of list.keys) {
      const val = await c.env.SESSIONS.get(key.name);
      if (val) {
        try {
          onlineUsers.push(JSON.parse(val));
        } catch (e) {}
      }
    }
    return c.json({ success: true, online: onlineUsers });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch online users: ' + err.message }, 500);
  }
});

// Fetch network-wide activity logs
app.get('/api/admin/logs', async (c) => {
  try {
    const logsStr = await c.env.SESSIONS.get('activity:logs');
    const logs = logsStr ? JSON.parse(logsStr) : [];
    return c.json({ success: true, logs });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch activity logs: ' + err.message }, 500);
  }
});

// Force reset client password
app.post('/api/admin/client/:id/password', async (c) => {
  const clientId = c.req.param('id');
  try {
    const { password } = await c.req.json();
    if (!password || password.length < 6) {
      return c.json({ error: 'New password must be at least 6 characters.' }, 400);
    }
    
    // Verify client exists
    const client = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(clientId).first<{ email: string }>();
    if (!client) {
      return c.json({ error: 'Client not found.' }, 404);
    }
    
    const salt = generateSalt();
    const hash = await hashPassword(password, salt);
    const passwordHash = `${salt}:${hash}`;
    
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, clientId).run();
    
    // Write activity log
    await addActivityLog(c.env.SESSIONS, 'system@bebig.com', `Admin forcefully reset password for ${client.email}`);
    
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: 'Failed to reset password: ' + err.message }, 500);
  }
});

// Fetch workout history logs for a specific client
app.get('/api/admin/client/:id/history', async (c) => {
  const clientId = c.req.param('id');
  try {
    const res = await c.env.DB.prepare(`
      SELECT id, name, notes, start_time, end_time, exercises_json, updated_at
      FROM history
      WHERE user_id = ? AND deleted = 0
      ORDER BY start_time DESC
    `)
      .bind(clientId)
      .all();

    const history = (res.results || []).map((h: any) => ({
      ...h,
      exercises: JSON.parse(h.exercises_json)
    }));

    return c.json({ success: true, history });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch client history: ' + err.message }, 500);
  }
});

// Toggle ban status on a client
app.post('/api/admin/client/:id/ban', async (c) => {
  const clientId = c.req.param('id');
  try {
    const { banned } = await c.req.json();
    const bannedVal = banned ? 1 : 0;

    await c.env.DB.prepare(
      'UPDATE users SET banned = ? WHERE id = ?'
    )
      .bind(bannedVal, clientId)
      .run();

    const client = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(clientId).first<{ email: string }>();
    if (client) {
      const statusStr = bannedVal === 1 ? 'banned' : 'unbanned';
      await addActivityLog(c.env.SESSIONS, 'system@bebig.com', `Admin ${statusStr} user ${client.email}`);
    }

    return c.json({ success: true, banned: bannedVal });
  } catch (err: any) {
    return c.json({ error: 'Failed to update ban status: ' + err.message }, 500);
  }
});

// Delete a client account permanently (cascading batch)
app.delete('/api/admin/client/:id', async (c) => {
  const clientId = c.req.param('id');
  try {
    const client = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(clientId).first<{ email: string }>();
    if (client) {
      await addActivityLog(c.env.SESSIONS, 'system@bebig.com', `Admin permanently deleted user account ${client.email}`);
    }

    const statements = [
      c.env.DB.prepare('DELETE FROM templates WHERE user_id = ?').bind(clientId),
      c.env.DB.prepare('DELETE FROM history WHERE user_id = ?').bind(clientId),
      c.env.DB.prepare('DELETE FROM settings WHERE user_id = ?').bind(clientId),
      c.env.DB.prepare('DELETE FROM exercises WHERE user_id = ?').bind(clientId),
      c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(clientId)
    ];

    await c.env.DB.batch(statements);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: 'Failed to delete client account: ' + err.message }, 500);
  }
});

// Create global broadcast banner message
app.post('/api/admin/broadcast', async (c) => {
  try {
    const { message } = await c.req.json();

    if (!message) {
      return c.json({ error: 'Broadcast message cannot be empty' }, 400);
    }

    const broadcastPayload = {
      message,
      timestamp: Date.now()
    };

    await c.env.SESSIONS.put('broadcast:global', JSON.stringify(broadcastPayload));
    return c.json({ success: true, broadcast: broadcastPayload });
  } catch (err: any) {
    return c.json({ error: 'Failed to send broadcast: ' + err.message }, 500);
  }
});

// Assign a custom template to a specific client
app.post('/api/admin/assign-template', async (c) => {
  try {
    const { userId, template } = await c.req.json();

    if (!userId || !template || !template.name || !Array.isArray(template.exercises)) {
      return c.json({ error: 'Missing target userId or template data' }, 400);
    }

    // Verify target client exists
    const targetUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    )
      .bind(userId)
      .first();

    if (!targetUser) {
      return c.json({ error: 'Target client not found' }, 404);
    }

    const templateId = crypto.randomUUID();
    const now = Date.now();

    // Insert new template for the target client
    await c.env.DB.prepare(
      `INSERT INTO templates (id, user_id, name, notes, exercises_json, updated_at, deleted)
       VALUES (?, ?, ?, ?, ?, ?, 0)`
    )
      .bind(
        templateId,
        userId,
        template.name,
        template.notes || '',
        JSON.stringify(template.exercises),
        now
      )
      .run();

    return c.json({ success: true, templateId });
  } catch (err: any) {
    return c.json({ error: 'Failed to assign template: ' + err.message }, 500);
  }
});

// Fallback Workout Generator in case AI model fails/rate-limits
function getFallbackWorkout(goal: string, split: string, equipment: string, experience: string, duration: string) {
  const splitName = split || 'Full Body';
  const name = `${experience || 'Intermediate'} ${splitName} Protocol`;
  const notes = `Personalized training session designed for ${goal || 'General Fitness'} using ${equipment || 'Full Gym'}. (Automated Fallback Engine)`;
  
  let exercises: any[] = [];
  const splitLower = splitName.toLowerCase();
  
  if (splitLower.includes('push')) {
    exercises = [
      { name: 'Bench Press (Barbell)', muscle: 'Chest', category: 'Barbell', sets: [{ type: 'N', weight: 135, reps: 10 }, { type: 'N', weight: 135, reps: 8 }] },
      { name: 'Overhead Press (Barbell)', muscle: 'Shoulders', category: 'Barbell', sets: [{ type: 'N', weight: 95, reps: 8 }, { type: 'N', weight: 95, reps: 8 }] },
      { name: 'Incline Dumbbell Press', muscle: 'Chest', category: 'Dumbbell', sets: [{ type: 'N', weight: 50, reps: 10 }, { type: 'N', weight: 50, reps: 10 }] },
      { name: 'Tricep Pushdown (Cable)', muscle: 'Triceps', category: 'Cables', sets: [{ type: 'N', weight: 60, reps: 12 }, { type: 'N', weight: 60, reps: 12 }] }
    ];
  } else if (splitLower.includes('pull')) {
    exercises = [
      { name: 'Deadlift (Barbell)', muscle: 'Back', category: 'Barbell', sets: [{ type: 'N', weight: 225, reps: 5 }, { type: 'N', weight: 225, reps: 5 }] },
      { name: 'Pull Up', muscle: 'Back', category: 'Bodyweight', sets: [{ type: 'N', weight: 0, reps: 8 }, { type: 'N', weight: 0, reps: 8 }] },
      { name: 'Bent Over Row (Barbell)', muscle: 'Back', category: 'Barbell', sets: [{ type: 'N', weight: 135, reps: 10 }, { type: 'N', weight: 135, reps: 10 }] },
      { name: 'Bicep Curl (Dumbbell)', muscle: 'Biceps', category: 'Dumbbell', sets: [{ type: 'N', weight: 25, reps: 12 }, { type: 'N', weight: 25, reps: 12 }] }
    ];
  } else if (splitLower.includes('legs') || splitLower.includes('lower')) {
    exercises = [
      { name: 'Squat (Barbell)', muscle: 'Quads', category: 'Barbell', sets: [{ type: 'N', weight: 185, reps: 8 }, { type: 'N', weight: 185, reps: 8 }] },
      { name: 'Romanian Deadlift (Barbell)', muscle: 'Hamstrings', category: 'Barbell', sets: [{ type: 'N', weight: 135, reps: 10 }, { type: 'N', weight: 135, reps: 10 }] },
      { name: 'Leg Press', muscle: 'Quads', category: 'Machine', sets: [{ type: 'N', weight: 270, reps: 10 }, { type: 'N', weight: 270, reps: 10 }] },
      { name: 'Calf Raise', muscle: 'Calves', category: 'Bodyweight', sets: [{ type: 'N', weight: 0, reps: 15 }, { type: 'N', weight: 0, reps: 15 }] }
    ];
  } else if (splitLower.includes('upper')) {
    exercises = [
      { name: 'Bench Press (Barbell)', muscle: 'Chest', category: 'Barbell', sets: [{ type: 'N', weight: 135, reps: 10 }, { type: 'N', weight: 135, reps: 10 }] },
      { name: 'Bent Over Row (Barbell)', muscle: 'Back', category: 'Barbell', sets: [{ type: 'N', weight: 135, reps: 10 }, { type: 'N', weight: 135, reps: 10 }] },
      { name: 'Dumbbell Lateral Raise', muscle: 'Shoulders', category: 'Dumbbell', sets: [{ type: 'N', weight: 15, reps: 12 }, { type: 'N', weight: 15, reps: 12 }] },
      { name: 'Incline Dumbbell Curl', muscle: 'Biceps', category: 'Dumbbell', sets: [{ type: 'N', weight: 20, reps: 12 }, { type: 'N', weight: 20, reps: 12 }] }
    ];
  } else {
    // Full Body or other
    exercises = [
      { name: 'Squat (Barbell)', muscle: 'Quads', category: 'Barbell', sets: [{ type: 'N', weight: 135, reps: 10 }, { type: 'N', weight: 135, reps: 10 }] },
      { name: 'Bench Press (Barbell)', muscle: 'Chest', category: 'Barbell', sets: [{ type: 'N', weight: 135, reps: 10 }, { type: 'N', weight: 135, reps: 10 }] },
      { name: 'Lat Pulldown', muscle: 'Back', category: 'Machine', sets: [{ type: 'N', weight: 110, reps: 10 }, { type: 'N', weight: 110, reps: 10 }] },
      { name: 'Plank', muscle: 'Abs', category: 'Bodyweight', sets: [{ type: 'N', weight: 0, reps: 60 }, { type: 'N', weight: 0, reps: 60 }] }
    ];
  }

  // Adjust sets count based on target duration
  const mins = parseInt(duration, 10) || 45;
  if (mins > 60) {
    exercises.forEach(ex => {
      ex.sets.push({ type: 'N', weight: ex.sets[0].weight, reps: ex.sets[0].reps });
    });
  }

  return { name, notes, exercises };
}

// AI Workout Generation Endpoint (Open to clients and guests)
app.post('/api/ai/generate', async (c) => {
  const { goal, split, equipment, experience, duration, customPrompt } = await c.req.json();
  
  try {
    const systemPrompt = `You are an expert fitness coach and personal trainer. 
Generate a workout routine based on the user's details.
Return ONLY a valid JSON object. Do NOT include any markdown code blocks, backticks, explanations, or extra text.

The JSON object MUST strictly follow this typescript schema:
{
  "name": string (a short, motivating workout name, e.g. "Iron Core Push Day"),
  "notes": string (coach tips/instructions for this session),
  "exercises": Array<{
    "name": string (standard exercise name, e.g. "Bench Press (Barbell)", "Squat (Barbell)", "Bicep Curl (Dumbbell)", "Push Up"),
    "muscle": string (primary muscle target, e.g. "Chest", "Quads", "Biceps", "Triceps", "Shoulders", "Back", "Hamstrings", "Abs", "Calves"),
    "category": string (e.g., "Barbell", "Dumbbell", "Bodyweight", "Machine", "Cables"),
    "sets": Array<{
      "type": "N",
      "weight": number (suggested starting weight in lbs for an intermediate, e.g. 135 for bench press, 30 for dumbbells, 0 for bodyweight exercises),
      "reps": number (suggested target reps, e.g. 8, 10, 12)
    }>
  }>
}`;

    const userPrompt = `Generate a workout with the following criteria:
- Fitness Goal: ${goal || 'General Fitness'}
- Training Split: ${split || 'Full Body'}
- Available Equipment: ${equipment || 'Full Gym'}
- Experience Level: ${experience || 'Intermediate'}
- Target Duration: ${duration || '45'} minutes
${customPrompt ? `- Custom Coach Instructions/Constraints: ${customPrompt}` : ''}`;

    let aiRes: any;
    try {
      aiRes = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1200
      });
    } catch (aiErr) {
      console.error("AI model execution failed, using fallback:", aiErr);
      const fallbackWorkout = getFallbackWorkout(goal, split, equipment, experience, duration);
      return c.json({ success: true, workout: fallbackWorkout, fallback: true });
    }

    let rawText = '';
    if (aiRes && aiRes.response) {
      rawText = aiRes.response.trim();
    } else if (typeof aiRes === 'string') {
      rawText = aiRes.trim();
    } else {
      throw new Error('No response from AI model');
    }

    // Clean any markdown backticks if returned
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }

    // Extract first brace and last brace for robust JSON parsing
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      rawText = rawText.substring(firstBrace, lastBrace + 1);
    }

    try {
      const parsedWorkout = JSON.parse(rawText);
      return c.json({ success: true, workout: parsedWorkout });
    } catch (parseErr) {
      console.error("Failed to parse AI JSON response, using fallback:", parseErr, rawText);
      const fallbackWorkout = getFallbackWorkout(goal, split, equipment, experience, duration);
      return c.json({ success: true, workout: fallbackWorkout, fallback: true });
    }

  } catch (err: any) {
    // Ultimate safety wrapper to guarantee Hono never returns a 500
    const fallbackWorkout = getFallbackWorkout(goal, split, equipment, experience, duration);
    return c.json({ success: true, workout: fallbackWorkout, fallback: true });
  }
});


export default app;
