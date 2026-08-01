// templates/munich-executive.js — Munich Executive Template
window.CVTemplates = window.CVTemplates || {};

window.CVTemplates['munich-executive'] = {
  name: 'Munich Executive',
  description: 'Clean corporate layout with serif headers, subtle horizontal dividers, and asymmetric sidebar',
  
  miniPreview() {
    return `<div class="mini-cv" style="font-family:'Georgia', serif; background:#fff; width:100%; height:100%; padding:6px; box-sizing:border-box;">
      <div style="font-size:3px; color:#666; letter-spacing:0.5px; text-transform:uppercase;">PROJECT MANAGER</div>
      <div style="font-size:7px; font-weight:bold; letter-spacing:0.5px; margin-bottom:4px; line-height:1;">THOMAS<br/>HAMPTONE</div>
      <div style="border-top:0.5px solid #ddd; padding-top:4px; display:flex; gap:6px;">
        <div style="width:30%; border-right:0.5px solid #eee; padding-right:4px;">
          <div style="font-size:3px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase;">CONTACT</div>
          <div style="font-size:2.5px; color:#888; margin-top:2px;">10 Downing St</div>
          <div style="font-size:3px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; margin-top:4px;">SKILLS</div>
          <div style="font-size:2.5px; color:#555;">&#9642; Strategic Planning</div>
        </div>
        <div style="width:70%;">
          <div style="font-size:3.5px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase;">SUMMARY</div>
          <div style="font-size:2.5px; color:#666; margin-bottom:4px;">Project manager detail-oriented...</div>
          <div style="font-size:3.5px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase;">WORK EXPERIENCE</div>
          <div style="font-size:2.5px; font-weight:bold; color:#333;">Project Manager</div>
        </div>
      </div>
    </div>`;
  },

  render(data) {
    const p = data.personal || {};
    const s = data.summary || {};

    const nameParts = (p.fullName || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return `
      <div style="font-family:'Helvetica Neue', Arial, sans-serif; background-color:#ffffff; color:#333333; max-width:800px; margin:0 auto; padding:45px 40px; box-shadow:0 0 10px rgba(0,0,0,0.05); text-align:left; box-sizing:border-box; word-break:break-word; overflow-wrap:break-word;">
        
        <!-- Header Section -->
        <div style="margin-bottom:20px;">
          ${p.professionalTitle ? `
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:2px; color:#555555; margin-bottom:8px; font-weight:600;">
              ${escapeHTML(p.professionalTitle)}
            </div>
          ` : ''}
          
          <h1 style="font-family:'Playfair Display', 'Georgia', serif; font-size:36px; font-weight:bold; text-transform:uppercase; letter-spacing:1.5px; line-height:1.05; margin:0; color:#222222;">
            ${escapeHTML(firstName)}${lastName ? `<br/>${escapeHTML(lastName)}` : ''}
          </h1>
        </div>

        <!-- Top Full-Width Divider Rule -->
        <div style="border-bottom:1px solid #e0e0e0; margin-bottom:25px;"></div>

        <!-- Two-Column Body Grid -->
        <div style="display:flex; gap:30px;">
          
          <!-- Left Column (Contact, Skills, Languages, Interests, Social) -->
          <div style="width:32%; flex-shrink:0;">
            
            <!-- Contact Details -->
            ${(p.phone || p.email || p.location || p.linkedin || p.website || p.github) ? `
              <div style="margin-bottom:25px;">
                <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#333333; margin:0 0 14px 0;">CONTACT</h2>
                <div style="font-size:11px; color:#555555; line-height:1.9;">
                  ${p.location ? `<div style="margin-bottom:4px;">${escapeHTML(p.location)}</div>` : ''}
                  ${p.phone ? `<div style="margin-bottom:4px;">${escapeHTML(p.phone)}</div>` : ''}
                  ${p.email ? `<div style="margin-bottom:4px; word-break:break-all;">${escapeHTML(p.email)}</div>` : ''}
                  ${p.linkedin ? `<div style="margin-bottom:4px; word-break:break-all;">${escapeHTML(p.linkedin)}</div>` : ''}
                  ${p.website ? `<div style="margin-bottom:4px; word-break:break-all;">${escapeHTML(p.website)}</div>` : ''}
                  ${p.github ? `<div style="margin-bottom:4px; word-break:break-all;">${escapeHTML(p.github)}</div>` : ''}
                </div>
              </div>
              <div style="border-bottom:1px solid #e0e0e0; margin-bottom:25px;"></div>
            ` : ''}

            <!-- Skills Section -->
            ${data.skills && data.skills.length > 0 ? `
              <div style="margin-bottom:25px;">
                <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#333333; margin:0 0 14px 0;">SKILLS</h2>
                <div style="font-size:11px; color:#555555; line-height:2;">
                  ${data.skills.map(skill => `
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="font-size:8px; color:#777777;">&#9642;</span>
                      <span>${escapeHTML(skill.name)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
              <div style="border-bottom:1px solid #e0e0e0; margin-bottom:25px;"></div>
            ` : ''}

            <!-- Languages Section -->
            ${data.languages && data.languages.length > 0 ? `
              <div style="margin-bottom:25px;">
                <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#333333; margin:0 0 14px 0;">LANGUAGES</h2>
                <div style="font-size:11px; color:#555555; line-height:2;">
                  ${data.languages.map(l => `
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="font-size:8px; color:#777777;">&#9642;</span>
                      <span>${escapeHTML(l.name)}${l.proficiency ? ' | ' + escapeHTML(l.proficiency) : ''}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
              <div style="border-bottom:1px solid #e0e0e0; margin-bottom:25px;"></div>
            ` : ''}

            <!-- Interests Section -->
            ${data.interests && data.interests.length > 0 ? `
              <div style="margin-bottom:25px;">
                <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#333333; margin:0 0 14px 0;">INTERESTS</h2>
                <div style="font-size:11px; color:#555555; line-height:2;">
                  ${data.interests.map(i => `
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="font-size:8px; color:#777777;">&#9642;</span>
                      <span>${escapeHTML(i.name)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
              <div style="border-bottom:1px solid #e0e0e0; margin-bottom:25px;"></div>
            ` : ''}

            <!-- Social Links -->
            ${data.social ? (() => {
              const links = Object.entries(data.social).filter(([k,v]) => v);
              if (links.length === 0) return '';
              return `
                <div style="margin-bottom:25px;">
                  <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#333333; margin:0 0 14px 0;">SOCIAL</h2>
                  <div style="font-size:11px; color:#555555; line-height:1.9;">
                    ${links.map(([k,v]) => `<div style="margin-bottom:4px; word-break:break-all;"><strong>${escapeHTML(k)}:</strong> ${escapeHTML(v)}</div>`).join('')}
                  </div>
                </div>
              `;
            })() : ''}

          </div>

          <!-- Right Main Column -->
          <div style="width:68%; flex-grow:1;">
            
            <!-- Summary / Profile -->
            ${s.text ? `
              <div style="margin-bottom:25px;">
                <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#333333; margin:0 0 12px 0;">SUMMARY</h2>
                <p style="font-size:11.5px; line-height:1.6; color:#555555; margin:0; white-space:pre-line;">${escapeHTML(s.text)}</p>
              </div>
              <div style="border-bottom:1px solid #e0e0e0; margin-bottom:25px;"></div>
            ` : ''}

            <!-- Work Experience -->
            ${data.experience && data.experience.length > 0 ? `
              <div style="margin-bottom:25px;">
                <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#333333; margin:0 0 16px 0;">WORK EXPERIENCE</h2>
                ${data.experience.map(exp => `
                  <div style="margin-bottom:20px;">
                    <div style="font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; color:#222222;">${escapeHTML(exp.jobTitle)}</div>
                    <div style="font-size:11px; color:#666666; margin:3px 0 8px 0;">
                      <strong>${escapeHTML(exp.company)}</strong>${exp.employmentType ? ` (${escapeHTML(exp.employmentType)})` : ''}${exp.location ? ' &middot; ' + escapeHTML(exp.location) : ''} &middot; 
                      <span style="color:#888888;">${formatDate(exp.startDate)} - ${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
                    </div>
                    ${exp.description ? `<p style="font-size:11px; color:#555555; margin:4px 0; line-height:1.5; white-space:pre-line;">${escapeHTML(exp.description)}</p>` : ''}
                    ${exp.achievements ? `
                      <div style="margin-top:6px; font-size:11px; color:#555555; line-height:1.6;">
                        ${exp.achievements.split('\n').filter(Boolean).map(item => `
                          <div style="display:flex; align-items:flex-start; gap:6px; margin-bottom:4px;">
                            <span style="font-size:8px; color:#777777; margin-top:2px;">&#9642;</span>
                            <span>${escapeHTML(item)}</span>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
              <div style="border-bottom:1px solid #e0e0e0; margin-bottom:25px;"></div>
            ` : ''}

            <!-- Education -->
            ${data.education && data.education.length > 0 ? `
              <div style="margin-bottom:25px;">
                <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#333333; margin:0 0 16px 0;">EDUCATION</h2>
                ${data.education.map(edu => `
                  <div style="margin-bottom:16px;">
                    <div style="font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; color:#222222;">${escapeHTML(edu.degree)}${edu.fieldOfStudy ? ', ' + escapeHTML(edu.fieldOfStudy) : ''}</div>
                    <div style="font-size:11px; color:#666666; margin-top:2px;">
                      <strong>${escapeHTML(edu.school)}</strong> &middot; 
                      <span style="color:#888888;">${formatDate(edu.startDate)} - ${edu.endDate ? formatDate(edu.endDate) : 'Present'}</span>
                    </div>
                    ${edu.gpa ? `<div style="font-size:11px; color:#777777; margin-top:2px;">GPA: ${escapeHTML(edu.gpa)}</div>` : ''}
                    ${edu.description ? `<p style="font-size:11px; color:#555555; margin:3px 0; line-height:1.5; white-space:pre-line;">${escapeHTML(edu.description)}</p>` : ''}
                  </div>
                `).join('')}
              </div>
              <div style="border-bottom:1px solid #e0e0e0; margin-bottom:25px;"></div>
            ` : ''}

            <!-- Projects Section -->
            ${munichListSection('PROJECTS', data.projects, proj => `
              <div style="margin-bottom:14px;">
                <div style="font-size:12px; font-weight:bold; text-transform:uppercase; color:#222222;">${escapeHTML(proj.name)}</div>
                ${(proj.startDate || proj.endDate) ? `<div style="font-size:11px; color:#888; margin:1px 0;">${formatDate(proj.startDate)} - ${formatDate(proj.endDate)}</div>` : ''}
                ${proj.technologies ? `<div style="font-size:11px; color:#777777; margin:2px 0;">${escapeHTML(proj.technologies)}</div>` : ''}
                ${proj.description ? `<p style="font-size:11px; color:#555555; margin:3px 0; line-height:1.5; white-space:pre-line;">${escapeHTML(proj.description)}</p>` : ''}
                ${(proj.github || proj.liveUrl) ? `<p style="font-size:11px; color:#777; word-break:break-all;">${[proj.github, proj.liveUrl].filter(Boolean).map(escapeHTML).join(' | ')}</p>` : ''}
              </div>
            `)}

            <!-- Certifications -->
            ${munichListSection('CERTIFICATIONS', data.certifications, cert => `
              <div style="font-size:11px; color:#555555; margin-bottom:6px;">
                &#9642; <strong>${escapeHTML(cert.name)}</strong> ${cert.organization ? ' &mdash; ' + escapeHTML(cert.organization) : ''} ${cert.issueDate ? '(' + formatDate(cert.issueDate) + (cert.expiryDate ? ' &ndash; ' + formatDate(cert.expiryDate) : '') + ')' : ''}
                ${cert.credentialId ? `<br><span style="font-size:10px; color:#888;">ID: ${escapeHTML(cert.credentialId)}</span>` : ''}
                ${cert.credentialUrl ? `<br><span style="font-size:10px; color:#888; word-break:break-all;">${escapeHTML(cert.credentialUrl)}</span>` : ''}
              </div>
            `)}

            <!-- Awards -->
            ${munichListSection('AWARDS', data.awards, a => `
              <div style="font-size:11px; color:#555555; margin-bottom:4px;">
                &#9642; <strong>${escapeHTML(a.title)}</strong> &mdash; ${escapeHTML(a.issuer)}${a.date ? ' (' + formatDate(a.date) + ')' : ''}
                ${a.description ? `<p style="font-size:11px; color:#555; margin:2px 0; white-space:pre-line;">${escapeHTML(a.description)}</p>` : ''}
              </div>
            `)}

            <!-- Volunteer -->
            ${munichListSection('VOLUNTEER', data.volunteer, v => `
              <div style="margin-bottom:10px;">
                <div style="font-size:12px; font-weight:bold; text-transform:uppercase; color:#222222;">${escapeHTML(v.role)} &mdash; ${escapeHTML(v.organization)}</div>
                <div style="font-size:11px; color:#888; margin:1px 0;">${formatDate(v.startDate)} - ${formatDate(v.endDate)}${v.location ? ' &middot; ' + escapeHTML(v.location) : ''}</div>
                ${v.description ? `<p style="font-size:11px; color:#555555; margin:2px 0; white-space:pre-line;">${escapeHTML(v.description)}</p>` : ''}
              </div>
            `)}

            <!-- Internships -->
            ${munichListSection('INTERNSHIPS', data.internships, it => `
              <div style="margin-bottom:10px;">
                <div style="font-size:12px; font-weight:bold; text-transform:uppercase; color:#222222;">${escapeHTML(it.jobTitle)} &mdash; ${escapeHTML(it.company)}</div>
                <div style="font-size:11px; color:#888; margin:1px 0;">${formatDate(it.startDate)} - ${formatDate(it.endDate)}${it.location ? ' &middot; ' + escapeHTML(it.location) : ''}</div>
                ${it.description ? `<p style="font-size:11px; color:#555555; margin:2px 0; white-space:pre-line;">${escapeHTML(it.description)}</p>` : ''}
              </div>
            `)}

            <!-- Publications -->
            ${munichListSection('PUBLICATIONS', data.publications, pub => `
              <div style="font-size:11px; color:#555555; margin-bottom:4px;">
                &#9642; <strong>${escapeHTML(pub.title)}</strong> &mdash; ${escapeHTML(pub.publisher)}${pub.date ? ' (' + formatDate(pub.date) + ')' : ''}
                ${pub.doi ? `<br><span style="font-size:10px; color:#888;">DOI: ${escapeHTML(pub.doi)}</span>` : ''}
                ${pub.url ? `<br><span style="font-size:10px; color:#888; word-break:break-all;">${escapeHTML(pub.url)}</span>` : ''}
              </div>
            `)}

            <!-- Conferences -->
            ${munichListSection('CONFERENCES', data.conferences, c => `
              <div style="font-size:11px; color:#555555; margin-bottom:4px;">
                &#9642; <strong>${escapeHTML(c.name)}</strong> &mdash; ${escapeHTML(c.role)}${c.date ? ' (' + formatDate(c.date) + ')' : ''}${c.location ? ' &middot; ' + escapeHTML(c.location) : ''}
                ${c.description ? `<p style="font-size:11px; color:#555; margin:2px 0; white-space:pre-line;">${escapeHTML(c.description)}</p>` : ''}
              </div>
            `)}

            ${munichRefs(data.references)}
            ${munichCustom(data.custom)}

          </div>
        </div>
      </div>
    `;
  }
};

// ==================== HELPER FUNCTIONS ====================
function munichListSection(title, items, fn) {
  if (!items || items.length === 0) return '';
  return `
    <div style="margin-bottom:25px;">
      <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#333333; margin:0 0 14px 0;">${title}</h2>
      <div>${items.map(fn).join('')}</div>
    </div>
    <div style="border-bottom:1px solid #e0e0e0; margin-bottom:25px;"></div>
  `;
}

function munichRefs(refs) {
  if (!refs) return '';
  if (refs.placeholder) {
    return `
      <div style="margin-bottom:25px;">
        <h2 style="font-size:11px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold; color:#333333; margin:0 0 12px 0;">REFERENCES</h2>
        <p style="font-size:11px; color:#555555;">Available upon request</p>
      </div>
    `;
  }
  if (!refs.list || refs.list.length === 0) return '';
  return munichListSection('REFERENCES', refs.list, r => `
    <div style="font-size:11px; margin-bottom:6px; color:#555555;">
      &#9642; <strong>${escapeHTML(r.name)}</strong> &mdash; ${escapeHTML(r.title)}, ${escapeHTML(r.company)}
      ${r.email ? `<br><span style="font-size:10px; color:#888; word-break:break-all;">${escapeHTML(r.email)}</span>` : ''}
      ${r.phone ? `<br><span style="font-size:10px; color:#888;">${escapeHTML(r.phone)}</span>` : ''}
    </div>
  `);
}

function munichCustom(custom) {
  if (!custom || custom.length === 0) return '';
  return custom.map(sec => {
    if (!sec.sectionName) return '';
    const items = (sec.items || []).filter(i => i.title || i.description);
    if (items.length === 0) return '';
    return munichListSection(sec.sectionName.toUpperCase(), items, item => `
      <div style="margin-bottom:8px;">
        <div style="font-size:11px; font-weight:bold;">${escapeHTML(item.title)}</div>
        ${item.description ? `<p style="font-size:11px; color:#555555; margin:2px 0; white-space:pre-line;">${escapeHTML(item.description)}</p>` : ''}
      </div>
    `);
  }).join('');
}
