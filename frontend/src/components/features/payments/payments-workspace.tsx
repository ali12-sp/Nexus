"use client";

import { startTransition, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Wallet2 } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch, ApiError } from "@/lib/api";
import type { Transaction, User } from "@/lib/types";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type MoneyFormState = {
  amount: string;
  currency: string;
  note: string;
  recipientUserId: string;
};

const emptyForm: MoneyFormState = {
  amount: "",
  currency: "USD",
  note: "",
  recipientUserId: "",
};

export const PaymentsWorkspace = () => {
  const { user, token, refreshSession } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [depositForm, setDepositForm] = useState<MoneyFormState>(emptyForm);
  const [withdrawForm, setWithdrawForm] = useState<MoneyFormState>(emptyForm);
  const [transferForm, setTransferForm] = useState<MoneyFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [transactionList, userList] = await Promise.all([
        apiFetch<Transaction[]>("/payments/transactions", { token }),
        apiFetch<User[]>("/users", { token }),
      ]);

      startTransition(() => {
        setTransactions(transactionList);
        setUsers(userList.filter((candidate) => candidate.id !== user?.id));
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to load payment activity.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token]);

  const updateForm = (
    setter: React.Dispatch<React.SetStateAction<MoneyFormState>>,
    field: keyof MoneyFormState,
    value: string,
  ) => {
    setter((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitPayment = async (
    endpoint: "/payments/deposit" | "/payments/withdraw" | "/payments/transfer",
    form: MoneyFormState,
    reset: React.Dispatch<React.SetStateAction<MoneyFormState>>,
  ) => {
    if (!token) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiFetch(endpoint, {
        method: "POST",
        token,
        body: {
          amount: Number(form.amount),
          currency: form.currency,
          note: form.note || null,
          ...(endpoint === "/payments/transfer"
            ? { recipientUserId: form.recipientUserId }
            : {}),
        },
      });

      reset(emptyForm);
      await refreshSession();
      await loadData();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to process the transaction.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell
      description="Manage wallet balance, move mock funds, and inspect transfer history with Stripe or PayPal reserved for sandbox expansion."
      title="Payments"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Wallet balance">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-mint/10 p-3 text-mint">
              <Wallet2 size={22} />
            </div>
            <div>
              <p className="font-display text-3xl text-ink">
                {formatCurrency(user?.walletBalance ?? 0)}
              </p>
              <p className="text-sm text-slate">Mock provider enabled</p>
            </div>
          </div>
        </Card>
        <Card title="Deposits">
          <p className="font-display text-3xl text-ink">
            {transactions.filter((transaction) => transaction.type === "DEPOSIT").length}
          </p>
          <p className="text-sm text-slate">Completed or pending top-ups</p>
        </Card>
        <Card title="Withdrawals">
          <p className="font-display text-3xl text-ink">
            {transactions.filter((transaction) => transaction.type === "WITHDRAW").length}
          </p>
          <p className="text-sm text-slate">Outgoing wallet activity</p>
        </Card>
        <Card title="Transfers">
          <p className="font-display text-3xl text-ink">
            {transactions.filter((transaction) => transaction.type === "TRANSFER").length}
          </p>
          <p className="text-sm text-slate">Peer-to-peer collaboration payments</p>
        </Card>
      </div>

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-ember">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Deposit funds">
          <div className="space-y-4">
            <Input
              label="Amount"
              onChange={(event) => updateForm(setDepositForm, "amount", event.target.value)}
              type="number"
              value={depositForm.amount}
            />
            <Input
              label="Currency"
              onChange={(event) => updateForm(setDepositForm, "currency", event.target.value.toUpperCase())}
              value={depositForm.currency}
            />
            <Textarea
              label="Note"
              onChange={(event) => updateForm(setDepositForm, "note", event.target.value)}
              value={depositForm.note}
            />
            <Button
              disabled={isSubmitting}
              fullWidth
              onClick={() => void submitPayment("/payments/deposit", depositForm, setDepositForm)}
            >
              <ArrowDownLeft className="mr-2" size={16} />
              Deposit
            </Button>
          </div>
        </Card>

        <Card title="Withdraw funds">
          <div className="space-y-4">
            <Input
              label="Amount"
              onChange={(event) => updateForm(setWithdrawForm, "amount", event.target.value)}
              type="number"
              value={withdrawForm.amount}
            />
            <Input
              label="Currency"
              onChange={(event) => updateForm(setWithdrawForm, "currency", event.target.value.toUpperCase())}
              value={withdrawForm.currency}
            />
            <Textarea
              label="Note"
              onChange={(event) => updateForm(setWithdrawForm, "note", event.target.value)}
              value={withdrawForm.note}
            />
            <Button
              disabled={isSubmitting}
              fullWidth
              onClick={() => void submitPayment("/payments/withdraw", withdrawForm, setWithdrawForm)}
              variant="outline"
            >
              <ArrowUpRight className="mr-2" size={16} />
              Withdraw
            </Button>
          </div>
        </Card>

        <Card title="Transfer funds">
          <div className="space-y-4">
            <Select
              label="Recipient"
              onChange={(event) => updateForm(setTransferForm, "recipientUserId", event.target.value)}
              value={transferForm.recipientUserId}
            >
              <option value="">Select a recipient</option>
              {users.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.fullName}
                </option>
              ))}
            </Select>
            <Input
              label="Amount"
              onChange={(event) => updateForm(setTransferForm, "amount", event.target.value)}
              type="number"
              value={transferForm.amount}
            />
            <Input
              label="Currency"
              onChange={(event) => updateForm(setTransferForm, "currency", event.target.value.toUpperCase())}
              value={transferForm.currency}
            />
            <Textarea
              label="Note"
              onChange={(event) => updateForm(setTransferForm, "note", event.target.value)}
              value={transferForm.note}
            />
            <Button
              disabled={isSubmitting}
              fullWidth
              onClick={() => void submitPayment("/payments/transfer", transferForm, setTransferForm)}
              variant="secondary"
            >
              <ArrowLeftRight className="mr-2" size={16} />
              Transfer
            </Button>
          </div>
        </Card>
      </div>

      <Card
        action={
          <Button onClick={() => void loadData()} variant="outline">
            Refresh history
          </Button>
        }
        description="Latest mock payment activity associated with the authenticated user."
        title="Transaction history"
      >
        {isLoading ? (
          <p className="text-sm text-slate">Loading transactions...</p>
        ) : transactions.length ? (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                className="flex flex-col gap-3 rounded-[24px] border border-slate-100 bg-sand/70 p-5 lg:flex-row lg:items-center lg:justify-between"
                key={transaction.id}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-ink">{transaction.type}</p>
                    <Badge
                      tone={
                        transaction.status === "COMPLETED"
                          ? "success"
                          : transaction.status === "FAILED"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {transaction.status}
                    </Badge>
                    <Badge>{transaction.provider}</Badge>
                  </div>
                  <p className="text-sm text-slate">{formatRelativeDate(transaction.createdAt)}</p>
                  {transaction.recipientUser ? (
                    <p className="text-sm text-slate">
                      Recipient: {transaction.recipientUser.fullName}
                    </p>
                  ) : null}
                  {transaction.note ? <p className="text-sm text-slate">{transaction.note}</p> : null}
                </div>
                <p className="font-display text-2xl text-ink">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate">No payment activity yet.</p>
        )}
      </Card>
    </AppShell>
  );
};
