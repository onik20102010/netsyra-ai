// pages/awards.js — Awards & Honors
window.CVPages = window.CVPages || {};

window.CVPages.awards = {
  id: 'awards',
  title: 'Awards & Honors',
  icon: 'award',
  subtitle: 'Add awards, honors, and recognitions you\'ve received.',
  render(data) {
    const items = data.awards || [];
    if (items.length === 0) {
      return `<div id="entriesWrap"></div><button class="btn-add-entry" onclick="addAwardEntry()"><i class="fas fa-plus"></i> Add Award</button>`;
    }
    let html = '<div id="entriesWrap">';
    items.forEach((a, i) => { html += renderAwardEntry(a, i); });
    html += '</div>';
    html += '<button class="btn-add-entry" onclick="addAwardEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return html;
  },
  collect() {
    const entries = document.querySelectorAll('[data-entry="award"]');
    const result = [];
    entries.forEach((el) => {
      result.push({
        title: el.querySelector('[data-field="title"]').value.trim(),
        issuer: el.querySelector('[data-field="issuer"]').value.trim(),
        date: el.querySelector('[data-field="date"]').value,
        description: el.querySelector('[data-field="description"]').value.trim()
      });
    });
    return result;
  }
};

function renderAwardEntry(a, index) {
  a = a || {};
  return `
    <div class="entry-card" data-entry="award">
      <div class="entry-card-header">
        <span class="entry-card-title">Award #${index + 1}</span>
        <button class="entry-remove" onclick="this.closest('[data-entry]').remove()"><i class="fas fa-trash"></i> Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Award Title</label><input type="text" data-field="title" placeholder="Best Employee" value="${escapeHTML(a.title)}"></div>
        <div class="form-group"><label>Issuer</label><input type="text" data-field="issuer" placeholder="Tech Corp" value="${escapeHTML(a.issuer)}"></div>
      </div>
      <div class="form-group"><label>Date</label><input type="month" data-field="date" value="${a.date || ''}"></div>
      <div class="form-group"><label>Description (optional)</label><textarea data-field="description" rows="2" placeholder="Brief description...">${escapeHTML(a.description)}</textarea></div>
    </div>
  `;
}

function addAwardEntry() {
  const wrap = document.getElementById('entriesWrap');
  if (!wrap) {
    document.getElementById('pageContent').innerHTML = '<div id="entriesWrap">' + renderAwardEntry({}, 0) + '</div><button class="btn-add-entry" onclick="addAwardEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return;
  }
  const count = wrap.querySelectorAll('[data-entry="award"]').length;
  wrap.insertAdjacentHTML('beforeend', renderAwardEntry({}, count));
}
