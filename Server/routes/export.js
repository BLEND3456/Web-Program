const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const exportController = require('../controllers/exportControllers');

// ИСПРАВЛЕНО: заменили :presetId на :id
router.post('/pdf/:id', auth, exportController.exportPDF);

module.exports = router;