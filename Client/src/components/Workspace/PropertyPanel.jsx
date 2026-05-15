import { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';

const PropertyPanel = () => {
  const { selectedObject, canvas } = useWorkspace();
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [fontProps, setFontProps] = useState({ fontSize: 16, fontFamily: 'Arial' });
  const [fill, setFill] = useState('#000000');

  useEffect(() => {
    if (!selectedObject) return;
    const sync = () => {
      setPos({
        left: Math.round(selectedObject.left || 0),
        top: Math.round(selectedObject.top || 0),
      });
      setSize({
        width: Math.round(selectedObject.width * selectedObject.scaleX || 0),
        height: Math.round(selectedObject.height * selectedObject.scaleY || 0),
      });
      setFontProps({
        fontSize: selectedObject.fontSize || 16,
        fontFamily: selectedObject.fontFamily || 'Arial',
      });
      setFill(selectedObject.fill || '#000000');
    };
    sync();
    selectedObject.on('modified', sync);
    return () => {
      selectedObject.off('modified', sync);
    };
  }, [selectedObject]);

  const update = (key, value) => {
    if (!selectedObject || !canvas) return;
    selectedObject.set(key, value);
    canvas.renderAll();
  };

  if (!selectedObject) {
    return (
      <div className="w-72 bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-6 shadow-xl border border-slate-600 flex flex-col items-center justify-center text-slate-400">
        <div className="text-4xl mb-3">👆</div>
        <p className="text-center font-medium">Выберите элемент на холсте</p>
      </div>
    );
  }

  const isText = selectedObject.type === 'i-text' || selectedObject.type === 'textbox';

  return (
    <div className="w-72 bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-6 space-y-5 text-sm overflow-y-auto shadow-xl border border-slate-600">
      <h3 className="font-bold text-white text-lg">⚙️ Свойства</h3>

      {/* Позиция */}
      <div className="space-y-3">
        <p className="text-slate-300 font-semibold">📍 Позиция</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-slate-400 text-xs">X</label>
            <input
              type="number"
              value={pos.left}
              onChange={(e) => update('left', parseInt(e.target.value))}
              className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-2 text-white text-xs"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs">Y</label>
            <input
              type="number"
              value={pos.top}
              onChange={(e) => update('top', parseInt(e.target.value))}
              className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-2 text-white text-xs"
            />
          </div>
        </div>
      </div>

      {/* Размер */}
      {!isText && (
        <div className="space-y-3">
          <p className="text-slate-300 font-semibold">📐 Размер</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 text-xs">Ширина</label>
              <input
                type="number"
                value={size.width}
                onChange={(e) => {
                  const w = parseInt(e.target.value);
                  selectedObject.set({ scaleX: w / selectedObject.width });
                  canvas.renderAll();
                }}
                className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs">Высота</label>
              <input
                type="number"
                value={size.height}
                onChange={(e) => {
                  const h = parseInt(e.target.value);
                  selectedObject.set({ scaleY: h / selectedObject.height });
                  canvas.renderAll();
                }}
                className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-2 text-white text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Шрифт */}
      {isText && (
        <div className="space-y-3">
          <p className="text-slate-300 font-semibold">🔤 Текст</p>
          <div>
            <label className="text-slate-400 text-xs">Размер</label>
            <input
              type="number"
              value={fontProps.fontSize}
              onChange={(e) => update('fontSize', parseInt(e.target.value))}
              className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-2 text-white text-xs"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs">Шрифт</label>
            <select
              value={fontProps.fontFamily}
              onChange={(e) => update('fontFamily', e.target.value)}
              className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-2 text-white text-xs"
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
            </select>
          </div>
        </div>
      )}

      {/* Цвет */}
      <div className="space-y-3">
        <p className="text-slate-300 font-semibold">🎨 Цвет</p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={fill}
            onChange={(e) => update('fill', e.target.value)}
            className="w-14 h-10 border-2 border-slate-500 rounded cursor-pointer"
          />
          <span className="text-slate-400">{fill}</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyPanel;