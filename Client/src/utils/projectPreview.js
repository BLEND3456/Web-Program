import { fabric } from 'fabric';

const EXPORT_PROPS = ['isGridLine', 'excludeFromExport', 'isGuideLine'];

/** Иконка-заглушка, если превью ещё не сохраняли */
export const PLACEHOLDER_PREVIEW = null;

/**
 * Рендер превью на отдельном StaticCanvas в масштабе 1:1 (без zoom редактора).
 */
export function captureCanvasPreview(canvas, pageWidth, pageHeight) {
  if (!canvas || !pageWidth || !pageHeight) return Promise.resolve(null);

  const w = Math.round(pageWidth);
  const h = Math.round(pageHeight);
  if (w < 1 || h < 1) return Promise.resolve(null);

  const json = canvas.toJSON(EXPORT_PROPS);
  json.objects = (json.objects || []).filter(
    (o) => !o.isGridLine && !o.excludeFromExport && !o.isGuideLine
  );

  if (json.objects.length === 0) return Promise.resolve(null);

  const el = document.createElement('canvas');
  const staticCanvas = new fabric.StaticCanvas(el, {
    width: w,
    height: h,
    backgroundColor: json.background || '#ffffff'
  });

  return new Promise((resolve) => {
    staticCanvas.loadFromJSON(json, () => {
      try {
        staticCanvas.renderAll();

        const thumbMax = 360;
        const multiplier = Math.min(thumbMax / w, thumbMax / h, 1);

        const dataUrl = staticCanvas.toDataURL({
          format: 'jpeg',
          quality: 0.55,
          multiplier
        });

        staticCanvas.dispose();
        resolve(dataUrl && dataUrl.length > 500 ? dataUrl : null);
      } catch {
        staticCanvas.dispose();
        resolve(null);
      }
    });
  });
}
