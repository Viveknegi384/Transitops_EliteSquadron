const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expenses.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', expensesController.getExpenses);
router.post('/fuel', expensesController.logFuel);
router.post('/general', expensesController.logExpense);

module.exports = router;
