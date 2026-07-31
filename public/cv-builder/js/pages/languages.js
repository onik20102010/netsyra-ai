// pages/languages.js — Languages
window.CVPages = window.CVPages || {};

window.CVPages.languages = {
  id: 'languages',
  title: 'Languages',
  icon: 'language',
  subtitle: 'Add languages you speak and your proficiency level.',
  render(data) {
    const items = data.languages || [];
    if (items.length === 0) {
      return `<div id="entriesWrap"></div><button class="btn-add-entry" onclick="addLanguageEntry()"><i class="fas fa-plus"></i> Add Language</button>`;
    }
    let html = '<div id="entriesWrap">';
    items.forEach((l, i) => { html += renderLanguageEntry(l, i); });
    html += '</div>';
    html += '<button class="btn-add-entry" onclick="addLanguageEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return html;
  },
  collect() {
    const entries = document.querySelectorAll('[data-entry="language"]');
    const result = [];
    entries.forEach((el) => {
      result.push({
        name: el.querySelector('[data-field="name"]').value.trim(),
        proficiency: el.querySelector('[data-field="proficiency"]').value
      });
    });
    return result;
  }
};

function renderLanguageEntry(l, index) {
  l = l || {};
  const levels = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'];
  return `
    <div class="entry-card" data-entry="language">
      <div class="entry-card-header">
        <span class="entry-card-title">Language #${index + 1}</span>
        <button class="entry-remove" onclick="this.closest('[data-entry]').remove()"><i class="fas fa-trash"></i> Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Language</label><input type="text" data-field="name" placeholder="English" value="${escapeHTML(l.name)}"></div>
        <div class="form-group">
          <label>Proficiency</label>
          <select data-field="proficiency">
            <option value="">Select...</option>
            ${levels.map(lv => `<option value="${lv}" ${l.proficiency===lv?'selected':''}>${lv}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
  `;
}

function addLanguageEntry() {
  const wrap = document.getElementById('entriesWrap');
  if (!wrap) {
    document.getElementById('pageContent').innerHTML = '<div id="entriesWrap">' + renderLanguageEntry({}, 0) + '</div><button class="btn-add-entry" onclick="addLanguageEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return;
  }
  const count = wrap.querySelectorAll('[data-entry="language"]').length;
  wrap.insertAdjacentHTML('beforeend', renderLanguageEntry({}, count));
}
