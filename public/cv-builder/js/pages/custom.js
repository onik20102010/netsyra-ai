// pages/custom.js — Custom Sections
window.CVPages = window.CVPages || {};

window.CVPages.custom = {
  id: 'custom',
  title: 'Custom Sections',
  icon: 'plus-square',
  subtitle: 'Create your own sections for anything not covered above.',
  render(data) {
    const sections = data.custom || [];
    if (sections.length === 0) {
      return `
        <p style="color:var(--text-muted);margin-bottom:1.5rem;">No custom sections yet. Create one for things like Military Service, Patents, Scholarships, Courses, Workshops, etc.</p>
        <div id="customSectionsWrap"></div>
        <button class="btn-add-entry" onclick="addCustomSection()"><i class="fas fa-plus"></i> Add Custom Section</button>
      `;
    }
    let html = '<div id="customSectionsWrap">';
    sections.forEach((sec, i) => { html += renderCustomSection(sec, i); });
    html += '</div>';
    html += '<button class="btn-add-entry" onclick="addCustomSection()"><i class="fas fa-plus"></i> Add Another Section</button>';
    return html;
  },
  collect() {
    const sections = document.querySelectorAll('[data-entry="custom"]');
    const result = [];
    sections.forEach((el) => {
      const entries = el.querySelectorAll('[data-sub-entry]');
      const items = [];
      entries.forEach((e) => {
        items.push({
          title: e.querySelector('[data-field="itemTitle"]').value.trim(),
          description: e.querySelector('[data-field="itemDesc"]').value.trim()
        });
      });
      result.push({
        sectionName: el.querySelector('[data-field="sectionName"]').value.trim(),
        items
      });
    });
    return result;
  }
};

function renderCustomSection(sec, index) {
  sec = sec || { sectionName: '', items: [] };
  const itemsHtml = (sec.items || []).map((item, j) => `
    <div class="entry-card" data-sub-entry style="margin-top:0.5rem;">
      <div class="entry-card-header">
        <span class="entry-card-title">Item #${j + 1}</span>
        <button class="entry-remove" onclick="this.closest('[data-sub-entry]').remove()"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-group"><label>Title</label><input type="text" data-field="itemTitle" placeholder="Item title" value="${escapeHTML(item.title)}"></div>
      <div class="form-group"><label>Description</label><textarea data-field="itemDesc" rows="2" placeholder="Description...">${escapeHTML(item.description)}</textarea></div>
    </div>
  `).join('');

  return `
    <div class="entry-card" data-entry="custom" style="border:2px solid var(--primary-light);">
      <div class="entry-card-header">
        <span class="entry-card-title">Custom Section #${index + 1}</span>
        <button class="entry-remove" onclick="this.closest('[data-entry]').remove()"><i class="fas fa-trash"></i> Remove Section</button>
      </div>
      <div class="form-group"><label>Section Name</label><input type="text" data-field="sectionName" placeholder="e.g. Military Service, Patents, Scholarships" value="${escapeHTML(sec.sectionName)}"></div>
      <div data-custom-items>${itemsHtml}</div>
      <button class="btn-add-entry" onclick="addCustomItem(this)"><i class="fas fa-plus"></i> Add Item</button>
    </div>
  `;
}

function addCustomSection() {
  const wrap = document.getElementById('customSectionsWrap');
  if (!wrap) {
    document.getElementById('pageContent').innerHTML = '<div id="customSectionsWrap">' + renderCustomSection({}, 0) + '</div><button class="btn-add-entry" onclick="addCustomSection()"><i class="fas fa-plus"></i> Add Another Section</button>';
    return;
  }
  const count = wrap.querySelectorAll('[data-entry="custom"]').length;
  wrap.insertAdjacentHTML('beforeend', renderCustomSection({}, count));
}

function addCustomItem(btn) {
  const container = btn.closest('[data-entry]').querySelector('[data-custom-items]');
  const count = container.querySelectorAll('[data-sub-entry]').length;
  container.insertAdjacentHTML('beforeend', `
    <div class="entry-card" data-sub-entry style="margin-top:0.5rem;">
      <div class="entry-card-header">
        <span class="entry-card-title">Item #${count + 1}</span>
        <button class="entry-remove" onclick="this.closest('[data-sub-entry]').remove()"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-group"><label>Title</label><input type="text" data-field="itemTitle" placeholder="Item title"></div>
      <div class="form-group"><label>Description</label><textarea data-field="itemDesc" rows="2" placeholder="Description..."></textarea></div>
    </div>
  `);
}
