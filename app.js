const fileInput = document.getElementById('file-input');
const uploadZone = document.getElementById('upload-zone');
const workspace = document.getElementById('workspace');
const workspaceWrapper = document.getElementById('workspace-wrapper');
const originalImage = document.getElementById('original-image');
const textLayer = document.getElementById('text-overlay');
const blocksList = document.getElementById('blocks-list');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
const aiInput = document.getElementById('ai-prompt');
const ollamaStatus = document.getElementById('ollama-status');

let selectedBlock = null;
let currentZoom = 1;
let isSelecting = false;
let startX, startY;
let selectionEl = null;

// Status Check
fetch('http://localhost:11434/api/tags').then(r => {
    if(r.ok) document.getElementById('status-text').innerText = 'IA: Online';
}).catch(() => {});

uploadZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        showLoader('Cargando...');
        const reader = new FileReader();
        reader.onload = (re) => {
            originalImage.src = re.target.result;
            originalImage.onload = () => {
                uploadZone.style.display = 'none';
                workspaceWrapper.style.display = 'block';
                hideLoader();
            };
        };
        reader.readAsDataURL(file);
    }
};

// --- Precision Selection Engine ---

workspace.onmousedown = (e) => {
    if (e.target !== workspace && e.target !== originalImage && e.target !== textLayer) return;
    
    isSelecting = true;
    const rect = workspace.getBoundingClientRect();
    startX = (e.clientX - rect.left) / currentZoom;
    startY = (e.clientY - rect.top) / currentZoom;

    selectionEl = document.createElement('div');
    selectionEl.className = 'selection-box';
    selectionEl.style.left = startX + 'px';
    selectionEl.style.top = startY + 'px';
    workspace.appendChild(selectionEl);
};

window.onmousemove = (e) => {
    if (!isSelecting) return;
    const rect = workspace.getBoundingClientRect();
    const curX = (e.clientX - rect.left) / currentZoom;
    const curY = (e.clientY - rect.top) / currentZoom;

    const w = Math.abs(curX - startX);
    const h = Math.abs(curY - startY);
    selectionEl.style.width = w + 'px';
    selectionEl.style.height = h + 'px';
    selectionEl.style.left = Math.min(curX, startX) + 'px';
    selectionEl.style.top = Math.min(curY, startY) + 'px';
};

window.onmouseup = async () => {
    if (!isSelecting) return;
    isSelecting = false;

    const w = parseFloat(selectionEl.style.width);
    const h = parseFloat(selectionEl.style.height);
    const l = parseFloat(selectionEl.style.left);
    const t = parseFloat(selectionEl.style.top);

    if (w > 10 && h > 10) {
        await processArea(l, t, w, h);
    }
    selectionEl.remove();
};

async function processArea(l, t, w, h) {
    showLoader('IA analizando área...');
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const sX = originalImage.naturalWidth / originalImage.clientWidth;
        const sY = originalImage.naturalHeight / originalImage.clientHeight;

        canvas.width = w * sX;
        canvas.height = h * sY;
        ctx.drawImage(originalImage, l * sX, t * sY, w * sX, h * sY, 0, 0, canvas.width, canvas.height);

        const res = await Tesseract.recognize(canvas.toDataURL(), 'spa');
        const text = res.data.text.trim();

        if (text) {
            addEditableBlock(l, t, w, h, text);
        }
    } catch (e) {
        alert('Error en selección');
    } finally {
        hideLoader();
    }
}

function addEditableBlock(l, t, w, h, text) {
    const block = document.createElement('div');
    block.className = 'editable-block editing';
    block.contentEditable = true;
    block.innerText = text;
    block.style.left = l + 'px';
    block.style.top = t + 'px';
    block.style.width = w + 'px';
    block.style.height = h + 'px';
    block.style.fontSize = Math.min(h / 3, 16) + 'px';

    const confirmBtn = document.createElement('button');
    confirmBtn.innerHTML = '✓';
    confirmBtn.className = 'confirm-btn';
    confirmBtn.style.display = 'flex'; // Always show while editing
    confirmBtn.onclick = (e) => {
        e.stopPropagation();
        confirmBlock(block);
    };
    block.appendChild(confirmBtn);

    block.onfocus = () => {
        selectedBlock = block;
        block.classList.remove('confirmed');
        block.classList.add('editing');
        confirmBtn.style.display = 'flex';
    };

    // Auto-save when clicking elsewhere
    block.onblur = () => {
        // Short delay to allow button clicks to register first
        setTimeout(() => confirmBlock(block), 100);
    };

    block.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            confirmBlock(block);
        }
    };

    textLayer.appendChild(block);
    block.focus();
}

function confirmBlock(block) {
    if (!block.classList.contains('editing')) return;
    
    block.classList.remove('editing');
    block.classList.add('confirmed');
    
    const btn = block.querySelector('.confirm-btn');
    if (btn) btn.style.display = 'none';
}

// UI Controls
function zoom(val) {
    currentZoom += val;
    workspace.style.transform = `scale(${currentZoom})`;
    workspace.style.transformOrigin = 'top left';
}

function applyStyle(prop, val) {
    if (selectedBlock) selectedBlock.style[prop] = val;
}

async function processWithAI() {
    if (!selectedBlock) return alert('Selecciona un cuadro primero');
    showLoader('Ollama pensando...');
    try {
        const r = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            body: JSON.stringify({
                model: 'llama3',
                prompt: `Edita este texto: "${selectedBlock.innerText}" siguiendo esta orden: ${aiInput.value}. Devuelve solo el resultado.`,
                stream: false
            })
        });
        const d = await r.json();
        selectedBlock.innerText = d.response.trim();
    } catch (e) { alert('IA Offline'); } finally { hideLoader(); }
}

async function exportAsImage() {
    showLoader('Guardando...');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = originalImage.naturalWidth;
    canvas.height = originalImage.naturalHeight;
    ctx.drawImage(originalImage, 0, 0);

    const sX = originalImage.naturalWidth / originalImage.clientWidth;
    const sY = originalImage.naturalHeight / originalImage.clientHeight;

    document.querySelectorAll('.editable-block').forEach(b => {
        const x = parseFloat(b.style.left) * sX;
        const y = parseFloat(b.style.top) * sY;
        const w = parseFloat(b.style.width) * sX;
        const h = parseFloat(b.style.height) * sY;
        const f = parseFloat(b.style.fontSize) * sY;

        ctx.fillStyle = 'white';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = b.style.color || 'black';
        ctx.font = `${f}px Inter, sans-serif`;
        ctx.fillText(b.innerText, x, y + f);
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.download = 'documento-editado.jpg';
    link.click();
    hideLoader();
}

function showLoader(t) { loader.style.display = 'flex'; loaderText.innerText = t; }
function hideLoader() { loader.style.display = 'none'; }
function quickAI(c) { aiInput.value = c; processWithAI(); }
