// templates/modern-warm.js — Modern Warm Terracotta Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates['modern-warm'] = {
  name: 'Modern Warm',
  description: 'Warm terracotta header with circular profile photo, structured sections, and tag badges',
  
  miniPreview() {
    return `<div class="mini-cv" style="font-family:'Georgia', serif; background:#fff; width:100%; height:100%; box-sizing:border-box;">
      <div style="background:#B86B53; color:#fff; padding:8px; display:flex; align-items:center; gap:6px;">
        <div style="width:18px; height:18px; border-radius:50%; background:#ddd; border:1px solid #fff; flex-shrink:0;"></div>
        <div>
          <div style="font-size:6px; font-weight:bold;">Jane Doe</div>
          <div style="font-size:3.5px; opacity:0.9;">Digital Marketing Specialist</div>
        </div>
      </div>
      <div style="padding:6px;">
        <div style="font-size:5px; color:#B86B53; font-weight:bold; margin-bottom:2px;">Work Experience</div>
        <div style="font-size:3.5px; color:#333; font-weight:bold;">Public Affairs Assistant</div>
        <div style="font-size:3px; color:#777; margin-bottom:3px;">07/2021 - Present</div>
        <div style="font-size:5px; color:#B86B53; font-weight:bold; margin-top:4px; margin-bottom:2px;">Education</div>
        <div style="display:flex; gap:6px;">
          <div style="font-size:3px; color:#444;">Northwestern University</div>
          <div style="font-size:3px; color:#444;">University of Wisconsin</div>
        </div>
      </div>
    </div>`;
  },

  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    const primaryColor = '#B86B53';

    return `
      <div style="font-family:'Georgia', 'Times New Roman', serif; background-color:#ffffff; color:#333333; max-width:800px; margin:0 auto; box-shadow:0 0 10px rgba(0,0,0,0.05); text-align:left; word-break:break-word; overflow-wrap:break-word;">
        
        <!-- Header Section -->
        <div style="background-color:${primaryColor}; color:#ffffff; padding:30px 35px; display:flex; align-items:center; gap:25px;">
          ${p.photo && !p.photo.includes('svg') ? `
            <div style="flex-shrink:0;">
              <img src="${escapeHTML(p.photo)}" alt="${escapeHTML(p.fullName)}" style="width:110px; height:110px; border-radius:50%; object-fit:cover; border:3px solid #ffffff;" />
            </div>
          ` : ` 
            <div style="flex-shrink:0; width:110px; height:110px; border-radius:50%; background-color:rgba(255,255,255,0.2); border:3px solid #ffffff; display:flex; align-items:center; justify-content:center; font-size:36px; font-weight:bold;">
              ${escapeHTML((p.fullName || 'J').charAt(0))}
            </div>
          `}
          
          <div style="flex:1;">
            <p style="font-size:13px; margin:0 0 4px 0; letter-spacing:0.5px; opacity:0.95;">${escapeHTML(p.professionalTitle || '')}</p>
            ${s.text ? `<p style="font-size:11px; line-height:1.5; margin:0 0 12px 0; opacity:0.9; font-family:sans-serif;">${escapeHTML(s.text)}</p>` : ''}
            
            <h1 style="font-size:24px; font-weight:bold; margin:0 0 10px 0; letter-spacing:0.5px;">${escapeHTML(p.fullName || '')}</h1>
            
            <!-- Contact Bar -->
            <div style="font-size:10.5px; display:flex; flex-wrap:wrap; gap:12px; opacity:0.95; font-family:sans-serif;">
              ${p.phone ? `<span>&#9742; ${escapeHTML(p.phone)}</span>` : ''}
              ${p.email ? `<span>&#9993; ${escapeHTML(p.email)}</span>` : ''}
              ${p.linkedin ? `<span>&#128279; ${escapeHTML(p.linkedin)}</span>` : ''}
              ${p.location ? `<span>&#128205; ${escapeHTML(p.location)}</span>` : ''}
              ${p.website ? `<span>&#127760; ${escapeHTML(p.website)}</span>` : ''}
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div style="padding:30px 35px;">
          
          <!-- Experience Section -->
          ${mwListSection('Work Experience', data.experience, exp => `
            <div style="margin-bottom:18px;">
              <div style="font-size:14px; font-weight:bold; color:#111;">
                ${escapeHTML(exp.jobTitle)} <span style="font-weight:normal; color:#555;">&bull; ${escapeHTML(exp.company)}</span>
              </div>
              <div style="font-size:11px; color:#777; margin:2px 0 6px 0; font-family:sans-serif;">
                ${formatDate(exp.startDate)} - ${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
              </div>
              ${exp.location ? `<div style="font-size:11px; color:#777; margin:2px 0 6px 0; font-family:sans-serif;">${escapeHTML(exp.location)}</div>` : ''}
              ${exp.description ? `<p style="font-size:12px; color:#444; margin:4px 0; line-height:1.5; font-family:sans-serif; white-space:pre-line;">${escapeHTML(exp.description)}</p>` : ''}
              ${exp.achievements ? `
                <ul style="margin:4px 0 0 18px; padding:0; font-size:12px; color:#444; font-family:sans-serif; line-height:1.5;">
                  ${exp.achievements.split('\n').filter(Boolean).map(item => `<li>${escapeHTML(item)}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `, primaryColor)}

          <!-- Education Section (2-Column Grid Layout) -->
          ${data.education && data.education.length > 0 ? `
            <div style="margin-bottom:25px;">
              <h2 style="font-size:16px; font-weight:bold; color:${primaryColor}; margin:0 0 12px 0; border-bottom:1px solid #eee; padding-bottom:4px;">Education</h2>
              <div style="display:flex; flex-wrap:wrap; gap:20px;">
                ${data.education.map(edu => `
                  <div style="flex:1; min-width:200px;">
                    <div style="font-size:11px; color:#888; font-family:sans-serif;">${formatDate(edu.startDate)} ${edu.endDate ? '- ' + formatDate(edu.endDate) : ''}</div>
                    <div style="font-size:14px; font-weight:bold; color:#111; margin:2px 0;">${escapeHTML(edu.school)}</div>
                    <div style="font-size:12px; color:#444; font-family:sans-serif;">${escapeHTML(edu.degree)}${edu.fieldOfStudy ? ' — ' + escapeHTML(edu.fieldOfStudy) : ''}</div>
                    ${edu.description ? `<p style="font-size:11px; color:#666; margin:2px 0; font-family:sans-serif; white-space:pre-line;">${escapeHTML(edu.description)}</p>` : ''}
                    ${edu.gpa ? `<div style="font-size:11px; color:#666; margin-top:2px; font-family:sans-serif;">GPA: ${escapeHTML(edu.gpa)}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Skills Section (Boxed Badge Layout) -->
          ${data.skills && data.skills.length > 0 ? `
            <div style="margin-bottom:25px;">
              <h2 style="font-size:16px; font-weight:bold; color:${primaryColor}; margin:0 0 12px 0; border-bottom:1px solid #eee; padding-bottom:4px;">Skills</h2>
              <div style="display:flex; flex-wrap:wrap; gap:8px;">
                ${data.skills.map(skill => `
                  <span style="font-size:11px; font-family:sans-serif; border:1px solid #cccccc; color:#444444; padding:4px 10px; border-radius:2px; background:#fafafa;">
                    ${escapeHTML(skill.name)}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Certifications Section -->
          ${mwListSection('Certifications', data.certifications, cert => `
            <div style="font-size:12px; color:#333; margin-bottom:6px; font-family:sans-serif;">
              &bull; <strong>${escapeHTML(cert.name)}</strong> ${cert.organization ? '| ' + escapeHTML(cert.organization) : ''} ${cert.issueDate ? '| ' + formatDate(cert.issueDate) : ''}${cert.expiryDate ? ' – ' + formatDate(cert.expiryDate) : ''}
              ${cert.credentialId ? `<br><span style="font-size:11px; color:#777;">ID: ${escapeHTML(cert.credentialId)}</span>` : ''}
              ${cert.credentialUrl ? `<br><span style="font-size:11px; color:#777; word-break:break-all;">${escapeHTML(cert.credentialUrl)}</span>` : ''}
            </div>
          `, primaryColor)}

          <!-- Projects Section -->
          ${mwListSection('Projects', data.projects, proj => `
            <div style="margin-bottom:12px;">
              <div style="font-size:13px; font-weight:bold;">${escapeHTML(proj.name)}</div>
              ${proj.technologies ? `<div style="font-size:11px; color:#777; font-family:sans-serif;">${escapeHTML(proj.technologies)}</div>` : ''}
              ${proj.description ? `<p style="font-size:12px; color:#444; margin:3px 0; font-family:sans-serif; white-space:pre-line;">${escapeHTML(proj.description)}</p>` : ''}
              ${(proj.github || proj.liveUrl) ? `<p style="font-size:11px; color:#777; font-family:sans-serif; word-break:break-all;">${[proj.github, proj.liveUrl].filter(Boolean).map(escapeHTML).join(' | ')}</p>` : ''}
            </div>
          `, primaryColor)}

          <!-- Languages Section -->
          ${data.languages && data.languages.length > 0 ? `
            <div style="margin-bottom:25px;">
              <h2 style="font-size:16px; font-weight:bold; color:${primaryColor}; margin:0 0 12px 0; border-bottom:1px solid #eee; padding-bottom:4px;">Languages</h2>
              <div style="font-size:12px; color:#444; font-family:sans-serif;">
                ${data.languages.map(l => `<strong>${escapeHTML(l.name)}</strong>${l.proficiency ? ' (' + escapeHTML(l.proficiency) + ')' : ''}`).join(' &nbsp;&bull;&nbsp; ')}
              </div>
            </div>
          ` : ''}

          <!-- Additional Dynamic Sections -->
          ${mwListSection('Awards', data.awards, a => `
            <div style="font-size:12px; color:#333; margin-bottom:4px; font-family:sans-serif;">
              &bull; <strong>${escapeHTML(a.title)}</strong> &mdash; ${escapeHTML(a.issuer)}${a.date ? ' | ' + formatDate(a.date) : ''}
              ${a.description ? `<p style="font-size:12px; color:#555; margin:2px 0; font-family:sans-serif; white-space:pre-line;">${escapeHTML(a.description)}</p>` : ''}
            </div>
          `, primaryColor)}

          ${mwListSection('Volunteer', data.volunteer, v => `
            <div style="margin-bottom:8px;">
              <div style="font-size:13px; font-weight:bold;">${escapeHTML(v.role)} &mdash; ${escapeHTML(v.organization)}</div>
              <div style="font-size:11px; color:#777; margin:2px 0; font-family:sans-serif;">${formatDate(v.startDate)} - ${formatDate(v.endDate)}${v.location ? ' | ' + escapeHTML(v.location) : ''}</div>
              ${v.description ? `<p style="font-size:12px; color:#555; margin:2px 0; font-family:sans-serif; white-space:pre-line;">${escapeHTML(v.description)}</p>` : ''}
            </div>
          `, primaryColor)}

          ${mwListSection('Internships', data.internships, it => `
            <div style="margin-bottom:8px;">
              <div style="font-size:13px; font-weight:bold;">${escapeHTML(it.jobTitle)} &mdash; ${escapeHTML(it.company)}</div>
              <div style="font-size:11px; color:#777; margin:2px 0; font-family:sans-serif;">${formatDate(it.startDate)} - ${formatDate(it.endDate)}${it.location ? ' | ' + escapeHTML(it.location) : ''}</div>
              ${it.description ? `<p style="font-size:12px; color:#555; margin:2px 0; font-family:sans-serif; white-space:pre-line;">${escapeHTML(it.description)}</p>` : ''}
            </div>
          `, primaryColor)}

          ${mwListSection('Publications', data.publications, pub => `
            <div style="font-size:12px; color:#333; margin-bottom:4px; font-family:sans-serif;">
              &bull; <strong>${escapeHTML(pub.title)}</strong> &mdash; ${escapeHTML(pub.publisher)} ${pub.date ? '| ' + formatDate(pub.date) : ''}
              ${pub.doi ? `<br><span style="font-size:11px; color:#777;">DOI: ${escapeHTML(pub.doi)}</span>` : ''}
              ${pub.url ? `<br><span style="font-size:11px; color:#777; word-break:break-all;">${escapeHTML(pub.url)}</span>` : ''}
            </div>
          `, primaryColor)}

          ${mwListSection('Conferences', data.conferences, c => `
            <div style="font-size:12px; color:#333; margin-bottom:4px; font-family:sans-serif;">
              &bull; <strong>${escapeHTML(c.name)}</strong> &mdash; ${escapeHTML(c.role)} ${c.date ? '| ' + formatDate(c.date) : ''}${c.location ? ' | ' + escapeHTML(c.location) : ''}
              ${c.description ? `<p style="font-size:12px; color:#555; margin:2px 0; font-family:sans-serif; white-space:pre-line;">${escapeHTML(c.description)}</p>` : ''}
            </div>
          `, primaryColor)}

          ${mwRefs(data.references, primaryColor)}

          ${data.interests && data.interests.length > 0 ? `
            <div style="margin-bottom:25px;">
              <h2 style="font-size:16px; font-weight:bold; color:${primaryColor}; margin:0 0 12px 0; border-bottom:1px solid #eee; padding-bottom:4px;">Interests</h2>
              <div style="font-size:12px; color:#444; font-family:sans-serif;">
                ${data.interests.map(i => escapeHTML(i.name)).join(' &nbsp;&bull;&nbsp; ')}
              </div>
            </div>
          ` : ''}

          ${data.social ? (() => {
            const links = Object.entries(data.social).filter(([k,v]) => v);
            if (links.length === 0) return '';
            return `
              <div style="margin-bottom:25px;">
                <h2 style="font-size:16px; font-weight:bold; color:${primaryColor}; margin:0 0 12px 0; border-bottom:1px solid #eee; padding-bottom:4px;">Social Links</h2>
                <div style="font-size:12px; color:#444; font-family:sans-serif; word-break:break-all;">
                  ${links.map(([k,v]) => `<strong>${escapeHTML(k)}:</strong> ${escapeHTML(v)}`).join(' &nbsp;&bull;&nbsp; ')}
                </div>
              </div>
            `;
          })() : ''}

          ${mwCustom(data.custom, primaryColor)}

        </div>
      </div>
    `;
  }
};

// ==================== HELPER FUNCTIONS ====================
function mwListSection(title, items, fn, color) {
  if (!items || items.length === 0) return '';
  return `
    <div style="margin-bottom:25px;">
      <h2 style="font-size:16px; font-weight:bold; color:${color}; margin:0 0 12px 0; border-bottom:1px solid #eee; padding-bottom:4px;">${title}</h2>
      <div>${items.map(fn).join('')}</div>
    </div>
  `;
}

function mwRefs(refs, color) {
  if (!refs) return '';
  if (refs.placeholder) {
    return `
      <div style="margin-bottom:25px;">
        <h2 style="font-size:16px; font-weight:bold; color:${color}; margin:0 0 12px 0; border-bottom:1px solid #eee; padding-bottom:4px;">References</h2>
        <p style="font-size:12px; color:#555; font-family:sans-serif;">Available upon request</p>
      </div>
    `;
  }
  if (!refs.list || refs.list.length === 0) return '';
  return mwListSection('References', refs.list, r => `
    <div style="font-size:12px; margin-bottom:6px; font-family:sans-serif;">
      <strong>${escapeHTML(r.name)}</strong> &mdash; ${escapeHTML(r.title)}, ${escapeHTML(r.company)}
      ${r.email ? `<br><span style="font-size:11px; color:#777;">${escapeHTML(r.email)}</span>` : ''}
      ${r.phone ? `<br><span style="font-size:11px; color:#777;">${escapeHTML(r.phone)}</span>` : ''}
    </div>
  `, color);
}

function mwCustom(custom, color) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items || []).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return mwListSection(sec.sectionName, items, item => `
      <div style="margin-bottom:6px;">
        <div style="font-size:12px; font-weight:bold;">${escapeHTML(item.title)}</div>
        ${item.description ? `<p style="font-size:12px; color:#555; margin:2px 0; font-family:sans-serif; white-space:pre-line;">${escapeHTML(item.description)}</p>` : ''}
      </div>
    `, color);
  }).join('');
}
