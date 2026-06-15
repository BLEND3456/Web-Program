import { fabric } from 'fabric';
import { addImagePlaceholder, PLACEHOLDER_JSON_PROPS } from './imagePlaceholder';

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

const BANNER_TEXT =
  'МЕЖДУНАРОДНЫЙ ОБЗОР ЭКОНОМИЧЕСКИХ И СОЦИАЛЬНЫХ РЕФОРМ НА ТЕКУЩИЙ ГОД';

const DUMMY_TEXT =
  'Инвесторы по всему миру внимательно следят за колебаниями на финансовых рынках. Макроэкономические показатели сигнализируют о нестабильности, а руководители ведомств заявляют о необходимости гибких реформ.';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Размер шрифта пропорционален и ширине, и высоте холста */
const fontSize = (cw, ch, wFactor, hFactor, minPx = 10, maxPx = 220) =>
  clamp(Math.round(Math.min(cw * wFactor, ch * hFactor)), minPx, maxPx);

/** Оценка высоты Textbox без рендера */
const estimateTextHeight = (text, width, size, lineHeight = 1.2) => {
  const charW = size * 0.52;
  const charsPerLine = Math.max(1, Math.floor(width / charW));
  const lines = String(text).split('\n').reduce((sum, paragraph) => {
    const len = paragraph.trim().length || 1;
    return sum + Math.max(1, Math.ceil(len / charsPerLine));
  }, 0);
  return Math.ceil(lines * size * lineHeight);
};

const addLine = (canvas, x1, y, x2, strokeWidth) => {
  canvas.add(
    new fabric.Line([x1, y, x2, y], {
      stroke: '#111111',
      strokeWidth,
      selectable: false,
      evented: false,
    })
  );
};

const addTextbox = (canvas, text, opts) => {
  const box = new fabric.Textbox(text, {
    selectable: true,
    splitByGrapheme: true,
    ...opts,
  });
  canvas.add(box);
  return box;
};

const columnText = (text, left, top, width, size, lineHeight, maxHeight) =>
  new fabric.Textbox(text, {
    left,
    top,
    width,
    height: maxHeight,
    fontFamily: 'Times New Roman',
    fontSize: size,
    lineHeight,
    textAlign: 'justify',
    originX: 'left',
    originY: 'top',
    splitByGrapheme: true,
  });

export const applyNewspaperTemplate = (canvas, type, pageWidth, pageHeight) => {
  if (!canvas || type === 'blank') {
    canvas?.clear();
    canvas?.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
    return;
  }

  canvas.clear();
  canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));

  const cw = pageWidth ?? canvas.width / canvas.getZoom();
  const ch = pageHeight ?? canvas.height / canvas.getZoom();
  const margin = Math.round(Math.min(cw, ch) * 0.04);
  const innerW = cw - margin * 2;
  const gapY = Math.round(ch * 0.012);

  const metaSize = fontSize(cw, ch, 0.014, 0.009, 9, 18);
  const titleSize = fontSize(cw, ch, 0.058, 0.034, 28, 140);
  const headlineSize = fontSize(cw, ch, 0.048, 0.028, 22, 110);
  const bannerSize = fontSize(cw, ch, 0.014, 0.011, 9, 20);
  const bodySize = fontSize(cw, ch, 0.017, 0.012, 9, 18);
  const captionSize = fontSize(cw, ch, 0.018, 0.013, 10, 20);

  const thickStroke = Math.max(2, Math.round(Math.min(cw, ch) * 0.003));
  const thinStroke = Math.max(1, Math.round(Math.min(cw, ch) * 0.0012));

  let y = margin;

  // Мета-строка
  const metaH = estimateTextHeight('ТОМ\nОСНОВАНА', innerW * 0.28, metaSize, 1.15);
  addTextbox(canvas, 'ТОМ XLV № 12\nОСНОВАНА В 1888 г.', {
    left: margin,
    top: y,
    width: Math.round(innerW * 0.28),
    fontFamily: 'Times New Roman',
    fontSize: metaSize,
    fontWeight: 'bold',
    textAlign: 'left',
    originX: 'left',
    originY: 'top',
  });
  addTextbox(canvas, '☀️ +17°C – +25°C\nМОСКВА, ВОСКРЕСЕНЬЕ', {
    left: cw - margin,
    top: y,
    width: Math.round(innerW * 0.28),
    fontFamily: 'Times New Roman',
    fontSize: metaSize,
    fontWeight: 'bold',
    textAlign: 'right',
    originX: 'right',
    originY: 'top',
  });
  y += metaH + gapY;

  // Верхняя линия
  addLine(canvas, margin, y, cw - margin, thinStroke);
  y += thinStroke + gapY * 1.5;

  // Название газеты — размер и позиция подстраиваются под текст
  const titleText = TEMPLATE_TITLES[type];
  const titleWidth = Math.round(innerW * 0.88);
  const titleH = estimateTextHeight(titleText, titleWidth, titleSize, 1.1);
  addTextbox(canvas, titleText, {
    left: cw / 2,
    top: y,
    width: titleWidth,
    fontFamily: 'Times New Roman',
    fontSize: titleSize,
    fontWeight: 'bold',
    textAlign: 'center',
    originX: 'center',
    originY: 'top',
    lineHeight: 1.1,
  });
  y += titleH + gapY * 1.5;

  // Декоративная двойная линия под названием
  addLine(canvas, margin, y, cw - margin, thickStroke);
  y += thickStroke + Math.round(gapY * 0.6);
  addLine(canvas, margin, y, cw - margin, thinStroke);
  y += thinStroke + gapY;

  // Подзаголовок
  const headlineH = estimateTextHeight('ГЛАВНЫЕ СОБЫТИЯ НЕДЕЛИ', innerW, headlineSize, 1.1);
  addTextbox(canvas, 'ГЛАВНЫЕ СОБЫТИЯ НЕДЕЛИ', {
    left: cw / 2,
    top: y,
    width: innerW,
    fontFamily: 'Times New Roman',
    fontSize: headlineSize,
    fontWeight: 'bold',
    textAlign: 'center',
    originX: 'center',
    originY: 'top',
    lineHeight: 1.1,
  });
  y += headlineH + gapY;

  // Чёрный баннер — высота по тексту, чтобы не обрезался
  const bannerPad = Math.round(bannerSize * 0.75);
  const bannerTextW = innerW - bannerPad * 2;
  const bannerTextH = estimateTextHeight(BANNER_TEXT, bannerTextW, bannerSize, 1.15);
  const bannerH = Math.max(bannerTextH + bannerPad * 2, Math.round(ch * 0.032));

  canvas.add(
    new fabric.Rect({
      left: cw / 2,
      top: y,
      width: innerW,
      height: bannerH,
      fill: '#111111',
      originX: 'center',
      originY: 'top',
      selectable: false,
      evented: false,
    })
  );
  addTextbox(canvas, BANNER_TEXT, {
    left: cw / 2,
    top: y + bannerH / 2,
    width: bannerTextW,
    fontFamily: 'Arial',
    fontSize: bannerSize,
    fontWeight: 'bold',
    fill: '#ffffff',
    textAlign: 'center',
    originX: 'center',
    originY: 'center',
    lineHeight: 1.15,
  });
  y += bannerH + gapY * 1.5;

  const contentTop = y;
  const bottomMargin = margin;
  const sectionGap = Math.round(ch * 0.02);

  if (type === 'classic') {
    const photoW = Math.round(innerW * 0.56);
    const photoH = Math.round((ch - contentTop - bottomMargin) * 0.42);
    const gap = Math.round(innerW * 0.025);

    addImagePlaceholder(canvas, margin, contentTop, photoW, photoH, captionSize);
    canvas.add(
      columnText(
        DUMMY_TEXT,
        margin + photoW + gap,
        contentTop,
        innerW - photoW - gap,
        bodySize,
        1.3,
        photoH
      )
    );

    const bottomTop = contentTop + photoH + sectionGap;
    const colW = (innerW - gap * 2) / 3;
    const colH = ch - bottomTop - bottomMargin;

    canvas.add(columnText(DUMMY_TEXT, margin, bottomTop, colW, bodySize, 1.25, colH));
    canvas.add(columnText(DUMMY_TEXT, margin + colW + gap, bottomTop, colW, bodySize, 1.25, colH));
    canvas.add(columnText(DUMMY_TEXT, margin + (colW + gap) * 2, bottomTop, colW, bodySize, 1.25, colH));
  } else if (type === 'business') {
    const photoW = Math.round(innerW * 0.56);
    const photoH = Math.round((ch - contentTop - bottomMargin) * 0.42);
    const gap = Math.round(innerW * 0.025);
    const textW = innerW - photoW - gap;

    canvas.add(columnText(DUMMY_TEXT, margin, contentTop, textW, bodySize, 1.3, photoH));
    addImagePlaceholder(canvas, cw - margin - photoW, contentTop, photoW, photoH, captionSize);

    const bottomTop = contentTop + photoH + sectionGap;
    const colW = (innerW - gap) / 2;
    const colH = ch - bottomTop - bottomMargin;

    canvas.add(columnText(DUMMY_TEXT, margin, bottomTop, colW, bodySize, 1.3, colH));
    canvas.add(columnText(DUMMY_TEXT, margin + colW + gap, bottomTop, colW, bodySize, 1.3, colH));
  } else if (type === 'minimal') {
    const photoW = innerW;
    const photoH = Math.round((ch - contentTop - bottomMargin) * 0.36);
    const gap = Math.round(innerW * 0.018);

    addImagePlaceholder(
      canvas,
      margin,
      contentTop,
      photoW,
      photoH,
      captionSize,
      '🖼️ ШИРОКОФОРМАТНАЯ ПАНОРАМНАЯ ФОТОГРАФИЯ ВЫПУСКА\n(Нажмите, чтобы вставить ссылку)'
    );

    const bottomTop = contentTop + photoH + sectionGap;
    const colW = (innerW - gap * 3) / 4;
    const colH = ch - bottomTop - bottomMargin;
    const colFont = fontSize(cw, ch, 0.015, 0.011, 8, 16);

    for (let i = 0; i < 4; i += 1) {
      canvas.add(columnText(DUMMY_TEXT, margin + (colW + gap) * i, bottomTop, colW, colFont, 1.2, colH));
    }
  }

  canvas.renderAll();
};

export const buildNewspaperTemplateJSON = (type, width, height) => {
  if (!type || type === 'blank') return null;

  const canvas = new fabric.StaticCanvas(null, { width, height });
  canvas.setDimensions({ width, height });

  applyNewspaperTemplate(canvas, type, width, height);

  canvas.getObjects().forEach((obj) => {
    if (obj.styles) obj.styles = {};
  });

  const json = canvas.toJSON(['version', 'objects', 'background', ...PLACEHOLDER_JSON_PROPS]);
  json.width = width;
  json.height = height;

  canvas.dispose();
  return JSON.parse(JSON.stringify(json));
};
