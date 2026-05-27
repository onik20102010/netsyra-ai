// ==================== APP STATE ====================
let currentUserKey = null;
let userData = {
    personalInfo: { fullName: '', jobTitle: '', email: '', phone: '', location: '', website: '', summary: '', photo: '' },
    education: [],
    experience: [],
    skills: [],
    languages: [],
    certifications: [],
    projects: [],
    awards: [],
    publications: [],
    settings: { template: 'classic', accentColor: '#6c5ce7', fontStyle: 'inter', borderRadius: '2px', fontSize: '16px' },
    credits: 5
};
// ==================== ACHIEVEMENT / EXAMPLE DATABASE ====================
const contentExamples = {
  'summary': {
    'banking': '• Detail-oriented banking professional with 5+ years of experience in retail banking operations at HBL.\n• Proven track record in risk management and compliance, reducing fraud incidents by 20%.\n• Expert in Shariah-compliant financial products and customer relationship management.',
    'it': '• Full-stack developer with 3 years of experience building scalable web applications using React, Node.js, and AWS.\n• Led migration of legacy system to microservices, improving uptime to 99.9%.\n• Passionate about writing clean, maintainable code and mentoring junior developers.',
    'general': '• Dedicated professional with a strong background in [your field], excelling in [key skill] and [another skill].\n• Achieved [quantifiable achievement] at [previous company], resulting in [business impact].\n• Seeking to leverage expertise at a challenging organization where I can contribute immediately.'
  },
  'experience': {
    'general': '• Spearheaded a digital transformation initiative that reduced process time by 40%.\n• Managed a cross-functional team of 15 members, delivering projects on time and under budget.\n• Implemented new customer feedback system, raising satisfaction scores from 78% to 92%.',
    'banking': '• Processed 100+ customer applications weekly while maintaining 98% accuracy.\n• Led a team to implement a new loan tracking system, cutting approval time by 30%.\n• Consistently exceeded sales targets for new accounts by 20%.'
  }
};
// ==================== MOBILE TOGGLE ====================
function handleMobileLayout() {
  const appContainer = document.getElementById('appContainer');
  if (window.innerWidth <= 500) {
    appContainer.classList.add('preview-hidden');
  } else {
    appContainer.classList.remove('preview-hidden');
  }
}
window.addEventListener('resize', handleMobileLayout);
// ==================== AUTH ====================
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'cv_user_' + Math.abs(hash).toString(36);
}
function saveToStorage() {
    if (!currentUserKey) return;
    localStorage.setItem(currentUserKey, JSON.stringify(userData));
}
function loadFromStorage(key) {
    const raw = localStorage.getItem(key);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            // Merge with defaults to ensure all properties exist
            userData = {
                personalInfo: Object.assign({ fullName: '', jobTitle: '', email: '', phone: '', location: '', website: '', summary: '', photo: '' }, parsed.personalInfo),
                education: parsed.education || [],
                experience: parsed.experience || [],
                skills: parsed.skills || [],
                languages: parsed.languages || [],
                certifications: parsed.certifications || [],
                projects: parsed.projects || [],
                awards: parsed.awards || [],
                publications: parsed.publications || [],
                settings: Object.assign({ template: 'classic', accentColor: '#6c5ce7', fontStyle: 'inter', borderRadius: '2px', fontSize: '16px' }, parsed.settings),
                credits: parsed.credits ?? 5
            };
            return true;
        } catch (e) {
            return false;
        }
    }
    return false;
}
document.getElementById('authSubmit').addEventListener('click', () => {
    const password = document.getElementById('authPassword').value.trim();
    if (password.length < 4) {
        showToast('Password must be at least 4 characters', 'error');
        return;
    }
    currentUserKey = simpleHash(password);
    const exists = loadFromStorage(currentUserKey);
    if (!exists) {
        userData.credits = 5;
        saveToStorage();
        showToast('New account created! 5 free export credits.', 'success');
    } else {
        showToast('Welcome back! Data loaded.', 'success');
    }
    document.getElementById('authOverlay').classList.add('hidden');
    document.getElementById('appContainer').classList.add('active');
    document.getElementById('authPassword').value = '';
    initApp();
});
document.getElementById('authPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('authSubmit').click();
});
function logout() {
    if (confirm('Log out? Your data is saved locally.')) {
        saveToStorage();
        location.reload(); // simplest reset
    }
}
// ==================== INIT ====================
function initApp() {
    document.getElementById('fullName').value = userData.personalInfo.fullName || '';
    document.getElementById('jobTitle').value = userData.personalInfo.jobTitle || '';
    document.getElementById('email').value = userData.personalInfo.email || '';
    document.getElementById('phone').value = userData.personalInfo.phone || '';
    document.getElementById('location').value = userData.personalInfo.location || '';
    document.getElementById('website').value = userData.personalInfo.website || '';
    document.getElementById('summary').value = userData.personalInfo.summary || '';
    if (userData.personalInfo.photo) {
        document.getElementById('photoPreview').src = userData.personalInfo.photo;
    }
    document.getElementById('creditCount').textContent = userData.credits;
    setTemplate(userData.settings.template || 'classic', true);
    document.getElementById('accentColorPicker').value = userData.settings.accentColor || '#6c5ce7';
    document.getElementById('fontStylePicker').value = userData.settings.fontStyle || 'inter';
    document.getElementById('borderRadiusPicker').value = userData.settings.borderRadius || '2px';
    document.getElementById('fontSizePicker').value = userData.settings.fontSize || '16px';
    applyCustomizations(true);
    rebuildAllDynamicEntries();
    updatePreview();
    setupSectionNav();
    handleMobileLayout(); // apply mobile layout
}
function setupSectionNav() {
    const buttons = document.querySelectorAll('#sectionNav button');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const sectionId = btn.dataset.section;
            document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
            document.getElementById('section-' + sectionId).classList.add('active');
        });
    });
}
// ==================== DYNAMIC ENTRIES ====================
function rebuildAllDynamicEntries() {
    rebuildEntries('educationEntries', userData.education, createEducationHTML, 'education');
    rebuildEntries('experienceEntries', userData.experience, createExperienceHTML, 'experience');
    rebuildEntries('skillsEntries', userData.skills, createSkillHTML, 'skills');
    rebuildEntries('languagesEntries', userData.languages, createLanguageHTML, 'languages');
    rebuildEntries('certificationsEntries', userData.certifications, createCertificationHTML, 'certifications');
    rebuildEntries('projectsEntries', userData.projects, createProjectHTML, 'projects');
    rebuildEntries('awardsEntries', userData.awards, createAwardHTML, 'awards');
    rebuildEntries('publicationsEntries', userData.publications, createPublicationHTML, 'publications');
}
function rebuildEntries(containerId, dataArray, htmlFn, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    dataArray.forEach((entry, index) => {
        const div = document.createElement('div');
        div.className = 'dynamic-entry';
        div.innerHTML = htmlFn(entry, index);
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-entry';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = 'Remove';
        removeBtn.onclick = () => {
            dataArray.splice(index, 1);
            rebuildAllDynamicEntries();
            updatePreview();
            saveToStorage();
        };
        div.appendChild(removeBtn);
        div.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('input', () => {
                updateEntryFromDOM(type, index, div);
                updatePreview();
                saveToStorage();
            });
        });
        container.appendChild(div);
    });
}
function updateEntryFromDOM(type, index, div) {
    const inputs = div.querySelectorAll('input, textarea, select');
    const data = {};
    inputs.forEach(inp => {
        if (inp.dataset.field) data[inp.dataset.field] = inp.value;
    });
    const arrayMap = {
        education: userData.education,
        experience: userData.experience,
        skills: userData.skills,
        languages: userData.languages,
        certifications: userData.certifications,
        projects: userData.projects,
        awards: userData.awards,
        publications: userData.publications
    };
    if (arrayMap[type] && arrayMap[type][index]) {
        Object.assign(arrayMap[type][index], data);
    }
}
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
// Cover Letter persistence (optional)
function updateCoverLetter() {
  userData.coverLetter = {
    date: document.getElementById('clDate').value,
    manager: document.getElementById('clManager').value,
    company: document.getElementById('clCompany').value,
    position: document.getElementById('clPosition').value,
  };
  saveToStorage();
}
function matchJobDescription() {
  const jd = document.getElementById('jdText').value.trim().toLowerCase();
  if (!jd) return showToast('Paste a job description first.', 'error');
  
  const cvText = document.getElementById('cvInner').innerText.toLowerCase();
  const commonSkills = ['javascript','python','react','node','sql','project management','leadership','communication','agile','marketing','sales','finance','accounting','human resource','data analysis','machine learning'];
  
  let found = [], missing = [];
  commonSkills.forEach(skill => {
    if (jd.includes(skill)) {
      if (cvText.includes(skill)) found.push(skill);
      else missing.push(skill);
    }
  });
  
  const matchPercent = Math.round((found.length / (found.length + missing.length || 1)) * 100);
  let resultHTML = `<p><strong>Match Score:</strong> ${matchPercent}%</p>`;
  if (found.length) resultHTML += `<p><span style="color:#00cec9">✓ Found keywords:</span> ${found.join(', ')}</p>`;
  if (missing.length) resultHTML += `<p><span style="color:#e17055">⚠ Missing keywords (add to your CV):</span> ${missing.join(', ')}</p>`;
  document.getElementById('matchResult').innerHTML = resultHTML;
  showToast(`CV matches ${matchPercent}% of job keywords.`, 'info');
}
function exportCoverLetter() {
  const name = userData.personalInfo.fullName || 'Your Name';
  const email = userData.personalInfo.email || '';
  const phone = userData.personalInfo.phone || '';
  const address = document.getElementById('clAddress').value || userData.personalInfo.location || '';
  const company = document.getElementById('clCompany').value;
  const position = document.getElementById('clPosition').value;
  const date = document.getElementById('clDate').value || new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  
  const salutation = document.getElementById('clSalutation').value;
  const opening = document.getElementById('clOpening').value.replace('{company}', company).replace('{position}', position);
  const body1 = document.getElementById('clBody1').value;
  const body2 = document.getElementById('clBody2').value;
  const closing = document.getElementById('clClosing').value;
  const clHTML = `
    <div style="font-family: 'Inter', sans-serif; max-width: 700px; margin: 40px auto; padding: 40px; border: 1px solid #ccc;">
      <p style="text-align:right; color:#555">${date}</p>
      <p><strong>${name}</strong><br>${email ? email+'<br>' : ''}${phone ? phone+'<br>' : ''}${address}</p>
      <p>To:<br>${company ? company+'<br>' : ''}${position ? position+'<br>' : ''}</p>
      <p>${salutation}</p>
      <p>${opening}</p>
      <p>${body1}</p>
      <p>${body2}</p>
      <p>${closing}</p>
      <p>Sincerely,<br>${name}</p>
    </div>
  `;
  
  const win = window.open('', '_blank', 'width=800,height=600');
  win.document.write('<html><head><title>Cover Letter</title></head><body>');
  win.document.write(clHTML);
  win.document.write('</body></html>');
  win.document.close();
  win.print();
  showToast('Cover letter ready for print.', 'success');
}
// --- Entry HTML creators (Experience enhanced with example button) ---
function createEducationHTML(entry) {
    return `<div class="form-row">
      <div class="form-group"><label>Degree</label><input type="text" data-field="degree" value="${escapeHTML(entry.degree || '')}" placeholder="BSc Computer Science"></div>
      <div class="form-group"><label>Institution</label><input type="text" data-field="institution" value="${escapeHTML(entry.institution || '')}" placeholder="LUMS"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Year</label><input type="text" data-field="year" value="${escapeHTML(entry.year || '')}" placeholder="2020 - 2024"></div>
      <div class="form-group"><label>Grade / CGPA</label><input type="text" data-field="grade" value="${escapeHTML(entry.grade || '')}" placeholder="3.8 / 4.0"></div>
    </div>`;
}
function createExperienceHTML(entry) {
    return `<div class="form-row">
      <div class="form-group"><label>Job Title</label><input type="text" data-field="jobTitle" value="${escapeHTML(entry.jobTitle || '')}" placeholder="Senior Developer"></div>
      <div class="form-group"><label>Company</label><input type="text" data-field="company" value="${escapeHTML(entry.company || '')}" placeholder="Systems Limited"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Start Date</label><input type="text" data-field="startDate" value="${escapeHTML(entry.startDate || '')}" placeholder="Jan 2022"></div>
      <div class="form-group"><label>End Date</label><input type="text" data-field="endDate" value="${escapeHTML(entry.endDate || '')}" placeholder="Present"></div>
    </div>
    <div class="form-group">
      <label>
        Description
        <button class="btn-example" data-type="experience" title="See examples"><i class="fas fa-lightbulb"></i></button>
      </label>
      <textarea data-field="description" rows="2" placeholder="Responsibilities...">${escapeHTML(entry.description || '')}</textarea>
    </div>`;
}
function createSkillHTML(entry) {
    return `<div class="form-row">
      <div class="form-group"><label>Skill</label><input type="text" data-field="name" value="${escapeHTML(entry.name || '')}" placeholder="React.js"></div>
      <div class="form-group"><label>Level</label><select data-field="level">
        <option value="Beginner" ${entry.level==='Beginner'?'selected':''}>Beginner</option>
        <option value="Intermediate" ${entry.level==='Intermediate'?'selected':''}>Intermediate</option>
        <option value="Advanced" ${entry.level==='Advanced'?'selected':''}>Advanced</option>
        <option value="Expert" ${entry.level==='Expert'?'selected':''}>Expert</option>
      </select></div>
    </div>`;
}
function createLanguageHTML(entry) {
    return `<div class="form-row">
      <div class="form-group"><label>Language</label><input type="text" data-field="name" value="${escapeHTML(entry.name || '')}" placeholder="Urdu"></div>
      <div class="form-group"><label>Proficiency</label><select data-field="proficiency">
        <option value="Native" ${entry.proficiency==='Native'?'selected':''}>Native</option>
        <option value="Fluent" ${entry.proficiency==='Fluent'?'selected':''}>Fluent</option>
        <option value="Intermediate" ${entry.proficiency==='Intermediate'?'selected':''}>Intermediate</option>
        <option value="Basic" ${entry.proficiency==='Basic'?'selected':''}>Basic</option>
      </select></div>
    </div>`;
}
function createCertificationHTML(entry) {
    return `<div class="form-row">
      <div class="form-group"><label>Certification</label><input type="text" data-field="name" value="${escapeHTML(entry.name || '')}" placeholder="AWS Solutions Architect"></div>
      <div class="form-group"><label>Issuer</label><input type="text" data-field="issuer" value="${escapeHTML(entry.issuer || '')}" placeholder="Amazon"></div>
    </div>
    <div class="form-group"><label>Year</label><input type="text" data-field="year" value="${escapeHTML(entry.year || '')}" placeholder="2023"></div>`;
}
function createProjectHTML(entry) {
    return `<div class="form-row">
      <div class="form-group"><label>Project Name</label><input type="text" data-field="name" value="${escapeHTML(entry.name || '')}" placeholder="E‑Commerce Website"></div>
      <div class="form-group"><label>Role / Tech</label><input type="text" data-field="role" value="${escapeHTML(entry.role || '')}" placeholder="Lead Developer (React, Node)"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Year</label><input type="text" data-field="year" value="${escapeHTML(entry.year || '')}" placeholder="2024"></div>
      <div class="form-group"><label>Link</label><input type="text" data-field="link" value="${escapeHTML(entry.link || '')}" placeholder="https://github.com/..."></div>
    </div>
    <div class="form-group">
      <label>
        Description
        <button class="btn-example" data-type="experience" title="See examples"><i class="fas fa-lightbulb"></i></button>
      </label>
      <textarea data-field="description" rows="2" placeholder="Brief overview...">${escapeHTML(entry.description || '')}</textarea>
    </div>`;
}
function createAwardHTML(entry) {
    return `<div class="form-row">
      <div class="form-group"><label>Award Title</label><input type="text" data-field="title" value="${escapeHTML(entry.title || '')}" placeholder="Employee of the Year"></div>
      <div class="form-group"><label>Issuer</label><input type="text" data-field="issuer" value="${escapeHTML(entry.issuer || '')}" placeholder="Systems Limited"></div>
    </div>
    <div class="form-group"><label>Year</label><input type="text" data-field="year" value="${escapeHTML(entry.year || '')}" placeholder="2025"></div>`;
}
function createPublicationHTML(entry) {
    return `<div class="form-row">
      <div class="form-group"><label>Title</label><input type="text" data-field="title" value="${escapeHTML(entry.title || '')}" placeholder="Advanced Algorithms in Python"></div>
      <div class="form-group"><label>Publisher / Journal</label><input type="text" data-field="publisher" value="${escapeHTML(entry.publisher || '')}" placeholder="IEEE"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Year</label><input type="text" data-field="year" value="${escapeHTML(entry.year || '')}" placeholder="2025"></div>
      <div class="form-group"><label>Link</label><input type="text" data-field="link" value="${escapeHTML(entry.link || '')}" placeholder="https://doi.org/..."></div>
    </div>`;
}
// Add functions
function addEducation(){ userData.education.push({degree:'',institution:'',year:'',grade:''}); rebuildAllDynamicEntries(); updatePreview(); saveToStorage(); }
function addExperience(){ userData.experience.push({jobTitle:'',company:'',startDate:'',endDate:'',description:''}); rebuildAllDynamicEntries(); updatePreview(); saveToStorage(); }
function addSkill(){ userData.skills.push({name:'',level:'Intermediate'}); rebuildAllDynamicEntries(); updatePreview(); saveToStorage(); }
function addLanguage(){ userData.languages.push({name:'',proficiency:'Fluent'}); rebuildAllDynamicEntries(); updatePreview(); saveToStorage(); }
function addCertification(){ userData.certifications.push({name:'',issuer:'',year:''}); rebuildAllDynamicEntries(); updatePreview(); saveToStorage(); }
function addProject(){ userData.projects.push({name:'',role:'',year:'',link:'',description:''}); rebuildAllDynamicEntries(); updatePreview(); saveToStorage(); }
function addAward(){ userData.awards.push({title:'',issuer:'',year:''}); rebuildAllDynamicEntries(); updatePreview(); saveToStorage(); }
function addPublication(){ userData.publications.push({title:'',publisher:'',year:'',link:''}); rebuildAllDynamicEntries(); updatePreview(); saveToStorage(); }
// ==================== PHOTO ====================
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Photo must be under 5MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = function(e) {
        userData.personalInfo.photo = e.target.result;
        document.getElementById('photoPreview').src = e.target.result;
        updatePreview();
        saveToStorage();
        showToast('Photo uploaded!', 'success');
    };
    reader.readAsDataURL(file);
}
function removePhoto() {
    userData.personalInfo.photo = '';
    document.getElementById('photoPreview').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23ccc'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%23888' font-size='40'%3E%3C/text%3E%3C/svg%3E";
    updatePreview();
    saveToStorage();
    showToast('Photo removed', 'success');
}
// ==================== UPDATE PREVIEW ====================
function updatePreview() {
    userData.personalInfo.fullName = document.getElementById('fullName').value;
    userData.personalInfo.jobTitle = document.getElementById('jobTitle').value;
    userData.personalInfo.email = document.getElementById('email').value;
    userData.personalInfo.phone = document.getElementById('phone').value;
    userData.personalInfo.location = document.getElementById('location').value;
    userData.personalInfo.website = document.getElementById('website').value;
    userData.personalInfo.summary = document.getElementById('summary').value;
    saveToStorage();
    const cvInner = document.getElementById('cvInner');
    const pi = userData.personalInfo;
    const settings = userData.settings;
    const accent = settings.accentColor || '#6c5ce7';
    let html = `
    <div class="cv-sidebar">
      <div class="cv-photo-section">
        ${pi.photo ? `<img src="${pi.photo}" alt="Profile" class="cv-photo">` : ''}
        <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
        <div class="cv-title-role">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
      </div>
      <div class="cv-contact-details">
        ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope cv-icon"></i>${escapeHTML(pi.email)}</div>` : ''}
        ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone cv-icon"></i>${escapeHTML(pi.phone)}</div>` : ''}
        ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt cv-icon"></i>${escapeHTML(pi.location)}</div>` : ''}
        ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link cv-icon"></i>${escapeHTML(pi.website)}</div>` : ''}
      </div>
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">Skills</h3>
        ${userData.skills.length === 0 ? '<p class="cv-empty">Add skills in the form</p>' :
          userData.skills.map(s => `
            <div class="cv-skill-item">
              <div class="cv-skill-name">${escapeHTML(s.name || 'Skill')}</div>
              <div class="cv-skill-bar">
                <div class="cv-skill-fill" style="width:${s.level==='Expert'?'95':s.level==='Advanced'?'75':s.level==='Intermediate'?'50':'25'}%; background:${accent};"></div>
              </div>
            </div>
          `).join('')
        }
      </div>
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">Languages</h3>
        ${userData.languages.length === 0 ? '<p class="cv-empty">Add languages</p>' :
          userData.languages.map(l => `
            <div class="cv-language-item"><strong>${escapeHTML(l.name || 'Language')}</strong> – ${escapeHTML(l.proficiency || 'Proficiency')}</div>
          `).join('')
        }
      </div>
    </div>
    <div class="cv-main">
      ${pi.summary ? `<div class="cv-section"><h2 class="cv-section-heading">Professional Summary</h2><p class="cv-summary">${escapeHTML(pi.summary)}</p></div>` : ''}
      ${userData.education.length ? `<div class="cv-section"><h2 class="cv-section-heading">Education</h2>${userData.education.map(e => `<div class="cv-entry"><div class="cv-entry-title">${escapeHTML(e.degree || 'Degree')}${e.grade ? ' – ' + escapeHTML(e.grade) : ''}</div><div class="cv-entry-sub">${escapeHTML(e.institution || 'Institution')} | ${escapeHTML(e.year || 'Year')}</div></div>`).join('')}</div>` : ''}
      ${userData.experience.length ? `<div class="cv-section"><h2 class="cv-section-heading">Experience</h2>${userData.experience.map(e => `<div class="cv-entry"><div class="cv-entry-title">${escapeHTML(e.jobTitle || 'Job Title')} — ${escapeHTML(e.company || 'Company')}</div><div class="cv-entry-sub">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'End')}</div>${e.description ? `<p class="cv-entry-desc">${escapeHTML(e.description)}</p>` : ''}</div>`).join('')}</div>` : ''}
      ${userData.certifications.length ? `<div class="cv-section"><h2 class="cv-section-heading">Certifications</h2>${userData.certifications.map(c => `<div class="cv-entry"><div class="cv-entry-title">${escapeHTML(c.name || 'Certification')} ${c.year ? '(' + escapeHTML(c.year) + ')' : ''}</div><div class="cv-entry-sub">${escapeHTML(c.issuer || 'Issuer')}</div></div>`).join('')}</div>` : ''}
      ${userData.projects.length ? `<div class="cv-section"><h2 class="cv-section-heading">Projects</h2>${userData.projects.map(p => `<div class="cv-entry"><div class="cv-entry-title">${escapeHTML(p.name || 'Project')} ${p.role ? '— ' + escapeHTML(p.role) : ''}</div><div class="cv-entry-sub">${escapeHTML(p.year || 'Year')}${p.link ? ' · <a href="'+escapeHTML(p.link)+'" target="_blank" style=\"color:'+accent+';\">Link</a>' : ''}</div>${p.description ? `<p class="cv-entry-desc">${escapeHTML(p.description)}</p>` : ''}</div>`).join('')}</div>` : ''}
      ${userData.awards.length ? `<div class="cv-section"><h2 class="cv-section-heading">Awards & Honors</h2>${userData.awards.map(a => `<div class="cv-entry"><div class="cv-entry-title">${escapeHTML(a.title || 'Award')}</div><div class="cv-entry-sub">${escapeHTML(a.issuer || 'Issuer')} · ${escapeHTML(a.year || 'Year')}</div></div>`).join('')}</div>` : ''}
      ${userData.publications.length ? `<div class="cv-section"><h2 class="cv-section-heading">Publications</h2>${userData.publications.map(pub => `<div class="cv-entry"><div class="cv-entry-title">${escapeHTML(pub.title || 'Publication')}</div><div class="cv-entry-sub">${escapeHTML(pub.publisher || 'Publisher')} · ${escapeHTML(pub.year || 'Year')}${pub.link ? ' · <a href="'+escapeHTML(pub.link)+'" target="_blank" style=\"color:'+accent+';\">View</a>' : ''}</div></div>`).join('')}</div>` : ''}
    </div>`;
    cvInner.innerHTML = html;
    const cvPage = document.getElementById('cvPage');
    const fontMap = { inter: 'Inter, sans-serif', playfair: 'Playfair Display, serif', poppins: 'Poppins, sans-serif', jetbrains: 'JetBrains Mono, monospace' };
    cvPage.style.fontFamily = fontMap[settings.fontStyle] || 'Inter, sans-serif';
    cvPage.style.fontSize = settings.fontSize || '16px';
    cvPage.style.setProperty('--cv-accent', accent);
}
// ==================== TEMPLATES ====================
function setTemplate(name, silent = false) {
    userData.settings.template = name;
    const cvPage = document.getElementById('cvPage');
    const validTemplates = ['classic','modern','creative','ats-classic','executive','minimal','tech','academic','infographic','creative2'];
    // Remove all template classes
    validTemplates.forEach(t => cvPage.classList.remove(t));
    cvPage.classList.add(name);
    document.querySelectorAll('[data-template]').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-template="${name}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    updatePreview(); // re-render completely to apply structural changes
    saveToStorage();
    if (!silent) showToast(`Template: ${name.replace(/-/g,' ').replace(/\b\w/g, l => l.toUpperCase())}`, 'success');
}
// ==================== INDUSTRY PRESETS ====================
function applyIndustryPreset(industry) {
    if (!industry) return;
const presets = {
    // --- Banking & Finance ---
    'banking': { accent: '#1a3c6e', summary: 'Dedicated financial professional with expertise in banking operations, risk management, and customer relationship management within Pakistan\'s leading financial institutions.' },
    'banking_hbl': { accent: '#1a3c6e', summary: 'Results-driven banking professional seeking to contribute to Habib Bank Limited\'s legacy of trust and innovation in Pakistan\'s financial sector.' },
    'banking_meezan': { accent: '#1a3c6e', summary: 'Shariah-compliant banking specialist aiming to advance Islamic finance at Meezan Bank, Pakistan\'s leading Islamic bank.' },
    'banking_ubl': { accent: '#1a3c6e', summary: 'Motivated banking professional targeting United Bank Limited, with strong skills in corporate and retail banking operations.' },
    'banking_alfalah': { accent: '#1a3c6e', summary: 'Finance professional seeking a role at Bank Alfalah, committed to excellence in customer service and digital banking solutions.' },
    'banking_state_life': { accent: '#1a3c6e', summary: 'Insurance and financial services professional aiming to join State Life Insurance Corporation, with expertise in risk assessment and policy management.' },
    // --- IT & Technology ---
    'it': { accent: '#0d7377', summary: 'Innovative technology professional skilled in software development, cloud infrastructure, and digital transformation for Pakistan\'s growing IT sector.' },
    'it_systems': { accent: '#0d7377', summary: 'Technology professional targeting Systems Limited, with expertise in enterprise software, IT consulting, and digital transformation solutions.' },
    'it_arbisoft': { accent: '#0d7377', summary: 'Software engineer passionate about building world-class products, seeking to contribute to Arbisoft\'s global client portfolio.' },
    'it_netsol': { accent: '#0d7377', summary: 'IT professional aiming for NetSol Technologies, specializing in fintech solutions, asset finance, and leasing software development.' },
    'it_ibex': { accent: '#0d7377', summary: 'Customer experience and BPO professional seeking a role at Ibex Pakistan, with expertise in global client service delivery.' },
    // --- Telecom ---
    'telecom': { accent: '#2d8a4e', summary: 'Experienced telecommunications specialist with a passion for connectivity and network solutions in Pakistan\'s dynamic telecom industry.' },
    'telecom_jazz': { accent: '#2d8a4e', summary: 'Telecom professional targeting Jazz, Pakistan\'s leading digital operator, with expertise in mobile network operations and digital services.' },
    'telecom_telenor': { accent: '#2d8a4e', summary: 'Telecommunications specialist aiming for Telenor Pakistan, focused on network optimization and delivering seamless connectivity solutions.' },
    'telecom_zong': { accent: '#2d8a4e', summary: 'Telecom professional seeking to join Zong 4G, with a strong background in 4G/LTE network deployment and customer acquisition strategies.' },
    'telecom_ufone': { accent: '#2d8a4e', summary: 'Telecommunications expert targeting Ufone, committed to enhancing Pakistan\'s voice and data communication landscape.' },
    // --- Textile & Carpet Manufacturing ---
    'textile': { accent: '#8b5e3c', summary: 'Skilled professional in textile manufacturing and supply chain management, contributing to Pakistan\'s premier textile export industry.' },
    'textile_gulahmed': { accent: '#8b5e3c', summary: 'Textile professional seeking to join Gul Ahmed Textile Mills, with expertise in fabric production, quality control, and export operations.' },
    'textile_khaadi': { accent: '#8b5e3c', summary: 'Fashion and textile specialist targeting Khaadi Corporation, passionate about Pakistani design and global retail expansion.' },
    'textile_nishat': { accent: '#8b5e3c', summary: 'Textile industry professional aiming for Nishat Mills, with experience in large-scale textile manufacturing and international trade.' },
    'textile_interloop': { accent: '#8b5e3c', summary: 'Manufacturing professional seeking a role at Interloop Limited, specializing in hosiery production and sustainable textile practices.' },
    'textile_nayyer': { accent: '#8b5e3c', summary: 'Carpet and textile artisan targeting Nayyer Carpets, with expertise in handcrafted designs and export-quality carpet manufacturing.' },
    'textile_lahore_carpet': { accent: '#8b5e3c', summary: 'Textile craftsperson seeking to join Lahore Carpet Manufacturing Co., skilled in traditional and modern carpet weaving techniques.' },
    'textile_ziyan': { accent: '#8b5e3c', summary: 'Textile professional targeting Ziyan Textiles, with expertise in fabric sourcing, production planning, and quality assurance.' },
    'textile_kamal': { accent: '#8b5e3c', summary: 'Textile industry expert aiming for Kamal Limited, focused on spinning, weaving, and finished textile product manufacturing.' },
    'textile_bokhara': { accent: '#8b5e3c', summary: 'Carpet and rug specialist seeking a position at Bokhara House, with deep knowledge of traditional Bokhara rug artistry.' },
    'textile_ayesha': { accent: '#8b5e3c', summary: 'Textile manufacturing professional targeting Ayesha Woollen Mills, specializing in woollen and blended fabric production.' },
    'textile_multan_carpet': { accent: '#8b5e3c', summary: 'Carpet industry professional seeking to join Multan Carpet Industries, with expertise in hand-knotted and machine-made carpet production.' },
    // --- Construction & Engineering ---
    'construction': { accent: '#4a3728', summary: 'Construction and engineering professional with expertise in infrastructure projects, site management, and quality assurance for Pakistan\'s growing construction sector.' },
    'construction_zkb': { accent: '#4a3728', summary: 'Civil engineer targeting ZKB Engineers & Constructors, with experience in large-scale infrastructure and building projects across Pakistan.' },
    'construction_fwo': { accent: '#4a3728', summary: 'Engineering professional seeking to serve at Frontier Works Organization (FWO), committed to national infrastructure development.' },
    'construction_nespak': { accent: '#4a3728', summary: 'Consulting engineer aiming for NESPAK, with expertise in multidisciplinary engineering projects and international standards.' },
    'construction_cw': { accent: '#4a3728', summary: 'Civil service professional targeting the Construction & Works (C&W) Department, dedicated to public infrastructure development.' },
    'construction_nlc': { accent: '#4a3728', summary: 'Logistics and engineering professional seeking a role at National Logistics Cell (NLC), with expertise in large-scale construction and transport operations.' },
    'construction_descon_eng': { accent: '#4a3728', summary: 'Engineer targeting Descon Engineering, with experience in industrial construction, plant maintenance, and EPC projects.' },
    'construction_al_arab': { accent: '#4a3728', summary: 'Construction professional seeking to join Al-Arab Associates, skilled in commercial and residential project execution.' },
    'construction_ramzan': { accent: '#4a3728', summary: 'Site engineer aiming for Muhammad Ramzan & Company, with hands-on experience in building construction and project management.' },
    'construction_techno': { accent: '#4a3728', summary: 'Construction specialist targeting Techno Time Construction, focused on timely, quality-driven project delivery.' },
    'construction_al_riaz': { accent: '#4a3728', summary: 'Construction professional seeking a position at Al-Riaz Construction Co., experienced in high-rise and commercial building projects.' },
    'construction_wahab': { accent: '#4a3728', summary: 'Engineering professional targeting Wahab Engineering Services, with expertise in structural design and construction supervision.' },
    'construction_ace': { accent: '#4a3728', summary: 'Contracting specialist aiming for Ace Contractors, skilled in project estimation, execution, and team leadership.' },
    'construction_ammar': { accent: '#4a3728', summary: 'Construction professional seeking to join Ammar Group of Companies, with broad experience in diversified construction projects.' },
    'construction_banu': { accent: '#4a3728', summary: 'Engineer targeting Banu Mukhtar Contracting, with expertise in industrial and infrastructure construction across Pakistan.' },
    'construction_cecon': { accent: '#4a3728', summary: 'Engineering professional aiming for CECON Engineering, specialized in civil and structural engineering consultancy.' },
    'construction_cneec': { accent: '#4a3728', summary: 'Engineer seeking to join China National Electric Engineering (CNEEC) in Pakistan, with expertise in power and infrastructure projects.' },
    'construction_constructwell': { accent: '#4a3728', summary: 'Construction professional targeting ConstructWell, committed to quality building practices and innovative construction methods.' },
    'construction_dascon': { accent: '#4a3728', summary: 'Site management professional aiming for Dascon Construction Company, experienced in large-scale project execution.' },
    'construction_dcon': { accent: '#4a3728', summary: 'Construction specialist seeking a role at Dcon Construction, focused on efficient, cost-effective building solutions.' },
    'construction_deokjae': { accent: '#4a3728', summary: 'Engineer targeting Deokjae Group Pakistan, with expertise in international-standard construction and project management.' },
    'construction_earth': { accent: '#4a3728', summary: 'Construction professional seeking to join Earth Builders, passionate about sustainable and eco-friendly building practices.' },
    'construction_imarat': { accent: '#4a3728', summary: 'Real estate and construction professional targeting Imarat Group, with expertise in property development and construction management.' },
    'construction_prism': { accent: '#4a3728', summary: 'Estate and construction specialist aiming for Prism Estate & Builders, skilled in residential and commercial property development.' },
    'construction_alwafa': { accent: '#4a3728', summary: 'Construction professional seeking a position at Al-Wafa Estate & Builders, experienced in real estate development and building projects.' },
    'construction_shehanshah': { accent: '#4a3728', summary: 'Builder and developer targeting Shehanshah Estate and Builders, focused on quality residential and commercial construction.' },
    'construction_amer_adnan': { accent: '#4a3728', summary: 'Architectural professional seeking to join Amer Adnan Associates, with expertise in modern architectural design and interior solutions.' },
    'construction_design_tech': { accent: '#4a3728', summary: 'Engineering professional aiming for Design Tech Engineering Solutions, specialized in innovative design and structural engineering.' },
    // --- Furniture, Woodwork & Interiors ---
    'furniture': { accent: '#6b4c3b', summary: 'Skilled furniture and interior design professional with expertise in woodwork, space planning, and aesthetic interior solutions for Pakistan\'s growing home and office market.' },
    'furniture_interwood': { accent: '#6b4c3b', summary: 'Furniture professional targeting Interwood Mobel, with expertise in premium furniture design, sales, and customer experience.' },
    'furniture_falaknaz': { accent: '#6b4c3b', summary: 'Construction and furniture specialist seeking to join Falaknaz Group, skilled in real estate and interior furnishing solutions.' },
    'furniture_trigen': { accent: '#6b4c3b', summary: 'Interior design professional aiming for TriGen Interiors, with a creative portfolio of modern residential and commercial spaces.' },
    'furniture_themes': { accent: '#6b4c3b', summary: 'Furniture and homestore professional targeting Themes Furniture & Homestore, passionate about creating beautiful living environments.' },
    'furniture_mahenti': { accent: '#6b4c3b', summary: 'Manufacturing professional seeking a role at Mahenti Industries, with expertise in furniture production and quality craftsmanship.' },
    'furniture_focus': { accent: '#6b4c3b', summary: 'Interior specialist aiming for Focus Interiors, skilled in space transformation and contemporary design solutions.' },
    'furniture_indoor': { accent: '#6b4c3b', summary: 'Furniture professional seeking to join In Door Furniture, with a passion for functional and stylish home furnishings.' },
    'furniture_galaxy': { accent: '#6b4c3b', summary: 'Interior designer targeting Galaxy Interior Furniture, with expertise in modern furniture selection and space planning.' },
    'furniture_habitt': { accent: '#6b4c3b', summary: 'Retail and furniture professional aiming for Habitt, skilled in home décor, furnishings, and customer engagement.' },
    'furniture_chenone': { accent: '#6b4c3b', summary: 'Home and lifestyle professional seeking a position at ChenOne Home, with a keen eye for premium home styling and retail.' },
    'furniture_aenzay': { accent: '#6b4c3b', summary: 'Architectural and interior professional targeting Aenzay Interiors & Architects, with expertise in bespoke design solutions.' },
    'furniture_zebra': { accent: '#6b4c3b', summary: 'Interior and contracting professional seeking to join Zebra.pk Interior & Contractors, skilled in turnkey interior projects.' },
    'furniture_ghonsla': { accent: '#6b4c3b', summary: 'Construction and design professional aiming for Ghonsla Construction, with expertise in building and interior finishing.' },
    'furniture_alhaadi': { accent: '#6b4c3b', summary: 'Furniture craftsperson targeting Al Haadi Mobilya, skilled in traditional and contemporary furniture making.' },
    'furniture_transeptia': { accent: '#6b4c3b', summary: 'Construction and interior professional seeking a role at Transeptia Construction Interior & Architect, with a holistic approach to design-build projects.' },
    // --- Engineering & Industrial Manufacturing ---
    'engineering': { accent: '#3d5a80', summary: 'Engineering and industrial manufacturing professional with expertise in production, quality management, and operational excellence for Pakistan\'s industrial sector.' },
    'engineering_engro': { accent: '#3d5a80', summary: 'Industrial professional targeting Engro Corporation, with expertise in manufacturing, energy, and agribusiness operations.' },
    'engineering_lucky': { accent: '#3d5a80', summary: 'Manufacturing specialist seeking to join Lucky Core Industries (LCI), skilled in chemical and materials production.' },
    'engineering_fatima': { accent: '#3d5a80', summary: 'Industrial professional aiming for Fatima Group, with a strong background in fertilizer and energy sector operations.' },
    'engineering_fauji': { accent: '#3d5a80', summary: 'Engineering professional targeting Fauji Fertilizer Company (FFC), committed to agricultural and industrial excellence.' },
    'engineering_pel': { accent: '#3d5a80', summary: 'Electronics and appliances professional seeking a role at Pak Elektron Limited (PEL), skilled in manufacturing and product development.' },
    'engineering_dawlance': { accent: '#3d5a80', summary: 'Home appliance specialist aiming for Dawlance, with expertise in consumer electronics and after-sales service.' },
    'engineering_haier': { accent: '#3d5a80', summary: 'Consumer electronics professional targeting Haier Pakistan, focused on innovative home appliance solutions.' },
    'engineering_atlas_battery': { accent: '#3d5a80', summary: 'Manufacturing professional seeking to join Atlas Battery, with expertise in automotive and industrial battery production.' },
    'engineering_honda_atlas': { accent: '#3d5a80', summary: 'Automotive industry professional aiming for Honda Atlas Cars, with a passion for automobile manufacturing and quality engineering.' },
    'engineering_indus_motor': { accent: '#3d5a80', summary: 'Automotive professional targeting Indus Motor Company (Toyota), skilled in lean manufacturing and supply chain management.' },
    'engineering_pak_suzuki': { accent: '#3d5a80', summary: 'Automotive specialist seeking a position at Pak Suzuki Motor Company, with expertise in vehicle assembly and production.' },
    // --- Consumer Goods, Retail & FMCG ---
    'fmcg': { accent: '#e07c24', summary: 'FMCG and consumer goods professional with expertise in brand management, distribution, and retail operations for Pakistan\'s fast-moving consumer goods sector.' },
    'fmcg_unilever': { accent: '#e07c24', summary: 'FMCG professional targeting Unilever Pakistan, with a strong background in brand management and consumer marketing.' },
    'fmcg_pepsico': { accent: '#e07c24', summary: 'Beverage and snacks professional seeking to join PepsiCo Pakistan, skilled in sales, distribution, and brand activation.' },
    'fmcg_coca_cola': { accent: '#e07c24', summary: 'Beverage industry professional aiming for Coca-Cola Beverages Pakistan, with expertise in bottling operations and market penetration.' },
    'fmcg_nestle': { accent: '#e07c24', summary: 'Nutrition and food professional targeting Nestlé Pakistan, committed to quality and consumer well-being.' },
    'fmcg_pg': { accent: '#e07c24', summary: 'Consumer goods professional seeking a role at P&G Pakistan, with expertise in brand building and market leadership.' },
    'fmcg_reckitt': { accent: '#e07c24', summary: 'Health and hygiene professional aiming for Reckitt Benckiser (RB), focused on consumer health and household products.' },
    'fmcg_shan': { accent: '#e07c24', summary: 'Food industry professional targeting Shan Foods, with a passion for Pakistani cuisine and global food distribution.' },
    'fmcg_national_foods': { accent: '#e07c24', summary: 'Food manufacturing specialist seeking to join National Foods, skilled in food production and quality management.' },
    'fmcg_metro': { accent: '#e07c24', summary: 'Retail professional targeting Metro Pakistan, with expertise in wholesale operations and supply chain management.' },
    'fmcg_carrefour': { accent: '#e07c24', summary: 'Retail industry professional aiming for Carrefour Pakistan, skilled in hypermarket operations and category management.' },
    'fmcg_imtiaz': { accent: '#e07c24', summary: 'Retail professional seeking a position at Imtiaz Super Market, with expertise in retail operations and customer service.' },
    'fmcg_tcs': { accent: '#e07c24', summary: 'Logistics professional targeting TCS Express & Logistics, skilled in courier services, supply chain, and e-commerce fulfillment.' },
    // --- Healthcare ---
    'healthcare': { accent: '#2e7d6f', summary: 'Compassionate healthcare professional dedicated to improving patient outcomes in Pakistan\'s medical facilities.' },
    'healthcare_shaukat': { accent: '#2e7d6f', summary: 'Healthcare professional seeking to serve at Shaukat Khanum Memorial Hospital, committed to providing world-class cancer care to all Pakistanis.' },
    'healthcare_aku': { accent: '#2e7d6f', summary: 'Medical professional targeting Aga Khan University Hospital (AKUH), with a commitment to healthcare excellence and academic medicine.' },
    'healthcare_indus_hospital': { accent: '#2e7d6f', summary: 'Healthcare professional aiming for Indus Hospital & Health Network, passionate about free, quality healthcare for underserved communities.' },
    // --- Education ---
    'education': { accent: '#4a3f6b', summary: 'Passionate educator committed to academic excellence and student development within Pakistan\'s educational institutions.' },
    'education_lums': { accent: '#4a3f6b', summary: 'Academic professional targeting LUMS, with a strong commitment to research, teaching, and higher education excellence in Pakistan.' },
    'education_beaconhouse': { accent: '#4a3f6b', summary: 'Educator seeking to join Beaconhouse School System, dedicated to shaping young minds through quality K-12 education.' },
    'education_city_school': { accent: '#4a3f6b', summary: 'Teaching professional aiming for The City School, committed to modern pedagogy and holistic student development.' },
    // --- NGOs & Social Sector ---
    'ngo': { accent: '#5b8c5a', summary: 'Dedicated social sector professional committed to community development, humanitarian work, and creating positive social impact across Pakistan.' },
    'ngo_saylani': { accent: '#5b8c5a', summary: 'Social welfare professional seeking to serve at Saylani Welfare Trust, committed to poverty alleviation and community empowerment.' },
    'ngo_tcf': { accent: '#5b8c5a', summary: 'Education and development professional targeting The Citizens Foundation (TCF), dedicated to providing quality education to underprivileged children.' },
    // --- Miscellaneous ---
    'misc': { accent: '#6c5ce7', summary: 'Versatile professional seeking opportunities in Pakistan\'s diverse business landscape.' },
    'misc_murree': { accent: '#6c5ce7', summary: 'Beverage industry professional targeting Murree Brewery Company, with expertise in production, quality control, and Pakistan\'s heritage brands.' },
    'misc_pc': { accent: '#6c5ce7', summary: 'Hospitality professional seeking to join Pearl Continental (PC) Hotels, committed to world-class guest service and hotel management.' },
    'misc_serena': { accent: '#6c5ce7', summary: 'Hotel and tourism professional aiming for Serena Hotels Pakistan, with expertise in luxury hospitality and cultural tourism.' },
    'misc_airblue': { accent: '#6c5ce7', summary: 'Aviation professional targeting Airblue, with a passion for safe, reliable air travel and customer service in Pakistan\'s airline industry.' }
};
    const preset = presets[industry];
    if (preset) {
        userData.settings.accentColor = preset.accent;
        document.getElementById('accentColorPicker').value = preset.accent;
        document.getElementById('summary').value = preset.summary;
        userData.personalInfo.summary = preset.summary;
        applyCustomizations(true);
        updatePreview();
        saveToStorage();
        showToast(`Applied ${industry.replace('_', ' ')} preset`, 'success');
    }
    document.getElementById('industryPreset').value = '';
}
// ==================== CUSTOMIZATION ====================
function applyCustomizations(silent = false) {
    userData.settings.accentColor = document.getElementById('accentColorPicker').value;
    userData.settings.fontStyle = document.getElementById('fontStylePicker').value;
    userData.settings.borderRadius = document.getElementById('borderRadiusPicker').value;
    userData.settings.fontSize = document.getElementById('fontSizePicker').value;
    const cvPage = document.getElementById('cvPage');
    cvPage.style.setProperty('--cv-accent', userData.settings.accentColor);
    const fontMap = { inter: 'Inter, sans-serif', playfair: 'Playfair Display, serif', poppins: 'Poppins, sans-serif', jetbrains: 'JetBrains Mono, monospace' };
    cvPage.style.fontFamily = fontMap[userData.settings.fontStyle] || 'Inter, sans-serif';
    cvPage.style.fontSize = userData.settings.fontSize;
    cvPage.style.borderRadius = userData.settings.borderRadius;
    updatePreview();
    saveToStorage();
    if (!silent) showToast('Customizations applied!', 'success');
}
function openCustomization() { document.getElementById('customizationModal').classList.add('active'); }
function closeCustomization() { document.getElementById('customizationModal').classList.remove('active'); }
// ==================== CREDITS ====================
function updateCreditDisplay() {
    document.getElementById('creditCount').textContent = userData.credits;
}
function openPaymentModal() { document.getElementById('paymentModal').classList.add('active'); }
function closePaymentModal() { document.getElementById('paymentModal').classList.remove('active'); }
function simulatePayment(method) {
    userData.credits += 5;
    updateCreditDisplay();
    saveToStorage();
    closePaymentModal();
    showToast(`Simulated ${method} payment! +5 credits.`, 'success');
}
// ==================== EXPORT PDF ====================
function exportPDF() {
    if (userData.credits <= 0) {
        if (confirm('You have 0 free exports left.\nWould you like to buy an affordable credit pack?\n(You can also continue, but the PDF will have a small watermark.)')) {
            openPaymentModal();
        } else {
            updatePreview();
            setTimeout(() => {
                addWatermark();
                window.print();
                removeWatermark();
                showToast('Watermarked PDF exported. Consider upgrading for watermark-free.', 'warning');
            }, 300);
        }
        return;
    }
    if (!confirm('This will use 1 of your ' + userData.credits + ' free exports. Continue?')) return;
    userData.credits--;
    updateCreditDisplay();
    saveToStorage();
    updatePreview();
    setTimeout(() => {
        window.print();
        showToast('PDF ready! Use "Save as PDF" in print dialog.', 'success');
    }, 300);
}
function addWatermark() {
    const wm = document.createElement('div');
    wm.id = 'watermark';
    wm.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-25deg); font-size:8em; color:rgba(0,0,0,0.04); pointer-events:none; white-space:nowrap;';
    wm.textContent = 'Free CV Builder';
    document.getElementById('cvPage').appendChild(wm);
}
function removeWatermark() {
    const wm = document.getElementById('watermark');
    if (wm) wm.remove();
}
// ==================== TOAST ====================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    toast.addEventListener('animationend', (e) => {
        if (e.animationName === 'toastOut') toast.remove();
    });
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
}
// ==================== MODAL CLOSE ====================
document.getElementById('paymentModal').addEventListener('click', function(e) { if (e.target === this) closePaymentModal(); });
document.getElementById('customizationModal').addEventListener('click', function(e) { if (e.target === this) closeCustomization(); });
// Keyboard shortcut
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'e') { e.preventDefault(); exportPDF(); }
});
// ==================== SEARCHABLE INDUSTRY DROPDOWN ====================
(function() {
  const industryGroups = [
    { label: '🏦 Banking & Finance', options: [
      { value: 'banking', text: 'Banking & Finance (General)' },
      { value: 'banking_hbl', text: 'Habib Bank Limited (HBL)' },
      { value: 'banking_meezan', text: 'Meezan Bank' },
      { value: 'banking_ubl', text: 'United Bank Limited (UBL)' },
      { value: 'banking_alfalah', text: 'Bank Alfalah' },
      { value: 'banking_state_life', text: 'State Life Insurance Corporation' }
    ]},
    { label: '💻 IT & Technology', options: [
      { value: 'it', text: 'IT & Technology (General)' },
      { value: 'it_systems', text: 'Systems Limited' },
      { value: 'it_arbisoft', text: 'Arbisoft' },
      { value: 'it_netsol', text: 'NetSol Technologies' },
      { value: 'it_ibex', text: 'Ibex Pakistan' }
    ]},
    { label: '📡 Telecom', options: [
      { value: 'telecom', text: 'Telecom (General)' },
      { value: 'telecom_jazz', text: 'Jazz' },
      { value: 'telecom_telenor', text: 'Telenor Pakistan' },
      { value: 'telecom_zong', text: 'Zong 4G' },
      { value: 'telecom_ufone', text: 'Ufone' }
    ]},
    { label: '🧵 Textile & Carpet Manufacturing', options: [
      { value: 'textile', text: 'Textile & Manufacturing (General)' },
      { value: 'textile_gulahmed', text: 'Gul Ahmed Textile Mills' },
      { value: 'textile_khaadi', text: 'Khaadi Corporation' },
      { value: 'textile_nishat', text: 'Nishat Mills' },
      { value: 'textile_interloop', text: 'Interloop Limited' },
      { value: 'textile_nayyer', text: 'Nayyer Carpets' },
      { value: 'textile_lahore_carpet', text: 'Lahore Carpet Manufacturing Co.' },
      { value: 'textile_ziyan', text: 'Ziyan Textiles' },
      { value: 'textile_kamal', text: 'Kamal Limited' },
      { value: 'textile_bokhara', text: 'Bokhara House' },
      { value: 'textile_ayesha', text: 'Ayesha Woollen Mills' },
      { value: 'textile_multan_carpet', text: 'Multan Carpet Industries' }
    ]},
    { label: '🏗️ Construction & Engineering', options: [
      { value: 'construction', text: 'Construction & Engineering (General)' },
      { value: 'construction_zkb', text: 'ZKB Engineers & Constructors' },
      { value: 'construction_fwo', text: 'Frontier Works Organization (FWO)' },
      { value: 'construction_nespak', text: 'NESPAK' },
      { value: 'construction_cw', text: 'Construction & Works (C&W) Department' },
      { value: 'construction_nlc', text: 'National Logistics Cell (NLC)' },
      { value: 'construction_descon_eng', text: 'Descon Engineering' },
      { value: 'construction_al_arab', text: 'Al-Arab Associates' },
      { value: 'construction_ramzan', text: 'Muhammad Ramzan & Company' },
      { value: 'construction_techno', text: 'Techno Time Construction' },
      { value: 'construction_al_riaz', text: 'Al-Riaz Construction Co.' },
      { value: 'construction_wahab', text: 'Wahab Engineering Services' },
      { value: 'construction_ace', text: 'Ace Contractors' },
      { value: 'construction_ammar', text: 'Ammar Group of Companies' },
      { value: 'construction_banu', text: 'Banu Mukhtar Contracting' },
      { value: 'construction_cecon', text: 'CECON Engineering' },
      { value: 'construction_cneec', text: 'China National Electric Engineering (CNEEC)' },
      { value: 'construction_constructwell', text: 'ConstructWell' },
      { value: 'construction_dascon', text: 'Dascon Construction Company' },
      { value: 'construction_dcon', text: 'Dcon Construction' },
      { value: 'construction_deokjae', text: 'Deokjae Group Pakistan' },
      { value: 'construction_earth', text: 'Earth Builders' },
      { value: 'construction_imarat', text: 'Imarat Group' },
      { value: 'construction_prism', text: 'Prism Estate & Builders' },
      { value: 'construction_alwafa', text: 'Al-Wafa Estate & Builders' },
      { value: 'construction_shehanshah', text: 'Shehanshah Estate and Builders' },
      { value: 'construction_amer_adnan', text: 'Amer Adnan Associates' },
      { value: 'construction_design_tech', text: 'Design Tech Engineering Solutions' }
    ]},
    { label: '🪑 Furniture, Woodwork & Interiors', options: [
      { value: 'furniture', text: 'Furniture & Woodwork (General)' },
      { value: 'furniture_interwood', text: 'Interwood Mobel' },
      { value: 'furniture_falaknaz', text: 'Falaknaz Group' },
      { value: 'furniture_trigen', text: 'TriGen Interiors' },
      { value: 'furniture_themes', text: 'Themes Furniture & Homestore' },
      { value: 'furniture_mahenti', text: 'Mahenti Industries' },
      { value: 'furniture_focus', text: 'Focus Interiors' },
      { value: 'furniture_indoor', text: 'In Door Furniture' },
      { value: 'furniture_galaxy', text: 'Galaxy Interior Furniture' },
      { value: 'furniture_habitt', text: 'Habitt' },
      { value: 'furniture_chenone', text: 'ChenOne Home' },
      { value: 'furniture_aenzay', text: 'Aenzay Interiors & Architects' },
      { value: 'furniture_zebra', text: 'Zebra.pk Interior & Contractors' },
      { value: 'furniture_ghonsla', text: 'Ghonsla Construction' },
      { value: 'furniture_alhaadi', text: 'Al Haadi Mobilya' },
      { value: 'furniture_transeptia', text: 'Transeptia Construction Interior & Architect' }
    ]},
    { label: '⚙️ Engineering & Industrial Manufacturing', options: [
      { value: 'engineering', text: 'Engineering & Industrial (General)' },
      { value: 'engineering_engro', text: 'Engro Corporation' },
      { value: 'engineering_lucky', text: 'Lucky Core Industries (LCI)' },
      { value: 'engineering_fatima', text: 'Fatima Group' },
      { value: 'engineering_fauji', text: 'Fauji Fertilizer Company (FFC)' },
      { value: 'engineering_pel', text: 'Pak Elektron Limited (PEL)' },
      { value: 'engineering_dawlance', text: 'Dawlance' },
      { value: 'engineering_haier', text: 'Haier Pakistan' },
      { value: 'engineering_atlas_battery', text: 'Atlas Battery' },
      { value: 'engineering_honda_atlas', text: 'Honda Atlas Cars' },
      { value: 'engineering_indus_motor', text: 'Indus Motor Company (Toyota)' },
      { value: 'engineering_pak_suzuki', text: 'Pak Suzuki Motor Company' }
    ]},
    { label: '🛒 Consumer Goods, Retail & FMCG', options: [
      { value: 'fmcg', text: 'Consumer Goods & FMCG (General)' },
      { value: 'fmcg_unilever', text: 'Unilever Pakistan' },
      { value: 'fmcg_pepsico', text: 'PepsiCo Pakistan' },
      { value: 'fmcg_coca_cola', text: 'Coca-Cola Beverages Pakistan' },
      { value: 'fmcg_nestle', text: 'Nestlé Pakistan' },
      { value: 'fmcg_pg', text: 'P&G Pakistan' },
      { value: 'fmcg_reckitt', text: 'Reckitt Benckiser (RB)' },
      { value: 'fmcg_shan', text: 'Shan Foods' },
      { value: 'fmcg_national_foods', text: 'National Foods' },
      { value: 'fmcg_metro', text: 'Metro Pakistan' },
      { value: 'fmcg_carrefour', text: 'Carrefour Pakistan' },
      { value: 'fmcg_imtiaz', text: 'Imtiaz Super Market' },
      { value: 'fmcg_tcs', text: 'TCS Express & Logistics' }
    ]},
    { label: '🏥 Healthcare', options: [
      { value: 'healthcare', text: 'Healthcare (General)' },
      { value: 'healthcare_shaukat', text: 'Shaukat Khanum Memorial Hospital' },
      { value: 'healthcare_aku', text: 'Aga Khan University Hospital (AKUH)' },
      { value: 'healthcare_indus_hospital', text: 'Indus Hospital & Health Network' }
    ]},
    { label: '📚 Education', options: [
      { value: 'education', text: 'Education (General)' },
      { value: 'education_lums', text: 'LUMS' },
      { value: 'education_beaconhouse', text: 'Beaconhouse School System' },
      { value: 'education_city_school', text: 'The City School' }
    ]},
    { label: '🤝 NGOs & Social Sector', options: [
      { value: 'ngo', text: 'NGOs & Social Sector (General)' },
      { value: 'ngo_saylani', text: 'Saylani Welfare Trust' },
      { value: 'ngo_tcf', text: 'The Citizens Foundation (TCF)' }
    ]},
    { label: '🎯 Miscellaneous & Other Sectors', options: [
      { value: 'misc', text: 'Miscellaneous (General)' },
      { value: 'misc_murree', text: 'Murree Brewery Company' },
      { value: 'misc_pc', text: 'Pearl Continental (PC) Hotels' },
      { value: 'misc_serena', text: 'Serena Hotels Pakistan' },
      { value: 'misc_airblue', text: 'Airblue' }
    ]}
  ];
  const wrapper = document.getElementById('industrySearchWrapper');
  const input = document.getElementById('industrySearchInput');
  const dropdown = document.getElementById('searchDropdown');
  const hiddenSelect = document.getElementById('industryPreset');
  const toggleBtn = document.getElementById('toggleDropdownBtn');
  let allOptions = [];
  // Flatten the groups
  industryGroups.forEach(group => {
    group.options.forEach(opt => {
      allOptions.push({
        value: opt.value,
        text: opt.text,
        groupLabel: group.label
      });
    });
  });
  function renderDropdown(filterText = '') {
    dropdown.innerHTML = '';
    const search = filterText.toLowerCase().trim();
    let visibleCount = 0;
    industryGroups.forEach(group => {
      const groupMatchedOptions = group.options.filter(opt =>
        opt.text.toLowerCase().includes(search) ||
        opt.value.toLowerCase().includes(search) ||
        group.label.toLowerCase().includes(search)
      );
      if (groupMatchedOptions.length === 0) return;
      const header = document.createElement('div');
      header.className = 'optgroup-label';
      header.textContent = group.label;
      dropdown.appendChild(header);
      groupMatchedOptions.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'option-item';
        item.dataset.value = opt.value;
        if (search && search.length > 0) {
          const regex = new RegExp(`(${escapeRegExp(search)})`, 'gi');
          item.innerHTML = opt.text.replace(regex, `<mark>$1</mark>`);
        } else {
          item.textContent = opt.text;
        }
        if (hiddenSelect.value === opt.value) {
          item.classList.add('selected-highlight');
        }
        item.addEventListener('click', () => selectOption(opt.value, opt.text));
        dropdown.appendChild(item);
        visibleCount++;
      });
    });
    if (visibleCount === 0) {
      const noResult = document.createElement('div');
      noResult.className = 'option-item';
      noResult.textContent = 'No matching company found';
      noResult.style.cursor = 'default';
      noResult.style.color = 'var(--text-muted)';
      dropdown.appendChild(noResult);
    }
    dropdown.classList.add('show');
  }
  function selectOption(value, text) {
    hiddenSelect.value = value;
    input.value = text;
    dropdown.classList.remove('show');
    toggleBtn.classList.remove('open');
    applyIndustryPreset(value);
    renderDropdown('');
  }
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  input.addEventListener('input', () => {
    const val = input.value.trim();
    renderDropdown(val);
  });
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
      toggleBtn.classList.remove('open');
    } else {
      renderDropdown(input.value.trim());
      toggleBtn.classList.add('open');
    }
  });
  input.addEventListener('focus', () => {
    if (!dropdown.classList.contains('show')) {
      renderDropdown(input.value.trim());
      toggleBtn.classList.add('open');
    }
  });
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.classList.remove('show');
      toggleBtn.classList.remove('open');
    }
  });
  input.addEventListener('keydown', (e) => {
    if (!dropdown.classList.contains('show')) return;
    const items = Array.from(dropdown.querySelectorAll('.option-item'));
    const active = dropdown.querySelector('.option-item.active');
    let index = items.indexOf(active);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      index = (index + 1) % items.length;
      items.forEach(i => i.classList.remove('active'));
      items[index].classList.add('active');
      items[index].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      index = (index - 1 + items.length) % items.length;
      items.forEach(i => i.classList.remove('active'));
      items[index].classList.add('active');
      items[index].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      const activeItem = dropdown.querySelector('.option-item.active');
      if (activeItem) {
        e.preventDefault();
        activeItem.click();
      }
    } else if (e.key === 'Escape') {
      dropdown.classList.remove('show');
      toggleBtn.classList.remove('open');
    }
  });
  hiddenSelect.value = '';
  input.value = '';
})();
// ==================== MOBILE PREVIEW TOGGLE ====================
const mobileToggle = document.getElementById('mobilePreviewToggle');
const appContainer = document.getElementById('appContainer');
if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    appContainer.classList.toggle('preview-hidden');
    const icon = mobileToggle.querySelector('i');
    if (appContainer.classList.contains('preview-hidden')) {
      icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
  });
}
// ==================== ACHIEVEMENT EXAMPLE HANDLER ====================
function showExample(type) {
  const tooltip = document.getElementById('globalExampleTooltip');
  const btn = document.activeElement?.closest('.btn-example');
  if (!tooltip || !btn) return;
  if (tooltip.style.display === 'block' && tooltip.dataset.activeType === type) {
    tooltip.style.display = 'none';
    return;
  }
  let industry = 'general';
  const selectedIndustry = document.getElementById('industryPreset').value;
  if (selectedIndustry) {
    const parts = selectedIndustry.split('_')[0];
    if (contentExamples[type]?.[parts]) industry = parts;
  }
  const exampleText = contentExamples[type]?.[industry] || contentExamples[type]?.['general'] || 'No example available.';
  tooltip.textContent = exampleText;
  tooltip.dataset.activeType = type;
  const rect = btn.getBoundingClientRect();
  const tooltipWidth = 280;
  const tooltipHeight = 120;
  let top = rect.bottom + 6;
  let left = rect.left;
  if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - 10;
  if (top + tooltipHeight > window.innerHeight) top = rect.top - tooltipHeight - 6;
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  tooltip.style.display = 'block';
  clearTimeout(window.exampleHideTimer);
  window.exampleHideTimer = setTimeout(() => { tooltip.style.display = 'none'; }, 12000);
}
// Attach example click listener globally
document.addEventListener('click', (e) => {
  if (e.target.closest('.btn-example')) {
    const btn = e.target.closest('.btn-example');
    const type = btn.dataset.type;
    showExample(type);
  }
  // Hide tooltip if clicking outside
  if (!e.target.closest('.btn-example') && !e.target.closest('#globalExampleTooltip')) {
    const tooltip = document.getElementById('globalExampleTooltip');
    if (tooltip) tooltip.style.display = 'none';
  }
});
// ==================== READY ====================
console.log('CV Builder Pro ready');