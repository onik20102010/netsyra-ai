// templates/dark-chevron-sidebar.js — Dark Chevron Sidebar Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates['dark-chevron-sidebar'] = {
  name: 'Dark Chevron Sidebar',
  description: 'Dark charcoal top header with a chevron pointing angle, warm beige sidebar, circular avatar, and horizontal section divider lines',
  
  miniPreview() {
    return `<div class="mini-cv" style="font-family:sans-serif; background:#ffffff; width:100%; height:100%; box-sizing:border-box; display:flex; flex-direction:column;">
      <div style="background:#363A40; color:#fff; padding:6px; display:flex; align-items:center; gap:6px; position:relative;">
        <div style="width:12px; height:12px; border-radius:50%; background:#EE9B00;"></div>
        <div>
          <div style="font-size:5px; font-weight:bold;">Holly Jacob</div>
          <div style="font-size:3px; opacity:0.8;">Tailor</div>
        </div>
      </div>
      <div style="display:flex; flex-grow:1;">
        <div style="width:33%; background:#EFECE6; padding:4px;">
          <div style="font-size:2.5px; font-weight:bold; margin-bottom:2px;">Contact Details</div>
          <div style="font-size:2px; color:#555;">hollyjacob@gmail.com</div>
        </div>
        <div style="width:67%; padding:5px;">
          <div style="font-size:3px; font-weight:bold; border-bottom:1px solid #ccc; padding-bottom:1px;">Summary</div>
          <div style="font-size:2px; color:#555; margin-top:2px;">Experienced tailor with a passion...</div>
        </div>
      </div>
    </div>`;
  },

  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    const headerBg = '#363A40';
    const sidebarBg = '#EFECE6';
    const textColor = '#2B2D31';

    return `
      <div style="font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#ffffff; color:${textColor}; max-width:800px; margin:0 auto; box-shadow:0 0 10px rgba(0,0,0,0.06); text-align:left; box-sizing:border-box; word-break:break-word; overflow-wrap:break-word;">
        
        <!-- Top Dark Header Banner with Chevron -->
        <div style="position:relative; background-color:${headerBg}; color:#ffffff; padding:25px 30px; display:flex; align-items:center; gap:25px;">
          
          ${p.photo && !p.photo.includes('svg') ? `
            <div style="width:85px; height:85px; border-radius:50%; overflow:hidden; flex-shrink:0; background:#666666; border:2px solid #ffffff;">
              <img src="${escapeHTML(p.photo)}" alt="${escapeHTML(p.fullName)}" style="width:100%; height:100%; object-fit:cover;" />
            </div>
          ` : ''}

          <div>
            <h1 style="font-size:28px; font-weight:400; color:#ffffff; margin:0 0 4px 0; letter-spacing:0.5px;">
              ${escapeHTML(p.fullName || 'Holly Jacob')}
            </h1>
            <div style="font-size:13px; color:#D1D5DB; font-weight:300;">
              ${escapeHTML(p.professionalTitle || 'Tailor')}
            </div>
          </div>

          <div style="position:absolute; bottom:-12px; left:0; width:33%; height:0; border-top:12px solid ${headerBg}; border-right:130px solid transparent; z-index:2;"></div>
        </div>

        <!-- Main Body Grid Layout -->
        <div style="display:flex; min-height:600px;">
          
          <!-- Beige Left Sidebar (33% Width) -->
          <div style="width:33%; background-color:${sidebarBg}; padding:35px 20px 25px 25px; box-sizing:border-box; flex-shrink:0;">
            
            <!-- Contact Details -->
            ${(p.email || p.phone || p.location || p.linkedin || p.website || p.github) ? `
              <div style="margin-bottom:28px;">
                <h3 style="font-size:13px; font-weight:700; color:#1A1C1E; margin:0 0 14px 0;">Contact Details</h3>
                
                <div style="font-size:11px; color:#4A4D52; line-height:1.6;">
                  ${p.email ? `<div style="margin-bottom:10px; word-break:break-all;">${escapeHTML(p.email)}</div>` : ''}
                  ${p.phone ? `<div style="margin-bottom:10px;">${escapeHTML(p.phone)}</div>` : ''}
                  ${p.location ? `<div style="margin-bottom:10px;">${escapeHTML(p.location)}</div>` : ''}
                  ${p.linkedin ? `<div style="margin-bottom:10px; word-break:break-all;">${escapeHTML(p.linkedin)}</div>` : ''}
                  ${p.website ? `<div style="margin-bottom:10px; word-break:break-all;">${escapeHTML(p.website)}</div>` : ''}
                  ${p.github ? `<div style="margin-bottom:10px; word-break:break-all;">${escapeHTML(p.github)}</div>` : ''}
                </div>
              </div>
            ` : ''}

            <!-- Education Section -->
            ${data.education && data.education.length > 0 ? `
              <div style="margin-bottom:28px;">
                <h3 style="font-size:13px; font-weight:700; color:#1A1C1E; margin:0 0 14px 0;">Education</h3>
                ${data.education.map(edu => `
                  <div style="margin-bottom:14px; font-size:11px; line-height:1.45;">
                    <div style="display:flex; gap:6px;">
                      <span style="color:#1A1C1E; font-size:10px; margin-top:2px;">&bull;</span>
                      <div>
                        <strong style="color:#1A1C1E; display:block;">${escapeHTML(edu.degree)}${edu.fieldOfStudy ? ', ' + escapeHTML(edu.fieldOfStudy) : ''}</strong>
                        <div style="color:#4A4D52;">${escapeHTML(edu.school)}</div>
                        <div style="color:#71747A; font-size:10px; margin-top:2px;">
                          ${formatDate(edu.startDate)}${edu.endDate ? ' &ndash; ' + formatDate(edu.endDate) : ''}
                        </div>
                        ${edu.gpa ? `<div style="color:#71747A; font-size:10px;">GPA: ${escapeHTML(edu.gpa)}</div>` : ''}
                        ${edu.description ? `<p style="color:#71747A; font-size:10px; margin:2px 0; white-space:pre-line;">${escapeHTML(edu.description)}</p>` : ''}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Skills Section -->
            ${data.skills && data.skills.length > 0 ? `
              <div style="margin-bottom:28px;">
                <h3 style="font-size:13px; font-weight:700; color:#1A1C1E; margin:0 0 14px 0;">Skills</h3>
                <div style="font-size:11px; color:#4A4D52; line-height:1.8;">
                  ${data.skills.map(skill => `<div>${escapeHTML(skill.name)}${skill.level ? ' &ndash; ' + escapeHTML(skill.level) : ''}</div>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Languages -->
            ${data.languages && data.languages.length > 0 ? `
              <div style="margin-bottom:28px;">
                <h3 style="font-size:13px; font-weight:700; color:#1A1C1E; margin:0 0 10px 0;">Languages</h3>
                <div style="font-size:11px; color:#4A4D52; line-height:1.6;">
                  ${data.languages.map(l => `<div>${escapeHTML(l.name)}${l.proficiency ? ' &ndash; ' + escapeHTML(l.proficiency) : ''}</div>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Interests -->
            ${data.interests && data.interests.length > 0 ? `
              <div style="margin-bottom:28px;">
                <h3 style="font-size:13px; font-weight:700; color:#1A1C1E; margin:0 0 10px 0;">Interests</h3>
                <div style="font-size:11px; color:#4A4D52; line-height:1.6;">
                  ${data.interests.map(i => `<div>&bull; ${escapeHTML(i.name)}</div>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Social Links -->
            ${data.social ? (() => {
              const links = Object.entries(data.social).filter(([k,v]) => v);
              if (links.length === 0) return '';
              return `
                <div style="margin-bottom:28px;">
                  <h3 style="font-size:13px; font-weight:700; color:#1A1C1E; margin:0 0 10px 0;">Social</h3>
                  <div style="font-size:11px; color:#4A4D52; line-height:1.6;">
                    ${links.map(([k,v]) => `<div style="margin-bottom:4px; word-break:break-all;"><strong>${escapeHTML(k)}:</strong> ${escapeHTML(v)}</div>`).join('')}
                  </div>
                </div>
              `;
            })() : ''}

          </div>

          <!-- Main Right Content Column (67% Width) -->
          <div style="width:67%; padding:30px 25px 25px 30px; box-sizing:border-box; flex-grow:1;">
            
            <!-- Summary -->
            ${s.text ? `
              <div style="margin-bottom:25px;">
                <h2 style="font-size:15px; font-weight:700; color:#1A1C1E; margin:0 0 6px 0;">Summary</h2>
                <div style="border-bottom:1px solid #D1D5DB; margin-bottom:10px;"></div>
                <p style="font-size:11px; line-height:1.6; color:#4A4D52; margin:0; white-space:pre-line;">
                  ${escapeHTML(s.text)}
                </p>
              </div>
            ` : ''}

            <!-- Work Experience -->
            ${data.experience && data.experience.length > 0 ? `
              <div style="margin-bottom:25px;">
                <h2 style="font-size:15px; font-weight:700; color:#1A1C1E; margin:0 0 6px 0;">Work Experience</h2>
                <div style="border-bottom:1px solid #D1D5DB; margin-bottom:14px;"></div>
                
                ${data.experience.map(exp => `
                  <div style="margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:4px;">
                      <div style="font-size:12px; font-weight:700; color:#1A1C1E;">
                        ${escapeHTML(exp.jobTitle)}${exp.company ? ', ' + escapeHTML(exp.company) : ''}${exp.employmentType ? ` (${escapeHTML(exp.employmentType)})` : ''}
                      </div>
                      <div style="font-size:10.5px; color:#888888; white-space:nowrap;">
                        ${formatDate(exp.startDate)} &ndash; ${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
                      </div>
                    </div>

                    ${exp.location ? `<div style="font-size:10.5px; color:#888888; margin:1px 0;">${escapeHTML(exp.location)}</div>` : ''}

                    ${exp.description ? `<p style="font-size:11px; color:#4A4D52; margin:4px 0 6px 0; line-height:1.5; white-space:pre-line;">${escapeHTML(exp.description)}</p>` : ''}

                    ${exp.achievements ? `
                      <div style="font-size:11px; color:#4A4D52; line-height:1.5;">
                        ${exp.achievements.split('\n').filter(Boolean).map(item => `
                          <div style="display:flex; align-items:flex-start; gap:6px; margin-bottom:4px;">
                            <span style="color:#1A1C1E; font-size:10px; margin-top:1px;">&bull;</span>
                            <span>${escapeHTML(item)}</span>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Projects Section -->
            ${darkChevronSection('Projects', data.projects, proj => `
              <div style="margin-bottom:12px;">
                <div style="font-size:12px; font-weight:700; color:#1A1C1E;">${escapeHTML(proj.name)}</div>
                ${(proj.startDate || proj.endDate) ? `<div style="font-size:10px; color:#888888; margin:1px 0;">${formatDate(proj.startDate)} &ndash; ${formatDate(proj.endDate)}</div>` : ''}
                ${proj.technologies ? `<div style="font-size:10px; color:#777777; margin:2px 0;">${escapeHTML(proj.technologies)}</div>` : ''}
                ${proj.description ? `<p style="font-size:11px; color:#4A4D52; margin:2px 0; line-height:1.5; white-space:pre-line;">${escapeHTML(proj.description)}</p>` : ''}
                ${(proj.github || proj.liveUrl) ? `<p style="font-size:10px; color:#777777; word-break:break-all;">${[proj.github, proj.liveUrl].filter(Boolean).map(escapeHTML).join(' | ')}</p>` : ''}
              </div>
            `)}

            <!-- Certifications -->
            ${darkChevronSection('Certifications', data.certifications, cert => `
              <div style="font-size:11px; color:#4A4D52; margin-bottom:6px;">
                &bull; <strong style="color:#1A1C1E;">${escapeHTML(cert.name)}</strong>${cert.organization ? ' &mdash; ' + escapeHTML(cert.organization) : ''}${cert.issueDate ? ' (' + formatDate(cert.issueDate) + (cert.expiryDate ? ' &ndash; ' + formatDate(cert.expiryDate) : '') + ')' : ''}
                ${cert.credentialId ? `<br><span style="font-size:10px; color:#777777;">ID: ${escapeHTML(cert.credentialId)}</span>` : ''}
                ${cert.credentialUrl ? `<br><span style="font-size:10px; color:#777777; word-break:break-all;">${escapeHTML(cert.credentialUrl)}</span>` : ''}
              </div>
            `)}

            <!-- Awards -->
            ${darkChevronSection('Awards', data.awards, a => `
              <div style="font-size:11px; color:#4A4D52; margin-bottom:6px;">
                &bull; <strong style="color:#1A1C1E;">${escapeHTML(a.title)}</strong> &mdash; ${escapeHTML(a.issuer)}${a.date ? ' (' + formatDate(a.date) + ')' : ''}
                ${a.description ? `<p style="font-size:11px; color:#4A4D52; margin:2px 0; white-space:pre-line;">${escapeHTML(a.description)}</p>` : ''}
              </div>
            `)}

            <!-- Volunteer -->
            ${darkChevronSection('Volunteer', data.volunteer, v => `
              <div style="margin-bottom:10px;">
                <div style="font-size:12px; font-weight:700; color:#1A1C1E;">${escapeHTML(v.role)} &mdash; ${escapeHTML(v.organization)}</div>
                <div style="font-size:10.5px; color:#888888; margin:1px 0;">${formatDate(v.startDate)} &ndash; ${formatDate(v.endDate)}${v.location ? ' &middot; ' + escapeHTML(v.location) : ''}</div>
                ${v.description ? `<p style="font-size:11px; color:#4A4D52; margin:2px 0; white-space:pre-line;">${escapeHTML(v.description)}</p>` : ''}
              </div>
            `)}

            <!-- Internships -->
            ${darkChevronSection('Internships', data.internships, it => `
              <div style="margin-bottom:10px;">
                <div style="font-size:12px; font-weight:700; color:#1A1C1E;">${escapeHTML(it.jobTitle)} &mdash; ${escapeHTML(it.company)}</div>
                <div style="font-size:10.5px; color:#888888; margin:1px 0;">${formatDate(it.startDate)} &ndash; ${formatDate(it.endDate)}${it.location ? ' &middot; ' + escapeHTML(it.location) : ''}</div>
                ${it.description ? `<p style="font-size:11px; color:#4A4D52; margin:2px 0; white-space:pre-line;">${escapeHTML(it.description)}</p>` : ''}
              </div>
            `)}

            <!-- Publications -->
            ${darkChevronSection('Publications', data.publications, pub => `
              <div style="font-size:11px; color:#4A4D52; margin-bottom:4px;">
                &bull; <strong style="color:#1A1C1E;">${escapeHTML(pub.title)}</strong> &mdash; <em>${escapeHTML(pub.publisher)}</em>${pub.date ? ' (' + formatDate(pub.date) + ')' : ''}
                ${pub.doi ? `<br><span style="font-size:10px; color:#777777;">DOI: ${escapeHTML(pub.doi)}</span>` : ''}
                ${pub.url ? `<br><span style="font-size:10px; color:#777777; word-break:break-all;">${escapeHTML(pub.url)}</span>` : ''}
              </div>
            `)}

            <!-- Conferences -->
            ${darkChevronSection('Conferences', data.conferences, c => `
              <div style="font-size:11px; color:#4A4D52; margin-bottom:4px;">
                &bull; <strong style="color:#1A1C1E;">${escapeHTML(c.name)}</strong> &mdash; <em>${escapeHTML(c.role)}</em>${c.date ? ' (' + formatDate(c.date) + ')' : ''}${c.location ? ' &middot; ' + escapeHTML(c.location) : ''}
                ${c.description ? `<p style="font-size:11px; color:#4A4D52; margin:2px 0; white-space:pre-line;">${escapeHTML(c.description)}</p>` : ''}
              </div>
            `)}

            <!-- References -->
            ${darkChevronRefs(data.references)}

            ${darkChevronCustom(data.custom)}

          </div>
        </div>
      </div>
    `;
  }
};

// ==================== HELPER FUNCTIONS ====================
function darkChevronSection(title, items, fn) {
  if (!items || items.length === 0) return '';
  return `
    <div style="margin-bottom:25px;">
      <h2 style="font-size:15px; font-weight:700; color:#1A1C1E; margin:0 0 6px 0;">${title}</h2>
      <div style="border-bottom:1px solid #D1D5DB; margin-bottom:12px;"></div>
      <div>${items.map(fn).join('')}</div>
    </div>
  `;
}

function darkChevronRefs(refs) {
  if (!refs) return '';
  if (refs.placeholder) {
    return `
      <div style="margin-bottom:25px;">
        <h2 style="font-size:15px; font-weight:700; color:#1A1C1E; margin:0 0 6px 0;">References</h2>
        <div style="border-bottom:1px solid #D1D5DB; margin-bottom:10px;"></div>
        <p style="font-size:11px; color:#4A4D52; margin:0;">References available upon request</p>
      </div>
    `;
  }
  if (!refs.list || refs.list.length === 0) return '';
  return darkChevronSection('References', refs.list, r => `
    <div style="font-size:11px; color:#4A4D52; margin-bottom:8px;">
      <strong style="color:#1A1C1E;">${escapeHTML(r.name)}</strong>${r.title ? ' &mdash; ' + escapeHTML(r.title) : ''}${r.company ? ', ' + escapeHTML(r.company) : ''}
      ${r.email ? `<div style="color:#777777; word-break:break-all;">${escapeHTML(r.email)}</div>` : ''}
      ${r.phone ? `<div style="color:#777777;">${escapeHTML(r.phone)}</div>` : ''}
    </div>
  `);
}

function darkChevronCustom(custom) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items || []).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return darkChevronSection(sec.sectionName, items, item => `
      <div style="margin-bottom:8px;">
        <div style="font-size:11.5px; font-weight:bold; color:#1A1C1E;">${escapeHTML(item.title)}</div>
        ${item.description ? `<p style="font-size:11px; color:#4A4D52; margin:2px 0; white-space:pre-line;">${escapeHTML(item.description)}</p>` : ''}
      </div>
    `);
  }).join('');
}
