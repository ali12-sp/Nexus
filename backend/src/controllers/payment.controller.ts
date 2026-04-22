import { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";
import {
  processDeposit,
  processTransfer,
  processWithdrawal,
} from "../services/payment.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { serializeTransaction, serializeUser } from "../utils/serializers.js";

export const depositController = async (req: Request, res: Response) => {
  const result = await processDeposit({
    userId: req.user!.id,
    ...req.body,
  });

  return sendSuccess(
    res,
    {
      transaction: serializeTransaction(result.transaction),
      user: serializeUser(result.user),
    },
    "Deposit completed successfully",
  );
};

export const withdrawController = async (req: Request, res: Response) => {
  const result = await processWithdrawal({
    userId: req.user!.id,
    ...req.body,
  });

  return sendSuccess(
    res,
    {
      transaction: serializeTransaction(result.transaction),
      user: serializeUser(result.user),
    },
    "Withdrawal completed successfully",
  );
};

export const transferController = async (req: Request, res: Response) => {
  const result = await processTransfer({
    userId: req.user!.id,
    ...req.body,
  });

  return sendSuccess(
    res,
    {
      transaction: serializeTransaction(result.transaction),
      user: serializeUser(result.user),
    },
    "Transfer completed successfully",
  );
};

export const listTransactionsController = async (req: Request, res: Response) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [{ userId: req.user!.id }, { recipientUserId: req.user!.id }],
    },
    include: {
      recipientUser: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return sendSuccess(
    res,
    transactions.map(serializeTransaction),
    "Transactions fetched successfully",
  );
};
