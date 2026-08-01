// templates/split-charcoal.js — Split Charcoal Sidebar Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates['split-charcoal'] = {
  name: 'Split Charcoal',
  description: 'Dual-tone split sidebar with circular avatar, icon section headings, dark contact section, and clean right-side typography',
  
  miniPreview() {
    return `<div class="mini-cv" style="font-family:sans-serif; background:#ffffff; width:100%; height:100%; display:flex; box-sizing:border-box;">
      <div style="width:36%; display:flex; flex-direction:column;">
        <div style="background:#E2E5E8; padding:6px; text-align:center;">
          <div style="width:16px; height:16px; border-radius:50%; background:#a0a0a0; margin:0 auto 2px;"></div>
          <div style="font-size:3.5px; font-weight:bold;">Wanda Collins</div>
        </div>
        <div style="background:#3A3D40; flex-grow:1; padding:6px; color:#fff;">
          <div style="font-size:2.5px; text-transform:uppercase; font-weight:bold; border-bottom:0.5px solid #666;">CONTACT</div>
          <div style="font-size:2px; color:#ccc; margin-top:2px;">info@email.com</div>
        </div>
      </div>
      <div style="width:64%; padding:6px; box-sizing:border-box;">
        <div style="font-size:3px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; border-bottom:0.5px solid #ddd; padding-bottom:1px;">SUMMARY</div>
        <div style="font-size:2px; color:#666; margin:2px 0 4px;">Dedicated professional...</div>
        <div style="font-size:3px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; border-bottom:0.5px solid #ddd; padding-bottom:1px;">EXPERIENCE</div>
        <div style="font-size:2px; font-weight:bold; color:#333;">Project Coordinator</div>
      </div>
    </div>`;
  },

  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    const lightSidebarBg = '#E1E4E7';
    const darkSidebarBg = '#36393E';
    const textColor = '#2C2D30';

    return `
      <div style="font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#ffffff; color:${textColor}; max-width:800px; margin:0 auto; display:flex; min-height:1000px; box-shadow:0 0 10px rgba(0,0,0,0.06); text-align:left; box-sizing:border-box; word-break:break-word; overflow-wrap:break-word;">
        
        <!-- Left Sidebar Column -->
        <div style="width:36%; flex-shrink:0; display:flex; flex-direction:column;">
          
          <!-- Top Light Gray Section (Avatar + Name) -->
          <div style="background-color:${lightSidebarBg}; padding:35px 20px 25px 20px; text-align:center; box-sizing:border-box;">
            ${p.photo && !p.photo.includes('svg') ? `
              <div style="width:110px; height:110px; border-radius:50%; overflow:hidden; margin:0 auto 15px auto; border:3px solid #ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
                <img src="${escapeHTML(p.photo)}" alt="${escapeHTML(p.fullName)}" style="width:100%; height:100%; object-fit:cover;" />
              </div>
            ` : ` 
              <div style="width:100px; height:100px; border-radius:50%; margin:0 auto 15px auto; background:#B8BEC5; display:flex; align-items:center; justify-content:center; font-size:36px; font-weight:bold; color:#ffffff;">
                ${escapeHTML((p.fullName || 'W').charAt(0))}
              </div>
            `}

            <h1 style="font-size:22px; font-weight:800; color:#111111; margin:0 0 4px 0; line-height:1.2; text-transform:none; letter-spacing:-0.2px;">
              ${escapeHTML(p.fullName || 'Wanda Collins')}
            </h1>

            ${p.professionalTitle ? `
              <div style="font-size:12px; color:#555555; font-weight:500; margin-top:4px;">
                ${escapeHTML(p.professionalTitle)}
              </div>
            ` : ''}
          </div>

          <!-- Bottom Dark Charcoal Section -->
          <div style="background-color:${darkSidebarBg}; color:#FFFFFF; flex-grow:1; padding:30px 20px; box-sizing:border-box;">
            
            <!-- Contact Details -->
            ${(p.phone || p.email || p.location || p.linkedin || p.website || p.github) ? `
              <div style="margin-bottom:28px;">
                <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#FFFFFF; margin:0 0 10px 0; border-bottom:1px solid #52565C; padding-bottom:6px;">
                  CONTACT
                </h2>
                <div style="font-size:10.5px; color:#D1D5DB; line-height:1.9;">
                  ${p.phone ? `<div style="margin-bottom:4px;">${escapeHTML(p.phone)}</div>` : ''}
                  ${p.email ? `<div style="margin-bottom:4px; word-break:break-all;">${escapeHTML(p.email)}</div>` : ''}
                  ${p.location ? `<div style="margin-bottom:4px;">${escapeHTML(p.location)}</div>` : ''}
                  ${p.linkedin ? `<div style="margin-bottom:4px; word-break:break-all;">${escapeHTML(p.linkedin)}</div>` : ''}
                  ${p.website ? `<div style="margin-bottom:4px; word-break:break-all;">${escapeHTML(p.website)}</div>` : ''}
                  ${p.github ? `<div style="margin-bottom:4px; word-break:break-all;">${escapeHTML(p.github)}</div>` : ''}
                </div>
              </div>
            ` : ''}

            <!-- Education -->
            ${data.education && data.education.length > 0 ? `
              <div style="margin-bottom:28px;">
                <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#FFFFFF; margin:0 0 10px 0; border-bottom:1px solid #52565C; padding-bottom:6px;">
                  EDUCATION
                </h2>
                <div style="margin-top:8px;">
                  ${data.education.map(edu => `
                    <div style="margin-bottom:14px;">
                      <div style="font-size:10px; color:#9CA3AF;">${formatDate(edu.startDate)} &ndash; ${edu.endDate ? formatDate(edu.endDate) : 'Present'}</div>
                      <div style="font-size:11px; font-weight:bold; color:#FFFFFF; margin-top:2px;">${escapeHTML(edu.degree)}${edu.fieldOfStudy ? ', ' + escapeHTML(edu.fieldOfStudy) : ''}</div>
                      <div style="font-size:10.5px; color:#D1D5DB; margin-top:1px;">${escapeHTML(edu.school)}</div>
                      ${edu.gpa ? `<div style="font-size:10px; color:#9CA3AF; margin-top:1px;">GPA: ${escapeHTML(edu.gpa)}</div>` : ''}
                      ${edu.description ? `<p style="font-size:10px; color:#9CA3AF; margin:2px 0; white-space:pre-line;">${escapeHTML(edu.description)}</p>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Hobbies / Interests -->
            ${data.interests && data.interests.length > 0 ? `
              <div style="margin-bottom:28px;">
                <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#FFFFFF; margin:0 0 10px 0; border-bottom:1px solid #52565C; padding-bottom:6px;">
                  HOBBIES
                </h2>
                <div style="font-size:10.5px; color:#D1D5DB; line-height:1.8;">
                  ${data.interests.map(i => `<div>&bull; ${escapeHTML(i.name)}</div>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Languages -->
            ${data.languages && data.languages.length > 0 ? `
              <div style="margin-bottom:28px;">
                <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#FFFFFF; margin:0 0 10px 0; border-bottom:1px solid #52565C; padding-bottom:6px;">
                  LANGUAGES
                </h2>
                <div style="font-size:10.5px; color:#D1D5DB; line-height:1.8;">
                  ${data.languages.map(l => `<div>&bull; ${escapeHTML(l.name)}${l.proficiency ? ' (' + escapeHTML(l.proficiency) + ')' : ''}</div>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Social Links -->
            ${data.social ? (() => {
              const links = Object.entries(data.social).filter(([k,v]) => v);
              if (links.length === 0) return '';
              return `
                <div style="margin-bottom:28px;">
                  <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#FFFFFF; margin:0 0 10px 0; border-bottom:1px solid #52565C; padding-bottom:6px;">
                    SOCIAL
                  </h2>
                  <div style="font-size:10.5px; color:#D1D5DB; line-height:1.8;">
                    ${links.map(([k,v]) => `<div style="margin-bottom:4px; word-break:break-all;"><strong>${escapeHTML(k)}:</strong> ${escapeHTML(v)}</div>`).join('')}
                  </div>
                </div>
              `;
            })() : ''}

          </div>
        </div>

        <!-- Right Main Column -->
        <div style="width:64%; padding:35px 30px; box-sizing:border-box; flex-grow:1;">
          
          <!-- Professional Summary -->
          ${s.text ? `
            <div style="margin-bottom:28px;">
              <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#555555; margin:0 0 8px 0; border-bottom:1px solid #E5E7EB; padding-bottom:6px;">
                PROFESSIONAL SUMMARY
              </h2>
              <p style="font-size:11px; line-height:1.6; color:#4B5563; margin:8px 0 0 0; white-space:pre-line;">
                ${escapeHTML(s.text)}
              </p>
            </div>
          ` : ''}

          <!-- Experience Section -->
          ${data.experience && data.experience.length > 0 ? `
            <div style="margin-bottom:28px;">
              <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#555555; margin:0 0 12px 0; border-bottom:1px solid #E5E7EB; padding-bottom:6px;">
                EXPERIENCE
              </h2>
              <div style="margin-top:10px;">
                ${data.experience.map(exp => `
                  <div style="margin-bottom:18px;">
                    <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:4px;">
                      <div style="font-size:12px; font-weight:bold; color:#111827;">${escapeHTML(exp.jobTitle)}</div>
                      <div style="font-size:10.5px; color:#6B7280; font-weight:500; white-space:nowrap;">${formatDate(exp.startDate)} &ndash; ${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</div>
                    </div>
                    <div style="font-size:11px; color:#4B5563; margin:2px 0 6px 0;">
                      ${escapeHTML(exp.company)}${exp.employmentType ? ` <span style="font-size:10px; color:#9CA3AF;">(${escapeHTML(exp.employmentType)})</span>` : ''}${exp.location ? ', ' + escapeHTML(exp.location) : ''}
                    </div>
                    ${exp.description ? `<p style="font-size:11px; color:#4B5563; margin:3px 0; line-height:1.5; white-space:pre-line;">${escapeHTML(exp.description)}</p>` : ''}
                    ${exp.achievements ? `
                      <div style="margin-top:4px; font-size:11px; color:#4B5563; line-height:1.5;">
                        ${exp.achievements.split('\n').filter(Boolean).map(item => `
                          <div style="display:flex; align-items:flex-start; gap:6px; margin-bottom:3px;">
                            <span style="color:#9CA3AF;">&bull;</span>
                            <span>${escapeHTML(item)}</span>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Skills Section with Bold Callouts -->
          ${data.skills && data.skills.length > 0 ? `
            <div style="margin-bottom:28px;">
              <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#555555; margin:0 0 12px 0; border-bottom:1px solid #E5E7EB; padding-bottom:6px;">
                SKILLS
              </h2>
              <div style="margin-top:8px;">
                ${data.skills.map(skill => `
                  <div style="font-size:11px; color:#4B5563; line-height:1.6; margin-bottom:8px; display:flex; align-items:flex-start; gap:6px;">
                    <span style="color:#6B7280;">&bull;</span>
                    <div>
                      <strong style="color:#111827;">${escapeHTML(skill.name)}:</strong> 
                      ${skill.level ? escapeHTML(skill.level) : 'Demonstrated proficiency and execution capabilities.'}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Projects Section -->
          ${splitCharcoalSection('PROJECTS', data.projects, proj => `
            <div style="margin-bottom:14px;">
              <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:4px;">
                <div style="font-size:12px; font-weight:bold; color:#111827;">${escapeHTML(proj.name)}</div>
                ${(proj.startDate || proj.endDate) ? `<div style="font-size:10.5px; color:#6B7280; white-space:nowrap;">${formatDate(proj.startDate)} &ndash; ${formatDate(proj.endDate)}</div>` : ''}
              </div>
              ${proj.technologies ? `<div style="font-size:10.5px; color:#6B7280; margin:2px 0;">${escapeHTML(proj.technologies)}</div>` : ''}
              ${proj.description ? `<p style="font-size:11px; color:#4B5563; margin:3px 0; line-height:1.5; white-space:pre-line;">${escapeHTML(proj.description)}</p>` : ''}
              ${(proj.github || proj.liveUrl) ? `<p style="font-size:10.5px; color:#6B7280; word-break:break-all;">${[proj.github, proj.liveUrl].filter(Boolean).map(escapeHTML).join(' | ')}</p>` : ''}
            </div>
          `)}

          <!-- Certifications Section -->
          ${splitCharcoalSection('CERTIFICATIONS', data.certifications, cert => `
            <div style="font-size:11px; color:#4B5563; margin-bottom:6px;">
              &bull; <strong>${escapeHTML(cert.name)}</strong> ${cert.organization ? '&mdash; ' + escapeHTML(cert.organization) : ''} ${cert.issueDate ? '(' + formatDate(cert.issueDate) + (cert.expiryDate ? ' &ndash; ' + formatDate(cert.expiryDate) : '') + ')' : ''}
              ${cert.credentialId ? `<br><span style="font-size:10px; color:#9CA3AF;">ID: ${escapeHTML(cert.credentialId)}</span>` : ''}
              ${cert.credentialUrl ? `<br><span style="font-size:10px; color:#9CA3AF; word-break:break-all;">${escapeHTML(cert.credentialUrl)}</span>` : ''}
            </div>
          `)}

          <!-- Awards -->
          ${splitCharcoalSection('AWARDS', data.awards, a => `
            <div style="font-size:11px; color:#4B5563; margin-bottom:4px;">
              &bull; <strong>${escapeHTML(a.title)}</strong> &mdash; ${escapeHTML(a.issuer)}${a.date ? ' (' + formatDate(a.date) + ')' : ''}
              ${a.description ? `<p style="font-size:11px; color:#4B5563; margin:2px 0; white-space:pre-line;">${escapeHTML(a.description)}</p>` : ''}
            </div>
          `)}

          <!-- Volunteer -->
          ${splitCharcoalSection('VOLUNTEER', data.volunteer, v => `
            <div style="margin-bottom:8px;">
              <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:4px;">
                <div style="font-size:12px; font-weight:bold; color:#111827;">${escapeHTML(v.role)} &mdash; ${escapeHTML(v.organization)}</div>
                ${(v.startDate || v.endDate) ? `<div style="font-size:10.5px; color:#6B7280; white-space:nowrap;">${formatDate(v.startDate)} &ndash; ${formatDate(v.endDate)}</div>` : ''}
              </div>
              ${v.location ? `<div style="font-size:10.5px; color:#6B7280; margin:1px 0;">${escapeHTML(v.location)}</div>` : ''}
              ${v.description ? `<p style="font-size:11px; color:#4B5563; margin:2px 0; white-space:pre-line;">${escapeHTML(v.description)}</p>` : ''}
            </div>
          `)}

          <!-- Internships -->
          ${splitCharcoalSection('INTERNSHIPS', data.internships, it => `
            <div style="margin-bottom:8px;">
              <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:4px;">
                <div style="font-size:12px; font-weight:bold; color:#111827;">${escapeHTML(it.jobTitle)} &mdash; ${escapeHTML(it.company)}</div>
                ${(it.startDate || it.endDate) ? `<div style="font-size:10.5px; color:#6B7280; white-space:nowrap;">${formatDate(it.startDate)} &ndash; ${formatDate(it.endDate)}</div>` : ''}
              </div>
              ${it.location ? `<div style="font-size:10.5px; color:#6B7280; margin:1px 0;">${escapeHTML(it.location)}</div>` : ''}
              ${it.description ? `<p style="font-size:11px; color:#4B5563; margin:2px 0; white-space:pre-line;">${escapeHTML(it.description)}</p>` : ''}
            </div>
          `)}

          <!-- Publications -->
          ${splitCharcoalSection('PUBLICATIONS', data.publications, pub => `
            <div style="font-size:11px; color:#4B5563; margin-bottom:4px;">
              &bull; <strong>${escapeHTML(pub.title)}</strong> &mdash; ${escapeHTML(pub.publisher)}${pub.date ? ' (' + formatDate(pub.date) + ')' : ''}
              ${pub.doi ? `<br><span style="font-size:10px; color:#9CA3AF;">DOI: ${escapeHTML(pub.doi)}</span>` : ''}
              ${pub.url ? `<br><span style="font-size:10px; color:#9CA3AF; word-break:break-all;">${escapeHTML(pub.url)}</span>` : ''}
            </div>
          `)}

          <!-- Conferences -->
          ${splitCharcoalSection('CONFERENCES', data.conferences, c => `
            <div style="font-size:11px; color:#4B5563; margin-bottom:4px;">
              &bull; <strong>${escapeHTML(c.name)}</strong> &mdash; ${escapeHTML(c.role)}${c.date ? ' (' + formatDate(c.date) + ')' : ''}${c.location ? ' &middot; ' + escapeHTML(c.location) : ''}
              ${c.description ? `<p style="font-size:11px; color:#4B5563; margin:2px 0; white-space:pre-line;">${escapeHTML(c.description)}</p>` : ''}
            </div>
          `)}

          ${splitCharcoalRefs(data.references)}
          ${splitCharcoalCustom(data.custom)}

        </div>
      </div>
    `;
  }
};

// ==================== HELPER FUNCTIONS ====================
function splitCharcoalSection(title, items, fn) {
  if (!items || items.length === 0) return '';
  return `
    <div style="margin-bottom:28px;">
      <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#555555; margin:0 0 10px 0; border-bottom:1px solid #E5E7EB; padding-bottom:6px;">
        ${title}
      </h2>
      <div style="margin-top:8px;">${items.map(fn).join('')}</div>
    </div>
  `;
}

function splitCharcoalRefs(refs) {
  if (!refs) return '';
  if (refs.placeholder) {
    return `
      <div style="margin-bottom:28px;">
        <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#555555; margin:0 0 8px 0; border-bottom:1px solid #E5E7EB; padding-bottom:6px;">
          REFERENCES
        </h2>
        <p style="font-size:11px; color:#4B5563; margin-top:6px;">Available upon request</p>
      </div>
    `;
  }
  if (!refs.list || refs.list.length === 0) return '';
  return splitCharcoalSection('REFERENCES', refs.list, r => `
    <div style="font-size:11px; color:#4B5563; margin-bottom:6px;">
      &bull; <strong>${escapeHTML(r.name)}</strong> &mdash; ${escapeHTML(r.title)}, ${escapeHTML(r.company)}
      ${r.email ? `<br><span style="font-size:10px; color:#9CA3AF; word-break:break-all;">${escapeHTML(r.email)}</span>` : ''}
      ${r.phone ? `<br><span style="font-size:10px; color:#9CA3AF;">${escapeHTML(r.phone)}</span>` : ''}
    </div>
  `);
}

function splitCharcoalCustom(custom) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items || []).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return splitCharcoalSection(sec.sectionName.toUpperCase(), items, item => `
      <div style="margin-bottom:8px;">
        <div style="font-size:11px; font-weight:bold; color:#111827;">${escapeHTML(item.title)}</div>
        ${item.description ? `<p style="font-size:11px; color:#4B5563; margin:2px 0; white-space:pre-line;">${escapeHTML(item.description)}</p>` : ''}
      </div>
    `);
  }).join('');
}
