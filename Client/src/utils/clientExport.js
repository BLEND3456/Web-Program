import { fabric } from 'fabric';

const MAX_EXPORT_SIDE = 8192;

const stripNonExportObjects = (canvas) => {
  canvas.getObjects()
    .filter((o) => o.isGridLine || o.excludeFromExport || o.isGuideLine)
    .forEach((o) => canvas.remove(o));
};

const calcMultiplier = (width, height, dpi) => {
  const base = dpi / 96;
  const maxSide = Math.max(width, height);
  if (maxSide * base <= MAX_EXPORT_SIDE) return base;
  return MAX_EXPORT_SIDE / maxSide;
};

const renderToCanvas = async (project, bleeds) => {
  const w = Number(project.width) || 1200;
  const h = Number(project.height) || 1700;
  const bleed = bleeds ? Math.round(Math.min(w, h) * 0.03) : 0;
  const totalW = w + bleed * 2;
  const totalH = h + bleed * 2;

  const el = document.createElement('canvas');
  const canvas = new fabric.StaticCanvas(el, {
    width: w,
    height: h,
    backgroundColor: '#ffffff',
  });

  const raw = project.designSettings;
  const settings = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (settings && typeof settings === 'object') {
    await canvas.loadFromJSON(settings);
    stripNonExportObjects(canvas);
    if (bleed) {
      canvas.getObjects().forEach((obj) => {
        obj.set({
          left: (obj.left || 0) + bleed,
          top: (obj.top || 0) + bleed,
        });
        obj.setCoords();
      });
    }
  }

  canvas.setWidth(totalW);
  canvas.setHeight(totalH);
  if (settings?.background) {
    canvas.backgroundColor = settings.background;
  }
  canvas.renderAll();

  return { canvas, totalW, totalH };
};

export async function exportClientImage(project, { format = 'png', dpi = 300, bleeds = false } = {}) {
  const { canvas, totalW, totalH } = await renderToCanvas(project, bleeds);
  const multiplier = calcMultiplier(totalW, totalH, dpi);
  const isJpeg = format === 'jpg' || format === 'jpeg';

  try {
    const dataUrl = canvas.toDataURL({
      format: isJpeg ? 'jpeg' : 'png',
      quality: isJpeg ? 0.92 : 1,
      multiplier,
    });
    if (!dataUrl?.startsWith('data:image')) {
      throw new Error('Не удалось сформировать изображение');
    }
    return dataUrl;
  } catch (err) {
    if (err?.name === 'SecurityError') {
      throw new Error('Экспорт невозможен: изображения на холсте загружены без разрешения CORS');
    }
    throw err;
  } finally {
    canvas.dispose();
  }
}

export async function exportClientSvg(project, { bleeds = false } = {}) {
  const { canvas } = await renderToCanvas(project, bleeds);
  try {
    return canvas.toSVG();
  } finally {
    canvas.dispose();
  }
}

export function downloadDataUrl(dataUrl, fileName) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function downloadText(content, fileName, mime = 'image/svg+xml') {
  downloadBlob(new Blob([content], { type: mime }), fileName);
}

export function sanitizeFileName(name) {
  return (name || 'project')
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'project';
}
