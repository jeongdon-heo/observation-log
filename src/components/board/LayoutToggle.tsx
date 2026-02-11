"use client";

import type { LayoutType } from "@/types";
import { LAYOUT_OPTIONS } from "@/types";

interface LayoutToggleProps {
  current: LayoutType;
  onChange: (layout: LayoutType) => void;
}

export default function LayoutToggle({ current, onChange }: LayoutToggleProps) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {LAYOUT_OPTIONS.map((layout) => (
        <button
          key={layout.value}
          onClick={() => onChange(layout.value)}
          title={layout.description}
          className={`px-3 py-1.5 text-sm rounded-md transition font-medium ${
            current === layout.value
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {layout.label}
        </button>
      ))}
    </div>
  );
}
