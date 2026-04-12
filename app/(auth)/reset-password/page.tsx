"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { MdLock, MdArrowBack, MdCheck } from "react-icons/md";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { resetPassword } from "@/app/actions/auth";
import Image from "next/image";

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

// ─── Inner component that uses useSearchParams ────────────────────────────────

const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({ newPassword: false, confirmPassword: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (fields = form): FormErrors => {
    const errs: FormErrors = {};
    if (!fields.newPassword) {
      errs.newPassword = "Password is required";
    } else if (fields.newPassword.length < 8) {
      errs.newPassword = "Password must be at least 8 characters";
    }
    if (!fields.confirmPassword) {
      errs.confirmPassword = "Please confirm your password";
    } else if (fields.newPassword !== fields.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    return errs;
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) setErrors(validate(updated));
  };

  const handleBlur = (field: keyof typeof form) => {
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors(validate());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ newPassword: true, confirmPassword: true });

    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (!token) {
      setErrors({ general: "Invalid or missing reset token. Please request a new link." });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, form.newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setErrors({ general: err.message ?? "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!success) {
    return (
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {!token && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm text-yellow-400 border border-yellow-500/20 bg-yellow-500/5">
            <span className="mt-0.5">⚠</span>
            Invalid or expired reset link. Please{" "}
            <Link href="/forgot-password" className="underline">
              request a new one
            </Link>.
          </div>
        )}

        {errors.general && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm text-red-400 border border-red-500/20 bg-red-500/5">
            <span className="mt-0.5">⚠</span>
            {errors.general}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">New Password</label>
          <Input
            type="password"
            placeholder="Min. 8 characters"
            value={form.newPassword}
            onChange={(e) => handleChange("newPassword", e.target.value)}
            onBlur={() => handleBlur("newPassword")}
            iconLeft={<MdLock />}
            validationState={
              errors.newPassword
                ? "error"
                : touched.newPassword && form.newPassword && !errors.newPassword
                ? "success"
                : "default"
            }
            errorMessage={errors.newPassword}
            fullWidth
            disabled={loading || !token}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Confirm Password</label>
          <Input
            type="password"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            onBlur={() => handleBlur("confirmPassword")}
            iconLeft={<MdLock />}
            validationState={
              errors.confirmPassword
                ? "error"
                : touched.confirmPassword && form.confirmPassword && !errors.confirmPassword
                ? "success"
                : "default"
            }
            errorMessage={errors.confirmPassword}
            fullWidth
            disabled={loading || !token}
          />
        </div>

        {form.newPassword && form.confirmPassword && !errors.confirmPassword && (
          <p className="text-xs text-green-400 flex items-center gap-1 -mt-2">
            <MdCheck size={13} /> Passwords match
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          loading={loading}
          disabled={!token}
        >
          {loading ? "Resetting…" : "Reset Password"}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
        <MdCheck className="text-green-400 text-2xl" />
      </div>
      <div>
        <p className="text-white font-semibold mb-1">Password reset!</p>
        <p className="text-sm text-white/50 leading-relaxed">
          Your password has been updated. Redirecting to sign in…
        </p>
      </div>
      <div className="w-full bg-[#1a1a1a] rounded-full h-1 overflow-hidden">
        <div
          className="h-1 bg-[#FFD159]"
          style={{ width: "100%", transition: "width 3s linear" }}
        />
      </div>
    </div>
  );
};

// ─── Fallback while suspense loads ───────────────────────────────────────────

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="h-3 w-28 bg-[#1f1f1f] rounded" />
          <div className="h-10 bg-[#1f1f1f] rounded-xl" />
        </div>
      ))}
      <div className="h-11 bg-[#1f1f1f] rounded-xl" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md mx-auto bg-surface rounded-2xl overflow-hidden border border-border shadow-[0_10px_40px_rgba(0,0,0,0.6)]">

        {/* Header */}
        <div className="px-8 py-7 flex flex-col items-center gap-1 text-center border-b border-border bg-background">
          <Link href="/" className="flex items-center gap-2 mb-3">
            <Image src="/logo.svg" width={40} height={40} alt="logo" />
            <span className="text-xl font-extrabold tracking-tight text-white">
              De Cave<span className="text-primary">.</span>
            </span>
          </Link>
          <h1 className="text-lg font-semibold text-white">Set new password</h1>
          <p className="text-sm text-white/50">
            Choose a strong password for your account
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-7 flex flex-col gap-5">
          <Suspense fallback={<FormSkeleton />}>
            <ResetPasswordForm />
          </Suspense>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition"
          >
            <MdArrowBack size={16} />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;