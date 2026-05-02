"use client";

import { getVotingByTitle } from "@/app/actions/voting";
import { underscoreToSpace } from "@/lib/generalFunction";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import CryptoJS from "crypto-js";

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
  user: { id: number; name: string; email: string; businessName: string };
  approved: boolean;
};

const VotingPage = () => {
  const { title } = useParams<{ title: string }>();
  const router = useRouter();

  const { data, isLoading, error } = useQuery<Competition>({
    queryKey: ["voting-competitions", title],
    queryFn: () => getVotingByTitle(underscoreToSpace(title)),
  });

  useEffect(() => {
    if (!data?.id) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/vote/${data.id}/visit`, {
      method: "POST",
    }).catch(() => {});
  }, [data?.id]);

  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [voteQty, setVoteQty] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [inputVal, setInputVal] = useState("1");
  const panelRef = useRef<HTMLDivElement>(null);

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#FFD159]/30 border-t-[#FFD159] rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Loading competition...</p>
        </div>
      </div>
    );

  if (error || !data)
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-red-400/70 text-sm">Competition not found</p>
      </div>
    );

  const now = Date.now();
  const isLive =
    now >= new Date(data.voteStart).getTime() &&
    now <= new Date(data.voteEnd).getTime();
  const isEnded = now > new Date(data.voteEnd).getTime();
  const notStarted = now < new Date(data.voteStart).getTime();

  const contestants = Array.isArray(data.contestants) ? data.contestants : [];

  
const totalVotes = contestants.reduce((s, c) => s + (c.totalVote || 0), 0);

  const rankedContestants = [...data.contestants]
    .sort((a, b) => b.totalVote - a.totalVote)
    .map((c, i) => ({
      ...c,
      position: i + 1,
      percentage: totalVotes > 0 ? Math.round((c.totalVote / totalVotes) * 100) : 0,
    }));

  const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

  const timeRemaining = () => {
    const end = new Date(data.voteEnd).getTime();
    const diff = end - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  };

  const openPanel = (c: Contestant) => {
    setSelectedContestant(c);
    setVoteQty(1);
    setInputVal("1");
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedContestant(null), 300);
  };

  const handleQtyInput = (val: string) => {
    setInputVal(val);
    const n = parseInt(val);
    if (!isNaN(n) && n >= 1) setVoteQty(n);
  };

  const changeQty = (delta: number) => {
    const next = Math.max(1, voteQty + delta);
    setVoteQty(next);
    setInputVal(String(next));
  };

  const handleVote = () => {
    if (!selectedContestant || !data) return;
    const total = data.pricing === "paid" ? voteQty * data.pricePerVote : 0;
    const payload = {
      competitionId: data.id,
      contestantId: selectedContestant.id,
      contestantName: selectedContestant.name,
      qty: voteQty,
      total,
      orgPays: data.organizerPays,
      pricing: data.pricing,
    };
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(payload),
      "devave-query-secret"
    ).toString();
    router.push(`/contest/checkout?data=${encodeURIComponent(encrypted)}`);
  };

  const voteTotal = data.pricing === "paid" ? voteQty * data.pricePerVote : 0;

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* ── VOTE PANEL ── */}
      <div className={`fixed inset-0 z-50 ${panelOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300 ${
            panelOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={closePanel}
        />

        {/* Sheet */}
        <div
          ref={panelRef}
          className={`absolute bottom-0 left-0 right-0 max-w-lg mx-auto bg-[#0f0f0f] border border-[#1c1c1c] rounded-t-3xl transition-transform duration-300 ease-out ${
            panelOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          {selectedContestant && (
            <div className="p-6 pb-8">
              {/* Handle */}
              <div className="w-9 h-[3px] bg-[#2a2a2a] rounded-full mx-auto mb-5" />

              {/* Contestant hero */}
              <div className="relative rounded-2xl overflow-hidden mb-5 h-48">
                {selectedContestant.photoUrl ? (
                  <img
                    src={selectedContestant.photoUrl}
                    alt={selectedContestant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                    <span className="text-5xl font-black text-[#FFD159]/20">
                      {selectedContestant.name[0]}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="font-black text-lg leading-none">{selectedContestant.name}</p>
                  <p className="text-gray-400 text-xs mt-1">{selectedContestant.tagline}</p>
                </div>
                {/* Category pill */}
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] bg-black/60 backdrop-blur-sm border border-white/10 text-gray-300 px-2.5 py-1 rounded-full">
                    {selectedContestant.category}
                  </span>
                </div>
              </div>

              {/* Live vote count — only if showLiveCount */}
              {data.showLiveCount && (
                <div className="flex items-center justify-between bg-[#161616] border border-[#1e1e1e] rounded-xl px-4 py-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFD159] animate-pulse" />
                    <span className="text-xs text-gray-500">Current votes</span>
                  </div>
                  <span className="text-sm font-black text-white">
                    {selectedContestant.totalVote.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Qty */}
              <div className="mb-5">
                <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold mb-3">
                  How many votes?
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => changeQty(-1)}
                    disabled={voteQty <= 1}
                    className="w-11 h-11 shrink-0 rounded-full border border-[#2a2a2a] bg-[#161616] text-white text-xl flex items-center justify-center disabled:opacity-20 hover:border-[#FFD159]/50 hover:text-[#FFD159] transition"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={inputVal}
                    onChange={(e) => handleQtyInput(e.target.value)}
                    className="flex-1 h-11 rounded-xl bg-[#161616] border border-[#2a2a2a] text-center text-xl font-black text-white focus:border-[#FFD159]/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => changeQty(1)}
                    className="w-11 h-11 shrink-0 rounded-full border border-[#2a2a2a] bg-[#161616] text-white text-xl flex items-center justify-center hover:border-[#FFD159]/50 hover:text-[#FFD159] transition"
                  >
                    +
                  </button>
                </div>
                {/* Quick picks */}
                <div className="flex gap-2 mt-3">
                  {[5, 10, 25, 50].map((n) => (
                    <button
                      key={n}
                      onClick={() => { setVoteQty(n); setInputVal(String(n)); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        voteQty === n
                          ? "bg-[#FFD159]/10 border-[#FFD159]/40 text-[#FFD159]"
                          : "border-[#1e1e1e] text-gray-600 hover:text-gray-400 hover:border-[#2a2a2a]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing breakdown — only for paid */}
              {data.pricing === "paid" && (
                <div className="bg-[#161616] border border-[#1e1e1e] rounded-xl p-4 mb-5">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">
                      {fmt(data.pricePerVote)} × {voteQty} vote{voteQty > 1 ? "s" : ""}
                    </span>
                    <span className="text-white font-semibold">{fmt(voteTotal)}</span>
                  </div>
                  {data.organizerPays && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#1e1e1e]">
                      <span className="text-green-400 text-xs">✓</span>
                      <span className="text-xs text-gray-600">Organizer covers all fees</span>
                    </div>
                  )}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleVote}
                className="w-full py-4 rounded-2xl bg-[#FFD159] text-black font-black text-base tracking-tight hover:opacity-90 active:scale-[0.98] transition"
              >
                {data.pricing === "paid"
                  ? `Vote ${voteQty}× — ${fmt(voteTotal)}`
                  : `Cast ${voteQty} free vote${voteQty > 1 ? "s" : ""}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── HERO ── */}
      <div className="relative w-full h-[50vh] min-h-[340px] max-h-[500px] overflow-hidden">
        {data.banner ? (
          <img src={data.banner} alt={data.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#0f0f0f]" />
        )}
        {/* Layered gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-[#080808]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

        {/* Status pill — floating top right */}
        <div className="absolute top-5 right-5">
          {isLive && (
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-red-500/20 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Live now
            </div>
          )}
          {isEnded && (
            <div className="bg-black/60 backdrop-blur-md border border-white/10 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full">
              Voting closed
            </div>
          )}
          {notStarted && (
            <div className="bg-black/60 backdrop-blur-md border border-[#FFD159]/20 text-[#FFD159] text-xs font-semibold px-3 py-1.5 rounded-full">
              Coming soon
            </div>
          )}
        </div>

        {/* Title block */}
        <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-8 pb-7">
          <p className="text-xs text-gray-500 uppercase tracking-[0.15em] font-semibold mb-1">
            {data.edition}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none mb-2">
            {data.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {isLive && timeRemaining() && (
              <span className="text-[#FFD159] font-semibold">{timeRemaining()}</span>
            )}
            <span>{data.contestants.length} contestants</span>
            {data.showLiveCount && (
              <span>{totalVotes.toLocaleString()} votes cast</span>
            )}
            {data.pricing === "paid" && (
              <span className="bg-[#FFD159]/10 text-[#FFD159] border border-[#FFD159]/20 px-2 py-0.5 rounded-full font-semibold">
                {fmt(data.pricePerVote)} / vote
              </span>
            )}
            {data.pricing === "free" && (
              <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-semibold">
                Free
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">

        {/* Description */}
        {data.description && (
          <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">{data.description}</p>
        )}

        {/* Not approved state */}
        {!data.approved && (
          <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-2xl p-6 text-center">
            <p className="text-yellow-500/70 text-sm">
              This competition is pending approval and not yet open for voting.
            </p>
          </div>
        )}

        {/* ── CONTESTANTS ── */}
        {data.approved && (
          <div>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-base font-black tracking-tight">Contestants</h2>
              {isLive && (
                <p className="text-xs text-gray-600">Tap to vote</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {rankedContestants.map((contestant) => {
                const isFirst = contestant.position === 1 && data.publicLeaderboard;

                return (
                  <button
                    key={contestant.id}
                    onClick={() => isLive && openPanel(contestant)}
                    disabled={!isLive}
                    className={`group relative text-left w-full rounded-2xl overflow-hidden transition-all duration-200 ${
                      isLive
                        ? "cursor-pointer hover:ring-1 hover:ring-[#FFD159]/30 active:scale-[0.97]"
                        : "cursor-default"
                    } ${isFirst ? "ring-1 ring-[#FFD159]/40" : ""}`}
                  >
                    {/* Photo */}
                    <div className="relative aspect-[3/4] bg-[#111] overflow-hidden">
                      {contestant.photoUrl ? (
                        <img
                          src={contestant.photoUrl}
                          alt={contestant.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl font-black text-[#FFD159]/15">
                            {contestant.name?.[0]}
                          </span>
                        </div>
                      )}

                      {/* Dark vignette */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Position badge — only if publicLeaderboard */}
                      {data.publicLeaderboard && (
                        <div className="absolute top-2.5 left-2.5">
                          <span
                            className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                              contestant.position === 1
                                ? "bg-[#FFD159] text-black"
                                : "bg-black/50 backdrop-blur-sm text-white/70 border border-white/10"
                            }`}
                          >
                            #{contestant.position}
                          </span>
                        </div>
                      )}

                      {/* Vote CTA overlay — only when live */}
                      {isLive && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 bg-[#FFD159] text-black text-xs font-black px-4 py-2 rounded-full">
                            Vote
                          </span>
                        </div>
                      )}

                      {/* Name / tagline at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="font-black text-sm leading-tight text-white">{contestant.name}</p>
                        <p className="text-gray-400 text-[11px] leading-tight mt-0.5 line-clamp-1">
                          {contestant.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Stats bar — only if showLiveCount */}
                    {data.showLiveCount && (
                      <div className="bg-[#0f0f0f] border-t border-[#1c1c1c] px-3 py-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-gray-600">
                            {contestant.totalVote.toLocaleString()} votes
                          </span>
                          {data.publicLeaderboard && (
                            <span className="text-[11px] text-[#FFD159] font-semibold">
                              {contestant.percentage}%
                            </span>
                          )}
                        </div>
                        <div className="h-[2px] bg-[#1c1c1c] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              contestant.position === 1 && data.publicLeaderboard
                                ? "bg-[#FFD159]"
                                : "bg-[#2a2a2a]"
                            }`}
                            style={{ width: `${contestant.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── VOTING WINDOW ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0f0f0f] border border-[#1c1c1c] rounded-2xl p-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">Opens</p>
            <p className="text-sm font-semibold text-white">
              {new Date(data.voteStart).toLocaleDateString("en-NG", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {new Date(data.voteStart).toLocaleTimeString("en-NG", {
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <div className="bg-[#0f0f0f] border border-[#1c1c1c] rounded-2xl p-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">Closes</p>
            <p className="text-sm font-semibold text-white">
              {new Date(data.voteEnd).toLocaleDateString("en-NG", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {new Date(data.voteEnd).toLocaleTimeString("en-NG", {
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* ── RULES (only public-relevant ones) ── */}
        <div className="flex flex-wrap gap-2">
          {data.oneVotePerDevice && (
            <span className="text-[11px] bg-[#0f0f0f] border border-[#1c1c1c] text-gray-600 px-3 py-1.5 rounded-full">
              One vote per device
            </span>
          )}
          {data.pricing === "free" && (
            <span className="text-[11px] bg-[#0f0f0f] border border-[#1c1c1c] text-gray-600 px-3 py-1.5 rounded-full">
              Free to vote
            </span>
          )}
          {!data.publicLeaderboard && (
            <span className="text-[11px] bg-[#0f0f0f] border border-[#1c1c1c] text-gray-600 px-3 py-1.5 rounded-full">
              Rankings hidden
            </span>
          )}
        </div>

        {/* ── ORGANIZER — minimal, no internal info ── */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#1c1c1c]">
          <div className="w-9 h-9 rounded-full bg-[#FFD159]/10 border border-[#FFD159]/20 flex items-center justify-center text-[#FFD159] text-xs font-black shrink-0">
            {data.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-gray-600">Organized by</p>
            <p className="text-sm font-semibold text-white">{data.user?.businessName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingPage;