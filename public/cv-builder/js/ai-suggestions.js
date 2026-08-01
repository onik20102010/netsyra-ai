/* ==================================================
   AI Suggestions
   Uses Groq API to generate human-tone CV content
   (summaries & experience descriptions) based on
   the user's actual CV data.
   ================================================== */

const AISuggestions = (function () {
  let active = false;

  function open(cvData) {
    active = true;
    render(cvData);
  }

  function close() {
    active = false;
    const appMain = document.getElementById("appMain");
    appMain.classList.remove("editor-mode");
    showPreview();
  }

  function render(cvData) {
    const appMain = document.getElementById("appMain");
    appMain.classList.add("editor-mode");

    const p = cvData.personal || {};
    const name = p.fullName || "your CV";
    const title = p.professionalTitle || "";

    appMain.innerHTML = `
      <div class="ai-suggest-layout">
        <div class="ai-suggest-header">
          <div class="ai-suggest-header-left">
            <h2><i class="fas fa-wand-magic-sparkles"></i> AI Suggestions</h2>
            <p class="ai-suggest-subtitle">Human-tone content generated from your CV data — no design, just text.</p>
          </div>
          <button class="btn btn-ghost" onclick="AISuggestions.close()" title="Close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="ai-suggest-body">
          <div class="ai-suggest-sidebar">
            <div class="ai-suggest-card">
              <div class="ai-suggest-card-icon"><i class="fas fa-user"></i></div>
              <div class="ai-suggest-card-info">
                <div class="ai-suggest-card-label">Detected from your CV</div>
                <div class="ai-suggest-card-value">${escapeHTML(name)}</div>
                ${title ? `<div class="ai-suggest-card-sub">${escapeHTML(title)}</div>` : ""}
              </div>
            </div>

            <div class="ai-suggest-actions">
              <button class="ai-suggest-action-btn" id="aiGenSummary" onclick="AISuggestions.generateSummary()">
                <i class="fas fa-feather"></i>
                <span>Generate Professional Summary</span>
              </button>
              <button class="ai-suggest-action-btn" id="aiGenDescriptions" onclick="AISuggestions.generateDescriptions()">
                <i class="fas fa-briefcase"></i>
                <span>Generate Experience Descriptions</span>
              </button>
              <button class="ai-suggest-action-btn" id="aiGenBoth" onclick="AISuggestions.generateAll()">
                <i class="fas fa-sparkles"></i>
                <span>Generate Everything</span>
              </button>
            </div>

            <div class="ai-suggest-tips">
              <div class="ai-suggest-tips-title"><i class="fas fa-lightbulb"></i> Tips</div>
              <ul>
                <li>AI reads your name, title, experience, and skills to write personalized content.</li>
                <li>Generated text is in natural human tone — no buzzwords or clichés.</li>
                <li>You can copy the text and paste it into your CV form fields.</li>
              </ul>
            </div>
          </div>

          <div class="ai-suggest-results" id="aiResults">
            <div class="ai-suggest-empty">
              <i class="fas fa-wand-magic-sparkles"></i>
              <h3>Ready when you are</h3>
              <p>Click any button on the left to generate human-tone content for your CV.</p>
            </div>
          </div>
        </div>

        <div class="ai-suggest-footer">
          <button class="btn btn-secondary" onclick="AISuggestions.close()">
            <i class="fas fa-arrow-left"></i> Back to Preview
          </button>
        </div>
      </div>
    `;
  }

  function setLoading(targetId, label) {
    const btn = document.getElementById(targetId);
    if (btn) {
      btn.disabled = true;
      btn.classList.add("loading");
      btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span>${label}</span>`;
    }
  }

  function clearLoading(targetId, originalHtml) {
    const btn = document.getElementById(targetId);
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("loading");
      btn.innerHTML = originalHtml;
    }
  }

  async function callAI(prompt, cvData) {
    const res = await fetch("/api/cv-builder/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, cvData }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "AI request failed");
    }

    const data = await res.json();
    return data.content;
  }

  async function generateSummary() {
    const results = document.getElementById("aiResults");
    setLoading("aiGenSummary", "Writing summary...");

    try {
      const prompt = `Write a professional summary for this person's CV. Use first person ("I am..."). Make it 2-3 sentences. Sound natural and human — like a real person describing themselves. Base it on their name, professional title, work experience, skills, and education. Do NOT use buzzwords like "passionate", "results-driven", "team player". Use specific, real language about what they actually do.`;

      const content = await callAI(prompt, cvData);

      results.innerHTML = `
        <div class="ai-result-section">
          <div class="ai-result-header">
            <h3><i class="fas fa-feather"></i> Professional Summary</h3>
            <button class="ai-copy-btn" onclick="AISuggestions.copyText(this)" data-text="${encodeURIComponent(content)}">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="ai-result-content">${escapeHTML(content)}</div>
          <div class="ai-result-actions">
            <button class="btn btn-primary btn-sm" onclick="AISuggestions.applySummary(this)" data-text="${encodeURIComponent(content)}">
              <i class="fas fa-check"></i> Apply to CV
            </button>
          </div>
        </div>
      `;
    } catch (err) {
      results.innerHTML = `<div class="ai-result-error"><i class="fas fa-exclamation-circle"></i> ${escapeHTML(err.message)}</div>`;
    }

    clearLoading("aiGenSummary", '<i class="fas fa-feather"></i><span>Generate Professional Summary</span>');
  }

  async function generateDescriptions() {
    const results = document.getElementById("aiResults");
    setLoading("aiGenDescriptions", "Writing descriptions...");

    try {
      const prompt = `Write a brief 1-2 sentence description for each work experience entry in this person's CV. Use action-oriented language that describes what they actually did in that role. Sound natural and human. Do NOT use buzzwords. Format each description with the job title as a header, like:\n\n**Job Title at Company**\nDescription here\n\nDo this for every experience entry.`;

      const content = await callAI(prompt, cvData);

      results.innerHTML = `
        <div class="ai-result-section">
          <div class="ai-result-header">
            <h3><i class="fas fa-briefcase"></i> Experience Descriptions</h3>
            <button class="ai-copy-btn" onclick="AISuggestions.copyText(this)" data-text="${encodeURIComponent(content)}">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="ai-result-content ai-result-content-pre">${escapeHTML(content)}</div>
        </div>
      `;
    } catch (err) {
      results.innerHTML = `<div class="ai-result-error"><i class="fas fa-exclamation-circle"></i> ${escapeHTML(err.message)}</div>`;
    }

    clearLoading("aiGenDescriptions", '<i class="fas fa-briefcase"></i><span>Generate Experience Descriptions</span>');
  }

  async function generateAll() {
    const results = document.getElementById("aiResults");
    setLoading("aiGenBoth", "Generating everything...");

    try {
      const summaryPrompt = `Write a professional summary for this person's CV. Use first person ("I am..."). Make it 2-3 sentences. Sound natural and human. Base it on their name, title, experience, skills, and education. No buzzwords.`;

      const descPrompt = `Write a brief 1-2 sentence description for each work experience entry. Action-oriented, natural human tone. Format as:\n\n**Job Title at Company**\nDescription\n\nFor every entry.`;

      const [summary, descriptions] = await Promise.all([
        callAI(summaryPrompt, cvData),
        callAI(descPrompt, cvData),
      ]);

      results.innerHTML = `
        <div class="ai-result-section">
          <div class="ai-result-header">
            <h3><i class="fas fa-feather"></i> Professional Summary</h3>
            <button class="ai-copy-btn" onclick="AISuggestions.copyText(this)" data-text="${encodeURIComponent(summary)}">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="ai-result-content">${escapeHTML(summary)}</div>
          <div class="ai-result-actions">
            <button class="btn btn-primary btn-sm" onclick="AISuggestions.applySummary(this)" data-text="${encodeURIComponent(summary)}">
              <i class="fas fa-check"></i> Apply to CV
            </button>
          </div>
        </div>

        <div class="ai-result-section">
          <div class="ai-result-header">
            <h3><i class="fas fa-briefcase"></i> Experience Descriptions</h3>
            <button class="ai-copy-btn" onclick="AISuggestions.copyText(this)" data-text="${encodeURIComponent(descriptions)}">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="ai-result-content ai-result-content-pre">${escapeHTML(descriptions)}</div>
        </div>
      `;
    } catch (err) {
      results.innerHTML = `<div class="ai-result-error"><i class="fas fa-exclamation-circle"></i> ${escapeHTML(err.message)}</div>`;
    }

    clearLoading("aiGenBoth", '<i class="fas fa-sparkles"></i><span>Generate Everything</span>');
  }

  function copyText(btn) {
    const text = decodeURIComponent(btn.dataset.text || "");
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => { btn.innerHTML = orig; }, 2000);
    });
  }

  function applySummary(btn) {
    const text = decodeURIComponent(btn.dataset.text || "");
    if (!cvData.summary) cvData.summary = {};
    cvData.summary.text = text;
    saveToStorage();
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Applied!';
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
    toast("Summary applied to your CV data");
  }

  return {
    open, close, generateSummary, generateDescriptions, generateAll, copyText, applySummary
  };
})();
