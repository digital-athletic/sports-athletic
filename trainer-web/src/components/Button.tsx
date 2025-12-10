import { type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  loadingText?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed",
  secondary:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed",
  danger:
    "border border-red-300 bg-white text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "text-gray-500 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed",
};

export function Button({
  variant = "primary",
  isLoading = false,
  loadingText,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "rounded-lg px-4 py-2 text-sm font-semibold transition-colors";

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}
