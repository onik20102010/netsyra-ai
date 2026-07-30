/*
==================================================
CV BUILDER PRO - MAIN APPLICATION LOGIC
==================================================
*/

// ==================== GLOBAL STATE ====================
let userData = {
  passwordHash: null,
  credits: 5,
  personalInfo: {
    photo: null,
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    summary: ''
  },
  education: [],
  experience: [],
  skills: [],
  languages: [],
  certifications: [],
  projects: [],
  awards: [],
  publications: [],
  coverLetter: {
    date: '',
    manager: '',
    company: '',
    position: '',
    address: '',
    salutation: 'Dear Hiring Manager,',
    opening: 'I am writing to express my enthusiastic interest in the {position} role at {company}. With my background in {field}, I believe I can contribute meaningfully to your team.',
    body1: 'In my most recent role, I successfully {accomplishment} which resulted in {result}. I am skilled in {skill1} and {skill2}, which directly align with the requirements of this position.',
    body2: 'What particularly attracts me to {company} is your commitment to {value}. I have always admired your work in {area} and I am eager to bring my expertise to such an innovative environment.',
    closing: 'I would welcome the opportunity to discuss how my skills can benefit {company}. Thank you for your time and consideration.'
  },
  settings: { 
    template: 'classic', 
    theme: null, 
    sectionConfig: null 
  }
};

let currentUserPassword = null;
let storageKey = 'cvbuilder_default'; // Will be updated after auth

// ==================== DESIGN THEME ENGINE ====================
let userTheme = {
  pageSize: 'a4', sidebarPos: 'left', sidebarWidth: 35, pageMargin: 30,
  accent: '#6c5ce7', sidebarBg: '#f8f9fc', mainBg: '#ffffff',
  headingColor: '#1a1a1a', bodyColor: '#333333', sidebarTextColor: '#4a4a4a',
  dividerColor: '#c9a84c', skillFill: '#6c5ce7',
  headingFont: 'Inter', bodyFont: 'Inter', baseFontSize: '16px',
  lineHeight: 1.5, letterSpacing: 0.5,
  dividerStyle: 'solid', photoRadius: 50, pageRadius: 4,
  sectionGap: 30, entryGap: 15,
  skillBarHeight: 5, skillBarRadius: 3,
  bgImage: '' // new – background image as dataURL
};

function loadThemeFromSettings() {
  if (userData.settings.theme) {
    userTheme = { ...userTheme, ...userData.settings.theme };
  } else {
    // migrate old settings (if any) – this app starts fresh, but keep for safety
    if (userData.settings.accentColor) userTheme.accent = userData.settings.accentColor;
    if (userData.settings.fontStyle === 'playfair') userTheme.headingFont = 'Playfair Display';
    else if (userData.settings.fontStyle === 'poppins') userTheme.headingFont = 'Poppins';
    else if (userData.settings.fontStyle === 'jetbrains') userTheme.headingFont = 'JetBrains Mono';
    if (userData.settings.fontSize) userTheme.baseFontSize = userData.settings.fontSize;
    if (userData.settings.borderRadius) userTheme.pageRadius = parseInt(userData.settings.borderRadius) || 4;
    userData.settings.theme = userTheme;
    delete userData.settings.accentColor;
    delete userData.settings.fontStyle;
    delete userData.settings.fontSize;
    delete userData.settings.borderRadius;
    saveToStorage();
  }
}

function applyThemeToUI() {
  document.getElementById('dpPageSize').value = userTheme.pageSize;
  document.getElementById('dpSidebarPos').value = userTheme.sidebarPos;
  document.getElementById('dpSidebarWidth').value = userTheme.sidebarWidth;
  document.getElementById('dpSidebarWidthVal').textContent = userTheme.sidebarWidth + '%';
  document.getElementById('dpPageMargin').value = userTheme.pageMargin;
  document.getElementById('dpPageMarginVal').textContent = userTheme.pageMargin + 'px';
  document.getElementById('dpAccent').value = userTheme.accent;
  document.getElementById('dpSidebarBg').value = userTheme.sidebarBg;
  document.getElementById('dpMainBg').value = userTheme.mainBg;
  document.getElementById('dpHeadingColor').value = userTheme.headingColor;
  document.getElementById('dpBodyColor').value = userTheme.bodyColor;
  document.getElementById('dpSidebarTextColor').value = userTheme.sidebarTextColor;
  document.getElementById('dpDividerColor').value = userTheme.dividerColor;
  document.getElementById('dpSkillFill').value = userTheme.skillFill;
  document.getElementById('dpHeadingFont').value = userTheme.headingFont;
  document.getElementById('dpBodyFont').value = userTheme.bodyFont;
  document.getElementById('dpBaseFontSize').value = userTheme.baseFontSize;
  document.getElementById('dpLineHeight').value = userTheme.lineHeight;
  document.getElementById('dpLineHeightVal').textContent = userTheme.lineHeight;
  document.getElementById('dpLetterSpacing').value = userTheme.letterSpacing;
  document.getElementById('dpLetterSpacingVal').textContent = userTheme.letterSpacing + 'px';
  document.getElementById('dpDividerStyle').value = userTheme.dividerStyle;
  document.getElementById('dpPhotoRadius').value = userTheme.photoRadius;
  document.getElementById('dpPhotoRadiusVal').textContent = userTheme.photoRadius + '%';
  document.getElementById('dpPageRadius').value = userTheme.pageRadius;
  document.getElementById('dpPageRadiusVal').textContent = userTheme.pageRadius + 'px';
  document.getElementById('dpSectionGap').value = userTheme.sectionGap;
  document.getElementById('dpSectionGapVal').textContent = userTheme.sectionGap + 'px';
  document.getElementById('dpEntryGap').value = userTheme.entryGap;
  document.getElementById('dpEntryGapVal').textContent = userTheme.entryGap + 'px';
  document.getElementById('dpSkillBarHeight').value = userTheme.skillBarHeight;
  document.getElementById('dpSkillBarHeightVal').textContent = userTheme.skillBarHeight + 'px';
  document.getElementById('dpSkillBarRadius').value = userTheme.skillBarRadius;
  document.getElementById('dpSkillBarRadiusVal').textContent = userTheme.skillBarRadius + 'px';
  
  updateBackgroundPreview(); // new – show preview if bgImage is set
}

function updateThemeFromControls() {
  userTheme.pageSize = document.getElementById('dpPageSize').value;
  userTheme.sidebarPos = document.getElementById('dpSidebarPos').value;
  userTheme.sidebarWidth = parseInt(document.getElementById('dpSidebarWidth').value);
  userTheme.pageMargin = parseInt(document.getElementById('dpPageMargin').value);
  userTheme.accent = document.getElementById('dpAccent').value;
  userTheme.sidebarBg = document.getElementById('dpSidebarBg').value;
  userTheme.mainBg = document.getElementById('dpMainBg').value;
  userTheme.headingColor = document.getElementById('dpHeadingColor').value;
  userTheme.bodyColor = document.getElementById('dpBodyColor').value;
  userTheme.sidebarTextColor = document.getElementById('dpSidebarTextColor').value;
  userTheme.dividerColor = document.getElementById('dpDividerColor').value;
  userTheme.skillFill = document.getElementById('dpSkillFill').value;
  userTheme.headingFont = document.getElementById('dpHeadingFont').value;
  userTheme.bodyFont = document.getElementById('dpBodyFont').value;
  userTheme.baseFontSize = document.getElementById('dpBaseFontSize').value;
  userTheme.lineHeight = parseFloat(document.getElementById('dpLineHeight').value);
  userTheme.letterSpacing = parseFloat(document.getElementById('dpLetterSpacing').value);
  userTheme.dividerStyle = document.getElementById('dpDividerStyle').value;
  userTheme.photoRadius = parseInt(document.getElementById('dpPhotoRadius').value);
  userTheme.pageRadius = parseInt(document.getElementById('dpPageRadius').value);
  userTheme.sectionGap = parseInt(document.getElementById('dpSectionGap').value);
  userTheme.entryGap = parseInt(document.getElementById('dpEntryGap').value);
  userTheme.skillBarHeight = parseInt(document.getElementById('dpSkillBarHeight').value);
  userTheme.skillBarRadius = parseInt(document.getElementById('dpSkillBarRadius').value);
  userData.settings.theme = userTheme;
  applyThemeToCV();
  saveToStorage();
}

function updateDesignPanelValueLabels() {
  document.getElementById('dpSidebarWidthVal').textContent = userTheme.sidebarWidth + '%';
  document.getElementById('dpPageMarginVal').textContent = userTheme.pageMargin + 'px';
  document.getElementById('dpLineHeightVal').textContent = userTheme.lineHeight;
  document.getElementById('dpLetterSpacingVal').textContent = userTheme.letterSpacing + 'px';
  document.getElementById('dpPhotoRadiusVal').textContent = userTheme.photoRadius + '%';
  document.getElementById('dpPageRadiusVal').textContent = userTheme.pageRadius + 'px';
  document.getElementById('dpSectionGapVal').textContent = userTheme.sectionGap + 'px';
  document.getElementById('dpEntryGapVal').textContent = userTheme.entryGap + 'px';
  document.getElementById('dpSkillBarHeightVal').textContent = userTheme.skillBarHeight + 'px';
  document.getElementById('dpSkillBarRadiusVal').textContent = userTheme.skillBarRadius + 'px';
}

function applyThemeToCV() {
  const cv = document.getElementById('cvPage');
  cv.style.setProperty('--cv-accent', userTheme.accent);
  cv.style.setProperty('--cv-sidebar-bg', userTheme.sidebarBg);
  cv.style.setProperty('--cv-main-bg', userTheme.mainBg);
  cv.style.setProperty('--cv-heading-color', userTheme.headingColor);
  cv.style.setProperty('--cv-body-color', userTheme.bodyColor);
  cv.style.setProperty('--cv-sidebar-text', userTheme.sidebarTextColor);
  cv.style.setProperty('--cv-divider-color', userTheme.dividerColor);
  cv.style.setProperty('--cv-divider-style', userTheme.dividerStyle);
  cv.style.setProperty('--cv-heading-font', userTheme.headingFont);
  cv.style.setProperty('--cv-body-font', userTheme.bodyFont);
  cv.style.fontSize = userTheme.baseFontSize;
  cv.style.lineHeight = userTheme.lineHeight;
  cv.style.letterSpacing = userTheme.letterSpacing + 'px';
  cv.style.borderRadius = userTheme.pageRadius + 'px';
  
  // Apply background image if any
  cv.style.backgroundImage = userTheme.bgImage ? `url(${userTheme.bgImage})` : 'none';
  cv.style.backgroundSize = userTheme.bgImage ? 'cover' : '';
  cv.style.backgroundPosition = userTheme.bgImage ? 'center' : '';
  cv.style.backgroundRepeat = 'no-repeat';
  
  cv.style.setProperty('--cv-section-gap', userTheme.sectionGap + 'px');
  cv.style.setProperty('--cv-entry-gap', userTheme.entryGap + 'px');
  cv.style.setProperty('--cv-skill-bar-height', userTheme.skillBarHeight + 'px');
  cv.style.setProperty('--cv-skill-bar-radius', userTheme.skillBarRadius + 'px');
  cv.style.setProperty('--cv-photo-radius', userTheme.photoRadius + '%');
}

function bindDesignPanelEvents() {
  const ids = ['dpPageSize','dpSidebarPos','dpSidebarWidth','dpPageMargin',
               'dpAccent','dpSidebarBg','dpMainBg','dpHeadingColor','dpBodyColor',
               'dpSidebarTextColor','dpDividerColor','dpSkillFill',
               'dpHeadingFont','dpBodyFont','dpBaseFontSize',
               'dpLineHeight','dpLetterSpacing','dpDividerStyle',
               'dpPhotoRadius','dpPageRadius','dpSectionGap','dpEntryGap',
               'dpSkillBarHeight','dpSkillBarRadius'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      updateThemeFromControls();
      updatePreview();
      updateDesignPanelValueLabels();
    });
  });
}

function openDesignPanel() {
  document.getElementById('designPanel').classList.add('active');
  document.getElementById('designPanelOverlay').classList.add('active');
  loadThemeFromSettings();
  applyThemeToUI();
}
function closeDesignPanel() {
  document.getElementById('designPanel').classList.remove('active');
  document.getElementById('designPanelOverlay').classList.remove('active');
}

// ==================== SECTION MANAGER ====================
let sectionConfig = [
  { id:'summary', name:'Professional Summary', visible:true, custom:false },
  { id:'education', name:'Education', visible:true, custom:false },
  { id:'experience', name:'Work Experience', visible:true, custom:false },
  { id:'skills', name:'Skills', visible:true, custom:false },
  { id:'languages', name:'Languages', visible:true, custom:false },
  { id:'certifications', name:'Certifications', visible:true, custom:false },
  { id:'projects', name:'Projects', visible:true, custom:false },
  { id:'awards', name:'Awards & Honors', visible:true, custom:false },
  { id:'publications', name:'Publications', visible:true, custom:false }
];

function loadSectionConfig() {
  if (userData.settings.sectionConfig) {
    sectionConfig = userData.settings.sectionConfig;
  } else {
    userData.settings.sectionConfig = sectionConfig;
    saveToStorage();
  }
}
function saveSectionConfig() {
  userData.settings.sectionConfig = sectionConfig;
  saveToStorage();
}
function renderSectionManager() {
  const list = document.getElementById('sectionManagerList');
  list.innerHTML = '';
  sectionConfig.forEach((sec, i) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.gap = '0.5rem';
    li.style.marginBottom = '0.5rem';
    li.innerHTML = `
      <input type="checkbox" ${sec.visible ? 'checked' : ''} onchange="toggleSectionVisibility(${i}, this.checked)">
      <input type="text" value="${escapeHTML(sec.name)}" style="flex:1;" onchange="renameSection(${i}, this.value)">
      <button class="btn btn-sm btn-secondary" onclick="moveSectionUp(${i})" ${i===0?'disabled':''}><i class="fas fa-arrow-up"></i></button>
      <button class="btn btn-sm btn-secondary" onclick="moveSectionDown(${i})" ${i===sectionConfig.length-1?'disabled':''}><i class="fas fa-arrow-down"></i></button>
      ${sec.custom ? `<button class="btn btn-sm btn-danger" onclick="deleteCustomSection(${i})"><i class="fas fa-trash"></i></button>` : ''}
    `;
    list.appendChild(li);
  });
}
function toggleSectionVisibility(index, val) {
  sectionConfig[index].visible = val;
  saveSectionConfig();
  updatePreview();
}
function renameSection(index, newName) {
  sectionConfig[index].name = newName;
  saveSectionConfig();
  updatePreview();
}
function moveSectionUp(index) {
  if (index > 0) {
    [sectionConfig[index-1], sectionConfig[index]] = [sectionConfig[index], sectionConfig[index-1]];
    saveSectionConfig();
    updatePreview();
    renderSectionManager();
  }
}
function moveSectionDown(index) {
  if (index < sectionConfig.length-1) {
    [sectionConfig[index], sectionConfig[index+1]] = [sectionConfig[index+1], sectionConfig[index]];
    saveSectionConfig();
    updatePreview();
    renderSectionManager();
  }
}
function addCustomSection() {
  const name = prompt('Enter custom section name:');
  if (!name) return;
  sectionConfig.push({ id: 'custom_'+Date.now(), name, visible:true, custom:true });
  saveSectionConfig();
  updatePreview();
  renderSectionManager();
}
function deleteCustomSection(index) {
  sectionConfig.splice(index,1);
  saveSectionConfig();
  updatePreview();
  renderSectionManager();
}
function openSectionManager() {
  loadSectionConfig();
  renderSectionManager();
  document.getElementById('sectionManagerModal').classList.add('active');
}
function closeSectionManager() {
  document.getElementById('sectionManagerModal').classList.remove('active');
}

// ==================== UNDO / REDO ====================
const history = { stack:[], pointer:-1, max:50 };
function pushHistory() {
  const snapshot = JSON.stringify(userData);
  if (history.stack[history.pointer] === snapshot) return;
  history.stack = history.stack.slice(0, history.pointer+1);
  history.stack.push(snapshot);
  if (history.stack.length > history.max) history.stack.shift();
  else history.pointer++;
}
function undo() {
  if (history.pointer > 0) {
    history.pointer--;
    userData = JSON.parse(history.stack[history.pointer]);
    rebuildAllDynamicEntries();
    loadThemeFromSettings();
    applyThemeToCV();
    updatePreview();
    saveToStorage();
    showToast('Undo', 'info');
  }
}
function redo() {
  if (history.pointer < history.stack.length-1) {
    history.pointer++;
    userData = JSON.parse(history.stack[history.pointer]);
    rebuildAllDynamicEntries();
    loadThemeFromSettings();
    applyThemeToCV();
    updatePreview();
    saveToStorage();
    showToast('Redo', 'info');
  }
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
  if (e.ctrlKey && e.shiftKey && e.key === 'Z') { e.preventDefault(); redo(); }
});

// ==================== UTILITY FUNCTIONS ====================
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    return '&#039;';
  });
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function saveToStorage() {
  if (!storageKey || !currentUserPassword) return;
  localStorage.setItem(storageKey, JSON.stringify(userData));
}

function loadFromStorage() {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      userData = parsed;
      return true;
    } catch(e) {
      return false;
    }
  }
  return false;
}

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Debounced pushHistory to avoid excessive calls in updatePreview
const debouncedPushHistory = debounce(pushHistory, 800);

// ==================== AUTHENTICATION ====================
function setupAuth() {
  document.getElementById('authSubmit').addEventListener('click', () => {
    const password = document.getElementById('authPassword').value.trim();
    if (password.length < 4) {
      showToast('Password must be at least 4 characters', 'error');
      return;
    }
    currentUserPassword = password;
    storageKey = 'cvbuilder_' + btoa(password).substring(0, 16);
    
    const hasExistingData = loadFromStorage();
    if (!hasExistingData) {
      // first time: store password hash
      userData.passwordHash = btoa(password);
      saveToStorage();
    } else {
      // verify password
      if (userData.passwordHash !== btoa(password)) {
        showToast('Wrong password. Try again or refresh to create new account.', 'error');
        return;
      }
    }
    
    document.getElementById('authOverlay').style.display = 'none';
    document.getElementById('appContainer').classList.add('active');
    updateCreditsDisplay();
    initApp();
  });
}

function logout() {
  currentUserPassword = null;
  document.getElementById('authOverlay').style.display = 'flex';
  document.getElementById('appContainer').classList.remove('active');
  document.getElementById('authPassword').value = '';
  document.getElementById('authPassword').focus();
}

// ==================== DATA & DYNAMIC ENTRIES ====================
function rebuildAllDynamicEntries() {
  renderEducationEntries();
  renderExperienceEntries();
  renderSkillsEntries();
  renderLanguagesEntries();
  renderCertificationsEntries();
  renderProjectsEntries();
  renderAwardsEntries();
  renderPublicationsEntries();
}

// ---- Education ----
function addEducation() {
  userData.education.push({ degree: '', institution: '', year: '', grade: '' });
  saveToStorage();
  pushHistory();
  renderEducationEntries();
  updatePreview();
}
function removeEducation(index) {
  userData.education.splice(index, 1);
  saveToStorage();
  pushHistory();
  renderEducationEntries();
  updatePreview();
}
function renderEducationEntries() {
  const container = document.getElementById('educationEntries');
  container.innerHTML = userData.education.map((e, i) => `
    <div class="dynamic-entry">
      <button class="remove-entry" onclick="removeEducation(${i})"><i class="fas fa-times"></i></button>
      <div class="form-row">
        <div class="form-group"><label>Degree</label><input value="${escapeHTML(e.degree)}" oninput="updateEducationField(${i},'degree',this.value)"></div>
        <div class="form-group"><label>Grade / GPA</label><input value="${escapeHTML(e.grade)}" oninput="updateEducationField(${i},'grade',this.value)"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Institution</label><input value="${escapeHTML(e.institution)}" oninput="updateEducationField(${i},'institution',this.value)"></div>
        <div class="form-group"><label>Year</label><input value="${escapeHTML(e.year)}" oninput="updateEducationField(${i},'year',this.value)"></div>
      </div>
    </div>
  `).join('');
}
function updateEducationField(index, field, value) {
  userData.education[index][field] = value;
  saveToStorage();
  updatePreview();
  debouncedPushHistory();
}

// ---- Experience ----
function addExperience() {
  userData.experience.push({ jobTitle: '', company: '', startDate: '', endDate: '', description: '' });
  saveToStorage();
  pushHistory();
  renderExperienceEntries();
  updatePreview();
}
function removeExperience(index) {
  userData.experience.splice(index, 1);
  saveToStorage();
  pushHistory();
  renderExperienceEntries();
  updatePreview();
}
function renderExperienceEntries() {
  const container = document.getElementById('experienceEntries');
  container.innerHTML = userData.experience.map((e, i) => `
    <div class="dynamic-entry">
      <button class="remove-entry" onclick="removeExperience(${i})"><i class="fas fa-times"></i></button>
      <div class="form-row">
        <div class="form-group"><label>Job Title</label><input value="${escapeHTML(e.jobTitle)}" oninput="updateExperienceField(${i},'jobTitle',this.value)"></div>
        <div class="form-group"><label>Company</label><input value="${escapeHTML(e.company)}" oninput="updateExperienceField(${i},'company',this.value)"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Start Date</label><input value="${escapeHTML(e.startDate)}" oninput="updateExperienceField(${i},'startDate',this.value)"></div>
        <div class="form-group"><label>End Date</label><input value="${escapeHTML(e.endDate)}" oninput="updateExperienceField(${i},'endDate',this.value)"></div>
      </div>
      <div class="form-group"><label>Description</label><textarea oninput="updateExperienceField(${i},'description',this.value)">${escapeHTML(e.description)}</textarea></div>
    </div>
  `).join('');
}
function updateExperienceField(index, field, value) {
  userData.experience[index][field] = value;
  saveToStorage();
  updatePreview();
  debouncedPushHistory();
}

// ---- Skills ----
function addSkill() {
  userData.skills.push({ name: '', level: 'Intermediate' });
  saveToStorage();
  pushHistory();
  renderSkillsEntries();
  updatePreview();
}
function removeSkill(index) {
  userData.skills.splice(index, 1);
  saveToStorage();
  pushHistory();
  renderSkillsEntries();
  updatePreview();
}
function renderSkillsEntries() {
  const container = document.getElementById('skillsEntries');
  container.innerHTML = userData.skills.map((s, i) => `
    <div class="dynamic-entry">
      <button class="remove-entry" onclick="removeSkill(${i})"><i class="fas fa-times"></i></button>
      <div class="form-row">
        <div class="form-group"><label>Skill</label><input value="${escapeHTML(s.name)}" oninput="updateSkillField(${i},'name',this.value)"></div>
        <div class="form-group"><label>Level</label>
          <select onchange="updateSkillField(${i},'level',this.value)">
            <option value="Beginner" ${s.level==='Beginner'?'selected':''}>Beginner</option>
            <option value="Intermediate" ${s.level==='Intermediate'?'selected':''}>Intermediate</option>
            <option value="Advanced" ${s.level==='Advanced'?'selected':''}>Advanced</option>
            <option value="Expert" ${s.level==='Expert'?'selected':''}>Expert</option>
          </select>
        </div>
      </div>
    </div>
  `).join('');
}
function updateSkillField(index, field, value) {
  userData.skills[index][field] = value;
  saveToStorage();
  updatePreview();
  debouncedPushHistory();
}

// ---- Languages ----
function addLanguage() {
  userData.languages.push({ name: '', proficiency: '' });
  saveToStorage();
  pushHistory();
  renderLanguagesEntries();
  updatePreview();
}
function removeLanguage(index) {
  userData.languages.splice(index, 1);
  saveToStorage();
  pushHistory();
  renderLanguagesEntries();
  updatePreview();
}
function renderLanguagesEntries() {
  const container = document.getElementById('languagesEntries');
  container.innerHTML = userData.languages.map((l, i) => `
    <div class="dynamic-entry">
      <button class="remove-entry" onclick="removeLanguage(${i})"><i class="fas fa-times"></i></button>
      <div class="form-row">
        <div class="form-group"><label>Language</label><input value="${escapeHTML(l.name)}" oninput="updateLanguageField(${i},'name',this.value)"></div>
        <div class="form-group"><label>Proficiency</label><input value="${escapeHTML(l.proficiency)}" oninput="updateLanguageField(${i},'proficiency',this.value)"></div>
      </div>
    </div>
  `).join('');
}
function updateLanguageField(index, field, value) {
  userData.languages[index][field] = value;
  saveToStorage();
  updatePreview();
  debouncedPushHistory();
}

// ---- Certifications ----
function addCertification() {
  userData.certifications.push({ name: '', issuer: '', year: '' });
  saveToStorage();
  pushHistory();
  renderCertificationsEntries();
  updatePreview();
}
function removeCertification(index) {
  userData.certifications.splice(index, 1);
  saveToStorage();
  pushHistory();
  renderCertificationsEntries();
  updatePreview();
}
function renderCertificationsEntries() {
  const container = document.getElementById('certificationsEntries');
  container.innerHTML = userData.certifications.map((c, i) => `
    <div class="dynamic-entry">
      <button class="remove-entry" onclick="removeCertification(${i})"><i class="fas fa-times"></i></button>
      <div class="form-row">
        <div class="form-group"><label>Name</label><input value="${escapeHTML(c.name)}" oninput="updateCertificationField(${i},'name',this.value)"></div>
        <div class="form-group"><label>Issuer</label><input value="${escapeHTML(c.issuer)}" oninput="updateCertificationField(${i},'issuer',this.value)"></div>
        <div class="form-group"><label>Year</label><input value="${escapeHTML(c.year)}" oninput="updateCertificationField(${i},'year',this.value)"></div>
      </div>
    </div>
  `).join('');
}
function updateCertificationField(index, field, value) {
  userData.certifications[index][field] = value;
  saveToStorage();
  updatePreview();
  debouncedPushHistory();
}

// ---- Projects ----
function addProject() {
  userData.projects.push({ name: '', role: '', year: '', link: '', description: '' });
  saveToStorage();
  pushHistory();
  renderProjectsEntries();
  updatePreview();
}
function removeProject(index) {
  userData.projects.splice(index, 1);
  saveToStorage();
  pushHistory();
  renderProjectsEntries();
  updatePreview();
}
function renderProjectsEntries() {
  const container = document.getElementById('projectsEntries');
  container.innerHTML = userData.projects.map((p, i) => `
    <div class="dynamic-entry">
      <button class="remove-entry" onclick="removeProject(${i})"><i class="fas fa-times"></i></button>
      <div class="form-row">
        <div class="form-group"><label>Project</label><input value="${escapeHTML(p.name)}" oninput="updateProjectField(${i},'name',this.value)"></div>
        <div class="form-group"><label>Role</label><input value="${escapeHTML(p.role)}" oninput="updateProjectField(${i},'role',this.value)"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Year</label><input value="${escapeHTML(p.year)}" oninput="updateProjectField(${i},'year',this.value)"></div>
        <div class="form-group"><label>Link</label><input value="${escapeHTML(p.link)}" oninput="updateProjectField(${i},'link',this.value)"></div>
      </div>
      <div class="form-group"><label>Description</label><textarea oninput="updateProjectField(${i},'description',this.value)">${escapeHTML(p.description)}</textarea></div>
    </div>
  `).join('');
}
function updateProjectField(index, field, value) {
  userData.projects[index][field] = value;
  saveToStorage();
  updatePreview();
  debouncedPushHistory();
}

// ---- Awards ----
function addAward() {
  userData.awards.push({ title: '', issuer: '', year: '' });
  saveToStorage();
  pushHistory();
  renderAwardsEntries();
  updatePreview();
}
function removeAward(index) {
  userData.awards.splice(index, 1);
  saveToStorage();
  pushHistory();
  renderAwardsEntries();
  updatePreview();
}
function renderAwardsEntries() {
  const container = document.getElementById('awardsEntries');
  container.innerHTML = userData.awards.map((a, i) => `
    <div class="dynamic-entry">
      <button class="remove-entry" onclick="removeAward(${i})"><i class="fas fa-times"></i></button>
      <div class="form-row">
        <div class="form-group"><label>Title</label><input value="${escapeHTML(a.title)}" oninput="updateAwardField(${i},'title',this.value)"></div>
        <div class="form-group"><label>Issuer</label><input value="${escapeHTML(a.issuer)}" oninput="updateAwardField(${i},'issuer',this.value)"></div>
        <div class="form-group"><label>Year</label><input value="${escapeHTML(a.year)}" oninput="updateAwardField(${i},'year',this.value)"></div>
      </div>
    </div>
  `).join('');
}
function updateAwardField(index, field, value) {
  userData.awards[index][field] = value;
  saveToStorage();
  updatePreview();
  debouncedPushHistory();
}

// ---- Publications ----
function addPublication() {
  userData.publications.push({ title: '', publisher: '', year: '', link: '' });
  saveToStorage();
  pushHistory();
  renderPublicationsEntries();
  updatePreview();
}
function removePublication(index) {
  userData.publications.splice(index, 1);
  saveToStorage();
  pushHistory();
  renderPublicationsEntries();
  updatePreview();
}
function renderPublicationsEntries() {
  const container = document.getElementById('publicationsEntries');
  container.innerHTML = userData.publications.map((p, i) => `
    <div class="dynamic-entry">
      <button class="remove-entry" onclick="removePublication(${i})"><i class="fas fa-times"></i></button>
      <div class="form-row">
        <div class="form-group"><label>Title</label><input value="${escapeHTML(p.title)}" oninput="updatePublicationField(${i},'title',this.value)"></div>
        <div class="form-group"><label>Publisher</label><input value="${escapeHTML(p.publisher)}" oninput="updatePublicationField(${i},'publisher',this.value)"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Year</label><input value="${escapeHTML(p.year)}" oninput="updatePublicationField(${i},'year',this.value)"></div>
        <div class="form-group"><label>Link</label><input value="${escapeHTML(p.link)}" oninput="updatePublicationField(${i},'link',this.value)"></div>
      </div>
    </div>
  `).join('');
}
function updatePublicationField(index, field, value) {
  userData.publications[index][field] = value;
  saveToStorage();
  updatePreview();
  debouncedPushHistory();
}

// ---- Photo ----
function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    userData.personalInfo.photo = e.target.result;
    document.getElementById('photoPreview').src = e.target.result;
    saveToStorage();
    pushHistory();
    updatePreview();
  };
  reader.readAsDataURL(file);
}
function removePhoto() {
  userData.personalInfo.photo = null;
  document.getElementById('photoPreview').src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%23ccc\'/%3E%3Ctext x=\'50%25\' y=\'55%25\' text-anchor=\'middle\' fill=\'%23888\' font-size=\'40\'%3E%3C/text%3E%3C/svg%3E';
  document.getElementById('photoInput').value = '';
  saveToStorage();
  pushHistory();
  updatePreview();
}

// ---- Background Image (new) ----
function handleBackgroundUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast('Image must be under 2MB', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    userTheme.bgImage = e.target.result;
    userData.settings.theme = userTheme;
    saveToStorage();
    applyThemeToCV();
    updateBackgroundPreview();
    updatePreview();
    showToast('Background image updated!', 'success');
  };
  reader.readAsDataURL(file);
}

function removeBackgroundImage() {
  userTheme.bgImage = '';
  userData.settings.theme = userTheme;
  saveToStorage();
  applyThemeToCV();
  updateBackgroundPreview();
  updatePreview();
  showToast('Background removed', 'success');
}

function updateBackgroundPreview() {
  const container = document.getElementById('bgPreviewContainer');
  const img = document.getElementById('bgPreview');
  if (!container || !img) return;
  if (userTheme.bgImage) {
    img.src = userTheme.bgImage;
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

function updatePreview() {
  // Sync personal info from form fields
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
  const accent = userTheme.accent;
  const template = userData.settings.template || 'classic';

  // ATS Professional template has special rendering
  if (template === 'ats-professional') {
    renderATSProfessional();
    return;
  }

  // Modern Executive template has special rendering
  if (template === 'modern-executive') {
    renderModernExecutive();
    return;
  }

  // Minimal Professional template has special rendering
  if (template === 'minimal-professional') {
    renderMinimalProfessional();
    return;
  }

  // Corporate Blue template has special rendering
  if (template === 'corporate-blue') {
    renderCorporateBlue();
    return;
  }

  // Executive Elite template has special rendering
  if (template === 'executive-elite') {
    renderExecutiveElite();
    return;
  }

  // Tech Modern template has special rendering
  if (template === 'tech-modern') {
    renderTechModern();
    return;
  }

  // Software Engineer Pro template has special rendering
  if (template === 'software-engineer-pro') {
    renderSoftwareEngineerPro();
    return;
  }

  // Creative Designer template has special rendering
  if (template === 'creative-designer') {
    renderCreativeDesigner();
    return;
  }

  // Portfolio Showcase template has special rendering
  if (template === 'portfolio-showcase') {
    renderPortfolioShowcase();
    return;
  }

  // Startup Innovator template has special rendering
  if (template === 'startup-innovator') {
    renderStartupInnovator();
    return;
  }

  // Google Style template has special rendering
  if (template === 'google-style') {
    renderGoogleStyle();
    return;
  }

  // Microsoft Style template has special rendering
  if (template === 'microsoft-style') {
    renderMicrosoftStyle();
    return;
  }

  // Apple Minimal template has special rendering
  if (template === 'apple-minimal') {
    renderAppleMinimal();
    return;
  }

  // Research Scholar template has special rendering
  if (template === 'research-scholar') {
    renderResearchScholar();
    return;
  }

  // Medical Professional template has special rendering
  if (template === 'medical-professional') {
    renderMedicalProfessional();
    return;
  }

  // Healthcare Specialist template has special rendering
  if (template === 'healthcare-specialist') {
    renderHealthcareSpecialist();
    return;
  }

  // Legal Professional template has special rendering
  if (template === 'legal-professional') {
    renderLegalProfessional();
    return;
  }

  // Determine sidebar visibility & width
  const sidebarHidden = userTheme.sidebarPos === 'none';
  const sidebarWidth = userTheme.sidebarWidth;
  const mainWidth = 100 - sidebarWidth;

  // Build sidebar HTML
  let sidebarHTML = '';
  if (!sidebarHidden) {
    sidebarHTML = `
    <div class="cv-sidebar" style="width:${sidebarWidth}%; background:${userTheme.sidebarBg}; color:${userTheme.sidebarTextColor};">
      <div class="cv-photo-section">
        ${pi.photo ? `<img src="${escapeHTML(pi.photo)}" alt="Profile" class="cv-photo" style="border-radius:${userTheme.photoRadius}%;">` : ''}
        <h1 class="cv-name" style="font-family:${userTheme.headingFont}; color:${userTheme.headingColor};">${escapeHTML(pi.fullName || 'Your Name')}</h1>
        <div class="cv-title-role" style="color:${accent};">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
      </div>
      <div class="cv-contact-details">
        ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope cv-icon" style="color:${accent};"></i>${escapeHTML(pi.email)}</div>` : ''}
        ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone cv-icon" style="color:${accent};"></i>${escapeHTML(pi.phone)}</div>` : ''}
        ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt cv-icon" style="color:${accent};"></i>${escapeHTML(pi.location)}</div>` : ''}
        ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link cv-icon" style="color:${accent};"></i>${escapeHTML(pi.website)}</div>` : ''}
      </div>`;

    // Sidebar sections (only if visible)
    sectionConfig.forEach(sec => {
      if (!sec.visible) return;
      if (sec.id === 'skills') {
        sidebarHTML += `<div class="cv-sidebar-section">
          <h3 class="cv-sidebar-heading" style="font-family:${userTheme.headingFont}; color:${sidebarHidden ? userTheme.headingColor : userTheme.sidebarTextColor};">${sec.name}</h3>
          ${userData.skills.length === 0 ? '<p class="cv-empty">Add skills</p>' :
            userData.skills.map(s => `
              <div class="cv-skill-item">
                <div class="cv-skill-name">${escapeHTML(s.name || 'Skill')}</div>
                <div class="cv-skill-bar" style="height:${userTheme.skillBarHeight}px; border-radius:${userTheme.skillBarRadius}px; background:#e0e0e0;">
                  <div class="cv-skill-fill" style="width:${s.level==='Expert'?'95':s.level==='Advanced'?'75':s.level==='Intermediate'?'50':'25'}%; background:${userTheme.skillFill}; border-radius:${userTheme.skillBarRadius}px;"></div>
                </div>
              </div>
            `).join('')
          }
        </div>`;
      } else if (sec.id === 'languages') {
        sidebarHTML += `<div class="cv-sidebar-section">
          <h3 class="cv-sidebar-heading" style="font-family:${userTheme.headingFont}; color:${sidebarHidden ? userTheme.headingColor : userTheme.sidebarTextColor};">${sec.name}</h3>
          ${userData.languages.length === 0 ? '<p class="cv-empty">Add languages</p>' :
            userData.languages.map(l => `
              <div class="cv-language-item"><strong>${escapeHTML(l.name || 'Language')}</strong> – ${escapeHTML(l.proficiency || 'Proficiency')}</div>
            `).join('')
          }
        </div>`;
      }
    });

    sidebarHTML += `</div>`; // close cv-sidebar
  }

  // ===== FIX: Wrap main content in .cv-main =====
  let mainHTML = `<div class="cv-main" style="width:${mainWidth}%; background:${userTheme.mainBg}; padding:${userTheme.pageMargin}px;">`;

  sectionConfig.forEach(sec => {
    if (!sec.visible) return;
    if (['skills','languages'].includes(sec.id)) return; // already rendered in sidebar

    let sectionContent = '';
    const data = userData[sec.id] || [];

    if (sec.id === 'summary') {
      if (pi.summary) sectionContent = `<div class="cv-section" data-type="summary"><h2 class="cv-section-heading" style="font-family:${userTheme.headingFont}; color:${userTheme.headingColor}; border-bottom: 1px ${userTheme.dividerStyle} ${userTheme.dividerColor};">${sec.name}</h2><p class="cv-summary" style="font-family:${userTheme.bodyFont}; color:${userTheme.bodyColor}; line-height:${userTheme.lineHeight};">${escapeHTML(pi.summary)}</p></div>`;
    } else if (sec.id === 'education' && data.length) {
      sectionContent = `<div class="cv-section" data-type="education"><h2 class="cv-section-heading" style="font-family:${userTheme.headingFont}; color:${userTheme.headingColor}; border-bottom: 1px ${userTheme.dividerStyle} ${userTheme.dividerColor};">${sec.name}</h2>${data.map(e => `<div class="cv-entry"><div class="cv-entry-title">${escapeHTML(e.degree || 'Degree')}${e.grade ? ' – ' + escapeHTML(e.grade) : ''}</div><div class="cv-entry-sub">${escapeHTML(e.institution || 'Institution')} | ${escapeHTML(e.year || 'Year')}</div></div>`).join('')}</div>`;
    } else if (sec.id === 'experience' && data.length) {
      sectionContent = `<div class="cv-section" data-type="experience"><h2 class="cv-section-heading" style="font-family:${userTheme.headingFont}; color:${userTheme.headingColor}; border-bottom: 1px ${userTheme.dividerStyle} ${userTheme.dividerColor};">${sec.name}</h2>${data.map(e => `<div class="cv-entry"><div class="cv-entry-title">${escapeHTML(e.jobTitle || 'Job Title')} — ${escapeHTML(e.company || 'Company')}</div><div class="cv-entry-sub">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'End')}</div>${e.description ? `<p class="cv-entry-desc" style="font-family:${userTheme.bodyFont}; color:${userTheme.bodyColor};">${escapeHTML(e.description)}</p>` : ''}</div>`).join('')}</div>`;
    } else if (sec.id === 'certifications' && data.length) {
      sectionContent = `<div class="cv-section" data-type="certifications"><h2 class="cv-section-heading" style="font-family:${userTheme.headingFont}; color:${userTheme.headingColor}; border-bottom: 1px ${userTheme.dividerStyle} ${userTheme.dividerColor};">${sec.name}</h2>${data.map(c => `<div class="cv-entry"><div class="cv-entry-title">${escapeHTML(c.name || 'Certification')} ${c.year ? '(' + escapeHTML(c.year) + ')' : ''}</div><div class="cv-entry-sub">${escapeHTML(c.issuer || 'Issuer')}</div></div>`).join('')}</div>`;
    } else if (sec.id === 'projects' && data.length) {
      sectionContent = `<div class="cv-section" data-type="projects"><h2 class="cv-section-heading" style="font-family:${userTheme.headingFont}; color:${userTheme.headingColor}; border-bottom: 1px ${userTheme.dividerStyle} ${userTheme.dividerColor};">${sec.name}</h2>${data.map(p => `<div class="cv-entry"><div class="cv-entry-title">${escapeHTML(p.name || 'Project')} ${p.role ? '— ' + escapeHTML(p.role) : ''}</div><div class="cv-entry-sub">${escapeHTML(p.year || 'Year')}${p.link ? ' · <a href="'+escapeHTML(p.link)+'" target="_blank" style="color:'+accent+';">Link</a>' : ''}</div>${p.description ? `<p class="cv-entry-desc" style="font-family:${userTheme.bodyFont}; color:${userTheme.bodyColor};">${escapeHTML(p.description)}</p>` : ''}</div>`).join('')}</div>`;
    } else if (sec.id === 'awards' && data.length) {
      sectionContent = `<div class="cv-section" data-type="awards"><h2 class="cv-section-heading" style="font-family:${userTheme.headingFont}; color:${userTheme.headingColor}; border-bottom: 1px ${userTheme.dividerStyle} ${userTheme.dividerColor};">${sec.name}</h2>${data.map(a => `<div class="cv-entry"><div class="cv-entry-title">${escapeHTML(a.title || 'Award')}</div><div class="cv-entry-sub">${escapeHTML(a.issuer || 'Issuer')} · ${escapeHTML(a.year || 'Year')}</div></div>`).join('')}</div>`;
    } else if (sec.id === 'publications' && data.length) {
      sectionContent = `<div class="cv-section" data-type="publications"><h2 class="cv-section-heading" style="font-family:${userTheme.headingFont}; color:${userTheme.headingColor}; border-bottom: 1px ${userTheme.dividerStyle} ${userTheme.dividerColor};">${sec.name}</h2>${data.map(pub => `<div class="cv-entry"><div class="cv-entry-title">${escapeHTML(pub.title || 'Publication')}</div><div class="cv-entry-sub">${escapeHTML(pub.publisher || 'Publisher')} · ${escapeHTML(pub.year || 'Year')}${pub.link ? ' · <a href="'+escapeHTML(pub.link)+'" target="_blank" style="color:'+accent+';">View</a>' : ''}</div></div>`).join('')}</div>`;
    } else if (sec.custom) {
      sectionContent = `<div class="cv-section" data-type="${sec.id}"><h2 class="cv-section-heading" style="font-family:${userTheme.headingFont}; color:${userTheme.headingColor}; border-bottom: 1px ${userTheme.dividerStyle} ${userTheme.dividerColor};">${sec.name}</h2><p class="cv-empty">Add content for ${sec.name}</p></div>`;
    }

    if (sectionContent) mainHTML += sectionContent;
  });

  mainHTML += `</div>`; // close cv-main

  // Assemble the final HTML
  let innerHTML = '';
  if (userTheme.sidebarPos === 'right') {
    innerHTML = mainHTML + sidebarHTML;
    cvInner.style.flexDirection = 'row-reverse';
  } else {
    innerHTML = sidebarHTML + mainHTML;
    cvInner.style.flexDirection = 'row';
  }

  cvInner.innerHTML = innerHTML;

  // Apply theme
  applyThemeToCV();

  // Adjust widths (already set inline, but keep for consistency)
  const sidebarEl = cvInner.querySelector('.cv-sidebar');
  const mainEl = cvInner.querySelector('.cv-main');
  if (sidebarEl) sidebarEl.style.width = sidebarWidth + '%';
  if (mainEl) mainEl.style.width = (sidebarHidden ? '100%' : mainWidth + '%');

  // Page size
  const cvPage = document.getElementById('cvPage');
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = userTheme.pageMargin + 'px';

  // Template class
  cvPage.className = 'cv-page ' + template;

  // Make preview editable
  makePreviewEditable();
}

// ATS Professional Template Renderer
function renderATSProfessional() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build ATS Professional HTML structure
  let html = `
    <div class="cv-header">
      <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
      <div class="cv-title">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
      <div class="cv-contact-details">
        ${pi.location ? `<div class="cv-contact-item">${escapeHTML(pi.location)}</div>` : ''}
        ${pi.phone ? `<div class="cv-contact-item">${escapeHTML(pi.phone)}</div>` : ''}
        ${pi.email ? `<div class="cv-contact-item">${escapeHTML(pi.email)}</div>` : ''}
        ${pi.website ? `<div class="cv-contact-item">${escapeHTML(pi.website)}</div>` : ''}
      </div>
    </div>
  `;

  // Professional Summary
  if (pi.summary) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">PROFESSIONAL SUMMARY</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Work Experience
  if (userData.experience.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">WORK EXPERIENCE</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Company')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Job Title')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">EDUCATION</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Skills
  if (userData.skills.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">SKILLS</h2>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<span class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // Projects
  if (userData.projects.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">PROJECTS</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Project')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Certifications
  if (userData.certifications.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">CERTIFICATIONS</h2>
        ${userData.certifications.map(c => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(c.name || 'Certification')}</div>
              <div class="cv-entry-date">${escapeHTML(c.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(c.issuer || 'Issuer')}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  cvInner.innerHTML = html;
  cvInner.style.flexDirection = 'column';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page ats-professional';

  // Make preview editable
  makePreviewEditable();
}

// Modern Executive Template Renderer
function renderModernExecutive() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build sidebar HTML
  let sidebarHTML = `
    <div class="cv-sidebar">
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">CONTACT</h3>
        <div class="cv-contact-details">
          ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
          ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
          ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
          ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
        </div>
      </div>
  `;

  // Skills in sidebar
  if (userData.skills.length > 0) {
    sidebarHTML += `
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">SKILLS</h3>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<div class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</div>`).join('')}
        </div>
      </div>
    `;
  }

  // Languages in sidebar
  if (userData.languages.length > 0) {
    sidebarHTML += `
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">LANGUAGES</h3>
        ${userData.languages.map(l => `<div class="cv-language-item"><strong>${escapeHTML(l.name || 'Language')}</strong> – ${escapeHTML(l.proficiency || 'Proficiency')}</div>`).join('')}
      </div>
    `;
  }

  // Certifications in sidebar
  if (userData.certifications.length > 0) {
    sidebarHTML += `
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">CERTIFICATIONS</h3>
        ${userData.certifications.map(c => `<div class="cv-skill-item">${escapeHTML(c.name || 'Certification')} ${c.year ? '(' + escapeHTML(c.year) + ')' : ''}</div>`).join('')}
      </div>
    `;
  }

  sidebarHTML += `</div>`;

  // Build main content HTML
  let mainHTML = `
    <div class="cv-main">
      <div class="cv-header">
        <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
        <div class="cv-title">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
        <div class="cv-contact-details">
          ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
          ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
          ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
          ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
        </div>
      </div>
  `;

  // Professional Summary
  if (pi.summary) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">EXECUTIVE SUMMARY</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Work Experience
  if (userData.experience.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">PROFESSIONAL EXPERIENCE</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Company')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Job Title')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">EDUCATION</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Projects
  if (userData.projects.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">KEY PROJECTS</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Project')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Awards
  if (userData.awards.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">AWARDS & RECOGNITION</h2>
        ${userData.awards.map(a => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(a.title || 'Award')}</div>
              <div class="cv-entry-date">${escapeHTML(a.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(a.issuer || 'Issuer')}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  mainHTML += `</div>`;

  cvInner.innerHTML = sidebarHTML + mainHTML;
  cvInner.style.flexDirection = 'row';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page modern-executive';

  // Make preview editable
  makePreviewEditable();
}

// Minimal Professional Template Renderer
function renderMinimalProfessional() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build HTML structure
  let html = `
    <div class="cv-header">
      <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
      <div class="cv-title">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
      <div class="cv-contact-details">
        ${pi.location ? `<div class="cv-contact-item">${escapeHTML(pi.location)}</div>` : ''}
        ${pi.email ? `<div class="cv-contact-item">${escapeHTML(pi.email)}</div>` : ''}
        ${pi.phone ? `<div class="cv-contact-item">${escapeHTML(pi.phone)}</div>` : ''}
        ${pi.website ? `<div class="cv-contact-item">${escapeHTML(pi.website)}</div>` : ''}
      </div>
    </div>
  `;

  // About section
  if (pi.summary) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">About</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Work Experience
  if (userData.experience.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Experience</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.jobTitle || 'Job Title')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.company || 'Company')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Education</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.degree || 'Degree')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.institution || 'Institution')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Skills
  if (userData.skills.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Skills</h2>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<span class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // Projects
  if (userData.projects.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Projects</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Project')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Languages
  if (userData.languages.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Languages</h2>
        ${userData.languages.map(l => `<div class="cv-language-item"><strong>${escapeHTML(l.name || 'Language')}</strong> – ${escapeHTML(l.proficiency || 'Proficiency')}</div>`).join('')}
      </div>
    `;
  }

  cvInner.innerHTML = html;
  cvInner.style.flexDirection = 'column';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page minimal-professional';

  // Make preview editable
  makePreviewEditable();
}

// Corporate Blue Template Renderer
function renderCorporateBlue() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build HTML structure
  let html = `
    <div class="cv-header">
      <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
      <div class="cv-title">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
      <div class="cv-contact-details">
        ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
        ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
        ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
        ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
      </div>
    </div>
  `;

  // Professional Summary
  if (pi.summary) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">PROFESSIONAL SUMMARY</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Work Experience
  if (userData.experience.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">WORK EXPERIENCE</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Company')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Job Title')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">EDUCATION</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Skills
  if (userData.skills.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">SKILLS</h2>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<span class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // Projects
  if (userData.projects.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">PROJECTS</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Project')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Certifications
  if (userData.certifications.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">CERTIFICATIONS</h2>
        ${userData.certifications.map(c => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(c.name || 'Certification')}</div>
              <div class="cv-entry-date">${escapeHTML(c.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(c.issuer || 'Issuer')}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  cvInner.innerHTML = html;
  cvInner.style.flexDirection = 'column';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page corporate-blue';

  // Make preview editable
  makePreviewEditable();
}

// Executive Elite Template Renderer
function renderExecutiveElite() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build sidebar HTML
  let sidebarHTML = `
    <div class="cv-sidebar">
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">CONTACT</h3>
        <div class="cv-contact-details">
          ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
          ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
          ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
          ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
        </div>
      </div>
  `;

  // Core Skills in sidebar
  if (userData.skills.length > 0) {
    sidebarHTML += `
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">CORE COMPETENCIES</h3>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<div class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</div>`).join('')}
        </div>
      </div>
    `;
  }

  // Languages in sidebar
  if (userData.languages.length > 0) {
    sidebarHTML += `
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">LANGUAGES</h3>
        ${userData.languages.map(l => `<div class="cv-language-item"><strong>${escapeHTML(l.name || 'Language')}</strong> – ${escapeHTML(l.proficiency || 'Proficiency')}</div>`).join('')}
      </div>
    `;
  }

  // Certifications in sidebar
  if (userData.certifications.length > 0) {
    sidebarHTML += `
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">CERTIFICATIONS</h3>
        ${userData.certifications.map(c => `<div class="cv-skill-item">${escapeHTML(c.name || 'Certification')} ${c.year ? '(' + escapeHTML(c.year) + ')' : ''}</div>`).join('')}
      </div>
    `;
  }

  sidebarHTML += `</div>`;

  // Build main content HTML
  let mainHTML = `
    <div class="cv-main">
      <div class="cv-header">
        <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
        <div class="cv-title">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
        <div class="cv-contact-details">
          ${pi.location ? `<div class="cv-contact-item">${escapeHTML(pi.location)}</div>` : ''}
          ${pi.phone ? `<div class="cv-contact-item">${escapeHTML(pi.phone)}</div>` : ''}
          ${pi.email ? `<div class="cv-contact-item">${escapeHTML(pi.email)}</div>` : ''}
          ${pi.website ? `<div class="cv-contact-item">${escapeHTML(pi.website)}</div>` : ''}
        </div>
      </div>
  `;

  // Executive Profile
  if (pi.summary) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">EXECUTIVE PROFILE</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Work Experience
  if (userData.experience.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">PROFESSIONAL EXPERIENCE</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Company')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Job Title')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">EDUCATION</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Awards
  if (userData.awards.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">AWARDS & RECOGNITION</h2>
        ${userData.awards.map(a => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(a.title || 'Award')}</div>
              <div class="cv-entry-date">${escapeHTML(a.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(a.issuer || 'Issuer')}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Projects
  if (userData.projects.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">STRATEGIC INITIATIVES</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Project')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  mainHTML += `</div>`;

  cvInner.innerHTML = sidebarHTML + mainHTML;
  cvInner.style.flexDirection = 'row';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page executive-elite';

  // Make preview editable
  makePreviewEditable();
}

// Tech Modern Template Renderer
function renderTechModern() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build sidebar HTML
  let sidebarHTML = `
    <div class="cv-sidebar">
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">Skills</h3>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<div class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</div>`).join('')}
        </div>
      </div>
  `;

  // Languages in sidebar
  if (userData.languages.length > 0) {
    sidebarHTML += `
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">Languages</h3>
        ${userData.languages.map(l => `<div class="cv-language-item"><strong>${escapeHTML(l.name || 'Language')}</strong> – ${escapeHTML(l.proficiency || 'Proficiency')}</div>`).join('')}
      </div>
    `;
  }

  // Certifications in sidebar
  if (userData.certifications.length > 0) {
    sidebarHTML += `
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">Certifications</h3>
        ${userData.certifications.map(c => `<div class="cv-skill-item">${escapeHTML(c.name || 'Certification')} ${c.year ? '(' + escapeHTML(c.year) + ')' : ''}</div>`).join('')}
      </div>
    `;
  }

  sidebarHTML += `</div>`;

  // Build main content HTML
  let mainHTML = `
    <div class="cv-main">
      <div class="cv-header">
        <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
        <div class="cv-title">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
        <div class="cv-contact-details">
          ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
          ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
          ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
          ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
        </div>
      </div>
  `;

  // Professional Summary
  if (pi.summary) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Professional Summary</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Work Experience
  if (userData.experience.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Experience</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Company')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Job Title')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Projects
  if (userData.projects.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Projects</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Project')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Education</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  mainHTML += `</div>`;

  cvInner.innerHTML = sidebarHTML + mainHTML;
  cvInner.style.flexDirection = 'row';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page tech-modern';

  // Make preview editable
  makePreviewEditable();
}

// Software Engineer Pro Template Renderer
function renderSoftwareEngineerPro() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build sidebar HTML
  let sidebarHTML = `
    <div class="cv-sidebar">
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">TECH STACK</h3>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<div class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</div>`).join('')}
        </div>
      </div>
  `;

  // Languages in sidebar
  if (userData.languages.length > 0) {
    sidebarHTML += `
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">LANGUAGES</h3>
        ${userData.languages.map(l => `<div class="cv-language-item"><strong>${escapeHTML(l.name || 'Language')}</strong> – ${escapeHTML(l.proficiency || 'Proficiency')}</div>`).join('')}
      </div>
    `;
  }

  // Certifications in sidebar
  if (userData.certifications.length > 0) {
    sidebarHTML += `
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">CERTIFICATIONS</h3>
        ${userData.certifications.map(c => `<div class="cv-skill-item">${escapeHTML(c.name || 'Certification')} ${c.year ? '(' + escapeHTML(c.year) + ')' : ''}</div>`).join('')}
      </div>
    `;
  }

  sidebarHTML += `</div>`;

  // Build main content HTML
  let mainHTML = `
    <div class="cv-main">
      <div class="cv-header">
        <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
        <div class="cv-title">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
        <div class="cv-contact-details">
          ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
          ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
          ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
          ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
        </div>
      </div>
  `;

  // Professional Summary
  if (pi.summary) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">PROFESSIONAL SUMMARY</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Work Experience
  if (userData.experience.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">EXPERIENCE</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Company')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Job Title')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Projects
  if (userData.projects.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">PROJECTS</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Project')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">EDUCATION</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  mainHTML += `</div>`;

  cvInner.innerHTML = sidebarHTML + mainHTML;
  cvInner.style.flexDirection = 'row';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page software-engineer-pro';

  // Make preview editable
  makePreviewEditable();
}

// Creative Designer Template Renderer
function renderCreativeDesigner() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build sidebar HTML
  let sidebarHTML = `
    <div class="cv-sidebar">
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">Skills</h3>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<div class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</div>`).join('')}
        </div>
      </div>
  `;

  // Languages in sidebar
  if (userData.languages.length > 0) {
    sidebarHTML += `
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">Languages</h3>
        ${userData.languages.map(l => `<div class="cv-language-item"><strong>${escapeHTML(l.name || 'Language')}</strong> – ${escapeHTML(l.proficiency || 'Proficiency')}</div>`).join('')}
      </div>
    `;
  }

  // Awards in sidebar
  if (userData.awards.length > 0) {
    sidebarHTML += `
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">Awards</h3>
        ${userData.awards.map(a => `<div class="cv-skill-item">${escapeHTML(a.title || 'Award')} ${a.year ? '(' + escapeHTML(a.year) + ')' : ''}</div>`).join('')}
      </div>
    `;
  }

  sidebarHTML += `</div>`;

  // Build main content HTML
  let mainHTML = `
    <div class="cv-main">
      <div class="cv-header">
        <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
        <div class="cv-title">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
        <div class="cv-contact-details">
          ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
          ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
          ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
          ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
        </div>
      </div>
  `;

  // About Me
  if (pi.summary) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">About Me</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Work Experience
  if (userData.experience.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Experience</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Company')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Job Title')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Featured Projects
  if (userData.projects.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Featured Projects</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Project')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Education</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  mainHTML += `</div>`;

  cvInner.innerHTML = sidebarHTML + mainHTML;
  cvInner.style.flexDirection = 'row';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page creative-designer';

  // Make preview editable
  makePreviewEditable();
}

// Portfolio Showcase Template Renderer
function renderPortfolioShowcase() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build HTML structure
  let html = `
    <div class="cv-header">
      <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
      <div class="cv-title">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
      <div class="cv-contact-details">
        ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
        ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
        ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
        ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
      </div>
    </div>
  `;

  // About Me
  if (pi.summary) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">About Me</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Featured Projects (prominent section)
  if (userData.projects.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Featured Projects</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Project')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Work Experience
  if (userData.experience.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Experience</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Company')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Job Title')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Skills
  if (userData.skills.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Skills</h2>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<span class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Education</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  cvInner.innerHTML = html;
  cvInner.style.flexDirection = 'column';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page portfolio-showcase';

  // Make preview editable
  makePreviewEditable();
}

// Startup Innovator Template Renderer
function renderStartupInnovator() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build sidebar HTML
  let sidebarHTML = `
    <div class="cv-sidebar">
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">Skills</h3>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<div class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</div>`).join('')}
        </div>
      </div>
  `;

  // Languages in sidebar
  if (userData.languages.length > 0) {
    sidebarHTML += `
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">Languages</h3>
        ${userData.languages.map(l => `<div class="cv-language-item"><strong>${escapeHTML(l.name || 'Language')}</strong> – ${escapeHTML(l.proficiency || 'Proficiency')}</div>`).join('')}
      </div>
    `;
  }

  // Education in sidebar
  if (userData.education.length > 0) {
    sidebarHTML += `
      <div class="cv-sidebar-section">
        <h3 class="cv-sidebar-heading">Education</h3>
        ${userData.education.map(e => `<div class="cv-skill-item">${escapeHTML(e.institution || 'Institution')} ${e.year ? '(' + escapeHTML(e.year) + ')' : ''}</div>`).join('')}
      </div>
    `;
  }

  sidebarHTML += `</div>`;

  // Build main content HTML
  let mainHTML = `
    <div class="cv-main">
      <div class="cv-header">
        <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
        <div class="cv-title">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
        <div class="cv-contact-details">
          ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
          ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
          ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
          ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
        </div>
      </div>
  `;

  // About Me
  if (pi.summary) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">About Me</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Work Experience
  if (userData.experience.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Experience</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Company')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Job Title')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Featured Products
  if (userData.projects.length > 0) {
    mainHTML += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Featured Products</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Product')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  mainHTML += `</div>`;

  cvInner.innerHTML = sidebarHTML + mainHTML;
  cvInner.style.flexDirection = 'row';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page startup-innovator';

  // Make preview editable
  makePreviewEditable();
}

// Google Style Template Renderer
function renderGoogleStyle() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build HTML structure
  let html = `
    <div class="cv-header">
      <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
      <div class="cv-title">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
      <div class="cv-contact-details">
        ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
        ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
        ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
        ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
      </div>
    </div>
  `;

  // About
  if (pi.summary) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">About</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Work Experience
  if (userData.experience.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Experience</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Company')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Job Title')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Projects
  if (userData.projects.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Projects</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Project')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Skills
  if (userData.skills.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Skills</h2>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<span class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Education</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  cvInner.innerHTML = html;
  cvInner.style.flexDirection = 'column';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page google-style';

  // Make preview editable
  makePreviewEditable();
}

// Microsoft Style Template Renderer
function renderMicrosoftStyle() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build HTML structure
  let html = `
    <div class="cv-header">
      <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
      <div class="cv-title">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
      <div class="cv-contact-details">
        ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
        ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
        ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
        ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
      </div>
    </div>
  `;

  // Professional Summary
  if (pi.summary) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">PROFESSIONAL SUMMARY</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Work Experience
  if (userData.experience.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">EXPERIENCE</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Company')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Job Title')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Projects
  if (userData.projects.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">PROJECTS</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Project')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Skills
  if (userData.skills.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">SKILLS</h2>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<span class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">EDUCATION</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  cvInner.innerHTML = html;
  cvInner.style.flexDirection = 'column';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page microsoft-style';

  // Make preview editable
  makePreviewEditable();
}

// Apple Minimal Template Renderer
function renderAppleMinimal() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build HTML structure
  let html = `
    <div class="cv-header">
      <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
      <div class="cv-title">${escapeHTML(pi.jobTitle || 'Job Title')}</div>
      <div class="cv-contact-details">
        ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
        ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
        ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
        ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
      </div>
    </div>
  `;

  // About
  if (pi.summary) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">About</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Work Experience
  if (userData.experience.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Experience</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Company')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Job Title')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Projects
  if (userData.projects.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Projects</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Project')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Skills
  if (userData.skills.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Skills</h2>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<span class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Education</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  cvInner.innerHTML = html;
  cvInner.style.flexDirection = 'column';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page apple-minimal';

  // Make preview editable
  makePreviewEditable();
}

// Research Scholar Template Renderer
function renderResearchScholar() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build HTML structure
  let html = `
    <div class="cv-header">
      <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
      <div class="cv-title">${escapeHTML(pi.jobTitle || 'Research Scholar')}</div>
      <div class="cv-contact-details">
        ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
        ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
        ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
        ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
      </div>
    </div>
  `;

  // Research Profile
  if (pi.summary) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Research Profile</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Education</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Research Experience
  if (userData.experience.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Research Experience</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Position')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Publications (using projects as publications)
  if (userData.projects.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Publications</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Publication')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Technical Skills
  if (userData.skills.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Technical Skills</h2>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<span class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // Awards
  if (userData.awards.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Awards & Grants</h2>
        ${userData.awards.map(a => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(a.title || 'Award')}</div>
              <div class="cv-entry-date">${escapeHTML(a.year || 'Year')}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  cvInner.innerHTML = html;
  cvInner.style.flexDirection = 'column';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page research-scholar';

  // Make preview editable
  makePreviewEditable();
}

// Medical Professional Template Renderer
function renderMedicalProfessional() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build HTML structure
  let html = `
    <div class="cv-header">
      <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
      <div class="cv-title">${escapeHTML(pi.jobTitle || 'Medical Professional')}</div>
      <div class="cv-contact-details">
        ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
        ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
        ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
        ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
      </div>
    </div>
  `;

  // Professional Profile
  if (pi.summary) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Professional Profile</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Clinical Experience
  if (userData.experience.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Clinical Experience</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Position')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Education & Training
  if (userData.education.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Education & Training</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Clinical Skills
  if (userData.skills.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Clinical Skills</h2>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<span class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // Research & Publications (using projects)
  if (userData.projects.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Research & Publications</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Publication')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Awards
  if (userData.awards.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Awards & Honors</h2>
        ${userData.awards.map(a => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(a.title || 'Award')}</div>
              <div class="cv-entry-date">${escapeHTML(a.year || 'Year')}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  cvInner.innerHTML = html;
  cvInner.style.flexDirection = 'column';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page medical-professional';

  // Make preview editable
  makePreviewEditable();
}

// Healthcare Specialist Template Renderer
function renderHealthcareSpecialist() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build HTML structure
  let html = `
    <div class="cv-header">
      <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
      <div class="cv-title">${escapeHTML(pi.jobTitle || 'Healthcare Specialist')}</div>
      <div class="cv-contact-details">
        ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
        ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
        ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
        ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
      </div>
    </div>
  `;

  // Professional Summary
  if (pi.summary) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Professional Summary</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Core Competencies (using skills)
  if (userData.skills.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Core Competencies</h2>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<span class="cv-skill-item">${escapeHTML(s.name || 'Skill')}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // Professional Experience
  if (userData.experience.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Professional Experience</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Position')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Education</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Certifications & Licenses (using awards)
  if (userData.awards.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Certifications & Licenses</h2>
        ${userData.awards.map(a => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(a.title || 'Certification')}</div>
              <div class="cv-entry-date">${escapeHTML(a.year || 'Year')}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Technical Skills (using projects as additional skills/projects)
  if (userData.projects.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Technical Skills</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Skill/Project')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  cvInner.innerHTML = html;
  cvInner.style.flexDirection = 'column';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page healthcare-specialist';

  // Make preview editable
  makePreviewEditable();
}

// Legal Professional Template Renderer
function renderLegalProfessional() {
  const cvInner = document.getElementById('cvInner');
  const cvPage = document.getElementById('cvPage');
  const pi = userData.personalInfo;

  // Build HTML structure
  let html = `
    <div class="cv-header">
      <h1 class="cv-name">${escapeHTML(pi.fullName || 'Your Name')}</h1>
      <div class="cv-title">${escapeHTML(pi.jobTitle || 'Legal Professional')}</div>
      <div class="cv-contact-details">
        ${pi.email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i>${escapeHTML(pi.email)}</div>` : ''}
        ${pi.phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i>${escapeHTML(pi.phone)}</div>` : ''}
        ${pi.website ? `<div class="cv-contact-item"><i class="fas fa-link"></i>${escapeHTML(pi.website)}</div>` : ''}
        ${pi.location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHTML(pi.location)}</div>` : ''}
      </div>
    </div>
  `;

  // Professional Profile
  if (pi.summary) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Professional Profile</h2>
        <div class="cv-summary">${escapeHTML(pi.summary)}</div>
      </div>
    `;
  }

  // Legal Experience
  if (userData.experience.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Legal Experience</h2>
        ${userData.experience.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.company || 'Firm/Organization')}</div>
              <div class="cv-entry-date">${escapeHTML(e.startDate || 'Start')} – ${escapeHTML(e.endDate || 'Present')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.jobTitle || 'Position')}</div>
            ${e.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${e.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Education
  if (userData.education.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Education</h2>
        ${userData.education.map(e => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(e.institution || 'Institution')}</div>
              <div class="cv-entry-date">${escapeHTML(e.year || 'Year')}</div>
            </div>
            <div class="cv-entry-subtitle">${escapeHTML(e.degree || 'Degree')} ${e.grade ? '– ' + escapeHTML(e.grade) : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Bar Admissions & Certifications (using awards)
  if (userData.awards.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Bar Admissions & Certifications</h2>
        ${userData.awards.map(a => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(a.title || 'Certification')}</div>
              <div class="cv-entry-date">${escapeHTML(a.year || 'Year')}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Practice Areas (using skills)
  if (userData.skills.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Practice Areas</h2>
        <div class="cv-skills-list">
          ${userData.skills.map(s => `<span class="cv-skill-item">${escapeHTML(s.name || 'Practice Area')}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // Publications & Professional Memberships (using projects)
  if (userData.projects.length > 0) {
    html += `
      <div class="cv-section">
        <h2 class="cv-section-heading">Publications & Professional Memberships</h2>
        ${userData.projects.map(p => `
          <div class="cv-entry">
            <div class="cv-entry-header">
              <div class="cv-entry-title">${escapeHTML(p.name || 'Publication/Membership')}</div>
              <div class="cv-entry-date">${escapeHTML(p.year || 'Year')}</div>
            </div>
            ${p.role ? `<div class="cv-entry-subtitle">${escapeHTML(p.role)}</div>` : ''}
            ${p.description ? `
              <div class="cv-entry-description">
                <ul>
                  ${p.description.split('\n').filter(line => line.trim()).map(line => `<li>${escapeHTML(line)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  cvInner.innerHTML = html;
  cvInner.style.flexDirection = 'column';

  // Page size
  if (userTheme.pageSize === 'letter') {
    cvPage.style.width = '216mm';
    cvPage.style.minHeight = '279mm';
  } else {
    cvPage.style.width = '210mm';
    cvPage.style.minHeight = '297mm';
  }
  cvPage.style.padding = '0';

  // Template class
  cvPage.className = 'cv-page legal-professional';

  // Make preview editable
  makePreviewEditable();
}

function makePreviewEditable() {
  document.querySelectorAll('.cv-name, .cv-title-role, .cv-summary, .cv-entry-title, .cv-entry-sub, .cv-entry-desc').forEach(el => {
    el.setAttribute('contenteditable', 'true');
    el.addEventListener('input', debounce(() => {
      pushHistory();
      saveToStorage();
    }, 400));
  });
}

// ==================== EXPORT ====================
function exportPDF() {
  if (userData.credits <= 0) {
    showToast('No credits left! Purchase more.', 'error');
    openPaymentModal();
    return;
  }
  userData.credits--;
  updateCreditsDisplay();
  saveToStorage();
  window.print();
}

function exportCoverLetter() {
  alert('Cover letter export is a separate PDF. Use browser print or Ctrl+P and select the cover letter section.');
}

function exportPNG() {
  if (typeof html2canvas === 'undefined') {
    showToast('PNG library not loaded. Please check your internet connection.', 'error');
    return;
  }
  const cv = document.getElementById('cvPage');
  html2canvas(cv, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'CV_' + (userData.personalInfo.fullName || 'export') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('PNG exported!', 'success');
  }).catch(err => {
    showToast('Export failed: ' + err, 'error');
  });
}

// ==================== TEMPLATE SWITCHING ====================
function setTemplate(templateId) {
  userData.settings.template = templateId;
  saveToStorage();
  updatePreview();

  // Update dropdown selected value
  const templateSelect = document.getElementById('templateSelect');
  if (templateSelect) {
    templateSelect.value = templateId;
  }

  // Update active button state (for backward compatibility)
  document.querySelectorAll('.template-switcher .btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.template === templateId) btn.classList.add('active');
  });
}

// ==================== PAYMENT & CREDITS ====================
function openPaymentModal() {
  document.getElementById('paymentModal').classList.add('active');
}
function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('active');
}
function simulatePayment(method) {
  userData.credits += 5;
  updateCreditsDisplay();
  saveToStorage();
  closePaymentModal();
  showToast(`Added 5 credits via ${method}`, 'success');
}
function updateCreditsDisplay() {
  document.getElementById('creditCount').textContent = userData.credits;
}

// ==================== SECTION NAVIGATION (TABS) ====================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.section-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.section-nav button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sectionId = btn.dataset.section;
      document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
      document.getElementById('section-' + sectionId).classList.add('active');
    });
  });

  // Mobile preview toggle
  var previewToggleBtn = document.getElementById('mobilePreviewToggle');
  if (previewToggleBtn) {
    previewToggleBtn.addEventListener('click', function() {
      var appContainer = document.getElementById('appContainer');
      appContainer.classList.toggle('preview-mode');
      var icon = previewToggleBtn.querySelector('i');
      if (appContainer.classList.contains('preview-mode')) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-pen');
      } else {
        icon.classList.remove('fa-pen');
        icon.classList.add('fa-eye');
      }
    });
  }
});

// ==================== INDUSTRY PRESET DROPDOWN ====================
(function() {
  const wrapper = document.getElementById('industrySearchWrapper');
  const input = document.getElementById('industrySearchInput');
  const dropdown = document.getElementById('searchDropdown');
  const toggleBtn = document.getElementById('toggleDropdownBtn');
  const hiddenInput = document.getElementById('industryPreset');

  // Industry options with presets (value / text pairs for the new Landscaping group)
  const industryOptions = [
    { label: 'Technology', options: ['Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer', 'DevOps Engineer', 'AI Specialist'] },
    { label: 'Business', options: ['Marketing Manager', 'Financial Analyst', 'HR Specialist', 'Consultant', 'Sales Executive'] },
    { label: 'Creative', options: ['Graphic Designer', 'Content Writer', 'Video Editor', 'Photographer'] },
    { label: 'Engineering', options: ['Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer'] },
    { label: '🌿 Landscaping & Garden Design', options: [
      { value: 'landscaping', text: 'Landscaping & Garden Design (General)' },
      { value: 'landscaping_horticulture', text: 'Horticulture Specialist' },
      { value: 'landscaping_design', text: 'Garden Designer' },
      { value: 'landscaping_maintenance', text: 'Landscape Maintenance' },
      { value: 'landscaping_contractor', text: 'Landscape Contractor' }
    ]}
  ];

  function buildDropdown(filter = '') {
    dropdown.innerHTML = '';
    industryOptions.forEach(group => {
      const groupLabel = document.createElement('div');
      groupLabel.className = 'optgroup-label';
      groupLabel.textContent = group.label;
      dropdown.appendChild(groupLabel);

      group.options.forEach(opt => {
        const text = typeof opt === 'string' ? opt : opt.text;
        const value = typeof opt === 'string' ? opt.toLowerCase().replace(/\s+/g, '_') : opt.value;
        if (filter && !text.toLowerCase().includes(filter.toLowerCase())) return;
        const item = document.createElement('div');
        item.className = 'option-item';
        item.textContent = text;
        item.dataset.value = value;
        item.addEventListener('click', () => {
          input.value = text;
          hiddenInput.value = value;
          dropdown.classList.remove('show');
          toggleBtn.classList.remove('open');
          applyIndustryPreset(value);
        });
        dropdown.appendChild(item);
      });
    });
  }

  input.addEventListener('focus', () => {
    buildDropdown(input.value);
    dropdown.classList.add('show');
    toggleBtn.classList.add('open');
  });
  input.addEventListener('input', () => {
    buildDropdown(input.value);
    dropdown.classList.add('show');
    toggleBtn.classList.add('open');
  });
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
    toggleBtn.classList.toggle('open');
    if (dropdown.classList.contains('show')) buildDropdown(input.value);
  });
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.classList.remove('show');
      toggleBtn.classList.remove('open');
    }
  });
})();

// ==================== INDUSTRY PRESETS ====================
const industryPresets = {
  // --- Landscaping & Garden Design ---
  'landscaping': { accent: '#6b8f5e', summary: 'Creative landscaper with a deep passion for designing sustainable outdoor spaces. Skilled in plant selection, hardscaping, and client consultation for residential and commercial projects.' },
  'landscaping_horticulture': { accent: '#6b8f5e', summary: 'Horticulture expert specializing in plant health, soil management, and botanical garden design. Committed to eco‑friendly landscaping solutions.' },
  'landscaping_design': { accent: '#6b8f5e', summary: 'Garden designer with an eye for aesthetic harmony, blending native plants with modern hardscape elements to create breathtaking outdoor living areas.' },
  'landscaping_maintenance': { accent: '#6b8f5e', summary: 'Landscape maintenance professional with expertise in pruning, irrigation systems, and seasonal planting. Focused on preserving the beauty and health of established gardens.' },
  'landscaping_contractor': { accent: '#6b8f5e', summary: 'Licensed landscape contractor experienced in large‑scale installation, stonework, and water feature construction. Delivers projects on time and within budget.' }
};

function applyIndustryPreset(industry) {
  const preset = industryPresets[industry];
  if (!preset) return;

  // Update theme accent
  userTheme.accent = preset.accent;
  userData.settings.theme = userTheme;
  document.getElementById('dpAccent').value = preset.accent; // sync design panel if open
  applyThemeToCV();

  // Update summary
  userData.personalInfo.summary = preset.summary;
  document.getElementById('summary').value = preset.summary;
  saveToStorage();

  // Auto‑switch to nature template for landscaping
  if (industry.startsWith('landscaping')) {
    setTemplate('nature');
  }

  updatePreview();
  showToast(`Applied ${industry} preset`, 'success');
}

// ==================== COVER LETTER UPDATE ====================
function updateCoverLetter() {
  userData.coverLetter.date = document.getElementById('clDate').value;
  userData.coverLetter.manager = document.getElementById('clManager').value;
  userData.coverLetter.company = document.getElementById('clCompany').value;
  userData.coverLetter.position = document.getElementById('clPosition').value;
  userData.coverLetter.address = document.getElementById('clAddress').value;
  userData.coverLetter.salutation = document.getElementById('clSalutation').value;
  userData.coverLetter.opening = document.getElementById('clOpening').value;
  userData.coverLetter.body1 = document.getElementById('clBody1').value;
  userData.coverLetter.body2 = document.getElementById('clBody2').value;
  userData.coverLetter.closing = document.getElementById('clClosing').value;
  saveToStorage();
}

// ==================== JOB MATCHER ====================
function matchJobDescription() {
  const jd = document.getElementById('jdText').value;
  if (!jd.trim()) {
    document.getElementById('matchResult').innerHTML = 'Paste a job description first.';
    return;
  }
  // Simple keyword extraction from user's data
  const keywords = [];
  if (userData.personalInfo.summary) keywords.push(...userData.personalInfo.summary.split(' '));
  userData.skills.forEach(s => keywords.push(s.name));
  const jdWords = jd.toLowerCase().split(/\s+/);
  const matches = keywords.filter(k => jdWords.includes(k.toLowerCase()));
  const uniqueMatches = [...new Set(matches)];
  document.getElementById('matchResult').innerHTML = `<strong>Matched Keywords:</strong> ${uniqueMatches.length ? uniqueMatches.join(', ') : 'None'}`;
}

// ==================== INITIALIZATION ====================
function initApp() {
  loadThemeFromSettings();
  applyThemeToUI();
  bindDesignPanelEvents();
  loadSectionConfig();

  // Set template dropdown value
  const templateSelect = document.getElementById('templateSelect');
  if (templateSelect && userData.settings.template) {
    templateSelect.value = userData.settings.template;
  }

  // Sync personal info form with data
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

  // Cover letter fields
  const cl = userData.coverLetter;
  document.getElementById('clDate').value = cl.date || '';
  document.getElementById('clManager').value = cl.manager || '';
  document.getElementById('clCompany').value = cl.company || '';
  document.getElementById('clPosition').value = cl.position || '';
  document.getElementById('clAddress').value = cl.address || '';
  document.getElementById('clSalutation').value = cl.salutation || '';
  document.getElementById('clOpening').value = cl.opening || '';
  document.getElementById('clBody1').value = cl.body1 || '';
  document.getElementById('clBody2').value = cl.body2 || '';
  document.getElementById('clClosing').value = cl.closing || '';

  // Render all dynamic entries
  rebuildAllDynamicEntries();

  // Apply template
  setTemplate(userData.settings.template || 'classic');

  // Initial preview
  updatePreview();

  // Push initial history
  setTimeout(() => pushHistory(), 500);

  // Credits display
  updateCreditsDisplay();
}

// Start auth
setupAuth();