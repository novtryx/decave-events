"use server"

import { authFetch } from "@/lib/authFetch"; 
import { deleteAccessToken, setAccessToken } from "@/lib/authCookies"; 
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { handleAction } from "@/lib/handleAction";


type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
    email: string;
    name: string;
    password:  string;
    businessName: string;
    address: string
}

type LoginResponse = {
  accessToken: string;
};

export async function loginUser(payload: LoginPayload): Promise<any> {
    noStore();

  return handleAction(async () => {
    const res = await authFetch<LoginResponse>("/users/login", {
      method: "POST",
      body: payload,
    });

    await setAccessToken(res.accessToken);

    return res;
  });

}

export async function RegisterUser(payload: RegisterPayload): Promise<void> {
  noStore();
  const res = await authFetch<any>("/users/register", {
    method: "POST",
    body: payload,
  });

 redirect("/login"); 
}


export async function logout() {
  await deleteAccessToken();
  redirect("/login");
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  noStore();
  const res = await fetch(`${process.env.API_URL}/users/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Something went wrong");
  }

  return res.json();
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  noStore();
  const res = await fetch(`${process.env.API_URL}/users/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Something went wrong");
  }

  return res.json();
}