import { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { fabric } from 'fabric';

const Toolbar = () => {
  const { canvas, selectedObject } = useWorkspace();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Функция для ограничения объекта границами холста
  const constrainToBounds = (obj) => {
    if (!canvas || !obj) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const objWidth = (obj.width || 0) * (obj.scaleX || 1);
    const objHeight = (obj.height || 0) * (obj.scaleY || 1);

    // Ограничиваем позицию X
    if ((obj.left || 0) < 0) {
      obj.left = 0;
    }
    if ((obj.left || 0) + objWidth > canvasWidth) {
      obj.left = canvasWidth - objWidth;
    }

    // Ограничиваем позицию Y
    if ((obj.top || 0) < 0) {
      obj.top = 0;
    }
    if ((obj.top || 0) + objHeight > canvasHeight) {
      obj.top = canvasHeight - objHeight;
    }
  };

  const addText = () => {
    if (!canvas) return;
    try {
      const text = new fabric.IText('Текст', {
        left: 100,
        top: 100,
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#000000',
      });
      canvas.add(text);
      constrainToBounds(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
    } catch (err) {
      console.error('Ошибка:', err);
    }
  };

  const addRectangle = () => {
    if (!canvas) return;
    try {
      const rect = new fabric.Rect({
        left: 150,
        top: 150,
        width: 200,
        height: 100,
        fill: '#3b82f6',
        stroke: '#1e40af',
        strokeWidth: 2,
      });
      canvas.add(rect);
      constrainToBounds(rect);
      canvas.setActiveObject(rect);
      canvas.renderAll();
    } catch (err) {
      console.error('Ошибка:', err);
    }
  };

  const addImage = () => {
    if (!canvas) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imgData = event.target.result;
          if (!canvas || !canvas.getContext) return;
          fabric.Image.fromURL(imgData, (img) => {
            if (!img || !canvas || !canvas.add) return;
            img.set({ 
              left: 100, 
              top: 100, 
              scaleX: 0.3, 
              scaleY: 0.3 
            });
            canvas.add(img);
            constrainToBounds(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
          });
        } catch (err) {
          console.error('Ошибка:', err);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleDeleteClick = () => {
    if (!selectedObject) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!canvas || !selectedObject) return;
    try {
      canvas.remove(selectedObject);
      canvas.discardActiveObject();
      canvas.renderAll();
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Ошибка:', err);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const tools = [
    { icon: '📝', label: 'Текст', onClick: addText, color: 'from-blue-500 to-blue-600' },
    { icon: '▭', label: 'Фигура', onClick: addRectangle, color: 'from-purple-500 to-purple-600' },
    { icon: '🖼', label: 'Изображение', onClick: addImage, color: 'from-pink-500 to-pink-600' },
  ];

  return (
    <>
      <div className="w-20 bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl shadow-xl flex flex-col items-center py-4 space-y-3 border border-slate-600">
        {tools.map((tool) => (
          <button
            key={tool.label}
            onClick={tool.onClick}
            className={`w-14 h-14 rounded-lg bg-gradient-to-br ${tool.color} hover:shadow-lg transition-all duration-200 flex items-center justify-center text-xl hover:scale-110 transform`}
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}
        
        <div className="w-12 h-px bg-slate-600 my-2"></div>
        
        <button
          onClick={handleDeleteClick}
          disabled={!selectedObject}
          className={`w-14 h-14 rounded-lg transition-all duration-200 flex items-center justify-center text-xl transform ${
            selectedObject 
              ? 'bg-gradient-to-br from-red-500 to-red-600 hover:shadow-lg hover:scale-110 cursor-pointer' 
              : 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50'
          }`}
          title="Удалить"
        >
          🗑️
        </button>
      </div>

      {/* Модальное окно подтверждения */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm">
            <div className="text-center space-y-4">
              <div className="text-5xl">⚠️</div>
              <h3 className="text-2xl font-bold">Подтверждение удаления</h3>
              <p className="text-gray-600">
                {selectedObject?.type === 'i-text' || selectedObject?.type === 'textbox'
                  ? 'Вы уверены, что хотите удалить текст?'
                  : selectedObject?.type === 'rect'
                  ? 'Вы уверены, что хотите удалить фигуру?'
                  : selectedObject?.type === 'image'
                  ? 'Вы уверены, что хотите удалить изображение?'
                  : 'Вы уверены, что хотите удалить этот объект?'}
              </p>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white font-medium hover:from-red-700 hover:to-red-600 transition shadow-lg"
                >
                  🗑️ Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Toolbar;