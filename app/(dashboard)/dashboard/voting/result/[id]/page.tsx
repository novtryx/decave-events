"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { MdHowToVote, MdPeople, MdEmojiEvents } from "react-icons/md";
import { useParams } from "next/navigation";
import { getUserVotingById } from "@/app/actions/voting";

// TYPES
type Contestant = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  photoUrl: string | null;
  totalVote: number;
};

type Competition = {
  id: string;
  title: string;
  description: string;
  edition: string;
  voteStart: string;
  voteEnd: string;
  pricing: "free" | "paid";
  pricePerVote: number;
  showLiveCount: boolean;
  publicLeaderboard: boolean;
  oneVotePerDevice: boolean;
  banner: string | null;
  contestants: Contestant[];
  organizerPays: boolean;
  user: {
    id: number;
    name: string;
    email: string;
    businessName: string;
  };
  userId: number;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
};

// HELPERS
const getTotalVotes = (contestants: Contestant[]) =>
  contestants.reduce((sum, c) => sum + Number(c.totalVote), 0);

const getLeaderboard = (contestants: Contestant[]) => {
  const total = getTotalVotes(contestants);
  return contestants
    .map((c) => ({
      ...c,
      totalVote: Number(c.totalVote), // ← normalize here too
      percentage:
        total > 0 ? Math.round((Number(c.totalVote) / total) * 100) : 0,
    }))
    .sort((a, b) => b.totalVote - a.totalVote)
    .map((c, i) => ({ ...c, position: i + 1 }));
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const isLive = (start: string, end: string) => {
  const now = Date.now();
  return now >= new Date(start).getTime() && now <= new Date(end).getTime();
};

// MEDAL COLORS
const medalStyle = (position: number) => {
  if (position === 1) return { bg: "bg-[#FFD159]", text: "text-black", label: "🥇" };
  if (position === 2) return { bg: "bg-[#C0C0C0]/20", text: "text-white", label: "🥈" };
  if (position === 3) return { bg: "bg-[#CD7F32]/20", text: "text-white", label: "🥉" };
  return { bg: "bg-[#121212]", text: "text-white", label: `#${position}` };
};

// MAIN COMPONENT
const ResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery<Competition>({
    queryKey: ["organizer-competitions", id],
    queryFn: () => getUserVotingById(id),
  });
  console.log("data==", data);

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  
  const totalVotes = getTotalVotes(data.contestants);
  const totalRevenue = totalVotes * data.pricePerVote;
  const leaderboard = getLeaderboard(data.contestants);
  const top3 = leaderboard.slice(0, 3);
  const live = isLive(data.voteStart, data.voteEnd);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 flex flex-col gap-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">{data.title}</h1>
            {live && (
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-semibold tracking-wider uppercase animate-pulse">
                Live
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">{data.edition}</p>
          {data.description && (
            <p className="text-gray-400 text-sm mt-1 max-w-md">{data.description}</p>
          )}
        </div>
        <div className="text-right text-xs text-gray-500 shrink-0">
          <p>
            <span className="text-gray-400">Voting:</span> {formatDate(data.voteStart)} → {formatDate(data.voteEnd)}
          </p>
          <p className="mt-0.5">
            <span className="text-gray-400">Organizer:</span> {data.user.businessName}
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total Votes" value={totalVotes} icon={<MdHowToVote className="text-lg" />} />
        <Stat label="Contestants" value={data.contestants.length} icon={<MdPeople className="text-lg" />} />
        <Stat
          label="Vote Closes"
          value={formatDate(data.voteEnd)}
          icon={"⏳"}
          small
        />
        {data.pricing === "paid" && !data.organizerPays && (
          <Stat
            label="Est. Revenue"
            value={`₦${totalRevenue.toLocaleString()}`}
            icon={"💰"}
          />
        )}
        {data.pricing === "paid" && data.organizerPays && (
          <Stat label="Price/Vote" value={`₦${data.pricePerVote.toLocaleString()}`} icon={"💳"} />
        )}
      </div>

      {/* TOP 3 PODIUM */}
      {top3.length > 0 && (
        <div>
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <MdEmojiEvents className="text-[#FFD159]" /> Top Contestants
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {top3.map((c) => {
              const medal = medalStyle(c.position);
              return (
                <div
                  key={c.id}
                  className={`rounded-2xl p-4 text-center border transition-transform hover:scale-[1.02] ${
                    c.position === 1
                      ? "bg-[#FFD159] text-black border-yellow-300 shadow-[0_0_24px_rgba(255,209,89,0.15)]"
                      : "bg-[#121212] border-[#1f1f1f] text-white"
                  }`}
                >
                  <span className="text-lg">{medal.label}</span>
                  <div className="w-14 h-14 mx-auto mt-2 rounded-full overflow-hidden bg-gray-700 border-2 border-white/10 flex items-center justify-center text-lg font-bold">
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      c.name[0]
                    )}
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-tight">{c.name}</p>
                  <p className={`text-xs mt-0.5 ${c.position === 1 ? "opacity-70" : "text-gray-500"}`}>
                    {c.tagline}
                  </p>
                  <p className={`mt-2 text-xs font-bold ${c.position === 1 ? "" : "text-[#FFD159]"}`}>
                    {c.totalVote.toLocaleString()} votes · {c.percentage}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FULL LEADERBOARD */}
      <div>
        <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Full Rankings</h2>
        <div className="bg-[#121212] rounded-2xl border border-[#1f1f1f] overflow-hidden">
          {leaderboard.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 p-4 border-b border-[#1f1f1f] last:border-none hover:bg-white/[0.02] transition-colors"
            >
              {/* POSITION */}
              <div className="w-7 text-center">
                {c.position <= 3 ? (
                  <span className="text-base">{medalStyle(c.position).label}</span>
                ) : (
                  <span className="text-sm text-gray-600">#{c.position}</span>
                )}
              </div>

              {/* AVATAR */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-sm font-bold shrink-0 border border-white/5">
                {c.photoUrl ? (
                  <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  c.name[0]
                )}
              </div>

              {/* INFO */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-sm font-medium truncate">{c.name}</p>
                  {c.category && (
                    <span className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded-full border border-white/10 truncate max-w-[100px]">
                      {c.category}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs truncate">{c.tagline}</p>
                <div className="mt-2 h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FFD159] rounded-full transition-all duration-700"
                    style={{ width: `${c.percentage}%` }}
                  />
                </div>
              </div>

              {/* VOTES */}
              <div className="text-right shrink-0">
                <p className="text-white text-sm font-semibold">{c.totalVote.toLocaleString()}</p>
                <p className="text-xs text-[#FFD159]">{c.percentage}%</p>
              </div>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <div className="p-8 text-center text-gray-600 text-sm">
              No contestants yet.
            </div>
          )}
        </div>
      </div>

      {/* BADGES */}
      <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
        {data.oneVotePerDevice && (
          <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            🔒 One vote per device
          </span>
        )}
        {data.showLiveCount && (
          <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            📊 Live count enabled
          </span>
        )}
        {!data.publicLeaderboard && (
          <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            🔐 Private leaderboard
          </span>
        )}
        {data.approved && (
          <span className="bg-green-500/10 border border-green-500/20 text-green-500 px-2.5 py-1 rounded-full">
            ✓ Approved
          </span>
        )}
      </div>
    </div>
  );
};

// STAT COMPONENT
const Stat = ({ label, value, icon, small }: { label: string; value: any; icon: any; small?: boolean }) => (
  <div className="bg-[#121212] border border-[#1f1f1f] rounded-xl p-3 flex items-center gap-2">
    <div className="text-[#FFD159] shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 truncate">{label}</p>
      <p className={`text-white font-semibold truncate ${small ? "text-xs" : "text-sm"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  </div>
);

// LOADING STATE
const LoadingState = () => (
  <div className="max-w-5xl mx-auto p-6 flex flex-col gap-4 animate-pulse">
    <div className="h-7 bg-white/5 rounded-lg w-48" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-xl h-16" />
      ))}
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-2xl h-36" />
      ))}
    </div>
    <div className="bg-white/5 rounded-2xl h-48" />
  </div>
);

// ERROR STATE
const ErrorState = () => (
  <div className="max-w-5xl mx-auto p-6 text-center text-gray-500 text-sm">
    Failed to load competition data.
  </div>
);

export default ResultsPage;