"use client";

import { CVData, atsColorPalettes, atsFonts } from "./templates";

interface CustomizationPanelProps {
  cvData: CVData;
  updateCVData: (updates: Partial<CVData>) => void;
  onClose: () => void;
}

export default function CustomizationPanel({ cvData, updateCVData, onClose }: CustomizationPanelProps) {
  const updateCustomization = (field: string, value: any) => {
    updateCVData({
      customizations: { ...cvData.customizations, [field]: value },
    });
  };

  const fonts = ["Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Playfair Display", "Merriweather"];

  const applyATSPalette = (palette: keyof typeof atsColorPalettes) => {
    const selectedPalette = atsColorPalettes[palette];
    updateCVData({
      customizations: {
        ...cvData.customizations,
        primaryColor: selectedPalette.primary,
        secondaryColor: selectedPalette.secondary,
        textColor: selectedPalette.text,
        atsMode: true,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🎨 Customization Panel
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6">
          {/* ATS Mode Toggle */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-purple-300">ATS Mode</h3>
                <p className="text-sm text-slate-400">Optimize for Applicant Tracking Systems</p>
              </div>
              <button
                onClick={() => updateCustomization("atsMode", !cvData.customizations.atsMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  cvData.customizations.atsMode
                    ? "bg-purple-600 text-white"
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {cvData.customizations.atsMode ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>

          {/* ATS Color Palettes */}
          {cvData.customizations.atsMode && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">ATS Color Palettes</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => applyATSPalette("navy")}
                  className="p-3 bg-[#1E3A5F] rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Navy Professional
                </button>
                <button
                  onClick={() => applyATSPalette("blue")}
                  className="p-3 bg-[#2563EB] rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Blue Professional
                </button>
                <button
                  onClick={() => applyATSPalette("darkGray")}
                  className="p-3 bg-[#333333] rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Dark Gray
                </button>
                <button
                  onClick={() => applyATSPalette("green")}
                  className="p-3 bg-[#0F766E] rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Green Professional
                </button>
                <button
                  onClick={() => applyATSPalette("black")}
                  className="p-3 bg-black rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Black Professional
                </button>
              </div>
            </div>
          )}

          {/* Colors (Hidden in ATS Mode) */}
          {!cvData.customizations.atsMode && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Colors</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={cvData.customizations.primaryColor}
                      onChange={(e) => updateCustomization("primaryColor", e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={cvData.customizations.primaryColor}
                      onChange={(e) => updateCustomization("primaryColor", e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={cvData.customizations.secondaryColor}
                      onChange={(e) => updateCustomization("secondaryColor", e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={cvData.customizations.secondaryColor}
                      onChange={(e) => updateCustomization("secondaryColor", e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Text Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={cvData.customizations.textColor}
                      onChange={(e) => updateCustomization("textColor", e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={cvData.customizations.textColor}
                      onChange={(e) => updateCustomization("textColor", e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Typography */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Typography</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Heading Font</label>
                <select
                  value={cvData.customizations.headingFont}
                  onChange={(e) => updateCustomization("headingFont", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                >
                  {(cvData.customizations.atsMode ? atsFonts : fonts).map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Body Font</label>
                <select
                  value={cvData.customizations.bodyFont}
                  onChange={(e) => updateCustomization("bodyFont", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                >
                  {(cvData.customizations.atsMode ? atsFonts : fonts).map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Size & Spacing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Size & Spacing</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Font Size: {cvData.customizations.fontSize}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="20"
                  value={cvData.customizations.fontSize}
                  onChange={(e) => updateCustomization("fontSize", parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Line Height: {cvData.customizations.spacing}
                </label>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.1"
                  value={cvData.customizations.spacing}
                  onChange={(e) => updateCustomization("spacing", parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Preset Themes (Hidden in ATS Mode) */}
          {!cvData.customizations.atsMode && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Preset Themes</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => updateCustomization("primaryColor", "#6366f1")}
                  className="p-3 bg-indigo-500 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Indigo
                </button>
                <button
                  onClick={() => updateCustomization("primaryColor", "#8b5cf6")}
                  className="p-3 bg-purple-500 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Purple
                </button>
                <button
                  onClick={() => updateCustomization("primaryColor", "#ec4899")}
                  className="p-3 bg-pink-500 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Pink
                </button>
                <button
                  onClick={() => updateCustomization("primaryColor", "#14b8a6")}
                  className="p-3 bg-teal-500 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Teal
                </button>
                <button
                  onClick={() => updateCustomization("primaryColor", "#f59e0b")}
                  className="p-3 bg-amber-500 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Amber
                </button>
                <button
                  onClick={() => updateCustomization("primaryColor", "#10b981")}
                  className="p-3 bg-emerald-500 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Emerald
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={() => {
              updateCVData({
                customizations: {
                  primaryColor: "#6366f1",
                  secondaryColor: "#8b5cf6",
                  textColor: "#1f2937",
                  headingFont: "Inter",
                  bodyFont: "Inter",
                  fontSize: 14,
                  spacing: 1.5,
                  atsMode: false,
                },
              });
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
