const db = require('../config/db');

exports.getAllDrivers = async (req, res, next) => {
    try {
        const { status, valid_only } = req.query;
        let query = 'SELECT * FROM drivers WHERE 1=1';
        const params = [];

        if (status) {
            params.push(status);
            query += ` AND status = $${params.length}`;
        }
        if (valid_only === 'true') {
            query += " AND status = 'Available' AND license_expiry >= CURRENT_DATE";
        }
        query += ' ORDER BY safety_score DESC';

        const result = await db.query(query, params);
        res.json({ drivers: result.rows });
    } catch (err) {
        next(err);
    }
};

exports.createDriver = async (req, res, next) => {
    try {
        const { name, license_number, license_category, license_expiry, contact_number, safety_score, status } = req.body;
        
        if (!name || !license_number || !license_category || !license_expiry) {
            return res.status(400).json({ error: 'name, license_number, license_category, and license_expiry are required.' });
        }

        const check = await db.query('SELECT id FROM drivers WHERE license_number = $1', [license_number]);
        if (check.rows.length > 0) {
            return res.status(409).json({ error: 'A driver with this license number already exists.' });
        }

        const result = await db.query(
            `INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, license_number, license_category, license_expiry, contact_number, safety_score || 10.0, status || 'Available']
        );
        res.status(201).json({ driver: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

exports.updateDriver = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, safety_score } = req.body;
        const result = await db.query(
            'UPDATE drivers SET status = COALESCE($1, status), safety_score = COALESCE($2, safety_score) WHERE id = $3 RETURNING *',
            [status, safety_score, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
        res.json({ driver: result.rows[0] });
    } catch (err) {
        next(err);
    }
};
