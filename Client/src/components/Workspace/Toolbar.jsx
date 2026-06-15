import { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { fabric } from 'fabric';
import { applyNewspaperTemplate } from '../../utils/newspaperTemplates';
// Импортируем стильные иконки из Lucide
import { 
  Grid, 
  FileText, 
  Briefcase, 
  Newspaper, 
  Type, 
  Heading2, 
  AlignLeft, 
  Square, 
  Circle, 
  Triangle, 
  Image, 
  Trash2 
} from 'lucide-react';

const Toolbar = () => {
  const { canvas } = useWorkspace();
  const [confirmConfig, setConfirmConfig] = useState(null); // Стейт для кастомного диалогового окна

  // --- ДИНАМИЧЕСКАЯ ГАЗЕТНАЯ СЕТКА ---
  const toggleGrid = () => {
    if (!canvas) return;
    const existingLines = canvas.getObjects().filter(o => o.isGridLine);
    if (existingLines.length > 0) {
      existingLines.forEach(line => canvas.remove(line));
      canvas.renderAll();
      return;
    }
    const cw = canvas.width / canvas.getZoom();
    const ch = canvas.height / canvas.getZoom();
    
    const columns = 4; const rows = 5; 
    const margin = Math.round(cw * 0.05); 
    const gutter = Math.round(cw * 0.02); 
    const colWidth = (cw - (margin * 2) - (gutter * (columns - 1))) / columns;
    const rowHeight = (ch - (margin * 2) - (gutter * (rows - 1))) / rows;

    const lineOptions = { stroke: '#0ea5e9', strokeWidth: 1.5 / canvas.getZoom(), selectable: false, evented: false, excludeFromExport: true, isGridLine: true, opacity: 0.6 };
    canvas.add(new fabric.Line([margin, 0, margin, ch], lineOptions));
    canvas.add(new fabric.Line([cw - margin, 0, cw - margin, ch], lineOptions));
    canvas.add(new fabric.Line([0, margin, cw, margin], lineOptions));
    canvas.add(new fabric.Line([0, ch - margin, cw, ch - margin], lineOptions));

    for (let i = 1; i < columns; i++) {
      const x = margin + (i * colWidth) + ((i - 1) * gutter);
      canvas.add(new fabric.Line([x, margin, x, ch - margin], lineOptions));
      canvas.add(new fabric.Line([x + gutter, margin, x + gutter, ch - margin], lineOptions));
    }
    for (let i = 1; i < rows; i++) {
      const y = margin + (i * rowHeight) + ((i - 1) * gutter);
      canvas.add(new fabric.Line([margin, y, cw - margin, y], lineOptions));
      canvas.add(new fabric.Line([margin, y + gutter, cw - margin, y + gutter], lineOptions));
    }
    canvas.renderAll();
  };

  // Внутренняя функция логики пресетов (вызывается после одобрения в модале)
  const executeApplyPreset = (type) => {
    applyNewspaperTemplate(canvas, type);
  };

  const applyPreset = (type) => {
    if (!canvas) return;
    setConfirmConfig({
      message: 'Применение пресета очистит текущий холст и удалит все ваши изменения. Продолжить?',
      onConfirm: () => executeApplyPreset(type)
    });
  };

  // ==========================================
  // СТАНДАРТНЫЕ ИНСТРУМЕНТЫ
  // ==========================================
  const addHeadline = () => {
    if (!canvas) return;
    const cw = canvas.width / canvas.getZoom(); const ch = canvas.height / canvas.getZoom();
    const text = new fabric.Textbox('ГЛАВНЫЙ ЗАГОЛОВОК', { left: cw / 2, top: ch / 6, width: cw - 120, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.085), fontWeight: 'bold', fill: '#111111', textAlign: 'center', originX: 'center', originY: 'top' });
    canvas.add(text); canvas.setActiveObject(text); canvas.renderAll();
  };

  const addSubhead = () => {
    if (!canvas) return;
    const cw = canvas.width / canvas.getZoom(); const ch = canvas.height / canvas.getZoom();
    const text = new fabric.Textbox('Заголовок колонки', { left: cw / 2, top: ch / 3, width: Math.round(cw * 0.28), fontFamily: 'Arial', fontSize: Math.round(cw * 0.035), fontWeight: 'bold', fill: '#111111', textAlign: 'left', originX: 'center', originY: 'top' });
    canvas.add(text); canvas.setActiveObject(text); canvas.renderAll();
  };

  const addBodyText = () => {
    if (!canvas) return;
    const cw = canvas.width / canvas.getZoom(); const ch = canvas.height / canvas.getZoom();
    const text = new fabric.Textbox('Таким образом, постоянное информационно-пропагандистское обеспечение нашей текущей деятельности требует от нас комплексного анализа и глубокой проработки форм развития.', { left: cw / 2, top: ch / 2, width: Math.round(cw * 0.28), fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.0195), lineHeight: 1.25, fill: '#333333', textAlign: 'justify', originX: 'center', originY: 'top' });
    canvas.add(text); canvas.setActiveObject(text); canvas.renderAll();
  };

  const addRectangle = () => {
    if (!canvas) return;
    const cw = canvas.width / canvas.getZoom(); const ch = canvas.height / canvas.getZoom();
    const rect = new fabric.Rect({ left: cw / 2, top: ch / 2, width: Math.round(cw * 0.25), height: Math.round(ch * 0.15), fill: '#818cf8', rx: 16, ry: 16, originX: 'center', originY: 'top' });
    canvas.add(rect); canvas.setActiveObject(rect); canvas.renderAll();
  };

  const addCircle = () => {
    if (!canvas) return;
    const cw = canvas.width / canvas.getZoom(); const ch = canvas.height / canvas.getZoom();
    const circle = new fabric.Circle({ left: cw / 2, top: ch / 2, radius: Math.round(cw * 0.1), fill: '#818cf8', originX: 'center', originY: 'top' });
    canvas.add(circle); canvas.setActiveObject(circle); canvas.renderAll();
  };

  const addTriangle = () => {
    if (!canvas) return;
    const cw = canvas.width / canvas.getZoom(); const ch = canvas.height / canvas.getZoom();
    const triangle = new fabric.Triangle({ left: cw / 2, top: ch / 2, width: Math.round(cw * 0.2), height: Math.round(cw * 0.2), fill: '#818cf8', originX: 'center', originY: 'top' });
    canvas.add(triangle); canvas.setActiveObject(triangle); canvas.renderAll();
  };

  const addImage = () => {
    if (!canvas) return;
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        fabric.Image.fromURL(event.target.result, (img) => {
          if (!img || !canvas) return;
          const cw = canvas.width / canvas.getZoom(); const ch = canvas.height / canvas.getZoom();
          img.scaleToWidth(Math.round(cw * 0.3)); img.set({ left: cw / 2, top: ch / 2, originX: 'center', originY: 'top' });
          canvas.add(img); canvas.setActiveObject(img); canvas.renderAll();
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const clearCanvas = () => {
    if (!canvas) return;
    setConfirmConfig({
      message: 'Вы уверены, что хотите полностью очистить холст? Все элементы будут удалены.',
      onConfirm: () => {
        canvas.clear(); 
        canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-app-bg border-r border-app-border max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar select-none w-full items-center">
      
      {/* ГРУППА 1: УПРАВЛЕНИЕ СЕТКОЙ */}
      <button onClick={toggleGrid} className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all group w-12 h-12 flex items-center justify-center" title="Сетка (Направляющие)">
        <Grid className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.5} />
      </button>

      {/* РАЗДЕЛИТЕЛЬ */}
      <div className="h-[1px] w-10 mx-auto bg-white/10 my-2 shrink-0"></div>
      
      {/* ГРУППА 2: ГОТОВЫЕ ГАЗЕТНЫЕ ШАБЛОНЫ (ИКОНКИ LUCIDE ВМЕСТО ТЕКСТА) */}
      <div className="flex flex-col gap-1.5 w-full items-center">
        <button onClick={() => applyPreset('classic')} className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-all w-12 h-12 flex items-center justify-center group" title="Макет: ГОРОДСКИЕ ВЕСТИ">
          <FileText className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
        </button>
        <button onClick={() => applyPreset('business')} className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all w-12 h-12 flex items-center justify-center group" title="Макет: ДЕЛОВОЙ ВЕСТНИК">
          <Briefcase className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
        </button>
        <button onClick={() => applyPreset('minimal')} className="p-3 rounded-xl border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 transition-all w-12 h-12 flex items-center justify-center group" title="Макет: ВОСКРЕСНЫЙ ВЫПУСК">
          <Newspaper className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
        </button>
      </div>

      {/* РАЗДЕЛИТЕЛЬ */}
      <div className="h-[1px] w-10 mx-auto bg-white/10 my-2 shrink-0"></div>
      
      {/* ГРУППА 3: ТЕКСТОВЫЕ ИНСТРУМЕНТЫ */}
      <div className="flex flex-col gap-1 items-center">
        <button onClick={addHeadline} className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all group flex items-center justify-center w-12 h-12" title="Добавить главный заголовок">
          <Type className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
        </button>
        <button onClick={addSubhead} className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all group flex items-center justify-center w-12 h-12" title="Добавить подзаголовок колонки">
          <Heading2 className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
        </button>
        <button onClick={addBodyText} className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all group flex items-center justify-center w-12 h-12" title="Добавить статью / текстовую колонку">
          <AlignLeft className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
        </button>
      </div>

      {/* РАЗДЕЛИТЕЛЬ */}
      <div className="h-[1px] w-10 mx-auto bg-white/10 my-2 shrink-0"></div>
      
      {/* ГРУППА 4: ФИГУРЫ И КАРТИНКИ */}
      <div className="flex flex-col gap-1 items-center">
        <button onClick={addRectangle} className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all w-12 h-12 flex items-center justify-center group" title="Добавить прямоугольник">
          <Square className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
        </button>
        <button onClick={addCircle} className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all w-12 h-12 flex items-center justify-center group" title="Добавить круг">
          <Circle className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
        </button>
        <button onClick={addTriangle} className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all w-12 h-12 flex items-center justify-center group" title="Добавить треугольник">
          <Triangle className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
        </button>
        <button onClick={addImage} className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all w-12 h-12 flex items-center justify-center group" title="Загрузить изображение">
          <Image className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
        </button>
      </div>

      {/* РАЗДЕЛИТЕЛЬ */}
      <div className="h-[1px] w-10 mx-auto bg-white/10 my-2 shrink-0"></div>
      
      {/* ГРУППА 5: ОПАСНЫЕ ДЕЙСТВИЯ (ОЧИСТКА) */}
      <button onClick={clearCanvas} className="p-3 rounded-xl hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all w-12 h-12 flex items-center justify-center group" title="Полностью очистить страницу">
        <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.75} />
      </button>

      {/* ==========================================
          КАСТОМНОЕ ДИАЛОГОВОЕ ОКНО ПОДТВЕРЖДЕНИЯ
         ========================================== */}
      {confirmConfig && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999]">
          <div className="bg-app-bg border border-white/10 p-6 rounded-2xl w-[340px] shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-base">⚠️</span>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Подтверждение</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {confirmConfig.message}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmConfig(null)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-[11px] uppercase tracking-wider text-slate-300 border border-app-border transition-all"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmConfig.onConfirm();
                  setConfirmConfig(null);
                }}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10"
              >
                Да, уверен
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Toolbar;