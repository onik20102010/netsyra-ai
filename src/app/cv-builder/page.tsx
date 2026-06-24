"use client";

export default function CVBuilderPage() {
  return (
    <div className="w-full h-screen">
      <iframe
        src="/cv-builder/index.html"
        className="w-full h-full border-0"
        title="CV Builder Pro"
      />
    </div>
  );
}
