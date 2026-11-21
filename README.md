# Itsuki Studio

A full-stack storefront for Itsuki Studio, built with React, Vite, Express, Prisma, and MySQL.

## Prerequisites

- Node.js 22 or newer
- Corepack enabled: `corepack enable`
- Docker Desktop (for local MySQL)
- Git and a GitHub account

## First-time setup

1. Install dependencies:

   ```powershell
   corepack pnpm install
   ```

2. Create the local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

   The example values work with the local Docker database. Keep `.env` private and never commit real payment secrets or production credentials.

3. Start MySQL:

   ```powershell
   docker compose up -d mysql
   ```

   Docker Desktop must be running. The database is available on `localhost:3306`.

4. Prepare Prisma and seed the catalog:

   ```powershell
   corepack pnpm db:generate
   corepack pnpm db:migrate
   corepack pnpm db:seed
   ```

5. Start the API and storefront:

   ```powershell
   corepack pnpm dev
   ```

   - Storefront: http://localhost:5173
   - API: http://localhost:4000
   - Health check: http://localhost:4000/api/health

## Verification

```powershell
corepack pnpm test
corepack pnpm build
corepack pnpm audit
```

## Production Docker setup

See `docker-compose.prod.yml` and set all required deployment environment variables, especially database passwords, `JWT_SECRET`, `WEB_ORIGIN`, and Razorpay secrets. Do not reuse the development values in production.

## Push to GitHub

If GitHub prompts for authentication for an SSH remote, use a configured SSH key or change the remote to HTTPS:

```powershell
git remote set-url origin https://github.com/Yashpaspuleti/Itsuki-studio.git
git add .
git diff --cached --stat
git commit -m "Add Itsuki Studio storefront"
git push -u origin main
```

The `.env` file is excluded by `.gitignore` and must not be pushed.
