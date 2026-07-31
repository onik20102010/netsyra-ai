// pages/education.js — Education
window.CVPages = window.CVPages || {};

window.CVPages.education = {
  id: 'education',
  title: 'Education',
  icon: 'graduation-cap',
  subtitle: 'Add your academic background. Start with the highest degree.',
  render(data) {
    const items = data.education || [];
    if (items.length === 0) {
      return `<div id="entriesWrap"></div><button class="btn-add-entry" onclick="addEducationEntry()"><i class="fas fa-plus"></i> Add Education</button>`;
    }
    let html = '<div id="entriesWrap">';
    items.forEach((edu, i) => { html += renderEducationEntry(edu, i); });
    html += '</div>';
    html += '<button class="btn-add-entry" onclick="addEducationEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return html;
  },
  collect() {
    const entries = document.querySelectorAll('[data-entry="education"]');
    const result = [];
    entries.forEach((el) => {
      result.push({
        school: el.querySelector('[data-field="school"]').value.trim(),
        degree: el.querySelector('[data-field="degree"]').value.trim(),
        fieldOfStudy: el.querySelector('[data-field="fieldOfStudy"]').value.trim(),
        startDate: el.querySelector('[data-field="startDate"]').value,
        endDate: el.querySelector('[data-field="endDate"]').value,
        gpa: el.querySelector('[data-field="gpa"]').value.trim(),
        description: el.querySelector('[data-field="description"]').value.trim()
      });
    });
    return result;
  }
};

function renderEducationEntry(edu, index) {
  edu = edu || {};
  return `
    <div class="entry-card" data-entry="education">
      <div class="entry-card-header">
        <span class="entry-card-title">Education #${index + 1}</span>
        <button class="entry-remove" onclick="this.closest('[data-entry]').remove()"><i class="fas fa-trash"></i> Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group"><label>School / University</label><input type="text" data-field="school" placeholder="University of the Punjab" value="${escapeHTML(edu.school)}"></div>
        <div class="form-group"><label>Degree</label><input type="text" data-field="degree" placeholder="BS Computer Science" value="${escapeHTML(edu.degree)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Field of Study</label><input type="text" data-field="fieldOfStudy" placeholder="Computer Science" value="${escapeHTML(edu.fieldOfStudy)}"></div>
        <div class="form-group"><label>GPA (optional)</label><input type="text" data-field="gpa" placeholder="3.8 / 4.0" value="${escapeHTML(edu.gpa)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Start Date</label><input type="month" data-field="startDate" value="${edu.startDate || ''}"></div>
        <div class="form-group"><label>End Date</label><input type="month" data-field="endDate" value="${edu.endDate || ''}"></div>
      </div>
      <div class="form-group"><label>Description (optional)</label><textarea data-field="description" rows="2" placeholder="Relevant coursework, honors, activities...">${escapeHTML(edu.description)}</textarea></div>
    </div>
  `;
}

function addEducationEntry() {
  const wrap = document.getElementById('entriesWrap');
  if (!wrap) {
    document.getElementById('pageContent').innerHTML = '<div id="entriesWrap">' + renderEducationEntry({}, 0) + '</div><button class="btn-add-entry" onclick="addEducationEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return;
  }
  const count = wrap.querySelectorAll('[data-entry="education"]').length;
  wrap.insertAdjacentHTML('beforeend', renderEducationEntry({}, count));
}
