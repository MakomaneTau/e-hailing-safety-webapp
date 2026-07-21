# Beginner's Complete Setup Guide

This guide takes you from a fresh clone to a working local copy of the
e-hailing safety application. It explains how the pnpm monorepo is arranged,
how to prepare PostgreSQL, how to run the Express API, and how the Next.js
frontend talks to the API.

The guide describes the repository state that includes the authentication
foundation and Google OAuth sign-in. Make sure you are using the branch or
commit that contains this guide and the files under
`apps/api/src/modules/auth/`.

## 1. What you will run

The project has three workspace packages:

```text
Browser
  |
  | http://localhost:3000
  v
Next.js frontend (apps/web)
  |
  | NEXT_PUBLIC_API_URL=http://localhost:5000
  | JSON requests with cookies
  v
Express API (apps/api)
  |
  | DATABASE_URL
  v
PostgreSQL (e_hailing_safety)

Shared TypeScript contracts (packages/shared)
  -> imported by both web and api
```

During local development, each service has a different address:

| Service | Local address | Purpose |
| --- | --- | --- |
| Next.js frontend | `http://localhost:3000` | Pages the learner opens in a browser |
| Express API | `http://localhost:5000` | Health and authentication endpoints |
| PostgreSQL | `localhost:5432` | Stores users, sessions, and OAuth accounts |

These ports are not interchangeable. Port 3000 serves the interface, port
5000 serves HTTP API requests, and port 5432 is only for PostgreSQL clients.

### What is connected in this branch

- The signup and login forms call the Express API.
- The API validates input, hashes passwords, and creates database-backed
  sessions.
- The API sends the browser an HttpOnly session cookie.
- Health, signup, login, current-user, logout, and logout-all endpoints exist.
- "Sign in with Google" is wired up end to end: the login and signup pages
  link to the API's OAuth start route, and the API completes the exchange
  and creates a session. See Section 6a.

The authentication foundation is not yet a complete product:

- Dashboard and profile pages are not protected by an authentication guard.
- The current-user and logout client helpers exist but are not connected to
  the visible navigation.
- Report submission, file upload, report management, forgot-password, and
  email verification are not implemented.
- Google accounts are created with an `emailVerified: true` API response,
  but this is not currently persisted to the `users.email_verified` column
  — see the note in Section 6a.
- There is no automated migration runner or automated test suite yet.

## 2. Understand the monorepo

A monorepo stores multiple related applications and packages in one Git
repository. This project uses pnpm workspaces so the frontend, API, and shared
types can be developed together while still being deployed separately.

```text
e-hailing-safety-webapp/
|-- apps/
|   |-- api/                         Express API
|   |   |-- src/
|   |   |   |-- config/              Environment and CORS configuration
|   |   |   |-- database/            PostgreSQL pool and SQL migrations
|   |   |   |   |-- 01_create_auth_tables.sql
|   |   |   |   `-- 02_create_oauth_accounts.sql   (Google OAuth accounts)
|   |   |   |-- middleware/          Validation, auth, and error handling
|   |   |   |-- modules/auth/        Authentication feature (incl. Google OAuth)
|   |   |   |-- app.ts               Express middleware and routes
|   |   |   `-- server.ts            Process startup and shutdown
|   |   `-- package.json
|   `-- web/                         Next.js frontend
|       |-- app/
|       |   |-- lib/auth/api.ts      Browser authentication client
|       |   |-- login/page.tsx       Connected login form (+ Google button)
|       |   `-- signup/page.tsx      Connected signup form (+ Google button)
|       `-- package.json
|-- packages/
|   `-- shared/                      Shared TypeScript contracts
|-- package.json                      Root commands and tool versions
|-- pnpm-workspace.yaml               Workspace folder patterns
|-- pnpm-lock.yaml                    One dependency lockfile
|-- render.yaml                       Render API and database Blueprint
`-- DEPLOYMENT.md                    Production deployment reference
```

> **Duplicate migration file warning**: this branch's diff introduced two
> migration files with identical contents:
> `apps/api/src/database/migrations/02_create_oauth_account.sql` (singular)
> and `02_create_oauth_accounts.sql` (plural). Only the plural file is
> referenced in this guide, matching the naming convention of
> `01_create_auth_tables.sql`. Delete the singular file before running
> migrations so you don't accidentally apply the same `CREATE TABLE`
> twice from two different files.

The root `pnpm-workspace.yaml` includes:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Each workspace has a package name:

- `apps/web/package.json`: `web`
- `apps/api/package.json`: `api`
- `packages/shared/package.json`: `@project/shared`

The root scripts use those names as filters. For example, `pnpm dev:api`
runs the `dev` script only in the package named `api`. Both apps list
`@project/shared` as `workspace:*`, so pnpm links the local shared
package instead of downloading it from a registry.

Follow these monorepo rules:

1. Run install, build, and development commands from the repository root.
2. Use pnpm rather than npm so the workspace links and root lockfile stay
   consistent.
3. Do not create separate lockfiles inside `apps/api` or `apps/web`.
4. Add a package to one workspace with a filter, for example:

```powershell
   pnpm.cmd --filter api add <package-name>
   pnpm.cmd --filter web add <package-name>
```

## 3. Install the prerequisites

Install the following software before setting up the project:

| Tool | Required version | Check command |
| --- | --- | --- |
| Git | A current version | `git --version` |
| Node.js | 20 or newer | `node --version` |
| pnpm | 10.15.0 recommended | `pnpm --version` |
| PostgreSQL | A supported local version | `psql --version` |

The repository declares Node 20+ and pnpm 10.15.0 in the root
`package.json`. If Node is installed but pnpm is missing, install the
declared pnpm version:

```powershell
npm install --global pnpm@10.15.0
```

You can also use Corepack where it is available:

```powershell
corepack enable
corepack prepare pnpm@10.15.0 --activate
```

On Windows PowerShell, an execution policy may block `pnpm.ps1`. Use
`pnpm.cmd` in that case. The Bash examples below use `pnpm`.

## 4. Get the repository and install dependencies

For a fresh clone, replace the placeholders with the repository URL and the
branch you were given:

```powershell
git clone <repository-url>
Set-Location e-hailing-safety-webapp
git switch <branch-name>
```

If you already have the correct branch open, start at the repository root:

```powershell
pnpm.cmd install
```

On macOS, Linux, or WSL:

```bash
pnpm install
```

This single install resolves dependencies for every workspace and links
`@project/shared` into both applications. Do not run another install
inside either app.

## 5. Create and prepare PostgreSQL

The API will not start until it can connect to PostgreSQL. Creating the
database and applying the migrations are separate steps. There are now two
migrations to apply, in order: the authentication foundation, then the
Google OAuth accounts table.

### Option A: use psql

Make sure the PostgreSQL service is running. From the repository root, create
the local database:

```powershell
psql -h localhost -U postgres -W -d postgres -c "CREATE DATABASE e_hailing_safety;"
```

The `-W` option asks for the password of the local `postgres` user.
Then apply the authentication migration:

```powershell
psql -h localhost -U postgres -W -d e_hailing_safety -f .\apps\api\src\database\migrations\01_create_auth_tables.sql
```

Then apply the OAuth accounts migration:

```powershell
psql -h localhost -U postgres -W -d e_hailing_safety -f .\apps\api\src\database\migrations\02_create_oauth_accounts.sql
```

The equivalent Bash commands use forward slashes:

```bash
psql -h localhost -U postgres -W -d e_hailing_safety \
  -f apps/api/src/database/migrations/01_create_auth_tables.sql

psql -h localhost -U postgres -W -d e_hailing_safety \
  -f apps/api/src/database/migrations/02_create_oauth_accounts.sql
```

Confirm that the tables exist:

```powershell
psql -h localhost -U postgres -W -d e_hailing_safety -c "\dt"
```

You should see `users`, `sessions`, and `oauth_accounts`.

### Option B: use pgAdmin

1. Connect to the local PostgreSQL server in pgAdmin.
2. Right-click `Databases`, choose `Create > Database`, and name it
   `e_hailing_safety`.
3. Select the new database and open `Query Tool`.
4. Open
   `apps/api/src/database/migrations/01_create_auth_tables.sql`,
   run the complete script, and confirm that it finishes successfully.
5. Open `Query Tool` again (or clear it) and open
   `apps/api/src/database/migrations/02_create_oauth_accounts.sql`,
   run it, and confirm that it finishes successfully.
6. Refresh `Schemas > public > Tables`; `users`, `sessions`, and
   `oauth_accounts` should appear.

Both SQL files are one-time migrations, not idempotent scripts. Do not run
either one again after it succeeds, because PostgreSQL will report that the
tables already exist.

## 6. Configure local environment files

Environment files hold values that differ between machines. The real files are
ignored by Git; only safe examples are committed.

### API environment

On Windows PowerShell:

```powershell
Copy-Item apps\api\.env.example apps\api\.env
```

On macOS, Linux, or WSL:

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```dotenv
DATABASE_URL=postgresql://postgres:YOUR_URL_ENCODED_PASSWORD@localhost:5432/e_hailing_safety
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=5000
SESSION_TTL_DAYS=7
COOKIE_SAME_SITE=lax
# Google OAuth Configuration (optional, see Section 6a)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/oauth/google/callback
```

Replace `YOUR_URL_ENCODED_PASSWORD` with the password for your local
PostgreSQL user. A database connection string has this shape:

```text
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

Characters such as `@`, `:`, `/`, `#`, and `%`
have special meaning in URLs. Percent-encode them if they are part of the
password. For a first local setup, a PostgreSQL password containing ordinary
letters and numbers is simpler.

API variable meanings:

| Variable | Local value | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | Local PostgreSQL URL | Required database connection |
| `FRONTEND_URL` | `http://localhost:3000` | Exact browser origin allowed by CORS |
| `NODE_ENV` | `development` | Enables development behavior |
| `PORT` | `5000` | API HTTP port |
| `SESSION_TTL_DAYS` | `7` | Cookie and session lifetime; maximum 30 |
| `COOKIE_SAME_SITE` | `lax` | Appropriate for local same-site development |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | OAuth client identifier; optional, see 6a |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | OAuth client secret; optional, see 6a |
| `GOOGLE_REDIRECT_URI` | `http://localhost:5000/api/auth/oauth/google/callback` | Must match the redirect URI registered with Google exactly |

### Frontend environment

On Windows PowerShell:

```powershell
Copy-Item apps\web\.env.example apps\web\.env.local
```

On macOS, Linux, or WSL:

```bash
cp apps/web/.env.example apps/web/.env.local
```

The content of `apps/web/.env.local` is:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000
```

`NEXT_PUBLIC_` means the value is intentionally visible to browser
JavaScript. It must contain only the public API origin, never a password or
secret. Do not add a trailing slash because the client appends paths such as
`/api/auth/login` and `/api/auth/oauth/google/start`.

Keep `localhost` consistent. For example, opening the frontend through
`http://127.0.0.1:3000` will not match a
`FRONTEND_URL=http://localhost:3000` origin.

Restart the Next.js development server whenever
`NEXT_PUBLIC_API_URL` changes.

## 6a. Configure Google OAuth (optional)

This branch adds a "Sign in with Google" option using the authorization
code flow with PKCE. It is optional for local development — the app still
works with email/password only if you skip this section.

### Get Google OAuth credentials

1. In the [Google Cloud Console](https://console.cloud.google.com/), create
   or select a project.
2. Go to **APIs & Services > Credentials** and create an **OAuth 2.0 Client
   ID** of type **Web application**.
3. Add an authorized redirect URI matching your local API:

```text
   http://localhost:5000/api/auth/oauth/google/callback
```

4. Copy the generated **Client ID** and **Client Secret**.

### Add the values to `apps/api/.env`

Paste your real Client ID and Client Secret over the placeholders shown in
Section 6:

```dotenv
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/oauth/google/callback
```

Leave `GOOGLE_REDIRECT_URI` as shown for local development — it must
exactly match the redirect URI registered in the Google Cloud Console,
including protocol, host, port, and path.

> **Note on required-but-optional values**: `env.ts` marks these three
> variables as optional so the app can still start without Google OAuth
> configured. However, the OAuth code paths read them with a non-null
> assertion (`process.env.GOOGLE_CLIENT_ID!` and similar), so leaving them
> unset does not produce a clear startup error. Instead, you'll get a
> runtime failure or a broken redirect only once the OAuth flow actually
> runs. If Google sign-in isn't working, check that all three variables
> are set in `apps/api/.env` before looking elsewhere.

### How the flow works

1. The browser opens `/api/auth/oauth/google/start`.
2. The API generates a PKCE verifier/challenge pair and a random `state`
   value, stores `state` and the verifier in short-lived HttpOnly cookies,
   and redirects the browser to Google's authorization page.
3. After the user signs in and consents, Google redirects back to
   `/api/auth/oauth/google/callback` with a `code` and the original
   `state`.
4. The API checks that `state` matches the cookie value, exchanges the
   code (with the PKCE verifier) for an access token, fetches the Google
   profile, creates or reuses a local user, creates a session, sets the
   normal session cookie, and redirects to `/dashboard`.

### Known gap in this branch

`finishGoogleLogin` creates a new local user record if no existing user
matches the Google account's email, using a random password hash as a
placeholder (there's no password to store for an OAuth-only account). The
API response marks that user as `emailVerified: true`, but this status is
not currently persisted back to the `users` table — the repository-layer
update is left as a comment rather than implemented. Don't rely on the
database `email_verified` column being accurate for Google-created
accounts yet.

### Test it

1. Start both terminals as described in Section 7.
2. Open `http://localhost:3000/login` or `http://localhost:3000/signup`.
3. Select the Google icon.
4. Confirm you're redirected to Google, then back to `/dashboard` with a
   session cookie set (same verification steps as Section 8).

## 7. Start the application

There is intentionally no combined development command. Use two terminals so
the API and frontend logs remain easy to read.

### Terminal 1: start the API

From the repository root:

```powershell
pnpm.cmd dev:api
```

Bash:

```bash
pnpm dev:api
```

The command runs the API with file watching. Before listening, the server
validates the environment and sends `SELECT 1` to PostgreSQL. A successful
startup prints:

```text
API listening on port 5000
```

### Verify the API and database

In another PowerShell window:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

Bash:

```bash
curl http://localhost:5000/api/health
```

A successful response has this shape:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-01-01T12:00:00.000Z"
  }
}
```

This endpoint checks the database connection, but it does not check whether the
authentication migrations were applied. A health response can succeed while
signup still fails with `relation "users" does not exist`.

The API has no route at `/`. A 404 response there is expected; use
`/api/health`.

### Terminal 2: start the frontend

From the repository root:

```powershell
pnpm.cmd dev:web
```

Bash:

```bash
pnpm dev:web
```

Open `http://localhost:3000`. The root page currently renders the login
interface. You can also open `http://localhost:3000/signup` directly.

## 8. Test signup, login, and the session

### Browser test

1. Open `http://localhost:3000/signup`.
2. Enter a name with at least 2 characters.
3. Enter a valid email address.
4. Enter the same password in both password fields. It must contain 8 to 128
   characters.
5. Select `Create Account`.
6. Confirm that the browser redirects to `/dashboard`.
7. Open the browser developer tools and inspect the signup request:
   - URL: `http://localhost:5000/api/auth/signup`
   - Status: `201`
   - Response: public user data, never a password or session token
   - Cookie: an HttpOnly cookie named `session` for local development
8. Return to `/login` and sign in with the same credentials.

The dashboard redirect proves the form received a successful API response. It
does not currently prove that the dashboard is protected; route protection is
future work.

You can inspect the created rows without displaying password hashes:

```powershell
psql -h localhost -U postgres -W -d e_hailing_safety -c "SELECT id, name, email, role, email_verified, created_at FROM users;"
psql -h localhost -U postgres -W -d e_hailing_safety -c "SELECT id, user_id, expires_at, last_used_at FROM sessions;"
psql -h localhost -U postgres -W -d e_hailing_safety -c "SELECT id, user_id, provider, email, created_at FROM oauth_accounts;"
```

### Optional PowerShell API test

This test stores the cookie returned by signup and sends it to the protected
current-user endpoint:

```powershell
$body = @{
  name = "Learner User"
  email = "learner@example.com"
  password = "learning123"
} | ConvertTo-Json

$signupResponse = Invoke-RestMethod `
  -Uri http://localhost:5000/api/auth/signup `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{ Origin = "http://localhost:3000" } `
  -Body $body `
  -SessionVariable authSession

$signupResponse

Invoke-RestMethod `
  -Uri http://localhost:5000/api/auth/me `
  -WebSession $authSession
```

Use another email address if the learner account already exists.

### Optional curl API test

```bash
curl -i -c cookies.txt \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"name":"Learner User","email":"learner@example.com","password":"learning123"}' \
  http://localhost:5000/api/auth/signup

curl -b cookies.txt http://localhost:5000/api/auth/me
```

Delete the local `cookies.txt` after the test because it contains a live
development session token.

## 9. How the frontend connects to the API

The signup request follows this sequence:

```text
signup/page.tsx
  -> reads form fields
  -> calls signup() in app/lib/auth/api.ts
  -> fetch("http://localhost:5000/api/auth/signup")
  -> Express validates Origin and JSON
  -> Zod validates name, email, and password
  -> Argon2id hashes the password
  -> PostgreSQL transaction inserts user + session
  -> API sets an HttpOnly session cookie
  -> frontend receives public user data
  -> browser navigates to /dashboard
```

The Google sign-in button follows a separate, redirect-based sequence
instead of a fetch call — see Section 6a for the full flow.

The important connection points are:

| File | Responsibility |
| --- | --- |
| `apps/web/.env.local` | Gives browser code the API origin |
| `apps/web/app/lib/auth/api.ts` | Builds requests, sends JSON, includes cookies, and handles API errors |
| `apps/web/app/login/page.tsx` | Calls the login client helper; links to Google OAuth start |
| `apps/web/app/signup/page.tsx` | Calls the signup client helper; links to Google OAuth start |
| `apps/api/src/config/cors.ts` | Allows credentialed browser requests from the exact frontend origin |
| `apps/api/src/middleware/validate-origin.ts` | Rejects unsafe requests from another origin |
| `apps/api/src/modules/auth/` | Implements auth routes, validation, services, SQL access, and Google OAuth |
| `apps/api/src/modules/auth/session.ts` | Generates, hashes, and configures session cookies |

The frontend uses `credentials: "include"` on every auth request. Without
it, the browser would neither retain the API's cookie nor send that cookie to
protected endpoints.

The raw random session token is sent only in the HttpOnly cookie. PostgreSQL
stores a SHA-256 hash of the token, while passwords are stored as Argon2id
hashes. Browser JavaScript cannot read an HttpOnly cookie, but the browser can
attach it automatically to allowed requests.

## 10. API reference

| Method | Endpoint | Authentication | Result |
| --- | --- | --- | --- |
| `GET` | `/api/health` | No | Tests PostgreSQL and returns status |
| `POST` | `/api/auth/signup` | No | Creates a user and session; returns 201 |
| `POST` | `/api/auth/login` | No | Verifies credentials and creates a session |
| `GET` | `/api/auth/me` | Session cookie | Returns the current public user |
| `POST` | `/api/auth/logout` | Session cookie | Deletes the current session; returns 204 |
| `POST` | `/api/auth/logout-all` | Session cookie | Deletes all sessions for the user; returns 204 |
| `GET` | `/api/auth/oauth/google/start` | No | Redirects the browser to Google's consent screen |
| `GET` | `/api/auth/oauth/google/callback` | No | Exchanges the code, creates/reuses a user and session, redirects to `/dashboard` |

Signup validation rules:

- Name: 2 to 100 characters after trimming.
- Email: valid email address; normalized to lowercase.
- Password: 8 to 128 characters.

Signup and login share a limit of 10 attempts in 15 minutes per rate-limit key.
Invalid request bodies return 400, wrong credentials return 401, and duplicate
emails return 409.

## 11. Common monorepo commands

Run all commands from the repository root. On PowerShell, replace `pnpm`
with `pnpm.cmd` if necessary.

| Command | Purpose |
| --- | --- |
| `pnpm install` | Install and link every workspace |
| `pnpm dev:api` | Run the API with file watching |
| `pnpm dev:web` | Run the Next.js development server |
| `pnpm build:api` | Compile API TypeScript into `apps/api/dist` |
| `pnpm start:api` | Start the already-built API |
| `pnpm build:web` | Create a normal Next.js production build |
| `pnpm --filter web lint` | Lint the frontend |
| `pnpm --filter web preview` | Build and preview the Cloudflare worker |
| `pnpm deploy:web` | Build and deploy the Cloudflare worker |

The API's current `test` script intentionally exits with an error because
no test suite has been added. Do not use it as a setup verification command.

Before committing changes, the useful checks are:

```powershell
pnpm.cmd build:api
pnpm.cmd build:web
pnpm.cmd --filter web lint
```

OpenNext's Cloudflare preview is most representative on Linux or WSL.

## 12. Production handoff

Local setup is complete when the health endpoint works and signup/login can
create and reuse a session. Production uses a split deployment:

- Next.js frontend: Cloudflare Workers through OpenNext.
- Express API: Render Web Service.
- PostgreSQL: Render PostgreSQL.

Read [DEPLOYMENT.md](DEPLOYMENT.md) for the platform-specific controls. The
important order and auth-specific additions are:

1. Commit and push the full branch, including the auth source, both
   migrations, environment examples, and this guide.
2. Create the Render Blueprint from the repository root. It builds the
   `api` workspace and injects the Render database connection into
   `DATABASE_URL`.
3. Obtain the deployed Render API origin, such as
   `https://<api-service>.onrender.com`.
4. Create the Cloudflare Workers Builds project from the repository root and
   set its build-time variable:

```dotenv
   NEXT_PUBLIC_API_URL=https://<api-service>.onrender.com
```

5. Deploy the frontend and copy its exact HTTPS origin.
6. In Render, set `FRONTEND_URL` to that exact Cloudflare origin without
   a trailing slash, then restart or redeploy the API.
7. When using the default cross-site `workers.dev` and
   `onrender.com` domains, also set:

```dotenv
   COOKIE_SAME_SITE=none
   SESSION_TTL_DAYS=7
```

   Production mode already makes the cookie Secure. Browser restrictions on
   third-party cookies can still affect unrelated domains; same-site custom
   frontend and API subdomains are a more robust production arrangement.
8. Apply both
   `apps/api/src/database/migrations/01_create_auth_tables.sql` and
   `apps/api/src/database/migrations/02_create_oauth_accounts.sql` once to
   the production database before testing auth. The current branch does not
   automate production migrations.
9. If enabling Google sign-in in production, register a second OAuth
   redirect URI in the Google Cloud Console pointing at
   `https://<api-service>.onrender.com/api/auth/oauth/google/callback`,
   and set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and
   `GOOGLE_REDIRECT_URI` on the Render service to match.
10. Verify `https://<api-service>.onrender.com/api/health`, then test
    signup (and Google sign-in, if configured) from the deployed frontend.

`NEXT_PUBLIC_API_URL` is embedded during the frontend build. Changing it
requires a new Cloudflare build and deployment.

The Blueprint's database connection works when the API and database are created
together in the same Render workspace. If they are in different Render
accounts or workspaces, the API cannot use the other database's internal URL;
use an appropriately secured external connection instead.

## 13. Troubleshooting

| Symptom | Likely cause | Correction |
| --- | --- | --- |
| `pnpm.ps1 cannot be loaded` | PowerShell execution policy blocks the wrapper | Use `pnpm.cmd` |
| `psql is not recognized` | PostgreSQL's `bin` folder is not on PATH | Use pgAdmin or add the installed PostgreSQL `bin` directory to PATH |
| `database "e_hailing_safety" does not exist` | Database was not created or URL names another DB | Create it and recheck `DATABASE_URL` |
| `ECONNREFUSED ...:5432` locally | PostgreSQL is stopped, on another port, or the URL is wrong | Start PostgreSQL and test the same credentials with `psql` |
| `ECONNREFUSED 127.0.0.1:5432` on Render | Production is using a local placeholder URL | Use the Render PostgreSQL connection URL, not localhost |
| `relation "users" does not exist` | Health works, but auth migration was not applied | Run `01_create_auth_tables.sql` against the selected DB |
| `relation "oauth_accounts" does not exist` | OAuth migration was not applied | Run `02_create_oauth_accounts.sql` against the selected DB |
| `relation "..." already exists` | A one-time migration was run twice | Do not rerun it; inspect the existing tables |
| `Invalid API environment configuration` | Required value is missing or malformed | Check every value in `apps/api/.env` |
| CORS rejection or `Request origin is not allowed` | `FRONTEND_URL` differs by protocol, host, port, or slash | Use the exact browser origin, normally `http://localhost:3000` |
| Browser says `Failed to fetch` | API is stopped or frontend points to the wrong origin | Test `/api/health`, correct `NEXT_PUBLIC_API_URL`, and restart Next.js |
| Frontend build says API URL is not configured | Build environment lacks `NEXT_PUBLIC_API_URL` | Add it to `.env.local` or the Cloudflare build variables |
| Login succeeds but `/api/auth/me` returns 401 | Cookie was not stored or sent | Keep `credentials: "include"`; locally use `lax`; for default split production domains use `none` over HTTPS |
| Signup returns 400 | Name, email, or password failed server validation | Read the displayed validation message and use the rules above |
| Signup returns 409 | The email already exists | Log in or test with another email |
| Auth returns 429 | Too many signup/login attempts | Wait for the 15-minute rate-limit window |
| `GET /` on port 5000 returns 404 | The API has no root route | Request `/api/health` |
| Google sign-in redirects to an error page or fails silently | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, or `GOOGLE_REDIRECT_URI` unset or mismatched | Set all three in `apps/api/.env`; confirm the redirect URI is registered exactly in the Google Cloud Console |
| `Invalid state parameter` on the OAuth callback | State cookie missing, expired (10-minute limit), or blocked by browser third-party cookie settings | Restart the flow from `/login`; check browser cookie settings |
| Two `02_*` migration files present in the repo | Duplicate migration accidentally committed | Delete `02_create_oauth_account.sql` (singular); keep `02_create_oauth_accounts.sql` (plural) |

## 14. Quick-start checklist

Use this list after reading the explanations:

- [ ] Confirm Node 20+, pnpm 10.15.0, and PostgreSQL are installed.
- [ ] Run `pnpm install` from the repository root.
- [ ] Create the `e_hailing_safety` database.
- [ ] Apply `01_create_auth_tables.sql` once.
- [ ] Apply `02_create_oauth_accounts.sql` once.
- [ ] Copy and edit `apps/api/.env`.
- [ ] Copy `apps/web/.env.local`.
- [ ] (Optional) Add Google OAuth credentials to `apps/api/.env` — see Section 6a.
- [ ] Start PostgreSQL.
- [ ] Run `pnpm dev:api` in terminal 1.
- [ ] Verify `http://localhost:5000/api/health`.
- [ ] Run `pnpm dev:web` in terminal 2.
- [ ] Open `http://localhost:3000/signup`.
- [ ] Create an account and confirm the dashboard redirect.
- [ ] (Optional) Test the Google sign-in button.
- [ ] Run the API build, frontend build, and frontend lint checks.

At that point, the monorepo, PostgreSQL database, Express API, frontend API
origin, CORS policy, browser session cookie, and Google OAuth (if configured)
are connected locally.