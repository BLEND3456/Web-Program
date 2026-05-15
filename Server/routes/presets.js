const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const presetController = require('../controllers/presetController');

// ПРЕСЕТЫ ДИЗАЙНА (публичные, БЕЗ авторизации)
router.get('/design-presets', presetController.getAllPresets);
router.get('/design-presets/:id', presetController.getPresetById);

// ВСЕ ОСТАЛЬНЫЕ МАРШРУТЫ требуют авторизацию
router.use(auth);

// ПРОЕКТЫ (требуют авторизацию)
router.get('/projects', presetController.getAllProjects);
router.get('/projects/:id', presetController.getProjectById);
router.post('/projects', presetController.createProject);
router.put('/projects/:id', presetController.saveProject);
router.delete('/projects/:id', presetController.deleteProject);

// ПРЕСЕТЫ ДИЗАЙНА (создание - требует авторизацию)
router.post('/design-presets', presetController.createPreset);

module.exports = router;