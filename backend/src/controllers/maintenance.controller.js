const db = require('../config/db');

exports.getAllLogs = async (req, res, next) => {
    try {
        const result = await db.query(`SELECT m.*, v.reg_number, v.model FROM maintenance_logs m JOIN vehicles v ON m.vehicle_id = v.id ORDER BY m.scheduled_date DESC`);
        res.json({ logs: result.rows });
    } catch (err) { next(err); }
};

exports.createLog = async (req, res, next) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const { vehicle_id, issue, cost, scheduled_date } = req.body;
        
        if (!vehicle_id || !issue) {
            throw new Error('vehicle_id and issue are required fields.');
        }

        const logRes = await client.query(
            `INSERT INTO maintenance_logs (vehicle_id, issue, cost, status, scheduled_date) VALUES ($1, $2, $3, 'In Shop', $4) RETURNING *`,
            [vehicle_id, issue, cost || 0, scheduled_date || new Date()]
        );
        // Automatically switch vehicle status to 'In Shop'
        await client.query("UPDATE vehicles SET status = 'In Shop' WHERE id = $1", [vehicle_id]);
        await client.query('COMMIT');
        res.status(201).json({ log: logRes.rows[0], message: 'Maintenance record created. Vehicle status changed to In Shop.' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally { client.release(); }
};

exports.closeLog = async (req, res, next) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const logRes = await client.query("UPDATE maintenance_logs SET status = 'Closed', resolved_date = CURRENT_DATE WHERE id = $1 RETURNING *", [id]);
        if (logRes.rows.length === 0) throw new Error('Log not found');
        
        // Restore vehicle to Available (unless retired)
        await client.query("UPDATE vehicles SET status = 'Available' WHERE id = $1 AND status != 'Retired'", [logRes.rows[0].vehicle_id]);
        await client.query('COMMIT');
        res.json({ log: logRes.rows[0], message: 'Maintenance closed. Vehicle restored to Available.' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally { client.release(); }
};
