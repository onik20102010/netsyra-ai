// templates/minimal.js — Minimal Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates.minimal = {
  name: 'Minimal',
  description: 'Clean, lots of whitespace',
  miniPreview() {
    return `<div class="mini-cv" style="font-family:'Helvetica',sans-serif;padding:10px;">
      <div style="font-size:7px;font-weight:300;letter-spacing:1px;">John Doe</div>
      <div style="font-size:4px;color:#aaa;margin:1px 0 4px;">Software Engineer</div>
      <div style="border-top:0.5px solid #eee;padding-top:3px;">
        <div style="font-size:4px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Experience</div>
        <div style="font-size:3px;margin:1px 0;">Developer — Tech Corp</div>
        <div style="font-size:4px;color:#999;text-transform:uppercase;margin-top:3px;">Education</div>
      </div>
    </div>`;
  },
  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    return `
      <div style="font-family:'Helvetica Neue','Arial',sans-serif;padding:50px;color:#333;line-height:1.7;max-width:700px;margin:0 auto;">
        <div style="margin-bottom:30px;">
          <h1 style="font-size:28px;font-weight:300;letter-spacing:1px;margin:0;">${escapeHTML(p.fullName)}</h1>
          <p style="font-size:14px;color:#999;margin:4px 0;">${escapeHTML(p.professionalTitle)}</p>
          <p style="font-size:11px;color:#bbb;margin:6px 0;">
            ${[p.email, p.phone, p.location].filter(Boolean).map(escapeHTML).join('  ·  ')}
          </p>
          <p style="font-size:11px;color:#bbb;margin:2px 0;">
            ${[p.linkedin, p.website, p.github].filter(Boolean).map(escapeHTML).join('  ·  ')}
          </p>
        </div>
        ${minSection('Summary', s.text)}
        ${minListSection('Experience', data.experience, exp => `
          <div style="margin-bottom:14px;">
            <span style="font-size:13px;font-weight:500;">${escapeHTML(exp.jobTitle)}</span>
            <span style="font-size:12px;color:#999;"> · ${escapeHTML(exp.company)}</span>
            <div style="font-size:11px;color:#bbb;">${formatDate(exp.startDate)} — ${exp.currentlyWorking?'Present':formatDate(exp.endDate)}</div>
            ${exp.description?`<p style="font-size:12px;color:#666;margin:4px 0;">${escapeHTML(exp.description)}</p>`:''}
            ${exp.achievements?`<p style="font-size:12px;color:#666;margin:4px 0;white-space:pre-line;">${escapeHTML(exp.achievements)}</p>`:''}
          </div>
        `)}
        ${minListSection('Education', data.education, edu => `
          <div style="margin-bottom:10px;">
            <span style="font-size:13px;font-weight:500;">${escapeHTML(edu.degree)}</span>
            <span style="font-size:12px;color:#999;"> · ${escapeHTML(edu.school)}</span>
            <div style="font-size:11px;color:#bbb;">${formatDate(edu.startDate)} — ${formatDate(edu.endDate)}</div>
            ${edu.gpa?`<div style="font-size:11px;color:#bbb;">GPA: ${escapeHTML(edu.gpa)}</div>`:''}
          </div>
        `)}
        ${minTagsSection('Skills', data.skills)}
        ${minListSection('Projects', data.projects, proj => `
          <div style="margin-bottom:10px;">
            <span style="font-size:13px;font-weight:500;">${escapeHTML(proj.name)}</span>
            ${proj.technologies?`<div style="font-size:11px;color:#999;">${escapeHTML(proj.technologies)}</div>`:''}
            ${proj.description?`<p style="font-size:12px;color:#666;margin:3px 0;">${escapeHTML(proj.description)}</p>`:''}
          </div>
        `)}
        ${minListSection('Certifications', data.certifications, c => `
          <div style="margin-bottom:6px;">
            <span style="font-size:12px;font-weight:500;">${escapeHTML(c.name)}</span>
            <span style="font-size:12px;color:#999;"> · ${escapeHTML(c.organization)}</span>
            <span style="font-size:11px;color:#bbb;"> · ${formatDate(c.issueDate)}</span>
          </div>
        `)}
        ${minListSection('Languages', data.languages, l => `
          <span style="font-size:12px;color:#666;margin-right:10px;">${escapeHTML(l.name)}${l.proficiency?' · '+escapeHTML(l.proficiency):''}</span>
        `, true)}
        ${minListSection('Awards', data.awards, a => `
          <div style="margin-bottom:6px;">
            <span style="font-size:12px;font-weight:500;">${escapeHTML(a.title)}</span>
            <span style="font-size:12px;color:#999;"> · ${escapeHTML(a.issuer)}</span>
          </div>
        `)}
        ${minListSection('Volunteer', data.volunteer, v => `
          <div style="margin-bottom:10px;">
            <span style="font-size:13px;font-weight:500;">${escapeHTML(v.role)}</span>
            <span style="font-size:12px;color:#999;"> · ${escapeHTML(v.organization)}</span>
            ${v.description?`<p style="font-size:12px;color:#666;margin:3px 0;">${escapeHTML(v.description)}</p>`:''}
          </div>
        `)}
        ${minListSection('Internships', data.internships, it => `
          <div style="margin-bottom:10px;">
            <span style="font-size:13px;font-weight:500;">${escapeHTML(it.jobTitle)}</span>
            <span style="font-size:12px;color:#999;"> · ${escapeHTML(it.company)}</span>
            ${it.description?`<p style="font-size:12px;color:#666;margin:3px 0;">${escapeHTML(it.description)}</p>`:''}
          </div>
        `)}
        ${minListSection('Publications', data.publications, pub => `
          <div style="margin-bottom:6px;">
            <span style="font-size:12px;font-weight:500;">${escapeHTML(pub.title)}</span>
            <span style="font-size:12px;color:#999;"> · ${escapeHTML(pub.publisher)}</span>
          </div>
        `)}
        ${minListSection('Conferences', data.conferences, c => `
          <div style="margin-bottom:6px;">
            <span style="font-size:12px;font-weight:500;">${escapeHTML(c.name)}</span>
            <span style="font-size:12px;color:#999;"> · ${escapeHTML(c.role)}</span>
          </div>
        `)}
        ${minRefs(data.references)}
        ${minTagsSection('Interests', data.interests)}
        ${minSocial(data.social)}
        ${minCustom(data.custom)}
      </div>
    `;
  }
};

function minSection(title, content) {
  if (!content) return '';
  return `<div style="margin-bottom:25px;"><h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#bbb;margin:0 0 8px;">${title}</h2><p style="font-size:12px;color:#666;white-space:pre-line;">${escapeHTML(content)}</p></div>`;
}

function minListSection(title, items, fn, inline) {
  if (!items || items.length === 0) return '';
  return `<div style="margin-bottom:25px;"><h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#bbb;margin:0 0 8px;">${title}</h2><div>${items.map(fn).join('')}</div></div>`;
}

function minTagsSection(title, items) {
  if (!items || items.length === 0) return '';
  return `<div style="margin-bottom:25px;"><h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#bbb;margin:0 0 8px;">${title}</h2><p style="font-size:12px;color:#666;">${items.map(i => escapeHTML(i.name)).join('  ·  ')}</p></div>`;
}

function minRefs(refs) {
  if (!refs) return '';
  if (refs.placeholder) return `<div style="margin-bottom:25px;"><h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#bbb;margin:0 0 8px;">References</h2><p style="font-size:12px;color:#666;">Available upon request</p></div>`;
  if (!refs.list || refs.list.length === 0) return '';
  return minListSection('References', refs.list, r => `
    <div style="margin-bottom:6px;">
      <span style="font-size:12px;font-weight:500;">${escapeHTML(r.name)}</span>
      <span style="font-size:12px;color:#999;"> · ${escapeHTML(r.title)}, ${escapeHTML(r.company)}</span>
    </div>
  `);
}

function minSocial(social) {
  if (!social) return '';
  const links = Object.entries(social).filter(([k,v]) => v);
  if (links.length === 0) return '';
  return `<div style="margin-bottom:25px;"><h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#bbb;margin:0 0 8px;">Social</h2><p style="font-size:12px;color:#666;">${links.map(([k,v]) => `${escapeHTML(k)}: ${escapeHTML(v)}`).join('  ·  ')}</p></div>`;
}

function minCustom(custom) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items||[]).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return `<div style="margin-bottom:25px;"><h2 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#bbb;margin:0 0 8px;">${escapeHTML(sec.sectionName)}</h2>${items.map(item => `<div style="margin-bottom:6px;"><span style="font-size:12px;font-weight:500;">${escapeHTML(item.title)}</span>${item.description?`<p style="font-size:12px;color:#666;margin:2px 0;">${escapeHTML(item.description)}</p>`:''}</div>`).join('')}</div>`;
  }).join('');
}
