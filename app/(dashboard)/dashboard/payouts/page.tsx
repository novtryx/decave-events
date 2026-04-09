"use client";

import React from "react";
import { MdAdd, MdRequestPage } from "react-icons/md";

type Transaction = {
  id: number;
  date: string;
  event: string;
  amount: number;
  status: "Completed" | "Pending" | "Failed";
};

// Dummy transactions
const transactions: Transaction[] = [
  { id: 1, date: "2026-03-01", event: "Summer Gala 2026", amount: 5000, status: "Completed" },
  { id: 2, date: "2026-03-15", event: "Tech Conference 2026", amount: 12000, status: "Pending" },
  { id: 3, date: "2026-04-01", event: "Music Fest 2026", amount: 8000, status: "Completed" },
];

const PayoutsPage = () => {
  const totalEarned = transactions.reduce((acc, t) => acc + t.amount, 0);
  const availableToWithdraw = transactions
    .filter((t) => t.status === "Completed")
    .reduce((acc, t) => acc + t.amount, 0);

  const accountNumber = "1234567890";

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "Completed":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#FFD159]/10 text-[#FFD159]">
            {status}
          </span>
        );
      case "Pending":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
            {status}
          </span>
        );
      case "Failed":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-white">Payouts Dashboard</h1>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121212] p-4 rounded-2xl border border-[#1f1f1f] flex flex-col">
          <span className="text-sm text-gray-400">Total Earned</span>
          <span className="text-2xl font-bold text-[#FFD159]">
            ${totalEarned.toLocaleString()}
          </span>
        </div>

        <div className="bg-[#121212] p-4 rounded-2xl border border-[#1f1f1f] flex flex-col">
          <span className="text-sm text-gray-400">Available to Withdraw</span>
          <span className="text-2xl font-bold text-[#FFD159]">
            ${availableToWithdraw.toLocaleString()}
          </span>
        </div>

        <div className="bg-[#121212] p-4 rounded-2xl border border-[#1f1f1f] flex flex-col gap-2">
          <span className="text-sm text-gray-400">Bank Account</span>
          <span className="text-white font-medium">
            {accountNumber || "Not Added"}
          </span>

          <div className="flex gap-2 mt-2 flex-wrap">
            <button className="flex items-center gap-1 px-3 py-2 bg-[#FFD159] text-black rounded-xl text-sm font-medium hover:opacity-90 transition">
              <MdAdd /> Add Account
            </button>

            <button className="flex items-center gap-1 px-3 py-2 bg-[#FFD159]/10 text-[#FFD159] rounded-xl text-sm font-medium hover:bg-[#FFD159]/20 transition">
              <MdRequestPage /> Request Withdrawal
            </button>
          </div>
        </div>
      </div>

      {/* ── Transaction History ── */}
      <div className="bg-[#121212] rounded-2xl border border-[#1f1f1f] overflow-x-auto">
        <table className="min-w-full divide-y divide-[#1f1f1f]">
          <thead className="bg-[#1a1a1a]">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                Event
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#1f1f1f]">
            {transactions.map((txn) => (
              <tr key={txn.id} className="hover:bg-[#1a1a1a] transition">
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {txn.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-white">
                  {txn.event}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  ${txn.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(txn.status)}
                </td>
              </tr>
            ))}

            {transactions.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-500">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayoutsPage;
