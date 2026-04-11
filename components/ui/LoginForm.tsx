"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MdEmail, MdLock, MdConfirmationNumber } from "react-icons/md";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
// import GoogleLoginButton from "./GoogleLoginButton";

interface LoginFormProps {
  onSubmit?: (data: { email: string; password: string }) => Promise<void> | void;
  logoText?: string;
  logoHref?: string;
  registerHref?: string;
  forgotPasswordHref?: string;
  className?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const validate = (email: string, password: string): FormErrors => {
  const errors: FormErrors = {};

  if (!email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  return errors;
};

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  logoText = "De Cave",
  logoHref = "/",
  registerHref = "/register",
  forgotPasswordHref = "/forgot-password",
  className = "",
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (touched.email && errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (touched.password && errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleBlur = (field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldErrors = validate(email, password);
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const fieldErrors = validate(email, password);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await onSubmit?.({ email, password });
    } catch (err: any) {
      setErrors({
        general: err?.message ?? "Invalid email or password.",

      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={[
        "w-full max-w-md mx-auto bg-surface rounded-2xl overflow-hidden border border-border",
        "shadow-[0_10px_40px_rgba(0,0,0,0.6)]",
        className,
      ].join(" ")}
    >
      {/* Header */}
      <div className="px-8 py-7 flex flex-col items-center gap-1 text-center border-b border-border bg-background">
        
        {/* Logo */}
        <Link href={logoHref} className="flex items-center gap-2 mb-3 group">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary text-black">
            <MdConfirmationNumber className="text-lg" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">
            {logoText}
            <span className="text-primary">.</span>
          </span>
        </Link>

        <h1 className="text-lg font-semibold text-white">
          Welcome back
        </h1>
        <p className="text-sm text-white/50">
          Sign in to access your tickets and events
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="px-8 py-7 flex flex-col gap-5"
      >
        {/* General error */}
        {errors.general && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm text-red-400 border border-red-500/20 bg-red-500/5">
            <span className="mt-0.5">⚠</span>
            {errors.general}
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">
            Email address
          </label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur("email")}
            iconLeft={<MdEmail />}
            validationState={
              errors.email
                ? "error"
                : touched.email && email && !errors.email
                ? "success"
                : "default"
            }
            errorMessage={errors.email}
            fullWidth
            autoComplete="email"
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white/70">
              Password
            </label>
            <Link
              href={forgotPasswordHref}
              className="text-xs font-medium text-primary hover:opacity-80 transition"
            >
              Forgot password?
            </Link>
          </div>

          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => handleBlur("password")}
            iconLeft={<MdLock />}
            validationState={
              errors.password
                ? "error"
                : touched.password && password && !errors.password
                ? "success"
                : "default"
            }
            errorMessage={errors.password}
            fullWidth
            autoComplete="current-password"
            disabled={loading}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          size="lg"
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>

        {/* Divider */}
        {/* <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-white/30 font-medium">or</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <GoogleLoginButton /> */}

        {/* Register */}
        <p className="text-center text-sm text-white/50">
          Don&apos;t have an account?{" "}
          <Link
            href={registerHref}
            className="font-semibold text-primary hover:opacity-80 transition"
          >
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
