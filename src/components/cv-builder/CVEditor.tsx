"use client";

import { CVData } from "./templates";

interface CVEditorProps {
  cvData: CVData;
  updateCVData: (updates: Partial<CVData>) => void;
}

export default function CVEditor({ cvData, updateCVData }: CVEditorProps) {
  const updatePersonalInfo = (field: string, value: string) => {
    updateCVData({
      personalInfo: { ...cvData.personalInfo, [field]: value },
    });
  };

  const addExperience = () => {
    updateCVData({
      experience: [
        ...cvData.experience,
        {
          id: Date.now().toString(),
          title: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          description: "",
        },
      ],
    });
  };

  const updateExperience = (id: string, field: string, value: any) => {
    updateCVData({
      experience: cvData.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    });
  };

  const removeExperience = (id: string) => {
    updateCVData({
      experience: cvData.experience.filter((exp) => exp.id !== id),
    });
  };

  const addEducation = () => {
    updateCVData({
      education: [
        ...cvData.education,
        {
          id: Date.now().toString(),
          degree: "",
          school: "",
          location: "",
          startDate: "",
          endDate: "",
          gpa: "",
        },
      ],
    });
  };

  const updateEducation = (id: string, field: string, value: any) => {
    updateCVData({
      education: cvData.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    });
  };

  const removeEducation = (id: string) => {
    updateCVData({
      education: cvData.education.filter((edu) => edu.id !== id),
    });
  };

  const addSkill = () => {
    updateCVData({
      skills: [
        ...cvData.skills,
        { id: Date.now().toString(), name: "", level: 50 },
      ],
    });
  };

  const updateSkill = (id: string, field: string, value: any) => {
    updateCVData({
      skills: cvData.skills.map((skill) =>
        skill.id === id ? { ...skill, [field]: value } : skill
      ),
    });
  };

  const removeSkill = (id: string) => {
    updateCVData({
      skills: cvData.skills.filter((skill) => skill.id !== id),
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          👤 Personal Information
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Full Name"
            value={cvData.personalInfo.fullName}
            onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            type="email"
            placeholder="Email"
            value={cvData.personalInfo.email}
            onChange={(e) => updatePersonalInfo("email", e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={cvData.personalInfo.phone}
            onChange={(e) => updatePersonalInfo("phone", e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Location"
            value={cvData.personalInfo.location}
            onChange={(e) => updatePersonalInfo("location", e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            type="url"
            placeholder="Website"
            value={cvData.personalInfo.website}
            onChange={(e) => updatePersonalInfo("website", e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            type="url"
            placeholder="LinkedIn"
            value={cvData.personalInfo.linkedin}
            onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <textarea
            placeholder="Professional Summary"
            value={cvData.personalInfo.summary}
            onChange={(e) => updatePersonalInfo("summary", e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Experience */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            💼 Work Experience
          </h3>
          <button
            onClick={addExperience}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="space-y-3">
          {cvData.experience.map((exp) => (
            <div
              key={exp.id}
              className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg space-y-3"
            >
              <div className="flex justify-between items-start">
                <input
                  type="text"
                  placeholder="Job Title"
                  value={exp.title}
                  onChange={(e) => updateExperience(exp.id, "title", e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <button
                  onClick={() => removeExperience(exp.id)}
                  className="ml-2 text-red-400 hover:text-red-300 text-sm"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                placeholder="Company"
                value={exp.company}
                onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <input
                type="text"
                placeholder="Location"
                value={exp.location}
                onChange={(e) => updateExperience(exp.id, "location", e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Start Date"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="End Date"
                  value={exp.endDate}
                  onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => updateExperience(exp.id, "current", e.target.checked)}
                  className="rounded bg-slate-700 border-slate-600 text-purple-500 focus:ring-purple-500"
                />
                Currently working here
              </label>
              <textarea
                placeholder="Description"
                value={exp.description}
                onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            🎓 Education
          </h3>
          <button
            onClick={addEducation}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="space-y-3">
          {cvData.education.map((edu) => (
            <div
              key={edu.id}
              className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg space-y-3"
            >
              <div className="flex justify-between items-start">
                <input
                  type="text"
                  placeholder="Degree"
                  value={edu.degree}
                  onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <button
                  onClick={() => removeEducation(edu.id)}
                  className="ml-2 text-red-400 hover:text-red-300 text-sm"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                placeholder="School"
                value={edu.school}
                onChange={(e) => updateEducation(edu.id, "school", e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <input
                type="text"
                placeholder="Location"
                value={edu.location}
                onChange={(e) => updateEducation(edu.id, "location", e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Start Date"
                  value={edu.startDate}
                  onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="End Date"
                  value={edu.endDate}
                  onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="GPA (optional)"
                value={edu.gpa}
                onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            ⚡ Skills
          </h3>
          <button
            onClick={addSkill}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="space-y-3">
          {cvData.skills.map((skill) => (
            <div
              key={skill.id}
              className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg space-y-3"
            >
              <div className="flex justify-between items-start">
                <input
                  type="text"
                  placeholder="Skill Name"
                  value={skill.name}
                  onChange={(e) => updateSkill(skill.id, "name", e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <button
                  onClick={() => removeSkill(skill.id)}
                  className="ml-2 text-red-400 hover:text-red-300 text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Proficiency Level</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={skill.level}
                  onChange={(e) => updateSkill(skill.id, "level", parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="text-right text-sm text-slate-400">{skill.level}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
