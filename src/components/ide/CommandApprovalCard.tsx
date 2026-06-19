"use client";
import { Terminal, Shield, ShieldAlert, ShieldOff, CheckCircle, XCircle } from "lucide-react";

export interface CommandBlock {
  command: string;
  risk: "low" | "medium" | "high" | "blocked";
  status: "pending" | "approved" | "rejected";
}

interface CommandApprovalCardProps {
  commands: CommandBlock[];
  onApprove: (command: string) => void;
  onReject: (command: string) => void;
}

const riskConfig = {
  low:    { icon: Shield,       color: "text-green-400", bg: "bg-green-900/20", label: "Low Risk" },
  medium: { icon: ShieldAlert,  color: "text-yellow-400", bg: "bg-yellow-900/20", label: "Medium Risk" },
  high:   { icon: ShieldOff,    color: "text-red-400", bg: "bg-red-900/20", label: "High Risk" },
  blocked:{ icon: ShieldOff,    color: "text-red-600", bg: "bg-red-900/40", label: "BLOCKED" },
};

export default function CommandApprovalCard({ commands, onApprove, onReject }: CommandApprovalCardProps) {
  if (commands.length === 0) return null;

  return (
    <div className="mt-2 space-y-3">
      {commands.map((cmd, idx) => {
        const config = riskConfig[cmd.risk];
        const Icon = config.icon;
        return (
          <div key={idx} className="p-3 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg text-sm">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Terminal size={16} />
              <span className="font-mono text-blue-400 text-xs">{cmd.command}</span>
              <span className={`ml-auto flex items-center gap-1 text-xs font-medium ${config.color}`}>
                <Icon size={14} /> {config.label}
              </span>
              {cmd.status !== "pending" && (
                <span className={cmd.status === "approved" ? "text-green-400 text-xs" : "text-red-400 text-xs"}>
                  {cmd.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                </span>
              )}
            </div>
            <pre className="text-gray-300 mt-1 text-xs whitespace-pre-wrap bg-[#2d2d2d] p-2 rounded">
              {cmd.command}
            </pre>
            {cmd.status === "pending" && cmd.risk !== "blocked" && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onApprove(cmd.command)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-700 text-white rounded hover:bg-green-600 text-xs font-medium"
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button
                  onClick={() => onReject(cmd.command)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-800 text-white rounded hover:bg-red-700 text-xs font-medium"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            )}
            {cmd.risk === "blocked" && (
              <div className="mt-2 bg-red-900/40 border border-red-800 rounded p-2 text-xs text-red-400">
                ⛔ This command is blocked for safety and cannot be executed.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}