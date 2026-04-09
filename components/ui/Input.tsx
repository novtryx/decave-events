"use client";

import React, { useState, useId } from "react";
import {
  MdVisibility,
  MdVisibilityOff,
  MdError,
  MdCheckCircle,
} from "react-icons/md";

type ValidationState = "default" | "error" | "success";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  validationState?: ValidationState;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const validationStyles: Record<ValidationState, string> = {
  default:
    "border-border focus-within:border-primary focus-within:ring-primary/20",
  error:
    "border-red-500/60 focus-within:border-red-500 focus-within:ring-red-500/20",
  success:
    "border-emerald-500/60 focus-within:border-emerald-500 focus-within:ring-emerald-500/20",
};

const validationTextStyles: Record<ValidationState, string> = {
  default: "text-white/50",
  error: "text-red-400",
  success: "text-emerald-400",
};

const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorMessage,
  validationState = "default",
  iconLeft,
  iconRight,
  fullWidth = false,
  type = "text",
  disabled = false,
  className = "",
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const isPassword = type === "password";
  const resolvedType = isPassword
    ? showPassword
      ? "text"
      : "password"
    : type;

  const state: ValidationState = errorMessage ? "error" : validationState;

  const hasRightSlot =
    iconRight || isPassword || state === "error" || state === "success";

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? "w-full" : "w-auto"}`}>
      
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={`text-sm font-medium ${
            disabled ? "text-white/30" : "text-white/70"
          }`}
        >
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div
        className={[
          "flex items-center gap-2 px-3 h-11 rounded-xl border",
          "bg-surface transition-all duration-200",
          "focus-within:ring-2",
          validationStyles[state],
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:border-white/20",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Left icon */}
        {iconLeft && (
          <span className="shrink-0 text-white/40 text-base">
            {iconLeft}
          </span>
        )}

        {/* Input */}
        <input
          id={inputId}
          type={resolvedType}
          disabled={disabled}
          className={[
            "flex-1 min-w-0 bg-transparent text-sm text-white",
            "placeholder:text-white/30 outline-none",
            "disabled:cursor-not-allowed",
          ].join(" ")}
          {...props}
        />

        {/* Right slot */}
        {hasRightSlot && (
          <span className="shrink-0 flex items-center gap-1.5 text-base">
            {/* Validation */}
            {!isPassword && state === "error" && (
              <MdError className="text-red-400" />
            )}
            {!isPassword && state === "success" && (
              <MdCheckCircle className="text-emerald-400" />
            )}

            {/* Custom icon */}
            {iconRight && !isPassword && (
              <span className="text-white/40">{iconRight}</span>
            )}

            {/* Password toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-white/40 hover:text-primary transition-colors duration-150 focus:outline-none"
                tabIndex={-1}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            )}
          </span>
        )}
      </div>

      {/* Helper / Error */}
      {(errorMessage || helperText) && (
        <p className={`text-xs ${validationTextStyles[state]}`}>
          {errorMessage ?? helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
