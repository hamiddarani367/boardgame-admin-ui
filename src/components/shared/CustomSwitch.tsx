"use client";

import React from "react";

interface CustomSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function CustomSwitch({
  checked,
  onCheckedChange,
  disabled = false,
  size = "md",
}: CustomSwitchProps) {
  const sizes = {
    sm: {
      width: "w-8",
      height: "h-5",
      ball: "h-4 w-4",
      translate: checked ? "right-0.5" : "left-0.5",
    },
    md: {
      width: "w-11",
      height: "h-6",
      ball: "h-5 w-5",
      translate: checked ? "right-1" : "left-1",
    },
    lg: {
      width: "w-14",
      height: "h-8",
      ball: "h-7 w-7",
      translate: checked ? "right-1" : "left-1",
    },
  };

  const currentSize = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex ${currentSize.width} ${currentSize.height} items-center rounded-full
        transition-colors duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${checked ? "bg-green-500 shadow-inner" : "bg-gray-300"}
      `}
    >
      <span
        className={`
          absolute top-1/2 -translate-y-1/2
          ${currentSize.ball}
          ${currentSize.translate}
          inline-block transform rounded-full
          bg-white shadow-md transition-all duration-300 ease-in-out
          ${checked ? "scale-110" : "scale-100"}
        `}
      />
    </button>
  );
}