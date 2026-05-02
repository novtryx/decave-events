"use server"

import { handleAction } from "@/lib/handleAction";
import { protectedFetch } from "@/lib/protectedFetch";
import { publicFetch } from "@/lib/publicFetch";
import { unstable_noStore as noStore } from "next/cache";

type Contestant = {
  name: string;
  tagline: string;
  category: string;
  photoUrl: string | null;
};

type CompetitionForm = {
  title: string;
  description: string;
  edition: string;
  voteStart: string;
  voteEnd: string;
  pricing: "free" | "paid";
  pricePerVote: number;
  showLiveCount: boolean;
  publicLeaderboard: boolean;
  banner: string | null;
  contestants: Contestant[];
};


export async function createVote(payload: CompetitionForm): Promise<any> {
  noStore();


  return handleAction(async () => {
      const res = await protectedFetch<any>("/vote", {
        method: "POST",
        body: payload,
      });
  
  
      return res;
    });
 
}

export async function getUserVoting(): Promise<any> {
  noStore();
  const res = await protectedFetch<any>("/vote/votes-by-user", {
    method: "GET"
  });

return res

}

export async function getUserVotingById(id: any): Promise<any> {
  noStore();
  const res = await protectedFetch<any>(`/vote/${id}`, {
    method: "GET"
  });

return res

}

export async function getVotingByTitle(title: string): Promise<any> {
  noStore();
  const res = await publicFetch<any>(`/vote/title/${title}`, {
    method: "GET"
  });

return res

}

export async function initializeVotePayment(payload: {
  competitionId: string;
  contestantId: string;
  qty: number;
  voterName: string;
  voterEmail: string;
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/paystack/initialize/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? "Failed to initialize vote payment");
  }

  return res.json();
}

export async function castFreeVote(payload: {
  competitionId: string;
  contestantId: string;
  qty: number;
  voterName: string;
  voterEmail: string;
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vote/${payload.competitionId}/cast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contestantId: payload.contestantId,
      voteCount: payload.qty,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? "Failed to cast vote");
  }

  return res.json();
}
