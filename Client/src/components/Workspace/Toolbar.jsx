import { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { fabric } from 'fabric';

const Toolbar = () => {
  const { canvas, selectedObject } = useWorkspace();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const constrainToBounds = (obj) => {
    if (!canvas || !obj) return;
    const cw = canvas.width, ch = canvas.height;
    const ow = (obj.width || 0) * (obj.scaleX || 1), oh = (obj.height || 0) * (obj.scaleY || 1);
    if ((obj.left || 0) < 0) obj.left = 0;
    if ((obj.left || 0) + ow > cw) obj.left = cw - ow;
    if ((obj.top || 0) < 0) obj.top = 0;
    if ((obj.top || 0) + oh > ch) obj.top = ch - oh;
  };

  const addText = () => {
    if (!canvas) return;
    try {
      const text = new fabric.IText('Ваш текст', { left: 100, top: 100, fontFamily: 'Arial', fontSize: 32, fill: '#1e293b' });
      canvas.add(text); constrainToBounds(text); canvas.setActiveObject(text); canvas.renderAll();
    } catch (err) { console.error(err); }
  };

  const addRectangle = () => {
    if (!canvas) return;
    try {
      const rect = new fabric.Rect({ left: 150, top: 150, width: 150, height: 150, fill: '#818cf8', rx: 16, ry: 16 });
      canvas.add(rect); constrainToBounds(rect); canvas.setActiveObject(rect); canvas.renderAll();
    } catch (err) { console.error(err); }
  };

  const addImage = () => {
    if (!canvas) return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        fabric.Image.fromURL(event.target.result, (img) => {
          if (!img || !canvas) return;
          img.set({ left: 100, top: 100, scaleX: 0.5, scaleY: 0.5 });
          canvas.add(img); constrainToBounds(img); canvas.setActiveObject(img); canvas.renderAll();
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const tools = [
    { icon: '📝', label: 'Текст', onClick: addText },
    { icon: '🔲', label: 'Фигура', onClick: addRectangle },
    { icon: '🖼️', label: 'Картинка', onClick: addImage },
  ];

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center py-4 space-y-2">
        {tools.map((tool) => (
          <button
            key={tool.label} onClick={tool.onClick} title={tool.label}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all hover:scale-105"
          >
            {tool.icon}
          </button>
        ))}
        
        <div className="w-8 h-[2px] bg-slate-100 my-2 rounded-full"></div>
        
        <button
          onClick={() => setShowDeleteModal(true)} disabled={!selectedObject} title="Удалить"
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${
            selectedObject ? 'hover:bg-rose-50 text-slate-500 hover:text-rose-600 hover:scale-105 cursor-pointer' : 'opacity-30 cursor-not-allowed grayscale'
          }`}
        >
          🗑️
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">🗑️</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Удалить объект?</h3>
            <p className="text-sm text-slate-500 mb-6">Это действие нельзя будет отменить.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Отмена</button>
              <button onClick={() => { if (canvas && selectedObject) { canvas.remove(selectedObject); canvas.discardActiveObject(); canvas.renderAll(); } setShowDeleteModal(false); }} className="flex-1 py-3 text-sm font-medium text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-all shadow-md shadow-rose-200">Удалить</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Toolbar;