import { cookies } from "next/headers";

const ACCESS_TOKEN_KEY = "accessToken";
const ACCESS_TOKEN_KEY_2 = "accessToken2"

export async function setAccessToken(token: string) {
  (await cookies()).set({
    name: ACCESS_TOKEN_KEY,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 2, 

  });
}

export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_TOKEN_KEY)?.value ?? null;
}

export async function deleteAccessToken() {
  (await cookies()).delete(ACCESS_TOKEN_KEY);
}


export async function setInfluencerAccessToken(token: string) {
  (await cookies()).set({
    name: ACCESS_TOKEN_KEY_2,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 2, 

  });
}

export async function getInfluencerAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_TOKEN_KEY_2)?.value ?? null;
}

export async function deleteInfluencerAccessToken() {
  (await cookies()).delete(ACCESS_TOKEN_KEY_2);
}