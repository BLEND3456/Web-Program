const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const buildFontCss = () => {
  const fontPath = path.join(__dirname, '../fonts/arial.ttf');
  if (!fs.existsSync(fontPath)) {
    return '';
  }
  const fontBase64 = fs.readFileSync(fontPath).toString('base64');
  return `
    @font-face {
      font-family: 'Arial';
      src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
    }
  `;
};

exports.generatePDF = async (project) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const designData = project.designSettings || {};
    const fontCss = buildFontCss();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${fontCss}
          body {
            margin: 0;
            padding: 0;
            background: white;
            font-family: Arial, Helvetica, sans-serif;
          }
          #canvas-container { width: ${project.width}px; height: ${project.height}px; }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
      </head>
      <body>
        <canvas id="canvas" width="${project.width}" height="${project.height}"></canvas>
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
    await page.waitForFunction('window.rendered === true', { timeout: 15000 });

    const pdf = await page.pdf({
      width: `${project.width}px`,
      height: `${project.height}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    return pdf;
  } finally {
    await browser.close();
  }
};
