"use client";

import { cvTemplates } from "./templates";

interface TemplateSelectorProps {
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
}

export default function TemplateSelector({ selectedTemplate, onTemplateChange }: TemplateSelectorProps) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        🎨 Choose Template
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {cvTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateChange(template.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedTemplate === template.id
                ? "border-purple-500 bg-purple-500/20"
                : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
            }`}
          >
            <div className="text-2xl mb-2">📄</div>
            <div className="text-white font-medium text-sm">{template.name}</div>
            <div className="text-slate-400 text-xs mt-1">{template.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
