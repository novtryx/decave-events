"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { spaceToUnderscore } from "@/lib/generalFunction";
import { MdShare, MdCheck, MdBarChart, MdPeople, MdHowToVote, MdClose, MdWarning } from "react-icons/md";
import { getUserVoting, deleteVote } from "@/app/actions/voting"; // adjust import path as needed

// ─── Types ───────────────────────────────────────────────────────────────────

type Competition = {
  id: number;
  title: string;
  description: string;
  edition: string;
  voteStart: string;
  voteEnd: string;
  pricing: "free" | "paid";
  pricePerVote: number;
  showLiveCount: boolean;
  publicLeaderboard: boolean;
  approved: boolean;
  totalVotes: number;
  totalRevenue: number;
  contestantsCount: number;
  visitsCount: number;
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

interface DeleteModalProps {
  comp: Competition;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteModal = ({ comp, onConfirm, onCancel, isDeleting }: DeleteModalProps) => {
  const status = getStatus(comp.voteStart, comp.voteEnd);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-sm shadow-2xl shadow-black/60 overflow-hidden">
        {/* Red top strip */}
        <div className="h-1 w-full bg-gradient-to-r from-red-600 to-red-400" />

        <div className="p-6 flex flex-col gap-5">
          {/* Icon + heading */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <MdWarning size={20} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">
                Delete Competition
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Competition preview */}
          <div className="bg-[#1a1a1a] border border-[#252525] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#252525] flex items-center justify-center flex-shrink-0">
              <MdHowToVote size={20} className="text-[#FFD159]" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{comp.title}</p>
              <p className="text-gray-500 text-xs truncate">
                {comp.edition} ·{" "}
                <span
                  className={
                    status === "live"
                      ? "text-green-400"
                      : status === "upcoming"
                      ? "text-indigo-400"
                      : "text-gray-500"
                  }
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </p>
            </div>
          </div>

          <p className="text-gray-400 text-sm">
            Are you sure you want to delete{" "}
            <span className="text-white font-medium">"{comp.title}"</span>? All
            votes, contestant data, and results will be permanently removed.
          </p>

          {/* Warning if live */}
          {status === "live" && (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
              <span className="text-yellow-400 text-xs font-medium">
                ⚠ This competition is currently live with {(comp.totalVotes ?? 0).toLocaleString()} votes.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-gray-300 text-sm font-medium 
              hover:bg-[#1f1f1f] hover:text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium 
              transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete Competition"
              )}
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition disabled:opacity-50"
        >
          <MdClose size={18} />
        </button>
      </div>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatus(voteStart: string, voteEnd: string): "upcoming" | "live" | "ended" {
  const now = Date.now();
  const start = new Date(voteStart).getTime();
  const end = new Date(voteEnd).getTime();
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "live";
  return "ended";
}

// ─── Component ────────────────────────────────────────────────────────────────

const Competitions = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pricingFilter, setPricingFilter] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Delete modal state
  const [compToDelete, setCompToDelete] = useState<Competition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["organizer-competitions"],
    queryFn: getUserVoting,
  });

  console.log("data==", data)
  if (isLoading) return <p className="text-white p-6">Loading...</p>;
  if (error) return <p className="text-red-400 p-6">Something went wrong</p>;

  const filteredCompetitions = (data ?? [])?.filter((comp: Competition) => {
    const matchQ =
      comp.title.toLowerCase().includes(search.toLowerCase()) ||
      comp.edition?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || getStatus(comp.voteStart, comp.voteEnd) === statusFilter;
    const matchPricing = !pricingFilter || comp.pricing === pricingFilter;
    return matchQ && matchStatus && matchPricing;
  });

  const handleShare = async (comp: Competition) => {
    const slug = spaceToUnderscore(comp.title);
    const url = `${window.location.origin}/contest/${slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: comp.title,
          text: `Vote for your favourite contestant in ${comp.title}`,
          url,
        });
      } catch {
        // user cancelled — do nothing
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(comp.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // silent fail
    }
  };

  const handleDeleteConfirm = async () => {
    if (!compToDelete) return;
    setIsDeleting(true);
    try {
      await deleteVote(String(compToDelete.id));
      await queryClient.invalidateQueries({ queryKey: ["organizer-competitions"] });
      setCompToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* DELETE CONFIRMATION MODAL */}
      {compToDelete && (
        <DeleteModal
          comp={compToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !isDeleting && setCompToDelete(null)}
          isDeleting={isDeleting}
        />
      )}

      <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">Your Competitions</h1>
          <Link
            href="/dashboard/voting/create-vote"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD159] hover:opacity-90 text-black rounded-xl text-sm font-medium transition"
          >
            + Create Competition
          </Link>
        </div>

        {/* SEARCH / FILTER */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search competitions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-[#121212] border border-[#1f1f1f] text-white rounded-xl px-4 py-2
            placeholder:text-gray-500 focus:ring-1 focus:ring-[#FFD159] outline-none transition"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#121212] border border-[#1f1f1f] text-white rounded-xl px-3 py-2
            focus:ring-1 focus:ring-[#FFD159] outline-none transition"
          >
            <option value="">All Status</option>
            <option value="live">Live</option>
            <option value="upcoming">Upcoming</option>
            <option value="ended">Ended</option>
          </select>
          <select
            value={pricingFilter}
            onChange={(e) => setPricingFilter(e.target.value)}
            className="bg-[#121212] border border-[#1f1f1f] text-white rounded-xl px-3 py-2
            focus:ring-1 focus:ring-[#FFD159] outline-none transition"
          >
            <option value="">All Pricing</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {/* COMPETITIONS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompetitions.map((comp: Competition) => {
            const status = getStatus(comp.voteStart, comp.voteEnd);
            const isCopied = copiedId === comp.id;
            const totalVotes = comp.totalVotes ?? 0;

            return (
              <div
                key={comp.id}
                className="relative bg-[#121212] rounded-2xl border border-[#1f1f1f] hover:border-[#2a2a2a] transition flex flex-col overflow-hidden"
              >
                {/* STATUS + APPROVAL BADGES */}
                <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
                  {status === "live" && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-black text-green-400 border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                      Live
                    </span>
                  )}
                  {status === "upcoming" && (
                    <span className="text-xs px-2 py-1 rounded-full bg-black text-indigo-400 border border-indigo-500/20">
                      Upcoming
                    </span>
                  )}
                  {status === "ended" && (
                    <span className="text-xs px-2 py-1 rounded-full bg-black text-gray-500 border border-gray-700/30">
                      Ended
                    </span>
                  )}
                  {comp.approved ? (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-black text-green-400 border border-green-500/20">
                      <MdCheck size={11} />
                      Approved
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-black text-yellow-400 border border-yellow-500/20">
                      Pending
                    </span>
                  )}
                </div>

                {/* TOP COLOR STRIP */}
                <div
                  className={`h-1 w-full ${
                    status === "live"
                      ? "bg-green-500"
                      : status === "upcoming"
                      ? "bg-indigo-500"
                      : "bg-[#2a2a2a]"
                  }`}
                />

                {/* BODY */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-2 pr-20">
                    <div>
                      <h2 className="font-semibold text-white text-base leading-tight">
                        {comp.title}
                      </h2>
                      {comp.edition && (
                        <p className="text-gray-500 text-xs mt-0.5">{comp.edition}</p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                        comp.pricing === "paid"
                          ? "bg-[#FFD159] text-black"
                          : "bg-[#1f1f1f] text-gray-400"
                      }`}
                    >
                      {comp.pricing === "paid" ? `₦${comp.pricePerVote}/vote` : "Free"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                      🗓 Opens: {formatDate(comp.voteStart)} · {formatTime(comp.voteStart)}
                    </p>
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                      🏁 Closes: {formatDate(comp.voteEnd)} · {formatTime(comp.voteEnd)}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-lg flex items-center gap-1">
                      <MdHowToVote size={13} />
                      <span className="font-semibold text-white">{totalVotes.toLocaleString()}</span> votes
                    </span>
                    <span className="text-xs bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-lg flex items-center gap-1">
                      <MdPeople size={13} />
                      <span className="font-semibold text-white">{comp.contestantsCount ?? 0}</span> contestants
                    </span>
                    <span className="text-xs bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-lg flex items-center gap-1">
                      👁 <span className="font-semibold text-white">{comp.visitsCount ?? 0}</span> views
                    </span>
                    {comp.pricing === "paid" && (
                      <span className="text-xs bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-lg flex items-center gap-1">
                        💰 <span className="font-semibold text-white">₦{(comp.totalRevenue ?? 0).toLocaleString()}</span>
                      </span>
                    )}
                  </div>

                  {totalVotes === 0 ? (
                    <div className="flex items-center justify-center bg-[#1a1a1a] rounded-xl px-3 py-2">
                      <span className="text-gray-600 text-xs">No votes yet</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center bg-[#1a1a1a] rounded-xl px-3 py-2">
                      <span className="text-gray-400 text-xs">
                        <span className="text-white font-semibold">{totalVotes.toLocaleString()}</span> total votes cast
                      </span>
                    </div>
                  )}
                </div>

                {/* FOOTER ACTIONS */}
                <div className="flex items-center border-t border-[#1f1f1f]">
                  <Link
                    href={`/dashboard/voting/result/${comp.id}`}
                    className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium text-[#FFD159] hover:bg-[#1a1a1a] transition"
                  >
                    <MdBarChart size={14} /> Results
                  </Link>
                  <div className="w-px h-5 bg-[#1f1f1f]" />
                  <Link
                    href={`/dashboard/voting/edit/${comp.id}`}
                    className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium text-gray-400 hover:text-[#FFD159] hover:bg-[#1a1a1a] transition"
                  >
                    Edit
                  </Link>
                  <div className="w-px h-5 bg-[#1f1f1f]" />
                  <button
                    onClick={() => handleShare(comp)}
                    className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium text-gray-400 hover:text-[#FFD159] hover:bg-[#1a1a1a] transition"
                  >
                    {isCopied ? (
                      <>
                        <MdCheck size={14} className="text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <MdShare size={14} />
                        Share
                      </>
                    )}
                  </button>
                  <div className="w-px h-5 bg-[#1f1f1f]" />
                  <button
                    onClick={() => setCompToDelete(comp)}
                    className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium text-red-400 hover:bg-[#1a1a1a] transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCompetitions.length === 0 && (
          <p className="text-gray-500 text-center py-10">No competitions found.</p>
        )}
      </div>
    </>
  );
};

export default Competitions;