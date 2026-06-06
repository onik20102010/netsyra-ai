"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Check, Sun, Globe, Plus } from "lucide-react";
import { toast } from "sonner";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userGoal: string;
  onSave: (name: string, goal: string) => void;
}

const PRESET_GOALS = [
  { value: "coding",           label: "💻 Coding" },
  { value: "physics",          label: "🔬 Physics" },
  { value: "complex-math",     label: "📐 Complex Math" },
  { value: "debugging",        label: "🐛 Debugging" },
  { value: "astronomy",        label: "🔭 Astronomy" },
  { value: "science",          label: "🧪 Science" },
  { value: "doctor",           label: "🩺 Doctor" },
  { value: "contractor",       label: "🏗️ Contractor" },
  { value: "business",         label: "💼 Business" },
  { value: "marketing",        label: "📈 Marketing" },
  { value: "creative",         label: "🎨 Creative" },
  { value: "research",         label: "📚 Research" },
  { value: "teaching",         label: "🎓 Teaching" },
  { value: "engineering",      label: "⚙️ Engineering" },
  { value: "ai-ml",            label: "🤖 AI / ML" },
  { value: "biology",          label: "🧬 Biology" },
  { value: "electronics",      label: "⚡ Electronics" },
  { value: "game-dev",         label: "🎮 Game Dev" },
  { value: "mobile-apps",      label: "📱 Mobile Apps" },
  { value: "web-dev",          label: "🌐 Web Development" },
  { value: "finance",          label: "💰 Finance" },
  { value: "writing",          label: "📝 Writing" },
];

export default function ProfileModal({ open, onClose, userName, userGoal, onSave }: ProfileModalProps) {
  const [name, setName] = useState(userName);
  const [goal, setGoal] = useState(userGoal || "");
  const [customGoal, setCustomGoal] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    const finalGoal = goal === "other" ? customGoal.trim() : goal;
    await onSave(name.trim(), finalGoal);
    setSaving(false);
    onClose();
    toast.success("Profile updated!");
  };

  // Determine if a preset is selected, or if we're in custom mode
  const isPresetSelected = PRESET_GOALS.some(g => g.value === goal);
  const isCustom = goal === "other" || (!isPresetSelected && goal.length > 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg p-6 mx-4 space-y-6 max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {(name || userName || "U").charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Name input */}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1.5">
                <User className="w-4 h-4 text-indigo-500" />
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition"
              />
            </div>

            {/* Focus Area – chip grid */}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                Focus Area
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Your AI will adapt its tone and style to match your selected field.
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_GOALS.map((g) => {
                  const isSelected = goal === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => {
                        setGoal(g.value);
                        setShowCustomInput(false);
                        setCustomGoal("");
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        isSelected
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {g.label}
                    </button>
                  );
                })}
                {/* Custom trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setGoal("other");
                    setShowCustomInput(true);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    isCustom
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" />
                  Other
                </button>
              </div>
              {/* Custom input */}
              {showCustomInput && (
                <input
                  type="text"
                  value={customGoal}
                  onChange={(e) => {
                    setCustomGoal(e.target.value);
                    setGoal("other");
                  }}
                  placeholder="Type your own focus..."
                  className="mt-3 w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition"
                  autoFocus
                />
              )}
            </div>

            {/* Theme & Language */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-gray-400" /> Theme
                </span>
                <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">Light</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" /> Language
                </span>
                <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">English</span>
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition disabled:opacity-50 shadow-sm"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  Save Changes
                </span>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}