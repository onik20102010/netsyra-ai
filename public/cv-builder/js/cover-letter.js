/* ==================================================
   Cover Letter Builder
   Form-based cover letter editor with live preview,
   AI generation option, and PDF export.
   ================================================== */

const CoverLetter = (function () {
  let active = false;
  let cvData = null;
  let letterData = {
    recipientName: "",
    company: "",
    position: "",
    body: "",
    tone: "professional",
    senderAddress: "",
    recipientAddress: "",
    fontStyle: "standard",
    fontSize: "11"
  };

  const TEMPLATES = {
    standard: `Dear Hiring Manager,\n\nI am writing to express my interest in the [Position] role at [Company]. With my background in [Your Field], I believe I would be a valuable addition to your team.\n\nIn my previous roles, I have [Key Achievement 1], [Key Achievement 2], and [Key Achievement 3]. These experiences have equipped me with the skills necessary to excel in this position and contribute meaningfully to your team's goals.\n\nI am particularly drawn to [Company] because [Reason for Interest]. I am excited about the opportunity to bring my expertise to your organization and help drive [Relevant Goal/Initiative].\n\nThank you for considering my application. I look forward to the opportunity to discuss how I can contribute to [Company].\n\nSincerely,\n[Your Name]`,
    concise: `Dear Hiring Manager,\n\nI am excited to apply for the [Position] role at [Company]. With my experience in [Your Field] and a proven track record of [Key Achievement], I am confident I can make an immediate impact.\n\nI would welcome the opportunity to discuss how my skills align with your needs. Thank you for your time and consideration.\n\nSincerely,\n[Your Name]`,
    creative: `Dear [Recipient Name],\n\nLet me tell you a story about someone who [Relevant Personal Quality]. That's me — and that's exactly what I'd bring to the [Position] role at [Company].\n\nOver the past [Number] years, I've [Key Achievement 1] and [Key Achievement 2]. But what excites me most about [Company] is [Specific Reason]. I'm not just looking for a job — I'm looking for a place where I can [Your Goal].\n\nI'd love to chat about how I can help [Company] achieve [Company Goal]. Let's talk.\n\nWarmly,\n[Your Name]`,
    executive: `Dear [Recipient Name],\n\nI am writing to express my strong interest in the [Position] position at [Company]. Having led [Team/Department Size] teams and driven [Key Business Result], I am confident in my ability to deliver immediate and sustained impact in this role.\n\nMy career has been defined by [Core Strength 1], [Core Strength 2], and [Core Strength 3]. At [Previous Company], I [Specific Achievement with Metrics]. I am eager to bring this same level of strategic execution to [Company].\n\nI would appreciate the opportunity to discuss this role in detail. Thank you for your consideration.\n\nRespectfully,\n[Your Name]`
  };

  function open(data) {
    cvData = data;
    active = true;
    const p = cvData.personal || {};
    if (!letterData.body) {
      letterData.body = `Dear Hiring Manager,\n\nI am writing to express my interest in the [Position] role at [Company]. With my background in ${p.professionalTitle || "my field"}, I believe I would be a valuable addition to your team.\n\n[Your experience and why you're a good fit - 2-3 sentences]\n\nThank you for considering my application. I look forward to the opportunity to discuss how I can contribute to [Company].\n\nSincerely,\n${p.fullName || ""}`;
    }
    render();
  }

  function close() {
    active = false;
    const appMain = document.getElementById("appMain");
    appMain.classList.remove("editor-mode");
    showPreview();
  }

  function render() {
    const appMain = document.getElementById("appMain");
    appMain.classList.add("editor-mode");
    const p = cvData.personal || {};

    appMain.innerHTML = `
      <div class="coverletter-layout">
        <div class="coverletter-header">
          <div class="coverletter-header-left">
            <h2><i class="fas fa-envelope-open-text"></i> Cover Letter</h2>
            <p class="coverletter-subtitle">Write a professional cover letter with live preview.</p>
          </div>
          <button class="btn btn-ghost" onclick="CoverLetter.close()" title="Close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="coverletter-body">
          <div class="coverletter-form">
            <div class="coverletter-form-section">
              <div class="coverletter-form-title">Quick Templates</div>
              <div class="cl-template-row">
                <button class="btn btn-secondary btn-sm" onclick="CoverLetter.loadTemplate('standard')"><i class="fas fa-file-lines"></i> Standard</button>
                <button class="btn btn-secondary btn-sm" onclick="CoverLetter.loadTemplate('concise')"><i class="fas fa-bolt"></i> Concise</button>
                <button class="btn btn-secondary btn-sm" onclick="CoverLetter.loadTemplate('creative')"><i class="fas fa-palette"></i> Creative</button>
                <button class="btn btn-secondary btn-sm" onclick="CoverLetter.loadTemplate('executive')"><i class="fas fa-briefcase"></i> Executive</button>
              </div>
            </div>

            <div class="coverletter-form-section">
              <div class="coverletter-form-title">Recipient Details</div>
              <div class="form-group">
                <label>Hiring Manager Name</label>
                <input type="text" id="clRecipient" placeholder="Ms. Sarah Johnson" value="${escAttr(letterData.recipientName)}" oninput="CoverLetter.update()">
              </div>
              <div class="form-group">
                <label>Company Name</label>
                <input type="text" id="clCompany" placeholder="Tech Corp" value="${escAttr(letterData.company)}" oninput="CoverLetter.update()">
              </div>
              <div class="form-group">
                <label>Position Applied For</label>
                <input type="text" id="clPosition" placeholder="Senior Software Engineer" value="${escAttr(letterData.position)}" oninput="CoverLetter.update()">
              </div>
              <div class="form-group">
                <label>Recipient Address (optional)</label>
                <textarea id="clRecipientAddr" rows="2" placeholder="123 Business Ave, Suite 100&#10;San Francisco, CA 94105" oninput="CoverLetter.update()">${escAttr(letterData.recipientAddress)}</textarea>
              </div>
            </div>

            <div class="coverletter-form-section">
              <div class="coverletter-form-title">Letter Content</div>
              <div class="form-group">
                <label>Tone</label>
                <select id="clTone" onchange="CoverLetter.update()">
                  <option value="professional" ${letterData.tone === "professional" ? "selected" : ""}>Professional</option>
                  <option value="warm" ${letterData.tone === "warm" ? "selected" : ""}>Warm & Friendly</option>
                  <option value="confident" ${letterData.tone === "confident" ? "selected" : ""}>Confident & Direct</option>
                  <option value="creative" ${letterData.tone === "creative" ? "selected" : ""}>Creative</option>
                </select>
              </div>
              <div class="form-group">
                <label>Font Style</label>
                <select id="clFontStyle" onchange="CoverLetter.update()">
                  <option value="standard" ${letterData.fontStyle === "standard" ? "selected" : ""}>Standard (Sans-serif)</option>
                  <option value="serif" ${letterData.fontStyle === "serif" ? "selected" : ""}>Serif (Georgia)</option>
                  <option value="mono" ${letterData.fontStyle === "mono" ? "selected" : ""}>Monospace</option>
                  <option value="elegant" ${letterData.fontStyle === "elegant" ? "selected" : ""}>Elegant (Palatino)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Font Size: <span id="clFontSizeVal">${letterData.fontSize}pt</span></label>
                <input type="range" id="clFontSize" min="9" max="14" step="0.5" value="${letterData.fontSize}" oninput="CoverLetter.update()">
              </div>
              <div class="form-group">
                <label>Letter Body</label>
                <textarea id="clBody" rows="14" oninput="CoverLetter.update()" placeholder="Write your cover letter here...">${escAttr(letterData.body)}</textarea>
              </div>
              <div class="cl-word-count" id="clWordCount">0 words</div>
            </div>

            <div class="coverletter-form-section">
              <div class="coverletter-form-title">Your Info (from CV)</div>
              <div class="coverletter-info-display">
                <div><strong>${esc(p.fullName || "Not set")}</strong></div>
                <div>${esc(p.professionalTitle || "")}</div>
                <div>${esc(p.email || "")} ${p.phone ? "· " + esc(p.phone) : ""}</div>
                <div>${esc(p.location || "")}</div>
              </div>
              <div class="form-group" style="margin-top:0.75rem;">
                <label>Sender Address (optional, shown at top)</label>
                <textarea id="clSenderAddr" rows="2" placeholder="Your Street Address&#10;City, State ZIP" oninput="CoverLetter.update()">${escAttr(letterData.senderAddress)}</textarea>
              </div>
            </div>
          </div>

          <div class="coverletter-preview-area">
            <div class="coverletter-preview-toolbar">
              <span class="coverletter-preview-label">Live Preview</span>
              <div class="cl-preview-actions">
                <button class="btn btn-secondary btn-sm" onclick="CoverLetter.copyText()">
                  <i class="fas fa-copy"></i> Copy
                </button>
                <button class="btn btn-primary btn-sm" onclick="CoverLetter.exportPDF()">
                  <i class="fas fa-download"></i> Export PDF
                </button>
              </div>
            </div>
            <div class="coverletter-page" id="clPreview"></div>
          </div>
        </div>

        <div class="coverletter-footer">
          <button class="btn btn-secondary" onclick="CoverLetter.close()">
            <i class="fas fa-arrow-left"></i> Back to Preview
          </button>
        </div>
      </div>
    `;

    updatePreview();
  }

  function update() {
    letterData.recipientName = val("clRecipient");
    letterData.company = val("clCompany");
    letterData.position = val("clPosition");
    letterData.body = val("clBody");
    letterData.tone = val("clTone");
    letterData.recipientAddress = val("clRecipientAddr");
    letterData.senderAddress = val("clSenderAddr");
    letterData.fontStyle = val("clFontStyle");
    letterData.fontSize = val("clFontSize");

    // Update font size label
    const fsEl = document.getElementById("clFontSizeVal");
    if (fsEl) fsEl.textContent = letterData.fontSize + "pt";

    // Update word count
    const wcEl = document.getElementById("clWordCount");
    if (wcEl) {
      const words = letterData.body.split(/\s+/).filter(Boolean).length;
      wcEl.textContent = `${words} words ${words < 150 ? "· Consider adding more detail" : words > 400 ? "· Consider trimming" : "· Good length"}`;
    }

    updatePreview();
  }

  function loadTemplate(key) {
    if (TEMPLATES[key]) {
      letterData.body = TEMPLATES[key];
      render();
      toast("Template loaded");
    }
  }

  function copyText() {
    const p = cvData.personal || {};
    const text = `${letterData.senderAddress || p.location || ""}\n\n${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n\n${letterData.recipientName || "Hiring Manager"}\n${letterData.company || ""}\n${letterData.recipientAddress || ""}\n\nDear ${letterData.recipientName || "Hiring Manager"},\n\n${letterData.body}`;
    navigator.clipboard.writeText(text).then(() => {
      toast("Cover letter copied to clipboard");
    }).catch(() => {
      toast("Failed to copy");
    });
  }

  function updatePreview() {
    const p = cvData.personal || {};
    const container = document.getElementById("clPreview");
    if (!container) return;

    const recipient = letterData.recipientName || "Hiring Manager";
    const company = letterData.company || "[Company]";
    const position = letterData.position || "[Position]";
    const body = letterData.body || "";
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const fontMap = {
      standard: "'Inter', system-ui, sans-serif",
      serif: "Georgia, 'Times New Roman', serif",
      mono: "'Courier New', Courier, monospace",
      elegant: "'Palatino Linotype', 'Book Antiqua', serif"
    };
    const fontFamily = fontMap[letterData.fontStyle] || fontMap.standard;
    const fontSize = letterData.fontSize + "pt";

    const senderAddr = letterData.senderAddress || "";
    const recipientAddr = letterData.recipientAddress || "";

    container.innerHTML = `
      <div class="coverletter-document" style="font-family:${fontFamily}; font-size:${fontSize};">
        ${senderAddr ? `<div class="cl-sender-addr">${escBody(senderAddr)}</div>` : ''}
        <div class="cl-date">${dateStr}</div>
        ${recipientAddr ? `<div class="cl-recipient-addr">${escBody(recipientAddr)}</div>` : ''}
        <div class="cl-recipient">
          ${esc(recipient)}<br>
          ${esc(company)}<br>
        </div>
        <div class="cl-salutation">Dear ${esc(recipient)},</div>
        <div class="cl-body">${escBody(body)}</div>
        <div class="cl-signature">
          Sincerely,<br><br>
          <strong>${esc(p.fullName || "Your Name")}</strong>
          ${p.professionalTitle ? `<br><span style="font-size:0.85em;color:#666;">${esc(p.professionalTitle)}</span>` : ''}
          ${p.email ? `<br><span style="font-size:0.85em;color:#666;">${esc(p.email)}</span>` : ''}
          ${p.phone ? `<br><span style="font-size:0.85em;color:#666;">${esc(p.phone)}</span>` : ''}
        </div>
      </div>
    `;
  }

  function exportPDF() {
    // Hide everything except the cover letter preview for printing
    const style = document.createElement("style");
    style.id = "clPrintStyle";
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #clPreview, #clPreview * { visibility: visible !important; }
        #clPreview { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
        .coverletter-document { box-shadow: none !important; max-width: none !important; }
      }
    `;
    document.head.appendChild(style);
    setTimeout(() => {
      window.print();
      setTimeout(() => style.remove(), 500);
    }, 200);
  }

  function esc(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function escAttr(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function escBody(text) {
    if (!text) return "";
    return esc(text).replace(/\n/g, "<br>");
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  return {
    open, close, update, exportPDF, loadTemplate, copyText
  };
})();
