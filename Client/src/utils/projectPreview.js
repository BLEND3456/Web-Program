import { fabric } from 'fabric';
import { PLACEHOLDER_JSON_PROPS } from './imagePlaceholder';

export const CANVAS_JSON_PROPS = [
  'isGridLine',
  'excludeFromExport',
  'isGuideLine',
  'customName',
  'id',
  ...PLACEHOLDER_JSON_PROPS,
];

/** JSON для сохранения/экспорта — без служебного clipPath редактора */
export function canvasToDesignSettings(canvas, pageWidth, pageHeight) {
  if (!canvas) return null;
  const json = canvas.toJSON(CANVAS_JSON_PROPS);
  delete json.clipPath;
  if (pageWidth > 0) json.width = Math.round(pageWidth);
  if (pageHeight > 0) json.height = Math.round(pageHeight);
  return json;
}

export function applyPageClip(canvas, pageW, pageH) {
  if (!canvas) return;
  canvas.clipPath = new fabric.Rect({
    left: 0,
    top: 0,
    width: pageW,
    height: pageH,
    absolutePositioned: true,
  });
}

/** Убираем метаданные, из‑за которых Fabric меняет размер холста при loadFromJSON */
export function prepareDesignJSON(designSettings) {
  const raw = typeof designSettings === 'string' ? JSON.parse(designSettings) : designSettings;
  const json = JSON.parse(JSON.stringify(raw));
  delete json.width;
  delete json.height;
  delete json.clipPath;
  return json;
}

export function restoreCanvasViewport(canvas, pageWidth, pageHeight, zoom) {
  if (!canvas || !pageWidth || !pageHeight) return;
  const z = zoom ?? canvas.getZoom();
  canvas.setZoom(z);
  canvas.setWidth(pageWidth * z);
  canvas.setHeight(pageHeight * z);
  applyPageClip(canvas, pageWidth, pageHeight);
}

/** Загрузка макета без смены размера страницы и текущего масштаба */
export function loadDesignOntoCanvas(canvas, designSettings, pageWidth, pageHeight) {
  if (!canvas || !designSettings) return Promise.resolve();

  const json = prepareDesignJSON(designSettings);
  const zoom = canvas.getZoom();

  canvas._suppressLayout = true;
  canvas.clear();

  return new Promise((resolve) => {
    canvas.loadFromJSON(json, () => {
      restoreCanvasViewport(canvas, pageWidth, pageHeight, zoom);
      canvas._suppressLayout = false;
      canvas.renderAll();
      resolve();
    });
  });
}

export function getUserCanvasObjects(canvas) {
  if (!canvas) return [];
  return canvas.getObjects().filter((o) => {
    if (o.isGridLine || o.excludeFromExport || o.isGuideLine) return false;
    return true;
  });
}

/**
 * Снимок превью с живого холста: сбрасываем zoom, снимаем JPEG, восстанавливаем вид.
 */
export function captureCanvasPreview(canvas, pageWidth, pageHeight) {
  if (!canvas || !pageWidth || !pageHeight) return null;

  const w = Math.round(pageWidth);
  const h = Math.round(pageHeight);
  if (w < 1 || h < 1) return null;

  if (getUserCanvasObjects(canvas).length === 0) return null;

  const prevZoom = canvas.getZoom();
  const prevWidth = canvas.getWidth();
  const prevHeight = canvas.getHeight();
  const prevVpt = canvas.viewportTransform
    ? [...canvas.viewportTransform]
    : [1, 0, 0, 1, 0, 0];

  const guides = canvas.getObjects().filter(
    (o) => o.isGridLine || o.excludeFromExport || o.isGuideLine
  );
  const guideVisibility = guides.map((o) => o.visible);
  guides.forEach((o) => o.set('visible', false));

  canvas.discardActiveObject();

  try {
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.setZoom(1);
    canvas.setWidth(w);
    canvas.setHeight(h);
    canvas.renderAll();

    const thumbMax = 420;
    const multiplier = Math.min(thumbMax / w, thumbMax / h);

    const dataUrl = canvas.toDataURL({
      format: 'jpeg',
      quality: 0.62,
      multiplier
    });

    return dataUrl && dataUrl.startsWith('data:image') ? dataUrl : null;
  } catch (e) {
    console.warn('captureCanvasPreview:', e);
    return null;
  } finally {
    guides.forEach((o, i) => o.set('visible', guideVisibility[i] !== false));
    canvas.setViewportTransform(prevVpt);
    canvas.setZoom(prevZoom);
    canvas.setWidth(prevWidth);
    canvas.setHeight(prevHeight);
    canvas.renderAll();
  }
}

export function cacheProjectPreview(projectId, previewUrl) {
  if (!projectId || !previewUrl) return;
  try {
    sessionStorage.setItem(`project_preview_${projectId}`, previewUrl);
  } catch {
    /* quota */
  }
}

export function getCachedProjectPreview(projectId) {
  try {
    return sessionStorage.getItem(`project_preview_${projectId}`);
  } catch {
    return null;
  }
}
