// pages/projects.js — Projects
window.CVPages = window.CVPages || {};

window.CVPages.projects = {
  id: 'projects',
  title: 'Projects',
  icon: 'project-diagram',
  subtitle: 'Showcase your key projects. Especially important for developers.',
  render(data) {
    const items = data.projects || [];
    if (items.length === 0) {
      return `<div id="entriesWrap"></div><button class="btn-add-entry" onclick="addProjectEntry()"><i class="fas fa-plus"></i> Add Project</button>`;
    }
    let html = '<div id="entriesWrap">';
    items.forEach((proj, i) => { html += renderProjectEntry(proj, i); });
    html += '</div>';
    html += '<button class="btn-add-entry" onclick="addProjectEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return html;
  },
  collect() {
    const entries = document.querySelectorAll('[data-entry="project"]');
    const result = [];
    entries.forEach((el) => {
      result.push({
        name: el.querySelector('[data-field="name"]').value.trim(),
        description: el.querySelector('[data-field="description"]').value.trim(),
        technologies: el.querySelector('[data-field="technologies"]').value.trim(),
        github: el.querySelector('[data-field="github"]').value.trim(),
        liveUrl: el.querySelector('[data-field="liveUrl"]').value.trim(),
        startDate: el.querySelector('[data-field="startDate"]').value,
        endDate: el.querySelector('[data-field="endDate"]').value
      });
    });
    return result;
  }
};

function renderProjectEntry(proj, index) {
  proj = proj || {};
  return `
    <div class="entry-card" data-entry="project">
      <div class="entry-card-header">
        <span class="entry-card-title">Project #${index + 1}</span>
        <button class="entry-remove" onclick="this.closest('[data-entry]').remove()"><i class="fas fa-trash"></i> Remove</button>
      </div>
      <div class="form-group"><label>Project Name</label><input type="text" data-field="name" placeholder="E-Commerce Platform" value="${escapeHTML(proj.name)}"></div>
      <div class="form-group"><label>Description</label><textarea data-field="description" rows="2" placeholder="What does it do? What problem does it solve?">${escapeHTML(proj.description)}</textarea></div>
      <div class="form-group"><label>Technologies</label><input type="text" data-field="technologies" placeholder="React, Node.js, PostgreSQL" value="${escapeHTML(proj.technologies)}"></div>
      <div class="form-row">
        <div class="form-group"><label>GitHub URL</label><input type="text" data-field="github" placeholder="github.com/ali/project" value="${escapeHTML(proj.github)}"></div>
        <div class="form-group"><label>Live URL</label><input type="text" data-field="liveUrl" placeholder="project.com" value="${escapeHTML(proj.liveUrl)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Start Date</label><input type="month" data-field="startDate" value="${proj.startDate || ''}"></div>
        <div class="form-group"><label>End Date</label><input type="month" data-field="endDate" value="${proj.endDate || ''}"></div>
      </div>
    </div>
  `;
}

function addProjectEntry() {
  const wrap = document.getElementById('entriesWrap');
  if (!wrap) {
    document.getElementById('pageContent').innerHTML = '<div id="entriesWrap">' + renderProjectEntry({}, 0) + '</div><button class="btn-add-entry" onclick="addProjectEntry()"><i class="fas fa-plus"></i> Add Another</button>';
    return;
  }
  const count = wrap.querySelectorAll('[data-entry="project"]').length;
  wrap.insertAdjacentHTML('beforeend', renderProjectEntry({}, count));
}
