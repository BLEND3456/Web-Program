const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs'); // Добавили модуль fs для чтения файла

exports.generatePDF = async (project) => {
  // Настройка для Windows/Linux для стабильного запуска
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Используем designSettings
    const designData = project.designSettings || project.canvasJSON || {};

    // 1. Читаем наш шрифт Arial.ttf и превращаем его в код (base64)
    // ВАЖНО: убедись, что название файла 'Arial.ttf' написано с большой или маленькой буквы точно так же, как оно называется в папке fonts!
    const fontPath = path.join(__dirname, '../fonts/arial.ttf');
    const fontBase64 = fs.readFileSync(fontPath).toString('base64');

    // 2. Вставляем этот шрифт прямо в стили HTML через @font-face
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @font-face {
            font-family: 'Arial';
            src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
          }
          body { 
            margin: 0; 
            padding: 0; 
            background: white; 
            font-family: 'Arial', sans-serif; /* Применяем шрифт ко всей странице */
          }
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