import React from "react";
import { ImSpinner8 } from "react-icons/im";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#FFD159] text-black border border-[#FFD159] hover:bg-[#e6bb4f] hover:border-[#e6bb4f] active:bg-[#d4aa45] focus-visible:ring-[#FFD159]",

  secondary:
    "bg-[#1f1f1f] text-white border border-[#2a2a2a] hover:bg-[#2a2a2a] active:bg-[#333] focus-visible:ring-[#FFD159]",

  outline:
    "bg-transparent text-[#FFD159] border border-[#FFD159] hover:bg-[#FFD159]/10 active:bg-[#FFD159]/20 focus-visible:ring-[#FFD159]",

  danger:
    "bg-red-600 text-white border border-red-600 hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

const spinnerSizeStyles: Record<ButtonSize, string> = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  children,
  disabled,
  className = "",
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={[
        // Base
        "relative inline-flex items-center justify-center font-medium tracking-wide",
        "transition-all duration-200 ease-in-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]",
        "select-none cursor-pointer",

        // Variant
        variantStyles[variant],

        // Size
        sizeStyles[size],

        // Width
        fullWidth ? "w-full" : "w-auto",

        // Loading
        loading ? "opacity-70 cursor-not-allowed pointer-events-none" : "",

        // Disabled (better dark version)
        disabled && !loading
          ? "bg-[#1a1a1a] text-gray-500 border-[#1f1f1f] cursor-not-allowed pointer-events-none"
          : "",

        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {/* Spinner */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <ImSpinner8 className={`animate-spin ${spinnerSizeStyles[size]}`} />
        </span>
      )}

      {/* Content */}
      <span
        className={`inline-flex items-center gap-inherit ${
          loading ? "invisible" : ""
        }`}
      >
        {iconLeft && (
          <span className={`shrink-0 ${iconSizeStyles[size]}`}>
            {iconLeft}
          </span>
        )}

        {children}

        {iconRight && (
          <span className={`shrink-0 ${iconSizeStyles[size]}`}>
            {iconRight}
          </span>
        )}
      </span>
    </button>
  );
};

export default Button;
