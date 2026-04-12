"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MdPerson, MdLock, MdCheck, MdError } from "react-icons/md";
import {  getMe, updateUser, updatePassword  } from '@/app/actions/settings';

// ─── Types ────────────────────────────────────────────────────────────────────

type User = {
  id: number;
  name: string;
  email: string;
  businessName: string;
  address: string;
  profileImage: string | null;
  emailVerified: string | null;
  createdAt: string;
};

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition
        ${type === "success"
          ? "bg-green-500/10 border border-green-500/20 text-green-400"
          : "bg-red-500/10 border border-red-500/20 text-red-400"
        }`}
    >
      {type === "success" ? <MdCheck size={18} /> : <MdError size={18} />}
      {message}
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#121212] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1f1f1f] flex items-center gap-3">
        <div className="p-2 bg-[#FFD159]/10 rounded-xl text-[#FFD159]">{icon}</div>
        <div>
          <h2 className="text-white font-semibold text-sm">{title}</h2>
          <p className="text-gray-500 text-xs">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FFD159] placeholder:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
      />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-1 animate-pulse">
      <div className="h-3 w-20 bg-[#1f1f1f] rounded" />
      <div className="h-10 bg-[#1f1f1f] rounded-xl" />
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────

function ProfileSection({ user }: { user: User }) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    businessName: user.businessName,
    address: user.address,
  });

  // keep form in sync if user data reloads
  useEffect(() => {
    setForm({
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      address: user.address,
    });
  }, [user]);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: () => updateUser(user.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      showToast("Profile updated successfully", "success");
    },
    onError: (err: any) => {
      showToast(err?.message ?? "Failed to update profile", "error");
    },
  });

  const isDirty =
    form.name !== user.name ||
    form.email !== user.email ||
    form.businessName !== user.businessName ||
    form.address !== user.address;

  return (
    <>
      {toast && <Toast {...toast} />}
      <Section
        icon={<MdPerson size={18} />}
        title="Profile Information"
        description="Update your personal and business details"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Full Name"
            value={form.name}
            onChange={(v) => setForm((p) => ({ ...p, name: v }))}
            placeholder="John Doe"
          />
          <Field
            label="Email"
            value={form.email}
            onChange={(v) => setForm((p) => ({ ...p, email: v }))}
            type="email"
            placeholder="john@example.com"
          />
          <Field
            label="Business Name"
            value={form.businessName}
            onChange={(v) => setForm((p) => ({ ...p, businessName: v }))}
            placeholder="My Business"
          />
          <Field
            label="Address"
            value={form.address}
            onChange={(v) => setForm((p) => ({ ...p, address: v }))}
            placeholder="123 Main St"
          />
        </div>

        {/* Email verified badge */}
        <div className="mt-4 flex items-center gap-2">
          {user.emailVerified ? (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
              <MdCheck size={12} /> Email Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full">
              <MdError size={12} /> Email Not Verified
            </span>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            disabled={!isDirty || isPending}
            onClick={() => mutate()}
            className="px-5 py-2.5 rounded-xl bg-[#FFD159] text-black font-bold text-sm hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </Section>
    </>
  );
}

// ─── Password Section ─────────────────────────────────────────────────────────

function PasswordSection() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      updatePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    onSuccess: () => {
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password updated successfully", "success");
    },
    onError: (err: any) => {
      showToast(err?.message ?? "Failed to update password", "error");
    },
  });

  const passwordsMatch = form.newPassword === form.confirmPassword;
  const canSubmit =
    form.currentPassword &&
    form.newPassword &&
    form.confirmPassword &&
    passwordsMatch &&
    form.newPassword.length >= 8 &&
    !isPending;

  return (
    <>
      {toast && <Toast {...toast} />}
      <Section
        icon={<MdLock size={18} />}
        title="Change Password"
        description="Make sure your account is using a strong password"
      >
        <div className="flex flex-col gap-4 max-w-md">
          <Field
            label="Current Password"
            value={form.currentPassword}
            onChange={(v) => setForm((p) => ({ ...p, currentPassword: v }))}
            type="password"
            placeholder="••••••••"
          />
          <Field
            label="New Password"
            value={form.newPassword}
            onChange={(v) => setForm((p) => ({ ...p, newPassword: v }))}
            type="password"
            placeholder="••••••••"
          />
          <Field
            label="Confirm New Password"
            value={form.confirmPassword}
            onChange={(v) => setForm((p) => ({ ...p, confirmPassword: v }))}
            type="password"
            placeholder="••••••••"
          />

          {/* Validation hints */}
          <div className="flex flex-col gap-1">
            {form.newPassword && form.newPassword.length < 8 && (
              <p className="text-xs text-red-400">Password must be at least 8 characters</p>
            )}
            {form.confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}
            {form.confirmPassword && passwordsMatch && form.newPassword && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <MdCheck size={12} /> Passwords match
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            disabled={!canSubmit}
            onClick={() => mutate()}
            className="px-5 py-2.5 rounded-xl bg-[#FFD159] text-black font-bold text-sm hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Updating..." : "Update Password"}
          </button>
        </div>
      </Section>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SettingsPage = () => {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 60_000,
  });

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-white">Settings</h1>

      {/* Profile section */}
      {isLoading ? (
        <div className="bg-[#121212] border border-[#1f1f1f] rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <FieldSkeleton key={i} />)}
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm">Failed to load profile. Please refresh.</p>
      ) : user ? (
        <ProfileSection user={user} />
      ) : null}

      {/* Password section — always visible */}
      <PasswordSection />
    </div>
  );
};

export default SettingsPage;