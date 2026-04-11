"use client";

import React, { useState } from "react";
import { MdAdd, MdRequestPage, MdClose, MdDelete, MdEdit } from "react-icons/md";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPayoutSummary,
  getWithdrawals,
  getBankAccount,
  saveBankAccount,
  deleteBankAccount,
  requestWithdrawal,
  type PayoutSummary,
  type PaginatedWithdrawals,
  type BankAccount,
  type SaveBankAccountPayload,
  getBanks,
  resolveAccount,
} from "@/app/actions/payouts"; // 👈 adjust path

// ─── Types ────────────────────────────────────────────────────────────────────

type Bank = {
  name: string;
  code: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number) {
  return "₦" + Number(amount).toLocaleString("en-NG");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SummarySkeleton() {
  return (
    <>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-[#121212] p-4 rounded-2xl border border-[#1f1f1f] animate-pulse space-y-3"
        >
          <div className="h-4 bg-[#1f1f1f] rounded w-1/2" />
          <div className="h-7 bg-[#1f1f1f] rounded w-2/3" />
        </div>
      ))}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-10 bg-[#1f1f1f] rounded-xl" />
      ))}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
        Completed
      </span>
    );
  }
  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
      Pending
    </span>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-[#1f1f1f]">
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1 rounded-lg text-sm bg-[#1f1f1f] text-gray-400 hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          Previous
        </button>
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1 rounded-lg text-sm bg-[#1f1f1f] text-gray-400 hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─── Modal Wrapper ────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl w-full max-w-md p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition"
          >
            <MdClose size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Bank Account Modal ───────────────────────────────────────────────────────

function BankAccountModal({
  existing,
  onClose,
}: {
  existing: BankAccount | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<SaveBankAccountPayload>({
    bankName: existing?.bankName ?? "",
    bankCode: existing?.bankCode ?? "",
    accountNumber: existing?.accountNumber ?? "",
  });

  const [resolvedName, setResolvedName] = useState<string>(
    existing?.accountName ?? ""
  );

  // fetch Paystack bank list
const { data: banks, isLoading: banksLoading } = useQuery<Bank[]>({
  queryKey: ["paystack-banks"],
  queryFn: getBanks, // 👈 now calls your backend
  staleTime: Infinity,
});

const { isFetching: resolving } = useQuery({
  queryKey: ["resolve-account", form.accountNumber, form.bankCode],
  queryFn: async () => {
    const data = await resolveAccount(form.accountNumber, form.bankCode);
    if (data?.account_name) {
      setResolvedName(data.account_name);
      return data.account_name;
    }
    setResolvedName("");
    return null;
  },
  enabled: form.accountNumber.length === 10 && !!form.bankCode,
  staleTime: 0,
  retry: false,
});

  const { mutate: save, isPending, error } = useMutation({
    mutationFn: () => saveBankAccount(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-account"] });
      onClose();
    },
  });

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = banks?.find((b) => b.code === e.target.value);
    setResolvedName("");
    setForm((prev) => ({
      ...prev,
      bankCode: e.target.value,
      bankName: selected?.name ?? "",
    }));
  };

  const canSave = !!resolvedName && !resolving && !isPending;

  return (
    <Modal
      title={existing ? "Update Bank Account" : "Add Bank Account"}
      onClose={onClose}
    >
      {/* Bank select */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400 uppercase tracking-wider">
          Bank
        </label>
        {banksLoading ? (
          <div className="h-10 bg-[#1f1f1f] rounded-xl animate-pulse" />
        ) : (
          <select
            value={form.bankCode}
            onChange={handleBankChange}
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FFD159]"
          >
            <option value="">Select a bank</option>
            {banks?.map((b, index) => (
              <option key={`${b.code}-${index}`} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Account number */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400 uppercase tracking-wider">
          Account Number
        </label>
        <input
          type="text"
          maxLength={10}
          value={form.accountNumber}
          onChange={(e) => {
            setResolvedName("");
            setForm((prev) => ({ ...prev, accountNumber: e.target.value }));
          }}
          placeholder="0123456789"
          className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FFD159] placeholder:text-gray-600"
        />
      </div>

      {/* Resolved account name */}
      <div className="flex items-center gap-2 min-h-[36px]">
        {resolving && (
          <p className="text-xs text-gray-500 animate-pulse">Resolving account...</p>
        )}
        {!resolving && resolvedName && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 w-full">
            <span className="text-green-400 text-sm font-medium">{resolvedName}</span>
          </div>
        )}
        {!resolving && !resolvedName && form.accountNumber.length === 10 && form.bankCode && (
          <p className="text-xs text-red-400">Could not resolve account. Check details.</p>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{(error as Error).message}</p>
      )}

      <button
        disabled={!canSave}
        onClick={() => save()}
        className="w-full py-3 rounded-xl bg-[#FFD159] text-black font-bold text-sm hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? "Saving..." : "Save Account"}
      </button>
    </Modal>
  );
}

// ─── Withdrawal Modal ─────────────────────────────────────────────────────────

function WithdrawalModal({
  availableBalance,
  bankAccount,
  onClose,
}: {
  availableBalance: number;
  bankAccount: BankAccount | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");

  const { mutate: withdraw, isPending, error, isSuccess } = useMutation({
    mutationFn: () => requestWithdrawal({ amount: Number(amount) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-summary"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });

  if (isSuccess) {
    return (
      <Modal title="Withdrawal Requested" onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
            <span className="text-green-400 text-2xl">✓</span>
          </div>
          <p className="text-gray-300 text-sm text-center">
            Your withdrawal request has been submitted. The admin has been notified and will process it shortly.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#FFD159] text-black font-bold text-sm hover:opacity-90 transition"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Request Withdrawal" onClose={onClose}>
      {/* Account preview */}
      {bankAccount && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex flex-col gap-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Sending to</p>
          <p className="text-white text-sm font-medium">{bankAccount.accountName}</p>
          <p className="text-gray-400 text-xs">
            {bankAccount.bankName} · {bankAccount.accountNumber}
          </p>
        </div>
      )}

      {/* Available balance */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex justify-between items-center">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Available</p>
        <p className="text-[#FFD159] font-bold">{formatAmount(availableBalance)}</p>
      </div>

      {/* Amount input */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400 uppercase tracking-wider">
          Amount
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FFD159] placeholder:text-gray-600"
        />
        {Number(amount) > availableBalance && (
          <p className="text-xs text-red-400">Amount exceeds available balance</p>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{(error as Error).message}</p>
      )}

      <button
        disabled={
          !amount ||
          Number(amount) <= 0 ||
          Number(amount) > availableBalance ||
          isPending
        }
        onClick={() => withdraw()}
        className="w-full py-3 rounded-xl bg-[#FFD159] text-black font-bold text-sm hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? "Submitting..." : "Request Withdrawal"}
      </button>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PayoutsPage = () => {
  const [page, setPage] = useState(1);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const { data: summary, isLoading: summaryLoading } = useQuery<PayoutSummary>({
    queryKey: ["payout-summary"],
    queryFn: getPayoutSummary,
    staleTime: 30_000,
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery<PaginatedWithdrawals>({
    queryKey: ["withdrawals", page],
    queryFn: () => getWithdrawals(String(page)),
    staleTime: 30_000,
  });

  const { data: bankAccount } = useQuery<BankAccount>({
    queryKey: ["bank-account"],
    queryFn: getBankAccount,
    // no error throwing if 404 — user just hasn't added one yet
    retry: false,
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-white">Payouts</h1>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryLoading ? (
          <SummarySkeleton />
        ) : (
          <>
            <div className="bg-[#121212] p-4 rounded-2xl border border-[#1f1f1f] flex flex-col gap-1">
              <span className="text-sm text-gray-400">Total Revenue</span>
              <span className="text-2xl font-bold text-[#FFD159]">
                {formatAmount(summary?.totalRevenue ?? 0)}
              </span>
            </div>

            <div className="bg-[#121212] p-4 rounded-2xl border border-[#1f1f1f] flex flex-col gap-1">
              <span className="text-sm text-gray-400">Total Withdrawn</span>
              <span className="text-2xl font-bold text-white">
                {formatAmount(summary?.totalWithdrawn ?? 0)}
              </span>
            </div>

            <div className="bg-[#121212] p-4 rounded-2xl border border-[#1f1f1f] flex flex-col gap-1">
              <span className="text-sm text-gray-400">Available Balance</span>
              <span className="text-2xl font-bold text-[#FFD159]">
                {formatAmount(summary?.availableBalance ?? 0)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Bank Account Card ── */}
      <div className="bg-[#121212] p-4 rounded-2xl border border-[#1f1f1f] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-400">Bank Account</span>
          {bankAccount ? (
            <>
              <span className="text-white font-medium">{bankAccount.accountName}</span>
              <span className="text-gray-500 text-sm">
                {bankAccount.bankName} · {bankAccount.accountNumber}
              </span>
            </>
          ) : (
            <span className="text-gray-500 text-sm">No account added yet</span>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowBankModal(true)}
            className="flex items-center gap-1 px-3 py-2 bg-[#FFD159]/10 text-[#FFD159] rounded-xl text-sm font-medium hover:bg-[#FFD159]/20 transition"
          >
            {bankAccount ? <MdEdit /> : <MdAdd />}
            {bankAccount ? "Update Account" : "Add Account"}
          </button>

          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!bankAccount || !summary?.availableBalance}
            className="flex items-center gap-1 px-3 py-2 bg-[#FFD159] text-black rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MdRequestPage />
            Request Withdrawal
          </button>
        </div>
      </div>

      {/* ── Withdrawal History ── */}
      <div className="bg-[#121212] rounded-2xl border border-[#1f1f1f] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1f1f1f]">
          <h2 className="text-white font-semibold">Withdrawal History</h2>
        </div>

        {withdrawalsLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#1f1f1f]">
                <thead className="bg-[#1a1a1a]">
                  <tr>
                    {["Date", "Amount", "Bank", "Account", "Status"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#1f1f1f]">
                  {withdrawals?.data.map((w) => (
                    <tr key={w.id} className="hover:bg-[#1a1a1a] transition">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                        {formatDate(w.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                        {formatAmount(w.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                        {w.bankName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                        {w.accountNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={w.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!withdrawals?.data.length && (
              <p className="text-gray-500 text-center py-10 text-sm">
                No withdrawals yet.
              </p>
            )}

            <Pagination
              page={page}
              totalPages={withdrawals?.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {showBankModal && (
        <BankAccountModal
          existing={bankAccount ?? null}
          onClose={() => setShowBankModal(false)}
        />
      )}

      {showWithdrawModal && (
        <WithdrawalModal
          availableBalance={summary?.availableBalance ?? 0}
          bankAccount={bankAccount ?? null}
          onClose={() => setShowWithdrawModal(false)}
        />
      )}
    </div>
  );
};

export default PayoutsPage;