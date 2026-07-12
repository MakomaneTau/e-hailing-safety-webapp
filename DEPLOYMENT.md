# Deployment

The frontend is deployed to Cloudflare Workers with OpenNext. The Express API
and PostgreSQL database are deployed to Render.

## Backend: Render

1. Push this repository to GitHub.
2. In Render, create a Blueprint and select this repository. Render reads the
   root `render.yaml` file and creates the API and PostgreSQL database.
3. When prompted for `FRONTEND_URL`, enter the final Cloudflare URL, for example
   `https://e-hailing-safety-webapp.<account>.workers.dev`, without a trailing slash.
4. Confirm that `https://<api-service>.onrender.com/api/health` returns a JSON
   response with `success: true`.

The Blueprint supplies `DATABASE_URL` from the Render PostgreSQL database. Do
not add the connection string to source control.

## Frontend: Cloudflare Workers

Create a Workers Builds project connected to this repository and use:

- Root directory: leave blank (repository root)
- Build command: `pnpm install --frozen-lockfile && pnpm --dir apps/web exec opennextjs-cloudflare build`
- Deploy command: `pnpm --dir apps/web exec opennextjs-cloudflare deploy`

The build runs from the repository root because the frontend imports the shared
workspace package from `packages/shared`.

Add `NEXT_PUBLIC_API_URL` under Cloudflare's Build Variables and Secrets. Set it
to the Render API origin, for example `https://e-hailing-safety-api.onrender.com`,
without a trailing slash. This variable must be available during the Next.js
build because values prefixed with `NEXT_PUBLIC_` are bundled into the frontend.

For local development, copy `apps/web/.env.example` to `.env.local` and
`apps/api/.env.example` to `.env` in their respective application directories.
