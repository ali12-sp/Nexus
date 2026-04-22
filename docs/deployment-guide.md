# Nexus Deployment Guide

## Target setup

- Frontend: Vercel
- Backend: Render
- Database: Render PostgreSQL or any managed PostgreSQL provider
- File storage:
  - local persistent disk for MVP deployment on Render
  - S3-compatible storage when cloud object storage is available

## 1. Backend deployment on Render

### Option A: Render Blueprint

- Connect the GitHub repository to Render.
- Choose `Blueprint` deployment.
- Use the root-level `render.yaml`.
- After the database is created, set `CLIENT_URL` to the deployed frontend URL.
- If email delivery is needed, add SMTP credentials.
- If cloud storage is needed, add the AWS-compatible variables from `backend/.env.example`.

### Option B: Manual Web Service

- Create a new `PostgreSQL` database in Render.
- Create a new `Web Service` pointing to the same repo.
- Set the service `Root Directory` to `backend`.
- Build command:

```bash
npm install && npm run build
```

- Start command:

```bash
npm run prisma:migrate && npm start
```

- Health check path:

```text
/api/health
```

### Backend environment variables

Required:

- `NODE_ENV=production`
- `PORT=4000`
- `CLIENT_URL=https://your-frontend-domain.vercel.app`
- `DATABASE_URL=<render-or-managed-postgres-connection-string>`
- `JWT_SECRET=<strong-random-secret>`
- `JWT_EXPIRES_IN=7d`
- `UPLOAD_DIR=/opt/render/project/src/backend/uploads`
- `MAX_FILE_SIZE_MB=10`
- `PAYMENT_PROVIDER=MOCK`
- `SMTP_FROM=noreply@nexus.local`
- `OTP_EXPIRY_MINUTES=10`

Optional:

- `AWS_S3_BUCKET`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_ENDPOINT`
- `STRIPE_SECRET_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

## 2. Frontend deployment on Vercel

- Import the same repository into Vercel.
- Set the project `Root Directory` to `frontend`.
- Keep the framework preset as `Next.js`.

### Frontend environment variables

- `NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.onrender.com/api`
- `NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain.onrender.com`

### Recommended build settings

- Install command:

```bash
npm install
```

- Build command:

```bash
npm run build
```

- Output directory:

```text
.next
```

## 3. Database setup

- Run migrations in the backend service using:

```bash
npm run prisma:migrate
```

- Seed demo data once after the first successful deploy:

```bash
npm run prisma:seed
```

### Demo accounts from seed data

- Investor: `sarah.investor@nexus.local` / `Password123!`
- Founder: `ali.founder@nexus.local` / `Password123!`

## 4. Post-deploy verification

Backend:

- Open `/api/health`
- Open `/api/docs`
- Log in with a seeded account
- Verify `/api/dashboard`, `/api/meetings`, `/api/documents`, `/api/payments/transactions`

Frontend:

- Open `/login`
- Verify login redirects to the correct role dashboard
- Open meetings, documents, payments, settings, and video room flows

Realtime and uploads:

- Join the same accepted meeting from two browsers
- Upload a document and confirm it appears in the chamber
- Sign the uploaded document and confirm status changes to `SIGNED`

## 5. Notes for production follow-up

- Current payments are sandbox or mock only by design.
- OTP is realistic for MVP, but email delivery depends on SMTP configuration.
- Local disk uploads are acceptable for MVP, but S3-compatible storage is recommended for long-term production use.
- The frontend workspace still has occasional Next.js lockfile patch warnings during production builds; the app code is healthy, but workspace dependency cleanup is still recommended.
