const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const buildFontCss = (embedFonts = true) => {
  if (!embedFonts) return '';
  const fontPath = path.join(__dirname, '../fonts/arial.ttf');
  if (!fs.existsSync(fontPath)) return '';
  const fontBase64 = fs.readFileSync(fontPath).toString('base64');
  return `
    @font-face {
      font-family: 'Arial';
      src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
    }
  `;
};

const buildCropMarksSvg = (trimW, trimH, bleed, markLen = 24) => {
  const totalW = trimW + bleed * 2;
  const totalH = trimH + bleed * 2;
  const x0 = bleed;
  const y0 = bleed;
  const x1 = bleed + trimW;
  const y1 = bleed + trimH;
  const m = markLen;

  const hLines = [
    [x0 - m, y0, x0, y0], [x0, y0, x0, y0 - m],
    [x1, y0, x1 + m, y0], [x1, y0, x1, y0 - m],
    [x0 - m, y1, x0, y1], [x0, y1, x0, y1 + m],
    [x1, y1, x1 + m, y1], [x1, y1, x1, y1 + m],
  ];

  const paths = hLines
    .map(([x1l, y1l, x2l, y2l]) => `<line x1="${x1l}" y1="${y1l}" x2="${x2l}" y2="${y2l}" stroke="#000" stroke-width="0.75"/>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" style="position:absolute;inset:0;pointer-events:none">${paths}</svg>`;
};

exports.generatePDF = async (project, options = {}) => {
  const dpi = options.dpi === 72 ? 72 : 300;
  const colorProfile = options.colorProfile === 'cmyk' ? 'cmyk' : 'rgb';
  const cropMarks = Boolean(options.cropMarks);
  const bleeds = Boolean(options.bleeds);
  const embedFonts = options.embedFonts !== false;

  const trimW = project.width;
  const trimH = project.height;
  const bleed = bleeds ? Math.round(Math.min(trimW, trimH) * 0.03) : 0;
  const totalW = trimW + bleed * 2;
  const totalH = trimH + bleed * 2;
  const scale = dpi / 96;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    const designData = project.designSettings || {};
    const fontCss = buildFontCss(embedFonts);
    const cropSvg = cropMarks ? buildCropMarksSvg(trimW, trimH, bleed) : '';
    const cmykCss = colorProfile === 'cmyk'
      ? 'filter: contrast(1.08) saturate(0.88); -webkit-print-color-adjust: exact; print-color-adjust: exact;'
      : '-webkit-print-color-adjust: exact; print-color-adjust: exact;';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${fontCss}
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            background: white;
            font-family: Arial, Helvetica, sans-serif;
            ${cmykCss}
          }
          #wrap {
            position: relative;
            width: ${totalW}px;
            height: ${totalH}px;
            background: #fff;
            overflow: visible;
          }
          #canvas-offset {
            position: absolute;
            left: ${bleed}px;
            top: ${bleed}px;
            width: ${trimW}px;
            height: ${trimH}px;
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
      </head>
      <body>
        <div id="wrap">
          <div id="canvas-offset">
            <canvas id="canvas" width="${trimW}" height="${trimH}"></canvas>
          </div>
          ${cropSvg}
        </div>
        <script>
          const canvas = new fabric.StaticCanvas('canvas');
          canvas.loadFromJSON(${JSON.stringify(designData)}, () => {
            canvas.renderAll();
            window.rendered = true;
          });
        </script>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    await page.waitForFunction('window.rendered === true', { timeout: 20000 });

    const pdf = await page.pdf({
      width: `${totalW}px`,
      height: `${totalH}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      scale,
    });

    return pdf;
  } finally {
    await browser.close();
  }
};
