const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Заставляем Puppeteer скачивать Chrome прямо в папку проекта, чтобы Render его не удалил
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};