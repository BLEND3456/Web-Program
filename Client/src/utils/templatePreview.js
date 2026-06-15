import { fabric } from 'fabric';
import { buildNewspaperTemplateJSON } from './newspaperTemplates';
import { CANVAS_JSON_PROPS } from './projectPreview';

const PREVIEW_PAGE = { width: 600, height: 848 };
const THUMB_SMALL = 96;
const THUMB_CARD = 520;

const memoryCache = new Map();

function cacheKey(kind, id, maxPx) {
  return `${kind}:${id}:${maxPx}`;
}

export function parseDesignSettings(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return { ...raw };
}

export function resolveDesignDimensions(settings) {
  if (!settings) return { ...PREVIEW_PAGE };
  const w = Number(settings.width);
  const h = Number(settings.height);
  if (w > 0 && h > 0) return { width: w, height: h };

  if (Array.isArray(settings.objects) && settings.objects.length > 0) {
    let maxRight = 0;
    let maxBottom = 0;
    settings.objects.forEach((obj) => {
      if (obj.isGridLine || obj.excludeFromExport || obj.isGuideLine) return;
      const left = obj.left || 0;
      const top = obj.top || 0;
      const scaleX = obj.scaleX ?? 1;
      const scaleY = obj.scaleY ?? 1;
      let right = left;
      let bottom = top;

      if (obj.type === 'line' && obj.x1 != null) {
        right = Math.max(obj.x1, obj.x2 ?? 0) + left;
        bottom = Math.max(obj.y1, obj.y2 ?? 0) + top;
      } else {
        const ow = (obj.width || 0) * scaleX;
        const oh = (obj.height || 0) * scaleY;
        right = left + ow;
        bottom = top + oh;
      }
      maxRight = Math.max(maxRight, right);
      maxBottom = Math.max(maxBottom, bottom);
    });
    if (maxRight > 10 && maxBottom > 10) {
      return {
        width: Math.ceil(maxRight + 48),
        height: Math.ceil(maxBottom + 48),
      };
    }
  }

  return { ...PREVIEW_PAGE };
}

function dataUrlFromCanvas(canvas, pageWidth, pageHeight, maxPx, quality) {
  const multiplier = Math.min(maxPx / pageWidth, maxPx / pageHeight);
  try {
    const dataUrl = canvas.toDataURL({ format: 'jpeg', quality, multiplier });
    return dataUrl?.startsWith('data:image') ? dataUrl : null;
  } catch {
    return null;
  }
}

async function renderJsonToPreview(designSettings, maxPx) {
  const settings = parseDesignSettings(designSettings);
  if (!settings?.objects?.length) return null;

  delete settings.clipPath;
  const { width: w, height: h } = resolveDesignDimensions(settings);
  const quality = maxPx <= THUMB_SMALL ? 0.72 : 0.9;

  const el = document.createElement('canvas');
  const staticCanvas = new fabric.StaticCanvas(el, { width: w, height: h, backgroundColor: '#ffffff' });

  try {
    await document.fonts.ready;
    await new Promise((resolve) => {
      staticCanvas.loadFromJSON(settings, () => resolve());
    });

    staticCanvas.getObjects()
      .filter((o) => o.isGridLine || o.excludeFromExport || o.isGuideLine)
      .forEach((o) => staticCanvas.remove(o));

    staticCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    staticCanvas.setZoom(1);
    staticCanvas.setWidth(w);
    staticCanvas.setHeight(h);
    staticCanvas.clipPath = null;
    staticCanvas.renderAll();

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    return dataUrlFromCanvas(staticCanvas, w, h, maxPx, quality);
  } catch {
    return null;
  } finally {
    staticCanvas.dispose();
  }
}

export function getCardPreviewMaxPx() {
  if (typeof window === 'undefined') return THUMB_CARD;
  return Math.round(THUMB_CARD * Math.min(window.devicePixelRatio || 1, 2));
}

export async function getBuiltinTemplatePreview(type, maxPx = THUMB_SMALL) {
  const key = cacheKey('builtin', type, maxPx);
  if (memoryCache.has(key)) return memoryCache.get(key);

  const json = buildNewspaperTemplateJSON(type, PREVIEW_PAGE.width, PREVIEW_PAGE.height);
  if (!json) return null;

  const url = await renderJsonToPreview(json, maxPx);
  if (url) memoryCache.set(key, url);
  return url;
}

export async function getPresetTemplatePreview(presetId, designSettings, maxPx = THUMB_SMALL) {
  const key = cacheKey('preset', presetId, maxPx);
  if (memoryCache.has(key)) return memoryCache.get(key);
  if (!designSettings) return null;

  const url = await renderJsonToPreview(designSettings, maxPx);
  if (url) memoryCache.set(key, url);
  return url;
}

/** Загрузить превью сохранённого шаблона (thumbnail или рендер из designSettings) */
export async function resolvePresetPreview(preset, maxPx, fetchFullPreset) {
  if (!preset?.id) return null;
  if (preset.thumbnail?.startsWith('data:image')) return preset.thumbnail;

  let settings = preset.designSettings;
  let thumbnail = preset.thumbnail;

  if ((!settings || !thumbnail) && fetchFullPreset) {
    try {
      const full = await fetchFullPreset(preset.id);
      settings = settings || full?.designSettings;
      thumbnail = thumbnail || full?.thumbnail;
    } catch {
      /* ignore */
    }
  }

  if (thumbnail?.startsWith('data:image')) return thumbnail;
  return getPresetTemplatePreview(preset.id, settings, maxPx);
}

export function cachePresetTemplatePreview(presetId, url, maxPx = THUMB_SMALL) {
  if (presetId && url) memoryCache.set(cacheKey('preset', presetId, maxPx), url);
}
