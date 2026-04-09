"use server"

import { authFetch } from "@/lib/authFetch"; 
import { setAccessToken } from "@/lib/authCookies"; 
import { redirect } from "next/navigation";

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

export async function loginUser(payload: LoginPayload): Promise<void> {
  const res = await authFetch<LoginResponse>("/users/login", {
    method: "POST",
    body: payload,
  });

await setAccessToken(res.accessToken);

redirect("/dashboard"); 
}

export async function RegisterUser(payload: RegisterPayload): Promise<void> {
  const res = await authFetch<any>("/users/register", {
    method: "POST",
    body: payload,
  });

 redirect("/login"); 
}