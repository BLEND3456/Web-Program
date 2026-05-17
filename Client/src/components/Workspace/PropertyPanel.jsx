import { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';

const PropertyPanel = () => {
  const { selectedObject, canvas } = useWorkspace();
  const [fill, setFill] = useState('#818cf8');
  const [opacity, setOpacity] = useState(1);

  // Спектр готовых профессиональных газетных и журнальных оттенков (Photoshop Swatches)
  const swatches = [
    '#000000', '#1e293b', '#475569', '#94a3b8', '#cbd5e1', '#ffffff',
    '#e11d48', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#4f46e5',
    '#ab47bc', '#ec407a', '#26a69a', '#78909c', '#d4af37', '#8d6e63'
  ];

  useEffect(() => {
    if (!selectedObject) return;
    const sync = () => {
      setFill(selectedObject.fill || '#000000');
      setOpacity(selectedObject.opacity !== undefined ? selectedObject.opacity : 1);
    };
    sync();
    selectedObject.on('modified', sync);
    return () => selectedObject.off('modified', sync);
  }, [selectedObject]);

  const update = (key, value) => {
    if (!selectedObject || !canvas) return;
    selectedObject.set(key, value);
    canvas.renderAll();
  };

  if (!selectedObject) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 h-full">
        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-xl mb-3 opacity-50">🎨</div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Выберите объект для окрашивания</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      
      {/* ОКНО ВЫБОРА ЦВЕТА (Интерактивный блок а-ля Photoshop Color) */}
      <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-4">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Палитра спектра</span>
        
        {/* Визуальная градиентная матрица */}
        <div 
          className="h-32 rounded-xl relative overflow-hidden border border-white/10 shadow-inner"
          style={{
            background: 'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, #4f46e5, #e11d48, #eab308, #22c55e, #06b6d4)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 px-2 py-1 rounded-md border border-white/10 backdrop-blur-sm">
             <div className="w-3 h-3 rounded-sm border border-white/20" style={{ backgroundColor: fill }} />
             <span className="text-[10px] font-mono text-slate-300 uppercase">{fill}</span>
          </div>
        </div>

        {/* Нативный контроллер спектра в красивой обертке */}
        <div className="flex items-center gap-3 bg-[#121214] p-2 border border-white/10 rounded-xl">
          <input 
            type="color" 
            value={fill} 
            onChange={(e) => { setFill(e.target.value); update('fill', e.target.value); }} 
            className="w-10 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0" 
          />
          <div className="flex-1 text-center">
            <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">{fill}</span>
          </div>
        </div>
      </div>

      {/* СВОТЧИ (Быстрые заготовки цветов, как в Photoshop Swatches) */}
      <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Образцы (Swatches)</span>
        <div className="grid grid-cols-6 gap-2">
          {swatches.map((color) => (
            <button
              key={color}
              onClick={() => { setFill(color); update('fill', color); }}
              className={`aspect-square rounded-lg border transition-all transform hover:scale-110 active:scale-95 ${fill.toLowerCase() === color.toLowerCase() ? 'border-white scale-105 shadow-md ring-2 ring-indigo-500/50' : 'border-white/10'}`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* ПОЛЗУНОК НЕПРОЗРАЧНОСТИ */}
      <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Непрозрачность слоя</span>
        <div className="flex items-center gap-4">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={Math.round(opacity * 100)}
            onChange={(e) => {
              const val = parseInt(e.target.value) / 100;
              setOpacity(val);
              update('opacity', val);
            }}
            className="flex-1 accent-indigo-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-indigo-400 w-10 text-right">{Math.round(opacity * 100)}%</span>
        </div>
      </div>

      {/* КНОПКА БЫСТРОГО УДАЛЕНИЯ */}
      <button 
        onClick={() => { canvas.remove(selectedObject); canvas.discardActiveObject(); canvas.renderAll(); }}
        className="w-full py-3.5 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border border-rose-500/10 hover:border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-4"
      >
        Удалить элемент
      </button>

    </div>
  );
};

export default PropertyPanel;