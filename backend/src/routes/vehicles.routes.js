const express = require('express');
const router = express.Router();
const vehiclesController = require('../controllers/vehicles.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', vehiclesController.getAllVehicles);
router.post('/', requireRole('Admin', 'Fleet Manager'), vehiclesController.createVehicle);
router.put('/:id', requireRole('Admin', 'Fleet Manager', 'Dispatcher'), vehiclesController.updateVehicleStatus);

module.exports = router;
