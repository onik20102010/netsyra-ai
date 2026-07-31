// pages/social.js — Social Links
window.CVPages = window.CVPages || {};

window.CVPages.social = {
  id: 'social',
  title: 'Social Links',
  icon: 'share-nodes',
  subtitle: 'Add links to your professional profiles and portfolios.',
  render(data) {
    const s = data.social || {};
    const platforms = [
      { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin', placeholder: 'linkedin.com/in/username' },
      { key: 'github', label: 'GitHub', icon: 'github', placeholder: 'github.com/username' },
      { key: 'portfolio', label: 'Portfolio', icon: 'globe', placeholder: 'yourportfolio.com' },
      { key: 'behance', label: 'Behance', icon: 'behance', placeholder: 'behance.net/username' },
      { key: 'dribbble', label: 'Dribbble', icon: 'dribbble', placeholder: 'dribbble.com/username' },
      { key: 'medium', label: 'Medium', icon: 'medium', placeholder: 'medium.com/@username' },
      { key: 'stackoverflow', label: 'Stack Overflow', icon: 'stack-overflow', placeholder: 'stackoverflow.com/users/...' },
      { key: 'kaggle', label: 'Kaggle', icon: 'kaggle', placeholder: 'kaggle.com/username' },
      { key: 'youtube', label: 'YouTube', icon: 'youtube', placeholder: 'youtube.com/@channel' }
    ];
    return platforms.map(p => `
      <div class="form-group">
        <label><i class="fab fa-${p.icon}"></i> ${p.label}</label>
        <input type="text" id="social_${p.key}" placeholder="${p.placeholder}" value="${escapeHTML(s[p.key])}">
      </div>
    `).join('');
  },
  collect() {
    const platforms = ['linkedin','github','portfolio','behance','dribbble','medium','stackoverflow','kaggle','youtube'];
    const result = {};
    platforms.forEach(p => { result[p] = val('social_' + p); });
    return result;
  }
};
