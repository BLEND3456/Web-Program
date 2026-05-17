import { useWorkspace } from '../../context/WorkspaceContext';
import { fabric } from 'fabric';

const Toolbar = () => {
  const { canvas } = useWorkspace();

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

  // ==========================================
  // ИСПРАВЛЕННЫЙ УНИВЕРСАЛЬНЫЙ ГЕНЕРАТОР МАКЕТОВ
  // ==========================================
  const applyPreset = (type) => {
    if (!canvas) return;
    if (!window.confirm('Применение пресета очистит текущий холст. Продолжить?')) return;
    
    canvas.clear();
    canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));

    const cw = canvas.width / canvas.getZoom();
    const ch = canvas.height / canvas.getZoom();
    const margin = Math.round(cw * 0.05); 

    // Структурная разметка шапки по высоте страницы
    const line1Top = Math.round(ch * 0.03);
    const textTop = Math.round(ch * 0.045);
    const logoTop = Math.round(ch * 0.065);
    const line2Top = Math.round(ch * 0.14);
    const headlineTop = Math.round(ch * 0.155);
    const subBannerTop = Math.round(ch * 0.225);
    const contentTop = Math.round(ch * 0.295);

    const titles = {
      classic: 'ГОРОДСКИЕ ВЕСТИ',
      business: 'ДЕЛОВОЙ ВЕСТНИК',
      minimal: 'ВОСКРЕСНЫЙ ВЫПУСК'
    };

    // Отрисовка базовой газетной рамки шапки
    canvas.add(new fabric.Line([margin, line1Top, cw - margin, line1Top], { stroke: '#111111', strokeWidth: Math.max(3, cw * 0.004), selectable: false }));
    canvas.add(new fabric.Line([margin, line2Top, cw - margin, line2Top], { stroke: '#111111', strokeWidth: Math.max(1, cw * 0.0015), selectable: false }));
    
    // Техническая информация в углах шапки
    canvas.add(new fabric.Textbox('☀️ +17°C – +25°C\nМОСКВА, ВОСКРЕСЕНЬЕ', { left: cw - margin, top: textTop, width: Math.round(cw * 0.25), fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.014), fontWeight: 'bold', textAlign: 'right', originX: 'right', originY: 'top' }));
    canvas.add(new fabric.Textbox('ТОМ XLV № 12\nОСНОВАНА В 1888 г.', { left: margin, top: textTop, width: Math.round(cw * 0.25), fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.014), fontWeight: 'bold', textAlign: 'left', originX: 'left', originY: 'top' }));

    // Главный пропорциональный логотип
    canvas.add(new fabric.Textbox(titles[type], { left: cw / 2, top: logoTop, width: Math.round(cw * 0.6), fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.062), fontWeight: 'bold', textAlign: 'center', originX: 'center', originY: 'top' }));
    
    // Жирный разделитель под логотипом
    canvas.add(new fabric.Line([margin, line2Top + Math.round(ch * 0.006), cw - margin, line2Top + Math.round(ch * 0.006)], { stroke: '#111111', strokeWidth: Math.max(3, cw * 0.004), selectable: false }));

    // Главный заголовок новости (Векторный шрифт)
    canvas.add(new fabric.Textbox('ГЛАВНЫЕ СОБЫТИЯ НЕДЕЛИ', { left: cw / 2, top: headlineTop, width: cw - margin * 2, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.052), fontWeight: 'bold', textAlign: 'center', originX: 'center', originY: 'top' }));
    
    // Контрастная плашка-подзаголовок
    const bannerH = Math.round(ch * 0.045);
    canvas.add(new fabric.Rect({ left: cw / 2, top: subBannerTop, width: cw - margin * 2, height: bannerH, fill: '#111111', originX: 'center', originY: 'top' }));
    canvas.add(new fabric.Textbox('МЕЖДУНАРОДНЫЙ ОБЗОР ЭКОНОМИЧЕСКИХ И СОЦИАЛЬНЫХ РЕФОРМ НА ТЕКУЩИЙ ГОД', { left: cw / 2, top: subBannerTop + bannerH / 2, width: cw - margin * 2 - 40, fontFamily: 'Arial', fontSize: Math.round(cw * 0.015), fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', originX: 'center', originY: 'center' }));

    // Текст-заглушка на русском (Выравнивание "Кирпичом" Justify)
    const dummyText = 'Инвесторы по всему миру внимательно следят за беспрецедентными колебаниями на финансовых рынках, поскольку ключевые макроэкономические показатели сигнализируют о нестабильности. Корректировки процентных ставок, резкие скачки цен на сырьевые товары и новые отчеты о корпоративных доходах сформировали крайне непредсказуемую среду. Руководители ведомств заявляют о необходимости внедрения гибких систем реагирования на вызовы.';

    // Разделение структуры макета на основе выбранного типа
    if (type === 'classic') {
      // МАКЕТ №1: "ГОРОДСКИЕ ВЕСТИ" (Фото слева, текст справа, 3 колонки внизу)
      const photoW = Math.round(cw * 0.56);
      const photoH = Math.round(ch * 0.28);
      const gap = Math.round(cw * 0.025);

      canvas.add(new fabric.Rect({ left: margin, top: contentTop, width: photoW, height: photoH, fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [10, 5], originX: 'left', originY: 'top' }));
      canvas.add(new fabric.Textbox('🖼️ ГЛАВНОЕ ИЗОБРАЖЕНИЕ\n(Замените кнопкой фото)', { left: margin + photoW / 2, top: contentTop + photoH / 2, width: photoW - 40, fontFamily: 'Arial', fontSize: Math.round(cw * 0.018), fontWeight: 'bold', fill: '#64748b', textAlign: 'center', originX: 'center', originY: 'center' }));

      canvas.add(new fabric.Textbox(dummyText, { left: margin + photoW + gap, top: contentTop, width: cw - margin * 2 - photoW - gap, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.0175), lineHeight: 1.3, textAlign: 'justify', originX: 'left', originY: 'top' }));

      const colW = (cw - margin * 2 - gap * 2) / 3;
      const bottomTop = contentTop + photoH + Math.round(ch * 0.03);
      
      canvas.add(new fabric.Textbox(dummyText, { left: margin, top: bottomTop, width: colW, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.016), lineHeight: 1.25, textAlign: 'justify', originX: 'left', originY: 'top' }));
      canvas.add(new fabric.Textbox(dummyText, { left: margin + colW + gap, top: bottomTop, width: colW, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.016), lineHeight: 1.25, textAlign: 'justify', originX: 'left', originY: 'top' }));
      canvas.add(new fabric.Textbox(dummyText, { left: margin + (colW * 2) + gap * 2, top: bottomTop, width: colW, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.016), lineHeight: 1.25, textAlign: 'justify', originX: 'left', originY: 'top' }));

    } else if (type === 'business') {
      // МАКЕТ №2: "ДЕЛОВОЙ ВЕСТНИК" (Текст слева, фото справа, 2 широкие колонки внизу)
      const photoW = Math.round(cw * 0.56);
      const photoH = Math.round(ch * 0.28);
      const gap = Math.round(cw * 0.025);

      canvas.add(new fabric.Textbox(dummyText, { left: margin, top: contentTop, width: cw - margin * 2 - photoW - gap, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.0175), lineHeight: 1.3, textAlign: 'justify', originX: 'left', originY: 'top' }));

      canvas.add(new fabric.Rect({ left: cw - margin - photoW, top: contentTop, width: photoW, height: photoH, fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [10, 5], originX: 'left', originY: 'top' }));
      canvas.add(new fabric.Textbox('🖼️ ГЛАВНОЕ ИЗОБРАЖЕНИЕ\n(Замените кнопкой фото)', { left: (cw - margin - photoW) + photoW / 2, top: contentTop + photoH / 2, width: photoW - 40, fontFamily: 'Arial', fontSize: Math.round(cw * 0.018), fontWeight: 'bold', fill: '#64748b', textAlign: 'center', originX: 'center', originY: 'center' }));

      const colW = (cw - margin * 2 - gap) / 2;
      const bottomTop = contentTop + photoH + Math.round(ch * 0.03);

      canvas.add(new fabric.Textbox(dummyText, { left: margin, top: bottomTop, width: colW, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.0165), lineHeight: 1.3, textAlign: 'justify', originX: 'left', originY: 'top' }));
      canvas.add(new fabric.Textbox(dummyText, { left: margin + colW + gap, top: bottomTop, width: colW, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.0165), lineHeight: 1.3, textAlign: 'justify', originX: 'left', originY: 'top' }));

    } else if (type === 'minimal') {
      // МАКЕТ №3: "ВОСКРЕСНЫЙ ВЫПУСК" (Большое панорамное фото по центру, 4 колонки внизу)
      const photoW = cw - margin * 2;
      const photoH = Math.round(ch * 0.24);
      const gap = Math.round(cw * 0.018);

      canvas.add(new fabric.Rect({ left: margin, top: contentTop, width: photoW, height: photoH, fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [10, 5], originX: 'left', originY: 'top' }));
      canvas.add(new fabric.Textbox('🖼️ ШИРОКОФОРМАТНАЯ ПАНOРАМНАЯ ФОТОГРАФИЯ ВЫПУСКА', { left: cw / 2, top: contentTop + photoH / 2, width: photoW - 60, fontFamily: 'Arial', fontSize: Math.round(cw * 0.018), fontWeight: 'bold', fill: '#64748b', textAlign: 'center', originX: 'center', originY: 'center' }));

      const colW = (cw - margin * 2 - gap * 3) / 4;
      const bottomTop = contentTop + photoH + Math.round(ch * 0.03);

      canvas.add(new fabric.Textbox(dummyText, { left: margin, top: bottomTop, width: colW, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.0145), lineHeight: 1.2, textAlign: 'justify', originX: 'left', originY: 'top' }));
      canvas.add(new fabric.Textbox(dummyText, { left: margin + colW + gap, top: bottomTop, width: colW, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.0145), lineHeight: 1.2, textAlign: 'justify', originX: 'left', originY: 'top' }));
      canvas.add(new fabric.Textbox(dummyText, { left: margin + (colW * 2) + gap * 2, top: bottomTop, width: colW, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.0145), lineHeight: 1.2, textAlign: 'justify', originX: 'left', originY: 'top' }));
      canvas.add(new fabric.Textbox(dummyText, { left: margin + (colW * 3) + gap * 3, top: bottomTop, width: colW, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.0145), lineHeight: 1.2, textAlign: 'justify', originX: 'left', originY: 'top' }));
    }

    canvas.renderAll();
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
    if (window.confirm('Очистить холст?')) {
      canvas.clear(); canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full px-2">
      <button onClick={toggleGrid} className="p-3 mb-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all group" title="Сетка (Направляющие)">
        <svg className="w-6 h-6 mx-auto group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4V4zm0 8h16M12 4v16M8 4v16M16 4v16" /></svg>
      </button>
      <div className="h-[1px] w-8 mx-auto bg-white/10 my-1"></div>
      
      {/* СИНХРОНИЗИРОВАННЫЕ КНОПКИ ПРЕСЕТОВ */}
      <button onClick={() => applyPreset('classic')} className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/20 text-amber-400 font-serif text-[10px] font-bold text-center transition-all">
        📜 ГОРОДСКИЕ ВЕСТИ
      </button>
      <button onClick={() => applyPreset('business')} className="p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-400 font-sans text-[10px] font-bold text-center transition-all">
        📊 ДЕЛО́ВОЙ ВЕСТНИК
      </button>
      <button onClick={() => applyPreset('minimal')} className="p-2 rounded-xl border border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/20 text-sky-400 font-mono text-[10px] font-bold text-center transition-all">
        📰 ВОСКРЕСНЫЙ ВЫПУСК
      </button>

      <div className="h-[1px] w-8 mx-auto bg-white/10 my-1"></div>
      <button onClick={addHeadline} className="p-3 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-indigo-400 group flex flex-col items-center gap-1"><span className="text-2xl font-serif font-bold text-white group-hover:scale-110 transition-transform">T</span></button>
      <button onClick={addSubhead} className="p-3 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-indigo-400 group flex flex-col items-center gap-1"><span className="text-lg font-sans font-bold text-slate-300 group-hover:scale-110 transition-transform">T</span></button>
      <button onClick={addBodyText} className="p-3 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-indigo-400 group flex flex-col items-center gap-1"><svg className="w-5 h-5 mx-auto text-slate-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" /></svg></button>
      <div className="h-[1px] w-8 mx-auto bg-white/10 my-1"></div>
      <button onClick={addRectangle} className="p-3 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-indigo-400 group"><div className="w-5 h-5 border-2 border-current rounded-sm group-hover:scale-110 transition-transform mx-auto"></div></button>
      <button onClick={addCircle} className="p-3 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-indigo-400 group"><div className="w-5 h-5 border-2 border-current rounded-full group-hover:scale-110 transition-transform mx-auto"></div></button>
      <button onClick={addTriangle} className="p-3 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-indigo-400 group"><svg className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 3L2 21H22L12 3Z" /></svg></button>
      <button onClick={addImage} className="p-3 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-indigo-400 group"><svg className="w-6 h-6 mx-auto group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></button>
      <div className="h-[1px] w-8 mx-auto bg-white/10 my-1"></div>
      <button onClick={clearCanvas} className="p-3 rounded-xl hover:bg-rose-500/20 transition-all text-slate-500 hover:text-rose-400 group"><svg className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
    </div>
  );
};

export default Toolbar;