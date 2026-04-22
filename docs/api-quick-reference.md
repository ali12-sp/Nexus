# Nexus API Quick Reference

## Base URL

- Local backend: `http://localhost:4000/api`
- Deployed backend: `https://<your-backend-domain>/api`

## Authentication

### Register

- Endpoint: `POST /auth/register`
- Body:

```json
{
  "fullName": "Ayesha Founder",
  "email": "ayesha@example.com",
  "password": "Password123!",
  "role": "ENTREPRENEUR"
}
```

- Success response shape:

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "user_id",
      "email": "ayesha@example.com",
      "role": "ENTREPRENEUR"
    }
  }
}
```

### Login

- Endpoint: `POST /auth/login`
- Body:

```json
{
  "email": "sarah.investor@nexus.local",
  "password": "Password123!"
}
```

### Send OTP

- Endpoint: `POST /auth/send-otp`
- Body:

```json
{
  "email": "sarah.investor@nexus.local",
  "purpose": "LOGIN"
}
```

### Verify OTP

- Endpoint: `POST /auth/verify-otp`
- Body:

```json
{
  "email": "sarah.investor@nexus.local",
  "code": "123456",
  "purpose": "LOGIN"
}
```

## Users and profiles

### Get current user

- Endpoint: `GET /users/me`
- Headers:

```text
Authorization: Bearer <jwt>
```

### Update current user

- Endpoint: `PUT /users/me`
- Example entrepreneur body:

```json
{
  "fullName": "Ali Raza",
  "location": "Karachi, Pakistan",
  "startupName": "Nexus Labs",
  "industry": "SaaS",
  "pitchSummary": "Secure investor-founder collaboration workspace."
}
```

- Example investor body:

```json
{
  "fullName": "Sarah Mitchell",
  "firmName": "Summit Arc Ventures",
  "investmentFocus": "AI, fintech, and SaaS",
  "ticketSizeMin": 25000,
  "ticketSizeMax": 250000,
  "preferredIndustries": ["AI", "FinTech", "SaaS"]
}
```

### List users

- Endpoint: `GET /users?role=ENTREPRENEUR&search=saas`

## Dashboard

### Get dashboard summary

- Endpoint: `GET /dashboard`
- Includes:
  - current profile
  - summary stats
  - upcoming meetings
  - recent documents
  - recent transactions
  - notifications
  - suggested counterparties

## Meetings

### Create meeting

- Endpoint: `POST /meetings`
- Body:

```json
{
  "inviteeId": "user_id",
  "title": "Seed diligence call",
  "agenda": "Review traction and compliance posture",
  "notes": "Bring customer retention metrics",
  "startTime": "2026-04-24T10:00:00.000Z",
  "endTime": "2026-04-24T11:00:00.000Z",
  "timezone": "Asia/Karachi"
}
```

### List meetings

- Endpoint: `GET /meetings`
- Optional filter:

```text
GET /meetings?status=ACCEPTED
```

### Respond to meeting

- Endpoint: `PATCH /meetings/:id/respond`
- Body:

```json
{
  "status": "ACCEPTED"
}
```

### Cancel meeting

- Endpoint: `PATCH /meetings/:id/cancel`
- Body:

```json
{
  "notes": "Rescheduling for next week"
}
```

## Documents

### Upload document

- Endpoint: `POST /documents/upload`
- Content type: `multipart/form-data`
- Fields:
  - `file`
  - `title`
  - `relatedMeetingId` optional
  - `versionGroupId` optional

### List documents

- Endpoint: `GET /documents`

### Update document status

- Endpoint: `PATCH /documents/:id`
- Body:

```json
{
  "status": "UNDER_REVIEW"
}
```

### Sign document

- Endpoint: `POST /documents/:id/sign`
- Body:

```json
{
  "signerName": "Sarah Mitchell",
  "signatureDataUrl": "data:image/png;base64,..."
}
```

## Payments

### Deposit

- Endpoint: `POST /payments/deposit`
- Body:

```json
{
  "amount": 5000,
  "currency": "USD",
  "note": "Demo deposit"
}
```

### Withdraw

- Endpoint: `POST /payments/withdraw`
- Body:

```json
{
  "amount": 1000,
  "currency": "USD",
  "note": "Demo withdrawal"
}
```

### Transfer

- Endpoint: `POST /payments/transfer`
- Body:

```json
{
  "recipientUserId": "user_id",
  "amount": 2500,
  "currency": "USD",
  "note": "Diligence reimbursement"
}
```

### Transaction history

- Endpoint: `GET /payments/transactions`

## Notifications

### List notifications

- Endpoint: `GET /notifications`

## Live API documentation

- Swagger UI is available at:

```text
/api/docs
```
