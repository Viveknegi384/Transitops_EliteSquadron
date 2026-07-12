const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/copilot', aiController.copilotChat);
router.post('/dispatch', aiController.smartDispatch);

module.exports = router;
