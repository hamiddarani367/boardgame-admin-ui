"use client";

import React from "react";
import { SelectInput, SelectValue } from "./SelectInput";

interface BooleanSelectProps {
  value: boolean;
  onChange: (value: boolean) => void;
  placeholder?: string;
  className?: string;
  trueLabel?: string;
  falseLabel?: string;
}

export function BooleanSelect({
  value,
  onChange,
  placeholder = "انتخاب کنید",
  className,
  trueLabel = "فعال",
  falseLabel = "غیرفعال",
}: BooleanSelectProps) {
  const stringValue = value ? "true" : "false";

  const handleChange = (val: SelectValue) => {
    if (typeof val === "string") {
      onChange(val === "true");
    } else if (Array.isArray(val)) {
      onChange(val.includes("true"));
    } else {
      onChange(false);
    }
  };

  return (
    <SelectInput
      options={[
        { value: "true", label: trueLabel },
        { value: "false", label: falseLabel },
      ]}
      value={stringValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      valueKey="value"
      labelKey="label"
    />
  );
}