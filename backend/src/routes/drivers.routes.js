const express = require('express');
const router = express.Router();
const driversController = require('../controllers/drivers.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', driversController.getAllDrivers);
router.post('/', requireRole('Admin', 'Fleet Manager', 'Safety Officer'), driversController.createDriver);
router.put('/:id', requireRole('Admin', 'Fleet Manager', 'Safety Officer'), driversController.updateDriver);

module.exports = router;
