"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MdPerson,
  MdEmail,
  MdLock,
  MdConfirmationNumber,
  MdCheckCircle,
  MdPercent,
} from "react-icons/md";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Image from "next/image";

interface RegisterFormProps {
  onSubmit?: (data: {
    fullName: string;
    email: string;
    username: string;
    password: string;
    influencersTakesPercentage?: boolean;
  }) => Promise<any> | any;
  logoText?: string;
  logoHref?: string;
  loginHref?: string;
  className?: string;
}

interface FormFields {
  fullName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  influencersTakesPercentage: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
  if (score === 2) return { score, label: "Fair", color: "#FFD159" };
  if (score === 3) return { score, label: "Good", color: "#FFD159" };
  return { score, label: "Strong", color: "#10b981" };
};

const validate = (fields: FormFields): FormErrors => {
  const errors: FormErrors = {};

  if (!fields.fullName.trim())
    errors.fullName = "Full name is required";
  else if (fields.fullName.trim().length < 2)
    errors.fullName = "Name must be at least 2 characters";

  if (!fields.email.trim())
    errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
    errors.email = "Enter a valid email address";

  if (!fields.username.trim())
    errors.username = "Username is required";
  else if (fields.username.trim().length < 3)
    errors.username = "Username must be at least 3 characters";

  if (!fields.password)
    errors.password = "Password is required";
  else if (fields.password.length < 8)
    errors.password = "Password must be at least 8 characters";

  if (!fields.confirmPassword)
    errors.confirmPassword = "Please confirm your password";
  else if (fields.confirmPassword !== fields.password)
    errors.confirmPassword = "Passwords do not match";

  return errors;
};

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  logoText = "De Cave",
  logoHref = "/",
  loginHref = "/influencers/auth/register",
  className = "",
}) => {
  const [fields, setFields] = useState<FormFields>({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    influencersTakesPercentage: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const [touched, setTouched] = useState<Record<keyof Omit<FormFields, "influencersTakesPercentage">, boolean>>({
    fullName: false,
    email: false,
    username: false,
    password: false,
    confirmPassword: false,
  });

  const strength = getPasswordStrength(fields.password);

  const updateField = (key: keyof Omit<FormFields, "influencersTakesPercentage">, value: string) => {
    const updated = { ...fields, [key]: value };
    setFields(updated);

    if (touched[key] && errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }

    if (key === "password" && touched.confirmPassword) {
      const confirmError =
        updated.confirmPassword !== updated.password
          ? "Passwords do not match"
          : undefined;

      setErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError,
      }));
    }
  };

  const handleBlur = (field: keyof Omit<FormFields, "influencersTakesPercentage">) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validation = validate(fields);
    setErrors((prev) => ({ ...prev, [field]: validation[field] }));
  };

  const getValidationState = (field: keyof Omit<FormFields, "influencersTakesPercentage">) => {
    if (!touched[field] || !fields[field]) return "default";
    return errors[field] ? "error" : "success";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      fullName: true,
      email: true,
      username: true,
      password: true,
      confirmPassword: true,
    });

    const validation = validate(fields);

    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setErrors({});
    setLoading(true);

    const result = await onSubmit?.({
      fullName: fields.fullName,
      email: fields.email,
      username: fields.username,
      password: fields.password,
      influencersTakesPercentage: fields.influencersTakesPercentage,
    });

    setLoading(false);

    if (!result?.success) {
      setErrors({
        general: result?.message || "Something went wrong",
      });
      return;
    }

    window.location.href = "/influencers/auth/login";
  };

  return (
    <div
      className={[
        "w-full max-w-md mx-auto bg-background rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.6)]",
        className,
      ].join(" ")}
    >
      {/* HEADER */}
      <div className="px-8 py-7 flex flex-col items-center text-center border-b border-border bg-surface">
        <Link href={logoHref} className="flex items-center gap-2 mb-3">
          <Image src="/logo.svg" width={40} height={40} alt="logo" />
          <span className="text-xl font-extrabold text-white">
            {logoText}
            <span className="text-primary">.</span>
          </span>
        </Link>

        <h1 className="text-lg font-semibold text-white">
          Create your account
        </h1>
        <p className="text-sm text-white/50">
          Sign up to manage your event invites and collaborations
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-7 flex flex-col gap-5">
        {errors.general && (
          <div className="px-4 py-3 text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl">
            {errors.general}
          </div>
        )}

        {/* FULL NAME */}
        <Input
          type="text"
          placeholder="Full name"
          value={fields.fullName}
          onChange={(e) => updateField("fullName", e.target.value)}
          onBlur={() => handleBlur("fullName")}
          iconLeft={<MdPerson />}
          validationState={getValidationState("fullName")}
          errorMessage={errors.fullName}
          disabled={loading}
        />

        {/* EMAIL */}
        <Input
          type="email"
          placeholder="Email address"
          value={fields.email}
          onChange={(e) => updateField("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          iconLeft={<MdEmail />}
          validationState={getValidationState("email")}
          errorMessage={errors.email}
          disabled={loading}
        />

        {/* USERNAME */}
        <Input
          type="text"
          placeholder="Username"
          value={fields.username}
          onChange={(e) => updateField("username", e.target.value)}
          onBlur={() => handleBlur("username")}
          iconLeft={<MdConfirmationNumber />}
          validationState={getValidationState("username")}
          errorMessage={errors.username}
          disabled={loading}
        />

        {/* PASSWORD */}
        <Input
          type="password"
          placeholder="Password"
          value={fields.password}
          onChange={(e) => updateField("password", e.target.value)}
          onBlur={() => handleBlur("password")}
          iconLeft={<MdLock />}
          validationState={getValidationState("password")}
          errorMessage={errors.password}
          disabled={loading}
        />

        {/* PASSWORD STRENGTH */}
        {fields.password && (
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className="h-1 flex-1 rounded-full"
                  style={{
                    background:
                      strength.score >= step
                        ? strength.color
                        : "#1f1f1f",
                  }}
                />
              ))}
            </div>
            <span
              className="text-xs"
              style={{ color: strength.color }}
            >
              {strength.label} password
            </span>
          </div>
        )}

        {/* CONFIRM PASSWORD */}
        <Input
          type="password"
          placeholder="Confirm password"
          value={fields.confirmPassword}
          onChange={(e) =>
            updateField("confirmPassword", e.target.value)
          }
          onBlur={() => handleBlur("confirmPassword")}
          iconLeft={<MdLock />}
          validationState={getValidationState("confirmPassword")}
          errorMessage={errors.confirmPassword}
          disabled={loading}
        />

        {/* INFLUENCER PERCENTAGE TOGGLE */}
        <div className="flex flex-col gap-2 px-4 py-4 rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-primary text-base">
                <MdPercent />
              </span>
              <span className="text-sm font-medium text-white">
                10% Commission
              </span>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              role="switch"
              aria-checked={fields.influencersTakesPercentage}
              disabled={loading}
              onClick={() =>
                setFields((prev) => ({
                  ...prev,
                  influencersTakesPercentage: !prev.influencersTakesPercentage,
                }))
              }
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: fields.influencersTakesPercentage ? "#FFD159" : "rgba(255,255,255,0.1)",
              }}
            >
              <span
                aria-hidden="true"
                className={[
                  "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition duration-200 ease-in-out",
                  fields.influencersTakesPercentage
                    ? "translate-x-5"
                    : "translate-x-0",
                ].join(" ")}
              />
            </button>
          </div>

         <p className="text-xs text-white/50 leading-relaxed">
            {fields.influencersTakesPercentage ? (
              <>
                <span className="text-white/70 font-medium">Buyer pays full price.</span>
                {" "}When your referral code is used, 10% of the ticket price is sent to you as commission.
              </>
            ) : (
              <>
                <span className="text-primary font-medium">Buyer gets 10% off.</span>
                {" "}When your referral code is used, the ticket price is discounted by 10% for the buyer.
              </>
            )}
          </p>
        </div>

        <Button
          type="submit"
          loading={loading}
          fullWidth
          size="lg"
          iconRight={!loading ? <MdCheckCircle /> : undefined}
        >
          {loading ? "Creating account..." : "Create account"}
        </Button>

        <p className="text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link href={loginHref} className="text-primary font-semibold">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;