# E-Hailing Safety Web Application

A web platform for reporting and tracking safety incidents related to e-hailing
services. The project currently provides the user interface, a PostgreSQL-backed
Express API foundation, shared TypeScript contracts, and deployment configuration
for Cloudflare and Render.

> The application is under active development. The pages and report form are
> available, but the report submission, authentication, file upload, and report
> management workflows are not yet connected to backend endpoints.

## Architecture

```text
Browser
  |
  v
Next.js frontend (Cloudflare Workers)
  |
  | HTTPS / NEXT_PUBLIC_API_URL
  v
Express API (Render Web Service)
  |
  v
PostgreSQL (Render PostgreSQL in production)
```

The applications live in one pnpm monorepo so they can share TypeScript
contracts while remaining independently deployable.

## Repository structure

```text
.
|-- apps/
|   |-- api/                 # Express 5 and PostgreSQL API
|   `-- web/                 # Next.js 16 frontend
|-- packages/
|   `-- shared/              # Shared API response and domain types
|-- DEPLOYMENT.md            # Cloudflare and Render deployment steps
|-- render.yaml              # Render API and PostgreSQL Blueprint
|-- pnpm-workspace.yaml      # Workspace definitions
`-- package.json             # Monorepo commands
```

## Technology stack

### Frontend

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS 4
- OpenNext and Wrangler for Cloudflare Workers

### Backend

- Node.js and Express 5
- TypeScript
- PostgreSQL with `pg`
- Helmet and restricted CORS
- Shared contracts from `@project/shared`

### Hosting

- Frontend: Cloudflare Workers
- API: Render Web Service
- Production database: Render PostgreSQL

Netlify is no longer used by this project.

## Current routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/login` | Login interface |
| `/signup` | Registration interface |
| `/dashboard` | User dashboard |
| `/file-report` | Safety incident report form |
| `/reports` | Reports view |
| `/profile` | User profile |
| `/profile/my-reports` | User report history |

The API currently exposes:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Verify the API and database connection |

## Prerequisites

- Node.js 20 or newer
- pnpm 10.15.0
- PostgreSQL for local API development
- Git

On Windows PowerShell, use `pnpm.cmd` if the `pnpm.ps1` script is blocked by
the execution policy.

## Local setup

### 1. Install dependencies

From the repository root:

```powershell
pnpm.cmd install
```

### 2. Create a local PostgreSQL database

Create the database with pgAdmin or `psql`:

```sql
CREATE DATABASE e_hailing_safety;
```

Copy the API environment template:

```powershell
Copy-Item apps\api\.env.example apps\api\.env
```

Update `apps/api/.env` with your PostgreSQL credentials:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/e_hailing_safety
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=5000
```

Characters with special meaning in a URL must be URL-encoded when they appear
in the database password.

### 3. Configure the frontend

```powershell
Copy-Item apps\web\.env.example apps\web\.env.local
```

The local value should be:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Never commit `.env` or `.env.local` files.

### 4. Start development services

Start the API in one terminal:

```powershell
pnpm.cmd dev:api
```

Start the frontend in another terminal:

```powershell
pnpm.cmd dev:web
```

Open <http://localhost:3000>. The API listens on
<http://localhost:5000> by default.

### 5. Verify the API

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

A successful response has `success: true` and a health status of `ok`. Because
the health endpoint checks PostgreSQL, a database configuration problem will
also cause this request to fail.

## Commands

Run these commands from the repository root:

| Command | Description |
| --- | --- |
| `pnpm dev:web` | Run the Next.js development server |
| `pnpm dev:api` | Run the API with file watching |
| `pnpm build:web` | Create the Next.js production build |
| `pnpm build:api` | Compile the API into `apps/api/dist` |
| `pnpm start:api` | Start the compiled API |
| `pnpm deploy:web` | Build and deploy the frontend through OpenNext |

Frontend-only commands such as linting and Cloudflare preview can be run with:

```powershell
pnpm.cmd --filter web lint
pnpm.cmd --filter web preview
```

OpenNext recommends Linux or WSL for an accurate local Cloudflare Workers
preview.

## Production builds

```powershell
pnpm.cmd build:api
pnpm.cmd build:web
```

The normal Next.js build validates the frontend. Use the OpenNext preview to
test the generated application in Cloudflare's Workers runtime before release.

## Deployment

Detailed instructions are available in [DEPLOYMENT.md](DEPLOYMENT.md).

### Cloudflare frontend

Connect the repository to Cloudflare Workers Builds and configure:

```text
Root directory: repository root
Build command: pnpm install --frozen-lockfile && pnpm --dir apps/web exec opennextjs-cloudflare build
Deploy command: pnpm --dir apps/web exec opennextjs-cloudflare deploy
```

Add this Cloudflare build variable using the deployed Render API origin:

```env
NEXT_PUBLIC_API_URL=https://e-hailing-safety-api.onrender.com
```

### Render backend

Create a Render Blueprint from this repository. Render reads `render.yaml` and
creates the Express web service and PostgreSQL database. When prompted, set
`FRONTEND_URL` to the final Cloudflare frontend origin without a trailing slash.

After deployment, verify:

```text
https://<render-api-host>/api/health
```

## Environment variables

| Variable | Service | Required | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Web | Yes | Public origin of the Render API |
| `DATABASE_URL` | API | Yes | PostgreSQL connection string |
| `FRONTEND_URL` | API | Yes | Exact frontend origin permitted by CORS |
| `NODE_ENV` | API | Yes | Selects development or production behavior |
| `PORT` | API | No | HTTP port; defaults to `5000` locally and is supplied by Render |

## Security notes

- Keep database credentials and deployment tokens out of Git.
- Restrict API CORS to the deployed frontend origin.
- Use HTTPS for all production traffic.
- Do not send sensitive report evidence directly to PostgreSQL. A future file
  upload implementation should use dedicated object storage and short-lived
  upload permissions.
- Authentication, authorization, validation, rate limiting, and audit logging
  must be completed before accepting real incident reports.

## Planned work

- Add user authentication and authorization.
- Add report creation, listing, status, and ownership endpoints.
- Add PostgreSQL migrations and production tables.
- Connect the frontend report form and dashboards to the API.
- Store evidence files in object storage.
- Add automated tests, validation, rate limiting, monitoring, and audit logs.

## License

See [apps/web/LICENSE](apps/web/LICENSE).
