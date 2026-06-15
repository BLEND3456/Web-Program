import { fabric } from 'fabric';

export const NEWSPAPER_TEMPLATES = [
  { id: 'blank', name: 'Пустой', desc: 'Белый холст' },
  { id: 'classic', name: 'Городские вести', desc: 'Фото слева, 3 колонки' },
  { id: 'business', name: 'Деловой вестник', desc: 'Фото справа, 2 колонки' },
  { id: 'minimal', name: 'Воскресный выпуск', desc: 'Панорама, 4 колонки' },
];

const TEMPLATE_TITLES = {
  classic: 'ГОРОДСКИЕ ВЕСТИ',
  business: 'ДЕЛОВОЙ ВЕСТНИК',
  minimal: 'ВОСКРЕСНЫЙ ВЫПУСК',
};

export const applyNewspaperTemplate = (canvas, type) => {
  if (!canvas || type === 'blank') {
    canvas?.clear();
    canvas?.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
    return;
  }

  canvas.clear();
  canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));

  const cw = canvas.width / canvas.getZoom();
  const ch = canvas.height / canvas.getZoom();
  const margin = Math.round(cw * 0.05);

  const line1Top = Math.round(ch * 0.03);
  const textTop = Math.round(ch * 0.045);
  const logoTop = Math.round(ch * 0.065);
  const line2Top = Math.round(ch * 0.14);
  const headlineTop = Math.round(ch * 0.155);
  const subBannerTop = Math.round(ch * 0.225);
  const contentTop = Math.round(ch * 0.295);

  canvas.add(new fabric.Line([margin, line1Top, cw - margin, line1Top], { stroke: '#111111', strokeWidth: Math.max(3, cw * 0.004), selectable: false }));
  canvas.add(new fabric.Line([margin, line2Top, cw - margin, line2Top], { stroke: '#111111', strokeWidth: Math.max(1, cw * 0.0015), selectable: false }));

  canvas.add(new fabric.Textbox('☀️ +17°C – +25°C\nМОСКВА, ВОСКРЕСЕНЬЕ', { left: cw - margin, top: textTop, width: Math.round(cw * 0.25), fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.014), fontWeight: 'bold', textAlign: 'right', originX: 'right', originY: 'top' }));
  canvas.add(new fabric.Textbox('ТОМ XLV № 12\nОСНОВАНА В 1888 г.', { left: margin, top: textTop, width: Math.round(cw * 0.25), fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.014), fontWeight: 'bold', textAlign: 'left', originX: 'left', originY: 'top' }));

  canvas.add(new fabric.Textbox(TEMPLATE_TITLES[type], { left: cw / 2, top: logoTop, width: Math.round(cw * 0.6), fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.062), fontWeight: 'bold', textAlign: 'center', originX: 'center', originY: 'top' }));
  canvas.add(new fabric.Line([margin, line2Top + Math.round(ch * 0.006), cw - margin, line2Top + Math.round(ch * 0.006)], { stroke: '#111111', strokeWidth: Math.max(3, cw * 0.004), selectable: false }));

  canvas.add(new fabric.Textbox('ГЛАВНЫЕ СОБЫТИЯ НЕДЕЛИ', { left: cw / 2, top: headlineTop, width: cw - margin * 2, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.052), fontWeight: 'bold', textAlign: 'center', originX: 'center', originY: 'top' }));

  const bannerH = Math.round(ch * 0.045);
  canvas.add(new fabric.Rect({ left: cw / 2, top: subBannerTop, width: cw - margin * 2, height: bannerH, fill: '#111111', originX: 'center', originY: 'top' }));
  canvas.add(new fabric.Textbox('МЕЖДУНАРОДНЫЙ ОБЗОР ЭКОНОМИЧЕСКИХ И СОЦИАЛЬНЫХ РЕФОРМ НА ТЕКУЩИЙ ГОД', { left: cw / 2, top: subBannerTop + bannerH / 2, width: cw - margin * 2 - 40, fontFamily: 'Arial', fontSize: Math.round(cw * 0.015), fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', originX: 'center', originY: 'center' }));

  const dummyText = 'Инвесторы по всему миру внимательно следят за беспрецедентными колебаниями на финансовых рынках, поскольку ключевые макроэкономические показатели сигнализируют о нестабильности. Корректировки процентных ставок, резкие скачки цен на сырьевые товары и новые отчеты о корпоративных доходах сформировали крайне непредсказуемую среду. Руководители ведомств заявляют о необходимости внедрения гибких систем реагирования на вызовы.';

  if (type === 'classic') {
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
    const photoW = cw - margin * 2;
    const photoH = Math.round(ch * 0.24);
    const gap = Math.round(cw * 0.018);

    canvas.add(new fabric.Rect({ left: margin, top: contentTop, width: photoW, height: photoH, fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [10, 5], originX: 'left', originY: 'top' }));
    canvas.add(new fabric.Textbox('🖼️ ШИРОКОФОРМАТНАЯ ПАНОРАМНАЯ ФОТОГРАФИЯ ВЫПУСКА', { left: cw / 2, top: contentTop + photoH / 2, width: photoW - 60, fontFamily: 'Arial', fontSize: Math.round(cw * 0.018), fontWeight: 'bold', fill: '#64748b', textAlign: 'center', originX: 'center', originY: 'center' }));

    const colW = (cw - margin * 2 - gap * 3) / 4;
    const bottomTop = contentTop + photoH + Math.round(ch * 0.03);

    canvas.add(new fabric.Textbox(dummyText, { left: margin, top: bottomTop, width: colW, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.0145), lineHeight: 1.2, textAlign: 'justify', originX: 'left', originY: 'top' }));
    canvas.add(new fabric.Textbox(dummyText, { left: margin + colW + gap, top: bottomTop, width: colW, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.0145), lineHeight: 1.2, textAlign: 'justify', originX: 'left', originY: 'top' }));
    canvas.add(new fabric.Textbox(dummyText, { left: margin + (colW * 2) + gap * 2, top: bottomTop, width: colW, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.0145), lineHeight: 1.2, textAlign: 'justify', originX: 'left', originY: 'top' }));
    canvas.add(new fabric.Textbox(dummyText, { left: margin + (colW * 3) + gap * 3, top: bottomTop, width: colW, fontFamily: 'Times New Roman', fontSize: Math.round(cw * 0.0145), lineHeight: 1.2, textAlign: 'justify', originX: 'left', originY: 'top' }));
  }

  canvas.renderAll();
};

export const buildNewspaperTemplateJSON = (type, width, height) => {
  if (!type || type === 'blank') return null;

  const canvas = new fabric.StaticCanvas(null, { width, height });
  canvas.setDimensions({ width, height });

  applyNewspaperTemplate(canvas, type);

  canvas.getObjects().forEach((obj) => {
    if (obj.styles) obj.styles = {};
  });

  const json = canvas.toJSON(['version', 'objects', 'background']);
  json.width = width;
  json.height = height;

  canvas.dispose();
  return JSON.parse(JSON.stringify(json));
};
