"use server"

import { authFetch } from "@/lib/authFetch"; 
import { deleteAccessToken, setAccessToken } from "@/lib/authCookies"; 
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  name: string;
  password: string;
  businessName: string;
  address: string;
};

type LoginResponse = {
  accessToken: string;
};

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function loginUser(payload: LoginPayload): Promise<ActionResult> {
  noStore();
  try {
    const res = await authFetch<LoginResponse>("/users/login", {
      method: "POST",
      body: payload,
    });
    await setAccessToken(res.accessToken);
  } catch (err: any) {
    return { success: false, error: err.message ?? "Login failed" };
  }

  redirect("/dashboard"); // ✅ outside try/catch so it works — redirect throws internally
}

export async function RegisterUser(payload: RegisterPayload): Promise<ActionResult> {
  noStore();
  try {
    await authFetch<any>("/users/register", {
      method: "POST",
      body: payload,
    });
  } catch (err: any) {
    return { success: false, error: err.message ?? "Registration failed" };
  }

  redirect("/login");
}

export async function logout() {
  await deleteAccessToken();
  redirect("/login");
}

export async function forgotPassword(email: string): Promise<ActionResult & { message?: string }> {
  noStore();
  try {
    const res = await fetch(`${process.env.API_URL}/users/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.message ?? "Something went wrong" };
    }

    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Something went wrong" };
  }
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ActionResult & { message?: string }> {
  noStore();
  try {
    const res = await fetch(`${process.env.API_URL}/users/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.message ?? "Something went wrong" };
    }

    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Something went wrong" };
  }
}