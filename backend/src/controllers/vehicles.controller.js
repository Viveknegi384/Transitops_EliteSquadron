const db = require('../config/db');

exports.getAllVehicles = async (req, res, next) => {
    try {
        const { status, type } = req.query;
        let query = 'SELECT * FROM vehicles WHERE 1=1';
        const params = [];

        if (status) {
            params.push(status);
            query += ` AND status = $${params.length}`;
        }
        if (type) {
            params.push(type);
            query += ` AND type = $${params.length}`;
        }
        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, params);
        res.json({ vehicles: result.rows });
    } catch (err) {
        next(err);
    }
};

exports.createVehicle = async (req, res, next) => {
    try {
        const { reg_number, model, type, max_load, odometer, acquisition_cost, status } = req.body;
        
        if (!reg_number || !model || !type || !max_load) {
            return res.status(400).json({ error: 'reg_number, model, type, and max_load are required fields.' });
        }

        // Mandatory Rule: reg_number must be unique
        const check = await db.query('SELECT id FROM vehicles WHERE reg_number = $1', [reg_number]);
        if (check.rows.length > 0) {
            return res.status(409).json({ error: 'A vehicle with this registration number already exists.' });
        }

        const result = await db.query(
            `INSERT INTO vehicles (reg_number, model, type, max_load, odometer, acquisition_cost, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [reg_number, model, type, max_load, odometer || 0, acquisition_cost || 0, status || 'Available']
        );
        res.status(201).json({ vehicle: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

exports.updateVehicleStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, odometer } = req.body;
        const result = await db.query(
            'UPDATE vehicles SET status = COALESCE($1, status), odometer = COALESCE($2, odometer) WHERE id = $3 RETURNING *',
            [status, odometer, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
        res.json({ vehicle: result.rows[0] });
    } catch (err) {
        next(err);
    }
};
