const puppeteer = require('puppeteer');

module.exports = async function generatePDF(canvasJSON) {
  const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 0; display: flex; justify-content: center; background: #eee; }
        canvas { box-shadow: 0 0 10px rgba(0,0,0,0.1); }
      </style>
    </head>
    <body>
      <canvas id="canvas"></canvas>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js"></script>
      <script>
        (function() {
          const canvas = new fabric.Canvas('canvas', {
            width: 800,
            height: 1000,
            backgroundColor: '#ffffff'
          });
          const json = ${JSON.stringify(canvasJSON)};
          canvas.loadFromJSON(json, function() {
            canvas.renderAll();
            window.RENDER_COMPLETE = true;
          });
        })();
      </script>
    </body>
    </html>`;

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.RENDER_COMPLETE === true, { timeout: 10000 });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
    });
    return pdf;
  } finally {
    await browser.close();
  }
};