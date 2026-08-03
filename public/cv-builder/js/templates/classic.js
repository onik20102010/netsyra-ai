// templates/classic.js — Classic Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates.classic = {
  name: 'Classic',
  description: 'Clean, traditional layout',
  miniPreview() {
    return `<div class="mini-cv" style="font-family:serif;text-align:center;">
      <div style="font-size:8px;font-weight:bold;border-bottom:1px solid #333;padding-bottom:3px;">John Doe</div>
      <div style="font-size:5px;color:#666;margin:3px 0;">Software Engineer</div>
      <div style="text-align:left;margin-top:4px;">
        <div style="font-weight:bold;border-bottom:0.5px solid #ccc;font-size:5px;">EXPERIENCE</div>
        <div style="font-size:4px;margin:2px 0;">Developer at Tech Corp</div>
        <div style="font-weight:bold;border-bottom:0.5px solid #ccc;font-size:5px;margin-top:3px;">EDUCATION</div>
        <div style="font-size:4px;margin:2px 0;">BS Computer Science</div>
      </div>
    </div>`;
  },
  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    return `
      <div style="font-family:'Georgia','Times New Roman',serif;padding:40px;color:#222;line-height:1.6;word-break:break-word;overflow-wrap:break-word;">
        <div style="text-align:center;border-bottom:2px solid #333;padding-bottom:12px;margin-bottom:20px;">
          <h1 style="font-size:24px;margin:0;">${escapeHTML(p.fullName)}</h1>
          <p style="font-size:14px;color:#555;margin:4px 0;">${escapeHTML(p.professionalTitle)}</p>
          <p style="font-size:11px;color:#777;margin:4px 0;">
            ${[p.email, p.phone, p.location].filter(Boolean).map(escapeHTML).join(' | ')}
          </p>
          <p style="font-size:11px;color:#777;margin:2px 0;">
            ${[p.linkedin, p.website, p.github].filter(Boolean).map(escapeHTML).join(' | ')}
          </p>
        </div>
        ${tplSection('Professional Summary', s.text)}
        ${tplListSection('Work Experience', data.experience, exp => `
          <div style="margin-bottom:10px;">
            <strong>${escapeHTML(exp.jobTitle)}</strong> at ${escapeHTML(exp.company)}
            ${exp.employmentType ? `<span style="font-size:10px;color:#777;"> (${escapeHTML(exp.employmentType)})</span>` : ''}
            <span style="color:#777;font-size:11px;"> — ${formatDate(exp.startDate)} to ${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            ${exp.location ? `<br><span style="font-size:11px;color:#777;">${escapeHTML(exp.location)}</span>` : ''}
            ${exp.description ? `<p style="font-size:12px;margin:3px 0;white-space:pre-line;">${escapeHTML(exp.description)}</p>` : ''}
            ${exp.achievements ? `<ul style="margin:4px 0 0 18px;padding:0;font-size:12px;line-height:1.5;">${exp.achievements.split('\n').filter(Boolean).map(item => `<li style="margin-bottom:2px;">${escapeHTML(item)}</li>`).join('')}</ul>` : ''}
          </div>
        `)}
        ${tplListSection('Education', data.education, edu => `
          <div style="margin-bottom:8px;">
            <strong>${escapeHTML(edu.degree)}</strong>${edu.fieldOfStudy ? ', ' + escapeHTML(edu.fieldOfStudy) : ''}
            <br>${escapeHTML(edu.school)} <span style="color:#777;font-size:11px;">— ${formatDate(edu.startDate)} to ${formatDate(edu.endDate)}</span>
            ${edu.gpa ? `<br><span style="font-size:11px;">GPA: ${escapeHTML(edu.gpa)}</span>` : ''}
            ${edu.description ? `<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(edu.description)}</p>` : ''}
          </div>
        `)}
        ${tplTagsSection('Skills', data.skills)}
        ${tplListSection('Projects', data.projects, proj => `
          <div style="margin-bottom:8px;">
            <strong>${escapeHTML(proj.name)}</strong>
            ${(proj.startDate || proj.endDate) ? `<span style="color:#777;font-size:11px;"> — ${formatDate(proj.startDate)} to ${formatDate(proj.endDate)}</span>` : ''}
            ${proj.technologies ? `<br><span style="font-size:11px;color:#555;">${escapeHTML(proj.technologies)}</span>` : ''}
            ${proj.description ? `<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(proj.description)}</p>` : ''}
            ${proj.github || proj.liveUrl ? `<p style="font-size:11px;color:#555;word-break:break-all;">${[proj.github, proj.liveUrl].filter(Boolean).map(escapeHTML).join(' | ')}</p>` : ''}
          </div>
        `)}
        ${tplListSection('Certifications', data.certifications, c => `
          <div style="margin-bottom:6px;">
            <strong>${escapeHTML(c.name)}</strong> — ${escapeHTML(c.organization)}
            <span style="color:#777;font-size:11px;"> (${formatDate(c.issueDate)}${c.expiryDate ? ' – ' + formatDate(c.expiryDate) : ''})</span>
            ${c.credentialId ? `<br><span style="font-size:11px;">ID: ${escapeHTML(c.credentialId)}</span>` : ''}
            ${c.credentialUrl ? `<br><span style="font-size:11px;word-break:break-all;">${escapeHTML(c.credentialUrl)}</span>` : ''}
          </div>
        `)}
        ${tplListSection('Languages', data.languages, l => `
          <span style="margin-right:12px;"><strong>${escapeHTML(l.name)}</strong>${l.proficiency ? ' (' + escapeHTML(l.proficiency) + ')' : ''}</span>
        `, true)}
        ${tplListSection('Awards', data.awards, a => `
          <div style="margin-bottom:6px;">
            <strong>${escapeHTML(a.title)}</strong> — ${escapeHTML(a.issuer)}
            <span style="color:#777;font-size:11px;"> (${formatDate(a.date)})</span>
            ${a.description ? `<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(a.description)}</p>` : ''}
          </div>
        `)}
        ${tplListSection('Volunteer Experience', data.volunteer, v => `
          <div style="margin-bottom:8px;">
            <strong>${escapeHTML(v.role)}</strong> at ${escapeHTML(v.organization)}
            <span style="color:#777;font-size:11px;"> — ${formatDate(v.startDate)} to ${formatDate(v.endDate)}</span>
            ${v.location ? `<br><span style="font-size:11px;color:#777;">${escapeHTML(v.location)}</span>` : ''}
            ${v.description ? `<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(v.description)}</p>` : ''}
          </div>
        `)}
        ${tplListSection('Internships', data.internships, it => `
          <div style="margin-bottom:8px;">
            <strong>${escapeHTML(it.jobTitle)}</strong> at ${escapeHTML(it.company)}
            <span style="color:#777;font-size:11px;"> — ${formatDate(it.startDate)} to ${formatDate(it.endDate)}</span>
            ${it.location ? `<br><span style="font-size:11px;color:#777;">${escapeHTML(it.location)}</span>` : ''}
            ${it.description ? `<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(it.description)}</p>` : ''}
          </div>
        `)}
        ${tplListSection('Publications', data.publications, pub => `
          <div style="margin-bottom:6px;">
            <strong>${escapeHTML(pub.title)}</strong> — ${escapeHTML(pub.publisher)}
            <span style="color:#777;font-size:11px;"> (${formatDate(pub.date)})</span>
            ${pub.doi ? `<br><span style="font-size:11px;">DOI: ${escapeHTML(pub.doi)}</span>` : ''}
            ${pub.url ? `<br><span style="font-size:11px;word-break:break-all;">${escapeHTML(pub.url)}</span>` : ''}
            ${pub.description ? `<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(pub.description)}</p>` : ''}
          </div>
        `)}
        ${tplListSection('Conferences', data.conferences, c => `
          <div style="margin-bottom:6px;">
            <strong>${escapeHTML(c.name)}</strong> — ${escapeHTML(c.role)}
            <span style="color:#777;font-size:11px;"> (${formatDate(c.date)})</span>
            ${c.location ? `<br><span style="font-size:11px;color:#777;">${escapeHTML(c.location)}</span>` : ''}
            ${c.description ? `<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(c.description)}</p>` : ''}
          </div>
        `)}
        ${renderReferences(data.references)}
        ${tplTagsSection('Interests', data.interests)}
        ${renderSocialLinks(data.social)}
        ${renderCustomSections(data.custom)}
      </div>
    `;
  }
};

// ==================== SHARED HELPERS ====================
function tplSection(title, content) {
  if (!content) return '';
  return `
    <h2 style="font-size:15px;text-transform:uppercase;border-bottom:1px solid #ccc;padding-bottom:3px;margin:16px 0 8px;">${title}</h2>
    <p style="font-size:12px;white-space:pre-line;">${escapeHTML(content)}</p>
  `;
}

function tplListSection(title, items, renderFn, inline) {
  if (!items || items.length === 0) return '';
  const body = items.map(renderFn).join('');
  if (inline) {
    return `<h2 style="font-size:15px;text-transform:uppercase;border-bottom:1px solid #ccc;padding-bottom:3px;margin:16px 0 8px;">${title}</h2><div style="font-size:12px;">${body}</div>`;
  }
  return `<h2 style="font-size:15px;text-transform:uppercase;border-bottom:1px solid #ccc;padding-bottom:3px;margin:16px 0 8px;">${title}</h2>${body}`;
}

function tplTagsSection(title, items) {
  if (!items || items.length === 0) return '';
  return `
    <h2 style="font-size:15px;text-transform:uppercase;border-bottom:1px solid #ccc;padding-bottom:3px;margin:16px 0 8px;">${title}</h2>
    <p style="font-size:12px;">${items.map(i => escapeHTML(i.name)).join(', ')}</p>
  `;
}

function renderReferences(refs) {
  if (!refs) return '';
  if (refs.placeholder) {
    return `<h2 style="font-size:15px;text-transform:uppercase;border-bottom:1px solid #ccc;padding-bottom:3px;margin:16px 0 8px;">References</h2><p style="font-size:12px;">Available upon request</p>`;
  }
  if (!refs.list || refs.list.length === 0) return '';
  return tplListSection('References', refs.list, r => `
    <div style="margin-bottom:6px;">
      <strong>${escapeHTML(r.name)}</strong> — ${escapeHTML(r.title)}, ${escapeHTML(r.company)}
      ${r.email ? `<br><span style="font-size:11px;word-break:break-all;">${escapeHTML(r.email)}</span>` : ''}
      ${r.phone ? `<br><span style="font-size:11px;">${escapeHTML(r.phone)}</span>` : ''}
    </div>
  `);
}

function renderSocialLinks(social) {
  if (!social) return '';
  const links = Object.entries(social).filter(([k, v]) => v);
  if (links.length === 0) return '';
  return `
    <h2 style="font-size:15px;text-transform:uppercase;border-bottom:1px solid #ccc;padding-bottom:3px;margin:16px 0 8px;">Social Links</h2>
    <p style="font-size:12px;word-break:break-all;">${links.map(([k, v]) => `${escapeHTML(k)}: ${escapeHTML(v)}`).join(' | ')}</p>
  `;
}

function renderCustomSections(custom) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items || []).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return `
      <h2 style="font-size:15px;text-transform:uppercase;border-bottom:1px solid #ccc;padding-bottom:3px;margin:16px 0 8px;">${escapeHTML(sec.sectionName)}</h2>
      ${items.map(item => `
        <div style="margin-bottom:6px;">
          <strong>${escapeHTML(item.title)}</strong>
          ${item.description ? `<p style="font-size:12px;margin:2px 0;white-space:pre-line;">${escapeHTML(item.description)}</p>` : ''}
        </div>
      `).join('')}
    `;
  }).join('');
}

function formatDate(d) {
  if (!d) return '';
  try {
    const date = new Date(d + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch { return d; }
}
