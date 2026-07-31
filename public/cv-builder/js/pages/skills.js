// pages/skills.js — Skills
window.CVPages = window.CVPages || {};

window.CVPages.skills = {
  id: 'skills',
  title: 'Skills',
  icon: 'code',
  subtitle: 'Add individual skills. Press Enter or comma to add each skill.',
  render(data) {
    const skills = data.skills || [];
    return `
      <div class="form-group">
        <label>Skills</label>
        <div class="tag-input-wrap" id="skillsWrap">
          ${skills.map(s => `<span class="tag">${escapeHTML(s.name)}<i class="fas fa-times tag-remove" onclick="this.parentElement.remove()"></i></span>`).join('')}
          <input type="text" class="tag-input" id="skillInput" placeholder="Type a skill and press Enter..." onkeydown="handleSkillKeydown(event)">
        </div>
      </div>
      <p style="font-size:0.8rem;color:var(--text-muted);">
        <i class="fas fa-lightbulb"></i> Examples: JavaScript, Python, React, Project Management, Figma
      </p>
    `;
  },
  collect() {
    const tags = document.querySelectorAll('#skillsWrap .tag');
    return Array.from(tags).map(t => ({
      name: t.textContent.trim().replace(/×$/, '').trim()
    }));
  }
};

function handleSkillKeydown(event) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault();
    const input = event.target;
    const value = input.value.trim().replace(/,/g, '');
    if (!value) return;
    const wrap = document.getElementById('skillsWrap');
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = escapeHTML(value) + '<i class="fas fa-times tag-remove" onclick="this.parentElement.remove()"></i>';
    wrap.insertBefore(tag, input);
    input.value = '';
  }
}
