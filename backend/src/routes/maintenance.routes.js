const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', maintenanceController.getAllLogs);
router.post('/', requireRole('Admin', 'Fleet Manager'), maintenanceController.createLog);
router.put('/:id/close', requireRole('Admin', 'Fleet Manager'), maintenanceController.closeLog);

module.exports = router;
