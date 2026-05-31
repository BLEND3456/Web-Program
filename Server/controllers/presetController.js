const Project = require('../models/Project');
const DesignPreset = require('../models/DesignPreset');

// ПРОЕКТЫ
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { userId: req.userId },
      attributes: ['id', 'name', 'width', 'height', 'previewUrl', 'createdAt', 'updatedAt']
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    
    if (!project) return res.status(404).json({ message: 'Проект не найден' });
    
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name = 'Без названия', width = 800, height = 1000, presetId } = req.body;
    
    let designSettings = null;
    if (presetId) {
      const preset = await DesignPreset.findByPk(presetId);
      if (preset && preset.isPublic) {
        designSettings = preset.designSettings;
      }
    }

    const project = await Project.create({
      name,
      width: parseInt(width),
      height: parseInt(height),
      designSettings,
      previewUrl: null,
      userId: req.userId
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};

exports.saveProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!project) return res.status(404).json({ message: 'Проект не найден' });

    const { name, designSettings, previewUrl } = req.body;
    if (name !== undefined) project.name = name;
    if (designSettings !== undefined) project.designSettings = designSettings;
    if (previewUrl !== undefined && previewUrl !== null && previewUrl !== '') {
      project.previewUrl = previewUrl;
    }

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};

/** Только превью — лёгкий запрос без тяжёлого designSettings */
exports.saveProjectPreview = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!project) return res.status(404).json({ message: 'Проект не найден' });

    const { name, previewUrl } = req.body;
    if (!previewUrl || typeof previewUrl !== 'string') {
      return res.status(400).json({ message: 'previewUrl обязателен' });
    }

    if (name !== undefined) project.name = name;
    project.previewUrl = previewUrl;

    await project.save();
    res.json({
      id: project.id,
      name: project.name,
      previewUrl: project.previewUrl
    });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сохранения превью', error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!project) return res.status(404).json({ message: 'Проект не найден' });

    await project.destroy();
    res.json({ message: 'Проект удален' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};

// ПРЕСЕТЫ ДИЗАЙНА
exports.getAllPresets = async (req, res) => {
  try {
    const presets = await DesignPreset.findAll({
      where: { isPublic: true },
      attributes: ['id', 'name', 'description', 'thumbnail']
    });
    res.json(presets);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};

exports.getPresetById = async (req, res) => {
  try {
    const preset = await DesignPreset.findByPk(req.params.id);
    if (!preset || !preset.isPublic) {
      return res.status(404).json({ message: 'Пресет не найден' });
    }
    res.json(preset);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};

exports.createPreset = async (req, res) => {
  try {
    const { name, description, designSettings } = req.body;
    if (!name) return res.status(400).json({ message: 'Название обязательно' });

    const preset = await DesignPreset.create({
      name,
      description,
      designSettings: designSettings || {},
      userId: req.userId,
      isPublic: true
    });
    res.status(201).json(preset);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};
