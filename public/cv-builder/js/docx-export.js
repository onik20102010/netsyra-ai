/* ==================================================
   DOCX Export
   Exports the CV as a Word-compatible .doc file
   using HTML-to-Word format (no external libs).
   ================================================== */

const DOCXExport = (function () {

  function exportDoc(cvData, templateId) {
    const tpl = window.CVTemplates[templateId];
    const p = cvData.personal || {};
    const name = p.fullName || "CV";

    let bodyHtml;
    if (tpl) {
      // Render template but strip inline styles that cause Word issues
      const raw = tpl.render(cvData);
      bodyHtml = stripProblematicStyles(raw);
    } else {
      bodyHtml = buildPlainHtml(cvData);
    }

    const html = buildWordHtml(bodyHtml, name);
    downloadDoc(html, name);
  }

  function buildPlainHtml(cvData) {
    const p = cvData.personal || {};
    const s = cvData.summary || {};
    let html = "";

    // Header
    html += `<h1 style="font-size:22pt;color:#1a1a1a;text-align:center;margin-bottom:4pt;">${esc(p.fullName)}</h1>`;
    if (p.professionalTitle) html += `<p style="font-size:12pt;color:#555;text-align:center;margin-bottom:8pt;">${esc(p.professionalTitle)}</p>`;
    const contact = [p.email, p.phone, p.location].filter(Boolean).map(esc).join(" | ");
    if (contact) html += `<p style="font-size:10pt;color:#777;text-align:center;margin-bottom:16pt;">${contact}</p>`;
    const links = [p.linkedin, p.website, p.github].filter(Boolean).map(esc).join(" | ");
    if (links) html += `<p style="font-size:10pt;color:#777;text-align:center;margin-bottom:16pt;">${links}</p>`;

    // Summary
    if (s.text) {
      html += sectionHeader("Professional Summary");
      html += `<p style="font-size:11pt;line-height:1.5;margin-bottom:12pt;">${esc(s.text)}</p>`;
    }

    // Experience
    if (cvData.experience && cvData.experience.length) {
      html += sectionHeader("Work Experience");
      cvData.experience.forEach(exp => {
        html += `<p style="margin-bottom:2pt;"><strong style="font-size:12pt;">${esc(exp.jobTitle)}</strong>`;
        if (exp.company) html += ` at <span style="font-size:11pt;">${esc(exp.company)}</span>`;
        html += "</p>";
        const dates = `${formatDate(exp.startDate)} - ${exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}`;
        html += `<p style="font-size:10pt;color:#777;margin-bottom:4pt;">${dates}</p>`;
        if (exp.description) html += `<p style="font-size:11pt;line-height:1.4;margin-bottom:4pt;">${esc(exp.description)}</p>`;
        if (exp.achievements) html += `<p style="font-size:11pt;line-height:1.4;margin-bottom:8pt;">${esc(exp.achievements)}</p>`;
      });
    }

    // Education
    if (cvData.education && cvData.education.length) {
      html += sectionHeader("Education");
      cvData.education.forEach(edu => {
        html += `<p style="margin-bottom:2pt;"><strong style="font-size:12pt;">${esc(edu.degree)}</strong>`;
        if (edu.fieldOfStudy) html += `, <span style="font-size:11pt;">${esc(edu.fieldOfStudy)}</span>`;
        html += "</p>";
        html += `<p style="font-size:11pt;margin-bottom:2pt;">${esc(edu.school)}</p>`;
        html += `<p style="font-size:10pt;color:#777;margin-bottom:8pt;">${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}</p>`;
      });
    }

    // Skills
    if (cvData.skills && cvData.skills.length) {
      html += sectionHeader("Skills");
      const skills = cvData.skills.map(sk => esc(sk.name || sk.skill || sk)).join(" · ");
      html += `<p style="font-size:11pt;line-height:1.5;margin-bottom:12pt;">${skills}</p>`;
    }

    // Projects
    if (cvData.projects && cvData.projects.length) {
      html += sectionHeader("Projects");
      cvData.projects.forEach(pr => {
        html += `<p style="margin-bottom:2pt;"><strong style="font-size:12pt;">${esc(pr.name || pr.title)}</strong></p>`;
        if (pr.description) html += `<p style="font-size:11pt;line-height:1.4;margin-bottom:8pt;">${esc(pr.description)}</p>`;
      });
    }

    // Certifications
    if (cvData.certifications && cvData.certifications.length) {
      html += sectionHeader("Certifications");
      cvData.certifications.forEach(c => {
        html += `<p style="font-size:11pt;margin-bottom:4pt;"><strong>${esc(c.name)}</strong>`;
        if (c.issuer) html += ` — ${esc(c.issuer)}`;
        html += "</p>";
      });
    }

    // Languages
    if (cvData.languages && cvData.languages.length) {
      html += sectionHeader("Languages");
      const langs = cvData.languages.map(l => `${esc(l.name || l.language)} (${esc(l.level || l.proficiency || "")})`).join(" · ");
      html += `<p style="font-size:11pt;line-height:1.5;margin-bottom:12pt;">${langs}</p>`;
    }

    // Volunteer
    if (cvData.volunteer && cvData.volunteer.length) {
      html += sectionHeader("Volunteer Experience");
      cvData.volunteer.forEach(v => {
        html += `<p style="margin-bottom:2pt;"><strong style="font-size:12pt;">${esc(v.role || v.position)}</strong> at ${esc(v.organization)}</p>`;
        if (v.description) html += `<p style="font-size:11pt;line-height:1.4;margin-bottom:8pt;">${esc(v.description)}</p>`;
      });
    }

    // Awards
    if (cvData.awards && cvData.awards.length) {
      html += sectionHeader("Awards");
      cvData.awards.forEach(a => {
        html += `<p style="font-size:11pt;margin-bottom:4pt;"><strong>${esc(a.title || a.name)}</strong>`;
        if (a.issuer) html += ` — ${esc(a.issuer)}`;
        html += "</p>";
      });
    }

    // Interests
    if (cvData.interests && cvData.interests.length) {
      html += sectionHeader("Interests");
      const ints = cvData.interests.map(i => esc(i.name || i)).join(" · ");
      html += `<p style="font-size:11pt;line-height:1.5;margin-bottom:12pt;">${ints}</p>`;
    }

    // References
    if (cvData.references && cvData.references.length) {
      html += sectionHeader("References");
      cvData.references.forEach(r => {
        html += `<p style="font-size:11pt;margin-bottom:6pt;"><strong>${esc(r.name)}</strong> — ${esc(r.relationship || "")}`;
        if (r.contact) html += ` (${esc(r.contact)})`;
        html += "</p>";
      });
    }

    return html;
  }

  function sectionHeader(title) {
    return `<h2 style="font-size:14pt;color:#2c3e50;border-bottom:1.5pt solid #2c3e50;padding-bottom:3pt;margin-top:18pt;margin-bottom:8pt;">${title}</h2>`;
  }

  function stripProblematicStyles(html) {
    // Remove flexbox and grid that Word doesn't support
    let cleaned = html
      .replace(/display:\s*flex[^;]*;?/gi, "display:block;")
      .replace(/display:\s*grid[^;]*;?/gi, "display:block;")
      .replace(/flex-shrink:\s*[^;]*;?/gi, "")
      .replace(/flex-direction:\s*[^;]*;?/gi, "")
      .replace(/flex:\s*[^;]*;?/gi, "")
      .replace(/gap:\s*[^;]*;?/gi, "")
      .replace(/min-height:\s*[^;]*;?/gi, "")
      .replace(/max-width:\s*[^;]*;?/gi, "")
      .replace(/box-shadow:\s*[^;]*;?/gi, "")
      .replace(/clip-path:\s*[^;]*;?/gi, "")
      .replace(/object-fit:\s*[^;]*;?/gi, "");

    return cleaned;
  }

  function buildWordHtml(bodyContent, name) {
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Netsyra CV Builder">
<meta name="Originator" content="Microsoft Word 15">
<title>${esc(name)} - CV</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page { margin: 1in; }
body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.5; }
h1 { font-size: 22pt; margin: 0 0 4pt 0; }
h2 { font-size: 14pt; margin: 18pt 0 8pt 0; }
h3 { font-size: 12pt; margin: 12pt 0 4pt 0; }
p { margin: 0 0 6pt 0; }
img { max-width: 100pt; max-height: 100pt; }
table { border-collapse: collapse; width: 100%; }
</style>
</head>
<body>
${bodyContent}
</body>
</html>`;
  }

  function downloadDoc(html, name) {
    const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^a-zA-Z0-9]/g, "_")}_CV.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("DOCX file downloaded");
  }

  function esc(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(d) {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length < 2) return d;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = parseInt(parts[1]) - 1;
    return `${months[m] || ""} ${parts[0]}`;
  }

  return { exportDoc };
})();
