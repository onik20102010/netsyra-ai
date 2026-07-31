// pages/references.js — References
window.CVPages = window.CVPages || {};

window.CVPages.references = {
  id: 'references',
  title: 'References',
  icon: 'users',
  subtitle: 'Add professional references. You can also just write "Available upon request".',
  render(data) {
    const items = data.references || [];
    const usePlaceholder = data.references && data.references.placeholder;
    return `
      <div class="checkbox-group" style="margin-bottom:1.5rem;">
        <input type="checkbox" id="refPlaceholder" ${usePlaceholder?'checked':''} onchange="toggleRefPlaceholder()">
        <label>Use "Available upon request" instead</label>
      </div>
      <div id="refEntriesWrap" style="${usePlaceholder?'display:none;':''}">
        <div id="entriesWrap">
          ${(!usePlaceholder && items.length > 0) ? items.map((r, i) => renderReferenceEntry(r, i)).join('') : ''}
        </div>
        <button class="btn-add-entry" onclick="addReferenceEntry()"><i class="fas fa-plus"></i> Add Reference</button>
      </div>
    `;
  },
  collect() {
    const placeholder = document.getElementById('refPlaceholder');
    if (placeholder && placeholder.checked) {
      return { placeholder: true, list: [] };
    }
    const entries = document.querySelectorAll('[data-entry="reference"]');
    const list = [];
    entries.forEach((el) => {
      list.push({
        name: el.querySelector('[data-field="name"]').value.trim(),
        title: el.querySelector('[data-field="title"]').value.trim(),
        company: el.querySelector('[data-field="company"]').value.trim(),
        email: el.querySelector('[data-field="email"]').value.trim(),
        phone: el.querySelector('[data-field="phone"]').value.trim()
      });
    });
    return { placeholder: false, list };
  }
};

function toggleRefPlaceholder() {
  const checked = document.getElementById('refPlaceholder').checked;
  document.getElementById('refEntriesWrap').style.display = checked ? 'none' : '';
}

function renderReferenceEntry(r, index) {
  r = r || {};
  return `
    <div class="entry-card" data-entry="reference">
      <div class="entry-card-header">
        <span class="entry-card-title">Reference #${index + 1}</span>
        <button class="entry-remove" onclick="this.closest('[data-entry]').remove()"><i class="fas fa-trash"></i> Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Name</label><input type="text" data-field="name" placeholder="Jane Doe" value="${escapeHTML(r.name)}"></div>
        <div class="form-group"><label>Title</label><input type="text" data-field="title" placeholder="Senior Manager" value="${escapeHTML(r.title)}"></div>
      </div>
      <div class="form-group"><label>Company</label><input type="text" data-field="company" placeholder="ABC Company" value="${escapeHTML(r.company)}"></div>
      <div class="form-row">
        <div class="form-group"><label>Email</label><input type="email" data-field="email" placeholder="jane@abc.com" value="${escapeHTML(r.email)}"></div>
        <div class="form-group"><label>Phone</label><input type="text" data-field="phone" placeholder="+92 300 1234567" value="${escapeHTML(r.phone)}"></div>
      </div>
    </div>
  `;
}

function addReferenceEntry() {
  const wrap = document.getElementById('entriesWrap');
  if (!wrap) {
    document.getElementById('entriesWrap').innerHTML = renderReferenceEntry({}, 0);
    return;
  }
  const count = wrap.querySelectorAll('[data-entry="reference"]').length;
  wrap.insertAdjacentHTML('beforeend', renderReferenceEntry({}, count));
}
