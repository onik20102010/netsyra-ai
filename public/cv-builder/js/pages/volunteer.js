// pages/volunteer.js — Volunteer Experience
window.CVPages = window.CVPages || {};

window.CVPages.volunteer = {
  id: 'volunteer',
  title: 'Volunteer Experience',
  icon: 'hands-helping',
  subtitle: 'Add volunteer work and community involvement.',
  render(data) {
    const items = data.volunteer || [];
    if (items.length === 0) {
      return `<div id="entriesWrap"></div><button class="btn-add-entry" onclick="addVolunteerEntry()"><i class="fas fa-plus"></i> Add Volunteer Experience</button>`;
    }
    let html = '<div id="entriesWrap">';
    items.forEach((v, i) => { html += renderVolunteerEntry(v, i); });
    html += '</div>';
    html += '<button class="btn-add-entry" onclick="addVolunteerEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return html;
  },
  collect() {
    const entries = document.querySelectorAll('[data-entry="volunteer"]');
    const result = [];
    entries.forEach((el) => {
      result.push({
        role: el.querySelector('[data-field="role"]').value.trim(),
        organization: el.querySelector('[data-field="organization"]').value.trim(),
        location: el.querySelector('[data-field="location"]').value.trim(),
        startDate: el.querySelector('[data-field="startDate"]').value,
        endDate: el.querySelector('[data-field="endDate"]').value,
        description: el.querySelector('[data-field="description"]').value.trim()
      });
    });
    return result;
  }
};

function renderVolunteerEntry(v, index) {
  v = v || {};
  return `
    <div class="entry-card" data-entry="volunteer">
      <div class="entry-card-header">
        <span class="entry-card-title">Volunteer #${index + 1}</span>
        <button class="entry-remove" onclick="this.closest('[data-entry]').remove()"><i class="fas fa-trash"></i> Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Role</label><input type="text" data-field="role" placeholder="Teaching Programming" value="${escapeHTML(v.role)}"></div>
        <div class="form-group"><label>Organization</label><input type="text" data-field="organization" placeholder="Local NGO" value="${escapeHTML(v.organization)}"></div>
      </div>
      <div class="form-group"><label>Location</label><input type="text" data-field="location" placeholder="Lahore, Pakistan" value="${escapeHTML(v.location)}"></div>
      <div class="form-row">
        <div class="form-group"><label>Start Date</label><input type="month" data-field="startDate" value="${v.startDate || ''}"></div>
        <div class="form-group"><label>End Date</label><input type="month" data-field="endDate" value="${v.endDate || ''}"></div>
      </div>
      <div class="form-group"><label>Description</label><textarea data-field="description" rows="2" placeholder="What did you do? Impact?">${escapeHTML(v.description)}</textarea></div>
    </div>
  `;
}

function addVolunteerEntry() {
  const wrap = document.getElementById('entriesWrap');
  if (!wrap) {
    document.getElementById('pageContent').innerHTML = '<div id="entriesWrap">' + renderVolunteerEntry({}, 0) + '</div><button class="btn-add-entry" onclick="addVolunteerEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return;
  }
  const count = wrap.querySelectorAll('[data-entry="volunteer"]').length;
  wrap.insertAdjacentHTML('beforeend', renderVolunteerEntry({}, count));
}
