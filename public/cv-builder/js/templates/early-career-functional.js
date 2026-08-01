// templates/early-career-functional.js — Early Career Functional Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates['early-career-functional'] = {
  name: 'Early Career Functional',
  description: 'Slate-blue header banner with icon badges, organized around functional skill categories and stacked sidebar details',
  
  miniPreview() {
    return `<div class="mini-cv" style="font-family:sans-serif; background:#fff; width:100%; height:100%; box-sizing:border-box;">
      <div style="background:#7C95C4; color:#fff; padding:6px 8px;">
        <div style="font-size:5px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase;">FUNCTIONAL RESUME</div>
        <div style="font-size:3px; opacity:0.8;">Early-career example</div>
      </div>
      <div style="display:flex; padding:6px; gap:6px;">
        <div style="width:62%;">
          <div style="font-size:3px; font-weight:bold; text-transform:uppercase; margin-bottom:2px; display:flex; align-items:center; gap:2px;">
            <span style="background:#7C95C4; color:#fff; padding:0.5px 2px; border-radius:1px; font-size:2.5px;">&#9678;</span> OBJECTIVE
          </div>
          <div style="font-size:2px; color:#555; margin-bottom:4px;">Certified teacher with proven track record...</div>
          <div style="font-size:3px; font-weight:bold; text-transform:uppercase; margin-bottom:2px; display:flex; align-items:center; gap:2px;">
            <span style="background:#7C95C4; color:#fff; padding:0.5px 2px; border-radius:1px; font-size:2.5px;">&#9678;</span> SKILLS
          </div>
          <div style="font-size:2px; font-weight:bold;">Lesson Planning</div>
          <div style="font-size:2px; color:#666;">&bull; Write comprehensive reports</div>
        </div>
        <div style="width:38%;">
          <div style="font-size:3px; font-weight:bold; text-transform:uppercase; margin-bottom:2px; display:flex; align-items:center; gap:2px;">
            <span style="background:#7C95C4; color:#fff; padding:0.5px 2px; border-radius:1px; font-size:2.5px;">&#9678;</span> CONTACT
          </div>
          <div style="font-size:2px; color:#444;">Phone<br/>(770) 625-9669</div>
        </div>
      </div>
    </div>`;
  },

  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    const primaryColor = '#7C95C4';
    const textColor = '#2D3748';

    return `
      <div style="font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#ffffff; color:${textColor}; max-width:800px; margin:0 auto; box-shadow:0 0 10px rgba(0,0,0,0.06); text-align:left; box-sizing:border-box; word-break:break-word; overflow-wrap:break-word;">
        
        <!-- Top Banner Header -->
        <div style="background-color:${primaryColor}; color:#ffffff; padding:28px 35px;">
          <h1 style="font-size:26px; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin:0; line-height:1.1;">
            ${escapeHTML(p.fullName || 'FUNCTIONAL RESUME')}
          </h1>
          <div style="font-size:13px; font-weight:300; opacity:0.9; margin-top:6px; letter-spacing:0.5px;">
            ${escapeHTML(p.professionalTitle || 'Early-career example')}
          </div>
        </div>

        <!-- Main Body Two-Column Grid -->
        <div style="display:flex; padding:35px; gap:35px; box-sizing:border-box;">
          
          <!-- Primary Left Column (Objective + Skill Categories) -->
          <div style="width:62%; flex-grow:1;">
            
            <!-- Career Objective / Summary -->
            ${s.text ? `
              <div style="margin-bottom:28px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                  <div style="background-color:${primaryColor}; color:#ffffff; width:22px; height:22px; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; font-weight:bold;">&#9678;</div>
                  <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#1A202C; margin:0;">CAREER OBJECTIVE</h2>
                </div>
                <p style="font-size:11.5px; line-height:1.6; color:#4A5568; margin:0; white-space:pre-line;">
                  ${escapeHTML(s.text)}
                </p>
              </div>
            ` : ''}

            <!-- Professional Skills (Functional Format) -->
            ${data.skills && data.skills.length > 0 ? `
              <div style="margin-bottom:28px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:14px;">
                  <div style="background-color:${primaryColor}; color:#ffffff; width:22px; height:22px; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; font-weight:bold;">&#9678;</div>
                  <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#1A202C; margin:0;">PROFESSIONAL SKILLS</h2>
                </div>
                
                <div>
                  ${data.skills.map(skill => `
                    <div style="margin-bottom:18px;">
                      <div style="font-size:12.5px; font-weight:700; color:#2D3748; margin-bottom:6px;">${escapeHTML(skill.name)}</div>
                      ${skill.level ? `
                        <div style="margin-left:4px; font-size:11px; color:#4A5568; line-height:1.6;">
                          ${skill.level.split('\n').filter(Boolean).map(bullet => `
                            <div style="display:flex; align-items:flex-start; gap:8px; margin-bottom:4px;">
                              <span style="color:#2B6CB0; font-size:8px; margin-top:3px;">&bull;</span>
                              <span>${escapeHTML(bullet)}</span>
                            </div>
                          `).join('')}
                        </div>
                      ` : ` 
                        <div style="display:flex; align-items:flex-start; gap:8px; margin-left:4px; font-size:11px; color:#4A5568;">
                          <span style="color:#2B6CB0; font-size:8px; margin-top:3px;">&bull;</span>
                          <span>Demonstrated key technical and analytical proficiency.</span>
                        </div>
                      `}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Projects Section -->
            ${earlyCareerSection('PROJECTS', data.projects, proj => `
              <div style="margin-bottom:14px;">
                <div style="font-size:12px; font-weight:bold; color:#2D3748;">${escapeHTML(proj.name)}</div>
                ${(proj.startDate || proj.endDate) ? `<div style="font-size:10.5px; color:#A0AEC0; margin:1px 0;">${formatDate(proj.startDate)} &ndash; ${formatDate(proj.endDate)}</div>` : ''}
                ${proj.technologies ? `<div style="font-size:11px; color:#718096; margin:2px 0;">${escapeHTML(proj.technologies)}</div>` : ''}
                ${proj.description ? `<p style="font-size:11px; color:#4A5568; margin:3px 0; line-height:1.5; white-space:pre-line;">${escapeHTML(proj.description)}</p>` : ''}
                ${(proj.github || proj.liveUrl) ? `<p style="font-size:10.5px; color:#718096; word-break:break-all;">${[proj.github, proj.liveUrl].filter(Boolean).map(escapeHTML).join(' | ')}</p>` : ''}
              </div>
            `, primaryColor)}

            <!-- Certifications Section -->
            ${earlyCareerSection('CERTIFICATIONS', data.certifications, cert => `
              <div style="font-size:11px; color:#4A5568; margin-bottom:6px;">
                &bull; <strong>${escapeHTML(cert.name)}</strong> ${cert.organization ? '&mdash; ' + escapeHTML(cert.organization) : ''} ${cert.issueDate ? '(' + formatDate(cert.issueDate) + (cert.expiryDate ? ' &ndash; ' + formatDate(cert.expiryDate) : '') + ')' : ''}
                ${cert.credentialId ? `<br><span style="font-size:10px; color:#A0AEC0;">ID: ${escapeHTML(cert.credentialId)}</span>` : ''}
                ${cert.credentialUrl ? `<br><span style="font-size:10px; color:#A0AEC0; word-break:break-all;">${escapeHTML(cert.credentialUrl)}</span>` : ''}
              </div>
            `, primaryColor)}

            <!-- Volunteer -->
            ${earlyCareerSection('VOLUNTEER', data.volunteer, v => `
              <div style="margin-bottom:8px;">
                <div style="font-size:12px; font-weight:bold; color:#2D3748;">${escapeHTML(v.role)} &mdash; ${escapeHTML(v.organization)}</div>
                <div style="font-size:10.5px; color:#A0AEC0; margin:1px 0;">${formatDate(v.startDate)} &ndash; ${formatDate(v.endDate)}${v.location ? ' &middot; ' + escapeHTML(v.location) : ''}</div>
                ${v.description ? `<p style="font-size:11px; color:#4A5568; margin:2px 0; white-space:pre-line;">${escapeHTML(v.description)}</p>` : ''}
              </div>
            `, primaryColor)}

            <!-- Internships -->
            ${earlyCareerSection('INTERNSHIPS', data.internships, it => `
              <div style="margin-bottom:8px;">
                <div style="font-size:12px; font-weight:bold; color:#2D3748;">${escapeHTML(it.jobTitle)} &mdash; ${escapeHTML(it.company)}</div>
                <div style="font-size:10.5px; color:#A0AEC0; margin:1px 0;">${formatDate(it.startDate)} &ndash; ${formatDate(it.endDate)}${it.location ? ' &middot; ' + escapeHTML(it.location) : ''}</div>
                ${it.description ? `<p style="font-size:11px; color:#4A5568; margin:2px 0; white-space:pre-line;">${escapeHTML(it.description)}</p>` : ''}
              </div>
            `, primaryColor)}

            <!-- Publications -->
            ${earlyCareerSection('PUBLICATIONS', data.publications, pub => `
              <div style="font-size:11px; color:#4A5568; margin-bottom:4px;">
                &bull; <strong>${escapeHTML(pub.title)}</strong> &mdash; <em>${escapeHTML(pub.publisher)}</em>${pub.date ? ' (' + formatDate(pub.date) + ')' : ''}
                ${pub.doi ? `<br><span style="font-size:10px; color:#A0AEC0;">DOI: ${escapeHTML(pub.doi)}</span>` : ''}
                ${pub.url ? `<br><span style="font-size:10px; color:#A0AEC0; word-break:break-all;">${escapeHTML(pub.url)}</span>` : ''}
              </div>
            `, primaryColor)}

            <!-- Conferences -->
            ${earlyCareerSection('CONFERENCES', data.conferences, c => `
              <div style="font-size:11px; color:#4A5568; margin-bottom:4px;">
                &bull; <strong>${escapeHTML(c.name)}</strong> &mdash; <em>${escapeHTML(c.role)}</em>${c.date ? ' (' + formatDate(c.date) + ')' : ''}${c.location ? ' &middot; ' + escapeHTML(c.location) : ''}
                ${c.description ? `<p style="font-size:11px; color:#4A5568; margin:2px 0; white-space:pre-line;">${escapeHTML(c.description)}</p>` : ''}
              </div>
            `, primaryColor)}

            <!-- Awards -->
            ${earlyCareerSection('AWARDS', data.awards, a => `
              <div style="font-size:11px; color:#4A5568; margin-bottom:4px;">
                &bull; <strong>${escapeHTML(a.title)}</strong> &mdash; ${escapeHTML(a.issuer)}${a.date ? ' (' + formatDate(a.date) + ')' : ''}
                ${a.description ? `<p style="font-size:11px; color:#4A5568; margin:2px 0; white-space:pre-line;">${escapeHTML(a.description)}</p>` : ''}
              </div>
            `, primaryColor)}

            ${earlyCareerCustom(data.custom, primaryColor)}

          </div>

          <!-- Secondary Right Column (Contact, Education, Work History) -->
          <div style="width:38%; flex-shrink:0;">
            
            <!-- Contact Details -->
            ${(p.phone || p.email || p.location || p.linkedin || p.website || p.github) ? `
              <div style="margin-bottom:28px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                  <div style="background-color:${primaryColor}; color:#ffffff; width:22px; height:22px; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; font-weight:bold;">&#9678;</div>
                  <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#1A202C; margin:0;">CONTACT</h2>
                </div>
                <div style="font-size:11px; color:#4A5568; line-height:1.8;">
                  ${p.phone ? `
                    <div style="margin-bottom:8px;">
                      <strong style="color:#2D3748; display:block;">Phone</strong>
                      <span>${escapeHTML(p.phone)}</span>
                    </div>
                  ` : ''}
                  ${p.email ? `
                    <div style="margin-bottom:8px;">
                      <strong style="color:#2D3748; display:block;">Email</strong>
                      <span style="word-break:break-all;">${escapeHTML(p.email)}</span>
                    </div>
                  ` : ''}
                  ${p.linkedin ? `
                    <div style="margin-bottom:8px;">
                      <strong style="color:#2D3748; display:block;">LinkedIn</strong>
                      <span style="word-break:break-all;">${escapeHTML(p.linkedin)}</span>
                    </div>
                  ` : ''}
                  ${p.location ? `
                    <div style="margin-bottom:8px;">
                      <strong style="color:#2D3748; display:block;">Location</strong>
                      <span>${escapeHTML(p.location)}</span>
                    </div>
                  ` : ''}
                  ${p.website ? `
                    <div style="margin-bottom:8px;">
                      <strong style="color:#2D3748; display:block;">Website</strong>
                      <span style="word-break:break-all;">${escapeHTML(p.website)}</span>
                    </div>
                  ` : ''}
                  ${p.github ? `
                    <div style="margin-bottom:8px;">
                      <strong style="color:#2D3748; display:block;">GitHub</strong>
                      <span style="word-break:break-all;">${escapeHTML(p.github)}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}

            <!-- Education Section -->
            ${data.education && data.education.length > 0 ? `
              <div style="margin-bottom:28px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                  <div style="background-color:${primaryColor}; color:#ffffff; width:22px; height:22px; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; font-weight:bold;">&#9678;</div>
                  <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#1A202C; margin:0;">EDUCATION</h2>
                </div>
                <div>
                  ${data.education.map(edu => `
                    <div style="margin-bottom:14px;">
                      <div style="font-size:11.5px; font-weight:700; color:#2D3748;">
                        ${escapeHTML(edu.degree)}${edu.fieldOfStudy ? ', ' + escapeHTML(edu.fieldOfStudy) : ''} ${edu.endDate ? '| ' + formatDate(edu.endDate) : (edu.startDate ? '| ' + formatDate(edu.startDate) : '')}
                      </div>
                      <div style="font-size:11px; font-style:italic; color:#718096; margin-top:2px;">
                        ${escapeHTML(edu.school)}
                      </div>
                      ${edu.gpa ? `<div style="font-size:10.5px; color:#718096; margin-top:1px;">GPA: ${escapeHTML(edu.gpa)}</div>` : ''}
                      ${edu.description ? `<p style="font-size:10.5px; color:#718096; margin:2px 0; white-space:pre-line;">${escapeHTML(edu.description)}</p>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Work History Section -->
            ${data.experience && data.experience.length > 0 ? `
              <div style="margin-bottom:28px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                  <div style="background-color:${primaryColor}; color:#ffffff; width:22px; height:22px; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; font-weight:bold;">&#9678;</div>
                  <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#1A202C; margin:0;">WORK HISTORY</h2>
                </div>
                <div>
                  ${data.experience.map(exp => `
                    <div style="margin-bottom:14px;">
                      <div style="font-size:11.5px; font-weight:700; color:#2D3748;">
                        ${escapeHTML(exp.company)}
                      </div>
                      <div style="font-size:11px; font-style:italic; color:#718096; margin:1px 0;">
                        ${escapeHTML(exp.jobTitle)}${exp.employmentType ? ` (${escapeHTML(exp.employmentType)})` : ''}
                      </div>
                      <div style="font-size:10.5px; color:#A0AEC0;">
                        ${formatDate(exp.startDate)} &ndash; ${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
                      </div>
                      ${exp.location ? `<div style="font-size:10.5px; color:#A0AEC0;">${escapeHTML(exp.location)}</div>` : ''}
                      ${exp.description ? `<p style="font-size:10.5px; color:#718096; margin:2px 0; white-space:pre-line;">${escapeHTML(exp.description)}</p>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Languages Section -->
            ${data.languages && data.languages.length > 0 ? `
              <div style="margin-bottom:28px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                  <div style="background-color:${primaryColor}; color:#ffffff; width:22px; height:22px; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; font-weight:bold;">&#9678;</div>
                  <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#1A202C; margin:0;">LANGUAGES</h2>
                </div>
                <div style="font-size:11px; color:#4A5568; line-height:1.8;">
                  ${data.languages.map(l => `<div>&bull; ${escapeHTML(l.name)}${l.proficiency ? ' (' + escapeHTML(l.proficiency) + ')' : ''}</div>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Interests / Hobbies -->
            ${data.interests && data.interests.length > 0 ? `
              <div style="margin-bottom:28px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                  <div style="background-color:${primaryColor}; color:#ffffff; width:22px; height:22px; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; font-weight:bold;">&#9678;</div>
                  <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#1A202C; margin:0;">INTERESTS</h2>
                </div>
                <div style="font-size:11px; color:#4A5568; line-height:1.8;">
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
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                    <div style="background-color:${primaryColor}; color:#ffffff; width:22px; height:22px; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; font-weight:bold;">&#9678;</div>
                    <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#1A202C; margin:0;">SOCIAL</h2>
                  </div>
                  <div style="font-size:11px; color:#4A5568; line-height:1.8;">
                    ${links.map(([k,v]) => `<div style="margin-bottom:4px; word-break:break-all;"><strong>${escapeHTML(k)}:</strong> ${escapeHTML(v)}</div>`).join('')}
                  </div>
                </div>
              `;
            })() : ''}

            ${earlyCareerRefs(data.references, primaryColor)}

          </div>
        </div>
      </div>
    `;
  }
};

// ==================== HELPER FUNCTIONS ====================
function earlyCareerSection(title, items, fn, primaryColor) {
  if (!items || items.length === 0) return '';
  return `
    <div style="margin-bottom:28px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
        <div style="background-color:${primaryColor}; color:#ffffff; width:22px; height:22px; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; font-weight:bold;">&#9678;</div>
        <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#1A202C; margin:0;">${title}</h2>
      </div>
      <div>${items.map(fn).join('')}</div>
    </div>
  `;
}

function earlyCareerRefs(refs, primaryColor) {
  if (!refs) return '';
  if (refs.placeholder) {
    return `
      <div style="margin-bottom:28px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
          <div style="background-color:${primaryColor}; color:#ffffff; width:22px; height:22px; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; font-weight:bold;">&#9678;</div>
          <h2 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#1A202C; margin:0;">REFERENCES</h2>
        </div>
        <p style="font-size:11px; color:#4A5568; margin-top:4px;">Available upon request</p>
      </div>
    `;
  }
  if (!refs.list || refs.list.length === 0) return '';
  return earlyCareerSection('REFERENCES', refs.list, r => `
    <div style="font-size:11px; color:#4A5568; margin-bottom:6px;">
      &bull; <strong>${escapeHTML(r.name)}</strong> &mdash; ${escapeHTML(r.title)}, ${escapeHTML(r.company)}
      ${r.email ? `<br><span style="font-size:10px; color:#A0AEC0; word-break:break-all;">${escapeHTML(r.email)}</span>` : ''}
      ${r.phone ? `<br><span style="font-size:10px; color:#A0AEC0;">${escapeHTML(r.phone)}</span>` : ''}
    </div>
  `, primaryColor);
}

function earlyCareerCustom(custom, primaryColor) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items || []).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return earlyCareerSection(sec.sectionName.toUpperCase(), items, item => `
      <div style="margin-bottom:8px;">
        <div style="font-size:11.5px; font-weight:bold; color:#2D3748;">${escapeHTML(item.title)}</div>
        ${item.description ? `<p style="font-size:11px; color:#4A5568; margin:2px 0; white-space:pre-line;">${escapeHTML(item.description)}</p>` : ''}
      </div>
    `, primaryColor);
  }).join('');
}
