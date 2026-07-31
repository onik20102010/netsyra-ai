// templates/modern.js — Modern Template (sidebar layout)
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates.modern = {
  name: 'Modern',
  description: 'Sidebar layout with accent color',
  miniPreview() {
    return `<div class="mini-cv" style="display:flex;padding:0;">
      <div style="width:35%;background:#4a6b8a;color:#fff;padding:6px;font-size:4px;">
        <div style="font-weight:bold;font-size:6px;">John Doe</div>
        <div style="margin-top:3px;">Software Engineer</div>
        <div style="margin-top:4px;">SKILLS</div>
        <div style="margin-top:4px;">CONTACT</div>
      </div>
      <div style="flex:1;padding:6px;font-size:4px;">
        <div style="font-weight:bold;font-size:5px;border-bottom:0.5px solid #4a6b8a;">EXPERIENCE</div>
        <div style="margin-top:2px;">Developer at Tech Corp</div>
        <div style="font-weight:bold;font-size:5px;margin-top:3px;">EDUCATION</div>
      </div>
    </div>`;
  },
  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    const accent = '#4a6b8a';
    return `
      <div style="font-family:'Inter',sans-serif;color:#333;line-height:1.6;display:flex;min-height:600px;">
        <div style="width:35%;background:${accent};color:#fff;padding:30px 20px;">
          ${p.photo && !p.photo.includes('svg') ? `<img src="${p.photo}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;margin:0 auto 15px;display:block;border:3px solid rgba(255,255,255,0.3);">` : ''}
          <h1 style="font-size:20px;margin:0 0 2px;">${escapeHTML(p.fullName)}</h1>
          <p style="font-size:13px;opacity:0.9;margin:0 0 18px;">${escapeHTML(p.professionalTitle)}</p>
          ${modSidebarSection('Contact', [p.email, p.phone, p.location, p.linkedin, p.website, p.github].filter(Boolean))}
          ${modSidebarTags('Skills', data.skills)}
          ${modSidebarList('Languages', data.languages, l => `${escapeHTML(l.name)}${l.proficiency ? ' (' + escapeHTML(l.proficiency) + ')' : ''}`)}
          ${modSidebarTags('Interests', data.interests)}
          ${modSidebarSocial(data.social)}
        </div>
        <div style="flex:1;padding:30px 25px;">
          ${s.text ? `<div style="margin-bottom:18px;"><h2 style="font-size:15px;color:${accent};text-transform:uppercase;margin:0 0 6px;">Summary</h2><p style="font-size:12px;white-space:pre-line;">${escapeHTML(s.text)}</p></div>` : ''}
          ${modMainSection('Work Experience', data.experience, exp => `
            <div style="margin-bottom:10px;">
              <strong style="color:${accent};">${escapeHTML(exp.jobTitle)}</strong> at ${escapeHTML(exp.company)}
              <span style="color:#888;font-size:11px;"> — ${formatDate(exp.startDate)} to ${exp.currentlyWorking?'Present':formatDate(exp.endDate)}</span>
              ${exp.description ? `<p style="font-size:12px;margin:3px 0;">${escapeHTML(exp.description)}</p>` : ''}
              ${exp.achievements ? `<p style="font-size:12px;margin:3px 0;white-space:pre-line;">${escapeHTML(exp.achievements)}</p>` : ''}
            </div>
          `)}
          ${modMainSection('Education', data.education, edu => `
            <div style="margin-bottom:8px;">
              <strong style="color:${accent};">${escapeHTML(edu.degree)}</strong>${edu.fieldOfStudy?', '+escapeHTML(edu.fieldOfStudy):''}
              <br>${escapeHTML(edu.school)} <span style="color:#888;font-size:11px;">— ${formatDate(edu.startDate)} to ${formatDate(edu.endDate)}</span>
              ${edu.gpa?`<br><span style="font-size:11px;">GPA: ${escapeHTML(edu.gpa)}</span>`:''}
            </div>
          `)}
          ${modMainSection('Projects', data.projects, proj => `
            <div style="margin-bottom:8px;">
              <strong style="color:${accent};">${escapeHTML(proj.name)}</strong>
              ${proj.technologies?`<br><span style="font-size:11px;color:#666;">${escapeHTML(proj.technologies)}</span>`:''}
              ${proj.description?`<p style="font-size:12px;margin:2px 0;">${escapeHTML(proj.description)}</p>`:''}
            </div>
          `)}
          ${modMainSection('Certifications', data.certifications, c => `
            <div style="margin-bottom:6px;">
              <strong style="color:${accent};">${escapeHTML(c.name)}</strong> — ${escapeHTML(c.organization)} <span style="color:#888;font-size:11px;">(${formatDate(c.issueDate)})</span>
            </div>
          `)}
          ${modMainSection('Awards', data.awards, a => `
            <div style="margin-bottom:6px;">
              <strong style="color:${accent};">${escapeHTML(a.title)}</strong> — ${escapeHTML(a.issuer)} <span style="color:#888;font-size:11px;">(${formatDate(a.date)})</span>
            </div>
          `)}
          ${modMainSection('Volunteer', data.volunteer, v => `
            <div style="margin-bottom:8px;">
              <strong style="color:${accent};">${escapeHTML(v.role)}</strong> at ${escapeHTML(v.organization)}
              ${v.description?`<p style="font-size:12px;margin:2px 0;">${escapeHTML(v.description)}</p>`:''}
            </div>
          `)}
          ${modMainSection('Internships', data.internships, it => `
            <div style="margin-bottom:8px;">
              <strong style="color:${accent};">${escapeHTML(it.jobTitle)}</strong> at ${escapeHTML(it.company)}
              ${it.description?`<p style="font-size:12px;margin:2px 0;">${escapeHTML(it.description)}</p>`:''}
            </div>
          `)}
          ${modMainSection('Publications', data.publications, pub => `
            <div style="margin-bottom:6px;">
              <strong style="color:${accent};">${escapeHTML(pub.title)}</strong> — ${escapeHTML(pub.publisher)} <span style="color:#888;font-size:11px;">(${formatDate(pub.date)})</span>
            </div>
          `)}
          ${modMainSection('Conferences', data.conferences, c => `
            <div style="margin-bottom:6px;">
              <strong style="color:${accent};">${escapeHTML(c.name)}</strong> — ${escapeHTML(c.role)} <span style="color:#888;font-size:11px;">(${formatDate(c.date)})</span>
            </div>
          `)}
          ${modRefs(data.references, accent)}
          ${modCustom(data.custom, accent)}
        </div>
      </div>
    `;
  }
};

function modSidebarSection(title, items) {
  if (!items || items.length === 0) return '';
  return `<div style="margin-bottom:16px;"><h3 style="font-size:12px;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:3px;margin:0 0 6px;">${title}</h3>${items.map(i => `<p style="font-size:11px;margin:2px 0;word-break:break-all;">${escapeHTML(i)}</p>`).join('')}</div>`;
}

function modSidebarTags(title, items) {
  if (!items || items.length === 0) return '';
  return `<div style="margin-bottom:16px;"><h3 style="font-size:12px;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:3px;margin:0 0 6px;">${title}</h3>${items.map(i => `<span style="display:inline-block;font-size:10px;padding:2px 8px;background:rgba(255,255,255,0.15);border-radius:10px;margin:2px 2px;">${escapeHTML(i.name)}</span>`).join('')}</div>`;
}

function modSidebarList(title, items, fn) {
  if (!items || items.length === 0) return '';
  return `<div style="margin-bottom:16px;"><h3 style="font-size:12px;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:3px;margin:0 0 6px;">${title}</h3>${items.map(i => `<p style="font-size:11px;margin:2px 0;">${fn(i)}</p>`).join('')}</div>`;
}

function modSidebarSocial(social) {
  if (!social) return '';
  const links = Object.entries(social).filter(([k,v]) => v);
  if (links.length === 0) return '';
  return `<div style="margin-bottom:16px;"><h3 style="font-size:12px;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:3px;margin:0 0 6px;">Social</h3>${links.map(([k,v]) => `<p style="font-size:11px;margin:2px 0;word-break:break-all;"><strong>${escapeHTML(k)}:</strong> ${escapeHTML(v)}</p>`).join('')}</div>`;
}

function modMainSection(title, items, fn) {
  if (!items || items.length === 0) return '';
  return `<div style="margin-bottom:18px;"><h2 style="font-size:15px;color:#4a6b8a;text-transform:uppercase;margin:0 0 8px;">${title}</h2>${items.map(fn).join('')}</div>`;
}

function modRefs(refs, accent) {
  if (!refs) return '';
  if (refs.placeholder) return `<div style="margin-bottom:18px;"><h2 style="font-size:15px;color:${accent};text-transform:uppercase;margin:0 0 8px;">References</h2><p style="font-size:12px;">Available upon request</p></div>`;
  if (!refs.list || refs.list.length === 0) return '';
  return modMainSection('References', refs.list, r => `
    <div style="margin-bottom:6px;">
      <strong style="color:${accent};">${escapeHTML(r.name)}</strong> — ${escapeHTML(r.title)}, ${escapeHTML(r.company)}
      ${r.email?`<br><span style="font-size:11px;">${escapeHTML(r.email)}</span>`:''}
    </div>
  `);
}

function modCustom(custom, accent) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items||[]).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return `<div style="margin-bottom:18px;"><h2 style="font-size:15px;color:${accent};text-transform:uppercase;margin:0 0 8px;">${escapeHTML(sec.sectionName)}</h2>${items.map(item => `<div style="margin-bottom:6px;"><strong style="color:${accent};">${escapeHTML(item.title)}</strong>${item.description?`<p style="font-size:12px;margin:2px 0;">${escapeHTML(item.description)}</p>`:''}</div>`).join('')}</div>`;
  }).join('');
}
