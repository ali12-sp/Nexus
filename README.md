# Nexus

Nexus is an investor and entrepreneur collaboration platform built with a Next.js frontend and an Express plus Prisma backend.

## Runtime

- Recommended local Node.js: `20.19.0`
- The repo is pinned for Node 20.x parity with deployment environments.
- Windows users on Node 24.x may still run the app, but Prisma migrations and production frontend builds are most reliable on Node 20.x.
- Browser sessions use short-lived access tokens plus HTTP-only refresh cookies for safer auth handling.
- Frontend scripts now export `NEXT_IGNORE_INCORRECT_LOCKFILE=1` before Next.js boots, which avoids the noisy SWC lockfile repair path on machines that also have pnpm installed.

## Workspaces

- `frontend`: Next.js App Router client
- `backend`: Express API, Prisma, Socket.IO signaling, uploads, and Swagger docs

## Local development

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Frontend:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Quality and delivery tooling

- Automated backend smoke tests: `npm run test --workspace backend`
- Frontend typecheck: `npm run typecheck --workspace frontend`
- Full repo typecheck: `npm run typecheck`
- GitHub Actions workflow: `.github/workflows/ci.yml`
- Containerized local stack: `docker-compose.yml`

## Docker quick start

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:3000/login`
- Backend health: `http://localhost:4000/api/health`
- Backend readiness: `http://localhost:4000/api/ready`
- The Docker stack uses the same Node 20 runtime targeted by Vercel and Render.

## Useful URLs

- Frontend: `http://localhost:3000/login`
- Backend health: `http://localhost:4000/api/health`
- Backend readiness: `http://localhost:4000/api/ready`
- Swagger docs: `http://localhost:4000/api/docs`

## Demo accounts

- Investor: `sarah.investor@nexus.local` / `Password123!`
- Founder: `ali.founder@nexus.local` / `Password123!`

## Deployment and QA

- Deployment guide: `docs/deployment-guide.md`
- QA checklist: `docs/final-qa-checklist.md`
- Status roadmap: `docs/nexus-fullstack-roadmap.md`
- API quick reference: `docs/api-quick-reference.md`
- Weekly progress: `docs/weekly-progress.md`
- Demo flow: `docs/final-demo-flow.md`
- Submission summary: `docs/submission-summary.md`
