"use server"

import { protectedFetch } from "@/lib/protectedFetch";
import { unstable_noStore as noStore } from "next/cache";


export async function getMe(): Promise<any> {
  noStore();
  const res = await protectedFetch<any>("/users/me", {
    method: "GET",
  });
  return res;
}

export async function updateUser(id: number, payload: {
  name?: string;
  email?: string;
  businessName?: string;
  address?: string;
}): Promise<any> {
  noStore();
  const res = await protectedFetch<any>(`/users/${id}`, {
    method: "PATCH",
    body: payload,
  });
  return res;
}

export async function updatePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<any> {
  noStore();
  const res = await protectedFetch<any>("/users/update-password", {
    method: "PATCH",
    body: payload,
  });
  return res;
}