# Nexus Final Demo Flow

## Demo goal

Show a complete collaboration journey between an investor and an entrepreneur using the live local or deployed system.

## Demo accounts

- Investor: `sarah.investor@nexus.local` / `Password123!`
- Founder: `ali.founder@nexus.local` / `Password123!`

## Demo order

### 1. Authentication and role dashboards

- Open `/login`
- Log in as the investor account
- Show the investor dashboard with meetings, documents, notifications, and payments
- Open a second browser or incognito window
- Log in as the founder account
- Show the entrepreneur dashboard with the same core modules but role-specific context

### 2. Profile management

- Open `/profile`
- Update a few fields such as location, website, industry, or investment focus
- Save the profile and show the success state

### 3. Meeting scheduling calendar

- Open `/meetings`
- Show the weekly scheduling calendar
- Create a meeting from one role to the opposite role
- Switch to the other account and accept the pending meeting
- Return to the calendar and show the accepted meeting on the selected day

### 4. Video collaboration

- From the accepted meeting, click `Join room`
- Join the same room from the second browser
- Show local and remote video feeds
- Toggle audio and video
- End the call

### 5. Document chamber

- Open `/documents`
- Upload a PDF or image document
- Link it to a meeting if desired
- Show the document status and version metadata
- Sign the document using the signature pad
- Show the updated `SIGNED` status

### 6. Payment simulation

- Open `/payments`
- Make a deposit
- Make a withdrawal
- Make a transfer to the other user
- Show wallet balance and transaction history updating in real time after refresh

### 7. Security settings

- Open `/settings`
- Toggle the two-factor preference
- Send an OTP
- Verify the OTP using the development preview code
- Open Swagger from the same page to show API documentation

## Suggested closing statement

Nexus now supports end-to-end investor and founder collaboration with secure authentication, role-aware dashboards, conflict-aware meetings, WebRTC video rooms, document handling with signatures, payment simulation, and deployment-ready backend infrastructure.

## If live deployment is not available

- Use local frontend at `http://localhost:3000`
- Use local backend docs at `http://localhost:4000/api/docs`
- Mention that deployment configs and environment examples are already prepared for Vercel and Render
