interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className = "" }: ErrorMessageProps) {
  return (
    <div
      className={`rounded bg-red-50 p-3 text-sm text-red-600 ${className}`}
      role="alert"
    >
      {message}
    </div>
  );
}
