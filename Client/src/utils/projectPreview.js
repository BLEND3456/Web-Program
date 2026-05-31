export const CANVAS_JSON_PROPS = [
  'isGridLine',
  'excludeFromExport',
  'isGuideLine',
  'customName',
  'id'
];

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
