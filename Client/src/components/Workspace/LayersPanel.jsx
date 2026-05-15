import { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';

const LayersPanel = () => {
  const { canvas, selectedObject, updateSelectedObject } = useWorkspace();
  const [layers, setLayers] = useState([]);
  const [draggedLayerIndex, setDraggedLayerIndex] = useState(null);
  const [editingLayerId, setEditingLayerId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef(null);

  const getObjectName = (obj) => {
    if (obj.name) return obj.name;
    if (obj.type === 'i-text' || obj.type === 'textbox') return 'Текстовый блок';
    if (obj.type === 'rect') return 'Прямоугольник';
    if (obj.type === 'image') return 'Изображение';
    return 'Элемент';
  };

  const updateLayers = () => {
    if (!canvas) return;
    const objects = canvas.getObjects().map((obj, index) => ({
      id: obj.__layerId || `layer-${index}`, name: getObjectName(obj), type: obj.type, visible: obj.visible !== false, opacity: Math.round((obj.opacity || 1) * 100), object: obj,
    })).reverse();
    setLayers(objects);
  };

  useEffect(() => {
    if (!canvas) return;
    updateLayers();
    canvas.on('object:added', updateLayers); canvas.on('object:removed', updateLayers); canvas.on('object:modified', updateLayers);
    return () => { canvas.off('object:added', updateLayers); canvas.off('object:removed', updateLayers); canvas.off('object:modified', updateLayers); };
  }, [canvas]);

  useEffect(() => { if (editingLayerId && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editingLayerId]);

  const selectLayer = (layer) => { if (!canvas) return; canvas.setActiveObject(layer.object); canvas.renderAll(); updateSelectedObject(layer.object); };
  const toggleVisibility = (e, layer) => { e.stopPropagation(); if (!layer.object) return; layer.object.set({ visible: !layer.visible }); canvas.renderAll(); updateLayers(); };
  const handleDragStart = (index) => setDraggedLayerIndex(index);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (targetIndex) => {
    if (draggedLayerIndex === null || draggedLayerIndex === targetIndex || !canvas) return;
    const reorderedLayers = [...layers];
    const [movedLayer] = reorderedLayers.splice(draggedLayerIndex, 1);
    reorderedLayers.splice(targetIndex, 0, movedLayer);
    canvas._objects = reorderedLayers.map((layer) => layer.object).reverse();
    canvas.renderAll(); setDraggedLayerIndex(null); updateLayers();
  };

  const startRename = (layer) => { setEditingLayerId(layer.id); setEditingName(layer.name); };
  const saveRename = (layer) => { const t = editingName.trim(); if (!t) { setEditingLayerId(null); return; } layer.object.name = t; setEditingLayerId(null); updateLayers(); };
  const handleRenameKey = (e, layer) => { if (e.key === 'Enter') saveRename(layer); if (e.key === 'Escape') setEditingLayerId(null); };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Прозрачность */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-500">Прозрачность</span>
        <input type="range" min="0" max="100" value={selectedObject ? Math.round((selectedObject.opacity || 1) * 100) : 100}
          onChange={(e) => {
            if (!selectedObject) return;
            selectedObject.set({ opacity: parseInt(e.target.value) / 100 });
            canvas.renderAll(); updateLayers();
          }}
          disabled={!selectedObject}
          className="flex-1 accent-indigo-500 disabled:opacity-50"
        />
        <span className="text-xs font-bold text-slate-700 w-8 text-right">{selectedObject ? Math.round((selectedObject.opacity || 1) * 100) : 100}%</span>
      </div>

      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Порядок слоев</span>
      
      {layers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
           <span className="text-2xl mb-2">📄</span>
           <p className="text-sm">Холст пуст</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5 pb-4">
          {layers.map((layer, index) => (
            <div
              key={layer.id} draggable onDragStart={() => handleDragStart(index)} onDragOver={handleDragOver} onDrop={() => handleDrop(index)} onClick={() => selectLayer(layer)}
              className={`flex items-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                selectedObject === layer.object ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'
              } ${draggedLayerIndex === index ? 'opacity-50 scale-95' : ''}`}
            >
              <button onClick={(e) => toggleVisibility(e, layer)} className={`w-6 h-6 mr-2 flex items-center justify-center rounded-md hover:bg-slate-200 transition-colors ${layer.visible ? 'text-slate-600' : 'text-slate-300'}`}>
                {layer.visible ? '👁️' : '👁️‍🗨️'}
              </button>
              <span className="w-6 h-6 mr-2 flex items-center justify-center bg-white rounded shadow-sm text-xs border border-slate-100">
                {layer.type === 'i-text' || layer.type === 'textbox' ? 'T' : layer.type === 'rect' ? '🟦' : layer.type === 'image' ? '🖼️' : '✨'}
              </span>
              <div className="flex-1 min-w-0">
                {editingLayerId === layer.id ? (
                  <input ref={inputRef} value={editingName} onChange={(e) => setEditingName(e.target.value)} onBlur={() => saveRename(layer)} onKeyDown={(e) => handleRenameKey(e, layer)} onClick={(e) => e.stopPropagation()} className="w-full px-2 py-0.5 bg-white border border-indigo-500 rounded outline-none text-sm font-medium text-slate-800" />
                ) : (
                  <span onDoubleClick={(e) => { e.stopPropagation(); startRename(layer); }} className={`truncate block text-sm font-medium ${selectedObject === layer.object ? 'text-indigo-900' : 'text-slate-700'}`}>
                    {layer.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LayersPanel;