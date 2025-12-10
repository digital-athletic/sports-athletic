import { type InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function FormInput({
  label,
  className = "",
  id,
  ...props
}: FormInputProps) {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-base transition-colors placeholder:text-gray-400 focus:border-red-600 focus:outline-none ${className}`}
        {...props}
      />
    </div>
  );
}
