// templates/classic-functional-cv.js — Classic Functional CV Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates['classic-functional-cv'] = {
  name: 'Classic Functional CV',
  description: 'Traditional centered header with a clean single-column functional structure emphasizing competency skill clusters',
  
  miniPreview() {
    return `<div class="mini-cv" style="font-family:Arial, sans-serif; background:#fff; width:100%; height:100%; padding:8px; box-sizing:border-box;">
      <div style="font-size:2.5px; font-weight:bold; color:#666; margin-bottom:4px;">Example Functional CV</div>
      <div style="text-align:center; margin-bottom:8px;">
        <div style="font-size:6px; font-weight:bold; color:#000;">Amanda Davies</div>
        <div style="font-size:2.5px; color:#333;">14 Any Street, Nottingham</div>
        <div style="font-size:2.5px; color:#0000FF; text-decoration:underline;">Mandy425@email.com</div>
      </div>
      <div style="font-size:3.5px; font-weight:bold; margin-bottom:2px;">Profile</div>
      <div style="font-size:2px; color:#333; margin-bottom:6px; line-height:1.2;">Considerable experience in education sector...</div>
      <div style="font-size:3.5px; font-weight:bold; margin-bottom:2px;">Leading, Coaching and Mentoring</div>
      <div style="font-size:2px; color:#333;">&bull; Leadership qualities and ability to manage...</div>
    </div>`;
  },

  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};
    const textColor = '#000000';

    return `
      <div style="font-family:Arial, Helvetica, sans-serif; background-color:#ffffff; color:${textColor}; max-width:800px; margin:0 auto; padding:45px 50px; box-shadow:0 0 10px rgba(0,0,0,0.06); text-align:left; box-sizing:border-box; line-height:1.4; word-break:break-word; overflow-wrap:break-word;">
        
        <!-- Top Left Small Document Subtitle/Header Label -->
        <div style="font-size:13px; font-weight:700; color:#111111; margin-bottom:15px;">
          ${escapeHTML(p.documentTitle || 'Example Functional CV')}
        </div>

        <!-- Centered Contact Header Block -->
        <div style="text-align:center; margin-bottom:30px;">
          <h1 style="font-size:22px; font-weight:700; color:#000000; margin:0 0 6px 0; letter-spacing:0.2px;">
            ${escapeHTML(p.fullName || 'Amanda Davies')}
          </h1>

          <div style="font-size:12px; color:#111111; line-height:1.45;">
            ${p.location ? `<div>${escapeHTML(p.location)}</div>` : ''}
            ${p.phone ? `<div>Telephone: ${escapeHTML(p.phone)}</div>` : ''}
            ${p.email ? `<div><a href="mailto:${escapeHTML(p.email)}" style="color:#0000FF; text-decoration:underline; word-break:break-all;">${escapeHTML(p.email)}</a></div>` : ''}
            ${p.linkedin ? `<div><a href="${escapeHTML(p.linkedin)}" style="color:#0000FF; text-decoration:underline; word-break:break-all;">${escapeHTML(p.linkedin)}</a></div>` : ''}
            ${p.website ? `<div><a href="${escapeHTML(p.website)}" style="color:#0000FF; text-decoration:underline; word-break:break-all;">${escapeHTML(p.website)}</a></div>` : ''}
            ${p.github ? `<div><a href="${escapeHTML(p.github)}" style="color:#0000FF; text-decoration:underline; word-break:break-all;">${escapeHTML(p.github)}</a></div>` : ''}
          </div>
        </div>

        <!-- Profile / Summary Section -->
        ${s.text ? `
          <div style="margin-bottom:24px;">
            <h2 style="font-size:15px; font-weight:700; color:#000000; margin:0 0 10px 0;">Profile</h2>
            <p style="font-size:12px; color:#111111; margin:0; line-height:1.5; text-align:justify; white-space:pre-line;">
              ${escapeHTML(s.text)}
            </p>
          </div>
        ` : ''}

        <!-- Functional Skill Clusters (Skills & Competencies) -->
        ${data.skills && data.skills.length > 0 ? `
          <div style="margin-bottom:24px;">
            ${data.skills.map(skill => `
              <div style="margin-bottom:20px;">
                <h3 style="font-size:14px; font-weight:700; color:#000000; margin:0 0 10px 0;">
                  ${escapeHTML(skill.name)}
                </h3>
                
                ${skill.level ? `
                  <ul style="margin:0; padding-left:24px; font-size:12px; color:#111111; line-height:1.5;">
                    ${skill.level.split('\n').filter(Boolean).map(bullet => `
                      <li style="margin-bottom:5px;">${escapeHTML(bullet.replace(/^[\s\u2022\-\*]+/, ''))}</li>
                    `).join('')}
                  </ul>
                ` : ` 
                  <ul style="margin:0; padding-left:24px; font-size:12px; color:#111111; line-height:1.5;">
                    <li style="margin-bottom:5px;">Demonstrated high proficiency and proven record in managing key area deliverables.</li>
                  </ul>
                `}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Work Experience / Employment History Section -->
        ${data.experience && data.experience.length > 0 ? `
          <div style="margin-bottom:24px;">
            <h2 style="font-size:15px; font-weight:700; color:#000000; margin:0 0 12px 0;">Work History</h2>
            ${data.experience.map(exp => `
              <div style="margin-bottom:14px; font-size:12px; color:#111111;">
                <div style="font-weight:700;">
                  ${escapeHTML(exp.jobTitle)}${exp.company ? ', ' + escapeHTML(exp.company) : ''}${exp.employmentType ? ` (${escapeHTML(exp.employmentType)})` : ''}
                </div>
                <div style="color:#444444; margin-top:2px;">
                  ${formatDate(exp.startDate)} &ndash; ${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}${exp.location ? ' | ' + escapeHTML(exp.location) : ''}
                </div>
                ${exp.description ? `<p style="margin:4px 0 0 0; line-height:1.4; white-space:pre-line;">${escapeHTML(exp.description)}</p>` : ''}
                ${exp.achievements ? `
                  <ul style="margin:4px 0 0 24px; padding:0; font-size:12px; color:#111111; line-height:1.4;">
                    ${exp.achievements.split('\n').filter(Boolean).map(item => `<li style="margin-bottom:3px;">${escapeHTML(item)}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Education Section -->
        ${data.education && data.education.length > 0 ? `
          <div style="margin-bottom:24px;">
            <h2 style="font-size:15px; font-weight:700; color:#000000; margin:0 0 12px 0;">Education & Qualifications</h2>
            ${data.education.map(edu => `
              <div style="margin-bottom:10px; font-size:12px; color:#111111;">
                <span style="font-weight:700;">${escapeHTML(edu.degree)}${edu.fieldOfStudy ? ', ' + escapeHTML(edu.fieldOfStudy) : ''}</span>
                ${edu.school ? ` &mdash; <span>${escapeHTML(edu.school)}</span>` : ''}
                ${edu.endDate ? ` (${formatDate(edu.endDate)})` : (edu.startDate ? ` (${formatDate(edu.startDate)})` : '')}
                ${edu.gpa ? ` &middot; GPA: ${escapeHTML(edu.gpa)}` : ''}
                ${edu.description ? `<p style="margin:2px 0 0 0; color:#222; white-space:pre-line;">${escapeHTML(edu.description)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Projects -->
        ${classicFunctionalSection('Projects', data.projects, proj => `
          <div style="margin-bottom:12px; font-size:12px;">
            <strong style="color:#000;">${escapeHTML(proj.name)}</strong>
            ${(proj.startDate || proj.endDate) ? `<span style="color:#555;"> (${formatDate(proj.startDate)} &ndash; ${formatDate(proj.endDate)})</span>` : ''}
            ${proj.technologies ? `<span style="color:#555;"> (${escapeHTML(proj.technologies)})</span>` : ''}
            ${proj.description ? `<p style="margin:2px 0 0 0; color:#222; line-height:1.4; white-space:pre-line;">${escapeHTML(proj.description)}</p>` : ''}
            ${(proj.github || proj.liveUrl) ? `<p style="margin:2px 0 0 0; font-size:11px; color:#555; word-break:break-all;">${[proj.github, proj.liveUrl].filter(Boolean).map(escapeHTML).join(' | ')}</p>` : ''}
          </div>
        `)}

        <!-- Certifications -->
        ${classicFunctionalSection('Certifications', data.certifications, cert => `
          <div style="font-size:12px; color:#111111; margin-bottom:6px;">
            &bull; <strong>${escapeHTML(cert.name)}</strong>${cert.organization ? ' &mdash; ' + escapeHTML(cert.organization) : ''}${cert.issueDate ? ' (' + formatDate(cert.issueDate) + (cert.expiryDate ? ' &ndash; ' + formatDate(cert.expiryDate) : '') + ')' : ''}
            ${cert.credentialId ? `<br><span style="font-size:11px; color:#555;">ID: ${escapeHTML(cert.credentialId)}</span>` : ''}
            ${cert.credentialUrl ? `<br><span style="font-size:11px; color:#555; word-break:break-all;">${escapeHTML(cert.credentialUrl)}</span>` : ''}
          </div>
        `)}

        <!-- Languages -->
        ${classicFunctionalSection('Languages', data.languages, l => `
          <div style="font-size:12px; color:#111111; margin-bottom:4px;">
            &bull; <strong>${escapeHTML(l.name)}</strong>${l.proficiency ? ' (' + escapeHTML(l.proficiency) + ')' : ''}
          </div>
        `)}

        <!-- Awards -->
        ${classicFunctionalSection('Awards', data.awards, a => `
          <div style="font-size:12px; color:#111111; margin-bottom:6px;">
            &bull; <strong>${escapeHTML(a.title)}</strong> &mdash; ${escapeHTML(a.issuer)}${a.date ? ' (' + formatDate(a.date) + ')' : ''}
            ${a.description ? `<p style="margin:2px 0 0 0; color:#222; white-space:pre-line;">${escapeHTML(a.description)}</p>` : ''}
          </div>
        `)}

        <!-- Volunteer -->
        ${classicFunctionalSection('Volunteer', data.volunteer, v => `
          <div style="margin-bottom:10px; font-size:12px;">
            <strong>${escapeHTML(v.role)}</strong> &mdash; ${escapeHTML(v.organization)}
            <div style="color:#444; margin-top:1px;">${formatDate(v.startDate)} &ndash; ${formatDate(v.endDate)}${v.location ? ' | ' + escapeHTML(v.location) : ''}</div>
            ${v.description ? `<p style="margin:2px 0 0 0; color:#222; white-space:pre-line;">${escapeHTML(v.description)}</p>` : ''}
          </div>
        `)}

        <!-- Internships -->
        ${classicFunctionalSection('Internships', data.internships, it => `
          <div style="margin-bottom:10px; font-size:12px;">
            <strong>${escapeHTML(it.jobTitle)}</strong> &mdash; ${escapeHTML(it.company)}
            <div style="color:#444; margin-top:1px;">${formatDate(it.startDate)} &ndash; ${formatDate(it.endDate)}${it.location ? ' | ' + escapeHTML(it.location) : ''}</div>
            ${it.description ? `<p style="margin:2px 0 0 0; color:#222; white-space:pre-line;">${escapeHTML(it.description)}</p>` : ''}
          </div>
        `)}

        <!-- Publications -->
        ${classicFunctionalSection('Publications', data.publications, pub => `
          <div style="font-size:12px; color:#111111; margin-bottom:6px;">
            &bull; <strong>${escapeHTML(pub.title)}</strong> &mdash; <em>${escapeHTML(pub.publisher)}</em>${pub.date ? ' (' + formatDate(pub.date) + ')' : ''}
            ${pub.doi ? `<br><span style="font-size:11px; color:#555;">DOI: ${escapeHTML(pub.doi)}</span>` : ''}
            ${pub.url ? `<br><span style="font-size:11px; color:#555; word-break:break-all;">${escapeHTML(pub.url)}</span>` : ''}
          </div>
        `)}

        <!-- Conferences -->
        ${classicFunctionalSection('Conferences', data.conferences, c => `
          <div style="font-size:12px; color:#111111; margin-bottom:6px;">
            &bull; <strong>${escapeHTML(c.name)}</strong> &mdash; <em>${escapeHTML(c.role)}</em>${c.date ? ' (' + formatDate(c.date) + ')' : ''}${c.location ? ' | ' + escapeHTML(c.location) : ''}
            ${c.description ? `<p style="margin:2px 0 0 0; color:#222; white-space:pre-line;">${escapeHTML(c.description)}</p>` : ''}
          </div>
        `)}

        <!-- Interests -->
        ${classicFunctionalSection('Interests', data.interests, i => `
          <div style="font-size:12px; color:#111111; margin-bottom:4px;">&bull; ${escapeHTML(i.name)}</div>
        `)}

        <!-- Social Links -->
        ${data.social ? (() => {
          const links = Object.entries(data.social).filter(([k,v]) => v);
          if (links.length === 0) return '';
          return classicFunctionalSection('Social Links', links, ([k,v]) => `
            <div style="font-size:12px; color:#111111; margin-bottom:4px;">
              <strong>${escapeHTML(k)}:</strong> <a href="${escapeHTML(v)}" style="color:#0000FF; text-decoration:underline; word-break:break-all;">${escapeHTML(v)}</a>
            </div>
          `);
        })() : ''}

        <!-- References -->
        ${classicFunctionalRefs(data.references)}

        ${classicFunctionalCustom(data.custom)}

      </div>
    `;
  }
};

// ==================== HELPER FUNCTIONS ====================
function classicFunctionalSection(title, items, fn) {
  if (!items || items.length === 0) return '';
  return `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:15px; font-weight:700; color:#000000; margin:0 0 10px 0;">${title}</h2>
      <div>${items.map(fn).join('')}</div>
    </div>
  `;
}

function classicFunctionalRefs(refs) {
  if (!refs) return '';
  if (refs.placeholder) {
    return `
      <div style="margin-bottom:24px;">
        <h2 style="font-size:15px; font-weight:700; color:#000000; margin:0 0 8px 0;">References</h2>
        <p style="font-size:12px; color:#111111; margin:0;">References available upon request.</p>
      </div>
    `;
  }
  if (!refs.list || refs.list.length === 0) return '';
  return classicFunctionalSection('References', refs.list, r => `
    <div style="font-size:12px; color:#111111; margin-bottom:8px;">
      <strong>${escapeHTML(r.name)}</strong>${r.title ? ' &mdash; ' + escapeHTML(r.title) : ''}${r.company ? ', ' + escapeHTML(r.company) : ''}
      ${r.email ? `<br/><a href="mailto:${escapeHTML(r.email)}" style="color:#0000FF; text-decoration:underline; word-break:break-all;">${escapeHTML(r.email)}</a>` : ''}
      ${r.phone ? ` | ${escapeHTML(r.phone)}` : ''}
    </div>
  `);
}

function classicFunctionalCustom(custom) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items || []).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return classicFunctionalSection(sec.sectionName, items, item => `
      <div style="margin-bottom:10px;">
        <div style="font-size:12px; font-weight:bold; color:#000000;">${escapeHTML(item.title)}</div>
        ${item.description ? `<p style="font-size:12px; color:#222222; margin:2px 0 0 0; white-space:pre-line;">${escapeHTML(item.description)}</p>` : ''}
      </div>
    `);
  }).join('');
}
