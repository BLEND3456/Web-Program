const puppeteer = require('puppeteer');
const path = require('path');
const fontPath = path.join(__dirname, '../fonts/Arial.ttf');
doc.font(fontPath);

exports.generatePDF = async (project) => {
  // Настройка для Windows/Linux для стабильного запуска
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Используем designSettings, который мы настроили в модели
    const designData = project.designSettings || project.canvasJSON || {};

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: white; }
          #canvas-container { width: ${project.width}px; height: ${project.height}px; }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
      </head>
      <body>
        <canvas id="canvas" width="${project.width}" height="${project.height}"></canvas>
        <script>
          const canvas = new fabric.StaticCanvas('canvas');
          // Загружаем данные холста
          canvas.loadFromJSON(${JSON.stringify(designData)}, () => {
            canvas.renderAll();
            window.rendered = true; // Сигнал для Puppeteer, что всё готово
          });
        </script>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    // Ждем, пока Fabric.js закончит отрисовку
    await page.waitForFunction('window.rendered === true', { timeout: 5000 });

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