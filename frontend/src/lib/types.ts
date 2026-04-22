export type UserRole = "INVESTOR" | "ENTREPRENEUR";
export type MeetingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";
export type DocumentStatus = "UPLOADED" | "UNDER_REVIEW" | "SIGNED" | "ARCHIVED";
export type TransactionType = "DEPOSIT" | "WITHDRAW" | "TRANSFER";
export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED";
export type PaymentProvider = "STRIPE" | "PAYPAL" | "MOCK";

export interface CompactUser {
  id: string;
  fullName: string;
  role: UserRole;
  profileImage?: string | null;
  location?: string | null;
  startupName?: string | null;
  firmName?: string | null;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  bio?: string | null;
  profileImage?: string | null;
  location?: string | null;
  website?: string | null;
  preferences?: Record<string, unknown> | null;
  startupName?: string | null;
  startupStage?: string | null;
  industry?: string | null;
  pitchSummary?: string | null;
  fundingNeeded?: number | null;
  previousFunding?: string | null;
  firmName?: string | null;
  investmentFocus?: string | null;
  ticketSizeMin?: number | null;
  ticketSizeMax?: number | null;
  portfolioHistory?: string | null;
  preferredIndustries: string[];
  walletBalance: number;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  agenda?: string | null;
  notes?: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  status: MeetingStatus;
  roomId: string;
  organizerId: string;
  inviteeId: string;
  organizer?: CompactUser;
  invitee?: CompactUser;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSignature {
  id: string;
  signerName: string;
  signatureUrl: string;
  signedById: string;
  signedAt: string;
}

export interface ChamberDocument {
  id: string;
  title: string;
  fileUrl: string;
  fileKey: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  uploadedBy?: CompactUser;
  version: number;
  versionGroupId: string;
  status: DocumentStatus;
  signatureUrl?: string | null;
  relatedMeetingId?: string | null;
  signatures: DocumentSignature[];
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  provider: PaymentProvider;
  reference: string;
  note?: string | null;
  recipientUserId?: string | null;
  recipientUser?: CompactUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  profile: User;
  stats: {
    walletBalance: number;
    upcomingMeetingCount: number;
    documentCount: number;
    recentTransactionCount: number;
  };
  upcomingMeetings: Meeting[];
  recentDocuments: ChamberDocument[];
  recentTransactions: Transaction[];
  notifications: NotificationItem[];
  suggestedUsers: User[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
