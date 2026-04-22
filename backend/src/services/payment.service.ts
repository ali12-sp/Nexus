import { StatusCodes } from "http-status-codes";
import { v4 as uuid } from "uuid";

import { prisma } from "../lib/prisma.js";
import { createNotification } from "./notification.service.js";
import { AppError } from "../utils/appError.js";

type MoneyInput = {
  userId: string;
  amount: number;
  currency: string;
  note?: string | null;
};

export const processDeposit = async ({ userId, amount, currency, note }: MoneyInput) => {
  const reference = `dep_${uuid().slice(0, 12)}`;

  const result = await prisma.$transaction(async (tx: any) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        walletBalance: {
          increment: amount,
        },
      },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: "DEPOSIT",
        amount,
        currency,
        status: "COMPLETED",
        provider: "MOCK",
        reference,
        note,
      },
    });

    return { user, transaction };
  });

  await createNotification({
    userId,
    type: "PAYMENT",
    title: "Deposit completed",
    message: `${currency.toUpperCase()} ${amount.toFixed(2)} was added to your wallet.`,
    metadata: {
      reference,
    },
  });

  return result;
};

export const processWithdrawal = async ({ userId, amount, currency, note }: MoneyInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  if (Number(user.walletBalance) < amount) {
    throw new AppError("Insufficient wallet balance", StatusCodes.BAD_REQUEST);
  }

  const reference = `wd_${uuid().slice(0, 12)}`;

  const result = await prisma.$transaction(async (tx: any) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        walletBalance: {
          decrement: amount,
        },
      },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: "WITHDRAW",
        amount,
        currency,
        status: "COMPLETED",
        provider: "MOCK",
        reference,
        note,
      },
    });

    return { user: updatedUser, transaction };
  });

  await createNotification({
    userId,
    type: "PAYMENT",
    title: "Withdrawal completed",
    message: `${currency.toUpperCase()} ${amount.toFixed(2)} was withdrawn from your wallet.`,
    metadata: {
      reference,
    },
  });

  return result;
};

export const processTransfer = async ({
  userId,
  recipientUserId,
  amount,
  currency,
  note,
}: MoneyInput & { recipientUserId: string }) => {
  if (userId === recipientUserId) {
    throw new AppError("You cannot transfer funds to yourself", StatusCodes.BAD_REQUEST);
  }

  const sender = await prisma.user.findUnique({
    where: { id: userId },
  });
  const recipient = await prisma.user.findUnique({
    where: { id: recipientUserId },
  });

  if (!sender || !recipient) {
    throw new AppError("Transfer participants not found", StatusCodes.NOT_FOUND);
  }

  if (Number(sender.walletBalance) < amount) {
    throw new AppError("Insufficient wallet balance", StatusCodes.BAD_REQUEST);
  }

  const reference = `tr_${uuid().slice(0, 12)}`;

  const result = await prisma.$transaction(async (tx: any) => {
    const updatedSender = await tx.user.update({
      where: { id: userId },
      data: {
        walletBalance: {
          decrement: amount,
        },
      },
    });

    await tx.user.update({
      where: { id: recipientUserId },
      data: {
        walletBalance: {
          increment: amount,
        },
      },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId,
        recipientUserId,
        type: "TRANSFER",
        amount,
        currency,
        status: "COMPLETED",
        provider: "MOCK",
        reference,
        note,
      },
      include: {
        recipientUser: true,
      },
    });

    return { user: updatedSender, transaction };
  });

  await Promise.all([
    createNotification({
      userId,
      type: "PAYMENT",
      title: "Transfer sent",
      message: `${currency.toUpperCase()} ${amount.toFixed(2)} was transferred to ${recipient.fullName}.`,
      metadata: {
        reference,
        recipientUserId,
      },
    }),
    createNotification({
      userId: recipientUserId,
      type: "PAYMENT",
      title: "Transfer received",
      message: `${sender.fullName} transferred ${currency.toUpperCase()} ${amount.toFixed(2)} to your wallet.`,
      metadata: {
        reference,
        userId,
      },
    }),
  ]);

  return result;
};
