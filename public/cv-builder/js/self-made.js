/* ==================================================
   Self-Made Editor
   Blank canvas editor with drag-and-drop elements,
   text/shape/image tools, and full property editing.
   ================================================== */

const SelfMadeEditor = (function () {

  let active = false;
  let cvData = null;
  let elements = []; // {id, type, x, y, w, h, props, z}
  let selectedId = null;
  let nextId = 1;
  let dragState = null; // {mode:'move'|'resize', startX, startY, origX, origY, origW, origH}

  // Undo / Redo
  let history = [];
  let historyIndex = -1;
  const MAX_HISTORY = 50;

  // Snap to grid
  let snapToGrid = false;
  let gridSize = 10;

  // Touch support
  let touchMode = false;

  function open(data) {
    cvData = data;
    active = true;
    elements = [];
    selectedId = null;
    nextId = 1;
    history = [];
    historyIndex = -1;
    snapToGrid = false;
    pushHistory();
    const appMain = document.getElementById('appMain');
    appMain.classList.add('editor-mode');
    render();
  }

  function close() {
    active = false;
    const appMain = document.getElementById('appMain');
    appMain.classList.remove('editor-mode');
  }

  // ==================== UNDO / REDO ====================
  function pushHistory() {
    // Truncate any redo history
    history = history.slice(0, historyIndex + 1);
    history.push(JSON.stringify(elements));
    if (history.length > MAX_HISTORY) history.shift();
    historyIndex = history.length - 1;
  }

  function undo() {
    if (historyIndex <= 0) { toast('Nothing to undo'); return; }
    historyIndex--;
    elements = JSON.parse(history[historyIndex]);
    selectedId = null;
    const canvas = document.getElementById('selfmadeCanvas');
    if (canvas) canvas.innerHTML = renderElements();
    renderProps();
    toast('Undo');
  }

  function redo() {
    if (historyIndex >= history.length - 1) { toast('Nothing to redo'); return; }
    historyIndex++;
    elements = JSON.parse(history[historyIndex]);
    selectedId = null;
    const canvas = document.getElementById('selfmadeCanvas');
    if (canvas) canvas.innerHTML = renderElements();
    renderProps();
    toast('Redo');
  }

  // ==================== SNAP TO GRID ====================
  function snapVal(v) {
    if (!snapToGrid) return v;
    return Math.round(v / gridSize) * gridSize;
  }

  function toggleSnap() {
    snapToGrid = !snapToGrid;
    const btn = document.getElementById('smSnapBtn');
    if (btn) {
      btn.classList.toggle('active', snapToGrid);
      btn.style.background = snapToGrid ? 'var(--primary-light)' : '';
      btn.style.borderColor = snapToGrid ? 'var(--primary)' : '';
    }
    toast(snapToGrid ? 'Snap to grid ON (' + gridSize + 'px)' : 'Snap to grid OFF');
  }

  function setGridSize(size) {
    gridSize = parseInt(size) || 10;
    if (snapToGrid) toast('Grid size: ' + gridSize + 'px');
  }

  // ==================== LAYER MANAGEMENT ====================
  function bringForward() {
    if (!selectedId) return;
    const el = elements.find(x => x.id === selectedId);
    if (!el) return;
    const idx = elements.indexOf(el);
    if (idx < elements.length - 1) {
      pushHistory();
      elements.splice(idx, 1);
      elements.push(el);
      const canvas = document.getElementById('selfmadeCanvas');
      if (canvas) canvas.innerHTML = renderElements();
    }
  }

  function sendBackward() {
    if (!selectedId) return;
    const el = elements.find(x => x.id === selectedId);
    if (!el) return;
    const idx = elements.indexOf(el);
    if (idx > 0) {
      pushHistory();
      elements.splice(idx, 1);
      elements.unshift(el);
      const canvas = document.getElementById('selfmadeCanvas');
      if (canvas) canvas.innerHTML = renderElements();
    }
  }

  function render() {
    const appMain = document.getElementById('appMain');
    appMain.innerHTML = `
      <div class="selfmade-layout">
        <!-- Left Toolbar -->
        <div class="selfmade-toolbar" id="selfmadeToolbar">
          <div class="selfmade-toolbar-header">
            <h3><i class="fas fa-pen-ruler"></i> Self-Made Editor</h3>
            <button class="btn btn-ghost" onclick="SelfMadeEditor.close(); backToPreview();" title="Close">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="selfmade-tools">
            <div class="selfmade-tool-group">
              <div class="selfmade-tool-label">History</div>
              <div class="selfmade-tool-row">
                <button class="selfmade-tool-btn" onclick="SelfMadeEditor.undo()" title="Undo">
                  <i class="fas fa-rotate-left"></i> Undo
                </button>
                <button class="selfmade-tool-btn" onclick="SelfMadeEditor.redo()" title="Redo">
                  <i class="fas fa-rotate-right"></i> Redo
                </button>
              </div>
            </div>

            <div class="selfmade-tool-group">
              <div class="selfmade-tool-label">Text</div>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addText()" title="Add Text">
                <i class="fas fa-font"></i> Text
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addHeading()" title="Add Heading">
                <i class="fas fa-heading"></i> Heading
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addSubheading()" title="Add Subheading">
                <i class="fas fa-heading"></i> Subheading
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addParagraph()" title="Add Paragraph Block">
                <i class="fas fa-paragraph"></i> Paragraph
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addBulletList()" title="Add Bullet List">
                <i class="fas fa-list-ul"></i> Bullet List
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addNumberedList()" title="Add Numbered List">
                <i class="fas fa-list-ol"></i> Numbered List
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addQuote()" title="Add Quote">
                <i class="fas fa-quote-left"></i> Quote
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addLink()" title="Add Link">
                <i class="fas fa-link"></i> Link
              </button>
            </div>

            <div class="selfmade-tool-group">
              <div class="selfmade-tool-label">Shapes</div>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addRect()" title="Add Rectangle">
                <i class="fas fa-square"></i> Rectangle
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addCircle()" title="Add Circle">
                <i class="fas fa-circle"></i> Circle
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addTriangle()" title="Add Triangle">
                <i class="fas fa-play"></i> Triangle
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addDiamond()" title="Add Diamond">
                <i class="fas fa-diamond"></i> Diamond
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addHexagon()" title="Add Hexagon">
                <i class="fas fa-hexagon"></i> Hexagon
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addStar()" title="Add Star">
                <i class="fas fa-star"></i> Star
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addHeart()" title="Add Heart">
                <i class="fas fa-heart"></i> Heart
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addArrow()" title="Add Arrow">
                <i class="fas fa-arrow-right"></i> Arrow
              </button>
            </div>

            <div class="selfmade-tool-group">
              <div class="selfmade-tool-label">Lines & Dividers</div>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addLine()" title="Add Line">
                <i class="fas fa-minus"></i> Line
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addDashedLine()" title="Add Dashed Line">
                <i class="fas fa-minus"></i> Dashed Line
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addDoubleLine()" title="Add Double Line">
                <i class="fas fa-equals"></i> Double Line
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addDivider()" title="Add Section Divider">
                <i class="fas fa-grip-lines"></i> Divider
              </button>
            </div>

            <div class="selfmade-tool-group">
              <div class="selfmade-tool-label">Media</div>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addImage()" title="Add Image">
                <i class="fas fa-image"></i> Image
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addIcon()" title="Add Icon">
                <i class="fas fa-icons"></i> Icon
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addPhotoFrame()" title="Add Photo Frame">
                <i class="fas fa-id-badge"></i> Photo Frame
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addBarcode()" title="Add Barcode">
                <i class="fas fa-barcode"></i> Barcode
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addQRPlaceholder()" title="Add QR Code">
                <i class="fas fa-qrcode"></i> QR Code
              </button>
            </div>

            <div class="selfmade-tool-group">
              <div class="selfmade-tool-label">CV Components</div>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addSkillBar()" title="Add Skill Bar">
                <i class="fas fa-chart-bar"></i> Skill Bar
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addSkillTags()" title="Add Skill Tags">
                <i class="fas fa-tags"></i> Skill Tags
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addTimeline()" title="Add Timeline">
                <i class="fas fa-timeline"></i> Timeline
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addProgressBar()" title="Add Progress Bar">
                <i class="fas fa-tasks"></i> Progress Bar
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addBadge()" title="Add Badge">
                <i class="fas fa-certificate"></i> Badge
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addContactCard()" title="Add Contact Card">
                <i class="fas fa-address-card"></i> Contact Card
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addSocialIcons()" title="Add Social Icons">
                <i class="fas fa-share-nodes"></i> Social Icons
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addRating()" title="Add Rating Stars">
                <i class="fas fa-star-half-stroke"></i> Rating Stars
              </button>
            </div>

            <div class="selfmade-tool-group">
              <div class="selfmade-tool-label">Insert Data</div>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.insertData('fullName')" title="Full Name">
                <i class="fas fa-user"></i> Name
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.insertData('professionalTitle')" title="Title">
                <i class="fas fa-briefcase"></i> Title
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.insertData('email')" title="Email">
                <i class="fas fa-envelope"></i> Email
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.insertData('phone')" title="Phone">
                <i class="fas fa-phone"></i> Phone
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.insertData('location')" title="Location">
                <i class="fas fa-location-dot"></i> Location
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.insertData('summary')" title="Summary">
                <i class="fas fa-align-left"></i> Summary
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.insertData('photo')" title="Photo">
                <i class="fas fa-id-badge"></i> Photo
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.insertData('skills')" title="Skills List">
                <i class="fas fa-tools"></i> Skills
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.insertData('experience')" title="Experience List">
                <i class="fas fa-briefcase"></i> Experience
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.insertData('education')" title="Education List">
                <i class="fas fa-graduation-cap"></i> Education
              </button>
            </div>

            <div class="selfmade-tool-group">
              <div class="selfmade-tool-label">Canvas Options</div>
              <button class="selfmade-tool-btn" id="smSnapBtn" onclick="SelfMadeEditor.toggleSnap()" title="Toggle Snap to Grid">
                <i class="fas fa-border-all"></i> Snap to Grid
              </button>
              <div class="selfmade-tool-row">
                <label class="sm-grid-label">Grid</label>
                <select onchange="SelfMadeEditor.setGridSize(this.value)" class="sm-grid-select">
                  <option value="5">5px</option>
                  <option value="10" selected>10px</option>
                  <option value="15">15px</option>
                  <option value="20">20px</option>
                  <option value="25">25px</option>
                </select>
              </div>
            </div>

            <div class="selfmade-tool-group">
              <div class="selfmade-tool-label">Layers</div>
              <div class="selfmade-tool-row">
                <button class="selfmade-tool-btn" onclick="SelfMadeEditor.bringForward()" title="Bring Forward">
                  <i class="fas fa-arrow-up"></i> Forward
                </button>
                <button class="selfmade-tool-btn" onclick="SelfMadeEditor.sendBackward()" title="Send Backward">
                  <i class="fas fa-arrow-down"></i> Backward
                </button>
              </div>
            </div>

            <div class="selfmade-tool-group">
              <div class="selfmade-tool-label">Actions</div>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.deleteSelected()" title="Delete Selected">
                <i class="fas fa-trash"></i> Delete
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.duplicateSelected()" title="Duplicate">
                <i class="fas fa-copy"></i> Duplicate
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.clearAll()" title="Clear All">
                <i class="fas fa-broom"></i> Clear All
              </button>
            </div>
          </div>

          <div class="selfmade-toolbar-footer">
            <button class="btn btn-secondary" onclick="SelfMadeEditor.close(); backToPreview();">
              <i class="fas fa-arrow-left"></i> Back
            </button>
            <div class="selfmade-export-row">
              <button class="btn btn-primary" onclick="SelfMadeEditor.exportPDF()" title="Export PDF">
                <i class="fas fa-file-pdf"></i>
              </button>
              <button class="btn btn-secondary" onclick="SelfMadeEditor.exportPNG()" title="Export PNG">
                <i class="fas fa-file-image"></i>
              </button>
              <button class="btn btn-secondary" onclick="SelfMadeEditor.exportJPG()" title="Export JPG">
                <i class="fas fa-image"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Canvas Area -->
        <div class="selfmade-canvas-wrap">
          <div class="selfmade-canvas-toolbar">
            <span class="selfmade-canvas-label">Canvas — drag to move, tap to select, drag corners to resize (mouse + touch)</span>
          </div>
          <div class="selfmade-canvas" id="selfmadeCanvas">
            ${renderElements()}
          </div>
        </div>

        <!-- Right Properties Panel -->
        <div class="selfmade-props" id="selfmadeProps">
          <div class="selfmade-props-header">
            <h3><i class="fas fa-sliders"></i> Properties</h3>
          </div>
          <div class="selfmade-props-body" id="selfmadePropsBody">
            <p class="selfmade-props-empty">Select an element to edit its properties.</p>
          </div>
        </div>
      </div>
    `;

    bindCanvasEvents();
  }

  function renderElements() {
    return elements.map(el => renderElement(el)).join('');
  }

  function renderElement(el) {
    const sel = el.id === selectedId ? ' selfmade-el-selected' : '';
    const baseStyle = `position:absolute; left:${el.x}px; top:${el.y}px; width:${el.w}px; height:${el.h}px;`;
    const dragAttr = `onmousedown="SelfMadeEditor.startDrag(event, ${el.id})"`;
    const handles = sel ? renderResizeHandles() : '';

    // Text-like elements
    const textTypes = ['text', 'heading', 'subheading', 'paragraph', 'data', 'quote', 'link'];
    if (textTypes.includes(el.type)) {
      const fs = el.props.fontSize || (el.type === 'heading' ? 24 : el.type === 'subheading' ? 18 : 14);
      const fw = el.props.fontWeight || (el.type === 'heading' ? 700 : el.type === 'subheading' ? 600 : 400);
      const color = el.props.color || '#333333';
      const ff = el.props.fontFamily || "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
      const align = el.props.textAlign || 'left';
      const italic = el.props.italic ? 'font-style:italic;' : '';
      const underline = el.props.underline || el.type === 'link' ? 'text-decoration:underline;' : '';
      const bg = el.props.bgColor ? `background-color:${el.props.bgColor};` : '';
      const pad = 'padding:4px 8px;';
      const overflow = 'overflow:hidden; word-break:break-word;';
      const linkColor = el.type === 'link' ? (el.props.color || '#0066cc') : color;
      const quoteStyle = el.type === 'quote' ? 'border-left:3px solid #6b8fad; padding-left:12px; font-style:italic;' : '';
      return `<div class="selfmade-el${sel}" style="${baseStyle} ${bg} ${pad} ${overflow} ${quoteStyle}" data-id="${el.id}" ${dragAttr}>
        <div style="font-size:${fs}px; font-weight:${fw}; color:${linkColor}; font-family:${ff}; text-align:${align}; ${italic} ${underline} line-height:1.3;">${escapeHTML2(el.props.text || (el.type === 'link' ? 'Link Text' : 'Double-click to edit'))}</div>
        ${handles}
      </div>`;
    }

    // List elements
    if (el.type === 'bulletList' || el.type === 'numberedList') {
      const fs = el.props.fontSize || 13;
      const color = el.props.color || '#333333';
      const ff = el.props.fontFamily || "'Segoe UI', Roboto, sans-serif";
      const items = (el.props.text || 'Item 1\nItem 2\nItem 3').split('\n').filter(Boolean);
      const tag = el.type === 'numberedList' ? 'ol' : 'ul';
      const listStyle = el.type === 'numberedList' ? 'decimal' : 'disc';
      return `<div class="selfmade-el${sel}" style="${baseStyle} padding:4px 8px; overflow:hidden;" data-id="${el.id}" ${dragAttr}>
        <${tag} style="margin:0; padding-left:20px; font-size:${fs}px; color:${color}; font-family:${ff}; list-style-type:${listStyle}; line-height:1.6;">
          ${items.map(i => `<li>${escapeHTML2(i)}</li>`).join('')}
        </${tag}>
        ${handles}
      </div>`;
    }

    // Shape elements
    if (el.type === 'rect') {
      const bg = el.props.bgColor || '#E2E4E7';
      const border = el.props.borderColor ? `border:2px solid ${el.props.borderColor};` : '';
      const radius = el.props.borderRadius || 0;
      return `<div class="selfmade-el${sel}" style="${baseStyle} background-color:${bg}; ${border} border-radius:${radius}px;" data-id="${el.id}" ${dragAttr}>${handles}</div>`;
    }

    if (el.type === 'circle') {
      const bg = el.props.bgColor || '#6b8fad';
      const border = el.props.borderColor ? `border:2px solid ${el.props.borderColor};` : '';
      return `<div class="selfmade-el${sel}" style="${baseStyle} background-color:${bg}; ${border} border-radius:50%;" data-id="${el.id}" ${dragAttr}>${handles}</div>`;
    }

    if (el.type === 'triangle') {
      const bg = el.props.bgColor || '#6b8fad';
      return `<div class="selfmade-el${sel}" style="${baseStyle}" data-id="${el.id}" ${dragAttr}>
        <div style="width:0;height:0;border-left:${el.w/2}px solid transparent;border-right:${el.w/2}px solid transparent;border-bottom:${el.h}px solid ${bg};"></div>
        ${handles}
      </div>`;
    }

    if (el.type === 'diamond') {
      const bg = el.props.bgColor || '#6b8fad';
      return `<div class="selfmade-el${sel}" style="${baseStyle} background-color:${bg}; clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);" data-id="${el.id}" ${dragAttr}>${handles}</div>`;
    }

    if (el.type === 'hexagon') {
      const bg = el.props.bgColor || '#6b8fad';
      return `<div class="selfmade-el${sel}" style="${baseStyle} background-color:${bg}; clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);" data-id="${el.id}" ${dragAttr}>${handles}</div>`;
    }

    if (el.type === 'star') {
      const bg = el.props.bgColor || '#f59e0b';
      return `<div class="selfmade-el${sel}" style="${baseStyle} background-color:${bg}; clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);" data-id="${el.id}" ${dragAttr}>${handles}</div>`;
    }

    if (el.type === 'heart') {
      const bg = el.props.bgColor || '#ef4444';
      return `<div class="selfmade-el${sel}" style="${baseStyle} background-color:${bg}; clip-path:polygon(50% 100%,0% 35%,0% 15%,15% 0%,35% 0%,50% 15%,65% 0%,85% 0%,100% 15%,100% 35%);" data-id="${el.id}" ${dragAttr}>${handles}</div>`;
    }

    if (el.type === 'arrow') {
      const bg = el.props.bgColor || '#6b8fad';
      return `<div class="selfmade-el${sel}" style="${baseStyle} background-color:${bg}; clip-path:polygon(0% 40%,60% 40%,60% 15%,100% 50%,60% 85%,60% 60%,0% 60%);" data-id="${el.id}" ${dragAttr}>${handles}</div>`;
    }

    // Line elements
    if (el.type === 'line') {
      const color = el.props.bgColor || '#D1D5DB';
      const thickness = el.props.thickness || 2;
      return `<div class="selfmade-el${sel}" style="${baseStyle} background-color:${color}; height:${thickness}px;" data-id="${el.id}" ${dragAttr}>${handles}</div>`;
    }

    if (el.type === 'dashedLine') {
      const color = el.props.bgColor || '#D1D5DB';
      const thickness = el.props.thickness || 2;
      return `<div class="selfmade-el${sel}" style="${baseStyle} border-top:${thickness}px dashed ${color};" data-id="${el.id}" ${dragAttr}>${handles}</div>`;
    }

    if (el.type === 'doubleLine') {
      const color = el.props.bgColor || '#D1D5DB';
      const thickness = el.props.thickness || 3;
      return `<div class="selfmade-el${sel}" style="${baseStyle} border-top:${thickness}px double ${color}; border-bottom:${thickness}px double ${color}; height:${thickness*3}px;" data-id="${el.id}" ${dragAttr}>${handles}</div>`;
    }

    if (el.type === 'divider') {
      const color = el.props.bgColor || '#6b8fad';
      return `<div class="selfmade-el${sel}" style="${baseStyle} display:flex; align-items:center; gap:8px;" data-id="${el.id}" ${dragAttr}>
        <div style="flex:1;height:2px;background:${color};"></div>
        <div style="color:${color};font-size:14px;"><i class="fas fa-circle" style="font-size:6px;"></i></div>
        <div style="flex:1;height:2px;background:${color};"></div>
        ${handles}
      </div>`;
    }

    // Media elements
    if (el.type === 'image') {
      const src = el.props.src || '';
      const fit = el.props.objectFit || 'cover';
      const radius = el.props.borderRadius || 0;
      return `<div class="selfmade-el${sel}" style="${baseStyle} overflow:hidden; border-radius:${radius}px;" data-id="${el.id}" ${dragAttr}>
        ${src ? `<img src="${escapeHTML2(src)}" style="width:100%;height:100%;object-fit:${fit};display:block;">` : '<div style="width:100%;height:100%;background:#E2E8F0;display:flex;align-items:center;justify-content:center;color:#999;font-size:12px;">No Image</div>'}
        ${handles}
      </div>`;
    }

    if (el.type === 'icon') {
      const iconName = el.props.iconName || 'fa-star';
      const color = el.props.color || '#6b8fad';
      const size = el.props.fontSize || 24;
      return `<div class="selfmade-el${sel}" style="${baseStyle} display:flex; align-items:center; justify-content:center;" data-id="${el.id}" ${dragAttr}>
        <i class="fas ${escapeHTML2(iconName)}" style="font-size:${size}px; color:${color};"></i>
        ${handles}
      </div>`;
    }

    if (el.type === 'photoFrame') {
      const src = el.props.src || '';
      const radius = el.props.borderRadius || 50;
      const border = el.props.borderColor || '#6b8fad';
      return `<div class="selfmade-el${sel}" style="${baseStyle} display:flex; align-items:center; justify-content:center; border:3px solid ${border}; border-radius:${radius}%; overflow:hidden; box-sizing:border-box;" data-id="${el.id}" ${dragAttr}>
        ${src ? `<img src="${escapeHTML2(src)}" style="width:100%;height:100%;object-fit:cover;display:block;">` : '<div style="color:#999;font-size:11px;text-align:center;">Photo</div>'}
        ${handles}
      </div>`;
    }

    if (el.type === 'barcode') {
      const value = el.props.value || 'https://example.com';
      const format = el.props.format || 'CODE128';
      const barColor = el.props.barColor || '#000000';
      const bgColor = el.props.bgColor || '#ffffff';
      // Generate barcode SVG using JsBarcode
      let barcodeSvg = '';
      try {
        const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        if (typeof JsBarcode !== 'undefined') {
          JsBarcode(tempSvg, value, { format: format, lineColor: barColor, background: bgColor, width: 2, height: 40, displayValue: true, fontSize: 12, margin: 4 });
          barcodeSvg = tempSvg.outerHTML;
        }
      } catch(e) { /* fallback below */ }
      if (!barcodeSvg) {
        // Fallback: show value as text
        barcodeSvg = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:11px;color:#333;">' + escapeHTML2(value) + '</div>';
      }
      return `<div class="selfmade-el${sel}" style="${baseStyle} display:flex; align-items:center; justify-content:center; background:${bgColor}; border:1px solid #ddd; overflow:hidden;" data-id="${el.id}" ${dragAttr}>
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">${barcodeSvg.replace('<svg ', '<svg style="max-width:100%;max-height:100%;width:auto;height:auto;" ')}</div>
        ${handles}
      </div>`;
    }

    if (el.type === 'qrPlaceholder') {
      const value = el.props.value || 'https://example.com';
      const fgColor = el.props.fgColor || '#000000';
      const bgColor = el.props.bgColor || '#ffffff';
      // Generate QR code using qrcode-generator with custom colors
      let qrHtml = '';
      try {
        if (typeof qrcode !== 'undefined') {
          const qr = qrcode(0, 'M');
          qr.addData(value);
          qr.make();
          const moduleCount = qr.getModuleCount();
          // Build a table-based QR code with custom colors
          const totalSize = Math.min(el.w, el.h) - 8;
          const cellSize = Math.max(1, Math.floor(totalSize / moduleCount));
          const qrSize = cellSize * moduleCount;
          let cells = '';
          for (let r = 0; r < moduleCount; r++) {
            for (let c = 0; c < moduleCount; c++) {
              const isDark = qr.isDark(r, c);
              cells += '<div style="position:absolute;top:' + (r * cellSize) + 'px;left:' + (c * cellSize) + 'px;width:' + cellSize + 'px;height:' + cellSize + 'px;background:' + (isDark ? fgColor : bgColor) + ';"></div>';
            }
          }
          qrHtml = '<div style="position:relative;width:' + qrSize + 'px;height:' + qrSize + 'px;">' + cells + '</div>';
        }
      } catch(e) { /* fallback below */ }
      if (!qrHtml) {
        qrHtml = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:10px;color:#333;text-align:center;word-break:break-all;">' + escapeHTML2(value) + '</div>';
      }
      return `<div class="selfmade-el${sel}" style="${baseStyle} display:flex; align-items:center; justify-content:center; background:${bgColor}; border:1px solid #ddd; overflow:hidden; padding:4px; box-sizing:border-box;" data-id="${el.id}" ${dragAttr}>
        ${qrHtml}
        ${handles}
      </div>`;
    }

    // CV Component elements
    if (el.type === 'skillBar') {
      const label = el.props.text || 'Skill';
      const level = el.props.level || 75;
      const color = el.props.color || '#6b8fad';
      return `<div class="selfmade-el${sel}" style="${baseStyle} padding:4px 8px; display:flex; flex-direction:column; justify-content:center; gap:4px;" data-id="${el.id}" ${dragAttr}>
        <div style="display:flex; justify-content:space-between; font-size:11px; color:#333;">
          <span>${escapeHTML2(label)}</span><span>${level}%</span>
        </div>
        <div style="height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
          <div style="width:${level}%; height:100%; background:${color}; border-radius:3px;"></div>
        </div>
        ${handles}
      </div>`;
    }

    if (el.type === 'skillTags') {
      const tags = (el.props.text || 'JavaScript,Python,React,CSS,HTML').split(',').map(s => s.trim()).filter(Boolean);
      return `<div class="selfmade-el${sel}" style="${baseStyle} padding:4px 8px; display:flex; flex-wrap:wrap; gap:4px; align-content:flex-start;" data-id="${el.id}" ${dragAttr}>
        ${tags.map(t => `<span style="padding:2px 8px; background:#E0E7FF; color:#4338CA; border-radius:10px; font-size:11px;">${escapeHTML2(t)}</span>`).join('')}
        ${handles}
      </div>`;
    }

    if (el.type === 'timeline') {
      return `<div class="selfmade-el${sel}" style="${baseStyle} padding:8px; display:flex; flex-direction:column; gap:6px;" data-id="${el.id}" ${dragAttr}>
        <div style="display:flex; gap:8px; align-items:center;"><div style="width:10px;height:10px;border-radius:50%;background:#6b8fad;flex-shrink:0;"></div><div style="font-size:11px;color:#333;">2020 - Event 1</div></div>
        <div style="width:2px;height:12px;background:#ccc;margin-left:4px;"></div>
        <div style="display:flex; gap:8px; align-items:center;"><div style="width:10px;height:10px;border-radius:50%;background:#6b8fad;flex-shrink:0;"></div><div style="font-size:11px;color:#333;">2022 - Event 2</div></div>
        <div style="width:2px;height:12px;background:#ccc;margin-left:4px;"></div>
        <div style="display:flex; gap:8px; align-items:center;"><div style="width:10px;height:10px;border-radius:50%;background:#6b8fad;flex-shrink:0;"></div><div style="font-size:11px;color:#333;">2024 - Event 3</div></div>
        ${handles}
      </div>`;
    }

    if (el.type === 'progressBar') {
      const level = el.props.level || 60;
      const color = el.props.color || '#6b8fad';
      return `<div class="selfmade-el${sel}" style="${baseStyle} padding:4px 8px; display:flex; flex-direction:column; justify-content:center; gap:4px;" data-id="${el.id}" ${dragAttr}>
        <div style="height:8px; background:#E2E8F0; border-radius:4px; overflow:hidden;">
          <div style="width:${level}%; height:100%; background:${color}; border-radius:4px;"></div>
        </div>
        ${handles}
      </div>`;
    }

    if (el.type === 'badge') {
      const text = el.props.text || 'Badge';
      const color = el.props.color || '#6b8fad';
      return `<div class="selfmade-el${sel}" style="${baseStyle} display:flex; align-items:center; justify-content:center;" data-id="${el.id}" ${dragAttr}>
        <span style="padding:4px 12px; background:${color}; color:#fff; border-radius:12px; font-size:11px; font-weight:600;">${escapeHTML2(text)}</span>
        ${handles}
      </div>`;
    }

    if (el.type === 'contactCard') {
      const p = cvData.personal || {};
      return `<div class="selfmade-el${sel}" style="${baseStyle} padding:8px; display:flex; flex-direction:column; gap:4px; font-size:11px; color:#555;" data-id="${el.id}" ${dragAttr}>
        ${p.email ? `<div><i class="fas fa-envelope" style="color:#6b8fad;margin-right:4px;"></i>${escapeHTML2(p.email)}</div>` : ''}
        ${p.phone ? `<div><i class="fas fa-phone" style="color:#6b8fad;margin-right:4px;"></i>${escapeHTML2(p.phone)}</div>` : ''}
        ${p.location ? `<div><i class="fas fa-location-dot" style="color:#6b8fad;margin-right:4px;"></i>${escapeHTML2(p.location)}</div>` : ''}
        ${handles}
      </div>`;
    }

    if (el.type === 'socialIcons') {
      return `<div class="selfmade-el${sel}" style="${baseStyle} display:flex; align-items:center; justify-content:center; gap:8px;" data-id="${el.id}" ${dragAttr}>
        <i class="fab fa-linkedin" style="font-size:18px;color:#0077b5;"></i>
        <i class="fab fa-github" style="font-size:18px;color:#333;"></i>
        <i class="fab fa-twitter" style="font-size:18px;color:#1da1f2;"></i>
        <i class="fas fa-globe" style="font-size:18px;color:#6b8fad;"></i>
        ${handles}
      </div>`;
    }

    if (el.type === 'rating') {
      const rating = el.props.level || 4;
      return `<div class="selfmade-el${sel}" style="${baseStyle} display:flex; align-items:center; justify-content:center; gap:2px;" data-id="${el.id}" ${dragAttr}>
        ${[1,2,3,4,5].map(i => `<i class="fas fa-star" style="font-size:16px;color:${i<=rating?'#f59e0b':'#d1d5db'};"></i>`).join('')}
        ${handles}
      </div>`;
    }

    return '';
  }

  function renderResizeHandles() {
    return `
      <div class="selfmade-resize-handle selfmade-rh-tl" data-resize="tl"></div>
      <div class="selfmade-resize-handle selfmade-rh-tr" data-resize="tr"></div>
      <div class="selfmade-resize-handle selfmade-rh-bl" data-resize="bl"></div>
      <div class="selfmade-resize-handle selfmade-rh-br" data-resize="br"></div>
    `;
  }

  function bindCanvasEvents() {
    const canvas = document.getElementById('selfmadeCanvas');
    if (!canvas) return;

    // Mouse: deselect on empty canvas click
    canvas.addEventListener('mousedown', function (e) {
      if (e.target === canvas) selectElement(null);
    });

    // Touch: deselect on empty canvas tap
    canvas.addEventListener('touchstart', function (e) {
      if (e.target === canvas) selectElement(null);
    }, { passive: true });

    // Touch event delegation for elements — must be passive:false to call preventDefault
    canvas.addEventListener('touchstart', function (e) {
      const el = e.target.closest('.selfmade-el');
      if (el) {
        const id = parseInt(el.getAttribute('data-id'));
        if (id) startDrag(e, id);
      }
    }, { passive: false });

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);

    // Keyboard shortcuts
    document.addEventListener('keydown', onKeydown);
  }

  function onKeydown(e) {
    if (!active) return;
    // Don't intercept if typing in an input/textarea
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedId) {
        e.preventDefault();
        deleteSelected();
      }
    }
  }

  function startDrag(e, id) {
    e.stopPropagation();
    const el = elements.find(x => x.id === id);
    if (!el) return;

    // Support both mouse and touch events
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    // Check if clicking a resize handle
    const target = e.target;
    if (target.classList && target.classList.contains('selfmade-resize-handle')) {
      const resizeType = target.getAttribute('data-resize');
      dragState = {
        mode: 'resize',
        type: resizeType,
        startX: clientX,
        startY: clientY,
        origX: el.x,
        origY: el.y,
        origW: el.w,
        origH: el.h,
        id: id
      };
    } else {
      selectElement(id);
      dragState = {
        mode: 'move',
        startX: clientX,
        startY: clientY,
        origX: el.x,
        origY: el.y,
        id: id
      };
    }
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!dragState) return;
    handleDragMove(e.clientX, e.clientY);
  }

  function onTouchMove(e) {
    if (!dragState) return;
    if (e.touches && e.touches[0]) {
      e.preventDefault();
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  function handleDragMove(clientX, clientY) {
    const el = elements.find(x => x.id === dragState.id);
    if (!el) return;

    const dx = clientX - dragState.startX;
    const dy = clientY - dragState.startY;

    if (dragState.mode === 'move') {
      el.x = snapVal(Math.max(0, dragState.origX + dx));
      el.y = snapVal(Math.max(0, dragState.origY + dy));
    } else if (dragState.mode === 'resize') {
      if (dragState.type.includes('r')) {
        el.w = snapVal(Math.max(20, dragState.origW + dx));
      }
      if (dragState.type.includes('b')) {
        el.h = snapVal(Math.max(20, dragState.origH + dy));
      }
      if (dragState.type.includes('l')) {
        const newW = snapVal(Math.max(20, dragState.origW - dx));
        el.x = snapVal(dragState.origX + (dragState.origW - newW));
        el.w = newW;
      }
      if (dragState.type.includes('t')) {
        const newH = snapVal(Math.max(20, dragState.origH - dy));
        el.y = snapVal(dragState.origY + (dragState.origH - newH));
        el.h = newH;
      }
    }

    updateCanvasElement(el);
  }

  function onMouseUp() {
    if (dragState) pushHistory();
    dragState = null;
  }

  function onTouchEnd() {
    if (dragState) pushHistory();
    dragState = null;
  }

  function updateCanvasElement(el) {
    const dom = document.querySelector(`.selfmade-el[data-id="${el.id}"]`);
    if (!dom) return;
    dom.style.left = el.x + 'px';
    dom.style.top = el.y + 'px';
    dom.style.width = el.w + 'px';
    dom.style.height = el.h + 'px';
  }

  function selectElement(id) {
    if (selectedId === id) return; // No change — don't re-render
    selectedId = id;
    // Re-render canvas to show selection handles
    const canvas = document.getElementById('selfmadeCanvas');
    if (canvas) canvas.innerHTML = renderElements();
    renderProps();
  }

  function renderProps() {
    const body = document.getElementById('selfmadePropsBody');
    if (!body) return;

    if (!selectedId) {
      body.innerHTML = '<p class="selfmade-props-empty">Select an element to edit its properties.</p>';
      return;
    }

    const el = elements.find(x => x.id === selectedId);
    if (!el) return;

    let html = `
      <div class="prop-group">
        <div class="prop-group-title">Position & Size</div>
        <div class="prop-row">
          <label>X</label>
          <input type="number" value="${el.x}" oninput="SelfMadeEditor.setProp('x', this.value)">
        </div>
        <div class="prop-row">
          <label>Y</label>
          <input type="number" value="${el.y}" oninput="SelfMadeEditor.setProp('y', this.value)">
        </div>
        <div class="prop-row">
          <label>Width</label>
          <input type="number" value="${el.w}" oninput="SelfMadeEditor.setProp('w', this.value)">
        </div>
        <div class="prop-row">
          <label>Height</label>
          <input type="number" value="${el.h}" oninput="SelfMadeEditor.setProp('h', this.value)">
        </div>
      </div>
    `;

    if (el.type === 'text' || el.type === 'heading' || el.type === 'subheading' || el.type === 'paragraph' || el.type === 'data' || el.type === 'quote' || el.type === 'link') {
      html += `
        <div class="prop-group">
          <div class="prop-group-title">Text Content</div>
          <textarea oninput="SelfMadeEditor.setPropDeep('text', this.value)" rows="3">${escapeHTML2(el.props.text || '')}</textarea>
        </div>
        <div class="prop-group">
          <div class="prop-group-title">Typography</div>
          <div class="prop-row">
            <label>Font Size</label>
            <input type="number" value="${el.props.fontSize || 14}" oninput="SelfMadeEditor.setPropDeep('fontSize', this.value)">
          </div>
          <div class="prop-row">
            <label>Font Weight</label>
            <select onchange="SelfMadeEditor.setPropDeep('fontWeight', this.value)">
              <option value="300" ${el.props.fontWeight == 300 ? 'selected' : ''}>Light (300)</option>
              <option value="400" ${el.props.fontWeight == 400 || !el.props.fontWeight ? 'selected' : ''}>Regular (400)</option>
              <option value="500" ${el.props.fontWeight == 500 ? 'selected' : ''}>Medium (500)</option>
              <option value="600" ${el.props.fontWeight == 600 ? 'selected' : ''}>Semibold (600)</option>
              <option value="700" ${el.props.fontWeight == 700 ? 'selected' : ''}>Bold (700)</option>
              <option value="900" ${el.props.fontWeight == 900 ? 'selected' : ''}>Black (900)</option>
            </select>
          </div>
          <div class="prop-row">
            <label>Font Family</label>
            <select onchange="SelfMadeEditor.setPropDeep('fontFamily', this.value)">
              <option value="">Default</option>
              <option value="'Segoe UI', Roboto, sans-serif" ${el.props.fontFamily?.includes('Segoe') ? 'selected' : ''}>Segoe UI</option>
              <option value="'Inter', system-ui, sans-serif" ${el.props.fontFamily?.includes('Inter') ? 'selected' : ''}>Inter</option>
              <option value="Georgia, serif" ${el.props.fontFamily?.includes('Georgia') ? 'selected' : ''}>Georgia</option>
              <option value="'Courier New', monospace" ${el.props.fontFamily?.includes('Courier') ? 'selected' : ''}>Courier New</option>
              <option value="Impact, sans-serif" ${el.props.fontFamily?.includes('Impact') ? 'selected' : ''}>Impact</option>
            </select>
          </div>
          <div class="prop-row">
            <label>Text Color</label>
            <input type="color" value="${el.props.color || '#333333'}" oninput="SelfMadeEditor.setPropDeep('color', this.value)">
          </div>
          <div class="prop-row">
            <label>Background</label>
            <input type="color" value="${el.props.bgColor || '#ffffff'}" oninput="SelfMadeEditor.setPropDeep('bgColor', this.value)">
          </div>
          <div class="prop-row">
            <label>Text Align</label>
            <select onchange="SelfMadeEditor.setPropDeep('textAlign', this.value)">
              <option value="left" ${el.props.textAlign === 'left' || !el.props.textAlign ? 'selected' : ''}>Left</option>
              <option value="center" ${el.props.textAlign === 'center' ? 'selected' : ''}>Center</option>
              <option value="right" ${el.props.textAlign === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
          <div class="prop-row">
            <label class="custom-checkbox">
              <input type="checkbox" ${el.props.italic ? 'checked' : ''} onchange="SelfMadeEditor.setPropDeep('italic', this.checked)">
              <span>Italic</span>
            </label>
          </div>
          <div class="prop-row">
            <label class="custom-checkbox">
              <input type="checkbox" ${el.props.underline ? 'checked' : ''} onchange="SelfMadeEditor.setPropDeep('underline', this.checked)">
              <span>Underline</span>
            </label>
          </div>
        </div>
      `;
    }

    if (el.type === 'rect' || el.type === 'circle' || el.type === 'triangle' || el.type === 'diamond' || el.type === 'hexagon' || el.type === 'star' || el.type === 'heart' || el.type === 'arrow') {
      html += `
        <div class="prop-group">
          <div class="prop-group-title">Appearance</div>
          <div class="prop-row">
            <label>Fill Color</label>
            <input type="color" value="${el.props.bgColor || '#E2E4E7'}" oninput="SelfMadeEditor.setPropDeep('bgColor', this.value)">
          </div>
          <div class="prop-row">
            <label>Border Color</label>
            <input type="color" value="${el.props.borderColor || '#cccccc'}" oninput="SelfMadeEditor.setPropDeep('borderColor', this.value)">
          </div>
          ${el.type === 'rect' ? `
          <div class="prop-row">
            <label>Border Radius</label>
            <input type="number" value="${el.props.borderRadius || 0}" oninput="SelfMadeEditor.setPropDeep('borderRadius', this.value)">
          </div>
          ` : ''}
        </div>
      `;
    }

    if (el.type === 'line' || el.type === 'dashedLine' || el.type === 'doubleLine' || el.type === 'divider') {
      html += `
        <div class="prop-group">
          <div class="prop-group-title">Line</div>
          <div class="prop-row">
            <label>Color</label>
            <input type="color" value="${el.props.bgColor || '#D1D5DB'}" oninput="SelfMadeEditor.setPropDeep('bgColor', this.value)">
          </div>
          <div class="prop-row">
            <label>Thickness</label>
            <input type="number" value="${el.props.thickness || 2}" oninput="SelfMadeEditor.setPropDeep('thickness', this.value)">
          </div>
        </div>
      `;
    }

    if (el.type === 'image' || el.type === 'photoFrame') {
      html += `
        <div class="prop-group">
          <div class="prop-group-title">Image</div>
          <div class="prop-row">
            <label>Image URL</label>
            <input type="text" value="${escapeHTML2(el.props.src || '')}" oninput="SelfMadeEditor.setPropDeep('src', this.value)" placeholder="Paste image URL">
          </div>
          <div class="prop-row">
            <label>Object Fit</label>
            <select onchange="SelfMadeEditor.setPropDeep('objectFit', this.value)">
              <option value="cover" ${el.props.objectFit === 'cover' || !el.props.objectFit ? 'selected' : ''}>Cover</option>
              <option value="contain" ${el.props.objectFit === 'contain' ? 'selected' : ''}>Contain</option>
              <option value="fill" ${el.props.objectFit === 'fill' ? 'selected' : ''}>Fill</option>
            </select>
          </div>
          <div class="prop-row">
            <label>Border Radius</label>
            <input type="number" value="${el.props.borderRadius || 0}" oninput="SelfMadeEditor.setPropDeep('borderRadius', this.value)">
          </div>
        </div>
      `;
    }

    if (el.type === 'icon') {
      html += `
        <div class="prop-group">
          <div class="prop-group-title">Icon</div>
          <div class="prop-row">
            <label>Icon Name</label>
            <input type="text" value="${escapeHTML2(el.props.iconName || 'fa-star')}" oninput="SelfMadeEditor.setPropDeep('iconName', this.value)" placeholder="fa-star, fa-heart, fa-user...">
          </div>
          <div class="prop-row">
            <label>Size</label>
            <input type="number" value="${el.props.fontSize || 24}" oninput="SelfMadeEditor.setPropDeep('fontSize', this.value)">
          </div>
          <div class="prop-row">
            <label>Color</label>
            <input type="color" value="${el.props.color || '#6b8fad'}" oninput="SelfMadeEditor.setPropDeep('color', this.value)">
          </div>
        </div>
      `;
    }

    if (el.type === 'barcode') {
      html += `
        <div class="prop-group">
          <div class="prop-group-title">Barcode</div>
          <div class="prop-row">
            <label>Value / URL</label>
            <input type="text" value="${escapeHTML2(el.props.value || '')}" oninput="SelfMadeEditor.setPropDeep('value', this.value)" placeholder="Enter URL or text">
          </div>
          <div class="prop-row">
            <label>Format</label>
            <select onchange="SelfMadeEditor.setPropDeep('format', this.value)">
              <option value="CODE128" ${el.props.format === 'CODE128' || !el.props.format ? 'selected' : ''}>CODE128</option>
              <option value="CODE39" ${el.props.format === 'CODE39' ? 'selected' : ''}>CODE39</option>
              <option value="EAN13" ${el.props.format === 'EAN13' ? 'selected' : ''}>EAN-13</option>
              <option value="EAN8" ${el.props.format === 'EAN8' ? 'selected' : ''}>EAN-8</option>
              <option value="UPC" ${el.props.format === 'UPC' ? 'selected' : ''}>UPC</option>
              <option value="ITF14" ${el.props.format === 'ITF14' ? 'selected' : ''}>ITF-14</option>
              <option value="MSI" ${el.props.format === 'MSI' ? 'selected' : ''}>MSI</option>
              <option value="pharmacode" ${el.props.format === 'pharmacode' ? 'selected' : ''}>Pharmacode</option>
            </select>
          </div>
          <div class="prop-row">
            <label>Bar Color</label>
            <input type="color" value="${el.props.barColor || '#000000'}" oninput="SelfMadeEditor.setPropDeep('barColor', this.value)">
          </div>
          <div class="prop-row">
            <label>Background</label>
            <input type="color" value="${el.props.bgColor || '#ffffff'}" oninput="SelfMadeEditor.setPropDeep('bgColor', this.value)">
          </div>
        </div>
      `;
    }

    if (el.type === 'qrPlaceholder') {
      html += `
        <div class="prop-group">
          <div class="prop-group-title">QR Code</div>
          <div class="prop-row">
            <label>Value / URL</label>
            <input type="text" value="${escapeHTML2(el.props.value || '')}" oninput="SelfMadeEditor.setPropDeep('value', this.value)" placeholder="Enter URL or text">
          </div>
          <div class="prop-row">
            <label>Foreground</label>
            <input type="color" value="${el.props.fgColor || '#000000'}" oninput="SelfMadeEditor.setPropDeep('fgColor', this.value)">
          </div>
          <div class="prop-row">
            <label>Background</label>
            <input type="color" value="${el.props.bgColor || '#ffffff'}" oninput="SelfMadeEditor.setPropDeep('bgColor', this.value)">
          </div>
        </div>
      `;
    }

    if (el.type === 'skillBar' || el.type === 'progressBar') {
      html += `
        <div class="prop-group">
          <div class="prop-group-title">${el.type === 'skillBar' ? 'Skill Bar' : 'Progress Bar'}</div>
          ${el.type === 'skillBar' ? `
          <div class="prop-row">
            <label>Label</label>
            <input type="text" value="${escapeHTML2(el.props.text || '')}" oninput="SelfMadeEditor.setPropDeep('text', this.value)">
          </div>
          ` : ''}
          <div class="prop-row">
            <label>Level (%)</label>
            <input type="number" value="${el.props.level || 75}" min="0" max="100" oninput="SelfMadeEditor.setPropDeep('level', this.value)">
          </div>
          <div class="prop-row">
            <label>Color</label>
            <input type="color" value="${el.props.color || '#6b8fad'}" oninput="SelfMadeEditor.setPropDeep('color', this.value)">
          </div>
        </div>
      `;
    }

    if (el.type === 'skillTags' || el.type === 'bulletList' || el.type === 'numberedList') {
      html += `
        <div class="prop-group">
          <div class="prop-group-title">Content</div>
          <div class="prop-row">
            <label>Items</label>
            <textarea oninput="SelfMadeEditor.setPropDeep('text', this.value)" rows="3" placeholder="Comma-separated for tags, newline-separated for lists">${escapeHTML2(el.props.text || '')}</textarea>
          </div>
          <div class="prop-row">
            <label>Font Size</label>
            <input type="number" value="${el.props.fontSize || 13}" oninput="SelfMadeEditor.setPropDeep('fontSize', this.value)">
          </div>
          <div class="prop-row">
            <label>Color</label>
            <input type="color" value="${el.props.color || '#333333'}" oninput="SelfMadeEditor.setPropDeep('color', this.value)">
          </div>
        </div>
      `;
    }

    if (el.type === 'badge') {
      html += `
        <div class="prop-group">
          <div class="prop-group-title">Badge</div>
          <div class="prop-row">
            <label>Text</label>
            <input type="text" value="${escapeHTML2(el.props.text || '')}" oninput="SelfMadeEditor.setPropDeep('text', this.value)">
          </div>
          <div class="prop-row">
            <label>Color</label>
            <input type="color" value="${el.props.color || '#6b8fad'}" oninput="SelfMadeEditor.setPropDeep('color', this.value)">
          </div>
        </div>
      `;
    }

    if (el.type === 'rating') {
      html += `
        <div class="prop-group">
          <div class="prop-group-title">Rating</div>
          <div class="prop-row">
            <label>Stars (1-5)</label>
            <input type="number" value="${el.props.level || 4}" min="1" max="5" oninput="SelfMadeEditor.setPropDeep('level', this.value)">
          </div>
        </div>
      `;
    }

    body.innerHTML = html;
  }

  function setProp(key, value) {
    const el = elements.find(x => x.id === selectedId);
    if (!el) return;
    el[key] = parseInt(value) || 0;
    updateCanvasElement(el);
  }

  function setPropDeep(key, value) {
    const el = elements.find(x => x.id === selectedId);
    if (!el) return;
    el.props[key] = value;
    // Re-render only the changed element (not entire canvas, to preserve focus)
    const dom = document.querySelector(`.selfmade-el[data-id="${el.id}"]`);
    if (dom) {
      const tmp = document.createElement('div');
      tmp.innerHTML = renderElement(el);
      if (tmp.firstElementChild) {
        dom.outerHTML = tmp.firstElementChild.outerHTML;
      }
    }
  }

  // ==================== ADD ELEMENTS ====================
  function addText() {
    const el = {
      id: nextId++, type: 'text', x: 50, y: 50, w: 200, h: 40,
      props: { text: 'New text element', fontSize: 14, fontWeight: 400, color: '#333333', textAlign: 'left' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addHeading() {
    const el = {
      id: nextId++, type: 'heading', x: 50, y: 50, w: 300, h: 50,
      props: { text: 'New Heading', fontSize: 24, fontWeight: 700, color: '#1A202C', textAlign: 'left' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addSubheading() {
    const el = {
      id: nextId++, type: 'subheading', x: 50, y: 50, w: 250, h: 35,
      props: { text: 'Subheading', fontSize: 18, fontWeight: 600, color: '#2D3748', textAlign: 'left' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addParagraph() {
    const el = {
      id: nextId++, type: 'paragraph', x: 50, y: 50, w: 350, h: 80,
      props: { text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', fontSize: 13, fontWeight: 400, color: '#555555', textAlign: 'left' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addBulletList() {
    const el = {
      id: nextId++, type: 'bulletList', x: 50, y: 50, w: 250, h: 80,
      props: { text: 'First item\nSecond item\nThird item', fontSize: 13, color: '#333333' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addNumberedList() {
    const el = {
      id: nextId++, type: 'numberedList', x: 50, y: 50, w: 250, h: 80,
      props: { text: 'First item\nSecond item\nThird item', fontSize: 13, color: '#333333' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addQuote() {
    const el = {
      id: nextId++, type: 'quote', x: 50, y: 50, w: 300, h: 60,
      props: { text: 'The best way to predict the future is to create it.', fontSize: 14, fontWeight: 400, color: '#555555', textAlign: 'left', italic: true }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addLink() {
    const el = {
      id: nextId++, type: 'link', x: 50, y: 50, w: 200, h: 30,
      props: { text: 'Click here', fontSize: 13, fontWeight: 400, color: '#0066cc', textAlign: 'left', underline: true }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addRect() {
    const el = {
      id: nextId++, type: 'rect', x: 50, y: 50, w: 150, h: 100,
      props: { bgColor: '#E2E4E7', borderColor: '', borderRadius: 0 }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addCircle() {
    const el = {
      id: nextId++, type: 'circle', x: 50, y: 50, w: 100, h: 100,
      props: { bgColor: '#6b8fad', borderColor: '' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addTriangle() {
    const el = {
      id: nextId++, type: 'triangle', x: 50, y: 50, w: 100, h: 100,
      props: { bgColor: '#6b8fad' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addDiamond() {
    const el = {
      id: nextId++, type: 'diamond', x: 50, y: 50, w: 100, h: 100,
      props: { bgColor: '#6b8fad' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addHexagon() {
    const el = {
      id: nextId++, type: 'hexagon', x: 50, y: 50, w: 100, h: 100,
      props: { bgColor: '#6b8fad' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addStar() {
    const el = {
      id: nextId++, type: 'star', x: 50, y: 50, w: 100, h: 100,
      props: { bgColor: '#f59e0b' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addHeart() {
    const el = {
      id: nextId++, type: 'heart', x: 50, y: 50, w: 100, h: 100,
      props: { bgColor: '#ef4444' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addArrow() {
    const el = {
      id: nextId++, type: 'arrow', x: 50, y: 50, w: 120, h: 40,
      props: { bgColor: '#6b8fad' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addLine() {
    const el = {
      id: nextId++, type: 'line', x: 50, y: 50, w: 300, h: 2,
      props: { bgColor: '#D1D5DB', thickness: 2 }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addDashedLine() {
    const el = {
      id: nextId++, type: 'dashedLine', x: 50, y: 50, w: 300, h: 2,
      props: { bgColor: '#D1D5DB', thickness: 2 }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addDoubleLine() {
    const el = {
      id: nextId++, type: 'doubleLine', x: 50, y: 50, w: 300, h: 9,
      props: { bgColor: '#D1D5DB', thickness: 3 }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addDivider() {
    const el = {
      id: nextId++, type: 'divider', x: 50, y: 50, w: 300, h: 20,
      props: { bgColor: '#6b8fad' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addImage() {
    const el = {
      id: nextId++, type: 'image', x: 50, y: 50, w: 120, h: 120,
      props: { src: '', objectFit: 'cover', borderRadius: 0 }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addIcon() {
    const el = {
      id: nextId++, type: 'icon', x: 50, y: 50, w: 50, h: 50,
      props: { iconName: 'fa-star', fontSize: 24, color: '#6b8fad' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addPhotoFrame() {
    const el = {
      id: nextId++, type: 'photoFrame', x: 50, y: 50, w: 100, h: 100,
      props: { src: '', borderRadius: 50, borderColor: '#6b8fad' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addBarcode() {
    const el = {
      id: nextId++, type: 'barcode', x: 50, y: 50, w: 200, h: 60,
      props: { value: 'https://example.com', format: 'CODE128', barColor: '#000000', bgColor: '#ffffff' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addQRPlaceholder() {
    const el = {
      id: nextId++, type: 'qrPlaceholder', x: 50, y: 50, w: 120, h: 120,
      props: { value: 'https://example.com', fgColor: '#000000', bgColor: '#ffffff' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addSkillBar() {
    const el = {
      id: nextId++, type: 'skillBar', x: 50, y: 50, w: 250, h: 40,
      props: { text: 'Skill', level: 75, color: '#6b8fad' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addSkillTags() {
    const el = {
      id: nextId++, type: 'skillTags', x: 50, y: 50, w: 250, h: 60,
      props: { text: 'JavaScript,Python,React,CSS,HTML', fontSize: 11 }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addTimeline() {
    const el = {
      id: nextId++, type: 'timeline', x: 50, y: 50, w: 250, h: 120,
      props: {}
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addProgressBar() {
    const el = {
      id: nextId++, type: 'progressBar', x: 50, y: 50, w: 250, h: 20,
      props: { level: 60, color: '#6b8fad' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addBadge() {
    const el = {
      id: nextId++, type: 'badge', x: 50, y: 50, w: 120, h: 30,
      props: { text: 'Badge', color: '#6b8fad' }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addContactCard() {
    const el = {
      id: nextId++, type: 'contactCard', x: 50, y: 50, w: 200, h: 80,
      props: {}
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addSocialIcons() {
    const el = {
      id: nextId++, type: 'socialIcons', x: 50, y: 50, w: 150, h: 30,
      props: {}
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function addRating() {
    const el = {
      id: nextId++, type: 'rating', x: 50, y: 50, w: 120, h: 30,
      props: { level: 4 }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function insertData(field) {
    const p = cvData.personal || {};
    const s = cvData.summary || {};
    let text = '';
    let type = 'data';
    let w = 250, h = 40;

    switch (field) {
      case 'fullName':
        text = p.fullName || 'Your Name';
        w = 300; h = 50;
        break;
      case 'professionalTitle':
        text = p.professionalTitle || 'Professional Title';
        w = 250; h = 35;
        break;
      case 'email':
        text = p.email || 'email@example.com';
        w = 220; h = 30;
        break;
      case 'phone':
        text = p.phone || '+1 234 567 890';
        w = 180; h = 30;
        break;
      case 'location':
        text = p.location || 'City, Country';
        w = 200; h = 30;
        break;
      case 'summary':
        text = s.text || 'Your professional summary...';
        w = 350; h = 100;
        break;
      case 'photo':
        if (p.photo && !p.photo.startsWith('data:image/svg')) {
          const el = {
            id: nextId++, type: 'image', x: 50, y: 50, w: 100, h: 100,
            props: { src: p.photo, objectFit: 'cover', borderRadius: 50 }
          };
          elements.push(el);
          pushHistory();
          selectElement(el.id);
          return;
        }
        text = 'No photo uploaded';
        break;
      case 'skills':
        if (cvData.skills && cvData.skills.length) {
          const el = {
            id: nextId++, type: 'skillTags', x: 50, y: 50, w: 300, h: 60,
            props: { text: cvData.skills.map(sk => sk.name || sk.skill || sk).join(', '), fontSize: 11 }
          };
          elements.push(el);
          pushHistory();
          selectElement(el.id);
          return;
        }
        text = 'No skills added';
        break;
      case 'experience':
        if (cvData.experience && cvData.experience.length) {
          const items = cvData.experience.map(exp => `${exp.jobTitle || ''} at ${exp.company || ''}`).join('\n');
          const el = {
            id: nextId++, type: 'bulletList', x: 50, y: 50, w: 300, h: 100,
            props: { text: items, fontSize: 12, color: '#333333' }
          };
          elements.push(el);
          pushHistory();
          selectElement(el.id);
          return;
        }
        text = 'No experience added';
        break;
      case 'education':
        if (cvData.education && cvData.education.length) {
          const items = cvData.education.map(edu => `${edu.degree || ''} - ${edu.school || ''}`).join('\n');
          const el = {
            id: nextId++, type: 'bulletList', x: 50, y: 50, w: 300, h: 80,
            props: { text: items, fontSize: 12, color: '#333333' }
          };
          elements.push(el);
          pushHistory();
          selectElement(el.id);
          return;
        }
        text = 'No education added';
        break;
    }

    const el = {
      id: nextId++, type: type, x: 50, y: 50, w: w, h: h,
      props: {
        text: text,
        fontSize: field === 'fullName' ? 28 : (field === 'professionalTitle' ? 16 : 13),
        fontWeight: field === 'fullName' ? 700 : 400,
        color: field === 'fullName' ? '#1A202C' : '#555555',
        textAlign: 'left'
      }
    };
    elements.push(el);
    pushHistory();
    selectElement(el.id);
  }

  function deleteSelected() {
    if (!selectedId) return;
    pushHistory();
    elements = elements.filter(x => x.id !== selectedId);
    selectedId = null;
    const canvas = document.getElementById('selfmadeCanvas');
    if (canvas) canvas.innerHTML = renderElements();
    renderProps();
  }

  function duplicateSelected() {
    if (!selectedId) return;
    const el = elements.find(x => x.id === selectedId);
    if (!el) return;
    pushHistory();
    const copy = JSON.parse(JSON.stringify(el));
    copy.id = nextId++;
    copy.x += 20;
    copy.y += 20;
    elements.push(copy);
    selectElement(copy.id);
  }

  function clearAll() {
    if (!confirm('Clear all elements from the canvas?')) return;
    pushHistory();
    elements = [];
    selectedId = null;
    const canvas = document.getElementById('selfmadeCanvas');
    if (canvas) canvas.innerHTML = '';
    renderProps();
  }

  function exportPDF() {
    selectedId = null;
    const canvas = document.getElementById('selfmadeCanvas');
    if (canvas) canvas.innerHTML = renderElements();
    setTimeout(() => window.print(), 300);
  }

  function exportPNG() {
    exportCanvasImage('png');
  }

  function exportJPG() {
    exportCanvasImage('jpg');
  }

  function exportCanvasImage(format) {
    const canvas = document.getElementById('selfmadeCanvas');
    if (!canvas) return;
    selectedId = null;
    canvas.innerHTML = renderElements();

    // Use html2canvas approach via SVG foreignObject
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const clone = canvas.cloneNode(true);
    const data = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><foreignObject width="100%" height="100%">' +
      '<div xmlns="http://www.w3.org/1999/xhtml" style="width:' + w + 'px;height:' + h + 'px;">' +
      clone.innerHTML + '</div></foreignObject></svg>';

    const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = function () {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (format === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      c.toBlob(function (blob) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'cv-selfmade.' + format;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        toast(format.toUpperCase() + ' exported');
      }, format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      toast('Export failed — try PDF export instead');
    };
    img.src = url;
  }

  function escapeHTML2(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    open, close, startDrag, setProp, setPropDeep, addText, addHeading,
    addSubheading, addParagraph, addBulletList, addNumberedList, addQuote, addLink,
    addRect, addCircle, addTriangle, addDiamond, addHexagon, addStar, addHeart, addArrow,
    addLine, addDashedLine, addDoubleLine, addDivider,
    addImage, addIcon, addPhotoFrame, addBarcode, addQRPlaceholder,
    addSkillBar, addSkillTags, addTimeline, addProgressBar, addBadge, addContactCard, addSocialIcons, addRating,
    insertData, deleteSelected, duplicateSelected, clearAll,
    exportPDF, exportPNG, exportJPG,
    undo, redo, toggleSnap, setGridSize, bringForward, sendBackward
  };
})();
