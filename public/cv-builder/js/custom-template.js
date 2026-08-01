/* ==================================================
   Custom Template Editor
   Lets users customize colors, fonts, layout, and
   image properties of the selected template in real-time.
   ================================================== */

const CustomTemplateEditor = (function () {

  let active = false;
  let templateId = null;
  let data = null;
  let originalHtml = '';

  const defaults = {
    primaryColor: '',
    sidebarBg: '',
    textColor: '',
    accentColor: '',
    dividerColor: '',
    fontFamily: '',
    baseFontSize: '',
    headingScale: '1',
    boldHeadings: false,
    italicBody: false,
    uppercaseHeadings: false,
    sidebarWidth: '',
    borderRadius: '',
    photoShape: 'circle',
    photoSize: '',
    sectionSpacing: '',
    lineHeight: ''
  };

  let state = Object.assign({}, defaults);

  function open(tplId, cvData) {
    templateId = tplId;
    data = cvData;
    active = true;
    state = Object.assign({}, defaults);
    render();
  }

  function close() {
    active = false;
    removeStyleTag();
    const appMain = document.getElementById('appMain');
    appMain.classList.remove('editor-mode');
  }

  function render() {
    const tpl = window.CVTemplates[templateId];
    if (!tpl) return;

    const html = tpl.render(data);
    originalHtml = html;
    const appMain = document.getElementById('appMain');
    appMain.classList.add('editor-mode');

    appMain.innerHTML = `
      <div class="custom-editor-layout">
        <div class="custom-panel" id="customPanel">
          <div class="custom-panel-header">
            <h3><i class="fas fa-sliders"></i> Customize Template</h3>
            <button class="btn btn-ghost" onclick="CustomTemplateEditor.close(); backToPreview();" title="Close">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="custom-panel-body">
            ${section('Colors', 'fa-palette', `
              ${colorField('primaryColor', 'Primary / Accent', '#6b8fad')}
              ${colorField('sidebarBg', 'Sidebar Background', '#E2E4E7')}
              ${colorField('textColor', 'Text Color', '#2D3748')}
              ${colorField('accentColor', 'Secondary Accent', '#FF9966')}
              ${colorField('dividerColor', 'Divider Lines', '#D1D5DB')}
            `)}
            <div class="custom-field">
              <label class="custom-checkbox">
                <input type="checkbox" id="ctEnableColors" onchange="CustomTemplateEditor.update()">
                <span>Enable color overrides</span>
              </label>
            </div>

            ${section('Typography', 'fa-font', `
              <div class="custom-field">
                <label>Font Family</label>
                <select id="ctFontFamily" onchange="CustomTemplateEditor.update()">
                  <option value="">Default (template)</option>
                  <option value="'Segoe UI', Roboto, Helvetica, Arial, sans-serif">Segoe UI</option>
                  <option value="'Inter', system-ui, sans-serif">Inter</option>
                  <option value="Georgia, 'Times New Roman', serif">Georgia (Serif)</option>
                  <option value="'Courier New', Courier, monospace">Courier New (Mono)</option>
                  <option value="'Trebuchet MS', Helvetica, sans-serif">Trebuchet MS</option>
                  <option value="Verdana, Geneva, sans-serif">Verdana</option>
                  <option value="Impact, Charcoal, sans-serif">Impact</option>
                  <option value="'Palatino Linotype', 'Book Antiqua', serif">Palatino</option>
                  <option value="'Lucida Console', Monaco, monospace">Lucida Console</option>
                </select>
              </div>
              <div class="custom-field">
                <label>Base Font Size: <span id="ctFontSizeVal">--</span></label>
                <input type="range" id="ctBaseFontSize" min="8" max="16" step="0.5" value="11" oninput="CustomTemplateEditor.update()">
              </div>
              <div class="custom-field">
                <label>Heading Scale: <span id="ctHeadingScaleVal">1.0x</span></label>
                <input type="range" id="ctHeadingScale" min="0.8" max="2" step="0.1" value="1" oninput="CustomTemplateEditor.update()">
              </div>
              <div class="custom-field">
                <label>Line Height: <span id="ctLineHeightVal">--</span></label>
                <input type="range" id="ctLineHeight" min="1.2" max="2.5" step="0.1" value="1.5" oninput="CustomTemplateEditor.update()">
              </div>
              <div class="custom-field">
                <label class="custom-checkbox">
                  <input type="checkbox" id="ctBoldHeadings" onchange="CustomTemplateEditor.update()">
                  <span>Bold Headings</span>
                </label>
              </div>
              <div class="custom-field">
                <label class="custom-checkbox">
                  <input type="checkbox" id="ctItalicBody" onchange="CustomTemplateEditor.update()">
                  <span>Italic Body Text</span>
                </label>
              </div>
              <div class="custom-field">
                <label class="custom-checkbox">
                  <input type="checkbox" id="ctUppercaseHeadings" onchange="CustomTemplateEditor.update()">
                  <span>UPPERCASE Headings</span>
                </label>
              </div>
            `)}

            ${section('Layout', 'fa-table-columns', `
              <div class="custom-field">
                <label>Sidebar Width: <span id="ctSidebarWidthVal">--</span></label>
                <input type="range" id="ctSidebarWidth" min="25" max="45" step="1" value="33" oninput="CustomTemplateEditor.update()">
              </div>
              <div class="custom-field">
                <label>Border Radius: <span id="ctBorderRadiusVal">--</span></label>
                <input type="range" id="ctBorderRadius" min="0" max="20" step="1" value="4" oninput="CustomTemplateEditor.update()">
              </div>
              <div class="custom-field">
                <label>Section Spacing: <span id="ctSectionSpacingVal">--</span></label>
                <input type="range" id="ctSectionSpacing" min="10" max="50" step="2" value="25" oninput="CustomTemplateEditor.update()">
              </div>
            `)}

            ${section('Photo', 'fa-image', `
              <div class="custom-field">
                <label>Photo Shape</label>
                <select id="ctPhotoShape" onchange="CustomTemplateEditor.update()">
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                  <option value="rounded">Rounded</option>
                  <option value="hex">Hexagon (clip)</option>
                </select>
              </div>
              <div class="custom-field">
                <label>Photo Size: <span id="ctPhotoSizeVal">--</span></label>
                <input type="range" id="ctPhotoSize" min="60" max="160" step="5" value="90" oninput="CustomTemplateEditor.update()">
              </div>
            `)}

            <div class="custom-panel-footer">
              <button class="btn btn-secondary" onclick="CustomTemplateEditor.reset()">
                <i class="fas fa-rotate-left"></i> Reset
              </button>
              <button class="btn btn-primary" onclick="CustomTemplateEditor.exportPDF()">
                <i class="fas fa-download"></i> Export PDF
              </button>
            </div>
          </div>
        </div>

        <div class="custom-preview-area">
          <div class="custom-preview-toolbar">
            <button class="btn btn-secondary" onclick="CustomTemplateEditor.close(); backToPreview();">
              <i class="fas fa-arrow-left"></i> Back to Preview
            </button>
            <span class="custom-preview-label">Live Preview — changes apply in real-time</span>
          </div>
          <div class="cv-page" id="customCvPreview">${html}</div>
        </div>
      </div>
    `;

    applyOverrides();
    updateLabels();
  }

  function update() {
    readState();
    // Re-render fresh template HTML to avoid stacking overrides
    const container = document.getElementById('customCvPreview');
    if (container && originalHtml) {
      container.innerHTML = originalHtml;
    }
    applyOverrides();
    updateLabels();
  }

  function readState() {
    state.primaryColor = val2('ctPrimaryColor');
    state.sidebarBg = val2('ctSidebarBg');
    state.textColor = val2('ctTextColor');
    state.accentColor = val2('ctAccentColor');
    state.dividerColor = val2('ctDividerColor');
    state.fontFamily = val2('ctFontFamily');
    state.baseFontSize = val2('ctBaseFontSize');
    state.headingScale = val2('ctHeadingScale');
    state.lineHeight = val2('ctLineHeight');
    state.boldHeadings = checked2('ctBoldHeadings');
    state.italicBody = checked2('ctItalicBody');
    state.uppercaseHeadings = checked2('ctUppercaseHeadings');
    state.sidebarWidth = val2('ctSidebarWidth');
    state.borderRadius = val2('ctBorderRadius');
    state.sectionSpacing = val2('ctSectionSpacing');
    state.photoShape = val2('ctPhotoShape');
    state.photoSize = val2('ctPhotoSize');
  }

  function val2(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function checked2(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
  }

  function updateLabels() {
    const fs = val2('ctBaseFontSize');
    setText('ctFontSizeVal', fs ? fs + 'px' : '--');
    const hs = val2('ctHeadingScale');
    setText('ctHeadingScaleVal', hs ? parseFloat(hs).toFixed(1) + 'x' : '1.0x');
    const lh = val2('ctLineHeight');
    setText('ctLineHeightVal', lh ? lh : '--');
    const sw = val2('ctSidebarWidth');
    setText('ctSidebarWidthVal', sw ? sw + '%' : '--');
    const br = val2('ctBorderRadius');
    setText('ctBorderRadiusVal', br ? br + 'px' : '--');
    const ss = val2('ctSectionSpacing');
    setText('ctSectionSpacingVal', ss ? ss + 'px' : '--');
    const ps = val2('ctPhotoSize');
    setText('ctPhotoSizeVal', ps ? ps + 'px' : '--');

    // Update hex displays for color fields
    ['primaryColor', 'sidebarBg', 'textColor', 'accentColor', 'dividerColor'].forEach(id => {
      const colorVal = val2('ct' + id);
      setText('ct' + id + 'Hex', colorVal || '--');
    });
  }

  function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  function removeStyleTag() {
    const tag = document.getElementById('customOverrideStyle');
    if (tag) tag.remove();
  }

  function applyOverrides() {
    readState();
    removeStyleTag();

    const container = document.getElementById('customCvPreview');
    if (!container) return;

    // Build CSS overrides
    let css = '';

    // Font family
    if (state.fontFamily) {
      css += `#customCvPreview, #customCvPreview * { font-family: ${state.fontFamily} !important; }`;
    }

    // Base font size
    if (state.baseFontSize) {
      css += `#customCvPreview, #customCvPreview * { font-size: ${state.baseFontSize}px !important; }`;
      // Re-scale headings
      const hs = parseFloat(state.headingScale) || 1;
      css += `#customCvPreview h1 { font-size: ${parseFloat(state.baseFontSize) * 2.2 * hs}px !important; }`;
      css += `#customCvPreview h2 { font-size: ${parseFloat(state.baseFontSize) * 1.4 * hs}px !important; }`;
      css += `#customCvPreview h3 { font-size: ${parseFloat(state.baseFontSize) * 1.15 * hs}px !important; }`;
    }

    // Line height
    if (state.lineHeight) {
      css += `#customCvPreview p, #customCvPreview div, #customCvPreview span { line-height: ${state.lineHeight} !important; }`;
    }

    // Text color
    if (state.textColor) {
      css += `#customCvPreview { color: ${state.textColor} !important; }`;
      css += `#customCvPreview p, #customCvPreview div, #customCvPreview span { color: ${state.textColor} !important; }`;
    }

    // Bold headings
    if (state.boldHeadings) {
      css += `#customCvPreview h1, #customCvPreview h2, #customCvPreview h3 { font-weight: 900 !important; }`;
    }

    // Italic body
    if (state.italicBody) {
      css += `#customCvPreview p { font-style: italic !important; }`;
    }

    // Uppercase headings
    if (state.uppercaseHeadings) {
      css += `#customCvPreview h1, #customCvPreview h2, #customCvPreview h3 { text-transform: uppercase !important; }`;
    }

    // Border radius
    if (state.borderRadius) {
      css += `#customCvPreview, #customCvPreview * { border-radius: ${state.borderRadius}px !important; }`;
    }

    // Section spacing
    if (state.sectionSpacing) {
      css += `#customCvPreview > div > div > div { margin-bottom: ${state.sectionSpacing}px !important; }`;
    }

    // Divider color
    if (state.dividerColor) {
      css += `#customCvPreview hr, #customCvPreview .divider { border-color: ${state.dividerColor} !important; background: ${state.dividerColor} !important; }`;
      // Target divs used as dividers (height:1px or 2px with background)
      css += `#customCvPreview div[style*="border-bottom"] { border-bottom-color: ${state.dividerColor} !important; }`;
    }

    // Inject style
    const style = document.createElement('style');
    style.id = 'customOverrideStyle';
    style.textContent = css;
    document.head.appendChild(style);

    // DOM-level overrides (things CSS can't easily do with !important on inline styles)

    // Primary color: replace accent colors in inline styles
    const enableColors = checked2('ctEnableColors');
    if (enableColors) {
      const root = container.firstElementChild;
      if (root) {
        applyColorOverrides(root);
      }
    }

    // Photo shape & size
    applyPhotoOverrides();

    // Sidebar width
    if (state.sidebarWidth) {
      applySidebarWidth();
    }
  }

  function applyColorOverrides(root) {
    const enableColors = checked2('ctEnableColors');
    if (!enableColors) return;

    // Collect all unique hex colors used in the template to auto-detect roles
    const colorUsage = {};
    const all = root.querySelectorAll('*');
    all.forEach(el => {
      const style = el.getAttribute('style') || '';
      if (!style) return;

      let newStyle = style;

      // Primary color: replace any non-white, non-black, non-gray accent colors
      // These are typically the "brand" colors used in headings, section titles, icons, sidebar headers
      if (state.primaryColor) {
        // Replace accent colors in background-color
        newStyle = newStyle.replace(/background-color:\s*(#[0-9a-fA-F]{6})/gi, (match, hex) => {
          if (isAccentColor(hex)) return 'background-color: ' + state.primaryColor;
          return match;
        });
        // Replace accent colors in color (text)
        newStyle = newStyle.replace(/(^|;\s*)color:\s*(#[0-9a-fA-F]{6})/gi, (match, pre, hex) => {
          if (isAccentColor(hex)) return pre + 'color: ' + state.primaryColor;
          return match;
        });
        // Replace in border-color
        newStyle = newStyle.replace(/border-color:\s*(#[0-9a-fA-F]{6})/gi, (match, hex) => {
          if (isAccentColor(hex)) return 'border-color: ' + state.primaryColor;
          return match;
        });
        // Replace in border shorthand
        newStyle = newStyle.replace(/border(?:-top|-bottom|-left|-right)?:\s*[^;]*#([0-9a-fA-F]{6})[^;]*/gi, (match) => {
          if (/#[0-9a-fA-F]{6}/i.test(match) && isAccentColor(match.match(/#[0-9a-fA-F]{6}/i)[0])) {
            return match.replace(/#[0-9a-fA-F]{6}/gi, state.primaryColor);
          }
          return match;
        });
      }

      // Accent color: replace secondary accent colors
      if (state.accentColor) {
        newStyle = newStyle.replace(/#FF9966/gi, state.accentColor);
        newStyle = newStyle.replace(/#7ECB88/gi, state.accentColor);
        newStyle = newStyle.replace(/#FF6B6B/gi, state.accentColor);
        newStyle = newStyle.replace(/#FFB347/gi, state.accentColor);
      }

      // Sidebar background: replace light gray/cream backgrounds
      if (state.sidebarBg) {
        newStyle = newStyle.replace(/background-color:\s*(#E2E4E7|#EFECE6|#E1E4E7|#F0F2F5|#F5F5F5|#EAEAEA|#F7F5F2|#E8E4DD|#EDE9E0)/gi, 'background-color: ' + state.sidebarBg);
        // Also replace dark sidebar backgrounds (charcoal, dark green, etc.)
        newStyle = newStyle.replace(/background-color:\s*(#1A1A1A|#2D2D2D|#1E1E1E|#252525|#333333|#05520E|#033C0A|#1C1C1C|#222222|#2A2A2A|#363A40|#1A202C|#2D3748)/gi, 'background-color: ' + state.sidebarBg);
      }

      if (newStyle !== style) {
        el.setAttribute('style', newStyle);
      }
    });
  }

  // Helper: determine if a hex color is an "accent" color (not white, black, or gray)
  function isAccentColor(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substr(0, 2), 16);
    const g = parseInt(h.substr(2, 2), 16);
    const b = parseInt(h.substr(4, 2), 16);
    // Skip white, near-white, black, near-black, and grays
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    // Gray if R, G, B are close together (low saturation)
    if (diff < 25) return false; // gray/black/white
    // Skip very light pastels (probably backgrounds, not accents)
    if (max > 240 && min > 220) return false;
    return true;
  }

  function applyPhotoOverrides() {
    const container = document.getElementById('customCvPreview');
    if (!container) return;

    const imgs = container.querySelectorAll('img');
    imgs.forEach(img => {
      // Find parent containers that have border-radius (photo frames)
      let parent = img.parentElement;
      while (parent && parent !== container) {
        const ps = parent.getAttribute('style') || '';
        if (ps.includes('border-radius') || ps.includes('overflow:hidden') || (ps.includes('width:') && ps.includes('height:') && ps.includes('margin:'))) {
          let newStyle = ps;

          if (state.photoShape === 'circle') {
            newStyle = newStyle.replace(/border-radius:\s*[^;]+;?/gi, 'border-radius: 50%;');
            if (!/border-radius/i.test(newStyle)) newStyle += ' border-radius: 50%;';
          } else if (state.photoShape === 'square') {
            newStyle = newStyle.replace(/border-radius:\s*[^;]+;?/gi, 'border-radius: 0px;');
            if (!/border-radius/i.test(newStyle)) newStyle += ' border-radius: 0px;';
          } else if (state.photoShape === 'rounded') {
            newStyle = newStyle.replace(/border-radius:\s*[^;]+;?/gi, 'border-radius: 12px;');
            if (!/border-radius/i.test(newStyle)) newStyle += ' border-radius: 12px;';
          } else if (state.photoShape === 'hex') {
            newStyle = newStyle.replace(/border-radius:\s*[^;]+;?/gi, 'border-radius: 0px;');
            newStyle += ' clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);';
          }

          if (state.photoSize) {
            const sz = state.photoSize + 'px';
            newStyle = newStyle.replace(/width:\s*\d+px/gi, 'width: ' + sz);
            newStyle = newStyle.replace(/height:\s*\d+px/gi, 'height: ' + sz);
          }

          parent.setAttribute('style', newStyle);
          break;
        }
        parent = parent.parentElement;
      }
    });
  }

  function applySidebarWidth() {
    const container = document.getElementById('customCvPreview');
    if (!container) return;

    const root = container.firstElementChild;
    if (!root) return;

    // Look for display:flex children (sidebar layouts)
    const flexContainers = root.querySelectorAll('[style*="display:flex"], [style*="display: flex"]');
    flexContainers.forEach(fc => {
      const children = fc.children;
      if (children.length >= 2) {
        const first = children[0];
        const fs = first.getAttribute('style') || '';
        if (fs.includes('width:')) {
          let newStyle = fs.replace(/width:\s*\d+%/gi, 'width: ' + state.sidebarWidth + '%');
          first.setAttribute('style', newStyle);
        }
      }
    });
  }

  function reset() {
    state = Object.assign({}, defaults);
    render();
    toast('Customization reset');
  }

  function exportPDF() {
    setTimeout(() => window.print(), 300);
  }

  function section(title, icon, content) {
    return `
      <div class="custom-section">
        <div class="custom-section-title"><i class="fas ${icon}"></i> ${title}</div>
        ${content}
      </div>
    `;
  }

  function colorField(id, label, defaultColor) {
    return `
      <div class="custom-field">
        <label>${label}</label>
        <div class="color-input-row">
          <input type="color" id="ct${id}" value="${defaultColor}" oninput="CustomTemplateEditor.update()">
          <span class="color-hex-display" id="ct${id}Hex">${defaultColor}</span>
        </div>
      </div>
    `;
  }

  return {
    open, close, update, reset, exportPDF
  };
})();
