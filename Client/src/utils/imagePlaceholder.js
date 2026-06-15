import { fabric } from 'fabric';

export const PLACEHOLDER_JSON_PROPS = ['isImagePlaceholder', 'placeholderId', 'isPlaceholderLabel'];

const newPlaceholderId = () =>
  `ph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const isImagePlaceholder = (obj) => Boolean(obj?.isImagePlaceholder);

export const addImagePlaceholder = (canvas, left, top, width, height, captionSize, label) => {
  const placeholderId = newPlaceholderId();
  const text =
    label ||
    '🖼️ ГЛАВНОЕ ИЗОБРАЖЕНИЕ\n(Нажмите, чтобы вставить ссылку)';

  const rect = new fabric.Rect({
    left,
    top,
    width,
    height,
    fill: '#f1f5f9',
    stroke: '#cbd5e1',
    strokeWidth: 2,
    strokeDashArray: [10, 5],
    originX: 'left',
    originY: 'top',
    isImagePlaceholder: true,
    placeholderId,
    hoverCursor: 'pointer',
  });

  const caption = new fabric.Textbox(text, {
    left: left + width / 2,
    top: top + height / 2,
    width: Math.max(80, width - 40),
    fontFamily: 'Arial',
    fontSize: captionSize,
    fontWeight: 'bold',
    fill: '#64748b',
    textAlign: 'center',
    originX: 'center',
    originY: 'center',
    isPlaceholderLabel: true,
    placeholderId,
    selectable: false,
    evented: false,
  });

  canvas.add(rect);
  canvas.add(caption);
  return rect;
};

const removePlaceholderParts = (canvas, placeholderId) => {
  canvas
    .getObjects()
    .filter((o) => o.placeholderId === placeholderId)
    .forEach((o) => canvas.remove(o));
};

const fitImageInBox = (img, left, top, boxW, boxH) => {
  const scale = Math.min(boxW / img.width, boxH / img.height);
  img.set({
    left: left + boxW / 2,
    top: top + boxH / 2,
    originX: 'center',
    originY: 'center',
    scaleX: scale,
    scaleY: scale,
  });
};

export function fillImagePlaceholder(canvas, placeholderRect, imageUrl) {
  if (!canvas || !placeholderRect?.isImagePlaceholder) {
    return Promise.reject(new Error('Некорректный блок изображения'));
  }

  const placeholderId = placeholderRect.placeholderId;
  const boxW = placeholderRect.getScaledWidth();
  const boxH = placeholderRect.getScaledHeight();
  const left = placeholderRect.left;
  const top = placeholderRect.top;

  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(
      imageUrl,
      (img) => {
        if (!img) {
          reject(new Error('Не удалось загрузить изображение'));
          return;
        }
        fitImageInBox(img, left, top, boxW, boxH);
        removePlaceholderParts(canvas, placeholderId);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        resolve(img);
      },
      { crossOrigin: 'anonymous' }
    );
  });
}

export function fillImagePlaceholderFromFile(canvas, placeholderRect, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      fillImagePlaceholder(canvas, placeholderRect, event.target.result)
        .then(resolve)
        .catch(reject);
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}
