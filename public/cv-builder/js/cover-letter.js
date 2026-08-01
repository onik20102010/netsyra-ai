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
    tone: "professional"
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
                <label>Letter Body</label>
                <textarea id="clBody" rows="14" oninput="CoverLetter.update()" placeholder="Write your cover letter here...">${escAttr(letterData.body)}</textarea>
              </div>
            </div>

            <div class="coverletter-form-section">
              <div class="coverletter-form-title">Your Info (from CV)</div>
              <div class="coverletter-info-display">
                <div><strong>${esc(p.fullName || "Not set")}</strong></div>
                <div>${esc(p.professionalTitle || "")}</div>
                <div>${esc(p.email || "")} ${p.phone ? "· " + esc(p.phone) : ""}</div>
                <div>${esc(p.location || "")}</div>
              </div>
            </div>
          </div>

          <div class="coverletter-preview-area">
            <div class="coverletter-preview-toolbar">
              <span class="coverletter-preview-label">Live Preview</span>
              <button class="btn btn-primary btn-sm" onclick="CoverLetter.exportPDF()">
                <i class="fas fa-download"></i> Export PDF
              </button>
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
    updatePreview();
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

    container.innerHTML = `
      <div class="coverletter-document">
        <div class="cl-date">${dateStr}</div>
        <div class="cl-recipient">
          ${esc(recipient)}<br>
          ${esc(company)}<br>
        </div>
        <div class="cl-salutation">Dear ${esc(recipient)},</div>
        <div class="cl-body">${escBody(body)}</div>
        <div class="cl-signature">
          Sincerely,<br><br>
          <strong>${esc(p.fullName || "Your Name")}</strong>
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
    open, close, update, exportPDF
  };
})();
