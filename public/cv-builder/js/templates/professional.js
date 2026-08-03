// templates/professional.js — Professional Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates.professional = {
  name: 'Professional',
  description: 'Formal, corporate-ready layout',
  miniPreview() {
    return `<div class="mini-cv" style="font-family:'Arial',sans-serif;padding:8px;">
      <div style="background:#2c3e50;color:#fff;padding:4px;text-align:center;font-size:6px;font-weight:bold;">John Doe</div>
      <div style="text-align:center;font-size:4px;color:#666;margin:2px 0;">Software Engineer | Lahore</div>
      <div style="border-top:1px solid #2c3e50;margin-top:3px;padding-top:3px;">
        <div style="font-size:4px;font-weight:bold;color:#2c3e50;">EXPERIENCE</div>
        <div style="font-size:3px;margin:1px 0;">Developer — Tech Corp</div>
        <div style="font-size:4px;font-weight:bold;color:#2c3e50;margin-top:2px;">EDUCATION</div>
      </div>
    </div>`;
  },
  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    const dark = '#2c3e50';
    const accent = '#3498db';
    return `
      <div style="font-family:'Arial','Helvetica',sans-serif;color:#333;line-height:1.6;word-break:break-word;overflow-wrap:break-word;">
        <div style="background:${dark};color:#fff;padding:25px 30px;text-align:center;">
          <h1 style="font-size:22px;margin:0;font-weight:600;">${escapeHTML(p.fullName)}</h1>
          <p style="font-size:13px;opacity:0.9;margin:4px 0;">${escapeHTML(p.professionalTitle)}</p>
          <p style="font-size:11px;opacity:0.7;margin:4px 0;">
            ${[p.email, p.phone, p.location].filter(Boolean).map(escapeHTML).join('  |  ')}
          </p>
          <p style="font-size:11px;opacity:0.7;margin:2px 0;">
            ${[p.linkedin, p.website, p.github].filter(Boolean).map(escapeHTML).join('  |  ')}
          </p>
        </div>
        <div style="padding:25px 30px;">
          ${proSection('Professional Summary', s.text, dark, accent)}
          ${proListSection('Work Experience', data.experience, dark, accent, exp => `
            <div style="margin-bottom:10px;padding-left:12px;border-left:3px solid ${accent};">
              <strong style="color:${dark};">${escapeHTML(exp.jobTitle)}</strong> at ${escapeHTML(exp.company)}
              <span style="color:#888;font-size:11px;"> — ${formatDate(exp.startDate)} to ${exp.currentlyWorking?'Present':formatDate(exp.endDate)}</span>
              ${exp.employmentType?`<span style="font-size:10px;background:${accent}22;color:${accent};padding:1px 6px;border-radius:3px;margin-left:4px;">${escapeHTML(exp.employmentType)}</span>`:''}
              ${exp.location?`<br><span style="font-size:11px;color:#888;">${escapeHTML(exp.location)}</span>`:''}
              ${exp.description?`<p style="font-size:12px;margin:3px 0;white-space:pre-line;">${escapeHTML(exp.description)}</p>`:''}
              ${exp.achievements?`<ul style="margin:4px 0 0 18px;padding:0;font-size:12px;line-height:1.5;">${exp.achievements.split('\n').filter(Boolean).map(item=>`<li style="margin-bottom:2px;">${escapeHTML(item)}</li>`).join('')}</ul>`:''}
            </div>
          `)}
          ${proListSection('Education', data.education, dark, accent, edu => `
            <div style="margin-bottom:8px;padding-left:12px;border-left:3px solid ${accent};">
              <strong style="color:${dark};">${escapeHTML(edu.degree)}</strong>${edu.fieldOfStudy?', '+escapeHTML(edu.fieldOfStudy):''}
              <br>${escapeHTML(edu.school)} <span style="color:#888;font-size:11px;">— ${formatDate(edu.startDate)} to ${formatDate(edu.endDate)}</span>
              ${edu.gpa?`<br><span style="font-size:11px;">GPA: ${escapeHTML(edu.gpa)}</span>`:''}
              ${edu.description?`<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(edu.description)}</p>`:''}
            </div>
          `)}
          ${proTagsSection('Skills', data.skills, dark, accent)}
          ${proListSection('Projects', data.projects, dark, accent, proj => `
            <div style="margin-bottom:8px;padding-left:12px;border-left:3px solid ${accent};">
              <strong style="color:${dark};">${escapeHTML(proj.name)}</strong>
              ${(proj.startDate||proj.endDate)?`<span style="color:#888;font-size:11px;"> — ${formatDate(proj.startDate)} to ${formatDate(proj.endDate)}</span>`:''}
              ${proj.technologies?`<br><span style="font-size:11px;color:#666;">${escapeHTML(proj.technologies)}</span>`:''}
              ${proj.description?`<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(proj.description)}</p>`:''}
              ${proj.github||proj.liveUrl?`<p style="font-size:11px;color:${accent};word-break:break-all;">${[proj.github,proj.liveUrl].filter(Boolean).map(escapeHTML).join(' | ')}</p>`:''}
            </div>
          `)}
          ${proListSection('Certifications', data.certifications, dark, accent, c => `
            <div style="margin-bottom:6px;padding-left:12px;border-left:3px solid ${accent};">
              <strong style="color:${dark};">${escapeHTML(c.name)}</strong> — ${escapeHTML(c.organization)} <span style="color:#888;font-size:11px;">(${formatDate(c.issueDate)}${c.expiryDate?' – '+formatDate(c.expiryDate):''})</span>
              ${c.credentialId?`<br><span style="font-size:11px;">ID: ${escapeHTML(c.credentialId)}</span>`:''}
              ${c.credentialUrl?`<br><span style="font-size:11px;word-break:break-all;">${escapeHTML(c.credentialUrl)}</span>`:''}
            </div>
          `)}
          ${proListSection('Languages', data.languages, dark, accent, l => `
            <span style="display:inline-block;font-size:12px;margin-right:12px;"><strong style="color:${dark};">${escapeHTML(l.name)}</strong>${l.proficiency?' ('+escapeHTML(l.proficiency)+')':''}</span>
          `, true)}
          ${proListSection('Awards', data.awards, dark, accent, a => `
            <div style="margin-bottom:6px;padding-left:12px;border-left:3px solid ${accent};">
              <strong style="color:${dark};">${escapeHTML(a.title)}</strong> — ${escapeHTML(a.issuer)} <span style="color:#888;font-size:11px;">(${formatDate(a.date)})</span>
              ${a.description?`<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(a.description)}</p>`:''}
            </div>
          `)}
          ${proListSection('Volunteer Experience', data.volunteer, dark, accent, v => `
            <div style="margin-bottom:8px;padding-left:12px;border-left:3px solid ${accent};">
              <strong style="color:${dark};">${escapeHTML(v.role)}</strong> at ${escapeHTML(v.organization)}
              <span style="color:#888;font-size:11px;"> — ${formatDate(v.startDate)} to ${formatDate(v.endDate)}</span>
              ${v.location?`<br><span style="font-size:11px;color:#888;">${escapeHTML(v.location)}</span>`:''}
              ${v.description?`<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(v.description)}</p>`:''}
            </div>
          `)}
          ${proListSection('Internships', data.internships, dark, accent, it => `
            <div style="margin-bottom:8px;padding-left:12px;border-left:3px solid ${accent};">
              <strong style="color:${dark};">${escapeHTML(it.jobTitle)}</strong> at ${escapeHTML(it.company)}
              <span style="color:#888;font-size:11px;"> — ${formatDate(it.startDate)} to ${formatDate(it.endDate)}</span>
              ${it.location?`<br><span style="font-size:11px;color:#888;">${escapeHTML(it.location)}</span>`:''}
              ${it.description?`<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(it.description)}</p>`:''}
            </div>
          `)}
          ${proListSection('Publications', data.publications, dark, accent, pub => `
            <div style="margin-bottom:6px;padding-left:12px;border-left:3px solid ${accent};">
              <strong style="color:${dark};">${escapeHTML(pub.title)}</strong> — ${escapeHTML(pub.publisher)} <span style="color:#888;font-size:11px;">(${formatDate(pub.date)})</span>
              ${pub.doi?`<br><span style="font-size:11px;">DOI: ${escapeHTML(pub.doi)}</span>`:''}
              ${pub.url?`<br><span style="font-size:11px;word-break:break-all;">${escapeHTML(pub.url)}</span>`:''}
            </div>
          `)}
          ${proListSection('Conferences', data.conferences, dark, accent, c => `
            <div style="margin-bottom:6px;padding-left:12px;border-left:3px solid ${accent};">
              <strong style="color:${dark};">${escapeHTML(c.name)}</strong> — ${escapeHTML(c.role)} <span style="color:#888;font-size:11px;">(${formatDate(c.date)})</span>
              ${c.location?`<br><span style="font-size:11px;color:#888;">${escapeHTML(c.location)}</span>`:''}
              ${c.description?`<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(c.description)}</p>`:''}
            </div>
          `)}
          ${proRefs(data.references, dark, accent)}
          ${proTagsSection('Interests', data.interests, dark, accent)}
          ${proSocial(data.social, dark, accent)}
          ${proCustom(data.custom, dark, accent)}
        </div>
      </div>
    `;
  }
};

function proSection(title, content, dark, accent) {
  if (!content) return '';
  return `<div style="margin-bottom:18px;"><h2 style="font-size:14px;color:${dark};text-transform:uppercase;border-bottom:2px solid ${accent};padding-bottom:4px;margin:0 0 8px;">${title}</h2><p style="font-size:12px;white-space:pre-line;">${escapeHTML(content)}</p></div>`;
}

function proListSection(title, items, dark, accent, fn, inline) {
  if (!items || items.length === 0) return '';
  return `<div style="margin-bottom:18px;"><h2 style="font-size:14px;color:${dark};text-transform:uppercase;border-bottom:2px solid ${accent};padding-bottom:4px;margin:0 0 8px;">${title}</h2>${inline?`<div>${items.map(fn).join('')}</div>`:items.map(fn).join('')}</div>`;
}

function proTagsSection(title, items, dark, accent) {
  if (!items || items.length === 0) return '';
  return `<div style="margin-bottom:18px;"><h2 style="font-size:14px;color:${dark};text-transform:uppercase;border-bottom:2px solid ${accent};padding-bottom:4px;margin:0 0 8px;">${title}</h2><div>${items.map(i => `<span style="display:inline-block;font-size:11px;padding:3px 10px;background:${accent}15;color:${dark};border-radius:4px;margin:2px 3px;">${escapeHTML(i.name)}</span>`).join('')}</div></div>`;
}

function proRefs(refs, dark, accent) {
  if (!refs) return '';
  if (refs.placeholder) return `<div style="margin-bottom:18px;"><h2 style="font-size:14px;color:${dark};text-transform:uppercase;border-bottom:2px solid ${accent};padding-bottom:4px;margin:0 0 8px;">References</h2><p style="font-size:12px;">Available upon request</p></div>`;
  if (!refs.list || refs.list.length === 0) return '';
  return proListSection('References', refs.list, dark, accent, r => `
    <div style="margin-bottom:6px;padding-left:12px;border-left:3px solid ${accent};">
      <strong style="color:${dark};">${escapeHTML(r.name)}</strong> — ${escapeHTML(r.title)}, ${escapeHTML(r.company)}
      ${r.email?`<br><span style="font-size:11px;word-break:break-all;">${escapeHTML(r.email)}</span>`:''}
      ${r.phone?`<br><span style="font-size:11px;">${escapeHTML(r.phone)}</span>`:''}
    </div>
  `);
}

function proSocial(social, dark, accent) {
  if (!social) return '';
  const links = Object.entries(social).filter(([k,v]) => v);
  if (links.length === 0) return '';
  return `<div style="margin-bottom:18px;"><h2 style="font-size:14px;color:${dark};text-transform:uppercase;border-bottom:2px solid ${accent};padding-bottom:4px;margin:0 0 8px;">Social Links</h2><p style="font-size:12px;word-break:break-all;">${links.map(([k,v]) => `<strong>${escapeHTML(k)}:</strong> ${escapeHTML(v)}`).join('  |  ')}</p></div>`;
}

function proCustom(custom, dark, accent) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items||[]).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return `<div style="margin-bottom:18px;"><h2 style="font-size:14px;color:${dark};text-transform:uppercase;border-bottom:2px solid ${accent};padding-bottom:4px;margin:0 0 8px;">${escapeHTML(sec.sectionName)}</h2>${items.map(item => `<div style="margin-bottom:6px;padding-left:12px;border-left:3px solid ${accent};"><strong style="color:${dark};">${escapeHTML(item.title)}</strong>${item.description?`<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(item.description)}</p>`:''}</div>`).join('')}</div>`;
  }).join('');
}
