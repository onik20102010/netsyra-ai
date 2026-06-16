"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function MobileDrawer({ open, onClose, children }: MobileDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-80 max-w-[85vw] z-50 bg-[#252526] border-r border-[#2d2d2d] shadow-2xl"
          >
            <div className="h-12 border-b border-[#2d2d2d] flex items-center justify-between px-3">
              <span className="text-[13px] font-medium text-gray-300">Netsyra IDE</span>
              <button onClick={onClose} className="p-1.5 rounded hover:bg-[#2a2d2e] text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="h-[calc(100%-48px)] overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}