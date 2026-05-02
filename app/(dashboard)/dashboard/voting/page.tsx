"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
// import { getOrganizerCompetitions } from "@/app/actions/competitions";
import { spaceToUnderscore } from "@/lib/generalFunction";
import { MdShare, MdCheck, MdBarChart, MdPeople, MdHowToVote } from "react-icons/md";
import { getUserVoting } from "@/app/actions/voting";

// ─── Types ───────────────────────────────────────────────────────────────────

type Contestant = {
  id: number;
  name: string;
  tagline: string;
  category: string;
  photoUrl: string | null;
  voteCount: number;
};

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
  contestants: Contestant[];
  visitsCount: number;
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

function getLeader(contestants: Contestant[]): Contestant | null {
  if (!contestants.length) return null;
  return [...contestants].sort((a, b) => b.voteCount - a.voteCount)[0];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const avatarColors = [
  "#FFD159", "#4ade80", "#60a5fa", "#f472b6",
  "#fb923c", "#a78bfa", "#34d399", "#f87171",
];

// ─── Component ────────────────────────────────────────────────────────────────

const Competitions = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pricingFilter, setPricingFilter] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["organizer-competitions"],
    queryFn: getUserVoting,
  });

  

  if (isLoading) return <p className="text-white p-6">Loading...</p>;
  if (error) return <p className="text-red-400 p-6">Something went wrong</p>;

  const filteredCompetitions = ( data ?? [])?.filter((comp: Competition) => {
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
      // clipboard failed — silent fail
    }
  };

  return (
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
          const leader = getLeader(comp.contestants);
          const isCopied = copiedId === comp.id;
          const totalVotes = comp.totalVotes ?? 0;

          return (
            <div
              key={comp.id}
              className="relative bg-[#121212] rounded-2xl border border-[#1f1f1f] hover:border-[#2a2a2a] transition flex flex-col overflow-hidden"
            >

              {/* STATUS + APPROVAL BADGES */}
              <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
                {/* Status badge */}
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

                {/* Approval badge */}
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

              {/* TOP COLOR STRIP based on status */}
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

                {/* TITLE + PRICING TAG */}
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

                {/* SCHEDULE */}
                <div className="flex flex-col gap-1">
                  <p className="text-gray-400 text-xs flex items-center gap-1">
                    🗓 Opens: {formatDate(comp.voteStart)} · {formatTime(comp.voteStart)}
                  </p>
                  <p className="text-gray-400 text-xs flex items-center gap-1">
                    🏁 Closes: {formatDate(comp.voteEnd)} · {formatTime(comp.voteEnd)}
                  </p>
                </div>

                {/* STATS */}
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-lg flex items-center gap-1">
                    <MdHowToVote size={13} />
                    <span className="font-semibold text-white">{totalVotes.toLocaleString()}</span> votes
                  </span>
                  <span className="text-xs bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-lg flex items-center gap-1">
                    <MdPeople size={13} />
                    <span className="font-semibold text-white">{comp.contestants?.length ?? 0}</span> contestants
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

                {/* CURRENT LEADER */}
                {leader && totalVotes > 0 && (
                  <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-xl px-3 py-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">Leading:</span>
                    {leader.photoUrl ? (
                      <img
                        src={leader.photoUrl}
                        alt={leader.name}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-black text-xs font-bold flex-shrink-0"
                        style={{ background: avatarColors[leader.id % avatarColors.length] }}
                      >
                        {initials(leader.name)}
                      </div>
                    )}
                    <span className="text-white text-xs font-medium truncate">{leader.name}</span>
                    <span className="text-[#FFD159] text-xs font-semibold ml-auto whitespace-nowrap">
                      {totalVotes > 0
                        ? Math.round((leader.voteCount / totalVotes) * 100)
                        : 0}%
                    </span>
                  </div>
                )}

                {/* NO VOTES YET */}
                {totalVotes === 0 && (
                  <div className="flex items-center justify-center bg-[#1a1a1a] rounded-xl px-3 py-2">
                    <span className="text-gray-600 text-xs">No votes yet</span>
                  </div>
                )}
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex items-center border-t border-[#1f1f1f]">
                <Link
                  href={`/dashboard/voting/result/${(comp.id)}`}
                  className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium text-[#FFD159] hover:bg-[#1a1a1a] transition"
                >
                  <MdBarChart size={14} /> Results
                </Link>
                <div className="w-px h-5 bg-[#1f1f1f]" />
                <Link
                  href={`/dashboard/voting/edit/${(comp.id)}`}
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
              </div>
            </div>
          );
        })}
      </div>

      {filteredCompetitions.length === 0 && (
        <p className="text-gray-500 text-center py-10">No competitions found.</p>
      )}
    </div>
  );
};

export default Competitions;