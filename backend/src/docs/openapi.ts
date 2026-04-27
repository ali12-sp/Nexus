export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Nexus API",
    version: "1.0.0",
    description:
      "Backend API for Nexus Investor & Entrepreneur Collaboration Platform.",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local backend",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              token: { type: "string" },
              user: { $ref: "#/components/schemas/User" },
              session: {
                type: "object",
                properties: {
                  accessTokenExpiresAt: { type: "string", format: "date-time" },
                  refreshTokenExpiresAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          fullName: { type: "string" },
          email: { type: "string" },
          emailVerifiedAt: { type: "string", format: "date-time", nullable: true },
          role: { type: "string", enum: ["INVESTOR", "ENTREPRENEUR"] },
          bio: { type: "string", nullable: true },
          profileImage: { type: "string", nullable: true },
          location: { type: "string", nullable: true },
          website: { type: "string", nullable: true },
          startupName: { type: "string", nullable: true },
          startupStage: { type: "string", nullable: true },
          industry: { type: "string", nullable: true },
          fundingNeeded: { type: "number", nullable: true },
          firmName: { type: "string", nullable: true },
          investmentFocus: { type: "string", nullable: true },
          ticketSizeMin: { type: "number", nullable: true },
          ticketSizeMax: { type: "number", nullable: true },
          walletBalance: { type: "number" },
        },
      },
      Meeting: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          agenda: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
          timezone: { type: "string" },
          status: {
            type: "string",
            enum: ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"],
          },
          roomId: { type: "string" },
          organizer: { $ref: "#/components/schemas/User" },
          invitee: { $ref: "#/components/schemas/User" },
        },
      },
      Document: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          fileUrl: { type: "string" },
          fileType: { type: "string" },
          fileSize: { type: "number" },
          status: {
            type: "string",
            enum: ["UPLOADED", "UNDER_REVIEW", "SIGNED", "ARCHIVED"],
          },
          version: { type: "number" },
          signatureUrl: { type: "string", nullable: true },
        },
      },
      Transaction: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["DEPOSIT", "WITHDRAW", "TRANSFER"] },
          amount: { type: "number" },
          currency: { type: "string" },
          status: { type: "string", enum: ["PENDING", "COMPLETED", "FAILED"] },
          provider: { type: "string", enum: ["STRIPE", "PAYPAL", "MOCK"] },
          reference: { type: "string" },
        },
      },
      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string" },
          action: { type: "string" },
          entityType: { type: "string" },
          entityId: { type: "string", nullable: true },
          status: { type: "string" },
          ipAddress: { type: "string", nullable: true },
          userAgent: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        security: [],
        summary: "Register a new user",
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        security: [],
        summary: "Login and receive a JWT",
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        security: [],
        summary: "Refresh the access token using an HTTP-only refresh cookie",
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        security: [],
        summary: "Clear the refresh cookie and end the browser session",
      },
    },
    "/api/auth/request-password-reset": {
      post: {
        tags: ["Auth"],
        security: [],
        summary: "Issue a password reset workflow and send a secure link",
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        security: [],
        summary: "Reset the account password with a valid recovery token",
      },
    },
    "/api/auth/request-email-verification": {
      post: {
        tags: ["Auth"],
        summary: "Issue a fresh email verification link for the signed-in user",
      },
    },
    "/api/auth/verify-email": {
      post: {
        tags: ["Auth"],
        security: [],
        summary: "Verify a user email with a single-use token",
      },
    },
    "/api/auth/send-otp": {
      post: {
        tags: ["Auth"],
        security: [],
        summary: "Send a mock OTP to the user's email",
      },
    },
    "/api/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        security: [],
        summary: "Verify a previously sent OTP",
      },
    },
    "/api/auth/audit-logs": {
      get: {
        tags: ["Auth"],
        summary: "List recent audit activity for the signed-in user",
      },
    },
    "/api/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get current user profile",
      },
      put: {
        tags: ["Users"],
        summary: "Update current user profile",
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get a public profile by id",
      },
    },
    "/api/dashboard": {
      get: {
        tags: ["Dashboard"],
        summary: "Get role-aware dashboard summary data",
      },
    },
    "/api/ready": {
      get: {
        tags: ["System"],
        security: [],
        summary: "Verify API readiness and database connectivity",
      },
    },
    "/api/metrics/runtime": {
      get: {
        tags: ["System"],
        security: [],
        summary: "Fetch lightweight runtime metrics for operational checks",
      },
    },
    "/api/meetings": {
      get: {
        tags: ["Meetings"],
        summary: "List meetings for the authenticated user",
      },
      post: {
        tags: ["Meetings"],
        summary: "Schedule a new meeting with conflict detection",
      },
    },
    "/api/meetings/{id}": {
      get: {
        tags: ["Meetings"],
        summary: "Get a single meeting",
      },
    },
    "/api/meetings/{id}/respond": {
      patch: {
        tags: ["Meetings"],
        summary: "Accept or reject a meeting request",
      },
    },
    "/api/meetings/{id}/cancel": {
      patch: {
        tags: ["Meetings"],
        summary: "Cancel a meeting",
      },
    },
    "/api/documents/upload": {
      post: {
        tags: ["Documents"],
        summary: "Upload a document to the chamber",
      },
    },
    "/api/documents": {
      get: {
        tags: ["Documents"],
        summary: "List documents accessible to the user",
      },
    },
    "/api/documents/{id}": {
      get: {
        tags: ["Documents"],
        summary: "Get a document and its metadata",
      },
      patch: {
        tags: ["Documents"],
        summary: "Update document metadata and status",
      },
    },
    "/api/documents/{id}/sign": {
      post: {
        tags: ["Documents"],
        summary: "Add a signature to a document",
      },
    },
    "/api/payments/deposit": {
      post: {
        tags: ["Payments"],
        summary: "Simulate a deposit",
      },
    },
    "/api/payments/withdraw": {
      post: {
        tags: ["Payments"],
        summary: "Simulate a withdrawal",
      },
    },
    "/api/payments/transfer": {
      post: {
        tags: ["Payments"],
        summary: "Simulate a wallet transfer",
      },
    },
    "/api/payments/transactions": {
      get: {
        tags: ["Payments"],
        summary: "Fetch transaction history",
      },
    },
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Fetch recent activity notifications",
      },
    },
  },
};
