"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function StartupMessage() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4 flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm text-blue-300">
          Drag and drop project files into the message bar to build your workspace.
        </p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="p-1 hover:bg-blue-800 rounded transition-colors"
      >
        <X className="w-4 h-4 text-blue-400" />
      </button>
    </div>
  );
}
