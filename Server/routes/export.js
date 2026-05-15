const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const exportController = require('../controllers/exportControllers');

router.post('/pdf/:presetId', auth, exportController.exportPDF);

module.exports = router;