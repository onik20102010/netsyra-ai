// pages/internships.js — Internships
window.CVPages = window.CVPages || {};

window.CVPages.internships = {
  id: 'internships',
  title: 'Internships',
  icon: 'seedling',
  subtitle: 'Add internship experiences. Great for students and recent graduates.',
  render(data) {
    const items = data.internships || [];
    if (items.length === 0) {
      return `<div id="entriesWrap"></div><button class="btn-add-entry" onclick="addInternshipEntry()"><i class="fas fa-plus"></i> Add Internship</button>`;
    }
    let html = '<div id="entriesWrap">';
    items.forEach((it, i) => { html += renderInternshipEntry(it, i); });
    html += '</div>';
    html += '<button class="btn-add-entry" onclick="addInternshipEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return html;
  },
  collect() {
    const entries = document.querySelectorAll('[data-entry="internship"]');
    const result = [];
    entries.forEach((el) => {
      result.push({
        jobTitle: el.querySelector('[data-field="jobTitle"]').value.trim(),
        company: el.querySelector('[data-field="company"]').value.trim(),
        location: el.querySelector('[data-field="location"]').value.trim(),
        startDate: el.querySelector('[data-field="startDate"]').value,
        endDate: el.querySelector('[data-field="endDate"]').value,
        description: el.querySelector('[data-field="description"]').value.trim()
      });
    });
    return result;
  }
};

function renderInternshipEntry(it, index) {
  it = it || {};
  return `
    <div class="entry-card" data-entry="internship">
      <div class="entry-card-header">
        <span class="entry-card-title">Internship #${index + 1}</span>
        <button class="entry-remove" onclick="this.closest('[data-entry]').remove()"><i class="fas fa-trash"></i> Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Job Title</label><input type="text" data-field="jobTitle" placeholder="Software Intern" value="${escapeHTML(it.jobTitle)}"></div>
        <div class="form-group"><label>Company</label><input type="text" data-field="company" placeholder="Tech Corp" value="${escapeHTML(it.company)}"></div>
      </div>
      <div class="form-group"><label>Location</label><input type="text" data-field="location" placeholder="Lahore, Pakistan" value="${escapeHTML(it.location)}"></div>
      <div class="form-row">
        <div class="form-group"><label>Start Date</label><input type="month" data-field="startDate" value="${it.startDate || ''}"></div>
        <div class="form-group"><label>End Date</label><input type="month" data-field="endDate" value="${it.endDate || ''}"></div>
      </div>
      <div class="form-group"><label>Description</label><textarea data-field="description" rows="2" placeholder="What did you learn and accomplish?">${escapeHTML(it.description)}</textarea></div>
    </div>
  `;
}

function addInternshipEntry() {
  const wrap = document.getElementById('entriesWrap');
  if (!wrap) {
    document.getElementById('pageContent').innerHTML = '<div id="entriesWrap">' + renderInternshipEntry({}, 0) + '</div><button class="btn-add-entry" onclick="addInternshipEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return;
  }
  const count = wrap.querySelectorAll('[data-entry="internship"]').length;
  wrap.insertAdjacentHTML('beforeend', renderInternshipEntry({}, count));
}
