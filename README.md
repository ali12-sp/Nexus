# Nexus

Nexus is an investor and entrepreneur collaboration platform built with a Next.js frontend and an Express plus Prisma backend.

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

## Useful URLs

- Frontend: `http://localhost:3000/login`
- Backend health: `http://localhost:4000/api/health`
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
