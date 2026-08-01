/* ==================================================
   Self-Made Editor
   Blank canvas editor with drag-and-drop elements,
   text/shape/image tools, and full property editing.
   ================================================== */

const SelfMadeEditor = (function () {

  let active = false;
  let cvData = null;
  let elements = []; // {id, type, x, y, w, h, props}
  let selectedId = null;
  let nextId = 1;
  let dragState = null; // {mode:'move'|'resize', startX, startY, origX, origY, origW, origH}

  function open(data) {
    cvData = data;
    active = true;
    elements = [];
    selectedId = null;
    nextId = 1;
    const appMain = document.getElementById('appMain');
    appMain.classList.add('editor-mode');
    render();
  }

  function close() {
    active = false;
    const appMain = document.getElementById('appMain');
    appMain.classList.remove('editor-mode');
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
              <div class="selfmade-tool-label">Add Element</div>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addText()" title="Add Text">
                <i class="fas fa-font"></i> Text
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addHeading()" title="Add Heading">
                <i class="fas fa-heading"></i> Heading
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addRect()" title="Add Rectangle">
                <i class="fas fa-square"></i> Rectangle
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addCircle()" title="Add Circle">
                <i class="fas fa-circle"></i> Circle
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addLine()" title="Add Line">
                <i class="fas fa-minus"></i> Line
              </button>
              <button class="selfmade-tool-btn" onclick="SelfMadeEditor.addImage()" title="Add Image">
                <i class="fas fa-image"></i> Image
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
            <button class="btn btn-primary" onclick="SelfMadeEditor.exportPDF()">
              <i class="fas fa-download"></i> Export PDF
            </button>
          </div>
        </div>

        <!-- Canvas Area -->
        <div class="selfmade-canvas-wrap">
          <div class="selfmade-canvas-toolbar">
            <span class="selfmade-canvas-label">Canvas — drag elements to position, click to select, drag corners to resize</span>
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

    if (el.type === 'text' || el.type === 'heading' || el.type === 'data') {
      const fs = el.props.fontSize || (el.type === 'heading' ? 24 : 14);
      const fw = el.props.fontWeight || (el.type === 'heading' ? 700 : 400);
      const color = el.props.color || '#333333';
      const ff = el.props.fontFamily || "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
      const align = el.props.textAlign || 'left';
      const italic = el.props.italic ? 'font-style:italic;' : '';
      const underline = el.props.underline ? 'text-decoration:underline;' : '';
      const bg = el.props.bgColor ? `background-color:${el.props.bgColor};` : '';
      const pad = 'padding:4px 8px;';
      const overflow = 'overflow:hidden; word-break:break-word;';
      return `<div class="selfmade-el${sel}" style="${baseStyle} ${bg} ${pad} ${overflow}" data-id="${el.id}" onmousedown="SelfMadeEditor.startDrag(event, ${el.id})">
        <div style="font-size:${fs}px; font-weight:${fw}; color:${color}; font-family:${ff}; text-align:${align}; ${italic} ${underline} line-height:1.3;">${escapeHTML2(el.props.text || 'Double-click to edit')}</div>
        ${sel ? renderResizeHandles() : ''}
      </div>`;
    }

    if (el.type === 'rect') {
      const bg = el.props.bgColor || '#E2E4E7';
      const border = el.props.borderColor ? `border:2px solid ${el.props.borderColor};` : '';
      const radius = el.props.borderRadius || 0;
      return `<div class="selfmade-el${sel}" style="${baseStyle} background-color:${bg}; ${border} border-radius:${radius}px;" data-id="${el.id}" onmousedown="SelfMadeEditor.startDrag(event, ${el.id})">
        ${sel ? renderResizeHandles() : ''}
      </div>`;
    }

    if (el.type === 'circle') {
      const bg = el.props.bgColor || '#6b8fad';
      const border = el.props.borderColor ? `border:2px solid ${el.props.borderColor};` : '';
      return `<div class="selfmade-el${sel}" style="${baseStyle} background-color:${bg}; ${border} border-radius:50%;" data-id="${el.id}" onmousedown="SelfMadeEditor.startDrag(event, ${el.id})">
        ${sel ? renderResizeHandles() : ''}
      </div>`;
    }

    if (el.type === 'line') {
      const color = el.props.bgColor || '#D1D5DB';
      const thickness = el.props.thickness || 2;
      return `<div class="selfmade-el${sel}" style="${baseStyle} background-color:${color}; height:${thickness}px;" data-id="${el.id}" onmousedown="SelfMadeEditor.startDrag(event, ${el.id})">
        ${sel ? renderResizeHandles() : ''}
      </div>`;
    }

    if (el.type === 'image') {
      const src = el.props.src || '';
      const fit = el.props.objectFit || 'cover';
      const radius = el.props.borderRadius || 0;
      return `<div class="selfmade-el${sel}" style="${baseStyle} overflow:hidden; border-radius:${radius}px;" data-id="${el.id}" onmousedown="SelfMadeEditor.startDrag(event, ${el.id})">
        ${src ? `<img src="${escapeHTML2(src)}" style="width:100%;height:100%;object-fit:${fit};display:block;">` : '<div style="width:100%;height:100%;background:#E2E8F0;display:flex;align-items:center;justify-content:center;color:#999;font-size:12px;">No Image</div>'}
        ${sel ? renderResizeHandles() : ''}
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

    canvas.addEventListener('mousedown', function (e) {
      // Click on empty canvas = deselect
      if (e.target === canvas) {
        selectElement(null);
      }
    });

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function startDrag(e, id) {
    e.stopPropagation();
    const el = elements.find(x => x.id === id);
    if (!el) return;

    // Check if clicking a resize handle
    const target = e.target;
    if (target.classList && target.classList.contains('selfmade-resize-handle')) {
      const resizeType = target.getAttribute('data-resize');
      dragState = {
        mode: 'resize',
        type: resizeType,
        startX: e.clientX,
        startY: e.clientY,
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
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
        id: id
      };
    }
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!dragState) return;
    const el = elements.find(x => x.id === dragState.id);
    if (!el) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    if (dragState.mode === 'move') {
      el.x = Math.max(0, dragState.origX + dx);
      el.y = Math.max(0, dragState.origY + dy);
    } else if (dragState.mode === 'resize') {
      if (dragState.type.includes('r')) {
        el.w = Math.max(20, dragState.origW + dx);
      }
      if (dragState.type.includes('b')) {
        el.h = Math.max(20, dragState.origH + dy);
      }
      if (dragState.type.includes('l')) {
        const newW = Math.max(20, dragState.origW - dx);
        el.x = dragState.origX + (dragState.origW - newW);
        el.w = newW;
      }
      if (dragState.type.includes('t')) {
        const newH = Math.max(20, dragState.origH - dy);
        el.y = dragState.origY + (dragState.origH - newH);
        el.h = newH;
      }
    }

    updateCanvasElement(el);
  }

  function onMouseUp() {
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

    if (el.type === 'text' || el.type === 'heading' || el.type === 'data') {
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

    if (el.type === 'rect' || el.type === 'circle') {
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

    if (el.type === 'line') {
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

    if (el.type === 'image') {
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
    // Re-render the element
    const canvas = document.getElementById('selfmadeCanvas');
    if (canvas) canvas.innerHTML = renderElements();
  }

  // ==================== ADD ELEMENTS ====================
  function addText() {
    const el = {
      id: nextId++, type: 'text', x: 50, y: 50, w: 200, h: 40,
      props: { text: 'New text element', fontSize: 14, fontWeight: 400, color: '#333333', textAlign: 'left' }
    };
    elements.push(el);
    selectElement(el.id);
  }

  function addHeading() {
    const el = {
      id: nextId++, type: 'heading', x: 50, y: 50, w: 300, h: 50,
      props: { text: 'New Heading', fontSize: 24, fontWeight: 700, color: '#1A202C', textAlign: 'left' }
    };
    elements.push(el);
    selectElement(el.id);
  }

  function addRect() {
    const el = {
      id: nextId++, type: 'rect', x: 50, y: 50, w: 150, h: 100,
      props: { bgColor: '#E2E4E7', borderColor: '', borderRadius: 0 }
    };
    elements.push(el);
    selectElement(el.id);
  }

  function addCircle() {
    const el = {
      id: nextId++, type: 'circle', x: 50, y: 50, w: 100, h: 100,
      props: { bgColor: '#6b8fad', borderColor: '' }
    };
    elements.push(el);
    selectElement(el.id);
  }

  function addLine() {
    const el = {
      id: nextId++, type: 'line', x: 50, y: 50, w: 300, h: 2,
      props: { bgColor: '#D1D5DB', thickness: 2 }
    };
    elements.push(el);
    selectElement(el.id);
  }

  function addImage() {
    const el = {
      id: nextId++, type: 'image', x: 50, y: 50, w: 120, h: 120,
      props: { src: '', objectFit: 'cover', borderRadius: 0 }
    };
    elements.push(el);
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
        if (p.photo) {
          const el = {
            id: nextId++, type: 'image', x: 50, y: 50, w: 100, h: 100,
            props: { src: p.photo, objectFit: 'cover', borderRadius: 50 }
          };
          elements.push(el);
          selectElement(el.id);
          return;
        }
        text = 'No photo uploaded';
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
    selectElement(el.id);
  }

  function deleteSelected() {
    if (!selectedId) return;
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
    const copy = JSON.parse(JSON.stringify(el));
    copy.id = nextId++;
    copy.x += 20;
    copy.y += 20;
    elements.push(copy);
    selectElement(copy.id);
  }

  function clearAll() {
    if (!confirm('Clear all elements from the canvas?')) return;
    elements = [];
    selectedId = null;
    const canvas = document.getElementById('selfmadeCanvas');
    if (canvas) canvas.innerHTML = '';
    renderProps();
  }

  function exportPDF() {
    // Deselect before print so handles don't show
    selectedId = null;
    const canvas = document.getElementById('selfmadeCanvas');
    if (canvas) canvas.innerHTML = renderElements();
    setTimeout(() => window.print(), 300);
  }

  function escapeHTML2(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    open, close, startDrag, setProp, setPropDeep, addText, addHeading,
    addRect, addCircle, addLine, addImage, insertData, deleteSelected,
    duplicateSelected, clearAll, exportPDF
  };
})();
