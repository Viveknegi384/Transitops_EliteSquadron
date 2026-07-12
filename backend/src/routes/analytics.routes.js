const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboardKpis);
router.get('/reports', analyticsController.getReports);

module.exports = router;
