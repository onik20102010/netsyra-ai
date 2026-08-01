// templates/split-sidebar-functional.js — Split Sidebar Functional Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates['split-sidebar-functional'] = {
  name: 'Split Sidebar Functional',
  description: 'Full-height gray sidebar with a periwinkle photo banner, organized skill categories, and icon section headers',
  
  miniPreview() {
    return `<div class="mini-cv" style="font-family:sans-serif; background:#ffffff; width:100%; height:100%; display:flex; box-sizing:border-box;">
      <div style="width:35%; background:#E2E4E7; padding:4px;">
        <div style="background:#7B96C2; color:#fff; padding:3px; margin-bottom:4px;">
          <div style="font-size:4px; font-weight:bold;">Malcolm Mitchell</div>
          <div style="font-size:2.5px; opacity:0.8;">Job title</div>
        </div>
        <div style="font-size:3px; font-weight:bold; margin-top:4px;">FOLLOW ME</div>
        <div style="font-size:2px; color:#555;">LinkedIn/name</div>
        <div style="font-size:3px; font-weight:bold; margin-top:4px;">EDUCATION</div>
        <div style="font-size:2px; color:#555;">University 2014&ndash;2017</div>
      </div>
      <div style="width:65%; padding:6px;">
        <div style="font-size:3px; font-weight:bold; text-transform:uppercase;">PROFILE</div>
        <div style="font-size:2px; color:#555; margin-bottom:6px;">Write a short brief introduction...</div>
        <div style="font-size:3.5px; font-weight:bold; border-bottom:1px solid #ccc; padding-bottom:1px;">SKILLS</div>
        <div style="font-size:2px; color:#7B96C2; font-weight:bold; margin-top:3px;">PROFESSIONAL</div>
        <div style="font-size:2px; color:#555;">&bull; Briefly describe skills...</div>
      </div>
    </div>`;
  },

  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    const primaryColor = '#7B96C2';
    const sidebarBg = '#E2E4E7';
    const textColor = '#2D3748';

    return `
      <div style="font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#ffffff; color:${textColor}; max-width:800px; margin:0 auto; box-shadow:0 0 10px rgba(0,0,0,0.06); text-align:left; box-sizing:border-box; display:flex; word-break:break-word; overflow-wrap:break-word;">
        
        <!-- Left Sidebar Column (35% Width) -->
        <div style="width:35%; background-color:${sidebarBg}; flex-shrink:0; box-sizing:border-box; display:flex; flex-direction:column;">
          
          <!-- Photo & Name Accent Banner -->
          <div>
            ${p.photo && !p.photo.includes('svg') ? `
              <div style="width:100%; height:140px; overflow:hidden; background:#CBD5E0;">
                <img src="${escapeHTML(p.photo)}" alt="${escapeHTML(p.fullName)}" style="width:100%; height:100%; object-fit:cover;" />
              </div>
            ` : ''}
            
            <div style="background-color:${primaryColor}; color:#ffffff; padding:16px; box-sizing:border-box;">
              <h1 style="font-size:18px; font-weight:700; text-transform:uppercase; margin:0; line-height:1.2; letter-spacing:0.5px;">
                ${escapeHTML(p.fullName || 'Malcolm Mitchell')}
              </h1>
              <div style="font-size:11px; opacity:0.9; margin-top:4px; font-weight:300;">
                ${escapeHTML(p.professionalTitle || 'Job Title')}
              </div>
            </div>
          </div>

          <!-- Sidebar Inner Content -->
          <div style="padding:20px; font-size:11px; color:#4A5568; line-height:1.5; flex-grow:1;">
            
            <!-- Follow Me / Social Profiles -->
            ${(p.linkedin || p.website || p.github) ? `
              <div style="margin-bottom:22px;">
                <h3 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 10px 0; letter-spacing:0.5px;">FOLLOW ME</h3>
                ${p.linkedin ? `<div style="margin-bottom:8px;"><strong style="color:#2D3748; display:block;">LinkedIn</strong><span style="word-break:break-all; font-size:10.5px;">${escapeHTML(p.linkedin)}</span></div>` : ''}
                ${p.website ? `<div style="margin-bottom:8px;"><strong style="color:#2D3748; display:block;">Website</strong><span style="word-break:break-all; font-size:10.5px;">${escapeHTML(p.website)}</span></div>` : ''}
                ${p.github ? `<div style="margin-bottom:8px;"><strong style="color:#2D3748; display:block;">GitHub</strong><span style="word-break:break-all; font-size:10.5px;">${escapeHTML(p.github)}</span></div>` : ''}
              </div>
            ` : ''}

            <!-- Social Links from data.social -->
            ${data.social ? (() => {
              const links = Object.entries(data.social).filter(([k,v]) => v);
              if (links.length === 0) return '';
              return `
                <div style="margin-bottom:22px;">
                  <h3 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 10px 0; letter-spacing:0.5px;">SOCIAL</h3>
                  ${links.map(([k,v]) => `<div style="margin-bottom:8px;"><strong style="color:#2D3748; display:block;">${escapeHTML(k)}</strong><span style="word-break:break-all; font-size:10.5px;">${escapeHTML(v)}</span></div>`).join('')}
                </div>
              `;
            })() : ''}

            <!-- Education Section -->
            ${data.education && data.education.length > 0 ? `
              <div style="margin-bottom:22px;">
                <h3 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 12px 0; letter-spacing:0.5px;">EDUCATION</h3>
                ${data.education.map(edu => `
                  <div style="margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:4px;">
                      <strong style="color:#1A202C;">${escapeHTML(edu.school)}</strong>
                      ${edu.startDate || edu.endDate ? `<span style="font-size:10px; color:#718096; font-weight:600; white-space:nowrap;">${formatDate(edu.startDate)}&ndash;${formatDate(edu.endDate)}</span>` : ''}
                    </div>
                    <div style="font-size:10.5px; color:#4A5568;">${escapeHTML(edu.degree)}${edu.fieldOfStudy ? ', ' + escapeHTML(edu.fieldOfStudy) : ''}</div>
                    ${edu.gpa ? `<div style="font-size:10px; color:#718096;">GPA: ${escapeHTML(edu.gpa)}</div>` : ''}
                    ${edu.description ? `<p style="font-size:10px; color:#718096; margin:2px 0; white-space:pre-line;">${escapeHTML(edu.description)}</p>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Languages -->
            ${data.languages && data.languages.length > 0 ? `
              <div style="margin-bottom:22px;">
                <h3 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 10px 0; letter-spacing:0.5px;">LANGUAGES</h3>
                ${data.languages.map(l => `<div style="margin-bottom:4px; font-size:10.5px;"><strong>${escapeHTML(l.name)}</strong>${l.proficiency ? ' (' + escapeHTML(l.proficiency) + ')' : ''}</div>`).join('')}
              </div>
            ` : ''}

            <!-- Interests -->
            ${data.interests && data.interests.length > 0 ? `
              <div style="margin-bottom:22px;">
                <h3 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 10px 0; letter-spacing:0.5px;">INTERESTS</h3>
                ${data.interests.map(i => `<div style="font-size:10.5px; color:#4A5568; margin-bottom:3px;">&bull; ${escapeHTML(i.name)}</div>`).join('')}
              </div>
            ` : ''}

            <!-- References Section -->
            ${data.references && (data.references.list?.length > 0 || data.references.placeholder) ? `
              <div style="margin-bottom:22px;">
                <h3 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 10px 0; letter-spacing:0.5px;">REFERENCES</h3>
                ${data.references.placeholder ? `
                  <div style="font-size:10.5px; color:#4A5568;">Available on request.</div>
                ` : ` 
                  ${data.references.list.map(r => `
                    <div style="font-size:10.5px; margin-bottom:8px;">
                      <strong>${escapeHTML(r.name)}</strong>${r.title ? ` &mdash; ${escapeHTML(r.title)}` : ''}
                      ${r.company ? `<div>${escapeHTML(r.company)}</div>` : ''}
                      ${r.email ? `<div style="word-break:break-all; color:#718096;">${escapeHTML(r.email)}</div>` : ''}
                      ${r.phone ? `<div style="color:#718096;">${escapeHTML(r.phone)}</div>` : ''}
                    </div>
                  `).join('')}
                `}
              </div>
            ` : ''}

          </div>
        </div>

        <!-- Right Main Column (65% Width) -->
        <div style="width:65%; padding:30px; box-sizing:border-box; flex-grow:1;">
          
          <!-- Profile Summary Header Block -->
          <div style="display:flex; justify-content:space-between; gap:20px; margin-bottom:28px; flex-wrap:wrap;">
            <div style="flex-grow:1; min-width:200px;">
              <h2 style="font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#1A202C; margin:0 0 8px 0;">PROFILE</h2>
              <p style="font-size:11px; line-height:1.5; color:#4A5568; margin:0; white-space:pre-line;">
                ${escapeHTML(s.text || '')}
              </p>
            </div>

            <!-- Top Contact Information Block -->
            ${(p.location || p.phone || p.email) ? `
              <div style="font-size:10.5px; color:#4A5568; flex-shrink:0; line-height:1.7;">
                ${p.location ? `<div style="margin-bottom:4px;">${escapeHTML(p.location)}</div>` : ''}
                ${p.phone ? `<div style="margin-bottom:4px;">${escapeHTML(p.phone)}</div>` : ''}
                ${p.email ? `<div style="margin-bottom:4px; word-break:break-all;">${escapeHTML(p.email)}</div>` : ''}
              </div>
            ` : ''}
          </div>

          <!-- Skills Section (Functional Skill Categories Grid) -->
          ${data.skills && data.skills.length > 0 ? `
            <div style="margin-bottom:28px;">
              <div style="display:flex; align-items:center; gap:8px; border-bottom:1px solid #E2E8F0; padding-bottom:6px; margin-bottom:16px;">
                <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#1A202C; margin:0;">SKILLS</h2>
              </div>

              ${data.skills.map(skill => `
                <div style="display:flex; margin-bottom:14px; gap:15px; flex-wrap:wrap;">
                  <div style="width:30%; font-size:10.5px; font-weight:800; text-transform:uppercase; color:${primaryColor}; flex-shrink:0; padding-top:2px;">
                    ${escapeHTML(skill.name)}
                  </div>
                  
                  <div style="width:65%; font-size:11px; color:#4A5568; line-height:1.5;">
                    ${skill.level ? `
                      ${skill.level.split('\n').filter(Boolean).map(bullet => `
                        <div style="display:flex; align-items:flex-start; gap:6px; margin-bottom:3px;">
                          <span style="font-size:10px; color:#1A202C;">&#9642;</span>
                          <span>${escapeHTML(bullet.replace(/^[\s\u2022\-\*]+/, ''))}</span>
                        </div>
                      `).join('')}
                    ` : ` 
                      <div style="display:flex; align-items:flex-start; gap:6px;">
                        <span style="font-size:10px; color:#1A202C;">&#9642;</span>
                        <span>Briefly describe your most relevant skills in this competency area.</span>
                      </div>
                    `}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Career / Work Experience Section -->
          ${data.experience && data.experience.length > 0 ? `
            <div style="margin-bottom:28px;">
              <div style="display:flex; align-items:center; gap:8px; border-bottom:1px solid #E2E8F0; padding-bottom:6px; margin-bottom:16px;">
                <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#1A202C; margin:0;">CAREER</h2>
              </div>

              ${data.experience.map(exp => `
                <div style="margin-bottom:14px;">
                  <div style="display:flex; justify-content:space-between; align-items:baseline; font-size:11px; flex-wrap:wrap; gap:4px;">
                    <div>
                      <strong style="text-transform:uppercase; color:#1A202C;">${escapeHTML(exp.jobTitle)}</strong>
                      ${exp.company ? `<span style="color:#718096; margin-left:10px;">${escapeHTML(exp.company)}</span>` : ''}
                      ${exp.employmentType ? `<span style="color:#A0AEC0; margin-left:6px; font-size:10px;">(${escapeHTML(exp.employmentType)})</span>` : ''}
                    </div>
                    <div style="font-weight:600; color:#4A5568; white-space:nowrap;">
                      ${formatDate(exp.startDate)} &ndash; ${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
                    </div>
                  </div>
                  ${exp.location ? `<div style="font-size:10px; color:#A0AEC0; margin:1px 0;">${escapeHTML(exp.location)}</div>` : ''}
                  ${exp.description ? `<p style="font-size:10.5px; color:#718096; margin:3px 0 0 0; line-height:1.4; white-space:pre-line;">${escapeHTML(exp.description)}</p>` : ''}
                  ${exp.achievements ? `
                    <div style="margin-top:3px; font-size:10.5px; color:#718096; line-height:1.4;">
                      ${exp.achievements.split('\n').filter(Boolean).map(item => `<div style="display:flex; align-items:flex-start; gap:6px; margin-bottom:2px;"><span style="font-size:8px; color:#A0AEC0; margin-top:2px;">&bull;</span><span>${escapeHTML(item)}</span></div>`).join('')}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Projects Section -->
          ${splitSidebarFuncSection('PROJECTS', data.projects, proj => `
            <div style="margin-bottom:12px;">
              <div style="font-size:11.5px; font-weight:700; color:#1A202C;">${escapeHTML(proj.name)}</div>
              ${(proj.startDate || proj.endDate) ? `<div style="font-size:10px; color:#A0AEC0; margin:1px 0;">${formatDate(proj.startDate)} &ndash; ${formatDate(proj.endDate)}</div>` : ''}
              ${proj.technologies ? `<div style="font-size:10px; color:${primaryColor}; margin:1px 0;">${escapeHTML(proj.technologies)}</div>` : ''}
              ${proj.description ? `<p style="font-size:10.5px; color:#4A5568; margin:2px 0; line-height:1.4; white-space:pre-line;">${escapeHTML(proj.description)}</p>` : ''}
              ${(proj.github || proj.liveUrl) ? `<p style="font-size:10px; color:#718096; word-break:break-all;">${[proj.github, proj.liveUrl].filter(Boolean).map(escapeHTML).join(' | ')}</p>` : ''}
            </div>
          `)}

          <!-- Certifications Section -->
          ${splitSidebarFuncSection('CERTIFICATIONS', data.certifications, cert => `
            <div style="font-size:11px; color:#4A5568; margin-bottom:6px;">
              &#9642; <strong>${escapeHTML(cert.name)}</strong>${cert.organization ? ' &mdash; ' + escapeHTML(cert.organization) : ''}${cert.issueDate ? ' (' + formatDate(cert.issueDate) + (cert.expiryDate ? ' &ndash; ' + formatDate(cert.expiryDate) : '') + ')' : ''}
              ${cert.credentialId ? `<br><span style="font-size:10px; color:#A0AEC0;">ID: ${escapeHTML(cert.credentialId)}</span>` : ''}
              ${cert.credentialUrl ? `<br><span style="font-size:10px; color:#A0AEC0; word-break:break-all;">${escapeHTML(cert.credentialUrl)}</span>` : ''}
            </div>
          `)}

          <!-- Awards -->
          ${splitSidebarFuncSection('AWARDS', data.awards, a => `
            <div style="font-size:11px; color:#4A5568; margin-bottom:6px;">
              &#9642; <strong>${escapeHTML(a.title)}</strong> &mdash; ${escapeHTML(a.issuer)}${a.date ? ' (' + formatDate(a.date) + ')' : ''}
              ${a.description ? `<p style="font-size:10.5px; color:#718096; margin:2px 0; white-space:pre-line;">${escapeHTML(a.description)}</p>` : ''}
            </div>
          `)}

          <!-- Volunteer -->
          ${splitSidebarFuncSection('VOLUNTEER', data.volunteer, v => `
            <div style="margin-bottom:8px;">
              <div style="font-size:11.5px; font-weight:700; color:#1A202C;">${escapeHTML(v.role)} &mdash; ${escapeHTML(v.organization)}</div>
              <div style="font-size:10px; color:#A0AEC0; margin:1px 0;">${formatDate(v.startDate)} &ndash; ${formatDate(v.endDate)}${v.location ? ' &middot; ' + escapeHTML(v.location) : ''}</div>
              ${v.description ? `<p style="font-size:10.5px; color:#4A5568; margin:2px 0; white-space:pre-line;">${escapeHTML(v.description)}</p>` : ''}
            </div>
          `)}

          <!-- Internships -->
          ${splitSidebarFuncSection('INTERNSHIPS', data.internships, it => `
            <div style="margin-bottom:8px;">
              <div style="font-size:11.5px; font-weight:700; color:#1A202C;">${escapeHTML(it.jobTitle)} &mdash; ${escapeHTML(it.company)}</div>
              <div style="font-size:10px; color:#A0AEC0; margin:1px 0;">${formatDate(it.startDate)} &ndash; ${formatDate(it.endDate)}${it.location ? ' &middot; ' + escapeHTML(it.location) : ''}</div>
              ${it.description ? `<p style="font-size:10.5px; color:#4A5568; margin:2px 0; white-space:pre-line;">${escapeHTML(it.description)}</p>` : ''}
            </div>
          `)}

          <!-- Publications -->
          ${splitSidebarFuncSection('PUBLICATIONS', data.publications, pub => `
            <div style="font-size:11px; color:#4A5568; margin-bottom:4px;">
              &#9642; <strong>${escapeHTML(pub.title)}</strong> &mdash; <em>${escapeHTML(pub.publisher)}</em>${pub.date ? ' (' + formatDate(pub.date) + ')' : ''}
              ${pub.doi ? `<br><span style="font-size:10px; color:#A0AEC0;">DOI: ${escapeHTML(pub.doi)}</span>` : ''}
              ${pub.url ? `<br><span style="font-size:10px; color:#A0AEC0; word-break:break-all;">${escapeHTML(pub.url)}</span>` : ''}
            </div>
          `)}

          <!-- Conferences -->
          ${splitSidebarFuncSection('CONFERENCES', data.conferences, c => `
            <div style="font-size:11px; color:#4A5568; margin-bottom:4px;">
              &#9642; <strong>${escapeHTML(c.name)}</strong> &mdash; <em>${escapeHTML(c.role)}</em>${c.date ? ' (' + formatDate(c.date) + ')' : ''}${c.location ? ' &middot; ' + escapeHTML(c.location) : ''}
              ${c.description ? `<p style="font-size:10.5px; color:#718096; margin:2px 0; white-space:pre-line;">${escapeHTML(c.description)}</p>` : ''}
            </div>
          `)}

          ${splitSidebarFuncCustom(data.custom)}

        </div>
      </div>
    `;
  }
};

// ==================== HELPER FUNCTIONS ====================
function splitSidebarFuncSection(title, items, fn) {
  if (!items || items.length === 0) return '';
  return `
    <div style="margin-bottom:28px;">
      <div style="display:flex; align-items:center; gap:8px; border-bottom:1px solid #E2E8F0; padding-bottom:6px; margin-bottom:14px;">
        <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#1A202C; margin:0;">${title}</h2>
      </div>
      <div>${items.map(fn).join('')}</div>
    </div>
  `;
}

function splitSidebarFuncCustom(custom) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items || []).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return splitSidebarFuncSection(sec.sectionName.toUpperCase(), items, item => `
      <div style="margin-bottom:8px;">
        <div style="font-size:11px; font-weight:bold; color:#1A202C;">${escapeHTML(item.title)}</div>
        ${item.description ? `<p style="font-size:10.5px; color:#4A5568; margin:2px 0; white-space:pre-line;">${escapeHTML(item.description)}</p>` : ''}
      </div>
    `);
  }).join('');
}
