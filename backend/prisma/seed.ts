import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const buildDate = (offsetDays: number, hour: number, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const main = async () => {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "sarah.investor@nexus.local" },
      update: {
        fullName: "Sarah Mitchell",
        emailVerifiedAt: new Date(),
        passwordHash,
        walletBalance: 120000,
      },
      create: {
        id: "seed_investor_sarah",
        fullName: "Sarah Mitchell",
        email: "sarah.investor@nexus.local",
        emailVerifiedAt: new Date(),
        passwordHash,
        role: "INVESTOR",
        bio: "Angel investor focused on B2B SaaS, AI, and workflow infrastructure.",
        location: "New York, USA",
        website: "https://nexus.example/investors/sarah",
        firmName: "Summit Arc Ventures",
        investmentFocus: "AI tooling, fintech rails, and collaboration software.",
        ticketSizeMin: 25000,
        ticketSizeMax: 250000,
        portfolioHistory: "Backed 18 early-stage startups across the US and MENA.",
        preferredIndustries: ["AI", "FinTech", "SaaS"],
        preferences: {
          stage: ["Pre-seed", "Seed"],
          timezone: "America/New_York",
        },
        walletBalance: 120000,
      },
    }),
    prisma.user.upsert({
      where: { email: "omar.investor@nexus.local" },
      update: {
        fullName: "Omar Rahman",
        emailVerifiedAt: new Date(),
        passwordHash,
        walletBalance: 80000,
      },
      create: {
        id: "seed_investor_omar",
        fullName: "Omar Rahman",
        email: "omar.investor@nexus.local",
        emailVerifiedAt: new Date(),
        passwordHash,
        role: "INVESTOR",
        bio: "Operator-turned-investor supporting enterprise and climate founders.",
        location: "Dubai, UAE",
        firmName: "Meridian Capital Lab",
        investmentFocus: "Climate software, enterprise systems, and infrastructure.",
        ticketSizeMin: 50000,
        ticketSizeMax: 400000,
        portfolioHistory: "Led and co-led 11 seed rounds with follow-on reserve.",
        preferredIndustries: ["Climate", "Enterprise", "SaaS"],
        preferences: {
          stage: ["Seed", "Series A"],
          timezone: "Asia/Dubai",
        },
        walletBalance: 80000,
      },
    }),
    prisma.user.upsert({
      where: { email: "ali.founder@nexus.local" },
      update: {
        fullName: "Ali Raza",
        emailVerifiedAt: new Date(),
        passwordHash,
        walletBalance: 18000,
      },
      create: {
        id: "seed_founder_ali",
        fullName: "Ali Raza",
        email: "ali.founder@nexus.local",
        emailVerifiedAt: new Date(),
        passwordHash,
        role: "ENTREPRENEUR",
        bio: "Building a secure collaboration stack for investor-founder workflows.",
        location: "Karachi, Pakistan",
        website: "https://nexus.example/startups/nexus",
        startupName: "Nexus Labs",
        startupStage: "Seed",
        industry: "SaaS",
        pitchSummary:
          "A collaboration platform for investor-founder diligence, meetings, documents, and secure transactions.",
        fundingNeeded: 300000,
        previousFunding: "Bootstrapped + 25k friends and family round",
        preferredIndustries: ["SaaS", "Collaboration"],
        preferences: {
          meetingWindows: ["09:00-12:00", "15:00-18:00"],
          timezone: "Asia/Karachi",
        },
        walletBalance: 18000,
      },
    }),
    prisma.user.upsert({
      where: { email: "maya.founder@nexus.local" },
      update: {
        fullName: "Maya Chen",
        emailVerifiedAt: new Date(),
        passwordHash,
        walletBalance: 12500,
      },
      create: {
        id: "seed_founder_maya",
        fullName: "Maya Chen",
        email: "maya.founder@nexus.local",
        emailVerifiedAt: new Date(),
        passwordHash,
        role: "ENTREPRENEUR",
        bio: "Founder of a fintech operations platform for distributed teams.",
        location: "Singapore",
        website: "https://nexus.example/startups/ledgerflow",
        startupName: "LedgerFlow",
        startupStage: "Pre-seed",
        industry: "FinTech",
        pitchSummary:
          "LedgerFlow reduces reconciliation time for cross-border SMB finance teams.",
        fundingNeeded: 200000,
        previousFunding: "Accelerator-backed",
        preferredIndustries: ["FinTech", "B2B"],
        preferences: {
          meetingWindows: ["10:00-13:00"],
          timezone: "Asia/Singapore",
        },
        walletBalance: 12500,
      },
    }),
  ]);

  const investor = users.find((user) => user.id === "seed_investor_sarah")!;
  const entrepreneur = users.find((user) => user.id === "seed_founder_ali")!;

  const acceptedMeeting = await prisma.meeting.upsert({
    where: { roomId: "seed-room-accepted" },
    update: {
      startTime: buildDate(1, 16),
      endTime: buildDate(1, 17),
      status: "ACCEPTED",
      notes: "Bring the updated product metrics and customer references.",
    },
    create: {
      id: "seed_meeting_accepted",
      organizerId: investor.id,
      inviteeId: entrepreneur.id,
      title: "Seed diligence call",
      agenda: "Walk through traction, security posture, and document chamber flow.",
      notes: "Bring the updated product metrics and customer references.",
      startTime: buildDate(1, 16),
      endTime: buildDate(1, 17),
      timezone: "Asia/Karachi",
      status: "ACCEPTED",
      roomId: "seed-room-accepted",
    },
  });

  await prisma.meeting.upsert({
    where: { roomId: "seed-room-pending" },
    update: {
      startTime: buildDate(3, 11),
      endTime: buildDate(3, 12),
      status: "PENDING",
    },
    create: {
      id: "seed_meeting_pending",
      organizerId: entrepreneur.id,
      inviteeId: "seed_investor_omar",
      title: "Product demo follow-up",
      agenda: "Share roadmap and discuss milestone-based investment structure.",
      startTime: buildDate(3, 11),
      endTime: buildDate(3, 12),
      timezone: "Asia/Karachi",
      status: "PENDING",
      roomId: "seed-room-pending",
    },
  });

  await prisma.document.upsert({
    where: { id: "seed_document_termsheet" },
    update: {
      title: "Nexus term sheet draft",
      relatedMeetingId: acceptedMeeting.id,
      updatedAt: new Date(),
    },
    create: {
      id: "seed_document_termsheet",
      title: "Nexus term sheet draft",
      fileUrl: "/uploads/demo-term-sheet.pdf",
      fileKey: "demo-term-sheet.pdf",
      fileType: "application/pdf",
      fileSize: 582,
      uploadedById: investor.id,
      version: 1,
      versionGroupId: "seed_document_termsheet_group",
      relatedMeetingId: acceptedMeeting.id,
      status: "UNDER_REVIEW",
    },
  });

  await prisma.transaction.upsert({
    where: { reference: "seed_dep_001" },
    update: {
      amount: 5000,
      userId: entrepreneur.id,
    },
    create: {
      id: "seed_transaction_deposit",
      reference: "seed_dep_001",
      userId: entrepreneur.id,
      type: "DEPOSIT",
      amount: 5000,
      currency: "USD",
      status: "COMPLETED",
      provider: "MOCK",
      note: "Investor workshop reimbursement",
    },
  });

  await prisma.transaction.upsert({
    where: { reference: "seed_tr_001" },
    update: {
      amount: 2500,
      userId: investor.id,
      recipientUserId: entrepreneur.id,
    },
    create: {
      id: "seed_transaction_transfer",
      reference: "seed_tr_001",
      userId: investor.id,
      recipientUserId: entrepreneur.id,
      type: "TRANSFER",
      amount: 2500,
      currency: "USD",
      status: "COMPLETED",
      provider: "MOCK",
      note: "Due diligence reimbursement",
    },
  });

  await prisma.notification.upsert({
    where: { id: "seed_notification_welcome_investor" },
    update: {
      title: "Welcome back, Sarah",
      message: "Your Nexus workspace is ready with seed pipeline data.",
    },
    create: {
      id: "seed_notification_welcome_investor",
      userId: investor.id,
      type: "SYSTEM",
      title: "Welcome back, Sarah",
      message: "Your Nexus workspace is ready with seed pipeline data.",
      metadata: { source: "seed" },
    },
  });

  await prisma.notification.upsert({
    where: { id: "seed_notification_meeting_founder" },
    update: {
      title: "Accepted meeting ready",
      message: "Your video room is ready for the seed diligence call tomorrow.",
    },
    create: {
      id: "seed_notification_meeting_founder",
      userId: entrepreneur.id,
      type: "MEETING",
      title: "Accepted meeting ready",
      message: "Your video room is ready for the seed diligence call tomorrow.",
      metadata: {
        source: "seed",
        meetingId: acceptedMeeting.id,
      },
    },
  });

  console.log("Seed completed.");
  console.log("Investor login: sarah.investor@nexus.local / Password123!");
  console.log("Founder login: ali.founder@nexus.local / Password123!");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
