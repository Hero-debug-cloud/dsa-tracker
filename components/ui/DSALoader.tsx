"use client";

import { useEffect, useState } from "react";

interface DSALoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function DSALoader({
  size = "md",
  text = "Loading...",
  className = "",
}: DSALoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [codeSnippet, setCodeSnippet] = useState(0);

  const algorithmSteps = [
    "Initializing data structures...",
    "Parsing input parameters...",
    "Building binary tree...",
    "Running DFS traversal...",
    "Optimizing time complexity...",
    "Finalizing O(log n) solution...",
  ];

  const codeSnippets = [
    "for (int i = 0; i < n; i++)",
    "if (left < right)",
    "return merge(left, right)",
    "stack.push(node.val)",
    "while (!queue.empty())",
    "dp[i] = dp[i-1] + dp[i-2]",
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % algorithmSteps.length);
    }, 1200);

    const codeInterval = setInterval(() => {
      setCodeSnippet((prev) => (prev + 1) % codeSnippets.length);
    }, 800);

    return () => {
      clearInterval(stepInterval);
      clearInterval(codeInterval);
    };
  }, []);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const dotSizes = {
    sm: "w-1 h-1",
    md: "w-1.5 h-1.5",
    lg: "w-2 h-2",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-6 ${className}`}
    >
      {/* Algorithm Visualization */}
      <div className="relative">
        <div className={`${sizeClasses[size]} relative`}>
          {/* Binary Tree Structure */}
          <div className="absolute inset-0">
            {/* Root Node */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full dsa-tree-grow border-2 border-primary-foreground">
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-primary-foreground">
                1
              </span>
            </div>

            {/* Level 2 Nodes */}
            <div
              className="absolute top-8 left-1/4 transform -translate-x-1/2 w-3 h-3 bg-secondary rounded-full dsa-tree-grow border border-secondary-foreground"
              style={{ animationDelay: "0.3s" }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-secondary-foreground">
                2
              </span>
            </div>
            <div
              className="absolute top-8 right-1/4 transform translate-x-1/2 w-3 h-3 bg-secondary rounded-full dsa-tree-grow border border-secondary-foreground"
              style={{ animationDelay: "0.6s" }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-secondary-foreground">
                3
              </span>
            </div>

            {/* Level 3 Nodes */}
            <div
              className="absolute bottom-2 left-2 w-2 h-2 bg-accent rounded-full dsa-tree-grow"
              style={{ animationDelay: "0.9s" }}
            ></div>
            <div
              className="absolute bottom-2 left-6 w-2 h-2 bg-accent rounded-full dsa-tree-grow"
              style={{ animationDelay: "1.2s" }}
            ></div>
            <div
              className="absolute bottom-2 right-6 w-2 h-2 bg-accent rounded-full dsa-tree-grow"
              style={{ animationDelay: "1.5s" }}
            ></div>
            <div
              className="absolute bottom-2 right-2 w-2 h-2 bg-accent rounded-full dsa-tree-grow"
              style={{ animationDelay: "1.8s" }}
            ></div>

            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
              <line
                x1="32"
                y1="10"
                x2="16"
                y2="26"
                stroke="currentColor"
                strokeWidth="1"
                className="text-muted-foreground dsa-code-flow"
              />
              <line
                x1="32"
                y1="10"
                x2="48"
                y2="26"
                stroke="currentColor"
                strokeWidth="1"
                className="text-muted-foreground dsa-code-flow"
                style={{ animationDelay: "0.2s" }}
              />
              <line
                x1="16"
                y1="26"
                x2="8"
                y2="42"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-muted-foreground dsa-code-flow"
                style={{ animationDelay: "0.4s" }}
              />
              <line
                x1="16"
                y1="26"
                x2="24"
                y2="42"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-muted-foreground dsa-code-flow"
                style={{ animationDelay: "0.6s" }}
              />
              <line
                x1="48"
                y1="26"
                x2="40"
                y2="42"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-muted-foreground dsa-code-flow"
                style={{ animationDelay: "0.8s" }}
              />
              <line
                x1="48"
                y1="26"
                x2="56"
                y2="42"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-muted-foreground dsa-code-flow"
                style={{ animationDelay: "1.0s" }}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Code Animation */}
      <div className="bg-muted/50 rounded-md px-4 py-2 border">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
        <div className="mt-2 font-mono text-xs text-foreground dsa-algorithm-step">
          {codeSnippets[codeSnippet]}
        </div>
      </div>

      {/* Loading Dots with Brackets */}
      <div className="flex items-center space-x-2 text-primary font-mono">
        <span className="text-lg dsa-code-flow">{`{`}</span>
        <div className="flex space-x-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`${dotSizes[size]} bg-primary rounded-full animate-bounce`}
              style={{ animationDelay: `${i * 0.15}s` }}
            ></div>
          ))}
        </div>
        <span className="text-lg dsa-code-flow">{`}`}</span>
      </div>

      {/* Algorithm Step Text */}
      <div className="text-center max-w-xs">
        <p className="text-sm text-foreground font-mono font-medium">
          {algorithmSteps[currentStep]}
        </p>
        {text && text !== "Loading..." && (
          <p className="text-xs text-muted-foreground mt-2">{text}</p>
        )}
      </div>

      {/* Complexity Indicator */}
      <div className="flex items-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <span className="text-muted-foreground">Time:</span>
          <span className="font-mono text-green-600 dark:text-green-400">
            O(log n)
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-muted-foreground">Space:</span>
          <span className="font-mono text-blue-600 dark:text-blue-400">
            O(1)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-40 h-2 bg-muted rounded-full overflow-hidden border">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-1200 ease-in-out"
          style={{
            width: `${((currentStep + 1) / algorithmSteps.length) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
}

// Full Screen Overlay Loader
export function DSAFullScreenLoader({
  text = "Loading problems...",
}: {
  text?: string;
}) {
  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300">
      <div className="bg-card border rounded-xl p-12 shadow-2xl max-w-md mx-4 transform transition-all duration-300 scale-100">
        <DSALoader size="lg" text={text} />
      </div>
    </div>
  );
}

// Inline Loader for smaller spaces
export function DSAInlineLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <DSALoader size="md" text={text} />
    </div>
  );
}
