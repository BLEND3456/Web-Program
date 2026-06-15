import { fabric } from 'fabric';
import { buildNewspaperTemplateJSON } from './newspaperTemplates';

const PREVIEW_PAGE = { width: 600, height: 848 };
const THUMB_MAX = 96;
const memoryCache = new Map();

function dataUrlFromCanvas(canvas, pageWidth, pageHeight) {
  const multiplier = Math.min(THUMB_MAX / pageWidth, THUMB_MAX / pageHeight);
  try {
    const dataUrl = canvas.toDataURL({ format: 'jpeg', quality: 0.62, multiplier });
    return dataUrl?.startsWith('data:image') ? dataUrl : null;
  } catch {
    return null;
  }
}

function renderJsonToPreview(designSettings) {
  return new Promise((resolve) => {
    const w = designSettings?.width || PREVIEW_PAGE.width;
    const h = designSettings?.height || PREVIEW_PAGE.height;

    const el = document.createElement('canvas');
    const staticCanvas = new fabric.StaticCanvas(el, { width: w, height: h });

    staticCanvas.loadFromJSON(designSettings, () => {
      staticCanvas.renderAll();
      const url = dataUrlFromCanvas(staticCanvas, w, h);
      staticCanvas.dispose();
      resolve(url);
    });
  });
}

export async function getBuiltinTemplatePreview(type) {
  const key = `builtin:${type}`;
  if (memoryCache.has(key)) return memoryCache.get(key);

  const json = buildNewspaperTemplateJSON(type, PREVIEW_PAGE.width, PREVIEW_PAGE.height);
  if (!json) return null;

  const url = await renderJsonToPreview(json);
  if (url) memoryCache.set(key, url);
  return url;
}

export async function getPresetTemplatePreview(presetId, designSettings) {
  const key = `preset:${presetId}`;
  if (memoryCache.has(key)) return memoryCache.get(key);
  if (!designSettings) return null;

  const url = await renderJsonToPreview(designSettings);
  if (url) memoryCache.set(key, url);
  return url;
}

export function cachePresetTemplatePreview(presetId, url) {
  if (presetId && url) memoryCache.set(`preset:${presetId}`, url);
}
