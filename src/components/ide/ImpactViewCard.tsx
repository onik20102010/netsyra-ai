"use client";
import { GitBranch, AlertTriangle, CheckCircle, Shield } from "lucide-react";

interface ImpactViewCardProps {
  dependencyTree: string;       // raw tree text
  riskLevel: "Low" | "Medium" | "High";
  filesAffected: number;
  breakingAreas: string[];
  unchangedFiles: string[];
}

const riskColors = {
  Low: "text-green-400 border-green-800 bg-green-900/20",
  Medium: "text-yellow-400 border-yellow-800 bg-yellow-900/20",
  High: "text-red-400 border-red-800 bg-red-900/20",
};

export default function ImpactViewCard({
  dependencyTree,
  riskLevel,
  filesAffected,
  breakingAreas,
  unchangedFiles,
}: ImpactViewCardProps) {
  return (
    <div className="mt-2 p-3 bg-[#1a1a2e] border border-[#3c3c4c] rounded-lg text-sm text-gray-300">
      <div className="flex items-center gap-2 mb-3">
        <GitBranch size={16} className="text-blue-400" />
        <span className="font-medium">Impact Analysis</span>
        <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium border ${riskColors[riskLevel]}`}>
          <AlertTriangle size={12} className="inline mr-1" />
          {riskLevel} Risk
        </span>
      </div>

      {/* Dependency tree */}
      <div className="mb-3">
        <pre className="text-xs font-mono text-gray-300 bg-[#2d2d3d] p-2 rounded whitespace-pre-wrap">
          {dependencyTree}
        </pre>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[#2d2d3d] p-2 rounded">
          <div className="text-lg font-bold text-white">{filesAffected}</div>
          <div className="text-xs text-gray-400">Files Affected</div>
        </div>
        <div className="bg-[#2d2d3d] p-2 rounded">
          <div className="text-lg font-bold text-white">{breakingAreas.length}</div>
          <div className="text-xs text-gray-400">Breaking Areas</div>
        </div>
      </div>

      {/* Breaking areas */}
      {breakingAreas.length > 0 && (
        <div className="mb-2">
          <div className="text-xs text-red-400 font-medium mb-1">Possible Breaking Areas</div>
          {breakingAreas.map((area, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-gray-300 ml-2">
              <AlertTriangle size={10} className="text-yellow-400" />
              {area}
            </div>
          ))}
        </div>
      )}

      {/* Unchanged files */}
      {unchangedFiles.length > 0 && (
        <div>
          <div className="text-xs text-green-400 font-medium mb-1">Files That Will NOT Change</div>
          {unchangedFiles.slice(0, 5).map((file, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-gray-400 ml-2">
              <CheckCircle size={10} className="text-green-500" />
              {file}
            </div>
          ))}
          {unchangedFiles.length > 5 && (
            <div className="text-xs text-gray-500 ml-2">+{unchangedFiles.length - 5} more</div>
          )}
        </div>
      )}
    </div>
  );
}