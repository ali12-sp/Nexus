# Nexus Full-Stack Roadmap

## Status on April 21, 2026

- Deadline: April 28, 2026
- Internship window assumed: April 8, 2026 to April 28, 2026
- Time elapsed: 14 of 21 days, about 67%
- Time remaining: 7 days
- Target progress by today: Week 1 should be complete, Week 2 should be complete or nearly complete, and Week 3 should be underway

## Actual Completion Snapshot

### Overall

- Code implementation progress: about 85%
- Delivery readiness progress: about 75%
- Remaining implementation work: about 15%
- Remaining delivery and release work: about 25%

### Completed or largely complete

- Backend foundation
  - Express server, env loading, CORS, Helmet, HPP, logging, error handling, route organization
- Database
  - PostgreSQL plus Prisma schema, migration, and seed data
- Authentication and profiles
  - register, login, JWT auth, password hashing, protected routes, profile update, role-based data fields
- Dashboards
  - investor and entrepreneur dashboard routes backed by live summary APIs
- Meetings backend
  - create, list, get, accept, reject, cancel, conflict detection, room id creation
- Video calling MVP
  - authenticated Socket.IO signaling with WebRTC events and room access checks
- Document chamber backend
  - upload, metadata storage, version tracking, meeting linkage, signature storage
- Payment MVP
  - deposit, withdraw, transfer, wallet balance updates, transaction history
- Security baseline
  - validation, sanitization, bcrypt, JWT middleware, rate limiting, file validation, OTP mock flow
- API docs
  - Swagger endpoint is mounted and usable locally

### Recently improved

- Frontend now contains real feature screens for auth, dashboard, profile, meetings, documents, payments, settings, and video
- Meetings screen now includes a weekly scheduling calendar, not only a list view
- Backend and frontend builds pass locally

## Scope Check Against Internship Milestones

### Week 1 status

- Milestone 1: Environment setup and codebase familiarization
  - complete
- Milestone 2: User authentication and profiles
  - complete

### Week 2 status

- Milestone 3: Meeting scheduling system
  - mostly complete
  - APIs, conflict detection, and frontend scheduling flow are done
  - calendar polish and deeper QA still remain
- Milestone 4: Video calling integration
  - MVP complete
  - signaling, room join, audio and video toggles, and end call are present
- Milestone 5: Document processing chamber
  - mostly complete
  - upload, metadata, status updates, and signatures are done
  - richer inline preview experience is still pending

### Week 3 status

- Milestone 6: Payment section
  - mostly complete at mock MVP level
  - sandbox provider wiring is still optional and not fully connected
- Milestone 7: Security enhancements
  - mostly complete for MVP
  - final hardening pass and end-to-end verification still remain
- Milestone 8: Final integration and deployment
  - mostly complete
  - local integration works
  - deployment configs and handoff docs are now in place
  - live platform deployment and presentation assets are still pending

## Current Backend/API Map by Screen

| Screen | Main API dependencies |
| --- | --- |
| Login | `POST /api/auth/login` |
| Register | `POST /api/auth/register` |
| Dashboard | `GET /api/dashboard`, `GET /api/notifications` |
| Profile | `GET /api/users/me`, `PUT /api/users/me`, `GET /api/users/:id`, `GET /api/users` |
| Meetings | `GET /api/users`, `POST /api/meetings`, `GET /api/meetings`, `GET /api/meetings/:id`, `PATCH /api/meetings/:id/respond`, `PATCH /api/meetings/:id/cancel` |
| Video | `GET /api/meetings?status=ACCEPTED`, Socket.IO events `join-room`, `leave-room`, `webrtc-offer`, `webrtc-answer`, `webrtc-ice-candidate`, `call-ended` |
| Documents | `POST /api/documents/upload`, `GET /api/documents`, `GET /api/documents/:id`, `PATCH /api/documents/:id`, `POST /api/documents/:id/sign` |
| Payments | `POST /api/payments/deposit`, `POST /api/payments/withdraw`, `POST /api/payments/transfer`, `GET /api/payments/transactions`, `GET /api/users` |
| Settings and security | `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`, `PUT /api/users/me` |

## Confirmed Architecture

### Integration approach

- Frontend: Next.js App Router client
- Backend: Express plus Socket.IO
- Auth transport: JWT in `Authorization` header for REST and `auth.token` for sockets
- Shared contract: frontend types mirror backend serializers

### Database choice

- PostgreSQL plus Prisma remains the correct stack for this repo

### Authentication flow

1. User registers or logs in.
2. Backend returns JWT plus serialized user.
3. Frontend stores token locally and hydrates `/api/users/me`.
4. Role-aware routing sends investors to `/dashboard/investor` and entrepreneurs to `/dashboard/entrepreneur`.

### Real-time video

- WebRTC peer-to-peer media
- Socket.IO only for signaling
- Room access tied to authenticated meeting participants

### Storage strategy

- Local disk storage is the default for development
- S3-compatible adapter is isolated behind env-driven storage resolution

### Deployment target

- Frontend: Vercel
- Backend: Render or Railway
- Database: managed PostgreSQL
- Storage: S3-compatible bucket for deployed environments

## Current Data Model

### Core tables already implemented

- `User`
- `Meeting`
- `Document`
- `Signature`
- `Transaction`
- `TwoFactorCode`
- `Notification`

### Notes

- A separate `Profile` table is not required for the current MVP
- The relational structure is already sufficient for authentication, meetings, documents, signatures, payments, and notifications
- Optional later additions:
  - `AuditLog`
  - `Session`
  - `Project`
  - `Message`

## Remaining Work to Finish Before April 28, 2026

### Highest priority

- Deploy backend and frontend to live environments and verify env configuration
- Add richer document preview for PDFs and supported assets inside the app
- Run end-to-end QA across auth, meetings, video, documents, payments, and OTP flows
- Clean dependency and lockfile issues to remove build warnings

### Delivery work still missing

- Weekly work log documentation is incomplete
- Final demo presentation assets are not yet prepared
- Deployment runbook should be polished with production-ready env examples
- Swagger can be expanded with fuller request and response examples

## Catch-Up Plan for the Final 7 Days

### April 21 to April 22

- Finish calendar and document UX gaps
- Re-run local regression testing across all modules

### April 23 to April 24

- Deploy backend and frontend
- Validate uploads, sockets, OTP, and payments in deployed environments

### April 25 to April 26

- Expand API documentation and env setup guidance
- Fix deployment bugs and harden error states

### April 27

- Prepare demo script, screenshots, and final walkthrough

### April 28

- Final verification, submission packaging, and buffer for last fixes

## Immediate Next Priorities

1. Finish the remaining UX gaps that block milestone parity
2. Verify deployment end to end
3. Complete handoff documentation and demo material
