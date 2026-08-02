// templates/boho-arched.js — Boho Arched Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates['boho-arched'] = {
  name: 'Boho Arched',
  description: 'Warm earthy beige design with an arched profile photo frame, serif typography, and skill rating bars',
  
  miniPreview() {
    return `<div class="mini-cv" style="font-family:'Georgia', serif; background:#F5F0EB; width:100%; height:100%; display:flex; box-sizing:border-box;">
      <div style="background:#D8CBB9; width:40%; padding:6px; box-sizing:border-box; text-align:center;">
        <div style="width:20px; height:26px; background:#B8A898; border-radius:10px 10px 0 0; margin:0 auto 4px;"></div>
        <div style="font-size:3.5px; font-weight:bold; border-bottom:0.5px solid #888; padding-bottom:1px;">Education</div>
        <div style="font-size:2.5px; color:#555; margin-top:2px;">&#10022; Bachelor</div>
      </div>
      <div style="width:60%; padding:6px; box-sizing:border-box;">
        <div style="font-size:6px; font-weight:bold;">Mary Smith</div>
        <div style="font-size:3.5px; color:#666; margin-bottom:4px;">Product Designer</div>
        <div style="font-size:4px; font-weight:bold; border-bottom:0.5px solid #ccc; margin-top:4px;">Experience</div>
        <div style="font-size:3px; color:#444; margin-top:2px;">&#10022; Product Designer</div>
      </div>
    </div>`;
  },

  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    const sidebarBg = '#D8CBB9';
    const mainBg = '#F5F0EB';
    const textColor = '#2B2B2B';

    return `
      <div class="cv-template-root" style="font-family:'Playfair Display', 'Georgia', serif; background-color:${mainBg}; color:${textColor}; max-width:800px; margin:0 auto; display:flex; min-height:1000px; box-shadow:0 0 10px rgba(0,0,0,0.06); text-align:left; box-sizing:border-box; word-break:break-word; overflow-wrap:break-word;">
        
        <!-- Left Column / Sidebar -->
        <div class="cv-template-sidebar" style="background-color:${sidebarBg}; width:38%; padding:35px 25px; box-sizing:border-box; flex-shrink:0;">
          
          <!-- Arched Photo Frame -->
          <div style="text-align:center; position:relative; margin-bottom:30px;">
            <span style="position:absolute; top:5px; left:5px; font-size:16px; color:#8C7B6B;">&#10022;</span>
            <span style="position:absolute; bottom:20px; right:0px; font-size:14px; color:#8C7B6B;">&#10022;</span>
            
            ${p.photo && !p.photo.includes('svg') ? `
              <div style="width:140px; height:180px; border-radius:100px 100px 0 0; overflow:hidden; margin:0 auto; background:#C5B5A3; display:inline-block;">
                <img src="${escapeHTML(p.photo)}" alt="${escapeHTML(p.fullName)}" style="width:100%; height:100%; object-fit:cover;" />
              </div>
            ` : ` 
              <div style="width:140px; height:180px; border-radius:100px 100px 0 0; margin:0 auto; background:#BCAE9E; display:flex; align-items:center; justify-content:center; font-size:42px; font-weight:bold; color:#ffffff;">
                ${escapeHTML((p.fullName || 'M').charAt(0))}
              </div>
            `}
          </div>

          <!-- Education Section -->
          ${data.education && data.education.length > 0 ? `
            <div style="margin-bottom:30px;">
              <h2 style="font-size:18px; font-weight:bold; color:#111; margin:0 0 6px 0; border-bottom:1px solid #998C7C; padding-bottom:4px;">Education</h2>
              <div style="margin-top:12px;">
                ${data.education.map(edu => `
                  <div style="margin-bottom:16px;">
                    <div style="font-size:11px; font-weight:bold; color:#222;">&#10022; (${formatDate(edu.startDate)}${edu.endDate ? '-' + formatDate(edu.endDate) : ''})</div>
                    <div style="font-size:12px; font-weight:bold; color:#111; margin-top:2px;">${escapeHTML(edu.degree)}${edu.fieldOfStudy ? ', ' + escapeHTML(edu.fieldOfStudy) : ''}</div>
                    <div style="font-size:11px; color:#555; font-family:sans-serif; margin-top:1px;">${escapeHTML(edu.school)}</div>
                    ${edu.gpa ? `<div style="font-size:11px; color:#666; font-family:sans-serif;">GPA: ${escapeHTML(edu.gpa)}</div>` : ''}
                    ${edu.description ? `<p style="font-size:11px; color:#666; font-family:sans-serif; margin:2px 0; white-space:pre-line;">${escapeHTML(edu.description)}</p>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Contact Details -->
          ${(p.phone || p.email || p.location || p.linkedin || p.website || p.github) ? `
            <div style="margin-bottom:30px;">
              <h2 style="font-size:18px; font-weight:bold; color:#111; margin:0 0 6px 0; border-bottom:1px solid #998C7C; padding-bottom:4px;">Contact</h2>
              <div style="font-size:11.5px; color:#333; line-height:2; margin-top:12px;">
                ${p.email ? `<div>&#10022; <span style="word-break:break-all;">${escapeHTML(p.email)}</span></div>` : ''}
                ${p.phone ? `<div>&#10022; <span>${escapeHTML(p.phone)}</span></div>` : ''}
                ${p.location ? `<div>&#10022; <span>${escapeHTML(p.location)}</span></div>` : ''}
                ${p.linkedin ? `<div>&#10022; <span style="word-break:break-all;">${escapeHTML(p.linkedin)}</span></div>` : ''}
                ${p.website ? `<div>&#10022; <span style="word-break:break-all;">${escapeHTML(p.website)}</span></div>` : ''}
                ${p.github ? `<div>&#10022; <span style="word-break:break-all;">${escapeHTML(p.github)}</span></div>` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Languages -->
          ${data.languages && data.languages.length > 0 ? `
            <div style="margin-bottom:30px;">
              <h2 style="font-size:18px; font-weight:bold; color:#111; margin:0 0 6px 0; border-bottom:1px solid #998C7C; padding-bottom:4px;">Languages</h2>
              <div style="font-size:11.5px; color:#333; line-height:1.9; margin-top:12px;">
                ${data.languages.map(l => `<div>&#10022; <strong>${escapeHTML(l.name)}</strong>${l.proficiency ? ' (' + escapeHTML(l.proficiency) + ')' : ''}</div>`).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Interests -->
          ${data.interests && data.interests.length > 0 ? `
            <div style="margin-bottom:30px;">
              <h2 style="font-size:18px; font-weight:bold; color:#111; margin:0 0 6px 0; border-bottom:1px solid #998C7C; padding-bottom:4px;">Interests</h2>
              <div style="font-size:11.5px; color:#333; line-height:1.9; margin-top:12px;">
                ${data.interests.map(i => `<div>&#10022; ${escapeHTML(i.name)}</div>`).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Social Links -->
          ${data.social ? (() => {
            const links = Object.entries(data.social).filter(([k,v]) => v);
            if (links.length === 0) return '';
            return `
              <div style="margin-bottom:30px;">
                <h2 style="font-size:18px; font-weight:bold; color:#111; margin:0 0 6px 0; border-bottom:1px solid #998C7C; padding-bottom:4px;">Social</h2>
                <div style="font-size:11.5px; color:#333; line-height:1.9; margin-top:12px;">
                  ${links.map(([k,v]) => `<div>&#10022; <strong>${escapeHTML(k)}:</strong> <span style="word-break:break-all;">${escapeHTML(v)}</span></div>`).join('')}
                </div>
              </div>
            `;
          })() : ''}

        </div>

        <!-- Right Column / Main Body -->
        <div class="cv-template-main" style="width:62%; padding:45px 35px; box-sizing:border-box;">
          
          <!-- Header Name & Title -->
          <div style="margin-bottom:20px;">
            <h1 style="font-size:34px; font-weight:bold; margin:0 0 4px 0; color:#111111; letter-spacing:0.5px;">${escapeHTML(p.fullName || 'Mary Smith')}</h1>
            <p style="font-size:18px; color:#444444; margin:0 0 14px 0; font-weight:normal;">${escapeHTML(p.professionalTitle || 'Product Designer')}</p>
            <div style="border-bottom:1px solid #CCCCCC;"></div>
          </div>

          <!-- Summary / Profile -->
          ${s.text ? `
            <div style="margin-bottom:30px;">
              <p style="font-size:12px; line-height:1.6; color:#444444; margin:0; font-family:sans-serif; white-space:pre-line;">${escapeHTML(s.text)}</p>
            </div>
          ` : ''}

          <!-- Experience Section -->
          ${data.experience && data.experience.length > 0 ? `
            <div style="margin-bottom:30px;">
              <h2 style="font-size:20px; font-weight:bold; color:#111; margin:0 0 6px 0; border-bottom:1px solid #CCCCCC; padding-bottom:4px;">Experience</h2>
              <div style="margin-top:14px;">
                ${data.experience.map(exp => `
                  <div style="margin-bottom:20px;">
                    <div style="font-size:13px; font-weight:bold; color:#111;">
                      &#10022; ${escapeHTML(exp.company)} (${formatDate(exp.startDate)} - ${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)})
                    </div>
                    <div style="font-size:13px; font-weight:bold; color:#333; margin:2px 0 4px 14px;">${escapeHTML(exp.jobTitle)}${exp.employmentType ? ` <span style="font-size:11px; color:#888;">(${escapeHTML(exp.employmentType)})</span>` : ''}</div>
                    ${exp.location ? `<div style="font-size:11px; color:#888; margin:0 0 4px 14px; font-family:sans-serif;">${escapeHTML(exp.location)}</div>` : ''}
                    ${exp.description ? `<p style="font-size:11.5px; color:#555; margin:4px 0 0 14px; line-height:1.5; font-family:sans-serif; white-space:pre-line;">${escapeHTML(exp.description)}</p>` : ''}
                    ${exp.achievements ? `
                      <div style="margin:4px 0 0 14px; font-size:11.5px; color:#555; font-family:sans-serif; line-height:1.5;">
                        ${exp.achievements.split('\n').filter(Boolean).map(item => `<div style="margin-bottom:3px;">&bull; ${escapeHTML(item)}</div>`).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Skills Section with Visual Rating Bars -->
          ${data.skills && data.skills.length > 0 ? `
            <div style="margin-bottom:30px;">
              <h2 style="font-size:20px; font-weight:bold; color:#111; margin:0 0 12px 0; border-bottom:1px solid #CCCCCC; padding-bottom:4px;">Skills</h2>
              <div style="display:flex; flex-direction:column; gap:12px; margin-top:12px;">
                ${data.skills.map(skill => `
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:12px; font-weight:bold; color:#333;">${escapeHTML(skill.name)}</span>
                    <div style="width:120px; height:8px; background:#E5DDD3; border-radius:4px; overflow:hidden;">
                      <div style="width:75%; height:100%; background:#B8A692; border-radius:4px;"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Projects Section -->
          ${bohoListSection('Projects', data.projects, proj => `
            <div style="margin-bottom:14px;">
              <div style="font-size:13px; font-weight:bold;">&#10022; ${escapeHTML(proj.name)}</div>
              ${(proj.startDate || proj.endDate) ? `<div style="font-size:11px; color:#888; margin:1px 0 0 14px; font-family:sans-serif;">${formatDate(proj.startDate)} - ${formatDate(proj.endDate)}</div>` : ''}
              ${proj.technologies ? `<div style="font-size:11px; color:#666; font-family:sans-serif; margin-left:14px;">${escapeHTML(proj.technologies)}</div>` : ''}
              ${proj.description ? `<p style="font-size:11.5px; color:#555; margin:3px 0 0 14px; font-family:sans-serif; line-height:1.5; white-space:pre-line;">${escapeHTML(proj.description)}</p>` : ''}
              ${(proj.github || proj.liveUrl) ? `<p style="font-size:11px; color:#777; margin:2px 0 0 14px; font-family:sans-serif; word-break:break-all;">${[proj.github, proj.liveUrl].filter(Boolean).map(escapeHTML).join(' | ')}</p>` : ''}
            </div>
          `)}

          <!-- Certifications Section -->
          ${bohoListSection('Certifications', data.certifications, cert => `
            <div style="font-size:12px; color:#333; margin-bottom:6px;">
              &#10022; <strong>${escapeHTML(cert.name)}</strong> ${cert.organization ? '&mdash; ' + escapeHTML(cert.organization) : ''} ${cert.issueDate ? '(' + formatDate(cert.issueDate) + (cert.expiryDate ? ' &ndash; ' + formatDate(cert.expiryDate) : '') + ')' : ''}
              ${cert.credentialId ? `<br><span style="font-size:11px; color:#777; margin-left:14px;">ID: ${escapeHTML(cert.credentialId)}</span>` : ''}
              ${cert.credentialUrl ? `<br><span style="font-size:11px; color:#777; margin-left:14px; word-break:break-all;">${escapeHTML(cert.credentialUrl)}</span>` : ''}
            </div>
          `)}

          <!-- Awards -->
          ${bohoListSection('Awards', data.awards, a => `
            <div style="font-size:12px; color:#333; margin-bottom:4px;">
              &#10022; <strong>${escapeHTML(a.title)}</strong> &mdash; ${escapeHTML(a.issuer)}${a.date ? ' (' + formatDate(a.date) + ')' : ''}
              ${a.description ? `<p style="font-size:11.5px; color:#555; margin:2px 0 0 14px; font-family:sans-serif; white-space:pre-line;">${escapeHTML(a.description)}</p>` : ''}
            </div>
          `)}

          <!-- Volunteer -->
          ${bohoListSection('Volunteer', data.volunteer, v => `
            <div style="margin-bottom:8px;">
              <div style="font-size:13px; font-weight:bold;">&#10022; ${escapeHTML(v.role)} &mdash; ${escapeHTML(v.organization)}</div>
              <div style="font-size:11px; color:#888; margin:1px 0 0 14px; font-family:sans-serif;">${formatDate(v.startDate)} - ${formatDate(v.endDate)}${v.location ? ' &middot; ' + escapeHTML(v.location) : ''}</div>
              ${v.description ? `<p style="font-size:11.5px; color:#555; margin:2px 0 0 14px; font-family:sans-serif; white-space:pre-line;">${escapeHTML(v.description)}</p>` : ''}
            </div>
          `)}

          <!-- Internships -->
          ${bohoListSection('Internships', data.internships, it => `
            <div style="margin-bottom:8px;">
              <div style="font-size:13px; font-weight:bold;">&#10022; ${escapeHTML(it.jobTitle)} &mdash; ${escapeHTML(it.company)}</div>
              <div style="font-size:11px; color:#888; margin:1px 0 0 14px; font-family:sans-serif;">${formatDate(it.startDate)} - ${formatDate(it.endDate)}${it.location ? ' &middot; ' + escapeHTML(it.location) : ''}</div>
              ${it.description ? `<p style="font-size:11.5px; color:#555; margin:2px 0 0 14px; font-family:sans-serif; white-space:pre-line;">${escapeHTML(it.description)}</p>` : ''}
            </div>
          `)}

          <!-- Publications -->
          ${bohoListSection('Publications', data.publications, pub => `
            <div style="font-size:12px; color:#333; margin-bottom:4px;">
              &#10022; <strong>${escapeHTML(pub.title)}</strong> &mdash; ${escapeHTML(pub.publisher)}${pub.date ? ' (' + formatDate(pub.date) + ')' : ''}
              ${pub.doi ? `<br><span style="font-size:11px; color:#777; margin-left:14px;">DOI: ${escapeHTML(pub.doi)}</span>` : ''}
              ${pub.url ? `<br><span style="font-size:11px; color:#777; margin-left:14px; word-break:break-all;">${escapeHTML(pub.url)}</span>` : ''}
            </div>
          `)}

          <!-- Conferences -->
          ${bohoListSection('Conferences', data.conferences, c => `
            <div style="font-size:12px; color:#333; margin-bottom:4px;">
              &#10022; <strong>${escapeHTML(c.name)}</strong> &mdash; ${escapeHTML(c.role)}${c.date ? ' (' + formatDate(c.date) + ')' : ''}${c.location ? ' &middot; ' + escapeHTML(c.location) : ''}
              ${c.description ? `<p style="font-size:11.5px; color:#555; margin:2px 0 0 14px; font-family:sans-serif; white-space:pre-line;">${escapeHTML(c.description)}</p>` : ''}
            </div>
          `)}

          ${bohoRefs(data.references)}
          ${bohoCustom(data.custom)}

        </div>
      </div>
    `;
  }
};

// ==================== HELPER FUNCTIONS ====================
function bohoListSection(title, items, fn) {
  if (!items || items.length === 0) return '';
  return `
    <div style="margin-bottom:30px;">
      <h2 style="font-size:20px; font-weight:bold; color:#111; margin:0 0 6px 0; border-bottom:1px solid #CCCCCC; padding-bottom:4px;">${title}</h2>
      <div style="margin-top:12px;">${items.map(fn).join('')}</div>
    </div>
  `;
}

function bohoRefs(refs) {
  if (!refs) return '';
  if (refs.placeholder) {
    return `
      <div style="margin-bottom:30px;">
        <h2 style="font-size:20px; font-weight:bold; color:#111; margin:0 0 6px 0; border-bottom:1px solid #CCCCCC; padding-bottom:4px;">References</h2>
        <p style="font-size:12px; color:#555; font-family:sans-serif; margin-top:10px;">Available upon request</p>
      </div>
    `;
  }
  if (!refs.list || refs.list.length === 0) return '';
  return bohoListSection('References', refs.list, r => `
    <div style="font-size:12px; margin-bottom:6px;">
      &#10022; <strong>${escapeHTML(r.name)}</strong> &mdash; ${escapeHTML(r.title)}, ${escapeHTML(r.company)}
      ${r.email ? `<br><span style="font-size:11px; color:#777; margin-left:14px; word-break:break-all;">${escapeHTML(r.email)}</span>` : ''}
      ${r.phone ? `<br><span style="font-size:11px; color:#777; margin-left:14px;">${escapeHTML(r.phone)}</span>` : ''}
    </div>
  `);
}

function bohoCustom(custom) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items || []).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return bohoListSection(sec.sectionName, items, item => `
      <div style="margin-bottom:8px;">
        <div style="font-size:12px; font-weight:bold;">&#10022; ${escapeHTML(item.title)}</div>
        ${item.description ? `<p style="font-size:11.5px; color:#555; margin:2px 0 0 14px; font-family:sans-serif; white-space:pre-line;">${escapeHTML(item.description)}</p>` : ''}
      </div>
    `);
  }).join('');
}
