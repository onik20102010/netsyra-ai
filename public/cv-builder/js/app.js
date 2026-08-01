/* ==================================================
   CV BUILDER PRO — Main Controller
   ================================================== */

// ==================== STATE ====================
let cvData = loadFromStorage() || {
  personal: {},
  summary: {},
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  awards: [],
  volunteer: [],
  internships: [],
  publications: [],
  conferences: [],
  references: [],
  interests: [],
  social: {},
  custom: []
};

let currentPageIndex = 0;
let selectedTemplate = null;
let isPreviewMode = false;
let currentMode = 'preview'; // 'preview' | 'custom' | 'selfmade'

// ==================== PAGE ORDER ====================
const pageOrder = [
  'personal', 'summary', 'experience', 'education', 'skills',
  'projects', 'certifications', 'languages', 'awards',
  'volunteer', 'internships', 'publications', 'conferences',
  'references', 'interests', 'social', 'custom'
];

// ==================== STORAGE ====================
function loadFromStorage() {
  try {
    const raw = localStorage.getItem('cvbuilder_pro_data');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveToStorage() {
  localStorage.setItem('cvbuilder_pro_data', JSON.stringify(cvData));
}

// ==================== NAVIGATION ====================
function renderCurrentPage() {
  const main = document.getElementById('appMain');
  const pageId = pageOrder[currentPageIndex];
  const page = window.CVPages[pageId];
  if (!page) return;

  main.innerHTML = `
    <div class="page-card">
      <h2 class="page-title"><i class="fas fa-${page.icon}"></i> ${page.title}</h2>
      <p class="page-subtitle">${page.subtitle || ''}</p>
      <div id="pageContent">${page.render(cvData)}</div>
    </div>
  `;

  if (typeof page.afterRender === 'function') {
    page.afterRender(cvData);
  }

  updateProgress();
  updateNavButtons();
}

function updateProgress() {
  const total = pageOrder.length;
  const current = currentPageIndex + 1;
  const pct = (current / total) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressText').textContent = `Step ${current} of ${total}`;
}

function updateNavButtons() {
  const backBtn = document.getElementById('backBtn');
  const skipBtn = document.getElementById('skipBtn');
  const nextBtn = document.getElementById('nextBtn');

  backBtn.disabled = currentPageIndex === 0;
  skipBtn.style.display = '';
  nextBtn.innerHTML = currentPageIndex === pageOrder.length - 1
    ? 'Continue <i class="fas fa-check"></i>'
    : 'Next <i class="fas fa-arrow-right"></i>';
}

function collectCurrentPage() {
  const pageId = pageOrder[currentPageIndex];
  const page = window.CVPages[pageId];
  if (!page || typeof page.collect !== 'function') return;
  const data = page.collect();
  cvData[pageId] = data;
  saveToStorage();
}

function goNext() {
  collectCurrentPage();
  if (currentPageIndex < pageOrder.length - 1) {
    currentPageIndex++;
    renderCurrentPage();
    scrollToTop();
  } else {
    showTemplateSelection();
  }
}

function goBack() {
  if (isPreviewMode) {
    isPreviewMode = false;
    selectedTemplate = null;
    document.getElementById('progressWrap').style.display = '';
    document.getElementById('appFooter').style.display = '';
    showTemplateSelection();
    return;
  }
  if (currentPageIndex > 0) {
    collectCurrentPage();
    currentPageIndex--;
    renderCurrentPage();
    scrollToTop();
  }
}

function skipPage() {
  if (currentPageIndex < pageOrder.length - 1) {
    currentPageIndex++;
    renderCurrentPage();
    scrollToTop();
  } else {
    showTemplateSelection();
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== TEMPLATE SELECTION ====================
function showTemplateSelection() {
  collectCurrentPage();
  isPreviewMode = false;
  document.getElementById('progressWrap').style.display = 'none';
  document.getElementById('appFooter').style.display = 'none';

  const templates = window.CVTemplates || {};
  const templateIds = Object.keys(templates);

  let cardsHtml = '';
  templateIds.forEach(id => {
    const tpl = templates[id];
    cardsHtml += `
      <div class="template-card" onclick="selectTemplate('${id}')">
        <div class="template-preview">${tpl.miniPreview ? tpl.miniPreview() : '<div class="mini-cv"></div>'}</div>
        <div class="template-info">
          <div class="template-name">${tpl.name}</div>
          <div class="template-desc">${tpl.description || ''}</div>
        </div>
      </div>
    `;
  });

  document.getElementById('appMain').innerHTML = `
    <div class="page-card">
      <h2 class="page-title"><i class="fas fa-palette"></i> Choose a Template</h2>
      <p class="page-subtitle">Pick a design that fits your style. Your data will be filled in automatically.</p>
      <div class="template-grid">${cardsHtml}</div>
    </div>
    <div style="text-align:center; margin-top:1.5rem;">
      <button class="btn btn-secondary" onclick="goBackToPages()">
        <i class="fas fa-arrow-left"></i> Back to Forms
      </button>
    </div>
  `;
}

function goBackToPages() {
  document.getElementById('progressWrap').style.display = '';
  document.getElementById('appFooter').style.display = '';
  renderCurrentPage();
}

function selectTemplate(id) {
  selectedTemplate = id;
  showPreview();
}

// ==================== PREVIEW ====================
function showPreview() {
  isPreviewMode = true;
  const tpl = window.CVTemplates[selectedTemplate];
  if (!tpl) return;

  const html = tpl.render(cvData);

  document.getElementById('appMain').innerHTML = `
    <div class="preview-container">
      <div class="preview-actions">
        <button class="btn btn-secondary" onclick="goBack()">
          <i class="fas fa-arrow-left"></i> Back to Templates
        </button>
        <button class="btn btn-secondary" onclick="goBackToPages()">
          <i class="fas fa-edit"></i> Edit Data
        </button>
        <button class="btn btn-primary" onclick="window.print()">
          <i class="fas fa-download"></i> Export PDF
        </button>
        <button class="btn btn-secondary" onclick="changeTemplate()">
          <i class="fas fa-palette"></i> Change Template
        </button>
        <button class="btn btn-secondary" onclick="openCustomTemplate()">
          <i class="fas fa-sliders"></i> Custom Template
        </button>
        <button class="btn btn-secondary" onclick="openSelfMade()">
          <i class="fas fa-pen-ruler"></i> Create Self Made
        </button>
        <button class="btn btn-secondary" onclick="exportDOCX()">
          <i class="fas fa-file-word"></i> DOCX Export
        </button>
        <button class="btn btn-secondary" onclick="openCoverLetter()">
          <i class="fas fa-envelope-open-text"></i> Cover Letter
        </button>
        <button class="btn btn-secondary" onclick="openResumeScore()">
          <i class="fas fa-chart-line"></i> Resume Score
        </button>
      </div>
      <div class="cv-page" id="cvPageRender">${html}</div>
    </div>
  `;

  document.getElementById('progressWrap').style.display = 'none';
  document.getElementById('appFooter').style.display = 'none';
  scrollToTop();
}

function changeTemplate() {
  selectedTemplate = null;
  showTemplateSelection();
}

// ==================== RESTART ====================
function restart() {
  if (!confirm('Start over? All entered data will be cleared.')) return;
  localStorage.removeItem('cvbuilder_pro_data');
  cvData = {
    personal: {}, summary: {}, experience: [], education: [], skills: [],
    projects: [], certifications: [], languages: [], awards: [], volunteer: [],
    internships: [], publications: [], conferences: [], references: [],
    interests: [], social: {}, custom: []
  };
  currentPageIndex = 0;
  selectedTemplate = null;
  isPreviewMode = false;
  document.getElementById('progressWrap').style.display = '';
  document.getElementById('appFooter').style.display = '';
  renderCurrentPage();
  toast('Started fresh');
}

// ==================== TOAST ====================
function toast(msg) {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// ==================== HELPERS ====================
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setVal(id, v) {
  const el = document.getElementById(id);
  if (el && v != null) el.value = v;
}

// ==================== CUSTOM TEMPLATE & SELF MADE ====================
function openCustomTemplate() {
  currentMode = 'custom';
  if (typeof CustomTemplateEditor !== 'undefined' && CustomTemplateEditor.open) {
    CustomTemplateEditor.open(selectedTemplate, cvData);
  }
}

function openSelfMade() {
  currentMode = 'selfmade';
  if (typeof SelfMadeEditor !== 'undefined' && SelfMadeEditor.open) {
    SelfMadeEditor.open(cvData);
  }
}

function backToPreview() {
  currentMode = 'preview';
  if (typeof CustomTemplateEditor !== 'undefined' && CustomTemplateEditor.close) {
    CustomTemplateEditor.close();
  }
  if (typeof SelfMadeEditor !== 'undefined' && SelfMadeEditor.close) {
    SelfMadeEditor.close();
  }
  showPreview();
}

// ==================== DOCX EXPORT ====================
function exportDOCX() {
  if (typeof DOCXExport !== 'undefined' && DOCXExport.exportDoc) {
    DOCXExport.exportDoc(cvData, selectedTemplate);
  }
}

// ==================== COVER LETTER ====================
function openCoverLetter() {
  currentMode = 'coverletter';
  if (typeof CoverLetter !== 'undefined' && CoverLetter.open) {
    CoverLetter.open(cvData);
  }
}

// ==================== RESUME SCORE ====================
function openResumeScore() {
  currentMode = 'score';
  if (typeof ResumeScore !== 'undefined' && ResumeScore.open) {
    ResumeScore.open(cvData);
  }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  renderCurrentPage();
});
