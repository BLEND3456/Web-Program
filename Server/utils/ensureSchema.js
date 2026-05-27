const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/**
 * В production sequelize.sync() часто без alter — колонка previewUrl могла не появиться.
 */
async function ensureProjectsPreviewUrlColumn() {
  const qi = sequelize.getQueryInterface();
  let desc;
  try {
    desc = await qi.describeTable('projects');
  } catch {
    return;
  }

  const hasPreview =
    desc.previewUrl ||
    desc.previewurl ||
    desc.preview_url;

  if (!hasPreview) {
    await qi.addColumn('projects', 'previewUrl', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    console.log('Миграция: добавлена колонка previewUrl в projects');
  }
}

module.exports = { ensureProjectsPreviewUrlColumn };
