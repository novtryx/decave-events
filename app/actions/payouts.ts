"use server"
import { protectedFetch } from "@/lib/protectedFetch";
import { publicFetch } from "@/lib/publicFetch";
import { unstable_noStore as noStore } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SaveBankAccountPayload = {
  bankName: string;
  bankCode: string;
  accountNumber: string;
};

export type CreateWithdrawalPayload = {
  amount: number;
};

export type WithdrawalStatus = 'pending' | 'completed';

export type Withdrawal = {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  bankName: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
  updatedAt: string;
};

export type BankAccount = {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
  updatedAt: string;
};

export type PayoutSummary = {
  totalRevenue: number;
  totalWithdrawn: number;
  availableBalance: number;
};

export type PaginatedWithdrawals = {
  data: Withdrawal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type Bank = {
  name: string;
  code: string;
};


// ─── Summary ──────────────────────────────────────────────────────────────────

export async function getPayoutSummary(): Promise<PayoutSummary> {
  noStore();
  const res = await protectedFetch<PayoutSummary>("/payouts/summary", {
    method: "GET",
  });
  return res;
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export async function getWithdrawals(
  page: string = "1",
  limit: string = "20"
): Promise<PaginatedWithdrawals> {
  noStore();
  const res = await protectedFetch<PaginatedWithdrawals>(
    `/payouts/withdrawals?page=${page}&limit=${limit}`,
    { method: "GET" }
  );
  return res;
}

export async function requestWithdrawal(
  payload: CreateWithdrawalPayload
): Promise<{ message: string }> {
  noStore();
  const res = await protectedFetch<{ message: string }>("/payouts/withdraw", {
    method: "POST",
    body: payload,
  });
  return res;
}

// ─── Bank Account ─────────────────────────────────────────────────────────────

export async function getBankAccount(): Promise<BankAccount> {
  noStore();
  const res = await protectedFetch<BankAccount>("/payouts/bank-account", {
    method: "GET",
  });
  return res;
}

export async function saveBankAccount(
  payload: SaveBankAccountPayload
): Promise<BankAccount> {
  noStore();
  const res = await protectedFetch<BankAccount>("/payouts/bank-account", {
    method: "POST",
    body: payload,
  });
  return res;
}

export async function deleteBankAccount(): Promise<{ message: string }> {
  noStore();
  const res = await protectedFetch<{ message: string }>("/payouts/bank-account", {
    method: "DELETE",
  });
  return res;
}

export async function getBanks(): Promise<Bank[]> {
  noStore();
  const res = await publicFetch<Bank[]>("/payouts/banks", {
    method: "GET",
  });
  return res;
}

export async function resolveAccount(
  accountNumber: string,
  bankCode: string
): Promise<{ account_name: string; account_number: string }> {
  noStore();
  const res = await publicFetch<{ account_name: string; account_number: string }>(
    `/payouts/resolve-account?accountNumber=${accountNumber}&bankCode=${bankCode}`,
    { method: "GET" }
  );
  return res;
}