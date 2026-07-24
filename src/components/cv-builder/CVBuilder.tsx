"use client";

import { useState, useCallback } from "react";
import CVEditor from "./CVEditor";
import CVPreview from "./CVPreview";
import TemplateSelector from "./TemplateSelector";
import InfoForm from "./InfoForm";
import CustomizationPanel from "./CustomizationPanel";
import { cvTemplates, CVData, defaultCVData } from "./templates";

export default function CVBuilder() {
  const [cvData, setCvData] = useState<CVData>(defaultCVData);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [activeTab, setActiveTab] = useState<"editor" | "info" | "templates">("editor");
  const [showCustomization, setShowCustomization] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const updateCVData = useCallback((updates: Partial<CVData>) => {
    setCvData((prev: CVData) => ({ ...prev, ...updates }));
  }, []);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleExportPDF = async () => {
    try {
      const element = document.querySelector('[data-cv-preview="true"]');
      if (!element) {
        alert('CV preview not found');
        return;
      }

      // Dynamic import for jsPDF and html2canvas
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('my-cv.pdf');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleExportPNG = async () => {
    try {
      const element = document.querySelector('[data-cv-preview="true"]');
      if (!element) {
        alert('CV preview not found');
        return;
      }

      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(element as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = 'my-cv.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PNG. Please try again.');
    }
  };

  const handleSave = () => {
    try {
      const dataToSave = {
        cvData,
        selectedTemplate,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('cv-builder-data', JSON.stringify(dataToSave));
      alert('CV saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save CV. Please try again.');
    }
  };

  const handleLoad = () => {
    try {
      const savedData = localStorage.getItem('cv-builder-data');
      if (savedData) {
        const data = JSON.parse(savedData);
        setCvData(data.cvData);
        setSelectedTemplate(data.selectedTemplate);
        alert('CV loaded successfully!');
      } else {
        alert('No saved CV found.');
      }
    } catch (error) {
      console.error('Load failed:', error);
      alert('Failed to load CV. Please try again.');
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left Sidebar - Controls */}
      <div className="hidden md:flex w-80 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50 flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">📄</span>
            CV Builder Pro
          </h1>
          <p className="text-slate-400 text-sm mt-1">Create your professional CV</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab("editor")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "editor"
                ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/10"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            ✏️ Editor
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "info"
                ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/10"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            📝 Info
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "templates"
                ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/10"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            🎨 Templates
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "editor" && (
            <CVEditor cvData={cvData} updateCVData={updateCVData} />
          )}
          {activeTab === "info" && (
            <InfoForm cvData={cvData} updateCVData={updateCVData} />
          )}
          {activeTab === "templates" && (
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onTemplateChange={handleTemplateChange}
            />
          )}
        </div>

        {/* Customization Toggle */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={() => setShowCustomization(!showCustomization)}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            🎨 {showCustomization ? "Hide" : "Show"} Customization
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex flex-col">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">📄</span>
              CV Builder Pro
            </h1>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="text-white text-2xl"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <button
              onClick={() => { setActiveTab("editor"); setShowMobileMenu(false); }}
              className={`w-full py-3 px-4 rounded-lg text-left font-medium transition-colors ${
                activeTab === "editor"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              ✏️ Editor
            </button>
            <button
              onClick={() => { setActiveTab("info"); setShowMobileMenu(false); }}
              className={`w-full py-3 px-4 rounded-lg text-left font-medium transition-colors ${
                activeTab === "info"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              📝 Quick Info
            </button>
            <button
              onClick={() => { setActiveTab("templates"); setShowMobileMenu(false); }}
              className={`w-full py-3 px-4 rounded-lg text-left font-medium transition-colors ${
                activeTab === "templates"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              🎨 Templates
            </button>
            <button
              onClick={() => { setShowCustomization(!showCustomization); setShowMobileMenu(false); }}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              🎨 Customization
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Preview */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 bg-slate-900/30 backdrop-blur-xl border-b border-slate-700/50 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden text-white text-2xl"
            >
              ☰
            </button>
            <span className="text-slate-400 text-xs md:text-sm hidden sm:block">
              Template: <span className="text-white font-medium">{selectedTemplate}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="hidden sm:block px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs md:text-sm font-medium transition-colors">
              💾 Save
            </button>
            <button onClick={handleLoad} className="hidden sm:block px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs md:text-sm font-medium transition-colors">
              📥 Load
            </button>
            <button onClick={handleExportPDF} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors">
              📄 PDF
            </button>
            <button onClick={handleExportPNG} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors">
              🖼️ PNG
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="md:hidden px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              👁️
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden flex border-b border-slate-700/50 bg-slate-900/30">
          <button
            onClick={() => setActiveTab("editor")}
            className={`flex-1 py-3 px-2 text-xs font-medium transition-colors ${
              activeTab === "editor"
                ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/10"
                : "text-slate-400"
            }`}
          >
            ✏️ Editor
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-3 px-2 text-xs font-medium transition-colors ${
              activeTab === "info"
                ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/10"
                : "text-slate-400"
            }`}
          >
            📝 Info
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex-1 py-3 px-2 text-xs font-medium transition-colors ${
              activeTab === "templates"
                ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/10"
                : "text-slate-400"
            }`}
          >
            🎨 Templates
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Mobile Editor/Info/Templates */}
          <div className={`md:hidden flex-1 overflow-y-auto ${showPreview ? 'hidden' : 'block'}`}>
            {activeTab === "editor" && (
              <CVEditor cvData={cvData} updateCVData={updateCVData} />
            )}
            {activeTab === "info" && (
              <InfoForm cvData={cvData} updateCVData={updateCVData} />
            )}
            {activeTab === "templates" && (
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onTemplateChange={handleTemplateChange}
              />
            )}
          </div>

          {/* Preview Area */}
          <div className={`flex-1 overflow-auto p-4 md:p-8 bg-slate-900/20 ${showPreview ? 'block' : 'hidden md:block'}`}>
            <div className="max-w-4xl mx-auto">
              <CVPreview cvData={cvData} template={selectedTemplate} />
            </div>
          </div>
        </div>
      </div>

      {/* Customization Panel */}
      {showCustomization && (
        <CustomizationPanel
          cvData={cvData}
          updateCVData={updateCVData}
          onClose={() => setShowCustomization(false)}
        />
      )}
    </div>
  );
}
