import { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';

const LayersPanel = () => {
  const { canvas, selectedObject, updateSelectedObject } = useWorkspace();
  const [layers, setLayers] = useState([]);
  
  // Состояния для Drag & Drop
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Состояния для переименования слоя
  const [editingLayerId, setEditingLayerId] = useState(null);
  const [editLayerName, setEditLayerName] = useState('');

  const updateLayers = () => {
    if (!canvas) return;
    setLayers([...canvas.getObjects()].reverse());
  };

  useEffect(() => {
    if (!canvas) return;
    updateLayers();
    
    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('object:modified', updateLayers);
    
    return () => {
      canvas.off('object:added', updateLayers);
      canvas.off('object:removed', updateLayers);
      canvas.off('object:modified', updateLayers);
    };
  }, [canvas]);

  const toggleVisibility = (obj, e) => {
    e.stopPropagation();
    obj.set('visible', !obj.visible);
    canvas.renderAll();
    updateLayers();
  };

  const deleteLayer = (obj, e) => {
    e.stopPropagation();
    canvas.remove(obj);
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const selectLayer = (obj) => {
    // Если мы в режиме редактирования другого слоя, закрываем редактирование
    if (editingLayerId && editingLayerId !== getObjectId(obj)) {
      handleSaveLayerName();
    }
    canvas.setActiveObject(obj);
    canvas.renderAll();
    updateSelectedObject(obj);
  };

  // Вспомогательная функция для генерации/получения уникального ID объекта
  const getObjectId = (obj) => {
    if (!obj.id) {
      obj.id = Math.random().toString(36).substring(2, 9);
    }
    return obj.id;
  };

  // --- ЛОГИКА ПЕРЕИМЕНОВАНИЯ СЛОЯ ---
  const handleDoubleClick = (e, obj, currentName) => {
    e.stopPropagation();
    const id = getObjectId(obj);
    setEditingLayerId(id);
    setEditLayerName(currentName);
  };

  const handleSaveLayerName = () => {
    if (editingLayerId !== null) {
      const obj = layers.find(o => getObjectId(o) === editingLayerId);
      if (obj) {
        // Сохраняем кастомное имя внутри объекта Fabric
        obj.set('customName', editLayerName.trim() || getDefaultName(obj));
        updateLayers();
      }
      setEditingLayerId(null);
    }
  };

  const getDefaultName = (obj) => {
    const typeNames = {
      'i-text': 'Текст',
      'textbox': 'Текстовый блок',
      'rect': 'Прямоугольник',
      'circle': 'Круг',
      'triangle': 'Треугольник',
      'image': 'Изображение',
    };
    return typeNames[obj.type] || 'Элемент';
  };

  // --- ЛОГИКА ПЕРЕТАСКИВАНИЯ DRAG & DROP ---
  
  // 1. Отбираем только "наши" слои (без сетки и направляющих)
  const userLayers = layers.filter(obj => !obj.isGridLine && !obj.excludeFromExport);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.target);
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault(); 
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const draggedObj = userLayers[draggedIndex];
      const targetObj = userLayers[dropIndex];
      
      if (draggedObj && targetObj) {
        const targetFabricIndex = canvas.getObjects().indexOf(targetObj);
        draggedObj.moveTo(targetFabricIndex);
        canvas.renderAll();
        updateLayers();
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Шапка панели слоев */}
      <div className="p-4 border-b border-white/5 text-xs font-bold text-slate-400">Слои</div>
      
      {/* Контейнер самого списка слоев с ограничением высоты и автоскроллом */}
      <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[40vh] p-2 space-y-1 select-none px-1">
        {userLayers.length === 0 ? (
          <div className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-10">Слоев пока нет</div>
        ) : (
          userLayers.map((obj, i) => {
            const isSelected = selectedObject === obj;
            const isDragged = draggedIndex === i;
            const isDragOver = dragOverIndex === i;
            
            // Получаем имя: либо пользовательское, либо стандартное
            const name = obj.customName || getDefaultName(obj);
            const color = obj.fill || '#cbd5e1';
            const objId = getObjectId(obj);
            const isEditing = editingLayerId === objId;

            let borderClasses = 'border-white/5';
            let bgClasses = 'bg-white/[0.02]';
            
            if (isSelected) {
              borderClasses = 'border-indigo-500';
              bgClasses = 'bg-indigo-600/20';
            }
            
            if (isDragOver && !isDragged) {
              borderClasses = 'border-indigo-400 border-dashed border-2';
              bgClasses = 'bg-indigo-500/10 scale-[1.02]';
            }

            return (
              <div 
                key={objId} 
                draggable={!isEditing} // Отключаем drag при редактировании текста
                onDragStart={(e) => !isEditing && handleDragStart(e, i)}
                onDragOver={(e) => !isEditing && handleDragOver(e, i)}
                onDrop={(e) => !isEditing && handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                onClick={() => selectLayer(obj)}
                onDoubleClick={(e) => handleDoubleClick(e, obj, name)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${borderClasses} ${bgClasses} ${
                  isDragged ? 'opacity-30 scale-95 shadow-none' : 'shadow-sm text-slate-400 hover:bg-white/5 hover:text-slate-200'
                } ${isSelected ? 'text-indigo-100' : ''}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {/* ИКОНКА DRAG HANDLE (6 точек) */}
                  <div className="cursor-grab text-slate-600 group-hover:text-slate-400 active:cursor-grabbing px-1 -ml-2 shrink-0">
                    <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                      <circle cx="4" cy="4" r="1.5" />
                      <circle cx="8" cy="4" r="1.5" />
                      <circle cx="4" cy="8" r="1.5" />
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="4" cy="12" r="1.5" />
                      <circle cx="8" cy="12" r="1.5" />
                    </svg>
                  </div>

                  {/* Глазик (Видимость) */}
                  <button onClick={(e) => toggleVisibility(obj, e)} className={`shrink-0 hover:text-white transition-colors ${!obj.visible ? 'opacity-30' : ''}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      {obj.visible ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      )}
                    </svg>
                  </button>

                  {/* Цветной индикатор слоя */}
                  <div className="shrink-0 w-3 h-3 rounded-sm border border-white/20 flex items-center justify-center" style={{ backgroundColor: obj.type === 'image' ? 'transparent' : color }}>
                     {obj.type === 'image' && <span className="text-[8px]">🖼️</span>}
                  </div>

                  {/* ПОЛЕ РЕДАКТИРОВАНИЯ ИЛИ ТЕКСТ */}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editLayerName}
                      onChange={(e) => setEditLayerName(e.target.value)}
                      onBlur={handleSaveLayerName}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveLayerName();
                        if (e.key === 'Escape') setEditingLayerId(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()} // предотвращаем выделение холста
                      className="text-xs font-bold bg-black/40 text-white outline-none border border-indigo-500 rounded px-1 w-24 truncate focus:w-32 transition-all"
                    />
                  ) : (
                    <span className="text-xs font-bold truncate select-none" title="Дважды кликните, чтобы переименовать">
                      {name}
                    </span>
                  )}
                </div>

                {/* КНОПКА УДАЛЕНИЯ (Корзина) */}
                {!isEditing && (
                  <button 
                    onClick={(e) => deleteLayer(obj, e)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Удалить слой"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LayersPanel;