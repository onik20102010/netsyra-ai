"use client";

import React, { useState } from "react";
import { Plus, FolderOpen, X } from "lucide-react";

interface SavedProject {
  projectName: string;
  folderStructure: any;
  files: string[];
}

interface ProjectLoaderProps {
  onLoadProject: (project: SavedProject) => void;
}

export default function ProjectLoader({ onLoadProject }: ProjectLoaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/projects/saved");
      const data = await response.json();
      setSavedProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadProjects();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="p-2 hover:bg-gray-800 rounded transition-colors"
        title="Load saved project"
      >
        <Plus className="w-5 h-5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Saved Projects</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-800 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading...</div>
              ) : savedProjects.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No saved projects</div>
              ) : (
                <div className="space-y-2">
                  {savedProjects.map((project, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        onLoadProject(project);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                      <FolderOpen className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-sm font-medium text-white">{project.projectName}</div>
                        <div className="text-xs text-gray-400">{project.files.length} files</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
