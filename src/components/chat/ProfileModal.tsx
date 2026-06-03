"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Check, Sun, Globe, Target, Code, Atom, BookOpen, Briefcase, Palette } from "lucide-react";
import { toast } from "sonner";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userGoal: string;
  onSave: (name: string, goal: string) => void;
}

const goals = [
  { value: "", label: "No preference", icon: Target },
  { value: "coding", label: "Coding", icon: Code },
  { value: "physics", label: "Physics", icon: Atom },
  { value: "research", label: "Research", icon: BookOpen },
  { value: "business", label: "Business", icon: Briefcase },
  { value: "creative", label: "Creative", icon: Palette },
];

export default function ProfileModal({ open, onClose, userName, userGoal, onSave }: ProfileModalProps) {
  const [name, setName] = useState(userName);
  const [goal, setGoal] = useState(userGoal || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    await onSave(name.trim(), goal);
    setSaving(false);
    onClose();
    toast.success("Profile updated!");
  };

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
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-6 mx-4 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {(name || userName || "U").charAt(0).toUpperCase()}
              </div>
            </div>

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

            {/* Goal selector */}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1.5">
                <Target className="w-4 h-4 text-indigo-500" />
                Focus Area
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition"
              >
                {goals.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

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