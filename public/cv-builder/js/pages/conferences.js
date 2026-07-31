// pages/conferences.js — Conferences
window.CVPages = window.CVPages || {};

window.CVPages.conferences = {
  id: 'conferences',
  title: 'Conferences',
  icon: 'microphone',
  subtitle: 'Add conferences you attended, spoke at, or organized.',
  render(data) {
    const items = data.conferences || [];
    if (items.length === 0) {
      return `<div id="entriesWrap"></div><button class="btn-add-entry" onclick="addConferenceEntry()"><i class="fas fa-plus"></i> Add Conference</button>`;
    }
    let html = '<div id="entriesWrap">';
    items.forEach((c, i) => { html += renderConferenceEntry(c, i); });
    html += '</div>';
    html += '<button class="btn-add-entry" onclick="addConferenceEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return html;
  },
  collect() {
    const entries = document.querySelectorAll('[data-entry="conference"]');
    const result = [];
    entries.forEach((el) => {
      result.push({
        name: el.querySelector('[data-field="name"]').value.trim(),
        role: el.querySelector('[data-field="role"]').value,
        location: el.querySelector('[data-field="location"]').value.trim(),
        date: el.querySelector('[data-field="date"]').value,
        description: el.querySelector('[data-field="description"]').value.trim()
      });
    });
    return result;
  }
};

function renderConferenceEntry(c, index) {
  c = c || {};
  const roles = ['Speaker', 'Attendee', 'Organizer', 'Panelist', 'Workshop Lead'];
  return `
    <div class="entry-card" data-entry="conference">
      <div class="entry-card-header">
        <span class="entry-card-title">Conference #${index + 1}</span>
        <button class="entry-remove" onclick="this.closest('[data-entry]').remove()"><i class="fas fa-trash"></i> Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Conference Name</label><input type="text" data-field="name" placeholder="PyCon 2025" value="${escapeHTML(c.name)}"></div>
        <div class="form-group">
          <label>Role</label>
          <select data-field="role">
            <option value="">Select...</option>
            ${roles.map(r => `<option value="${r}" ${c.role===r?'selected':''}>${r}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Location</label><input type="text" data-field="location" placeholder="Islamabad, Pakistan" value="${escapeHTML(c.location)}"></div>
        <div class="form-group"><label>Date</label><input type="month" data-field="date" value="${c.date || ''}"></div>
      </div>
      <div class="form-group"><label>Description (optional)</label><textarea data-field="description" rows="2" placeholder="Talk title, topic, or brief notes...">${escapeHTML(c.description)}</textarea></div>
    </div>
  `;
}

function addConferenceEntry() {
  const wrap = document.getElementById('entriesWrap');
  if (!wrap) {
    document.getElementById('pageContent').innerHTML = '<div id="entriesWrap">' + renderConferenceEntry({}, 0) + '</div><button class="btn-add-entry" onclick="addConferenceEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return;
  }
  const count = wrap.querySelectorAll('[data-entry="conference"]').length;
  wrap.insertAdjacentHTML('beforeend', renderConferenceEntry({}, count));
}
