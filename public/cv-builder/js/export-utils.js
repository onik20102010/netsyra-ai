/* ==================================================
   Export Utils — TXT, ATS, PNG/JPG, Multi-page PDF
   Additional export formats for CV Builder Pro.
   ================================================== */

const ExportUtils = (function () {

  // ==================== TXT EXPORT ====================
  function exportTXT(cvData) {
    const p = cvData.personal || {};
    const s = cvData.summary || {};
    let txt = '';

    txt += (p.fullName || 'Your Name').toUpperCase() + '\n';
    if (p.professionalTitle) txt += p.professionalTitle + '\n';
    const contact = [p.email, p.phone, p.location].filter(Boolean).join(' | ');
    if (contact) txt += contact + '\n';
    const links = [p.linkedin, p.website, p.github].filter(Boolean).join(' | ');
    if (links) txt += links + '\n';
    txt += '\n';

    if (s.text) {
      txt += 'PROFESSIONAL SUMMARY\n';
      txt += s.text + '\n\n';
    }

    if (cvData.experience && cvData.experience.length) {
      txt += 'WORK EXPERIENCE\n';
      cvData.experience.forEach(exp => {
        txt += '\n' + (exp.jobTitle || '');
        if (exp.company) txt += ' — ' + exp.company;
        txt += '\n' + fmtDate(exp.startDate) + ' — ' + (exp.currentlyWorking ? 'Present' : fmtDate(exp.endDate)) + '\n';
        if (exp.description) txt += exp.description + '\n';
        if (exp.achievements) txt += exp.achievements + '\n';
      });
      txt += '\n';
    }

    if (cvData.education && cvData.education.length) {
      txt += 'EDUCATION\n';
      cvData.education.forEach(edu => {
        txt += '\n' + (edu.degree || '');
        if (edu.fieldOfStudy) txt += ', ' + edu.fieldOfStudy;
        txt += '\n' + (edu.school || '') + '\n';
        txt += fmtDate(edu.startDate) + ' — ' + fmtDate(edu.endDate) + '\n';
      });
      txt += '\n';
    }

    if (cvData.skills && cvData.skills.length) {
      txt += 'SKILLS\n';
      txt += cvData.skills.map(sk => sk.name || sk.skill || sk).join(', ') + '\n\n';
    }

    if (cvData.projects && cvData.projects.length) {
      txt += 'PROJECTS\n';
      cvData.projects.forEach(pr => {
        txt += '\n' + (pr.name || pr.title) + '\n';
        if (pr.description) txt += pr.description + '\n';
      });
      txt += '\n';
    }

    if (cvData.certifications && cvData.certifications.length) {
      txt += 'CERTIFICATIONS\n';
      cvData.certifications.forEach(c => {
        txt += '• ' + (c.name || '');
        if (c.issuer) txt += ' — ' + c.issuer;
        txt += '\n';
      });
      txt += '\n';
    }

    if (cvData.languages && cvData.languages.length) {
      txt += 'LANGUAGES\n';
      txt += cvData.languages.map(l => (l.name || l.language) + ' (' + (l.level || l.proficiency || '') + ')').join(', ') + '\n\n';
    }

    if (cvData.volunteer && cvData.volunteer.length) {
      txt += 'VOLUNTEER EXPERIENCE\n';
      cvData.volunteer.forEach(v => {
        txt += '\n' + (v.role || v.position || '') + ' — ' + (v.organization || '') + '\n';
        if (v.description) txt += v.description + '\n';
      });
      txt += '\n';
    }

    if (cvData.awards && cvData.awards.length) {
      txt += 'AWARDS\n';
      cvData.awards.forEach(a => {
        txt += '• ' + (a.title || a.name || '');
        if (a.issuer) txt += ' — ' + a.issuer;
        txt += '\n';
      });
      txt += '\n';
    }

    if (cvData.interests && cvData.interests.length) {
      txt += 'INTERESTS\n';
      txt += cvData.interests.map(i => i.name || i).join(', ') + '\n\n';
    }

    if (cvData.references && cvData.references.length) {
      txt += 'REFERENCES\n';
      cvData.references.forEach(r => {
        txt += '• ' + (r.name || '') + ' — ' + (r.relationship || '');
        if (r.contact) txt += ' (' + r.contact + ')';
        txt += '\n';
      });
      txt += '\n';
    }

    downloadBlob(new Blob([txt], { type: 'text/plain;charset=utf-8' }), getFileName(p, 'txt'));
    toast('TXT file downloaded');
  }

  // ==================== ATS-FRIENDLY EXPORT ====================
  function exportATS(cvData) {
    const p = cvData.personal || {};
    const s = cvData.summary || {};
    let txt = '';

    // ATS format: plain text, no special chars, standard section headers
    txt += (p.fullName || 'Your Name') + '\n';
    if (p.professionalTitle) txt += p.professionalTitle + '\n';
    if (p.email) txt += p.email + '\n';
    if (p.phone) txt += p.phone + '\n';
    if (p.location) txt += p.location + '\n';
    if (p.linkedin) txt += 'LinkedIn: ' + p.linkedin + '\n';
    if (p.website) txt += 'Website: ' + p.website + '\n';
    if (p.github) txt += 'GitHub: ' + p.github + '\n';
    txt += '\n';

    if (s.text) {
      txt += 'PROFESSIONAL SUMMARY\n';
      txt += s.text + '\n\n';
    }

    if (cvData.experience && cvData.experience.length) {
      txt += 'PROFESSIONAL EXPERIENCE\n';
      cvData.experience.forEach(exp => {
        txt += '\n' + (exp.jobTitle || '') + '\n';
        txt += (exp.company || '') + '\n';
        txt += fmtDate(exp.startDate) + ' to ' + (exp.currentlyWorking ? 'Present' : fmtDate(exp.endDate)) + '\n';
        if (exp.description) {
          exp.description.split('\n').forEach(line => {
            if (line.trim()) txt += '- ' + line.trim() + '\n';
          });
        }
        if (exp.achievements) {
          exp.achievements.split('\n').forEach(line => {
            if (line.trim()) txt += '- ' + line.trim() + '\n';
          });
        }
      });
      txt += '\n';
    }

    if (cvData.education && cvData.education.length) {
      txt += 'EDUCATION\n';
      cvData.education.forEach(edu => {
        txt += '\n' + (edu.degree || '');
        if (edu.fieldOfStudy) txt += ' in ' + edu.fieldOfStudy;
        txt += '\n' + (edu.school || '') + '\n';
        txt += fmtDate(edu.startDate) + ' to ' + fmtDate(edu.endDate) + '\n';
      });
      txt += '\n';
    }

    if (cvData.skills && cvData.skills.length) {
      txt += 'TECHNICAL SKILLS\n';
      txt += cvData.skills.map(sk => sk.name || sk.skill || sk).join(', ') + '\n\n';
    }

    if (cvData.projects && cvData.projects.length) {
      txt += 'PROJECTS\n';
      cvData.projects.forEach(pr => {
        txt += '\n' + (pr.name || pr.title) + '\n';
        if (pr.description) txt += pr.description + '\n';
      });
      txt += '\n';
    }

    if (cvData.certifications && cvData.certifications.length) {
      txt += 'CERTIFICATIONS\n';
      cvData.certifications.forEach(c => {
        txt += '- ' + (c.name || '');
        if (c.issuer) txt += ', ' + c.issuer;
        if (c.date) txt += ', ' + c.date;
        txt += '\n';
      });
      txt += '\n';
    }

    if (cvData.languages && cvData.languages.length) {
      txt += 'LANGUAGES\n';
      cvData.languages.forEach(l => {
        txt += '- ' + (l.name || l.language) + ': ' + (l.level || l.proficiency || 'Conversational') + '\n';
      });
      txt += '\n';
    }

    downloadBlob(new Blob([txt], { type: 'text/plain;charset=utf-8' }), getFileName(p, 'ats.txt'));
    toast('ATS-friendly file downloaded');
  }

  // ==================== PNG / JPG EXPORT ====================
  function exportImage(cvData, templateId, format) {
    const tpl = window.CVTemplates[templateId];
    if (!tpl) { toast('Select a template first'); return; }

    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px;background:#fff;';
    container.innerHTML = tpl.render(cvData);
    document.body.appendChild(container);

    const w = 800;
    const h = container.scrollHeight || 1131;

    const data = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><foreignObject width="100%" height="100%">' +
      '<div xmlns="http://www.w3.org/1999/xhtml" style="width:' + w + 'px;">' +
      container.innerHTML + '</div></foreignObject></svg>';

    document.body.removeChild(container);

    const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = function () {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (format === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      c.toBlob(function (blob) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = getFileName(cvData.personal || {}, format);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        toast(format.toUpperCase() + ' exported');
      }, format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      toast('Image export failed — try PDF instead');
    };
    img.src = url;
  }

  function exportPNG(cvData, templateId) {
    exportImage(cvData, templateId, 'png');
  }

  function exportJPG(cvData, templateId) {
    exportImage(cvData, templateId, 'jpg');
  }

  // ==================== MULTI-PAGE PDF ====================
  function exportMultiPagePDF(cvData, templateId) {
    const tpl = window.CVTemplates[templateId];
    if (!tpl) { toast('Select a template first'); return; }

    const p = cvData.personal || {};
    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px;background:#fff;';
    container.innerHTML = tpl.render(cvData);
    document.body.appendChild(container);

    const fullHeight = container.scrollHeight;
    const pageHeight = 1123; // A4 at ~96dpi
    const pageCount = Math.ceil(fullHeight / pageHeight);
    const pages = [];

    for (let i = 0; i < pageCount; i++) {
      const pageDiv = document.createElement('div');
      pageDiv.style.cssText = 'width:800px;min-height:' + pageHeight + 'px;background:#fff;overflow:hidden;position:relative;';
      pageDiv.innerHTML = container.innerHTML;
      // Apply negative margin to show only the current page portion
      const inner = pageDiv.firstElementChild || pageDiv;
      if (inner) {
        inner.style.marginTop = '-' + (i * pageHeight) + 'px';
        inner.style.maxHeight = pageHeight + 'px';
        inner.style.overflow = 'hidden';
      }
      pages.push(pageDiv.outerHTML);
    }

    document.body.removeChild(container);

    // Build a print-friendly HTML with page breaks
    const printWin = window.open('', '_blank');
    printWin.document.write('<html><head><title>' + esc(p.fullName || 'CV') + ' - PDF</title>');
    printWin.document.write('<style>');
    printWin.document.write('@page { size: A4; margin: 0; }');
    printWin.document.write('body { margin:0; padding:0; }');
    printWin.document.write('.pdf-page { width:100%; page-break-after:always; overflow:hidden; }');
    printWin.document.write('.pdf-page:last-child { page-break-after:auto; }');
    printWin.document.write('</style></head><body>');
    pages.forEach(html => {
      printWin.document.write('<div class="pdf-page">' + html + '</div>');
    });
    printWin.document.write('</body></html>');
    printWin.document.close();
    setTimeout(function () {
      printWin.focus();
      printWin.print();
      setTimeout(function () { printWin.close(); }, 500);
    }, 500);
    toast('Multi-page PDF ready — use browser print dialog');
  }

  // ==================== HELPERS ====================
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function getFileName(p, ext) {
    const name = (p.fullName || 'CV').replace(/[^a-zA-Z0-9]/g, '_');
    return name + '_CV.' + ext;
  }

  function fmtDate(d) {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length < 2) return d;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = parseInt(parts[1]) - 1;
    return (months[m] || '') + ' ' + parts[0];
  }

  function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { exportTXT, exportATS, exportPNG, exportJPG, exportMultiPagePDF };
})();
