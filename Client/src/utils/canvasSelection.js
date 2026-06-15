export function getCanvasSelectionObjects(canvas) {
  if (!canvas) return [];
  return canvas.getActiveObjects();
}

export function isObjectInCanvasSelection(canvas, obj) {
  if (!canvas || !obj) return false;
  return getCanvasSelectionObjects(canvas).includes(obj);
}

export function forEachSelectedObject(canvas, selectedObject, fn) {
  if (!canvas || !selectedObject) return;
  const objects =
    selectedObject.type === 'activeSelection'
      ? selectedObject.getObjects()
      : [selectedObject];
  objects.forEach(fn);
}
