// templates/emerald-pill-sidebar.js — Emerald Pill Sidebar Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates['emerald-pill-sidebar'] = {
  name: 'Emerald Pill Sidebar',
  description: 'Deep forest green sidebar with dark sub-headers, rounded outline skill pills, and clean dual-column work history',
  
  miniPreview() {
    return `<div class="mini-cv" style="font-family:sans-serif; background:#ffffff; width:100%; height:100%; box-sizing:border-box; display:flex;">
      <div style="width:32%; background:#05520E; color:#fff; padding:4px;">
        <div style="width:12px; height:12px; border-radius:50%; background:#ccc; margin:0 auto 3px auto;"></div>
        <div style="font-size:4px; font-weight:bold; text-align:center;">Michael Johnson</div>
        <div style="background:#033C0A; font-size:2.5px; padding:1px; margin:3px 0 2px 0;">Contact</div>
        <div style="border:1px solid #7ECB88; border-radius:4px; font-size:2px; padding:1px; margin-top:2px;">Negotiation</div>
      </div>
      <div style="width:68%; padding:5px;">
        <div style="font-size:2.5px; color:#444; margin-bottom:4px;">Dynamic Sales Associate with a proven track record...</div>
        <div style="font-size:3.5px; font-weight:bold; color:#05520E; border-bottom:1px solid #ddd; padding-bottom:1px;">Work History</div>
        <div style="display:flex; gap:3px; margin-top:3px;">
          <div style="font-size:2px; color:#777; width:25%;">2023-12 &ndash; 2025-12</div>
          <div style="width:75%;">
            <div style="font-size:2.5px; font-weight:bold;">Sales Associate</div>
            <div style="font-size:2px; color:#555;">Retail Solutions Co.</div>
          </div>
        </div>
      </div>
    </div>`;
  },

  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    const sidebarBg = '#05520E';
    const subHeaderBg = '#033C0A';
    const primaryGreen = '#05520E';
    const pillBorderColor = '#7ECB88';
    const textColor = '#333333';

    return `
      <div style="font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#ffffff; color:${textColor}; max-width:800px; margin:0 auto; box-shadow:0 0 10px rgba(0,0,0,0.06); text-align:left; box-sizing:border-box; display:flex; min-height:800px; word-break:break-word; overflow-wrap:break-word;">
        
        <!-- Left Forest Green Sidebar (32% Width) -->
        <div style="width:32%; background-color:${sidebarBg}; color:#ffffff; flex-shrink:0; box-sizing:border-box; display:flex; flex-direction:column;">
          
          <!-- Top Avatar Photo & Candidate Name -->
          <div style="padding:25px 18px 15px 18px; text-align:center;">
            ${p.photo && !p.photo.startsWith('data:image/svg') ? `
              <div style="width:90px; height:90px; border-radius:50%; overflow:hidden; margin:0 auto 15px auto; background:#E2E8F0; border:2px solid #ffffff;">
                <img src="${escapeHTML(p.photo)}" alt="${escapeHTML(p.fullName)}" style="width:100%; height:100%; object-fit:cover;" />
              </div>
            ` : ''}

            <h1 style="font-size:22px; font-weight:700; color:#ffffff; margin:0; line-height:1.2; letter-spacing:0.5px; text-align:left;">
              ${escapeHTML(p.fullName || 'Michael Johnson')}
            </h1>
          </div>

          <!-- Contact Section -->
          ${(p.location || p.phone || p.email || p.linkedin || p.website || p.github) ? `
            <div>
              <div style="background-color:${subHeaderBg}; font-size:13px; font-weight:700; color:#ffffff; padding:6px 18px; letter-spacing:0.5px; margin-bottom:12px;">
                Contact
              </div>
              <div style="padding:0 18px 15px 18px; font-size:10.5px; color:#E0E0E0; line-height:1.5;">
                ${p.location ? `<div style="margin-bottom:10px;"><strong style="color:#ffffff; display:block; font-size:11px;">Address</strong><span>${escapeHTML(p.location)}</span></div>` : ''}
                ${p.phone ? `<div style="margin-bottom:10px;"><strong style="color:#ffffff; display:block; font-size:11px;">Phone</strong><span>${escapeHTML(p.phone)}</span></div>` : ''}
                ${p.email ? `<div style="margin-bottom:10px;"><strong style="color:#ffffff; display:block; font-size:11px;">E-mail</strong><span style="word-break:break-all;">${escapeHTML(p.email)}</span></div>` : ''}
                ${p.linkedin ? `<div style="margin-bottom:10px;"><strong style="color:#ffffff; display:block; font-size:11px;">LinkedIn</strong><span style="word-break:break-all;">${escapeHTML(p.linkedin)}</span></div>` : ''}
                ${p.website ? `<div style="margin-bottom:10px;"><strong style="color:#ffffff; display:block; font-size:11px;">Website</strong><span style="word-break:break-all;">${escapeHTML(p.website)}</span></div>` : ''}
                ${p.github ? `<div style="margin-bottom:10px;"><strong style="color:#ffffff; display:block; font-size:11px;">GitHub</strong><span style="word-break:break-all;">${escapeHTML(p.github)}</span></div>` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Skills Section (Outlined Pills) -->
          ${data.skills && data.skills.length > 0 ? `
            <div>
              <div style="background-color:${subHeaderBg}; font-size:13px; font-weight:700; color:#ffffff; padding:6px 18px; letter-spacing:0.5px; margin-bottom:12px;">
                Skills
              </div>
              <div style="padding:0 18px 15px 18px; display:flex; flex-direction:column; gap:8px;">
                ${data.skills.map(skill => `
                  <div style="border:1px solid ${pillBorderColor}; border-radius:16px; padding:5px 12px; font-size:10.5px; color:#ffffff; font-weight:500; display:inline-block; text-align:left;">
                    ${escapeHTML(skill.name)}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Languages Section (Horizontal Pills) -->
          ${data.languages && data.languages.length > 0 ? `
            <div>
              <div style="background-color:${subHeaderBg}; font-size:13px; font-weight:700; color:#ffffff; padding:6px 18px; letter-spacing:0.5px; margin-bottom:12px;">
                Languages
              </div>
              <div style="padding:0 18px 15px 18px; display:flex; flex-wrap:wrap; gap:6px;">
                ${data.languages.map(l => `
                  <div style="border:1px solid ${pillBorderColor}; border-radius:16px; padding:4px 10px; font-size:10px; color:#ffffff; font-weight:500;">
                    ${escapeHTML(l.name)}${l.proficiency ? ' (' + escapeHTML(l.proficiency) + ')' : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Interests Section -->
          ${data.interests && data.interests.length > 0 ? `
            <div>
              <div style="background-color:${subHeaderBg}; font-size:13px; font-weight:700; color:#ffffff; padding:6px 18px; letter-spacing:0.5px; margin-bottom:12px;">
                Interests
              </div>
              <div style="padding:0 18px 15px 18px; display:flex; flex-wrap:wrap; gap:6px;">
                ${data.interests.map(i => `
                  <div style="border:1px solid ${pillBorderColor}; border-radius:16px; padding:4px 10px; font-size:10px; color:#ffffff; font-weight:500;">
                    ${escapeHTML(i.name)}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Social Links Section -->
          ${data.social ? (() => {
            const links = Object.entries(data.social).filter(([k,v]) => v);
            if (links.length === 0) return '';
            return `
              <div>
                <div style="background-color:${subHeaderBg}; font-size:13px; font-weight:700; color:#ffffff; padding:6px 18px; letter-spacing:0.5px; margin-bottom:12px;">
                  Social
                </div>
                <div style="padding:0 18px 15px 18px; font-size:10.5px; color:#E0E0E0; line-height:1.5;">
                  ${links.map(([k,v]) => `<div style="margin-bottom:6px; word-break:break-all;"><strong style="color:#ffffff;">${escapeHTML(k)}:</strong> ${escapeHTML(v)}</div>`).join('')}
                </div>
              </div>
            `;
          })() : ''}

        </div>

        <!-- Right Main Content Area (68% Width) -->
        <div style="width:68%; padding:30px 25px 25px 30px; box-sizing:border-box; flex-grow:1;">
          
          <!-- Profile Summary Paragraph -->
          ${s.text ? `
            <div style="margin-bottom:25px; font-size:11.5px; line-height:1.6; color:#444444; white-space:pre-line;">
              ${escapeHTML(s.text)}
            </div>
          ` : ''}

          <!-- Work History -->
          ${data.experience && data.experience.length > 0 ? `
            <div style="margin-bottom:25px;">
              <h2 style="font-size:16px; font-weight:700; color:${primaryGreen}; margin:0 0 6px 0;">Work History</h2>
              <div style="border-bottom:1px solid #E0E0E0; margin-bottom:16px;"></div>

              ${data.experience.map(exp => `
                <div style="display:flex; margin-bottom:18px; gap:15px; flex-wrap:wrap;">
                  <div style="width:28%; font-size:10.5px; color:#666666; font-weight:500; flex-shrink:0; line-height:1.4;">
                    ${formatDate(exp.startDate)} &ndash;<br/>${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
                  </div>

                  <div style="width:68%; flex-grow:1;">
                    <div style="font-size:13px; font-weight:700; color:#111111;">${escapeHTML(exp.jobTitle)}</div>
                    ${exp.company ? `<div style="font-size:11px; font-style:italic; color:#555555; margin:2px 0 6px 0;">${escapeHTML(exp.company)}${exp.employmentType ? ` (${escapeHTML(exp.employmentType)})` : ''}${exp.location ? ', ' + escapeHTML(exp.location) : ''}</div>` : ''}

                    ${exp.description ? `<p style="font-size:10.5px; color:#444444; margin:0 0 6px 0; line-height:1.5; white-space:pre-line;">${escapeHTML(exp.description)}</p>` : ''}

                    ${exp.achievements ? `
                      <div style="font-size:10.5px; color:#444444; line-height:1.5;">
                        ${exp.achievements.split('\n').filter(Boolean).map(item => `
                          <div style="display:flex; align-items:flex-start; gap:6px; margin-bottom:3px;">
                            <span style="color:#111111; font-size:9px; margin-top:1px;">&bull;</span>
                            <span>${escapeHTML(item)}</span>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Certifications -->
          ${data.certifications && data.certifications.length > 0 ? `
            <div style="margin-bottom:25px;">
              <h2 style="font-size:16px; font-weight:700; color:${primaryGreen}; margin:0 0 6px 0;">Certifications</h2>
              <div style="border-bottom:1px solid #E0E0E0; margin-bottom:12px;"></div>

              <div style="font-size:11px; color:#444444; line-height:1.6;">
                ${data.certifications.map(c => `
                  <div style="display:flex; align-items:flex-start; gap:6px; margin-bottom:4px;">
                    <span style="color:#111111; font-size:9px; margin-top:2px;">&bull;</span>
                    <span><strong>${escapeHTML(c.name)}</strong>${c.organization ? ' &mdash; ' + escapeHTML(c.organization) : ''}${c.issueDate ? ' (' + formatDate(c.issueDate) + (c.expiryDate ? ' &ndash; ' + formatDate(c.expiryDate) : '') + ')' : ''}
                      ${c.credentialId ? `<br><span style="font-size:10px; color:#666;">ID: ${escapeHTML(c.credentialId)}</span>` : ''}
                      ${c.credentialUrl ? `<br><span style="font-size:10px; color:#666; word-break:break-all;">${escapeHTML(c.credentialUrl)}</span>` : ''}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Education -->
          ${data.education && data.education.length > 0 ? `
            <div style="margin-bottom:25px;">
              <h2 style="font-size:16px; font-weight:700; color:${primaryGreen}; margin:0 0 6px 0;">Education</h2>
              <div style="border-bottom:1px solid #E0E0E0; margin-bottom:14px;"></div>

              ${data.education.map(edu => `
                <div style="display:flex; margin-bottom:14px; gap:15px; flex-wrap:wrap;">
                  <div style="width:28%; font-size:10.5px; color:#666666; font-weight:500; flex-shrink:0;">
                    ${formatDate(edu.startDate)}${edu.endDate ? '<br/>' + formatDate(edu.endDate) : ''}
                  </div>
                  <div style="width:68%; flex-grow:1;">
                    <div style="font-size:12.5px; font-weight:700; color:#111111;">${escapeHTML(edu.degree)}${edu.fieldOfStudy ? ', ' + escapeHTML(edu.fieldOfStudy) : ''}</div>
                    ${edu.school ? `<div style="font-size:11px; font-style:italic; color:#555555; margin-top:2px;">${escapeHTML(edu.school)}</div>` : ''}
                    ${edu.gpa ? `<div style="font-size:10.5px; color:#666; margin-top:1px;">GPA: ${escapeHTML(edu.gpa)}</div>` : ''}
                    ${edu.description ? `<p style="font-size:10.5px; color:#666; margin:2px 0; white-space:pre-line;">${escapeHTML(edu.description)}</p>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Projects -->
          ${emeraldPillSection('Projects', data.projects, primaryGreen, proj => `
            <div style="margin-bottom:12px;">
              <div style="font-size:12px; font-weight:700; color:#111111;">${escapeHTML(proj.name)}</div>
              ${(proj.startDate || proj.endDate) ? `<div style="font-size:10px; color:#666; margin:1px 0;">${formatDate(proj.startDate)} &ndash; ${formatDate(proj.endDate)}</div>` : ''}
              ${proj.technologies ? `<div style="font-size:10px; color:#666666; margin:2px 0;">${escapeHTML(proj.technologies)}</div>` : ''}
              ${proj.description ? `<p style="font-size:10.5px; color:#444444; margin:2px 0; line-height:1.5; white-space:pre-line;">${escapeHTML(proj.description)}</p>` : ''}
              ${(proj.github || proj.liveUrl) ? `<p style="font-size:10px; color:#666; word-break:break-all;">${[proj.github, proj.liveUrl].filter(Boolean).map(escapeHTML).join(' | ')}</p>` : ''}
            </div>
          `)}

          <!-- Awards -->
          ${emeraldPillSection('Awards', data.awards, primaryGreen, a => `
            <div style="font-size:11px; color:#444444; margin-bottom:6px;">
              &bull; <strong style="color:#111111;">${escapeHTML(a.title)}</strong> &mdash; ${escapeHTML(a.issuer)}${a.date ? ' (' + formatDate(a.date) + ')' : ''}
              ${a.description ? `<p style="font-size:10.5px; color:#444; margin:2px 0; white-space:pre-line;">${escapeHTML(a.description)}</p>` : ''}
            </div>
          `)}

          <!-- Volunteer -->
          ${emeraldPillSection('Volunteer', data.volunteer, primaryGreen, v => `
            <div style="margin-bottom:10px;">
              <div style="font-size:12px; font-weight:700; color:#111111;">${escapeHTML(v.role)} &mdash; ${escapeHTML(v.organization)}</div>
              <div style="font-size:10.5px; color:#666; margin:1px 0;">${formatDate(v.startDate)} &ndash; ${formatDate(v.endDate)}${v.location ? ' &middot; ' + escapeHTML(v.location) : ''}</div>
              ${v.description ? `<p style="font-size:10.5px; color:#444; margin:2px 0; white-space:pre-line;">${escapeHTML(v.description)}</p>` : ''}
            </div>
          `)}

          <!-- Internships -->
          ${emeraldPillSection('Internships', data.internships, primaryGreen, it => `
            <div style="margin-bottom:10px;">
              <div style="font-size:12px; font-weight:700; color:#111111;">${escapeHTML(it.jobTitle)} &mdash; ${escapeHTML(it.company)}</div>
              <div style="font-size:10.5px; color:#666; margin:1px 0;">${formatDate(it.startDate)} &ndash; ${formatDate(it.endDate)}${it.location ? ' &middot; ' + escapeHTML(it.location) : ''}</div>
              ${it.description ? `<p style="font-size:10.5px; color:#444; margin:2px 0; white-space:pre-line;">${escapeHTML(it.description)}</p>` : ''}
            </div>
          `)}

          <!-- Publications -->
          ${emeraldPillSection('Publications', data.publications, primaryGreen, pub => `
            <div style="font-size:11px; color:#444444; margin-bottom:4px;">
              &bull; <strong style="color:#111111;">${escapeHTML(pub.title)}</strong> &mdash; <em>${escapeHTML(pub.publisher)}</em>${pub.date ? ' (' + formatDate(pub.date) + ')' : ''}
              ${pub.doi ? `<br><span style="font-size:10px; color:#666;">DOI: ${escapeHTML(pub.doi)}</span>` : ''}
              ${pub.url ? `<br><span style="font-size:10px; color:#666; word-break:break-all;">${escapeHTML(pub.url)}</span>` : ''}
            </div>
          `)}

          <!-- Conferences -->
          ${emeraldPillSection('Conferences', data.conferences, primaryGreen, c => `
            <div style="font-size:11px; color:#444444; margin-bottom:4px;">
              &bull; <strong style="color:#111111;">${escapeHTML(c.name)}</strong> &mdash; <em>${escapeHTML(c.role)}</em>${c.date ? ' (' + formatDate(c.date) + ')' : ''}${c.location ? ' &middot; ' + escapeHTML(c.location) : ''}
              ${c.description ? `<p style="font-size:10.5px; color:#444; margin:2px 0; white-space:pre-line;">${escapeHTML(c.description)}</p>` : ''}
            </div>
          `)}

          <!-- References -->
          ${emeraldPillRefs(data.references, primaryGreen)}

          ${emeraldPillCustom(data.custom, primaryGreen)}

        </div>
      </div>
    `;
  }
};

// ==================== HELPER FUNCTIONS ====================
function emeraldPillSection(title, items, primaryGreen, fn) {
  if (!items || items.length === 0) return '';
  return `
    <div style="margin-bottom:25px;">
      <h2 style="font-size:16px; font-weight:700; color:${primaryGreen}; margin:0 0 6px 0;">${title}</h2>
      <div style="border-bottom:1px solid #E0E0E0; margin-bottom:12px;"></div>
      <div>${items.map(fn).join('')}</div>
    </div>
  `;
}

function emeraldPillRefs(refs, primaryGreen) {
  if (!refs) return '';
  if (refs.placeholder) {
    return `
      <div style="margin-bottom:25px;">
        <h2 style="font-size:16px; font-weight:700; color:${primaryGreen}; margin:0 0 6px 0;">References</h2>
        <div style="border-bottom:1px solid #E0E0E0; margin-bottom:10px;"></div>
        <p style="font-size:10.5px; color:#444444; margin:0;">References available upon request</p>
      </div>
    `;
  }
  if (!refs.list || refs.list.length === 0) return '';
  return emeraldPillSection('References', refs.list, primaryGreen, r => `
    <div style="font-size:10.5px; color:#444444; margin-bottom:8px;">
      <strong style="color:#111111;">${escapeHTML(r.name)}</strong>${r.title ? ' &mdash; ' + escapeHTML(r.title) : ''}${r.company ? ', ' + escapeHTML(r.company) : ''}
      ${r.email ? `<div style="color:#666666; word-break:break-all;">${escapeHTML(r.email)}</div>` : ''}
      ${r.phone ? `<div style="color:#666666;">${escapeHTML(r.phone)}</div>` : ''}
    </div>
  `);
}

function emeraldPillCustom(custom, primaryGreen) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items || []).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return emeraldPillSection(sec.sectionName, items, primaryGreen, item => `
      <div style="margin-bottom:8px;">
        <div style="font-size:11px; font-weight:bold; color:#111111;">${escapeHTML(item.title)}</div>
        ${item.description ? `<p style="font-size:10.5px; color:#444444; margin:2px 0; white-space:pre-line;">${escapeHTML(item.description)}</p>` : ''}
      </div>
    `);
  }).join('');
}
