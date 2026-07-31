// pages/summary.js — Professional Summary
window.CVPages = window.CVPages || {};

window.CVPages.summary = {
  id: 'summary',
  title: 'Professional Summary',
  icon: 'align-left',
  subtitle: 'A short paragraph introducing yourself and your key strengths.',
  render(data) {
    const s = data.summary || {};
    return `
      <div class="form-group">
        <label>Summary</label>
        <textarea id="summaryText" rows="6" placeholder="Experienced software engineer with 5+ years building scalable web applications. Passionate about clean code, user experience, and mentoring junior developers...">${escapeHTML(s.text)}</textarea>
      </div>
      <p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.5rem;">
        <i class="fas fa-lightbulb"></i> Tip: Keep it to 3-4 sentences. Focus on your years of experience, key skills, and what makes you unique.
      </p>
    `;
  },
  collect() {
    return { text: val('summaryText') };
  }
};
