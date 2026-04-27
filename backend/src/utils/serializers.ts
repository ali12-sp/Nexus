type Decimalish = number | string | { toString(): string } | null | undefined;

type UserLike = {
  id: string;
  fullName: string;
  email: string;
  emailVerifiedAt: Date | null;
  role: "INVESTOR" | "ENTREPRENEUR";
  bio: string | null;
  profileImage: string | null;
  location: string | null;
  website: string | null;
  preferences: unknown;
  startupName: string | null;
  startupStage: string | null;
  industry: string | null;
  pitchSummary: string | null;
  fundingNeeded: Decimalish;
  previousFunding: string | null;
  firmName: string | null;
  investmentFocus: string | null;
  ticketSizeMin: Decimalish;
  ticketSizeMax: Decimalish;
  portfolioHistory: string | null;
  preferredIndustries: string[];
  walletBalance: Decimalish;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type MeetingLike = {
  id: string;
  title: string;
  agenda: string | null;
  notes: string | null;
  startTime: Date;
  endTime: Date;
  timezone: string;
  status: string;
  roomId: string;
  organizerId: string;
  inviteeId: string;
  createdAt: Date;
  updatedAt: Date;
};

type SignatureLike = {
  id: string;
  signerName: string;
  signatureUrl: string;
  signedById: string;
  signedAt: Date;
};

type DocumentLike = {
  id: string;
  title: string;
  fileUrl: string;
  fileKey: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  version: number;
  versionGroupId: string;
  status: string;
  signatureUrl: string | null;
  relatedMeetingId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TransactionLike = {
  id: string;
  userId: string;
  type: string;
  amount: Decimalish;
  currency: string;
  status: string;
  provider: string;
  reference: string;
  note: string | null;
  recipientUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type NotificationLike = {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
};

type AuditLogLike = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: Date;
};

const toNumber = (value: Decimalish) =>
  value === null || value === undefined ? null : Number(value);

export const serializeUser = (user: unknown) => {
  const typedUser = user as UserLike;

  return {
    id: typedUser.id,
    fullName: typedUser.fullName,
    email: typedUser.email,
    emailVerifiedAt: typedUser.emailVerifiedAt,
    role: typedUser.role,
    bio: typedUser.bio,
    profileImage: typedUser.profileImage,
    location: typedUser.location,
    website: typedUser.website,
    preferences: typedUser.preferences,
    startupName: typedUser.startupName,
    startupStage: typedUser.startupStage,
    industry: typedUser.industry,
    pitchSummary: typedUser.pitchSummary,
    fundingNeeded: toNumber(typedUser.fundingNeeded),
    previousFunding: typedUser.previousFunding,
    firmName: typedUser.firmName,
    investmentFocus: typedUser.investmentFocus,
    ticketSizeMin: toNumber(typedUser.ticketSizeMin),
    ticketSizeMax: toNumber(typedUser.ticketSizeMax),
    portfolioHistory: typedUser.portfolioHistory,
    preferredIndustries: typedUser.preferredIndustries,
    walletBalance: Number(typedUser.walletBalance),
    twoFactorEnabled: typedUser.twoFactorEnabled,
    createdAt: typedUser.createdAt,
    updatedAt: typedUser.updatedAt,
  };
};

export const serializeMeeting = (
  meeting: MeetingLike & {
    organizer?: UserLike;
    invitee?: UserLike;
  },
) => ({
  id: meeting.id,
  title: meeting.title,
  agenda: meeting.agenda,
  notes: meeting.notes,
  startTime: meeting.startTime,
  endTime: meeting.endTime,
  timezone: meeting.timezone,
  status: meeting.status,
  roomId: meeting.roomId,
  organizerId: meeting.organizerId,
  inviteeId: meeting.inviteeId,
  organizer: meeting.organizer ? serializeCompactUser(meeting.organizer) : undefined,
  invitee: meeting.invitee ? serializeCompactUser(meeting.invitee) : undefined,
  createdAt: meeting.createdAt,
  updatedAt: meeting.updatedAt,
});

export const serializeDocument = (
  document: DocumentLike & {
    uploadedBy?: UserLike;
    signatures?: SignatureLike[];
  },
) => ({
  id: document.id,
  title: document.title,
  fileUrl: document.fileUrl,
  fileKey: document.fileKey,
  fileType: document.fileType,
  fileSize: document.fileSize,
  uploadedById: document.uploadedById,
  uploadedBy: document.uploadedBy ? serializeCompactUser(document.uploadedBy) : undefined,
  version: document.version,
  versionGroupId: document.versionGroupId,
  status: document.status,
  signatureUrl: document.signatureUrl,
  relatedMeetingId: document.relatedMeetingId,
  signatures:
    document.signatures?.map((signature) => ({
      id: signature.id,
      signerName: signature.signerName,
      signatureUrl: signature.signatureUrl,
      signedById: signature.signedById,
      signedAt: signature.signedAt,
    })) ?? [],
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

export const serializeTransaction = (
  transaction: TransactionLike & {
    user?: UserLike;
    recipientUser?: UserLike | null;
  },
) => ({
  id: transaction.id,
  userId: transaction.userId,
  type: transaction.type,
  amount: Number(transaction.amount),
  currency: transaction.currency,
  status: transaction.status,
  provider: transaction.provider,
  reference: transaction.reference,
  note: transaction.note,
  recipientUserId: transaction.recipientUserId,
  recipientUser: transaction.recipientUser
    ? serializeCompactUser(transaction.recipientUser)
    : null,
  createdAt: transaction.createdAt,
  updatedAt: transaction.updatedAt,
});

export const serializeNotification = (notification: NotificationLike) => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  metadata: notification.metadata,
  readAt: notification.readAt,
  createdAt: notification.createdAt,
});

export const serializeAuditLog = (entry: AuditLogLike) => ({
  id: entry.id,
  action: entry.action,
  entityType: entry.entityType,
  entityId: entry.entityId,
  status: entry.status,
  ipAddress: entry.ipAddress,
  userAgent: entry.userAgent,
  metadata: entry.metadata,
  createdAt: entry.createdAt,
});

export const serializeCompactUser = (user: UserLike) => ({
  id: user.id,
  fullName: user.fullName,
  role: user.role,
  profileImage: user.profileImage,
  location: user.location,
  startupName: user.startupName,
  firmName: user.firmName,
});
