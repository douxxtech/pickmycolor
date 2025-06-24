const { ipcRenderer } = require('electron');

let isTracking = true;
let currentColor = null;
let screenCanvas = null;
let screenCtx = null;
let screenImageData = null;
let displayInfo = null;

const overlay = document.getElementById('overlay');
const colorSwatch = document.getElementById('colorSwatch');
const hexValue = document.getElementById('hexValue');
const rgbValue = document.getElementById('rgbValue');
const magnifier = document.getElementById('magnifier');
const magnifierCanvas = document.getElementById('magnifierCanvas');
const magnifierCtx = magnifierCanvas.getContext('2d');

screenCanvas = document.createElement('canvas');
screenCtx = screenCanvas.getContext('2d');

async function initializeScreenCapture() {
  try {
    const captureData = await ipcRenderer.invoke('get-screen-capture');
    if (captureData) {
      displayInfo = {
        bounds: captureData.displayBounds,
        scaleFactor: captureData.scaleFactor
      };
      
      const img = new Image();
      img.onload = () => {
        screenCanvas.width = img.width;
        screenCanvas.height = img.height;
        screenCtx.drawImage(img, 0, 0);
        screenImageData = screenCtx.getImageData(0, 0, img.width, img.height);
        console.log('Screen capture initialized:', {
          imageSize: { width: img.width, height: img.height },
          displayBounds: displayInfo.bounds,
          scaleFactor: displayInfo.scaleFactor
        });
      };
      img.src = captureData.dataUrl;
    }
  } catch (error) {
    console.error('Error initializing screen capture:', error);
  }
}

function screenToImageCoords(screenX, screenY) {
  if (!displayInfo) return { x: screenX, y: screenY };
  
  const { bounds, scaleFactor } = displayInfo;
  
  const imageX = Math.floor((screenX - bounds.x) * scaleFactor);
  const imageY = Math.floor((screenY - bounds.y) * scaleFactor);
  
  return { x: imageX, y: imageY };
}

function getColorAtPixel(screenX, screenY) {
  if (!screenImageData) return null;
  
  const { x, y } = screenToImageCoords(screenX, screenY);
  const { width, height, data } = screenImageData;
  
  const clampedX = Math.max(0, Math.min(x, width - 1));
  const clampedY = Math.max(0, Math.min(y, height - 1));
  
  const index = (clampedY * width + clampedX) * 4;
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  
  const hex = rgbToHex(r, g, b);
  const rgb = `rgb(${r}, ${g}, ${b})`;
  
  return { hex, rgb, r, g, b };
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

overlay.addEventListener('mousemove', (e) => {
  if (!isTracking || !screenImageData) return;
  
  const screenX = e.screenX;
  const screenY = e.screenY;
  
  const colorData = getColorAtPixel(screenX, screenY);
  if (colorData) {
    currentColor = { ...colorData, position: { x: screenX, y: screenY } };
    updateColorPreview(currentColor);
    updateMagnifier(e.clientX, e.clientY, screenX, screenY);
  }
});

overlay.addEventListener('click', async (e) => {
  if (currentColor) {
    await ipcRenderer.invoke('color-selected', currentColor);
  }
});

overlay.addEventListener('contextmenu', async (e) => {
  e.preventDefault();
  await ipcRenderer.invoke('cancel-color-picking');
});

document.addEventListener('keydown', async (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    e.preventDefault();
    await ipcRenderer.invoke('cancel-color-picking');
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    await ipcRenderer.invoke('cancel-color-picking');
  }
});

function updateColorPreview(colorData) {
  colorSwatch.style.backgroundColor = colorData.hex;
  hexValue.textContent = colorData.hex;
  rgbValue.textContent = colorData.rgb;
}

function updateMagnifier(clientX, clientY, screenX, screenY) {
  if (!screenImageData || !displayInfo) return;
  
  const magnifierSize = 120;
  const offset = 20;
  
  let x = clientX + offset;
  let y = clientY - magnifierSize - offset;
  
  if (x + magnifierSize > window.innerWidth) {
    x = clientX - magnifierSize - offset;
  }
  if (y < 0) {
    y = clientY + offset;
  }
  
  magnifier.style.left = x + 'px';
  magnifier.style.top = y + 'px';
  magnifier.style.display = 'block';
  
  const magnificationFactor = 8;
  const captureSize = magnifierSize / magnificationFactor;
  const halfCapture = captureSize / 2;
  
  const sourceScreenX = screenX - halfCapture;
  const sourceScreenY = screenY - halfCapture;
  
  magnifierCtx.clearRect(0, 0, magnifierSize, magnifierSize);
  
  for (let py = 0; py < captureSize; py++) {
    for (let px = 0; px < captureSize; px++) {
      const color = getColorAtPixel(sourceScreenX + px, sourceScreenY + py);
      if (color) {
        magnifierCtx.fillStyle = color.hex;
        magnifierCtx.fillRect(
          px * magnificationFactor,
          py * magnificationFactor,
          magnificationFactor,
          magnificationFactor
        );
      }
    }
  }
  
  const centerX = magnifierSize / 2;
  const centerY = magnifierSize / 2;
  
  magnifierCtx.strokeStyle = currentColor && isColorLight(currentColor.hex) ? '#000000' : '#FFFFFF';
  magnifierCtx.lineWidth = 2;
  magnifierCtx.beginPath();
  magnifierCtx.moveTo(centerX, centerY - 10);
  magnifierCtx.lineTo(centerX, centerY + 10);
  magnifierCtx.moveTo(centerX - 10, centerY);
  magnifierCtx.lineTo(centerX + 10, centerY);
  magnifierCtx.stroke();
  
  magnifierCtx.strokeStyle = currentColor && isColorLight(currentColor.hex) ? '#000000' : '#FFFFFF';
  magnifierCtx.lineWidth = 1;
  magnifierCtx.strokeRect(
    centerX - magnificationFactor/2,
    centerY - magnificationFactor/2,
    magnificationFactor,
    magnificationFactor
  );
}

function isColorLight(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

overlay.addEventListener('mouseenter', () => {
  if (screenImageData) {
    magnifier.style.display = 'block';
  }
});

overlay.addEventListener('mouseleave', () => {
  magnifier.style.display = 'none';
});

document.addEventListener('DOMContentLoaded', async () => {
  isTracking = true;
  await initializeScreenCapture();
});