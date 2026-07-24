"use client";

import { CVData } from "./templates";

interface InfoFormProps {
  cvData: CVData;
  updateCVData: (updates: Partial<CVData>) => void;
}

export default function InfoForm({ cvData, updateCVData }: InfoFormProps) {
  const updatePersonalInfo = (field: string, value: string) => {
    updateCVData({
      personalInfo: { ...cvData.personalInfo, [field]: value },
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">📝 Quick Information Entry</h3>
        <p className="text-slate-400 text-sm">Paste your information here for quick CV creation</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Paste Your Full Information
          </label>
          <textarea
            placeholder="Paste your complete CV information here. Include your name, contact details, experience, education, skills, etc. The system will help organize this information."
            className="w-full h-64 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <button className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
            ✨ Auto-Organize Information
          </button>
        </div>

        <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Quick Fill Templates</h4>
          <div className="space-y-2">
            <button className="w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm text-left transition-colors">
              💼 Software Engineer Template
            </button>
            <button className="w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm text-left transition-colors">
              🎨 Designer Template
            </button>
            <button className="w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm text-left transition-colors">
              📊 Marketing Template
            </button>
            <button className="w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm text-left transition-colors">
              🎓 Fresh Graduate Template
            </button>
          </div>
        </div>

        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <h4 className="text-sm font-medium text-purple-300 mb-2">💡 Tips</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Use the Editor tab for detailed customization</li>
            <li>• Choose from 30 professional templates</li>
            <li>• Customize colors, fonts, and spacing</li>
            <li>• Export as PDF or PNG when ready</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
