// pages/publications.js — Publications
window.CVPages = window.CVPages || {};

window.CVPages.publications = {
  id: 'publications',
  title: 'Publications',
  icon: 'book',
  subtitle: 'Add published works. Useful for researchers and academics.',
  render(data) {
    const items = data.publications || [];
    if (items.length === 0) {
      return `<div id="entriesWrap"></div><button class="btn-add-entry" onclick="addPublicationEntry()"><i class="fas fa-plus"></i> Add Publication</button>`;
    }
    let html = '<div id="entriesWrap">';
    items.forEach((p, i) => { html += renderPublicationEntry(p, i); });
    html += '</div>';
    html += '<button class="btn-add-entry" onclick="addPublicationEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return html;
  },
  collect() {
    const entries = document.querySelectorAll('[data-entry="publication"]');
    const result = [];
    entries.forEach((el) => {
      result.push({
        title: el.querySelector('[data-field="title"]').value.trim(),
        publisher: el.querySelector('[data-field="publisher"]').value.trim(),
        date: el.querySelector('[data-field="date"]').value,
        doi: el.querySelector('[data-field="doi"]').value.trim(),
        url: el.querySelector('[data-field="url"]').value.trim()
      });
    });
    return result;
  }
};

function renderPublicationEntry(p, index) {
  p = p || {};
  return `
    <div class="entry-card" data-entry="publication">
      <div class="entry-card-header">
        <span class="entry-card-title">Publication #${index + 1}</span>
        <button class="entry-remove" onclick="this.closest('[data-entry]').remove()"><i class="fas fa-trash"></i> Remove</button>
      </div>
      <div class="form-group"><label>Title</label><input type="text" data-field="title" placeholder="Machine Learning for Healthcare" value="${escapeHTML(p.title)}"></div>
      <div class="form-row">
        <div class="form-group"><label>Publisher / Journal</label><input type="text" data-field="publisher" placeholder="IEEE" value="${escapeHTML(p.publisher)}"></div>
        <div class="form-group"><label>Date</label><input type="month" data-field="date" value="${p.date || ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>DOI</label><input type="text" data-field="doi" placeholder="10.1109/..." value="${escapeHTML(p.doi)}"></div>
        <div class="form-group"><label>URL</label><input type="text" data-field="url" placeholder="ieeexplore.ieee.org/..." value="${escapeHTML(p.url)}"></div>
      </div>
    </div>
  `;
}

function addPublicationEntry() {
  const wrap = document.getElementById('entriesWrap');
  if (!wrap) {
    document.getElementById('pageContent').innerHTML = '<div id="entriesWrap">' + renderPublicationEntry({}, 0) + '</div><button class="btn-add-entry" onclick="addPublicationEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return;
  }
  const count = wrap.querySelectorAll('[data-entry="publication"]').length;
  wrap.insertAdjacentHTML('beforeend', renderPublicationEntry({}, count));
}
