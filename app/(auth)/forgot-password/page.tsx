"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MdEmail, MdConfirmationNumber, MdArrowBack } from "react-icons/md";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { forgotPassword } from "@/app/actions/auth"; // 👈 adjust path
import Image from "next/image";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = (val: string) => {
    if (!val.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Enter a valid email address";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const err = validate(email);
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      // still show success — don't reveal if email exists
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md mx-auto bg-surface rounded-2xl overflow-hidden border border-border shadow-[0_10px_40px_rgba(0,0,0,0.6)]">

        {/* Header */}
        <div className="px-8 py-7 flex flex-col items-center gap-1 text-center border-b border-border bg-background">
          <Link href="/" className="flex items-center gap-2 mb-3">
                     <Image src="/logo.svg" width={40} height={40} alt="logo"/>

            <span className="text-xl font-extrabold tracking-tight text-white">
              De Cave<span className="text-primary">.</span>
            </span>
          </Link>
          <h1 className="text-lg font-semibold text-white">Forgot your password?</h1>
          <p className="text-sm text-white/50">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-7 flex flex-col gap-5">
          {!sent ? (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/70">
                  Email address
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched) setError(validate(e.target.value));
                  }}
                  onBlur={() => {
                    setTouched(true);
                    setError(validate(email));
                  }}
                  iconLeft={<MdEmail />}
                  validationState={
                    error ? "error" : touched && email && !error ? "success" : "default"
                  }
                  errorMessage={error}
                  fullWidth
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-2xl">✓</span>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">Check your inbox</p>
                <p className="text-sm text-white/50 leading-relaxed">
                  If <span className="text-white/70">{email}</span> is registered,
                  you'll receive a password reset link shortly.
                </p>
              </div>
              <p className="text-xs text-white/30">
                Didn't get it? Check your spam folder.
              </p>
            </div>
          )}

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

export default ForgotPasswordPage;