(function () {
  const CANVAS_SIZE = 600;
  const DEFAULT_FONT = 'impact, sans-serif';

  const canvas = document.getElementById('memeCanvas');
  const ctx = canvas.getContext('2d');
  const uploadArea = document.getElementById('uploadArea');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const fileInput = document.getElementById('fileInput');
  const canvasContainer = document.getElementById('canvasContainer');
  const controls = document.getElementById('controls');
  const topTextInput = document.getElementById('topText');
  const bottomTextInput = document.getElementById('bottomText');
  const fontSizeInput = document.getElementById('fontSize');
  const fontSizeValue = document.getElementById('fontSizeValue');
  const textColorInput = document.getElementById('textColor');
  const downloadBtn = document.getElementById('downloadBtn');
  const changeImageBtn = document.getElementById('changeImageBtn');
  const templatesSection = document.getElementById('templatesSection');
  const uploadDivider = document.getElementById('uploadDivider');

  let sourceImage = null;
  let drawWidth = CANVAS_SIZE;
  let drawHeight = CANVAS_SIZE;
  let offsetX = 0;
  let offsetY = 0;

  // Draggable text positions (canvas coords). null = use default position
  let topTextPos = null;
  let bottomTextPos = null;
  let draggingText = null; // 'top' | 'bottom' | null
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  function loadImage(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      loadImageFromSrc(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  function loadImageFromUrl(url) {
    const img = new Image();
    img.onload = function () {
      loadImageFromSrc(img.src);
    };
    img.onerror = function () {
      console.error('Failed to load template image:', url);
    };
    img.src = url;
  }

  function loadImageFromSrc(src) {
    const img = new Image();
    img.onload = function () {
      sourceImage = img;
      topTextPos = null;
      bottomTextPos = null;
      fitImageToCanvas();
      templatesSection.hidden = true;
      uploadDivider.hidden = true;
      uploadArea.hidden = true;
      canvasContainer.hidden = false;
      controls.hidden = false;
      draw();
    };
    img.src = src;
  }

  function showImagePicker() {
    canvasContainer.hidden = true;
    controls.hidden = true;
    templatesSection.hidden = false;
    uploadDivider.hidden = false;
    uploadArea.hidden = false;
    sourceImage = null;
    topTextPos = null;
    bottomTextPos = null;
  }

  function fitImageToCanvas() {
    if (!sourceImage) return;
    const imgAspect = sourceImage.width / sourceImage.height;
    const canvasAspect = 1;
    if (imgAspect > canvasAspect) {
      drawWidth = CANVAS_SIZE;
      drawHeight = CANVAS_SIZE / imgAspect;
      offsetX = 0;
      offsetY = (CANVAS_SIZE - drawHeight) / 2;
    } else {
      drawHeight = CANVAS_SIZE;
      drawWidth = CANVAS_SIZE * imgAspect;
      offsetX = (CANVAS_SIZE - drawWidth) / 2;
      offsetY = 0;
    }
  }

  function getLines(text) {
    const lines = text.split('\n');
    if (lines.length === 1 && lines[0] === '') return [];
    return lines;
  }

  function getTextBlockBounds(lines, centerX, centerY, lineHeight) {
    if (lines.length === 0) return null;
    const totalHeight = lines.length * lineHeight;
    const halfHeight = totalHeight / 2;
    const maxLineWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const halfWidth = maxLineWidth / 2;
    const padding = lineHeight * 0.3;
    return {
      left: centerX - halfWidth - padding,
      right: centerX + halfWidth + padding,
      top: centerY - halfHeight - padding,
      bottom: centerY + halfHeight + padding,
    };
  }

  function drawTextBlock(text, centerX, centerY, lineHeight, fillColor) {
    const lines = getLines(text);
    if (lines.length === 0) return;
    const totalHeight = lines.length * lineHeight;
    const startY = centerY - totalHeight / 2 + lineHeight / 2;
    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      ctx.strokeText(line, centerX, y);
      ctx.fillStyle = fillColor;
      ctx.fillText(line, centerX, y);
    });
  }

  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function hitTestBounds(bounds, x, y) {
    if (!bounds) return false;
    return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
  }

  function getDefaultTopPosition(lineHeight) {
    const lines = getLines(topTextInput.value.trim());
    const totalHeight = lines.length * lineHeight;
    return { x: CANVAS_SIZE / 2, y: CANVAS_SIZE * 0.1 + totalHeight / 2 };
  }

  function getDefaultBottomPosition(lineHeight) {
    const lines = getLines(bottomTextInput.value.trim());
    const totalHeight = lines.length * lineHeight;
    return { x: CANVAS_SIZE / 2, y: CANVAS_SIZE * 0.9 - totalHeight / 2 };
  }

  function draw() {
    if (!ctx) return;
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    if (sourceImage) {
      ctx.drawImage(sourceImage, offsetX, offsetY, drawWidth, drawHeight);
    }
    const fontSize = Number(fontSizeInput.value);
    const topText = topTextInput.value.trim();
    const bottomText = bottomTextInput.value.trim();
    ctx.font = `${fontSize}px ${DEFAULT_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = Math.max(2, Math.floor(fontSize / 16));
    ctx.lineJoin = 'round';
    const lineHeight = fontSize * 1.2;
    const fillColor = textColorInput.value;

    const topPos = topTextPos || getDefaultTopPosition(lineHeight);
    const bottomPos = bottomTextPos || getDefaultBottomPosition(lineHeight);

    if (topText) {
      drawTextBlock(topText, topPos.x, topPos.y, lineHeight, fillColor);
    }
    if (bottomText) {
      drawTextBlock(bottomText, bottomPos.x, bottomPos.y, lineHeight, fillColor);
    }
  }

  function updateFontSizeLabel() {
    fontSizeValue.textContent = fontSizeInput.value;
  }

  function downloadMeme() {
    if (!sourceImage) return;
    const link = document.createElement('a');
    link.download = 'meme.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  document.querySelectorAll('.template-thumb').forEach((btn) => {
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-src');
      if (src) loadImageFromUrl(src);
    });
  });

  uploadArea.addEventListener('click', () => fileInput.click());
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    loadImage(file);
  });
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    loadImage(file);
  });

  function setupTextInput(el) {
    el.addEventListener('input', draw);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
      }
    });
  }
  setupTextInput(topTextInput);
  setupTextInput(bottomTextInput);
  fontSizeInput.addEventListener('input', () => {
    updateFontSizeLabel();
    draw();
  });
  textColorInput.addEventListener('input', draw);
  textColorInput.addEventListener('change', draw);
  function setupCanvasContext() {
    const fontSize = Number(fontSizeInput.value);
    ctx.font = `${fontSize}px ${DEFAULT_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    return fontSize * 1.2;
  }

  function getTextBlockAt(canvasX, canvasY) {
    const lineHeight = setupCanvasContext();
    const topText = topTextInput.value.trim();
    const bottomText = bottomTextInput.value.trim();
    const topPos = topTextPos || getDefaultTopPosition(lineHeight);
    const bottomPos = bottomTextPos || getDefaultBottomPosition(lineHeight);

    if (bottomText) {
      const bottomLines = getLines(bottomText);
      const bottomBounds = getTextBlockBounds(bottomLines, bottomPos.x, bottomPos.y, lineHeight);
      if (hitTestBounds(bottomBounds, canvasX, canvasY)) return { which: 'bottom', pos: bottomPos };
    }
    if (topText) {
      const topLines = getLines(topText);
      const topBounds = getTextBlockBounds(topLines, topPos.x, topPos.y, lineHeight);
      if (hitTestBounds(topBounds, canvasX, canvasY)) return { which: 'top', pos: topPos };
    }
    return null;
  }

  canvas.addEventListener('mousedown', (e) => {
    if (!sourceImage) return;
    const { x, y } = getCanvasCoords(e);
    const hit = getTextBlockAt(x, y);
    if (hit) {
      draggingText = hit.which;
      dragOffsetX = x - hit.pos.x;
      dragOffsetY = y - hit.pos.y;
      canvas.style.cursor = 'grabbing';
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!sourceImage) return;
    if (draggingText) {
      const { x, y } = getCanvasCoords(e);
      const newX = x - dragOffsetX;
      const newY = y - dragOffsetY;
      if (draggingText === 'top') {
        topTextPos = { x: newX, y: newY };
      } else {
        bottomTextPos = { x: newX, y: newY };
      }
      draw();
    } else {
      const coords = getCanvasCoords(e);
      const hit = getTextBlockAt(coords.x, coords.y);
      canvas.style.cursor = hit ? 'grab' : 'default';
    }
  });

  canvas.addEventListener('mouseup', () => {
    draggingText = null;
    canvas.style.cursor = 'default';
  });

  canvas.addEventListener('mouseleave', () => {
    draggingText = null;
    canvas.style.cursor = 'default';
  });

  downloadBtn.addEventListener('click', downloadMeme);
  changeImageBtn.addEventListener('click', showImagePicker);

  updateFontSizeLabel();
})();
