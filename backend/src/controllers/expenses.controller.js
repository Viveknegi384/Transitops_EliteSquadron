const db = require('../config/db');

exports.getExpenses = async (req, res, next) => {
    try {
        const fuel = await db.query(`SELECT f.*, v.reg_number FROM fuel_logs f JOIN vehicles v ON f.vehicle_id = v.id ORDER BY f.date DESC`);
        const general = await db.query(`SELECT e.*, v.reg_number FROM expenses e JOIN vehicles v ON e.vehicle_id = v.id ORDER BY e.date DESC`);
        res.json({ fuel_logs: fuel.rows, expenses: general.rows });
    } catch (err) { next(err); }
};

exports.logFuel = async (req, res, next) => {
    try {
        const { vehicle_id, liters, cost, date } = req.body;
        if (!vehicle_id || !liters || !cost) {
            return res.status(400).json({ error: 'vehicle_id, liters, and cost are required.' });
        }
        const result = await db.query(`INSERT INTO fuel_logs (vehicle_id, liters, cost, date) VALUES ($1, $2, $3, $4) RETURNING *`, [vehicle_id, liters, cost, date || new Date()]);
        res.status(201).json({ log: result.rows[0] });
    } catch (err) { next(err); }
};

exports.logExpense = async (req, res, next) => {
    try {
        const { vehicle_id, type, cost, date, description } = req.body;
        if (!vehicle_id || !type || !cost) {
            return res.status(400).json({ error: 'vehicle_id, type, and cost are required.' });
        }
        const result = await db.query(`INSERT INTO expenses (vehicle_id, type, cost, date, description) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [vehicle_id, type, cost, date || new Date(), description || '']);
        res.status(201).json({ expense: result.rows[0] });
    } catch (err) { next(err); }
};
