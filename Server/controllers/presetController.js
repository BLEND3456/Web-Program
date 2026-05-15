const Project = require('../models/Project');
const DesignPreset = require('../models/DesignPreset');

// ПРОЕКТЫ
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { userId: req.userId },
      attributes: ['id', 'name', 'width', 'height', 'createdAt', 'updatedAt']
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
    
    let canvasJSON = null;
    if (presetId) {
      const preset = await DesignPreset.findByPk(presetId);
      if (preset) {
        canvasJSON = preset.designSettings;
      }
    }

    const project = await Project.create({
      name,
      width: parseInt(width),
      height: parseInt(height),
      canvasJSON,
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

    const { name, canvasJSON } = req.body;
    if (name !== undefined) project.name = name;
    if (canvasJSON !== undefined) project.canvasJSON = canvasJSON;

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
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
      attributes: ['id', 'name', 'description', 'thumbnail', 'designSettings']
    });
    res.json(presets);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};

exports.getPresetById = async (req, res) => {
  try {
    const preset = await DesignPreset.findByPk(req.params.id);
    if (!preset) return res.status(404).json({ message: 'Пресет не найден' });
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