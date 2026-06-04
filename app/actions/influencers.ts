"use server"

import { setAccessToken, setInfluencerAccessToken } from "@/lib/authCookies";
import { authFetch } from "@/lib/authFetch";
import { handleAction } from "@/lib/handleAction";
import { influencerProtectedFetch } from "@/lib/protectedFetch";




type RegisterInfluencerPayload = {
    email: string;
    fullName: string;
    password:  string;
    username: string;
    influencersTakesPercentage?: boolean;
}

type InfluencerLoginResponse = {
  accessToken: string;
};


type InfluencerLoginPayload = {
  email: string;
  password: string;
};

export type BankSaveDto = {
    bankName: string;
    bankCode: string;
    accountNumber: string
}


export async function RegisterInfluencer(payload: RegisterInfluencerPayload): Promise<any> {



  return handleAction(async () => {
    const res = await authFetch<any>("/influencers/register", {
      method: "POST",
      body: payload,
    });

    // await setAccessToken(res.accessToken);

    return res;
  });
  

}

export async function LoginInfluencer(payload: InfluencerLoginPayload): Promise<any> {
   

  return handleAction(async () => {
    const res = await authFetch<InfluencerLoginResponse>("/influencers/login", {
      method: "POST",
      body: payload,
    });

    await setInfluencerAccessToken(res.accessToken);

    return res;
  });

}

export async function me(): Promise<any> {
 
  const res = await influencerProtectedFetch<any>("/influencers/me", {
    method: "GET"
  });

return res

}

export async function saveInfluencerBank(payload:BankSaveDto): Promise<any>

{
    const res = await influencerProtectedFetch("/influencers/add-bank", {
        method: "POST",
         body: payload,
    })

    return res
}

export async function inflencerRequestWithdrawal(payload: {amount: number}): Promise<any>{
    const res = await influencerProtectedFetch("/influencers/request-withdrawal",{
        method: "POST",
        body: {amount: payload.amount}
    })
}

export async function influencerTransactionHistory(page = 1): Promise<any> {
 
  const res = await influencerProtectedFetch<any>(`/influencers/transactions?page=${page}&limit=20`, {
    method: "GET"
  });

return res

}