// templates/gradient-accent-resume.js — Gradient Accent Resume Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates['gradient-accent-resume'] = {
  name: 'Gradient Accent Resume',
  description: 'Vibrant coral-orange gradient header and divider lines, circular photo sidebar, and structured skills summary section',
  
  miniPreview() {
    return `<div class="mini-cv" style="font-family:sans-serif; background:#ffffff; width:100%; height:100%; box-sizing:border-box;">
      <div style="text-align:center; padding:4px;">
        <div style="font-size:6px; font-weight:bold; letter-spacing:0.5px;">JAMES LANE</div>
        <div style="background:linear-gradient(90deg, #FF5E62, #FF9966); color:#fff; font-size:3px; padding:1px; margin-top:2px; font-weight:bold;">Brand Manager</div>
      </div>
      <div style="display:flex; padding:4px; gap:4px;">
        <div style="width:32%;">
          <div style="width:12px; height:12px; border-radius:50%; background:#ccc; margin:0 auto 3px auto;"></div>
          <div style="font-size:2px; color:#555;">Milwaukee, US</div>
          <div style="height:1px; background:linear-gradient(90deg, #FF5E62, #FF9966); margin:3px 0;"></div>
          <div style="font-size:2.5px; font-weight:bold;">SELECTED PROJECTS</div>
        </div>
        <div style="width:68%;">
          <div style="font-size:3px; font-weight:bold; margin-bottom:2px;">Summary of Skills</div>
          <div style="font-size:2px; color:#555;">&bull; Drove research on consumer trends</div>
          <div style="height:1px; background:linear-gradient(90deg, #FF5E62, #FF9966); margin:4px 0;"></div>
          <div style="font-size:3px; font-weight:bold;">PROFESSIONAL EXPERIENCE</div>
        </div>
      </div>
    </div>`;
  },

  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    const gradientStyle = 'background: linear-gradient(90deg, #FF5E62 0%, #FF9966 100%);';
    const textColor = '#2D3748';

    return `
      <div style="font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#ffffff; color:${textColor}; max-width:800px; margin:0 auto; padding:25px 30px; box-shadow:0 0 10px rgba(0,0,0,0.06); text-align:left; box-sizing:border-box; word-break:break-word; overflow-wrap:break-word;">
        
        <!-- Header Section -->
        <div style="text-align:center; margin-bottom:20px;">
          <h1 style="font-size:28px; font-weight:700; color:#1A202C; text-transform:uppercase; letter-spacing:2px; margin:0 0 6px 0;">
            ${escapeHTML(p.fullName || 'JAMES LANE')}
          </h1>
          
          <div style="${gradientStyle} color:#ffffff; font-size:13px; font-weight:700; text-transform:capitalize; padding:6px 0; letter-spacing:0.5px;">
            ${escapeHTML(p.professionalTitle || 'Brand Manager')}
          </div>
        </div>

        <!-- Two Column Grid -->
        <div style="display:flex; gap:25px;">
          
          <!-- Left Sidebar (32% Width) -->
          <div style="width:32%; flex-shrink:0;">
            
            <!-- Circular Avatar Photo -->
            ${p.photo && !p.photo.startsWith('data:image/svg') ? `
              <div style="width:85px; height:85px; border-radius:50%; overflow:hidden; margin:0 auto 15px auto; background:#E2E8F0; border:2px solid #ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
                <img src="${escapeHTML(p.photo)}" alt="${escapeHTML(p.fullName)}" style="width:100%; height:100%; object-fit:cover;" />
              </div>
            ` : ''}

            <!-- Contact Information -->
            ${(p.phone || p.email || p.location || p.linkedin || p.website || p.github) ? `
              <div style="font-size:10.5px; color:#4A5568; line-height:1.7; margin-bottom:15px;">
                ${p.phone ? `<div style="margin-bottom:4px;">${escapeHTML(p.phone)}</div>` : ''}
                ${p.email ? `<div style="margin-bottom:4px; word-break:break-all;">${escapeHTML(p.email)}</div>` : ''}
                ${p.location ? `<div style="margin-bottom:4px;">${escapeHTML(p.location)}</div>` : ''}
                ${p.linkedin ? `<div style="margin-bottom:4px; word-break:break-all;">${escapeHTML(p.linkedin)}</div>` : ''}
                ${p.website ? `<div style="margin-bottom:4px; word-break:break-all;">${escapeHTML(p.website)}</div>` : ''}
                ${p.github ? `<div style="margin-bottom:4px; word-break:break-all;">${escapeHTML(p.github)}</div>` : ''}
              </div>
            ` : ''}

            <div style="height:2px; ${gradientStyle} margin-bottom:15px;"></div>

            <!-- Additional Skills / Tag Cloud -->
            ${data.skills && data.skills.length > 0 ? `
              <div style="margin-bottom:18px;">
                <h3 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 8px 0; letter-spacing:0.5px;">ADDITIONAL SKILLS</h3>
                <div style="font-size:10.5px; color:#4A5568; line-height:1.6; text-align:center;">
                  ${data.skills.map(skill => `&bull; ${escapeHTML(skill.name)}`).join(' ')}
                </div>
              </div>
              <div style="height:2px; ${gradientStyle} margin-bottom:15px;"></div>
            ` : ''}

            <!-- Selected Projects -->
            ${data.projects && data.projects.length > 0 ? `
              <div style="margin-bottom:18px;">
                <h3 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 10px 0; letter-spacing:0.5px;">SELECTED PROJECTS</h3>
                ${data.projects.map(proj => `
                  <div style="margin-bottom:10px; font-size:10.5px;">
                    <strong style="color:#2D3748;">${escapeHTML(proj.name)}</strong>
                    ${(proj.startDate || proj.endDate) ? `<div style="font-size:9.5px; color:#A0AEC0;">${formatDate(proj.startDate)} &ndash; ${formatDate(proj.endDate)}</div>` : ''}
                    ${proj.technologies ? `<div style="font-size:10px; color:#718096;">${escapeHTML(proj.technologies)}</div>` : ''}
                    ${proj.description ? `<p style="margin:2px 0; color:#718096; line-height:1.4; white-space:pre-line;">${escapeHTML(proj.description)}</p>` : ''}
                    ${(proj.github || proj.liveUrl) ? `<p style="margin:2px 0; font-size:9.5px; color:#718096; word-break:break-all;">${[proj.github, proj.liveUrl].filter(Boolean).map(escapeHTML).join(' | ')}</p>` : ''}
                  </div>
                `).join('')}
              </div>
              <div style="height:2px; ${gradientStyle} margin-bottom:15px;"></div>
            ` : ''}

            <!-- Languages -->
            ${data.languages && data.languages.length > 0 ? `
              <div style="margin-bottom:18px;">
                <h3 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 6px 0; letter-spacing:0.5px;">ADDITIONAL INFO.</h3>
                <div style="font-size:10.5px; color:#4A5568;">
                  Languages: ${data.languages.map(l => escapeHTML(l.name) + (l.proficiency ? ` (${escapeHTML(l.proficiency)})` : '')).join(', ')}
                </div>
              </div>
              <div style="height:2px; ${gradientStyle} margin-bottom:15px;"></div>
            ` : ''}

            <!-- Interests -->
            ${data.interests && data.interests.length > 0 ? `
              <div style="margin-bottom:18px;">
                <h3 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 6px 0; letter-spacing:0.5px;">INTERESTS</h3>
                <div style="font-size:10.5px; color:#4A5568; line-height:1.6;">
                  ${data.interests.map(i => `&bull; ${escapeHTML(i.name)}`).join(' ')}
                </div>
              </div>
              <div style="height:2px; ${gradientStyle} margin-bottom:15px;"></div>
            ` : ''}

            <!-- Social Links -->
            ${data.social ? (() => {
              const links = Object.entries(data.social).filter(([k,v]) => v);
              if (links.length === 0) return '';
              return `
                <div style="margin-bottom:18px;">
                  <h3 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 6px 0; letter-spacing:0.5px;">SOCIAL</h3>
                  <div style="font-size:10.5px; color:#4A5568; line-height:1.6;">
                    ${links.map(([k,v]) => `<div style="margin-bottom:4px; word-break:break-all;"><strong>${escapeHTML(k)}:</strong> ${escapeHTML(v)}</div>`).join('')}
                  </div>
                </div>
                <div style="height:2px; ${gradientStyle} margin-bottom:15px;"></div>
              `;
            })() : ''}

            <!-- Co-Curricular / Custom Activities -->
            ${gradientSidebarCustom(data.custom, gradientStyle)}

          </div>

          <!-- Right Main Content Area (68% Width) -->
          <div style="width:68%; flex-grow:1;">
            
            <!-- Summary of Skills Matrix -->
            ${s.text ? `
              <div style="margin-bottom:20px;">
                <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 10px 0; letter-spacing:0.5px;">SUMMARY OF SKILLS</h2>
                <div style="font-size:11px; line-height:1.55; color:#4A5568; white-space:pre-line;">
                  ${escapeHTML(s.text)}
                </div>
              </div>
              <div style="height:2px; ${gradientStyle} margin-bottom:20px;"></div>
            ` : ''}

            <!-- Professional Experience -->
            ${data.experience && data.experience.length > 0 ? `
              <div style="margin-bottom:20px;">
                <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 14px 0; letter-spacing:0.5px;">PROFESSIONAL EXPERIENCE</h2>
                
                ${data.experience.map(exp => `
                  <div style="margin-bottom:18px;">
                    <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:4px;">
                      <div style="font-size:13px; font-weight:700; color:#1A202C;">${escapeHTML(exp.jobTitle)}</div>
                      <div style="font-size:10.5px; color:#718096; font-weight:600; white-space:nowrap;">
                        ${formatDate(exp.startDate)} &ndash; ${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
                      </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:2px; flex-wrap:wrap; gap:4px;">
                      <div style="font-size:12px; font-weight:600; color:#2D3748;">${escapeHTML(exp.company)}${exp.employmentType ? ` <span style="font-size:10px; color:#A0AEC0;">(${escapeHTML(exp.employmentType)})</span>` : ''}</div>
                      ${exp.location ? `<div style="font-size:11px; font-weight:600; color:#4A5568;">${escapeHTML(exp.location)}</div>` : ''}
                    </div>

                    ${exp.description ? `<div style="font-size:10.5px; font-style:italic; color:#718096; margin:4px 0 6px 0; white-space:pre-line;">${escapeHTML(exp.description)}</div>` : ''}

                    ${exp.achievements ? `
                      <div style="font-size:11px; color:#4A5568; line-height:1.5; margin-top:4px;">
                        ${exp.achievements.split('\n').filter(Boolean).map(item => `
                          <div style="display:flex; align-items:flex-start; gap:6px; margin-bottom:3px;">
                            <span style="color:#2D3748; font-size:10px;">&bull;</span>
                            <span>${escapeHTML(item)}</span>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
              <div style="height:2px; ${gradientStyle} margin-bottom:20px;"></div>
            ` : ''}

            <!-- Education Section -->
            ${data.education && data.education.length > 0 ? `
              <div style="margin-bottom:20px;">
                <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 12px 0; letter-spacing:0.5px;">EDUCATION</h2>
                ${data.education.map(edu => `
                  <div style="margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:4px;">
                      <div style="font-size:12px; font-weight:700; color:#1A202C;">${escapeHTML(edu.school)}</div>
                      <div style="font-size:10.5px; color:#718096; font-weight:600; white-space:nowrap;">
                        ${formatDate(edu.startDate)}${edu.endDate ? ' &ndash; ' + formatDate(edu.endDate) : ''}
                      </div>
                    </div>
                    <div style="font-size:11px; color:#4A5568; margin-top:2px;">${escapeHTML(edu.degree)}${edu.fieldOfStudy ? ', ' + escapeHTML(edu.fieldOfStudy) : ''}</div>
                    ${edu.gpa ? `<div style="font-size:10.5px; color:#718096;">GPA: ${escapeHTML(edu.gpa)}</div>` : ''}
                    ${edu.description ? `<p style="font-size:10.5px; color:#718096; margin:2px 0; white-space:pre-line;">${escapeHTML(edu.description)}</p>` : ''}
                  </div>
                `).join('')}
              </div>
              <div style="height:2px; ${gradientStyle} margin-bottom:20px;"></div>
            ` : ''}

            <!-- Certifications -->
            ${gradientMainSection('CERTIFICATIONS', data.certifications, cert => `
              <div style="font-size:11px; color:#4A5568; margin-bottom:6px;">
                &bull; <strong>${escapeHTML(cert.name)}</strong>${cert.organization ? ' &mdash; ' + escapeHTML(cert.organization) : ''}${cert.issueDate ? ' (' + formatDate(cert.issueDate) + (cert.expiryDate ? ' &ndash; ' + formatDate(cert.expiryDate) : '') + ')' : ''}
                ${cert.credentialId ? `<br><span style="font-size:10px; color:#A0AEC0;">ID: ${escapeHTML(cert.credentialId)}</span>` : ''}
                ${cert.credentialUrl ? `<br><span style="font-size:10px; color:#A0AEC0; word-break:break-all;">${escapeHTML(cert.credentialUrl)}</span>` : ''}
              </div>
            `, gradientStyle)}

            <!-- Awards -->
            ${gradientMainSection('AWARDS', data.awards, a => `
              <div style="font-size:11px; color:#4A5568; margin-bottom:6px;">
                &bull; <strong>${escapeHTML(a.title)}</strong> &mdash; ${escapeHTML(a.issuer)}${a.date ? ' (' + formatDate(a.date) + ')' : ''}
                ${a.description ? `<p style="font-size:10.5px; color:#718096; margin:2px 0; white-space:pre-line;">${escapeHTML(a.description)}</p>` : ''}
              </div>
            `, gradientStyle)}

            <!-- Volunteer -->
            ${gradientMainSection('VOLUNTEER', data.volunteer, v => `
              <div style="margin-bottom:8px;">
                <div style="font-size:12px; font-weight:700; color:#1A202C;">${escapeHTML(v.role)} &mdash; ${escapeHTML(v.organization)}</div>
                <div style="font-size:10.5px; color:#718096; margin:1px 0;">${formatDate(v.startDate)} &ndash; ${formatDate(v.endDate)}${v.location ? ' &middot; ' + escapeHTML(v.location) : ''}</div>
                ${v.description ? `<p style="font-size:10.5px; color:#4A5568; margin:2px 0; white-space:pre-line;">${escapeHTML(v.description)}</p>` : ''}
              </div>
            `, gradientStyle)}

            <!-- Internships -->
            ${gradientMainSection('INTERNSHIPS', data.internships, it => `
              <div style="margin-bottom:8px;">
                <div style="font-size:12px; font-weight:700; color:#1A202C;">${escapeHTML(it.jobTitle)} &mdash; ${escapeHTML(it.company)}</div>
                <div style="font-size:10.5px; color:#718096; margin:1px 0;">${formatDate(it.startDate)} &ndash; ${formatDate(it.endDate)}${it.location ? ' &middot; ' + escapeHTML(it.location) : ''}</div>
                ${it.description ? `<p style="font-size:10.5px; color:#4A5568; margin:2px 0; white-space:pre-line;">${escapeHTML(it.description)}</p>` : ''}
              </div>
            `, gradientStyle)}

            <!-- Publications -->
            ${gradientMainSection('PUBLICATIONS', data.publications, pub => `
              <div style="font-size:11px; color:#4A5568; margin-bottom:4px;">
                &bull; <strong>${escapeHTML(pub.title)}</strong> &mdash; <em>${escapeHTML(pub.publisher)}</em>${pub.date ? ' (' + formatDate(pub.date) + ')' : ''}
                ${pub.doi ? `<br><span style="font-size:10px; color:#A0AEC0;">DOI: ${escapeHTML(pub.doi)}</span>` : ''}
                ${pub.url ? `<br><span style="font-size:10px; color:#A0AEC0; word-break:break-all;">${escapeHTML(pub.url)}</span>` : ''}
              </div>
            `, gradientStyle)}

            <!-- Conferences -->
            ${gradientMainSection('CONFERENCES', data.conferences, c => `
              <div style="font-size:11px; color:#4A5568; margin-bottom:4px;">
                &bull; <strong>${escapeHTML(c.name)}</strong> &mdash; <em>${escapeHTML(c.role)}</em>${c.date ? ' (' + formatDate(c.date) + ')' : ''}${c.location ? ' &middot; ' + escapeHTML(c.location) : ''}
                ${c.description ? `<p style="font-size:10.5px; color:#718096; margin:2px 0; white-space:pre-line;">${escapeHTML(c.description)}</p>` : ''}
              </div>
            `, gradientStyle)}

            <!-- References -->
            ${gradientSidebarRefs(data.references)}

          </div>
        </div>
      </div>
    `;
  }
};

// ==================== HELPER FUNCTIONS ====================
function gradientMainSection(title, items, fn, gradientStyle) {
  if (!items || items.length === 0) return '';
  return `
    <div style="margin-bottom:20px;">
      <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 10px 0; letter-spacing:0.5px;">${title}</h2>
      <div>${items.map(fn).join('')}</div>
    </div>
    <div style="height:2px; ${gradientStyle} margin-bottom:20px;"></div>
  `;
}

function gradientSidebarRefs(refs) {
  if (!refs) return '';
  if (refs.placeholder) {
    return `
      <div>
        <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 6px 0; letter-spacing:0.5px;">REFERENCES</h2>
        <p style="font-size:10.5px; color:#4A5568; margin:0;">Available upon request.</p>
      </div>
    `;
  }
  if (!refs.list || refs.list.length === 0) return '';
  return `
    <div>
      <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 8px 0; letter-spacing:0.5px;">REFERENCES</h2>
      ${refs.list.map(r => `
        <div style="font-size:10.5px; color:#4A5568; margin-bottom:6px;">
          <strong>${escapeHTML(r.name)}</strong>${r.title ? ' &mdash; ' + escapeHTML(r.title) : ''}${r.company ? ', ' + escapeHTML(r.company) : ''}
          ${r.email ? `<br><span style="color:#718096; word-break:break-all;">${escapeHTML(r.email)}</span>` : ''}
          ${r.phone ? ` | ${escapeHTML(r.phone)}` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function gradientSidebarCustom(custom, gradientStyle) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items || []).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return `
      <div style="margin-bottom:18px;">
        <h3 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#1A202C; margin:0 0 8px 0; letter-spacing:0.5px;">${escapeHTML(sec.sectionName.toUpperCase())}</h3>
        ${items.map(item => `
          <div style="font-size:10.5px; color:#4A5568; margin-bottom:6px;">
            &bull; <strong>${escapeHTML(item.title)}</strong>
            ${item.description ? `<div style="font-size:10px; color:#718096; white-space:pre-line;">${escapeHTML(item.description)}</div>` : ''}
          </div>
        `).join('')}
      </div>
      <div style="height:2px; ${gradientStyle} margin-bottom:15px;"></div>
    `;
  }).join('');
}
