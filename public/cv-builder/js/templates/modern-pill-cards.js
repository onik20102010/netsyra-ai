// templates/modern-pill-cards.js — Modern Pill Cards Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates['modern-pill-cards'] = {
  name: 'Modern Pill Cards',
  description: 'Soft rounded card containers with black highlighted job titles and dotted skill rating indicators',
  
  miniPreview() {
    return `<div class="mini-cv" style="font-family:sans-serif; background:#ffffff; width:100%; height:100%; padding:6px; box-sizing:border-box;">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <div style="width:14px; height:14px; background:#ccc; border-radius:2px;"></div>
        <div style="font-size:7px; font-weight:bold; line-height:1; width:75%;">George<br/>Krauss</div>
      </div>
      <div style="background:#F0F2F5; padding:3px; border-radius:3px; font-size:2.5px; color:#555; margin-bottom:4px;">Profile summary text...</div>
      <div style="display:flex; gap:4px;">
        <div style="width:60%;">
          <div style="background:#1A1A1A; color:#fff; font-size:2.5px; padding:1px 3px; border-radius:1px; font-weight:bold;">Preschool Teacher</div>
          <div style="font-size:2px; color:#777; margin:1px 0;">08/2012&ndash;06/2019</div>
          <div style="font-size:2px; color:#555;">&bull; Created lesson plans</div>
        </div>
        <div style="width:40%;">
          <div style="background:#F0F2F5; padding:3px; border-radius:3px;">
            <div style="font-size:3px; font-weight:bold; margin-bottom:1px;">Skills</div>
            <div style="font-size:2px; color:#555;">Self Starter ... 5/5</div>
          </div>
        </div>
      </div>
    </div>`;
  },

  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    const cardBg = '#F0F2F5';
    const darkHighlight = '#1A1A1A';
    const textColor = '#333333';

    const nameParts = (p.fullName || 'George Krauss').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return `
      <div style="font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#ffffff; color:${textColor}; max-width:800px; margin:0 auto; padding:40px 35px; box-shadow:0 0 10px rgba(0,0,0,0.06); text-align:left; box-sizing:border-box; word-break:break-word; overflow-wrap:break-word;">
        
        <!-- Header Section -->
        <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:18px;">
          
          <!-- Left Header Photo & Contact Stack -->
          <div style="width:32%; flex-shrink:0;">
            ${p.photo && !p.photo.includes('svg') ? `
              <div style="width:75px; height:85px; border-radius:4px; overflow:hidden; margin-bottom:10px; background:#D0D5DD;">
                <img src="${escapeHTML(p.photo)}" alt="${escapeHTML(p.fullName)}" style="width:100%; height:100%; object-fit:cover;" />
              </div>
            ` : ''}

            ${p.professionalTitle ? `
              <div style="font-size:12px; font-weight:bold; color:#111111; margin-bottom:4px;">
                ${escapeHTML(p.professionalTitle)}
              </div>
            ` : ''}

            <div style="font-size:10.5px; color:#666666; line-height:1.5;">
              ${p.email ? `<div style="word-break:break-all;">${escapeHTML(p.email)}</div>` : ''}
              ${p.phone ? `<div>${escapeHTML(p.phone)}</div>` : ''}
              ${p.location ? `<div style="margin-top:4px;">${escapeHTML(p.location)}</div>` : ''}
              ${p.linkedin ? `<div style="word-break:break-all; margin-top:2px;">${escapeHTML(p.linkedin)}</div>` : ''}
              ${p.website ? `<div style="word-break:break-all; margin-top:2px;">${escapeHTML(p.website)}</div>` : ''}
              ${p.github ? `<div style="word-break:break-all; margin-top:2px;">${escapeHTML(p.github)}</div>` : ''}
            </div>
          </div>

          <!-- Right Name & Title Banner -->
          <div style="width:65%;">
            <h1 style="font-size:42px; font-weight:800; color:#111111; margin:0; line-height:1.0; letter-spacing:-1px;">
              ${escapeHTML(firstName)}${lastName ? `<br/>${escapeHTML(lastName)}` : ''}
            </h1>

            <!-- Profile Summary Card -->
            ${s.text ? `
              <div style="background-color:${cardBg}; border-radius:12px; padding:16px 20px; margin-top:20px;">
                <h2 style="font-size:18px; font-weight:bold; color:#111111; margin:0 0 6px 0;">Profile</h2>
                <p style="font-size:11px; line-height:1.55; color:#555555; margin:0; white-space:pre-line;">
                  ${escapeHTML(s.text)}
                </p>
              </div>
            ` : ''}
          </div>

        </div>

        <div style="border-bottom:1px solid #E5E7EB; margin:20px 0 25px 0;"></div>

        <!-- Main Content 2-Column Area -->
        <div style="display:flex; gap:30px;">
          
          <!-- Primary Main Column (Employment History) -->
          <div style="width:58%; flex-grow:1;">
            
            <!-- Work Experience Section -->
            ${data.experience && data.experience.length > 0 ? `
              <div style="margin-bottom:30px;">
                <h2 style="font-size:22px; font-weight:800; color:#111111; margin:0 0 16px 0;">Employment History</h2>
                <div>
                  ${data.experience.map(exp => `
                    <div style="margin-bottom:22px;">
                      <div style="background-color:${darkHighlight}; color:#ffffff; padding:5px 10px; border-radius:4px; display:inline-block; font-size:12px; font-weight:bold;">
                        ${escapeHTML(exp.jobTitle)}${exp.company ? ' at ' + escapeHTML(exp.company) : ''}
                      </div>
                      <div style="font-size:11px; color:#777777; font-weight:600; margin:5px 0 8px 2px;">
                        ${formatDate(exp.startDate)}&ndash;${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}${exp.employmentType ? ` (${escapeHTML(exp.employmentType)})` : ''}${exp.location ? ', ' + escapeHTML(exp.location) : ''}
                      </div>
                      ${exp.description ? `<p style="font-size:11px; color:#555555; margin:4px 0 6px 2px; line-height:1.5; white-space:pre-line;">${escapeHTML(exp.description)}</p>` : ''}
                      ${exp.achievements ? `
                        <div style="margin-left:2px; font-size:11px; color:#555555; line-height:1.5;">
                          ${exp.achievements.split('\n').filter(Boolean).map(item => `
                            <div style="display:flex; align-items:flex-start; gap:6px; margin-bottom:4px;">
                              <span style="color:#777777; font-size:8px; margin-top:2px;">&bull;</span>
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

            <!-- Education Section -->
            ${data.education && data.education.length > 0 ? `
              <div style="margin-bottom:30px;">
                <h2 style="font-size:22px; font-weight:800; color:#111111; margin:0 0 16px 0;">Education</h2>
                <div>
                  ${data.education.map(edu => `
                    <div style="margin-bottom:16px;">
                      <div style="background-color:${darkHighlight}; color:#ffffff; padding:4px 8px; border-radius:4px; display:inline-block; font-size:11.5px; font-weight:bold;">
                        ${escapeHTML(edu.degree)}${edu.fieldOfStudy ? ', ' + escapeHTML(edu.fieldOfStudy) : ''}
                      </div>
                      <div style="font-size:11px; color:#777777; font-weight:600; margin:4px 0 2px 2px;">
                        ${escapeHTML(edu.school)} &middot; ${formatDate(edu.startDate)}${edu.endDate ? '&ndash;' + formatDate(edu.endDate) : ''}
                      </div>
                      ${edu.gpa ? `<div style="font-size:10.5px; color:#666; margin-left:2px;">GPA: ${escapeHTML(edu.gpa)}</div>` : ''}
                      ${edu.description ? `<p style="font-size:10.5px; color:#666; margin:2px 0 0 2px; white-space:pre-line;">${escapeHTML(edu.description)}</p>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Projects -->
            ${modernPillSection('Projects', data.projects, proj => `
              <div style="margin-bottom:12px;">
                <div style="font-size:12px; font-weight:bold; color:#111111;">${escapeHTML(proj.name)}</div>
                ${(proj.startDate || proj.endDate) ? `<div style="font-size:10.5px; color:#777; margin:1px 0;">${formatDate(proj.startDate)} &ndash; ${formatDate(proj.endDate)}</div>` : ''}
                ${proj.technologies ? `<div style="font-size:10.5px; color:#777; margin:2px 0;">${escapeHTML(proj.technologies)}</div>` : ''}
                ${proj.description ? `<p style="font-size:11px; color:#555; margin:2px 0; line-height:1.5; white-space:pre-line;">${escapeHTML(proj.description)}</p>` : ''}
                ${(proj.github || proj.liveUrl) ? `<p style="font-size:10.5px; color:#777; word-break:break-all;">${[proj.github, proj.liveUrl].filter(Boolean).map(escapeHTML).join(' | ')}</p>` : ''}
              </div>
            `)}

            <!-- Volunteer -->
            ${modernPillSection('Volunteer', data.volunteer, v => `
              <div style="margin-bottom:10px;">
                <div style="background-color:${darkHighlight}; color:#ffffff; padding:4px 8px; border-radius:4px; display:inline-block; font-size:11.5px; font-weight:bold;">
                  ${escapeHTML(v.role)} at ${escapeHTML(v.organization)}
                </div>
                <div style="font-size:10.5px; color:#777; margin:3px 0 2px 2px;">${formatDate(v.startDate)} &ndash; ${formatDate(v.endDate)}${v.location ? ' &middot; ' + escapeHTML(v.location) : ''}</div>
                ${v.description ? `<p style="font-size:11px; color:#555; margin:2px 0 0 2px; white-space:pre-line;">${escapeHTML(v.description)}</p>` : ''}
              </div>
            `)}

            <!-- Internships -->
            ${modernPillSection('Internships', data.internships, it => `
              <div style="margin-bottom:10px;">
                <div style="background-color:${darkHighlight}; color:#ffffff; padding:4px 8px; border-radius:4px; display:inline-block; font-size:11.5px; font-weight:bold;">
                  ${escapeHTML(it.jobTitle)} at ${escapeHTML(it.company)}
                </div>
                <div style="font-size:10.5px; color:#777; margin:3px 0 2px 2px;">${formatDate(it.startDate)} &ndash; ${formatDate(it.endDate)}${it.location ? ' &middot; ' + escapeHTML(it.location) : ''}</div>
                ${it.description ? `<p style="font-size:11px; color:#555; margin:2px 0 0 2px; white-space:pre-line;">${escapeHTML(it.description)}</p>` : ''}
              </div>
            `)}

            <!-- Publications -->
            ${modernPillSection('Publications', data.publications, pub => `
              <div style="font-size:11px; color:#444; margin-bottom:6px;">
                <strong>${escapeHTML(pub.title)}</strong> &mdash; <em>${escapeHTML(pub.publisher)}</em>${pub.date ? ' (' + formatDate(pub.date) + ')' : ''}
                ${pub.doi ? `<br><span style="font-size:10px; color:#777;">DOI: ${escapeHTML(pub.doi)}</span>` : ''}
                ${pub.url ? `<br><span style="font-size:10px; color:#777; word-break:break-all;">${escapeHTML(pub.url)}</span>` : ''}
              </div>
            `)}

            <!-- Conferences -->
            ${modernPillSection('Conferences', data.conferences, c => `
              <div style="font-size:11px; color:#444; margin-bottom:4px;">
                <strong>${escapeHTML(c.name)}</strong> &mdash; <em>${escapeHTML(c.role)}</em>${c.date ? ' (' + formatDate(c.date) + ')' : ''}${c.location ? ' &middot; ' + escapeHTML(c.location) : ''}
                ${c.description ? `<p style="font-size:11px; color:#555; margin:2px 0; white-space:pre-line;">${escapeHTML(c.description)}</p>` : ''}
              </div>
            `)}

            ${modernPillCustom(data.custom)}

          </div>

          <!-- Secondary Column (Stack of Rounded Cards) -->
          <div style="width:42%; flex-shrink:0; display:flex; flex-direction:column; gap:16px;">
            
            <!-- Skills Card -->
            ${data.skills && data.skills.length > 0 ? `
              <div style="background-color:${cardBg}; border-radius:12px; padding:18px 20px;">
                <h2 style="font-size:20px; font-weight:bold; color:#111111; margin:0 0 12px 0;">Skills</h2>
                <div style="font-size:11px; color:#444444; line-height:1.8;">
                  ${data.skills.map(skill => `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <span style="font-weight:600; flex-shrink:0;">${escapeHTML(skill.name)}</span>
                      <span style="flex-grow:1; border-bottom:1px dotted #A0AEC0; margin:0 6px; position:relative; top:-2px;"></span>
                      <span style="color:#666666; font-size:10px; font-weight:bold; flex-shrink:0;">${skill.level ? escapeHTML(skill.level) : '5/5'}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- References Card -->
            ${data.references && (data.references.list?.length > 0 || data.references.placeholder) ? `
              <div style="background-color:${cardBg}; border-radius:12px; padding:18px 20px;">
                <h2 style="font-size:20px; font-weight:bold; color:#111111; margin:0 0 10px 0;">References</h2>
                ${data.references.placeholder ? `
                  <p style="font-size:11px; color:#555555; margin:0;">Available upon request</p>
                ` : ` 
                  <div style="font-size:11px; color:#444444; line-height:1.5;">
                    ${data.references.list.map(r => `
                      <div style="margin-bottom:10px;">
                        <div style="font-weight:bold; color:#111111;">${escapeHTML(r.name)}${r.company ? ' from ' + escapeHTML(r.company) : ''}</div>
                        ${r.title ? `<div style="color:#666666;">${escapeHTML(r.title)}</div>` : ''}
                        ${r.email ? `<div style="color:#666666; word-break:break-all;">${escapeHTML(r.email)}</div>` : ''}
                        ${r.phone ? `<div style="color:#666666;">${escapeHTML(r.phone)}</div>` : ''}
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            ` : ''}

            <!-- Languages Card -->
            ${data.languages && data.languages.length > 0 ? `
              <div style="background-color:${cardBg}; border-radius:12px; padding:18px 20px;">
                <h2 style="font-size:20px; font-weight:bold; color:#111111; margin:0 0 10px 0;">Languages</h2>
                <div style="font-size:11px; color:#444444;">
                  ${data.languages.map(l => `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <span style="font-weight:600; flex-shrink:0;">${escapeHTML(l.name)}</span>
                      <span style="flex-grow:1; border-bottom:1px dotted #A0AEC0; margin:0 6px; position:relative; top:-2px;"></span>
                      <span style="color:#666666; font-size:10px; font-weight:bold; flex-shrink:0;">${l.proficiency ? escapeHTML(l.proficiency) : 'Fluent'}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Certifications Card -->
            ${data.certifications && data.certifications.length > 0 ? `
              <div style="background-color:${cardBg}; border-radius:12px; padding:18px 20px;">
                <h2 style="font-size:20px; font-weight:bold; color:#111111; margin:0 0 10px 0;">Certifications</h2>
                <div style="font-size:11px; color:#444444; line-height:1.6;">
                  ${data.certifications.map(c => `
                    <div style="margin-bottom:6px;">
                      <strong>${escapeHTML(c.name)}</strong>${c.organization ? ' &mdash; ' + escapeHTML(c.organization) : ''}${c.issueDate ? ' (' + formatDate(c.issueDate) + (c.expiryDate ? ' &ndash; ' + formatDate(c.expiryDate) : '') + ')' : ''}
                      ${c.credentialId ? `<br><span style="font-size:10px; color:#777;">ID: ${escapeHTML(c.credentialId)}</span>` : ''}
                      ${c.credentialUrl ? `<br><span style="font-size:10px; color:#777; word-break:break-all;">${escapeHTML(c.credentialUrl)}</span>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Awards Card -->
            ${data.awards && data.awards.length > 0 ? `
              <div style="background-color:${cardBg}; border-radius:12px; padding:18px 20px;">
                <h2 style="font-size:20px; font-weight:bold; color:#111111; margin:0 0 10px 0;">Awards</h2>
                <div style="font-size:11px; color:#444444; line-height:1.6;">
                  ${data.awards.map(a => `
                    <div style="margin-bottom:6px;">
                      <strong>${escapeHTML(a.title)}</strong> &mdash; ${escapeHTML(a.issuer)}${a.date ? ' (' + formatDate(a.date) + ')' : ''}
                      ${a.description ? `<p style="font-size:11px; color:#555; margin:2px 0; white-space:pre-line;">${escapeHTML(a.description)}</p>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Interests / Hobbies Card -->
            ${data.interests && data.interests.length > 0 ? `
              <div style="background-color:${cardBg}; border-radius:12px; padding:18px 20px;">
                <h2 style="font-size:20px; font-weight:bold; color:#111111; margin:0 0 8px 0;">Hobbies</h2>
                <div style="font-size:11px; color:#444444; line-height:1.6;">
                  ${data.interests.map(i => `<div>&bull; ${escapeHTML(i.name)}</div>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Social Links Card -->
            ${data.social ? (() => {
              const links = Object.entries(data.social).filter(([k,v]) => v);
              if (links.length === 0) return '';
              return `
                <div style="background-color:${cardBg}; border-radius:12px; padding:18px 20px;">
                  <h2 style="font-size:20px; font-weight:bold; color:#111111; margin:0 0 8px 0;">Social</h2>
                  <div style="font-size:11px; color:#444444; line-height:1.6;">
                    ${links.map(([k,v]) => `<div style="margin-bottom:4px; word-break:break-all;"><strong>${escapeHTML(k)}:</strong> ${escapeHTML(v)}</div>`).join('')}
                  </div>
                </div>
              `;
            })() : ''}

          </div>
        </div>
      </div>
    `;
  }
};

// ==================== HELPER FUNCTIONS ====================
function modernPillSection(title, items, fn) {
  if (!items || items.length === 0) return '';
  return `
    <div style="margin-bottom:25px;">
      <h2 style="font-size:22px; font-weight:800; color:#111111; margin:0 0 12px 0;">${title}</h2>
      <div>${items.map(fn).join('')}</div>
    </div>
  `;
}

function modernPillCustom(custom) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items || []).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return modernPillSection(sec.sectionName, items, item => `
      <div style="margin-bottom:8px;">
        <div style="font-size:11.5px; font-weight:bold; color:#111111;">${escapeHTML(item.title)}</div>
        ${item.description ? `<p style="font-size:11px; color:#555; margin:2px 0; white-space:pre-line;">${escapeHTML(item.description)}</p>` : ''}
      </div>
    `);
  }).join('');
}
