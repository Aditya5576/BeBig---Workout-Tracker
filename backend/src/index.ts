import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  SESSIONS: KVNamespace;
  AI: any;
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

    return c.json({ success: true, token, email: normalizedEmail, name: userName });
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
    // Intercept special admin account
    if (normalizedEmail === 'adityapatil2348@gmail.com') {
      if (password !== 'Aaditynil') {
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
      id: h.id,
      name: h.name,
      notes: h.notes,
      startTime: h.start_time,
      endTime: h.end_time,
      exercises: JSON.parse(h.exercises_json),
      updated_at: h.updated_at,
      deleted: h.deleted
    }));

    const broadcastStr = await c.env.SESSIONS.get('broadcast:global');
    const broadcast = broadcastStr ? JSON.parse(broadcastStr) : null;

    return c.json({
      exercises,
      templates,
      history,
      settings: settingsRes || null,
      broadcast,
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
               deleted = excluded.deleted`
          ).bind(
            ex.id,
            userId,
            ex.name,
            ex.muscle,
            ex.category,
            ex.instructions || '',
            now,
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
            now,
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
            now,
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
          now
        )
      );
    }

    // Execute all D1 queries in a single atomic batch
    if (statements.length > 0) {
      await c.env.DB.batch(statements);
    }

    return c.json({ success: true, synced_at: now });
  } catch (err: any) {
    return c.json({ error: 'Sync push failed: ' + err.message }, 500);
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
    // Select all users, and calculate their completed workouts, templates, and last workout time
    const res = await c.env.DB.prepare(`
      SELECT 
        u.id, 
        u.email, 
        u.created_at,
        u.banned,
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

    return c.json({ success: true, banned: bannedVal });
  } catch (err: any) {
    return c.json({ error: 'Failed to update ban status: ' + err.message }, 500);
  }
});

// Delete a client account permanently (cascading batch)
app.delete('/api/admin/client/:id', async (c) => {
  const clientId = c.req.param('id');
  try {
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

// AI Workout Generation Endpoint (Open to clients and guests)
app.post('/api/ai/generate', async (c) => {
  try {
    const { goal, split, equipment, experience, duration } = await c.req.json();

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
}

Generate between 3 to 6 exercises appropriate for the split and duration. Suggest realistic weights and normal rep targets.`;

    const userPrompt = `Generate a workout with the following criteria:
- Fitness Goal: ${goal || 'General Fitness'}
- Training Split: ${split || 'Full Body'}
- Available Equipment: ${equipment || 'Full Gym'}
- Experience Level: ${experience || 'Intermediate'}
- Target Duration: ${duration || '45'} minutes`;

    const aiRes: any = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1200
    });

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

    const parsedWorkout = JSON.parse(rawText);
    return c.json({ success: true, workout: parsedWorkout });

  } catch (err: any) {
    return c.json({ error: 'AI generation failed: ' + err.message }, 500);
  }
});

export default app;
