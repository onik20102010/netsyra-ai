"use client";

import { useState } from "react";
import CVBuilder from "@/components/cv-builder/CVBuilder";

export default function CVBuilderPage() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <CVBuilder />
    </div>
  );
}
