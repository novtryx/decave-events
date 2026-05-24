"use client";

import React, { useState } from "react";
import {
  inflencerRequestWithdrawal,
  influencerTransactionHistory,
  me,
  saveInfluencerBank,
} from "../actions/influencers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBanks, resolveAccount, SaveBankAccountPayload } from "../actions/payouts";

// ─── Types ────────────────────────────────────────────────────────────────────
type WithdrawalStatus = "pending" | "completed" | "failed";

interface BankAccount {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  verified: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatAmount(amount: number) {
  if (amount == null || isNaN(amount)) return "₦0";
  return "₦" + Number(amount).toLocaleString("en-NG");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#1e1e1e] rounded-lg ${className}`} />
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: WithdrawalStatus }) {
  const styles: Record<WithdrawalStatus, string> = {
    completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    failed: "bg-red-500/10 text-red-400 border border-red-500/20",
  };
  const labels: Record<WithdrawalStatus, string> = {
    completed: "Completed",
    pending: "Pending",
    failed: "Failed",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          status === "completed"
            ? "bg-emerald-400"
            : status === "pending"
            ? "bg-amber-400 animate-pulse"
            : "bg-red-400"
        }`}
      />
      {labels[status]}
    </span>
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="bg-[#111111] border border-[#222] rounded-2xl w-full max-w-md p-5 sm:p-6 flex flex-col gap-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-base">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#222] flex items-center justify-center text-[#666] hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
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

  const { data: banks, isLoading: banksLoading } = useQuery<any[]>({
    queryKey: ["paystack-banks"],
    queryFn: getBanks,
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
    mutationFn: () => saveInfluencerBank(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["influencer-transaction"] });
      onClose();
      // Refresh the page so all data re-fetches cleanly
      window.location.reload();
    },
  });

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = banks?.find((b) => b.code === e.target.value);
    setResolvedName("");
    setForm((prev: any) => ({
      ...prev,
      bankCode: e.target.value,
      bankName: selected?.name ?? "",
    }));
  };

  const canSave = !!resolvedName && !resolving && !isPending;

  return (
    <Modal title={existing ? "Update Bank Account" : "Add Bank Account"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* Bank Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-[#555] uppercase tracking-widest">
            Bank Name
          </label>
          {banksLoading ? (
            <Skeleton className="h-[46px] rounded-xl" />
          ) : (
            <select
              value={form.bankCode}
              onChange={handleBankChange}
              className="bg-[#181818] border border-[#252525] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#FFD159]/50 transition-colors"
            >
              <option value="">Select Bank</option>
              {banks?.map((b, index) => (
                <option key={`${b.code}-${index}`} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Account Number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-[#555] uppercase tracking-widest">
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
            className="bg-[#181818] border border-[#252525] text-white rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-[#FFD159]/50 placeholder:text-[#333] transition-colors"
          />
        </div>

        {/* Account Resolution */}
        <div className="min-h-[42px] flex items-center">
          {resolving && (
            <p className="text-xs text-[#666] animate-pulse">Resolving account...</p>
          )}
          {!resolving && resolvedName && (
            <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3.5 py-2.5 w-full">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                <circle cx="7" cy="7" r="6.5" stroke="#4ade80" strokeOpacity="0.5" />
                <path d="M4 7l2 2 4-4" stroke="#4ade80" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-emerald-400 text-sm font-medium">{resolvedName}</span>
            </div>
          )}
          {!resolving && !resolvedName && form.accountNumber.length === 10 && form.bankCode && (
            <p className="text-xs text-red-400">Could not resolve account. Check details.</p>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{(error as Error).message}</p>}

        <button
          disabled={!canSave}
          onClick={() => save()}
          className="w-full py-3 rounded-xl bg-[#FFD159] text-black font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving..." : existing ? "Update Account" : "Save Account"}
        </button>
      </div>
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
  const [amount, setAmount] = useState(0);
  const queryClient = useQueryClient();

  const numAmount = Number(amount);
  const exceeded = numAmount > availableBalance;
  const invalid = !amount || numAmount <= 0 || exceeded;

  const {
    mutate: requestWithdrawal,
    isPending: loading,
    isSuccess: submitted,
    error,
  } = useMutation({
    mutationFn: inflencerRequestWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["influencer-transaction"] });
    },
  });

  const handleSubmit = () => {
    requestWithdrawal({ amount });
  };

  if (submitted) {
    return (
      <Modal title="Request Submitted" onClose={onClose}>
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14l5.5 5.5L22 8" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-center space-y-1">
            <p className="text-white font-semibold">Withdrawal Requested</p>
            <p className="text-[#555] text-sm">
              {formatAmount(numAmount)} will be processed to your account shortly.
            </p>
          </div>
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
      {bankAccount && (
        <div className="bg-[#181818] border border-[#252525] rounded-xl p-3.5 space-y-0.5">
          <p className="text-[11px] font-medium text-[#444] uppercase tracking-widest mb-1.5">
            Sending to
          </p>
          <p className="text-white text-sm font-medium">{bankAccount.accountName}</p>
          <p className="text-[#555] text-xs font-mono">
            {bankAccount.bankName} · {bankAccount.accountNumber}
          </p>
        </div>
      )}

      <div className="bg-[#181818] border border-[#252525] rounded-xl p-3.5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-[#444] uppercase tracking-widest">
          Available
        </span>
        <span className="text-[#FFD159] font-bold font-mono">
          {formatAmount(availableBalance)}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-[#555] uppercase tracking-widest">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444] text-sm font-mono">
            ₦
          </span>
          <input
            type="number"
            value={amount}
            inputMode="numeric"
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="0"
            className="w-full bg-[#181818] border border-[#252525] text-white rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-[#FFD159]/50 placeholder:text-[#333] transition-colors"
          />
        </div>
        {exceeded && (
          <p className="text-red-400 text-xs">Amount exceeds available balance</p>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{(error as Error).message}</p>}

      <button
        disabled={invalid || loading}
        onClick={handleSubmit}
        className="w-full py-3 rounded-xl bg-[#FFD159] text-black font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Submitting...
          </>
        ) : (
          "Request Withdrawal"
        )}
      </button>
    </Modal>
  );
}

// ─── Referral Code Copy ───────────────────────────────────────────────────────
function ReferralCode({ code }: { code?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!code) return <Skeleton className="h-8 w-28" />;

  return (
    <div className="flex items-center gap-2 bg-[#181818] border border-[#252525] rounded-xl px-3 py-1.5">
      <span className="font-mono text-[#FFD159] font-bold text-xs sm:text-sm tracking-widest">
        {code}
      </span>
      <button
        onClick={handleCopy}
        className="text-[#444] hover:text-[#FFD159] transition-colors ml-1 flex-shrink-0"
        title="Copy code"
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3.5 3.5L12 3" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-[#1a1a1a]">
      <p className="text-xs text-[#444] font-mono">
        Page {page} / {totalPages}
      </p>
      <div className="flex gap-2">
        {[
          { label: "←", disabled: page === 1, to: page - 1 },
          { label: "→", disabled: page === totalPages, to: page + 1 },
        ].map((btn) => (
          <button
            key={btn.label}
            disabled={btn.disabled}
            onClick={() => onPage(btn.to)}
            className="w-8 h-8 rounded-lg bg-[#181818] border border-[#252525] text-[#555] text-sm hover:text-white hover:border-[#333] disabled:opacity-25 disabled:cursor-not-allowed transition-all font-mono"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile Drawer Sidebar ────────────────────────────────────────────────────
function MobileNav({
  open,
  onClose,
  initials,
  fullName,
  username,
  referralCode,
}: {
  open: boolean;
  onClose: () => void;
  initials: string;
  fullName?: string;
  username?: string;
  referralCode?: string;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] border-r border-[#222] flex flex-col shadow-2xl">
        <div className="px-5 py-5 border-b border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFD159] flex items-center justify-center text-black font-bold text-sm">A</div>
            <span className="text-white font-semibold text-sm">AffiliateHub</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#222] flex items-center justify-center text-[#555] hover:text-white transition-colors">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4">
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#FFD159]/15 text-[#FFD159] text-sm font-medium">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            Dashboard
          </button>
        </nav>

        <div className="px-3 py-3 border-t border-[#222]">
          <p className="text-[10px] font-medium text-[#444] uppercase tracking-widest mb-2 px-1">Referral Code</p>
          <div className="px-1">
            <ReferralCode code={referralCode} />
          </div>
        </div>

        <div className="px-3 py-4 border-t border-[#222]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFD159] flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{fullName ?? "—"}</p>
              <p className="text-[#555] text-[11px] font-mono truncate">{username ?? "—"}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function Sidebar({ initials, fullName, username }: { initials: string; fullName?: string; username?: string }) {
  return (
    <aside className="hidden lg:flex w-[220px] flex-shrink-0 bg-[#111111] border-r border-[#222] flex-col">
      <div className="px-5 py-5 border-b border-[#222] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#FFD159] flex items-center justify-center text-black font-bold text-sm">A</div>
        <span className="text-white font-semibold text-sm">AffiliateHub</span>
      </div>

      <nav className="flex-1 px-3 py-4">
        <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#FFD159]/15 text-[#FFD159] text-sm font-medium">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          Dashboard
        </button>
      </nav>

      <div className="px-3 py-4 border-t border-[#222]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-lg bg-[#FFD159] flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            {fullName ? (
              <p className="text-white text-xs font-semibold truncate">{fullName}</p>
            ) : (
              <Skeleton className="h-3 w-20 mb-1" />
            )}
            {username ? (
              <p className="text-[#555] text-[11px] font-mono truncate">{username}</p>
            ) : (
              <Skeleton className="h-3 w-14" />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({
  referralCode,
  initials,
  fullName,
  onMenuOpen,
}: {
  referralCode?: string;
  initials: string;
  fullName?: string;
  onMenuOpen: () => void;
}) {
  return (
    <header className="h-14 flex-shrink-0 bg-[#111111] border-b border-[#222] flex items-center justify-between px-4 sm:px-6 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuOpen}
          className="lg:hidden w-8 h-8 rounded-lg bg-[#181818] border border-[#222] flex items-center justify-center text-[#555] hover:text-white transition-colors flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

        <div className="min-w-0">
          <p className="text-white text-sm font-semibold leading-tight">Dashboard</p>
          <p className="text-[#555] text-[11px] truncate">
            {fullName ? `Welcome back, ${fullName.split(" ")[0]}` : "Loading..."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-2 bg-[#181818] border border-[#1e1e1e] rounded-xl px-3 py-1.5">
          <span className="text-[10px] font-medium text-[#444] uppercase tracking-widest hidden md:block">
            Referral
          </span>
          <ReferralCode code={referralCode} />
        </div>

        <div className="lg:hidden w-8 h-8 rounded-lg bg-[#FFD159] flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
          {initials}
        </div>

        <button className="w-8 h-8 rounded-lg bg-[#181818] border border-[#222] flex items-center justify-center text-[#555] hover:text-white transition-colors">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path
              d="M7.5 1.5A4 4 0 0 0 3.5 5.5v2.25L2 9.5h11l-1.5-1.75V5.5a4 4 0 0 0-4-4zM6 11.5a1.5 1.5 0 0 0 3 0"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InfluencerPage() {
  const [page, setPage] = useState(1);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { data, isLoading: meLoading } = useQuery({
    queryKey: ["me"],
    queryFn: me,
  });

  const { data: summary, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["influencer-transaction", page],
    queryFn: () => influencerTransactionHistory(page),
  });

  const initials = getInitials(data?.fullName);

  // Detect if there's any pending withdrawal in the current page data
  const hasPendingWithdrawal = summary?.data?.some(
    (w: any) => w.status === "pending"
  );

  const availableBalance = data?.amount ?? 0;
  const totalWithdrawn = summary?.summary?.totalWithdrawn ?? 0;
  const totalRecords = summary?.pagination?.total ?? 0;
  const totalPages = summary?.pagination?.totalPages ?? 1;
  const currentPage = summary?.pagination?.page ?? page;

  const withdrawnPct =
    availableBalance + totalWithdrawn > 0
      ? Math.min(
          100,
          Math.round((totalWithdrawn / (availableBalance + totalWithdrawn)) * 100)
        )
      : 0;

  const avgAmount =
    totalRecords > 0 ? Math.round(totalWithdrawn / totalRecords) : 0;

  return (
    <div className="flex h-screen bg-[#0b0b0b] text-white overflow-hidden">
      {/* dot grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,209,89,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <Sidebar initials={initials} fullName={data?.fullName} username={data?.username} />

      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        initials={initials}
        fullName={data?.fullName}
        username={data?.username}
        referralCode={data?.referralCode}
      />

      <div className="relative z-10 flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          referralCode={data?.referralCode}
          initials={initials}
          fullName={data?.fullName}
          onMenuOpen={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">

          {/* Referral strip — mobile only */}
          <div className="sm:hidden flex items-center gap-2 bg-[#111] border border-[#1e1e1e] rounded-xl px-3.5 py-2.5">
            <span className="text-[10px] font-medium text-[#444] uppercase tracking-widest">
              Referral Code
            </span>
            <ReferralCode code={data?.referralCode} />
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 space-y-1 col-span-2 lg:col-span-1">
              <p className="text-[11px] font-medium text-[#444] uppercase tracking-widest">Total Referrals</p>
              {meLoading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <p className="text-3xl font-bold text-white tabular-nums">
                  {(data?.buyers ?? 0).toLocaleString()}
                </p>
              )}
              <p className="text-[11px] text-[#444]">people used your code</p>
            </div>

            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 space-y-1">
              <p className="text-[11px] font-medium text-[#444] uppercase tracking-widest">Available Balance</p>
              {meLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-white font-mono tabular-nums break-all">
                  {formatAmount(availableBalance)}
                </p>
              )}
            </div>

            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 space-y-1">
              <p className="text-[11px] font-medium text-[#444] uppercase tracking-widest">Withdrawn</p>
              {isHistoryLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-white font-mono tabular-nums break-all">
                  {formatAmount(totalWithdrawn)}
                </p>
              )}
            </div>
          </div>

          {/* ── Bank + Payout Progress ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bank Account */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#444] uppercase tracking-widest">Bank Account</p>
                  {meLoading ? (
                    <>
                      <Skeleton className="h-4 w-36 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </>
                  ) : data?.bankAccount ? (
                    <>
                      <p className="text-white font-medium text-sm truncate">
                        {data.bankAccount.accountName}
                      </p>
                      <p className="text-[#444] text-xs font-mono">
                        {data.bankAccount.bankName} · {data.bankAccount.accountNumber}
                      </p>
                    </>
                  ) : (
                    <p className="text-[#444] text-sm">No account added yet</p>
                  )}
                </div>
                {data?.bankAccount?.verified && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowBankModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#FFD159]/30 text-[#FFD159] text-sm font-medium hover:bg-[#FFD159]/8 active:scale-[0.98] transition-all"
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M1 10.5L10.5 1 13 3.5 3.5 13H1v-2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                  {data?.bankAccount ? "Update" : "Add Account"}
                </button>

                {/* Withdraw button — disabled if pending withdrawal exists or no balance/bank */}
                <div className="relative group">
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={!data?.bankAccount || availableBalance <= 0 || hasPendingWithdrawal}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFD159] text-black text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1v8M4 6l3 3 3-3M1 11h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Withdraw
                  </button>
                  {hasPendingWithdrawal && (
                    <div className="absolute bottom-full left-0 mb-2 w-max max-w-[200px] bg-[#1a1a1a] border border-[#333] text-[#aaa] text-xs px-3 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                      A withdrawal is already pending. Please wait for it to complete.
                    </div>
                  )}
                </div>
              </div>

              {/* Pending withdrawal notice */}
              {hasPendingWithdrawal && (
                <div className="flex items-center gap-2 bg-amber-500/8 border border-amber-500/20 rounded-xl px-3.5 py-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                  <p className="text-amber-400 text-xs">
                    You have a pending withdrawal. New requests are blocked until it's processed.
                  </p>
                </div>
              )}
            </div>

            {/* Payout Progress */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 space-y-4">
              <p className="text-[11px] font-medium text-[#444] uppercase tracking-widest">Payout Progress</p>
              {isHistoryLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#555]">Withdrawn</span>
                    <span className="text-white font-mono">{formatAmount(totalWithdrawn)}</span>
                  </div>
                  <div className="h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#FFD159] transition-all duration-500"
                      style={{ width: `${withdrawnPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs gap-2">
                    <span className="text-[#444]">{withdrawnPct}% of total earned</span>
                    <span className="text-[#FFD159] font-mono flex-shrink-0">
                      {formatAmount(availableBalance)} left
                    </span>
                  </div>
                </div>
              )}
              <div className="pt-3 border-t border-[#1a1a1a] flex gap-6 flex-wrap">
                <div>
                  <p className="text-[10px] text-[#444] uppercase tracking-widest">Withdrawals</p>
                  {isHistoryLoading ? (
                    <Skeleton className="h-4 w-12 mt-1" />
                  ) : (
                    <p className="text-sm text-white font-mono mt-1">{totalRecords} total</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-[#444] uppercase tracking-widest">Avg. amount</p>
                  {isHistoryLoading ? (
                    <Skeleton className="h-4 w-20 mt-1" />
                  ) : (
                    <p className="text-sm text-white font-mono mt-1">{formatAmount(avgAmount)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Withdrawal History ── */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Withdrawal History</h2>
              <span className="text-[11px] font-mono text-[#444]">
                {isHistoryLoading ? "—" : `${totalRecords} records`}
              </span>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a1a1a]">
                    {["Date", "Amount", "Bank", "Account No.", "Status"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-[11px] font-medium text-[#444] uppercase tracking-widest whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isHistoryLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="border-b border-[#151515]">
                          <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                        </tr>
                      ))
                    : summary?.data?.map((w: any, i: number) => (
                        <tr
                          key={w?._id}
                          className="border-b border-[#151515] last:border-0 hover:bg-[#141414] transition-colors"
                          style={{ animationDelay: `${i * 40}ms` }}
                        >
                          <td className="px-6 py-4 text-[#666] text-sm whitespace-nowrap">
                            {formatDate(w?.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-white font-mono font-medium text-sm whitespace-nowrap">
                            {formatAmount(w?.amount)}
                          </td>
                          <td className="px-6 py-4 text-[#555] text-sm whitespace-nowrap">
                            {w?.bankName}
                          </td>
                          <td className="px-6 py-4 text-[#555] text-sm font-mono whitespace-nowrap">
                            {w?.accountNumber}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={w?.status} />
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-[#151515]">
              {isHistoryLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="px-4 py-3.5 flex items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))
                : summary?.data?.map((w: any) => (
                    <div key={w?._id} className="px-4 py-3.5 flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-white font-mono font-medium text-sm">
                          {formatAmount(w.amount)}
                        </p>
                        <p className="text-[#555] text-xs truncate">{w?.bankName}</p>
                        <p className="text-[#444] text-xs">{formatDate(w?.createdAt)}</p>
                      </div>
                      <StatusBadge status={w?.status} />
                    </div>
                  ))}
            </div>

            {!isHistoryLoading && (!summary?.data || summary.data.length === 0) && (
              <div className="py-16 text-center space-y-2">
                <p className="text-[#333] text-sm">No withdrawals yet</p>
                <p className="text-[#2a2a2a] text-xs">Your withdrawal history will appear here</p>
              </div>
            )}

            <Pagination page={currentPage} totalPages={totalPages} onPage={setPage} />
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      {showBankModal && (
        <BankAccountModal
          existing={data?.bankAccount ?? null}
          onClose={() => setShowBankModal(false)}
        />
      )}
      {showWithdrawModal && (
        <WithdrawalModal
          availableBalance={availableBalance}
          bankAccount={data?.bankAccount ?? null}
          onClose={() => setShowWithdrawModal(false)}
        />
      )}
    </div>
  );
}