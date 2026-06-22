"use client";

import React, { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

interface FileUploaderProps {
  onFilesUploaded: (files: { name: string; content: string }[]) => void;
}

const ALLOWED_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".json", ".md"];

export default function FileUploader({ onFilesUploaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(extension);
  };

  const handleFiles = async (files: FileList) => {
    setError(null);
    const validFiles: { name: string; content: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!validateFile(file)) {
        setError(`File "${file.name}" has unsupported extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
        return;
      }

      const content = await file.text();
      validFiles.push({ name: file.name, content });
    }

    onFilesUploaded(validFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.items) {
      const items = Array.from(e.dataTransfer.items);
      
      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            handleFiles([file] as any);
            return;
          }
        } else if (item.kind === "directory") {
          setError("Folder uploads are not supported. Please upload files only.");
          return;
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="relative">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging ? "border-blue-500 bg-blue-500/10" : "border-gray-700 hover:border-gray-600"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-400">
          Drag and drop files here or click to browse
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Allowed: {ALLOWED_EXTENSIONS.join(", ")}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_EXTENSIONS.join(",")}
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded flex items-start gap-2">
          <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
