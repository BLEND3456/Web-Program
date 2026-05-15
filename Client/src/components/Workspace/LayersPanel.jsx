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

    if (obj.type === 'i-text' || obj.type === 'textbox') {
      return 'Текст';
    }

    if (obj.type === 'rect') {
      return 'Фигура';
    }

    if (obj.type === 'image') {
      return 'Изображение';
    }

    return 'Объект';
  };

  const updateLayers = () => {
    if (!canvas) return;

    const objects = canvas
      .getObjects()
      .map((obj, index) => ({
        id: obj.__layerId || `layer-${index}`,
        name: getObjectName(obj),
        type: obj.type,
        visible: obj.visible !== false,
        opacity: Math.round((obj.opacity || 1) * 100),
        object: obj,
      }))
      .reverse();

    setLayers(objects);
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

  useEffect(() => {
    if (editingLayerId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingLayerId]);

  const selectLayer = (layer) => {
    if (!canvas) return;

    canvas.setActiveObject(layer.object);

    canvas.renderAll();

    updateSelectedObject(layer.object);
  };

  const toggleVisibility = (e, layer) => {
    e.stopPropagation();

    if (!layer.object) return;

    layer.object.set({
      visible: !layer.visible,
    });

    canvas.renderAll();

    updateLayers();
  };

  const deleteLayer = (e, layer) => {
    e.stopPropagation();

    if (!canvas || !layer.object) return;

    canvas.remove(layer.object);

    canvas.renderAll();

    updateLayers();
  };

  const moveLayerUp = (e, index) => {
    e.stopPropagation();

    if (!canvas || index === 0) return;

    const obj = layers[index].object;

    canvas.bringForward(obj);

    canvas.renderAll();

    updateLayers();
  };

  const moveLayerDown = (e, index) => {
    e.stopPropagation();

    if (!canvas || index === layers.length - 1) return;

    const obj = layers[index].object;

    canvas.sendBackwards(obj);

    canvas.renderAll();

    updateLayers();
  };

  const duplicateLayer = (e, layer) => {
    e.stopPropagation();

    if (!canvas || !layer.object) return;

    layer.object.clone((cloned) => {
      cloned.set({
        left: (cloned.left || 0) + 15,
        top: (cloned.top || 0) + 15,
      });

      cloned.name = `${layer.name} копия`;

      canvas.add(cloned);

      canvas.setActiveObject(cloned);

      canvas.renderAll();

      updateLayers();
    });
  };

  const handleDragStart = (index) => {
    setDraggedLayerIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex) => {
    if (
      draggedLayerIndex === null ||
      draggedLayerIndex === targetIndex ||
      !canvas
    ) {
      return;
    }

    const reorderedLayers = [...layers];

    const [movedLayer] = reorderedLayers.splice(
      draggedLayerIndex,
      1
    );

    reorderedLayers.splice(targetIndex, 0, movedLayer);

    const reorderedCanvasObjects = reorderedLayers
      .map((layer) => layer.object)
      .reverse();

    canvas._objects = reorderedCanvasObjects;

    canvas.renderAll();

    setDraggedLayerIndex(null);

    updateLayers();
  };

  const startRename = (layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  const saveRename = (layer) => {
    const trimmed = editingName.trim();

    if (!trimmed) {
      setEditingLayerId(null);
      return;
    }

    layer.object.name = trimmed;

    setEditingLayerId(null);

    updateLayers();
  };

  const handleRenameKey = (e, layer) => {
    if (e.key === 'Enter') {
      saveRename(layer);
    }

    if (e.key === 'Escape') {
      setEditingLayerId(null);
    }
  };

  return (
    <div className="w-72 bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 shadow-xl border border-slate-600 flex flex-col h-full">
      <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
        <span>📑</span>
        Слои
      </h3>

      {layers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center">
          Нет объектов на холсте
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              onClick={() => selectLayer(layer)}
              className={`p-3 rounded-lg border transition-all duration-200 cursor-move group ${
                selectedObject === layer.object
                  ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/40'
                  : 'bg-slate-600 border-transparent hover:bg-slate-500'
              } ${
                draggedLayerIndex === index
                  ? 'opacity-50'
                  : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={(e) =>
                    toggleVisibility(e, layer)
                  }
                  className="text-lg hover:scale-110 transition"
                  title={layer.visible ? 'Скрыть' : 'Показать'}
                >
                  {layer.visible ? '👁️' : '🚫'}
                </button>

                <span className="text-sm">
                  {layer.type === 'i-text' ||
                  layer.type === 'textbox'
                    ? '📝'
                    : layer.type === 'rect'
                    ? '▭'
                    : layer.type === 'image'
                    ? '🖼️'
                    : '⭕'}
                </span>

                <div className="flex-1 min-w-0">
                  {editingLayerId === layer.id ? (
                    <input
                      ref={inputRef}
                      value={editingName}
                      onChange={(e) =>
                        setEditingName(e.target.value)
                      }
                      onBlur={() => saveRename(layer)}
                      onKeyDown={(e) =>
                        handleRenameKey(e, layer)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1 rounded bg-slate-800 text-white text-sm border border-blue-500 outline-none"
                    />
                  ) : (
                    <p 
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startRename(layer);
                      }}
                      className="text-white text-sm font-medium truncate cursor-text hover:bg-slate-500/50 px-1 rounded transition"
                      title="Двойной клик для редактирования"
                    >
                      {layer.name}
                    </p>
                  )}

                  <p className="text-xs text-slate-300">
                    {Math.round(
                      layer.object?.width || 0
                    )}
                    ×
                    {Math.round(
                      layer.object?.height || 0
                    )}
                    px
                  </p>
                </div>

                <span className="text-slate-300 text-sm">
                  ⋮⋮
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300 mb-3">
                <span>💨</span>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layer.opacity}
                  onChange={(e) => {
                    layer.object.set({
                      opacity:
                        parseInt(e.target.value) / 100,
                    });

                    canvas.renderAll();

                    updateLayers();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 accent-blue-500"
                />

                <span className="w-8 text-right">
                  {layer.opacity}%
                </span>
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) =>
                    moveLayerUp(e, index)
                  }
                  disabled={index === 0}
                  className="flex-1 px-2 py-1 text-xs bg-slate-500 hover:bg-slate-400 disabled:opacity-50 rounded text-white transition"
                  title="На верх"
                >
                  ⬆️
                </button>

                <button
                  onClick={(e) =>
                    moveLayerDown(e, index)
                  }
                  disabled={
                    index === layers.length - 1
                  }
                  className="flex-1 px-2 py-1 text-xs bg-slate-500 hover:bg-slate-400 disabled:opacity-50 rounded text-white transition"
                  title="На низ"
                >
                  ⬇️
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateLayer(e, layer);
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 rounded text-white transition"
                  title="Дублировать"
                >
                  📋
                </button>

                <button
                  onClick={(e) =>
                    deleteLayer(e, layer)
                  }
                  className="flex-1 px-2 py-1 text-xs bg-red-600 hover:bg-red-500 rounded text-white transition"
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-600 text-xs text-slate-400 text-center">
        Всего слоёв:{' '}
        <strong className="text-white">
          {layers.length}
        </strong>
      </div>
    </div>
  );
};

export default LayersPanel;