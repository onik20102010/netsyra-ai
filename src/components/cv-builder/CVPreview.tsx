"use client";

import { CVData, atsColorPalettes, atsFontSizes } from "./templates";

interface CVPreviewProps {
  cvData: CVData;
  template: string;
}

export default function CVPreview({ cvData, template }: CVPreviewProps) {
  const { personalInfo, experience, education, skills } = cvData;
  const { primaryColor, secondaryColor, textColor, headingFont, bodyFont, fontSize, spacing, atsMode } = cvData.customizations;

  const isATSTemplate = template.startsWith("ats-") || atsMode;

  const getATSPalette = () => {
    if (template === "ats-navy") return atsColorPalettes.navy;
    if (template === "ats-blue") return atsColorPalettes.blue;
    if (template === "ats-gray") return atsColorPalettes.darkGray;
    if (template === "ats-green") return atsColorPalettes.green;
    if (template === "ats-black") return atsColorPalettes.black;
    return atsColorPalettes.navy;
  };

  const atsPalette = getATSPalette();

  const getTemplateStyles = () => {
    if (isATSTemplate) {
      return {
        container: "bg-white shadow-2xl",
        header: "p-8 pb-4",
        section: "mb-6",
        heading: `text-[${atsPalette.primary}] font-bold mb-4 pb-2 border-b-2 border-[${atsPalette.primary}]`,
        subheading: "font-semibold mb-1",
        text: `text-[${atsPalette.text}]`,
        secondary: `text-[${atsPalette.secondary}]`,
      };
    }

    const baseStyles = {
      fontFamily: bodyFont,
      color: textColor,
      fontSize: `${fontSize}px`,
      lineHeight: spacing,
    };

    switch (template) {
      case "modern":
        return {
          ...baseStyles,
          container: "bg-white shadow-2xl rounded-lg overflow-hidden",
          header: `bg-gradient-to-r from-[${primaryColor}] to-[${secondaryColor}] text-white p-8`,
          section: "mb-6",
          heading: `text-2xl font-bold text-[${primaryColor}] mb-4 pb-2 border-b-2 border-[${primaryColor}]`,
        };
      case "professional":
        return {
          ...baseStyles,
          container: "bg-white shadow-2xl border-2 border-slate-200",
          header: "bg-slate-800 text-white p-8",
          section: "mb-6",
          heading: "text-xl font-bold text-slate-800 mb-3 pb-2 border-b border-slate-300",
        };
      case "creative":
        return {
          ...baseStyles,
          container: "bg-white shadow-2xl rounded-lg overflow-hidden",
          header: `bg-[${primaryColor}] text-white p-8 rounded-b-3xl`,
          section: "mb-6",
          heading: `text-2xl font-bold text-[${secondaryColor}] mb-4`,
        };
      default:
        return {
          ...baseStyles,
          container: "bg-white shadow-2xl",
          header: `bg-[${primaryColor}] text-white p-8`,
          section: "mb-6",
          heading: `text-xl font-bold text-[${primaryColor}] mb-4 pb-2 border-b-2 border-[${primaryColor}]`,
        };
    }
  };

  const styles = getTemplateStyles();

  const renderATSHeader = () => (
    <div className={styles.header}>
      <h1 
        className="font-bold mb-2" 
        style={{ 
          fontFamily: headingFont, 
          fontSize: `${atsFontSizes.name}px`,
          color: atsPalette.text 
        }}
      >
        {personalInfo.fullName || "Your Name"}
      </h1>
      <div className="text-sm mb-4" style={{ color: atsPalette.secondary }}>
        {personalInfo.email && <span className="mr-4">{personalInfo.email}</span>}
        {personalInfo.phone && <span className="mr-4">{personalInfo.phone}</span>}
        {personalInfo.location && <span className="mr-4">{personalInfo.location}</span>}
        {personalInfo.linkedin && <span className="mr-4">{personalInfo.linkedin}</span>}
        {personalInfo.website && <span>{personalInfo.website}</span>}
      </div>
      <hr className="border-2" style={{ borderColor: atsPalette.primary }} />
    </div>
  );

  const renderCreativeHeader = () => (
    <div className={styles.header}>
      <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: headingFont }}>
        {personalInfo.fullName || "Your Name"}
      </h1>
      <div className="flex flex-wrap gap-4 text-sm mt-4">
        {personalInfo.email && (
          <span className="flex items-center gap-1">
            📧 {personalInfo.email}
          </span>
        )}
        {personalInfo.phone && (
          <span className="flex items-center gap-1">
            📱 {personalInfo.phone}
          </span>
        )}
        {personalInfo.location && (
          <span className="flex items-center gap-1">
            📍 {personalInfo.location}
          </span>
        )}
        {personalInfo.website && (
          <span className="flex items-center gap-1">
            🔗 {personalInfo.website}
          </span>
        )}
        {personalInfo.linkedin && (
          <span className="flex items-center gap-1">
            💼 {personalInfo.linkedin}
          </span>
        )}
      </div>
    </div>
  );

  const renderATSSection = (title: string, content: React.ReactNode) => (
    <div className={styles.section}>
      <h2 
        className={styles.heading} 
        style={{ 
          fontFamily: headingFont, 
          fontSize: `${atsFontSizes.sectionHeading}px` 
        }}
      >
        {title}
      </h2>
      {content}
    </div>
  );

  const renderATSExperience = () => (
    <div className="space-y-4">
      {experience.map((exp) => (
        <div key={exp.id}>
          <div className="flex justify-between items-start">
            <div>
              <h3 
                className={styles.subheading} 
                style={{ 
                  fontSize: `${atsFontSizes.jobTitle}px`,
                  color: atsPalette.text 
                }}
              >
                {exp.title}
              </h3>
              <p 
                className="font-bold" 
                style={{ color: atsPalette.primary }}
              >
                {exp.company}
              </p>
            </div>
            <div className="text-right text-sm" style={{ color: atsPalette.secondary }}>
              {exp.startDate} – {exp.current ? "Present" : exp.endDate}
            </div>
          </div>
          {exp.location && (
            <p className="text-sm mb-2" style={{ color: atsPalette.secondary }}>
              {exp.location}
            </p>
          )}
          {exp.description && (
            <div className="text-sm" style={{ color: atsPalette.text, fontSize: `${atsFontSizes.body}px` }}>
              {exp.description.split('\n').map((line, i) => (
                <p key={i} className="mb-1">• {line}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderCreativeExperience = () => (
    <div className="space-y-4">
      {experience.map((exp) => (
        <div key={exp.id} className="border-l-2 pl-4" style={{ borderColor: primaryColor }}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{exp.title}</h3>
              <p className="text-gray-600">{exp.company}</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>{exp.startDate}</p>
              <p>{exp.current ? "Present" : exp.endDate}</p>
            </div>
          </div>
          {exp.location && (
            <p className="text-sm text-gray-500 mt-1">📍 {exp.location}</p>
          )}
          {exp.description && (
            <p className="mt-2 text-gray-700">{exp.description}</p>
          )}
        </div>
      ))}
    </div>
  );

  const renderATSEducation = () => (
    <div className="space-y-4">
      {education.map((edu) => (
        <div key={edu.id}>
          <div className="flex justify-between items-start">
            <div>
              <h3 
                className={styles.subheading} 
                style={{ 
                  fontSize: `${atsFontSizes.jobTitle}px`,
                  color: atsPalette.text 
                }}
              >
                {edu.degree}
              </h3>
              <p 
                className="font-bold" 
                style={{ color: atsPalette.primary }}
              >
                {edu.school}
              </p>
            </div>
            <div className="text-right text-sm" style={{ color: atsPalette.secondary }}>
              {edu.startDate} – {edu.endDate}
            </div>
          </div>
          {edu.location && (
            <p className="text-sm mb-2" style={{ color: atsPalette.secondary }}>
              {edu.location}
            </p>
          )}
          {edu.gpa && (
            <p className="text-sm" style={{ color: atsPalette.secondary }}>
              GPA: {edu.gpa}
            </p>
          )}
        </div>
      ))}
    </div>
  );

  const renderCreativeEducation = () => (
    <div className="space-y-4">
      {education.map((edu) => (
        <div key={edu.id} className="border-l-2 pl-4" style={{ borderColor: primaryColor }}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{edu.degree}</h3>
              <p className="text-gray-600">{edu.school}</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>{edu.startDate}</p>
              <p>{edu.endDate}</p>
            </div>
          </div>
          {edu.location && (
            <p className="text-sm text-gray-500 mt-1">📍 {edu.location}</p>
          )}
          {edu.gpa && (
            <p className="text-sm text-gray-500 mt-1">GPA: {edu.gpa}</p>
          )}
        </div>
      ))}
    </div>
  );

  const renderATSSkills = () => (
    <div className="text-sm" style={{ color: atsPalette.text, fontSize: `${atsFontSizes.body}px` }}>
      {skills.map((skill) => skill.name).join(" • ")}
    </div>
  );

  const renderCreativeSkills = () => (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill.id}
          className="px-3 py-1 rounded-full text-sm font-medium"
          style={{
            backgroundColor: `${primaryColor}20`,
            color: primaryColor,
            border: `1px solid ${primaryColor}`,
          }}
        >
          {skill.name}
        </span>
      ))}
    </div>
  );

  return (
    <div 
      data-cv-preview="true"
      className={`${styles.container} w-full max-w-[210mm] min-h-[297mm] mx-auto`}
      style={{ 
        fontFamily: isATSTemplate ? bodyFont : undefined,
        backgroundColor: isATSTemplate ? atsPalette.background : undefined 
      }}
    >
      {/* Header */}
      {isATSTemplate ? renderATSHeader() : renderCreativeHeader()}

      {/* Content */}
      <div className="p-8" style={{ backgroundColor: isATSTemplate ? atsPalette.background : undefined }}>
        {/* Summary */}
        {personalInfo.summary && (
          isATSTemplate ? (
            renderATSSection("Professional Summary", (
              <p className="text-sm" style={{ color: atsPalette.text, fontSize: `${atsFontSizes.body}px` }}>
                {personalInfo.summary}
              </p>
            ))
          ) : (
            <div className={styles.section}>
              <h2 className={styles.heading} style={{ fontFamily: headingFont }}>
                Professional Summary
              </h2>
              <p className="text-gray-700">{personalInfo.summary}</p>
            </div>
          )
        )}

        {/* Experience */}
        {experience.length > 0 && (
          isATSTemplate ? (
            renderATSSection("Work Experience", renderATSExperience())
          ) : (
            <div className={styles.section}>
              <h2 className={styles.heading} style={{ fontFamily: headingFont }}>
                Work Experience
              </h2>
              {renderCreativeExperience()}
            </div>
          )
        )}

        {/* Education */}
        {education.length > 0 && (
          isATSTemplate ? (
            renderATSSection("Education", renderATSEducation())
          ) : (
            <div className={styles.section}>
              <h2 className={styles.heading} style={{ fontFamily: headingFont }}>
                Education
              </h2>
              {renderCreativeEducation()}
            </div>
          )
        )}

        {/* Skills */}
        {skills.length > 0 && (
          isATSTemplate ? (
            renderATSSection("Skills", renderATSSkills())
          ) : (
            <div className={styles.section}>
              <h2 className={styles.heading} style={{ fontFamily: headingFont }}>
                Skills
              </h2>
              {renderCreativeSkills()}
            </div>
          )
        )}
      </div>
    </div>
  );
}
