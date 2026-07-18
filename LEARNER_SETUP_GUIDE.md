# Beginner's Complete Setup Guide

This guide takes you from a fresh clone to a working local copy of the
e-hailing safety application. It explains how the pnpm monorepo is arranged,
how to prepare PostgreSQL, how to run the Express API, and how the Next.js
frontend talks to the API.

The guide describes the repository state that includes the authentication
foundation. Make sure you are using the branch or commit that contains this
guide and the files under `apps/api/src/modules/auth/`.

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
| PostgreSQL | `localhost:5432` | Stores users and sessions |

These ports are not interchangeable. Port 3000 serves the interface, port
5000 serves HTTP API requests, and port 5432 is only for PostgreSQL clients.

### What is connected in this branch

- The signup and login forms call the Express API.
- The API validates input, hashes passwords, and creates database-backed
  sessions.
- The API sends the browser an HttpOnly session cookie.
- Health, signup, login, current-user, logout, and logout-all endpoints exist.

The authentication foundation is not yet a complete product:

- Dashboard and profile pages are not protected by an authentication guard.
- The current-user and logout client helpers exist but are not connected to the
  visible navigation.
- Report submission, file upload, report management, social login,
  forgot-password, email verification, and the remember-me option are not
  implemented.
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
|   |   |   |-- middleware/          Validation, auth, and error handling
|   |   |   |-- modules/auth/        Authentication feature
|   |   |   |-- app.ts               Express middleware and routes
|   |   |   `-- server.ts            Process startup and shutdown
|   |   `-- package.json
|   `-- web/                         Next.js frontend
|       |-- app/
|       |   |-- lib/auth/api.ts      Browser authentication client
|       |   |-- login/page.tsx       Connected login form
|       |   `-- signup/page.tsx      Connected signup form
|       `-- package.json
|-- packages/
|   `-- shared/                      Shared TypeScript contracts
|-- package.json                      Root commands and tool versions
|-- pnpm-workspace.yaml               Workspace folder patterns
|-- pnpm-lock.yaml                    One dependency lockfile
|-- render.yaml                       Render API and database Blueprint
`-- DEPLOYMENT.md                    Production deployment reference
```

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
database and applying the migration are separate steps.

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

The equivalent Bash command uses forward slashes:

```bash
psql -h localhost -U postgres -W -d e_hailing_safety \
  -f apps/api/src/database/migrations/01_create_auth_tables.sql
```

Confirm that the two tables exist:

```powershell
psql -h localhost -U postgres -W -d e_hailing_safety -c "\dt"
```

You should see `users` and `sessions`.

### Option B: use pgAdmin

1. Connect to the local PostgreSQL server in pgAdmin.
2. Right-click `Databases`, choose `Create > Database`, and name it
   `e_hailing_safety`.
3. Select the new database and open `Query Tool`.
4. Open
   `apps/api/src/database/migrations/01_create_auth_tables.sql`.
5. Run the complete script and confirm that it finishes successfully.
6. Refresh `Schemas > public > Tables`; `users` and `sessions`
   should appear.

The current SQL file is a one-time migration, not an idempotent script. Do not
run it again after it succeeds, because PostgreSQL will report that the tables
already exist.

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
`/api/auth/login`.

Keep `localhost` consistent. For example, opening the frontend through
`http://127.0.0.1:3000` will not match a
`FRONTEND_URL=http://localhost:3000` origin.

Restart the Next.js development server whenever
`NEXT_PUBLIC_API_URL` changes.

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
authentication migration was applied. A health response can succeed while
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

The important connection points are:

| File | Responsibility |
| --- | --- |
| `apps/web/.env.local` | Gives browser code the API origin |
| `apps/web/app/lib/auth/api.ts` | Builds requests, sends JSON, includes cookies, and handles API errors |
| `apps/web/app/login/page.tsx` | Calls the login client helper |
| `apps/web/app/signup/page.tsx` | Calls the signup client helper |
| `apps/api/src/config/cors.ts` | Allows credentialed browser requests from the exact frontend origin |
| `apps/api/src/middleware/validate-origin.ts` | Rejects unsafe requests from another origin |
| `apps/api/src/modules/auth/` | Implements auth routes, validation, services, and SQL access |
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

1. Commit and push the full branch, including the auth source, migration,
   environment examples, and this guide.
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
8. Apply
   `apps/api/src/database/migrations/01_create_auth_tables.sql` once to
   the production database before testing auth. The current branch does not
   automate production migrations.
9. Verify `https://<api-service>.onrender.com/api/health`, then test
   signup from the deployed frontend.

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
| `relation "users" already exists` | One-time migration was run twice | Do not rerun it; inspect the existing tables |
| `Invalid API environment configuration` | Required value is missing or malformed | Check every value in `apps/api/.env` |
| CORS rejection or `Request origin is not allowed` | `FRONTEND_URL` differs by protocol, host, port, or slash | Use the exact browser origin, normally `http://localhost:3000` |
| Browser says `Failed to fetch` | API is stopped or frontend points to the wrong origin | Test `/api/health`, correct `NEXT_PUBLIC_API_URL`, and restart Next.js |
| Frontend build says API URL is not configured | Build environment lacks `NEXT_PUBLIC_API_URL` | Add it to `.env.local` or the Cloudflare build variables |
| Login succeeds but `/api/auth/me` returns 401 | Cookie was not stored or sent | Keep `credentials: "include"`; locally use `lax`; for default split production domains use `none` over HTTPS |
| Signup returns 400 | Name, email, or password failed server validation | Read the displayed validation message and use the rules above |
| Signup returns 409 | The email already exists | Log in or test with another email |
| Auth returns 429 | Too many signup/login attempts | Wait for the 15-minute rate-limit window |
| `GET /` on port 5000 returns 404 | The API has no root route | Request `/api/health` |

## 14. Quick-start checklist

Use this list after reading the explanations:

- [ ] Confirm Node 20+, pnpm 10.15.0, and PostgreSQL are installed.
- [ ] Run `pnpm install` from the repository root.
- [ ] Create the `e_hailing_safety` database.
- [ ] Apply `01_create_auth_tables.sql` once.
- [ ] Copy and edit `apps/api/.env`.
- [ ] Copy `apps/web/.env.local`.
- [ ] Start PostgreSQL.
- [ ] Run `pnpm dev:api` in terminal 1.
- [ ] Verify `http://localhost:5000/api/health`.
- [ ] Run `pnpm dev:web` in terminal 2.
- [ ] Open `http://localhost:3000/signup`.
- [ ] Create an account and confirm the dashboard redirect.
- [ ] Run the API build, frontend build, and frontend lint checks.

At that point, the monorepo, PostgreSQL database, Express API, frontend API
origin, CORS policy, and browser session cookie are connected locally.
