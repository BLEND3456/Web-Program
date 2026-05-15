import { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { projectsAPI } from '../../services/api';

const PropertyPanel = () => {
  const { selectedObject, canvas } = useWorkspace();
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [fontProps, setFontProps] = useState({ fontSize: 16, fontFamily: 'Arial' });
  const [fill, setFill] = useState('#000000');

  useEffect(() => {
    if (!selectedObject) return;
    const sync = () => {
      setPos({ left: Math.round(selectedObject.left || 0), top: Math.round(selectedObject.top || 0) });
      setSize({ width: Math.round(selectedObject.width * selectedObject.scaleX || 0), height: Math.round(selectedObject.height * selectedObject.scaleY || 0) });
      setFontProps({ fontSize: selectedObject.fontSize || 16, fontFamily: selectedObject.fontFamily || 'Arial' });
      setFill(selectedObject.fill || '#000000');
    };
    sync(); selectedObject.on('modified', sync);
    return () => selectedObject.off('modified', sync);
  }, [selectedObject]);

  const update = (key, value) => {
    if (!selectedObject || !canvas) return;
    selectedObject.set(key, value); canvas.renderAll();
  };

  if (!selectedObject) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl mb-4">✨</div>
        <p className="text-sm">Выберите элемент на холсте, чтобы настроить его свойства</p>
      </div>
    );
  }

  const isText = selectedObject.type === 'i-text' || selectedObject.type === 'textbox';
  const InputClass = "w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all";
  const LabelGroupClass = "text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-6 block";
  const LabelClass = "text-xs text-slate-500 font-medium mb-1 block";

  return (
    <div className="p-6">
      
      {/* Позиция и Размер */}
      <div>
        <span className={LabelGroupClass}>Размещение</span>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={LabelClass}>X (px)</label><input type="number" value={pos.left} onChange={(e) => update('left', parseInt(e.target.value))} className={InputClass} /></div>
          <div><label className={LabelClass}>Y (px)</label><input type="number" value={pos.top} onChange={(e) => update('top', parseInt(e.target.value))} className={InputClass} /></div>
          {!isText && (
            <>
              <div><label className={LabelClass}>Ширина</label><input type="number" value={size.width} onChange={(e) => { selectedObject.set({ scaleX: parseInt(e.target.value) / selectedObject.width }); canvas.renderAll(); }} className={InputClass} /></div>
              <div><label className={LabelClass}>Высота</label><input type="number" value={size.height} onChange={(e) => { selectedObject.set({ scaleY: parseInt(e.target.value) / selectedObject.height }); canvas.renderAll(); }} className={InputClass} /></div>
            </>
          )}
        </div>
      </div>

      {/* Оформление */}
      <div>
        <span className={LabelGroupClass}>Оформление</span>
        <div className="flex items-center gap-3 bg-slate-50 p-2 border border-slate-200 rounded-xl">
          <input type="color" value={fill} onChange={(e) => update('fill', e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0" />
          <span className="text-sm font-medium text-slate-700 uppercase">{fill}</span>
        </div>
      </div>

      {/* Текст */}
      {isText && (
        <div>
          <span className={LabelGroupClass}>Типографика</span>
          <div className="space-y-3">
            <div>
              <label className={LabelClass}>Шрифт</label>
              <select value={fontProps.fontFamily} onChange={(e) => update('fontFamily', e.target.value)} className={InputClass}>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>
            <div>
              <label className={LabelClass}>Размер</label>
              <input type="number" value={fontProps.fontSize} onChange={(e) => update('fontSize', parseInt(e.target.value))} className={InputClass} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyPanel;