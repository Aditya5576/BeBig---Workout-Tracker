# Handbook: Deploying BeBig Live on Cloudflare

This guide outlines how to deploy both the Hono API backend and the static frontend of **BeBig** live to Cloudflare’s global edge network.

---

## Part 1: Deploying the Hono API Backend (Cloudflare Workers + D1 + KV)

The backend runs on Cloudflare Workers and connects to a serverless D1 SQL database and a Workers KV session store.

### Step 1: Log in to your Cloudflare account
In your terminal, navigate to the `backend` folder and log in via the Wrangler CLI:
```bash
cd backend
npx wrangler login
```
*This will open a browser window to authenticate with your Cloudflare account.*

### Step 2: Create your production D1 Database
Create the production SQL database:
```bash
npx wrangler d1 create bebig-db
```
**Important**: Note the output of this command. It will display a binding block containing a `database_id`. Copy that database ID.

### Step 3: Create your production Workers KV Namespace
Create the KV store namespace to manage active sessions:
```bash
npx wrangler kv:namespace create SESSIONS
```
**Important**: Note the output. It will display a binding block containing an `id`. Copy that namespace ID.

### Step 4: Update `backend/wrangler.toml`
Open `backend/wrangler.toml` and overwrite the production ids with your new values:
```toml
# Replace these with your actual IDs from Steps 2 & 3:
[[kv_namespaces]]
binding = "SESSIONS"
id = "YOUR_PRODUCTION_KV_NAMESPACE_ID"

[[d1_databases]]
binding = "DB"
database_name = "bebig-db"
database_id = "YOUR_PRODUCTION_D1_DATABASE_ID"
migrations_dir = "migrations"
```

### Step 5: Apply D1 migrations to production
Push the table schema to your live D1 database:
```bash
npx wrangler d1 migrations apply bebig-db --remote
```

### Step 6: Deploy the Worker live
Deploy the worker code to the edge:
```bash
npx wrangler deploy
```
*This will print a deployment URL like `https://bebig-backend.<username>.workers.dev`.*

---

## Part 2: Deploying the Frontend (Cloudflare Pages)

Since the frontend is a vanilla HTML/CSS/JS application, we can host it globally on Cloudflare Pages for free.

### Step 1: Update the API Base URL in `app.js`
Open `app.js` and locate `API_BASE_URL` around the end of the file. Update the production URL with the Worker address you got in Part 1, Step 6:
```javascript
const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8787"
  : "https://bebig-backend.YOUR_SUBDOMAIN.workers.dev"; // Put your worker URL here
```

### Step 2: Push your code to GitHub
Create a private or public GitHub repository and push your project:
```bash
git init
git add .
git commit -m "Initialize BeBig with Serverless Sync Backend"
git remote add origin https://github.com/YOUR_USERNAME/bebig.git
git branch -M main
git push -u origin main
```

### Step 3: Connect GitHub to Cloudflare Pages
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** -> **Create** -> **Pages** -> **Connect to Git**.
3. Select your repository `bebig`.
4. Configure the Build settings:
   - **Framework preset**: `None`
   - **Build command**: *Leave blank*
   - **Build output directory**: *Leave blank or enter `.`* (this deploys the root directory containing `index.html`)
5. Click **Save and Deploy**.

Cloudflare Pages will build and assign your project a live secure address (e.g. `https://bebig.pages.dev`). Any subsequent `git push` to your main branch will automatically rebuild and deploy the updates instantly!
