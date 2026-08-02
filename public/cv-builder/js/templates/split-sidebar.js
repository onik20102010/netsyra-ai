// templates/split-sidebar.js — Split Sidebar Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates['split-sidebar'] = {
  name: 'Split Sidebar',
  description: 'Classic two-column layout with dark navy sidebar, profile photo, and right-aligned dates',
  
  miniPreview() {
    return `<div class="mini-cv" style="font-family:'Arial',sans-serif; background:#fff; width:100%; height:100%; display:flex; box-sizing:border-box;">
      <div style="background:#2C3E50; color:#fff; width:35%; padding:6px; box-sizing:border-box;">
        <div style="width:16px; height:16px; border-radius:50%; background:#fff; margin:0 auto 4px;"></div>
        <div style="font-size:5px; font-weight:bold; text-align:center;">John Doe</div>
        <div style="font-size:3px; color:#bdc3c7; text-align:center; margin-bottom:6px;">Developer</div>
        <div style="font-size:3px; font-weight:bold; margin-top:4px;">Skills</div>
        <div style="font-size:2.5px; color:#ecf0f1;">&bull; JavaScript</div>
      </div>
      <div style="width:65%; padding:6px; box-sizing:border-box;">
        <div style="font-size:5px; font-weight:bold; color:#111;">Profile</div>
        <div style="font-size:2.5px; color:#555; margin-bottom:4px;">Software engineer with experience...</div>
        <div style="font-size:5px; font-weight:bold; color:#111;">Work Experience</div>
        <div style="font-size:3px; font-weight:bold;">Software Developer</div>
      </div>
    </div>`;
  },

  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    const sidebarBg = '#2C3E50';

    return `
      <div class="cv-template-root" style="font-family:'Helvetica Neue', Arial, sans-serif; background:#ffffff; max-width:800px; margin:0 auto; display:flex; min-height:1000px; box-shadow:0 0 10px rgba(0,0,0,0.08); text-align:left; word-break:break-word; overflow-wrap:break-word;">
        
        <!-- Left Sidebar Column -->
        <div class="cv-template-sidebar" style="background-color:${sidebarBg}; color:#ffffff; width:33%; padding:30px 20px; box-sizing:border-box; flex-shrink:0;">
          
          <!-- Profile Photo -->
          <div style="text-align:center; margin-bottom:20px;">
            ${p.photo && !p.photo.startsWith('data:image/svg') ? `
              <img src="${escapeHTML(p.photo)}" alt="${escapeHTML(p.fullName)}" style="width:110px; height:110px; border-radius:50%; object-fit:cover; border:3px solid #ffffff; display:inline-block;" />
            ` : ` 
              <div style="width:110px; height:110px; border-radius:50%; background:#34495e; border:3px solid #ffffff; display:inline-flex; align-items:center; justify-content:center; font-size:36px; font-weight:bold; color:#ffffff; margin:0 auto;">
                ${escapeHTML((p.fullName || 'Y').charAt(0))}
              </div>
            `}
          </div>

          <!-- Name & Title -->
          <div style="text-align:center; margin-bottom:30px;">
            <h1 style="font-size:22px; font-weight:bold; margin:0 0 6px 0; letter-spacing:0.5px; color:#ffffff;">${escapeHTML(p.fullName || 'Your Name')}</h1>
            <p style="font-size:13px; color:#bdc3c7; margin:0; font-weight:300;">${escapeHTML(p.professionalTitle || 'Software Engineer')}</p>
          </div>

          <!-- Contact Details -->
          ${(p.phone || p.email || p.location || p.linkedin || p.website || p.github) ? `
            <div style="margin-bottom:30px;">
              <h2 style="font-size:14px; font-weight:bold; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:5px; margin:0 0 12px 0; letter-spacing:0.5px;">Contact Details</h2>
              <div style="font-size:11px; line-height:1.8; color:#ecf0f1;">
                ${p.phone ? `<div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;"><span style="flex-shrink:0;">&#9742;</span><span>${escapeHTML(p.phone)}</span></div>` : ''}
                ${p.email ? `<div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;"><span style="flex-shrink:0;">&#9993;</span><span style="word-break:break-all;">${escapeHTML(p.email)}</span></div>` : ''}
                ${p.location ? `<div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;"><span style="flex-shrink:0;">&#128205;</span><span>${escapeHTML(p.location)}</span></div>` : ''}
                ${p.linkedin ? `<div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;"><span style="flex-shrink:0;">&#128279;</span><span style="word-break:break-all;">${escapeHTML(p.linkedin)}</span></div>` : ''}
                ${p.website ? `<div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;"><span style="flex-shrink:0;">&#127760;</span><span style="word-break:break-all;">${escapeHTML(p.website)}</span></div>` : ''}
                ${p.github ? `<div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;"><span style="flex-shrink:0;">&#128187;</span><span style="word-break:break-all;">${escapeHTML(p.github)}</span></div>` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Skills Section -->
          ${data.skills && data.skills.length > 0 ? `
            <div style="margin-bottom:30px;">
              <h2 style="font-size:14px; font-weight:bold; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:5px; margin:0 0 12px 0; letter-spacing:0.5px;">Skills</h2>
              <ul style="margin:0; padding-left:16px; font-size:11px; line-height:1.8; color:#ecf0f1;">
                ${data.skills.map(skill => `<li>${escapeHTML(skill.name)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Languages Section -->
          ${data.languages && data.languages.length > 0 ? `
            <div style="margin-bottom:30px;">
              <h2 style="font-size:14px; font-weight:bold; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:5px; margin:0 0 12px 0; letter-spacing:0.5px;">Languages</h2>
              <ul style="margin:0; padding-left:16px; font-size:11px; line-height:1.8; color:#ecf0f1;">
                ${data.languages.map(l => `<li>${escapeHTML(l.name)}${l.proficiency ? `: ${escapeHTML(l.proficiency)}` : ''}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Interests -->
          ${data.interests && data.interests.length > 0 ? `
            <div style="margin-bottom:30px;">
              <h2 style="font-size:14px; font-weight:bold; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:5px; margin:0 0 12px 0; letter-spacing:0.5px;">Interests</h2>
              <ul style="margin:0; padding-left:16px; font-size:11px; line-height:1.8; color:#ecf0f1;">
                ${data.interests.map(i => `<li>${escapeHTML(i.name)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Social Links in Sidebar -->
          ${data.social ? (() => {
            const links = Object.entries(data.social).filter(([k,v]) => v);
            if (links.length === 0) return '';
            return `
              <div style="margin-bottom:30px;">
                <h2 style="font-size:14px; font-weight:bold; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:5px; margin:0 0 12px 0; letter-spacing:0.5px;">Social</h2>
                <div style="font-size:11px; line-height:1.8; color:#ecf0f1;">
                  ${links.map(([k,v]) => `<div style="margin-bottom:4px; word-break:break-all;"><strong>${escapeHTML(k)}:</strong> ${escapeHTML(v)}</div>`).join('')}
                </div>
              </div>
            `;
          })() : ''}

        </div>

        <!-- Right Main Content Column -->
        <div class="cv-template-main" style="width:67%; padding:35px 30px; box-sizing:border-box; color:#333333;">
          
          <!-- Profile / Summary Section -->
          ${s.text ? `
            <div style="margin-bottom:30px;">
              <h2 style="font-size:16px; font-weight:bold; color:#111111; margin:0 0 12px 0;">Profile</h2>
              <p style="font-size:12px; line-height:1.6; color:#444444; margin:0; white-space:pre-line;">${escapeHTML(s.text)}</p>
            </div>
          ` : ''}

          <!-- Work Experience -->
          ${data.experience && data.experience.length > 0 ? `
            <div style="margin-bottom:30px;">
              <h2 style="font-size:16px; font-weight:bold; color:#111111; margin:0 0 16px 0;">Work Experience</h2>
              ${data.experience.map(exp => `
                <div style="margin-bottom:20px;">
                  <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:4px;">
                    <div style="font-size:14px; font-weight:bold; color:#111111;">${escapeHTML(exp.jobTitle)}</div>
                    <div style="font-size:11px; color:#888888; font-weight:normal; white-space:nowrap;">${formatDate(exp.startDate)} &ndash; ${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</div>
                  </div>
                  <div style="font-size:12px; color:#555555; margin:2px 0 6px 0;">${escapeHTML(exp.company)}${exp.employmentType ? ` <span style="font-size:11px; color:#888;">(${escapeHTML(exp.employmentType)})</span>` : ''}</div>
                  ${exp.location ? `<div style="font-size:11px; color:#888888; margin-bottom:4px;">${escapeHTML(exp.location)}</div>` : ''}
                  ${exp.description ? `<p style="font-size:12px; color:#555555; margin:4px 0; line-height:1.5; white-space:pre-line;">${escapeHTML(exp.description)}</p>` : ''}
                  ${exp.achievements ? `
                    <ul style="margin:6px 0 0 18px; padding:0; font-size:12px; color:#555555; line-height:1.5;">
                      ${exp.achievements.split('\n').filter(Boolean).map(item => `<li>${escapeHTML(item)}</li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Education -->
          ${data.education && data.education.length > 0 ? `
            <div style="margin-bottom:30px;">
              <h2 style="font-size:16px; font-weight:bold; color:#111111; margin:0 0 16px 0;">Education</h2>
              ${data.education.map(edu => `
                <div style="margin-bottom:16px;">
                  <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:4px;">
                    <div style="font-size:14px; font-weight:bold; color:#111111;">${escapeHTML(edu.degree)}${edu.fieldOfStudy ? ', ' + escapeHTML(edu.fieldOfStudy) : ''}</div>
                    <div style="font-size:11px; color:#888888; white-space:nowrap;">${formatDate(edu.startDate)} &ndash; ${edu.endDate ? formatDate(edu.endDate) : 'Present'}</div>
                  </div>
                  <div style="font-size:12px; color:#555555; margin-top:2px;">${escapeHTML(edu.school)}</div>
                  ${edu.gpa ? `<div style="font-size:11px; color:#777777; margin-top:2px;">GPA: ${escapeHTML(edu.gpa)}</div>` : ''}
                  ${edu.description ? `<p style="font-size:12px; color:#555555; margin:3px 0; line-height:1.5; white-space:pre-line;">${escapeHTML(edu.description)}</p>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Projects Section -->
          ${sbListSection('Projects', data.projects, proj => `
            <div style="margin-bottom:14px;">
              <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:4px;">
                <div style="font-size:13px; font-weight:bold; color:#111111;">${escapeHTML(proj.name)}</div>
                ${(proj.startDate || proj.endDate) ? `<div style="font-size:11px; color:#888888; white-space:nowrap;">${formatDate(proj.startDate)} &ndash; ${formatDate(proj.endDate)}</div>` : ''}
              </div>
              ${proj.technologies ? `<div style="font-size:11px; color:#777777; margin:1px 0;">${escapeHTML(proj.technologies)}</div>` : ''}
              ${proj.description ? `<p style="font-size:12px; color:#555555; margin:3px 0; line-height:1.5; white-space:pre-line;">${escapeHTML(proj.description)}</p>` : ''}
              ${(proj.github || proj.liveUrl) ? `<p style="font-size:11px; color:#777777; word-break:break-all;">${[proj.github, proj.liveUrl].filter(Boolean).map(escapeHTML).join(' | ')}</p>` : ''}
            </div>
          `)}

          <!-- Certifications -->
          ${sbListSection('Certifications', data.certifications, cert => `
            <div style="font-size:12px; color:#444444; margin-bottom:6px;">
              &bull; <strong>${escapeHTML(cert.name)}</strong> ${cert.organization ? '&mdash; ' + escapeHTML(cert.organization) : ''} ${cert.issueDate ? '(' + formatDate(cert.issueDate) + (cert.expiryDate ? ' &ndash; ' + formatDate(cert.expiryDate) : '') + ')' : ''}
              ${cert.credentialId ? `<br><span style="font-size:11px; color:#777;">ID: ${escapeHTML(cert.credentialId)}</span>` : ''}
              ${cert.credentialUrl ? `<br><span style="font-size:11px; color:#777; word-break:break-all;">${escapeHTML(cert.credentialUrl)}</span>` : ''}
            </div>
          `)}

          <!-- Awards -->
          ${sbListSection('Awards', data.awards, a => `
            <div style="font-size:12px; color:#444444; margin-bottom:4px;">
              &bull; <strong>${escapeHTML(a.title)}</strong> &mdash; ${escapeHTML(a.issuer)}${a.date ? ' (' + formatDate(a.date) + ')' : ''}
              ${a.description ? `<p style="font-size:12px; color:#555; margin:2px 0; white-space:pre-line;">${escapeHTML(a.description)}</p>` : ''}
            </div>
          `)}

          <!-- Volunteer -->
          ${sbListSection('Volunteer', data.volunteer, v => `
            <div style="margin-bottom:10px;">
              <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:4px;">
                <div style="font-size:13px; font-weight:bold;">${escapeHTML(v.role)} &mdash; ${escapeHTML(v.organization)}</div>
                ${(v.startDate || v.endDate) ? `<div style="font-size:11px; color:#888; white-space:nowrap;">${formatDate(v.startDate)} &ndash; ${formatDate(v.endDate)}</div>` : ''}
              </div>
              ${v.location ? `<div style="font-size:11px; color:#888; margin:1px 0;">${escapeHTML(v.location)}</div>` : ''}
              ${v.description ? `<p style="font-size:12px; color:#555555; margin:2px 0; white-space:pre-line;">${escapeHTML(v.description)}</p>` : ''}
            </div>
          `)}

          <!-- Internships -->
          ${sbListSection('Internships', data.internships, it => `
            <div style="margin-bottom:10px;">
              <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:4px;">
                <div style="font-size:13px; font-weight:bold;">${escapeHTML(it.jobTitle)} &mdash; ${escapeHTML(it.company)}</div>
                ${(it.startDate || it.endDate) ? `<div style="font-size:11px; color:#888; white-space:nowrap;">${formatDate(it.startDate)} &ndash; ${formatDate(it.endDate)}</div>` : ''}
              </div>
              ${it.location ? `<div style="font-size:11px; color:#888; margin:1px 0;">${escapeHTML(it.location)}</div>` : ''}
              ${it.description ? `<p style="font-size:12px; color:#555555; margin:2px 0; white-space:pre-line;">${escapeHTML(it.description)}</p>` : ''}
            </div>
          `)}

          <!-- Publications -->
          ${sbListSection('Publications', data.publications, pub => `
            <div style="font-size:12px; color:#444444; margin-bottom:4px;">
              &bull; <strong>${escapeHTML(pub.title)}</strong> &mdash; ${escapeHTML(pub.publisher)}${pub.date ? ' (' + formatDate(pub.date) + ')' : ''}
              ${pub.doi ? `<br><span style="font-size:11px; color:#777;">DOI: ${escapeHTML(pub.doi)}</span>` : ''}
              ${pub.url ? `<br><span style="font-size:11px; color:#777; word-break:break-all;">${escapeHTML(pub.url)}</span>` : ''}
            </div>
          `)}

          <!-- Conferences -->
          ${sbListSection('Conferences', data.conferences, c => `
            <div style="font-size:12px; color:#444444; margin-bottom:4px;">
              &bull; <strong>${escapeHTML(c.name)}</strong> &mdash; ${escapeHTML(c.role)}${c.date ? ' (' + formatDate(c.date) + ')' : ''}${c.location ? ' &middot; ' + escapeHTML(c.location) : ''}
              ${c.description ? `<p style="font-size:12px; color:#555; margin:2px 0; white-space:pre-line;">${escapeHTML(c.description)}</p>` : ''}
            </div>
          `)}

          ${sbRefs(data.references)}
          ${sbCustom(data.custom)}

        </div>
      </div>
    `;
  }
};

// ==================== HELPER FUNCTIONS ====================
function sbListSection(title, items, fn) {
  if (!items || items.length === 0) return '';
  return `
    <div style="margin-bottom:30px;">
      <h2 style="font-size:16px; font-weight:bold; color:#111111; margin:0 0 14px 0;">${title}</h2>
      <div>${items.map(fn).join('')}</div>
    </div>
  `;
}

function sbRefs(refs) {
  if (!refs) return '';
  if (refs.placeholder) {
    return `
      <div style="margin-bottom:30px;">
        <h2 style="font-size:16px; font-weight:bold; color:#111111; margin:0 0 12px 0;">References</h2>
        <p style="font-size:12px; color:#555555;">Available upon request</p>
      </div>
    `;
  }
  if (!refs.list || refs.list.length === 0) return '';
  return sbListSection('References', refs.list, r => `
    <div style="font-size:12px; margin-bottom:6px;">
      <strong>${escapeHTML(r.name)}</strong> &mdash; ${escapeHTML(r.title)}, ${escapeHTML(r.company)}
      ${r.email ? `<br><span style="font-size:11px; color:#777; word-break:break-all;">${escapeHTML(r.email)}</span>` : ''}
      ${r.phone ? `<br><span style="font-size:11px; color:#777;">${escapeHTML(r.phone)}</span>` : ''}
    </div>
  `);
}

function sbCustom(custom) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items || []).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return sbListSection(sec.sectionName, items, item => `
      <div style="margin-bottom:8px;">
        <div style="font-size:12px; font-weight:bold;">${escapeHTML(item.title)}</div>
        ${item.description ? `<p style="font-size:12px; color:#555555; margin:2px 0; white-space:pre-line;">${escapeHTML(item.description)}</p>` : ''}
      </div>
    `);
  }).join('');
}
