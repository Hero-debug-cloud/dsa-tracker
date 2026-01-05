"use client";

interface ArrowLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function ArrowLoader({
  size = "md",
  text = "Loading...",
  className = "",
}: ArrowLoaderProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      {/* Rotating Arrow */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          className="animate-spin text-primary"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"
          />
        </svg>
      </div>

      {/* Loading Text */}
      {text && (
        <p className={`${textSizes[size]} text-muted-foreground font-medium`}>
          {text}
        </p>
      )}
    </div>
  );
}

// Inline Arrow Loader for smaller spaces
export function ArrowInlineLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <ArrowLoader size="md" text={text} />
    </div>
  );
}
