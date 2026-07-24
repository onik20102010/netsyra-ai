export interface CVData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
    summary: string;
    photo?: string;
  };
  experience: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    id: string;
    degree: string;
    school: string;
    location: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }>;
  skills: Array<{
    id: string;
    name: string;
    level: number;
  }>;
  languages: Array<{
    id: string;
    name: string;
    proficiency: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
  }>;
  customizations: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    headingFont: string;
    bodyFont: string;
    fontSize: number;
    spacing: number;
    atsMode: boolean;
  };
}

export const defaultCVData: CVData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    summary: "",
  },
  experience: [],
  education: [],
  skills: [],
  languages: [],
  projects: [],
  certifications: [],
  customizations: {
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    textColor: "#1f2937",
    headingFont: "Inter",
    bodyFont: "Inter",
    fontSize: 14,
    spacing: 1.5,
    atsMode: false,
  },
};

export const atsColorPalettes = {
  navy: {
    primary: "#1E3A5F",
    text: "#111111",
    secondary: "#555555",
    background: "#FFFFFF",
    name: "Navy Professional"
  },
  blue: {
    primary: "#2563EB",
    text: "#111111",
    secondary: "#666666",
    background: "#FFFFFF",
    name: "Blue Professional"
  },
  darkGray: {
    primary: "#333333",
    text: "#111111",
    secondary: "#666666",
    background: "#FFFFFF",
    name: "Dark Gray"
  },
  green: {
    primary: "#0F766E",
    text: "#000000",
    secondary: "#666666",
    background: "#FFFFFF",
    name: "Green Professional"
  },
  black: {
    primary: "#000000",
    text: "#111111",
    secondary: "#555555",
    background: "#FFFFFF",
    name: "Black Professional"
  }
};

export const atsFonts = [
  "Inter",
  "Calibri",
  "Aptos",
  "Helvetica",
  "Arial",
  "Roboto",
  "Source Sans Pro"
];

export const atsFontSizes = {
  name: 32,
  sectionHeading: 17,
  jobTitle: 14,
  body: 11
};

export const cvTemplates = [
  // ATS Templates (First 5 - ATS Compliant)
  { id: "ats-navy", name: "ATS Navy", description: "ATS-friendly navy professional" },
  { id: "ats-blue", name: "ATS Blue", description: "ATS-friendly blue professional" },
  { id: "ats-gray", name: "ATS Gray", description: "ATS-friendly dark gray" },
  { id: "ats-green", name: "ATS Green", description: "ATS-friendly green professional" },
  { id: "ats-black", name: "ATS Black", description: "ATS-friendly black professional" },
  // Creative Templates
  { id: "modern", name: "Modern", description: "Clean and contemporary design" },
  { id: "professional", name: "Professional", description: "Classic corporate style" },
  { id: "creative", name: "Creative", description: "Bold and artistic layout" },
  { id: "minimal", name: "Minimal", description: "Simple and elegant" },
  { id: "executive", name: "Executive", description: "Senior-level professional" },
  { id: "tech", name: "Tech", description: "Modern tech industry style" },
  { id: "academic", name: "Academic", description: "Research and academic focus" },
  { id: "startup", name: "Startup", description: "Dynamic and innovative" },
  { id: "corporate", name: "Corporate", description: "Traditional business format" },
  { id: "design", name: "Design", description: "Visually stunning layout" },
  { id: "developer", name: "Developer", description: "Software engineer focused" },
  { id: "marketing", name: "Marketing", description: "Marketing professional style" },
  { id: "finance", name: "Finance", description: "Financial services format" },
  { id: "healthcare", name: "Healthcare", description: "Medical professional style" },
  { id: "legal", name: "Legal", description: "Law firm appropriate" },
  { id: "education", name: "Education", description: "Teaching and academic" },
  { id: "sales", name: "Sales", description: "Sales focused layout" },
  { id: "consulting", name: "Consulting", description: "Consultant professional" },
  { id: "engineering", name: "Engineering", description: "Engineer focused" },
  { id: "data", name: "Data Science", description: "Data analyst style" },
  { id: "product", name: "Product", description: "Product manager format" },
  { id: "hr", name: "HR", description: "Human resources style" },
  { id: "operations", name: "Operations", description: "Operations manager" },
  { id: "management", name: "Management", description: "Management level" },
  { id: "entry", name: "Entry Level", description: "For fresh graduates" },
  { id: "senior", name: "Senior", description: "Experienced professional" },
  { id: "freelance", name: "Freelance", description: "Independent contractor" },
  { id: "remote", name: "Remote", description: "Remote worker focused" },
  { id: "international", name: "International", description: "Global professional" },
  { id: "classic", name: "Classic", description: "Timeless traditional design" },
];
