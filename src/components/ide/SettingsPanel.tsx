// d:\netsyra\src\components\ide\SettingsPanel.tsx
"use client";

import React from "react";
import { useIdeStore } from "@/ide";
import { Search, ToggleLeft, ToggleRight, Settings as SettingsIcon } from "lucide-react";

export function SettingsPanel() {
  const sidebarView = useIdeStore((s) => s.sidebarView);
  const editorConfig = useIdeStore((s) => s.editorConfig);
  const updateEditorConfig = useIdeStore((s) => s.updateEditorConfig);

  // If we are in the Extensions view
  if (sidebarView === "extensions") {
    return (
      <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] p-3 select-none">
        <div className="flex items-center relative mb-4">
          <Search size={14} className="absolute left-2 text-[#6e7681]" />
          <input
            type="text"
            placeholder="Search Extensions"
            className="w-full bg-[#161b22] text-[#e6edf3] text-[13px] py-1.5 pl-7 pr-2 rounded-sm border border-transparent focus:border-[#34e8bb] outline-none placeholder-[#484f58] transition-colors"
          />
        </div>
        
        <div className="flex-1 overflow-auto space-y-3">
          {/* Extension Card 1 */}
          <div className="bg-[#161b22] p-3 rounded-md border border-[#30363d] hover:border-[#34e8bb] transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded bg-[#58a6ff] flex items-center justify-center text-[#0d1117] font-bold text-[10px]">
                TS
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium truncate">TypeScript IntelliSense</div>
                <div className="text-[11px] text-[#6e7681] truncate">Microsoft · 12.4M downloads</div>
                <div className="text-[12px] text-[#8b949e] mt-1 line-clamp-2">
                  TypeScript support for Netsyra IDE. Includes advanced type checking and auto-completion.
                </div>
              </div>
            </div>
          </div>

          {/* Extension Card 2 */}
          <div className="bg-[#161b22] p-3 rounded-md border border-[#30363d] hover:border-[#34e8bb] transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded bg-[#db6d28] flex items-center justify-center text-[#0d1117] font-bold text-[10px]">
                &lt;/&gt;
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium truncate">HTML CSS Support</div>
                <div className="text-[11px] text-[#6e7681] truncate">Microsoft · 8.1M downloads</div>
                <div className="text-[12px] text-[#8b949e] mt-1 line-clamp-2">
                  Rich HTML and CSS language features. Auto-close tags, emmet, and CSS IntelliSense.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Reusable Toggle Row (render function, not a component) ---
  const renderToggleRow = (
    label: string,
    description: string,
    value: boolean,
    onToggle: () => void,
  ) => (
    <div
      className="flex items-center justify-between hover:bg-[#161b22] p-1.5 rounded transition-colors cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex flex-col">
        <span className="text-[13px]">{label}</span>
        <span className="text-[11px] text-[#6e7681]">{description}</span>
      </div>
      {value ? <ToggleRight size={20} className="text-[#34e8bb]" /> : <ToggleLeft size={20} className="text-[#484f58]" />}
    </div>
  );

  // --- Reusable Number Input Row (render function) ---
  const renderNumberRow = (
    label: string,
    description: string,
    value: number,
    onChange: (v: number) => void,
    min = 1,
    max = 100,
  ) => (
    <div className="flex items-center justify-between p-1.5 rounded hover:bg-[#161b22] transition-colors">
      <div className="flex flex-col">
        <span className="text-[13px]">{label}</span>
        <span className="text-[11px] text-[#6e7681]">{description}</span>
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        className="w-16 bg-[#161b22] text-[#e6edf3] text-[13px] px-2 py-1 rounded border border-[#30363d] focus:border-[#34e8bb] outline-none text-right"
      />
    </div>
  );

  // If we are in the Settings view
  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] p-3 select-none overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#1f2428]">
        <SettingsIcon size={16} className="text-[#34e8bb]" />
        <span className="text-[13px] font-medium">Settings</span>
      </div>

      {/* Text Editor Settings Group */}
      <div className="space-y-3">
        <div className="text-[11px] text-[#6e7681] uppercase tracking-wider font-bold">Text Editor</div>

        {renderNumberRow(
          "Font Size",
          "Controls the font size in pixels",
          editorConfig.fontSize,
          (v) => updateEditorConfig({ fontSize: v }),
          6,
          48,
        )}

        {renderNumberRow(
          "Tab Size",
          "Number of spaces per indentation level",
          editorConfig.tabSize,
          (v) => updateEditorConfig({ tabSize: v }),
          1,
          16,
        )}

        <div className="border-t border-[#1f2428] my-2"></div>

        {renderToggleRow(
          "Auto Save",
          "Automatically save files when focus changes",
          editorConfig.autoSave,
          () => updateEditorConfig({ autoSave: !editorConfig.autoSave }),
        )}

        {renderToggleRow(
          "Format on Save",
          "Format code when saving a file",
          editorConfig.formatOnSave,
          () => updateEditorConfig({ formatOnSave: !editorConfig.formatOnSave }),
        )}

        {renderToggleRow(
          "Word Wrap",
          "Wrap long lines to fit the editor width",
          editorConfig.wordWrap === 'on',
          () => updateEditorConfig({ wordWrap: editorConfig.wordWrap === 'on' ? 'off' : 'on' }),
        )}

        <div className="border-t border-[#1f2428] my-2"></div>

        {renderToggleRow(
          "Minimap",
          "Show a code overview on the right side",
          editorConfig.minimap,
          () => updateEditorConfig({ minimap: !editorConfig.minimap }),
        )}

        {renderToggleRow(
          "Line Numbers",
          "Show line numbers in the editor gutter",
          editorConfig.lineNumbers,
          () => updateEditorConfig({ lineNumbers: !editorConfig.lineNumbers }),
        )}

        {renderToggleRow(
          "Bracket Pair Colorization",
          "Colorize matching brackets for readability",
          editorConfig.bracketPairColorization,
          () => updateEditorConfig({ bracketPairColorization: !editorConfig.bracketPairColorization }),
        )}

        {renderToggleRow(
          "Code Folding",
          "Enable folding regions in the editor",
          editorConfig.folding,
          () => updateEditorConfig({ folding: !editorConfig.folding }),
        )}
      </div>
    </div>
  );
}