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

async function ensureDesignPresetsThumbnailColumn() {
  const qi = sequelize.getQueryInterface();
  let desc;
  try {
    desc = await qi.describeTable('design_presets');
  } catch {
    return;
  }

  const col = desc.thumbnail || desc.Thumbnail;
  if (!col) {
    await qi.addColumn('design_presets', 'thumbnail', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    console.log('Миграция: добавлена колонка thumbnail в design_presets');
    return;
  }

  const type = String(col.type || '').toLowerCase();
  if (type.includes('varchar') || type.includes('character varying')) {
    await qi.changeColumn('design_presets', 'thumbnail', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    console.log('Миграция: thumbnail в design_presets расширен до TEXT');
  }
}

module.exports = { ensureProjectsPreviewUrlColumn, ensureDesignPresetsThumbnailColumn };
