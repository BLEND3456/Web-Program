import { fabric } from 'fabric';

const MAX_EXPORT_SIDE = 8192;

const stripNonExportObjects = (canvas) => {
  canvas.getObjects()
    .filter((o) => o.isGridLine || o.excludeFromExport || o.isGuideLine)
    .forEach((o) => canvas.remove(o));
};

const sanitizeDesignSettings = (raw) => {
  if (!raw) return null;
  const settings = typeof raw === 'string' ? JSON.parse(raw) : { ...raw };
  delete settings.clipPath;
  return settings;
};

const calcMultiplier = (width, height, dpi) => {
  const base = dpi / 96;
  const maxSide = Math.max(width, height);
  if (maxSide * base <= MAX_EXPORT_SIDE) return base;
  return MAX_EXPORT_SIDE / maxSide;
};

const addCropMarks = (canvas, trimW, trimH, bleed) => {
  const x0 = bleed;
  const y0 = bleed;
  const x1 = bleed + trimW;
  const y1 = bleed + trimH;
  const m = Math.round(Math.min(trimW, trimH) * 0.02);
  const lines = [
    [x0 - m, y0, x0, y0], [x0, y0, x0, y0 - m],
    [x1, y0, x1 + m, y0], [x1, y0, x1, y0 - m],
    [x0 - m, y1, x0, y1], [x0, y1, x0, y1 + m],
    [x1, y1, x1 + m, y1], [x1, y1, x1, y1 + m],
  ];

  lines.forEach(([x1l, y1l, x2l, y2l]) => {
    canvas.add(new fabric.Line([x1l, y1l, x2l, y2l], {
      stroke: '#000000',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      excludeFromExport: false,
    }));
  });
};

const waitForLayout = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

const renderToCanvas = async (project, { bleeds = false, cropMarks = false } = {}) => {
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

  const settings = sanitizeDesignSettings(project.designSettings);
  if (settings && typeof settings === 'object') {
    await document.fonts.ready;
    await canvas.loadFromJSON(settings);
    stripNonExportObjects(canvas);
    canvas.clipPath = null;

    if (bleed) {
      canvas.getObjects().forEach((obj) => {
        obj.set({
          left: (obj.left || 0) + bleed,
          top: (obj.top || 0) + bleed,
        });
        obj.setCoords();
      });
    }

    if (cropMarks) {
      addCropMarks(canvas, w, h, bleed);
    }
  }

  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  canvas.setZoom(1);
  canvas.setWidth(totalW);
  canvas.setHeight(totalH);
  if (settings?.background) {
    canvas.backgroundColor = settings.background;
  }
  canvas.renderAll();
  await waitForLayout();
  canvas.renderAll();

  return { canvas, totalW, totalH, trimW: w, trimH: h };
};

export async function exportClientImage(project, { format = 'png', dpi = 300, bleeds = false, cropMarks = false } = {}) {
  const { canvas, totalW, totalH } = await renderToCanvas(project, { bleeds, cropMarks });
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
  const { canvas } = await renderToCanvas(project, { bleeds });
  try {
    return canvas.toSVG();
  } finally {
    canvas.dispose();
  }
}

export async function exportClientPdf(project, { dpi = 300, bleeds = false, cropMarks = false } = {}) {
  const { canvas, totalW, totalH } = await renderToCanvas(project, { bleeds, cropMarks });
  const multiplier = calcMultiplier(totalW, totalH, dpi);

  try {
    const dataUrl = canvas.toDataURL({
      format: 'jpeg',
      quality: 0.95,
      multiplier,
    });
    if (!dataUrl?.startsWith('data:image')) {
      throw new Error('Не удалось сформировать изображение для PDF');
    }

    const wPt = (totalW * 72) / dpi;
    const hPt = (totalH * 72) / dpi;
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: wPt > hPt ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [wPt, hPt],
      compress: true,
    });
    pdf.addImage(dataUrl, 'JPEG', 0, 0, wPt, hPt, undefined, 'FAST');
    return pdf.output('blob');
  } finally {
    canvas.dispose();
  }
}

/** Низкое разрешение для превью на странице экспорта */
export async function exportClientPreview(project) {
  try {
    return await exportClientImage(project, { format: 'jpeg', dpi: 72, bleeds: false });
  } catch {
    return null;
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
