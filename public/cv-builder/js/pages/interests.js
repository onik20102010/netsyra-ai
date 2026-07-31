// pages/interests.js — Interests / Hobbies
window.CVPages = window.CVPages || {};

window.CVPages.interests = {
  id: 'interests',
  title: 'Interests & Hobbies',
  icon: 'heart',
  subtitle: 'Add your interests. Press Enter or comma to add each one.',
  render(data) {
    const items = data.interests || [];
    return `
      <div class="form-group">
        <label>Interests & Hobbies</label>
        <div class="tag-input-wrap" id="interestsWrap">
          ${items.map(it => `<span class="tag">${escapeHTML(it.name)}<i class="fas fa-times tag-remove" onclick="this.parentElement.remove()"></i></span>`).join('')}
          <input type="text" class="tag-input" id="interestInput" placeholder="Type an interest and press Enter..." onkeydown="handleInterestKeydown(event)">
        </div>
      </div>
      <p style="font-size:0.8rem;color:var(--text-muted);">
        <i class="fas fa-lightbulb"></i> Examples: Chess, Photography, Running, Open Source, Reading
      </p>
    `;
  },
  collect() {
    const tags = document.querySelectorAll('#interestsWrap .tag');
    return Array.from(tags).map(t => ({
      name: t.textContent.trim().replace(/×$/, '').trim()
    }));
  }
};

function handleInterestKeydown(event) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault();
    const input = event.target;
    const value = input.value.trim().replace(/,/g, '');
    if (!value) return;
    const wrap = document.getElementById('interestsWrap');
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = escapeHTML(value) + '<i class="fas fa-times tag-remove" onclick="this.parentElement.remove()"></i>';
    wrap.insertBefore(tag, input);
    input.value = '';
  }
}
