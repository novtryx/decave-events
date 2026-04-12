"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MdPerson, MdEmail, MdLock, MdConfirmationNumber, MdCheckCircle } from "react-icons/md";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Image from "next/image";
// import GoogleLoginButton from "./GoogleLoginButton";

interface RegisterFormProps {
  onSubmit?: (data: { name: string; email: string; password: string, businessName: string, address: string }) => Promise<void> | void;
  logoText?: string;
  logoHref?: string;
  loginHref?: string;
  className?: string;
}

interface FormFields {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  address: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  businessName?: string;
  address?: string;
  general?: string;
}

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
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
  const errors: FormErrors = {
  };

  if (!fields.name.trim()) errors.name = "Full name is required";
  else if (fields.name.trim().length < 2) errors.name = "Name must be at least 2 characters";

  if (!fields.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errors.email = "Enter a valid email address";

  if (!fields.password) errors.password = "Password is required";
  else if (fields.password.length < 8) errors.password = "Password must be at least 8 characters";

  if (!fields.confirmPassword) errors.confirmPassword = "Please confirm your password";
  else if (fields.confirmPassword !== fields.password) errors.confirmPassword = "Passwords do not match";

   if (!fields.businessName.trim()) errors.businessName = "Business Name is required";
  else if (fields.businessName.trim().length < 2) errors.businessName = "Business Name must be at least 2 characters";

  if (!fields.address.trim()) {errors.address = "Address is required";} 
  else if (fields.address.trim().length < 5) {
  errors.address = "Address must be at least 5 characters";}

  return errors;

  
};

const validateField = (field: keyof FormFields, fields: FormFields): string | undefined =>
  validate(fields)[field];

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  logoText = "De Cave",
  logoHref = "/",
  loginHref = "/login",
  className = "",
}) => {
  const [fields, setFields] = useState<FormFields>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    address: "", 

  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof FormFields, boolean>>({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    businessName: false,
    address: false, 
  });
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(fields.password);

  const updateField = (key: keyof FormFields, value: string) => {
    const updated = { ...fields, [key]: value };
    setFields(updated);

    if (touched[key] && errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));

    if (key === "password" && touched.confirmPassword) {
      const confirmErr = validateField("confirmPassword", updated);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
    }
  };

  const handleBlur = (field: keyof FormFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, fields);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const getValidationState = (field: keyof FormFields) => {
    if (!touched[field] || !fields[field]) return "default";
    return errors[field] ? "error" : "success";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, businessName: true, password: true, confirmPassword: true, address: true, });

    const allErrors = validate(fields);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await onSubmit?.({
        name: fields.name, email: fields.email, password: fields.password,
        businessName: fields.businessName,
        address: fields.address
      });
    } catch (err: any) {
      setErrors({ general: err?.message ?? "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={["w-full max-w-md mx-auto bg-background rounded-2xl overflow-hidden  shadow-[0_10px_40px_rgba(0,0,0,0.6)]", className].join(" ")}
    >
      {/* Header */}
      <div className="px-8 py-7 flex flex-col items-center gap-1 text-center border-b border-border bg-surface">
        <Link href={logoHref} className="flex items-center gap-2 mb-3">
                    <Image src="/logo.svg" width={40} height={40} alt="logo"/>
          
          <span className="text-xl font-extrabold tracking-tight text-white">
            {logoText}
            <span className="text-primary">.</span>
          </span>
        </Link>
        <h1 className="text-lg font-semibold text-white">Create your account</h1>
        <p className="text-sm text-white/50">Join thousands discovering events near them</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="px-8 py-7 flex flex-col gap-5">
        {errors.general && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm text-red-400 border border-red-500/20 bg-red-500/5">
            <span className="mt-0.5 shrink-0">⚠</span>
            {errors.general}
          </div>
        )}

        {/* Full name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Full name</label>
          <Input
            type="text"
            placeholder="Emmanuel Adebayo"
            value={fields.name}
            onChange={(e) => updateField("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            iconLeft={<MdPerson />}
            validationState={getValidationState("name")}
            errorMessage={errors.name}
            fullWidth
            autoComplete="name"
            disabled={loading}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Email address</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={fields.email}
            onChange={(e) => updateField("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            iconLeft={<MdEmail />}
            validationState={getValidationState("email")}
            errorMessage={errors.email}
            fullWidth
            autoComplete="email"
            disabled={loading}
          />
        </div>

         <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Business name</label>
          <Input
            type="text"
            placeholder="Decave Mgt"
            value={fields.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
            onBlur={() => handleBlur("businessName")}
            iconLeft={<MdPerson />}
            validationState={getValidationState("businessName")}
            errorMessage={errors.businessName}
            fullWidth
            autoComplete="businessName"
            disabled={loading}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Address</label>
          <Input
            type="text"
            placeholder="123 Lagos Street"
            value={fields.address}
            onChange={(e) => updateField("address", e.target.value)}
            onBlur={() => handleBlur("address")}
            iconLeft={<MdPerson />} // you can change icon if you want
            validationState={getValidationState("address")}
            errorMessage={errors.address}
            fullWidth
            autoComplete="street-address"
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Password</label>
          <Input
            type="password"
            placeholder="Min. 8 characters"
            value={fields.password}
            onChange={(e) => updateField("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            iconLeft={<MdLock />}
            validationState={getValidationState("password")}
            errorMessage={errors.password}
            fullWidth
            autoComplete="new-password"
            disabled={loading}
          />
          {fields.password.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-0.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className="flex-1 h-1 rounded-full transition-all duration-300"
                    style={{ background: strength.score >= step ? strength.color : "#1f1f1f" }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium" style={{ color: strength.color }}>
                {strength.label} password
              </span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Confirm password</label>
          <Input
            type="password"
            placeholder="Re-enter your password"
            value={fields.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            onBlur={() => handleBlur("confirmPassword")}
            iconLeft={<MdLock />}
            validationState={getValidationState("confirmPassword")}
            errorMessage={errors.confirmPassword}
            fullWidth
            autoComplete="new-password"
            disabled={loading}
          />
        </div>

        {/* Terms */}
        <p className="text-xs text-white/40 leading-relaxed -mt-1">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline font-medium">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline font-medium">
            Privacy Policy
          </Link>.
        </p>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          size="lg"
          iconRight={!loading ? <MdCheckCircle /> : undefined}
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>

        {/* Divider */}
        {/* <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-white/30 font-medium">or</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <GoogleLoginButton /> */}

        {/* Login link */}
        <p className="text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link href={loginHref} className="font-semibold text-primary hover:opacity-80 transition">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;
