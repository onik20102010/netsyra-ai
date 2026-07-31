// pages/experience.js — Work Experience
window.CVPages = window.CVPages || {};

window.CVPages.experience = {
  id: 'experience',
  title: 'Work Experience',
  icon: 'briefcase',
  subtitle: 'Add your work history. Start with the most recent position.',
  render(data) {
    const items = data.experience || [];
    if (items.length === 0) {
      return `<div id="entriesWrap"></div><button class="btn-add-entry" onclick="addExperienceEntry()"><i class="fas fa-plus"></i> Add Work Experience</button>`;
    }
    let html = '<div id="entriesWrap">';
    items.forEach((exp, i) => {
      html += renderExperienceEntry(exp, i);
    });
    html += '</div>';
    html += '<button class="btn-add-entry" onclick="addExperienceEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return html;
  },
  collect() {
    const entries = document.querySelectorAll('[data-entry="experience"]');
    const result = [];
    entries.forEach((el) => {
      result.push({
        jobTitle: el.querySelector('[data-field="jobTitle"]').value.trim(),
        company: el.querySelector('[data-field="company"]').value.trim(),
        employmentType: el.querySelector('[data-field="employmentType"]').value,
        location: el.querySelector('[data-field="location"]').value.trim(),
        startDate: el.querySelector('[data-field="startDate"]').value,
        endDate: el.querySelector('[data-field="endDate"]').value,
        currentlyWorking: el.querySelector('[data-field="currentlyWorking"]').checked,
        description: el.querySelector('[data-field="description"]').value.trim(),
        achievements: el.querySelector('[data-field="achievements"]').value.trim()
      });
    });
    return result;
  }
};

function renderExperienceEntry(exp, index) {
  exp = exp || {};
  return `
    <div class="entry-card" data-entry="experience">
      <div class="entry-card-header">
        <span class="entry-card-title">Experience #${index + 1}</span>
        <button class="entry-remove" onclick="this.closest('[data-entry]').remove()"><i class="fas fa-trash"></i> Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Job Title</label><input type="text" data-field="jobTitle" placeholder="Senior Developer" value="${escapeHTML(exp.jobTitle)}"></div>
        <div class="form-group"><label>Company Name</label><input type="text" data-field="company" placeholder="Tech Corp" value="${escapeHTML(exp.company)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Employment Type</label>
          <select data-field="employmentType">
            <option value="">Select...</option>
            <option value="Full-time" ${exp.employmentType==='Full-time'?'selected':''}>Full-time</option>
            <option value="Part-time" ${exp.employmentType==='Part-time'?'selected':''}>Part-time</option>
            <option value="Contract" ${exp.employmentType==='Contract'?'selected':''}>Contract</option>
            <option value="Freelance" ${exp.employmentType==='Freelance'?'selected':''}>Freelance</option>
            <option value="Internship" ${exp.employmentType==='Internship'?'selected':''}>Internship</option>
            <option value="Remote" ${exp.employmentType==='Remote'?'selected':''}>Remote</option>
          </select>
        </div>
        <div class="form-group"><label>Location</label><input type="text" data-field="location" placeholder="Lahore, Pakistan" value="${escapeHTML(exp.location)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Start Date</label><input type="month" data-field="startDate" value="${exp.startDate || ''}"></div>
        <div class="form-group"><label>End Date</label><input type="month" data-field="endDate" value="${exp.endDate || ''}" ${exp.currentlyWorking?'disabled':''}></div>
      </div>
      <div class="checkbox-group">
        <input type="checkbox" data-field="currentlyWorking" ${exp.currentlyWorking?'checked':''} onchange="this.parentElement.parentElement.querySelector('[data-field=endDate]').disabled = this.checked">
        <label>Currently working here</label>
      </div>
      <div class="form-group"><label>Description</label><textarea data-field="description" rows="2" placeholder="Brief description of your role...">${escapeHTML(exp.description)}</textarea></div>
      <div class="form-group"><label>Achievements</label><textarea data-field="achievements" rows="3" placeholder="Key achievements, one per line...">${escapeHTML(exp.achievements)}</textarea></div>
    </div>
  `;
}

function addExperienceEntry() {
  const wrap = document.getElementById('entriesWrap');
  if (!wrap) {
    document.getElementById('pageContent').innerHTML = '<div id="entriesWrap">' + renderExperienceEntry({}, 0) + '</div><button class="btn-add-entry" onclick="addExperienceEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return;
  }
  const count = wrap.querySelectorAll('[data-entry="experience"]').length;
  wrap.insertAdjacentHTML('beforeend', renderExperienceEntry({}, count));
}
