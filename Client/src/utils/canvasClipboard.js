import { fabric } from 'fabric';
import { CANVAS_JSON_PROPS } from './projectPreview';

const PASTE_STEP = 24;

let clipboardData = null;
let pasteCount = 0;

/** Fabric фокусирует скрытый textarea — не путать с полями ввода в UI */
export function isCanvasShortcutBlocked(canvas) {
  const el = document.activeElement;
  if (!el) return false;
  if (el.isContentEditable) return true;

  const tag = el.tagName?.toLowerCase();
  if (tag === 'select') return true;

  if (tag === 'input') {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    return !['checkbox', 'radio', 'button', 'submit', 'reset'].includes(type);
  }

  if (tag === 'textarea') {
    const hidden = canvas?.hiddenTextarea || canvas?._hiddenTextarea;
    if (hidden && el === hidden) return false;
    if (el.classList?.contains('hidden-textarea')) return false;
    return true;
  }

  return false;
}

export function getCopyableObjects(canvas) {
  if (!canvas) return [];

  const active = canvas.getActiveObject();
  if (!active) return [];

  const objects =
    active.type === 'activeSelection' ? active.getObjects() : [active];

  return objects.filter(
    (o) =>
      o &&
      !o.isGuideLine &&
      !o.excludeFromExport &&
      !o.isGridLine &&
      o.selectable !== false
  );
}

export function hasCanvasClipboard() {
  return Boolean(clipboardData?.length);
}

export function copyCanvasObjects(canvas) {
  if (!canvas) return false;

  const objects = getCopyableObjects(canvas);
  if (!objects.length) return false;
  if (objects.some((o) => o.isEditing)) return false;

  clipboardData = objects.map((o) => o.toObject(CANVAS_JSON_PROPS));
  pasteCount = 0;
  return true;
}

function enlivenSerialized(objectsData) {
  return new Promise((resolve, reject) => {
    fabric.util.enlivenObjects(objectsData, (objects) => {
      const list = (objects || []).filter(Boolean);
      if (!list.length) {
        reject(new Error('enliven failed'));
        return;
      }
      resolve(list);
    });
  });
}

export function pasteCanvasObjects(canvas) {
  if (!canvas || !clipboardData?.length) return Promise.resolve(false);

  pasteCount += 1;
  const offset = PASTE_STEP * pasteCount;

  return enlivenSerialized(clipboardData)
    .then((objects) => {
      canvas.discardActiveObject();

      objects.forEach((obj) => {
        obj.id = Math.random().toString(36).substring(2, 9);
        obj.set({
          left: (obj.left || 0) + offset,
          top: (obj.top || 0) + offset,
          evented: true,
          selectable: true,
        });
        canvas.add(obj);
      });

      if (objects.length > 1) {
        const selection = new fabric.ActiveSelection(objects, { canvas });
        canvas.setActiveObject(selection);
      } else {
        canvas.setActiveObject(objects[0]);
      }

      canvas.requestRenderAll();
      return true;
    })
    .catch((err) => {
      console.warn('pasteCanvasObjects:', err);
      return false;
    });
}
