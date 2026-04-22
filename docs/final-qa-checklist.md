# Nexus Final QA Checklist

## Backend smoke checks

- `GET /api/health` returns `success: true`
- `GET /api/docs` loads Swagger UI
- `POST /api/auth/login` works for seeded investor and founder accounts
- `GET /api/users/me` returns the authenticated user
- `GET /api/dashboard` returns dashboard summary data
- `GET /api/meetings` returns seeded meeting records
- `GET /api/documents` returns seeded document records
- `GET /api/payments/transactions` returns seeded transaction history
- `POST /api/auth/send-otp` returns delivery metadata

## Browser checks

### Authentication and profile

- Register a new investor account
- Register a new entrepreneur account
- Log in with both seeded demo accounts
- Update profile data from `/profile`
- Confirm role-based dashboard redirects are correct

### Meetings and calendar

- Open `/meetings`
- Confirm the weekly calendar renders
- Create a meeting from one role to the opposite role
- Confirm pending meeting appears in the timeline
- Accept the meeting from the invitee account
- Confirm accepted meeting appears in the calendar and video join flow
- Try a conflicting meeting window and confirm conflict validation appears

### Video

- Open `/video` from two browsers or one browser plus incognito
- Join the same accepted meeting room
- Confirm local and remote media appear
- Toggle audio and video
- End the call and confirm the second participant is disconnected

### Documents

- Upload a PDF from `/documents`
- Confirm metadata appears in the chamber
- Link a document to a meeting
- Change status from `UPLOADED` to `UNDER_REVIEW`
- Sign the document and confirm status becomes `SIGNED`

### Payments

- Make a deposit
- Make a withdrawal
- Make a transfer to another seeded user
- Confirm wallet balance and transaction history update

### Security

- Toggle two-factor authentication in `/settings`
- Send an OTP
- Verify the OTP using the development preview code

## Release checks

- Backend builds successfully
- Frontend TypeScript check passes
- Environment variables are documented
- Render and Vercel deployment values are prepared
- Demo script is ready for presentation
