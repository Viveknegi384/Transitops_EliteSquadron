const express = require('express');
const router = express.Router();
const tripsController = require('../controllers/trips.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', tripsController.getAllTrips);
router.post('/validate', tripsController.validateTrip);
router.post('/dispatch', requireRole('Admin', 'Fleet Manager', 'Dispatcher'), tripsController.dispatchTrip);
router.post('/:id/complete', requireRole('Admin', 'Fleet Manager', 'Dispatcher'), tripsController.completeTrip);
router.post('/:id/cancel', requireRole('Admin', 'Fleet Manager', 'Dispatcher'), tripsController.cancelTrip);

module.exports = router;
