"use client";
import { Star, AlertTriangle, Lightbulb, Info } from "lucide-react";

export interface ReviewResult {
  security: number;
  performance: number;
  architecture: number;
  maintainability: number;
  overall: number;
  issues: { type: "warning" | "suggestion" | "info"; message: string }[];
}

interface ReviewCardProps {
  review: ReviewResult;
  onDismiss: () => void;
}

export default function ReviewCard({ review, onDismiss }: ReviewCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="mt-2 p-3 bg-[#1a1a2e] border border-[#3c3c4c] rounded-lg text-sm text-gray-300">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium">Code Review Results</span>
        <button onClick={onDismiss} className="text-xs text-gray-500 hover:text-gray-300">
          Dismiss
        </button>
      </div>

      {/* Score table */}
      <div className="mb-3">
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex justify-between bg-[#2d2d3d] p-1 rounded">
            <span>Security</span>
            <span className={getScoreColor(review.security)}>{review.security}/100</span>
          </div>
          <div className="flex justify-between bg-[#2d2d3d] p-1 rounded">
            <span>Performance</span>
            <span className={getScoreColor(review.performance)}>{review.performance}/100</span>
          </div>
          <div className="flex justify-between bg-[#2d2d3d] p-1 rounded">
            <span>Architecture</span>
            <span className={getScoreColor(review.architecture)}>{review.architecture}/100</span>
          </div>
          <div className="flex justify-between bg-[#2d2d3d] p-1 rounded">
            <span>Maintainability</span>
            <span className={getScoreColor(review.maintainability)}>{review.maintainability}/100</span>
          </div>
        </div>
        <div className="text-center mt-2 font-medium">
          <Star size={16} className="inline text-yellow-400 mr-1" />
          Overall Score: {review.overall}/100
        </div>
      </div>

      {/* Issues */}
      {review.issues.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 mb-1">Issues Found</div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {review.issues.map((issue, i) => {
              const Icon = issue.type === "warning" ? AlertTriangle :
                           issue.type === "suggestion" ? Lightbulb : Info;
              const color = issue.type === "warning" ? "text-red-400" :
                            issue.type === "suggestion" ? "text-yellow-400" : "text-blue-400";
              return (
                <div key={i} className={`flex items-start gap-1 text-xs ${color}`}>
                  <Icon size={12} className="mt-0.5 shrink-0" />
                  <span>{issue.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}