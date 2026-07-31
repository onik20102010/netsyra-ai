// pages/certifications.js — Certifications
window.CVPages = window.CVPages || {};

window.CVPages.certifications = {
  id: 'certifications',
  title: 'Certifications',
  icon: 'certificate',
  subtitle: 'Add professional certifications and licenses.',
  render(data) {
    const items = data.certifications || [];
    if (items.length === 0) {
      return `<div id="entriesWrap"></div><button class="btn-add-entry" onclick="addCertEntry()"><i class="fas fa-plus"></i> Add Certification</button>`;
    }
    let html = '<div id="entriesWrap">';
    items.forEach((c, i) => { html += renderCertEntry(c, i); });
    html += '</div>';
    html += '<button class="btn-add-entry" onclick="addCertEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return html;
  },
  collect() {
    const entries = document.querySelectorAll('[data-entry="certification"]');
    const result = [];
    entries.forEach((el) => {
      result.push({
        name: el.querySelector('[data-field="name"]').value.trim(),
        organization: el.querySelector('[data-field="organization"]').value.trim(),
        issueDate: el.querySelector('[data-field="issueDate"]').value,
        expiryDate: el.querySelector('[data-field="expiryDate"]').value,
        credentialId: el.querySelector('[data-field="credentialId"]').value.trim(),
        credentialUrl: el.querySelector('[data-field="credentialUrl"]').value.trim()
      });
    });
    return result;
  }
};

function renderCertEntry(c, index) {
  c = c || {};
  return `
    <div class="entry-card" data-entry="certification">
      <div class="entry-card-header">
        <span class="entry-card-title">Certification #${index + 1}</span>
        <button class="entry-remove" onclick="this.closest('[data-entry]').remove()"><i class="fas fa-trash"></i> Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Certificate Name</label><input type="text" data-field="name" placeholder="AWS Solutions Architect" value="${escapeHTML(c.name)}"></div>
        <div class="form-group"><label>Organization</label><input type="text" data-field="organization" placeholder="Amazon Web Services" value="${escapeHTML(c.organization)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Issue Date</label><input type="month" data-field="issueDate" value="${c.issueDate || ''}"></div>
        <div class="form-group"><label>Expiry Date</label><input type="month" data-field="expiryDate" value="${c.expiryDate || ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Credential ID</label><input type="text" data-field="credentialId" placeholder="AWS-123456" value="${escapeHTML(c.credentialId)}"></div>
        <div class="form-group"><label>Credential URL</label><input type="text" data-field="credentialUrl" placeholder="aws.amazon.com/verify" value="${escapeHTML(c.credentialUrl)}"></div>
      </div>
    </div>
  `;
}

function addCertEntry() {
  const wrap = document.getElementById('entriesWrap');
  if (!wrap) {
    document.getElementById('pageContent').innerHTML = '<div id="entriesWrap">' + renderCertEntry({}, 0) + '</div><button class="btn-add-entry" onclick="addCertEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return;
  }
  const count = wrap.querySelectorAll('[data-entry="certification"]').length;
  wrap.insertAdjacentHTML('beforeend', renderCertEntry({}, count));
}
