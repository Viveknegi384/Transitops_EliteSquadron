const db = require('../config/db');

exports.getAllTrips = async (req, res, next) => {
    try {
        const { status } = req.query;
        let query = `SELECT t.*, v.reg_number, v.model as vehicle_model, d.name as driver_name 
                     FROM trips t 
                     JOIN vehicles v ON t.vehicle_id = v.id 
                     JOIN drivers d ON t.driver_id = d.id WHERE 1=1`;
        const params = [];
        if (status) {
            params.push(status);
            query += ` AND t.status = $${params.length}`;
        }
        query += ' ORDER BY t.created_at DESC';
        const result = await db.query(query, params);
        res.json({ trips: result.rows });
    } catch (err) {
        next(err);
    }
};

exports.validateTrip = async (req, res, next) => {
    try {
        const { vehicle_id, driver_id, cargo_weight } = req.body;
        if (!vehicle_id || !driver_id || !cargo_weight) {
            return res.status(400).json({ error: 'vehicle_id, driver_id, and cargo_weight are required.' });
        }

        const vehicle = await db.query('SELECT * FROM vehicles WHERE id = $1', [vehicle_id]);
        if (vehicle.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
        
        const v = vehicle.rows[0];
        if (v.status !== 'Available') return res.status(400).json({ error: `Vehicle ${v.reg_number} is currently '${v.status}' and cannot be dispatched.` });
        if (cargo_weight > v.max_load) return res.status(400).json({ error: `Cargo weight (${cargo_weight}kg) exceeds vehicle maximum capacity (${v.max_load}kg).` });

        const driver = await db.query('SELECT * FROM drivers WHERE id = $1', [driver_id]);
        if (driver.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
        
        const d = driver.rows[0];
        if (d.status !== 'Available') return res.status(400).json({ error: `Driver ${d.name} is currently '${d.status}'.` });
        if (new Date(d.license_expiry) < new Date()) return res.status(400).json({ error: `Driver ${d.name}'s license expired on ${d.license_expiry}.` });

        res.json({ valid: true, message: 'Trip passed all safety and capacity validations.' });
    } catch (err) {
        next(err);
    }
};

exports.dispatchTrip = async (req, res, next) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const { source, destination, cargo_weight, planned_distance, vehicle_id, driver_id } = req.body;

        if (!source || !destination || !cargo_weight || !planned_distance || !vehicle_id || !driver_id) {
            throw new Error('All trip fields (source, destination, cargo_weight, planned_distance, vehicle_id, driver_id) are required.');
        }

        // Lock & verify vehicle
        const vCheck = await client.query('SELECT status, max_load, reg_number FROM vehicles WHERE id = $1 FOR UPDATE', [vehicle_id]);
        if (vCheck.rows.length === 0) throw new Error('Vehicle not found.');
        if (vCheck.rows[0].status !== 'Available' || cargo_weight > vCheck.rows[0].max_load) {
            throw new Error(`Vehicle ${vCheck.rows[0].reg_number} is unavailable or capacity exceeded during dispatch lock.`);
        }

        // Lock & verify driver
        const dCheck = await client.query('SELECT status, name, license_expiry FROM drivers WHERE id = $1 FOR UPDATE', [driver_id]);
        if (dCheck.rows.length === 0) throw new Error('Driver not found.');
        if (dCheck.rows[0].status !== 'Available') {
            throw new Error(`Driver ${dCheck.rows[0].name} is unavailable during dispatch lock.`);
        }
        if (new Date(dCheck.rows[0].license_expiry) < new Date()) {
            throw new Error(`Driver ${dCheck.rows[0].name}'s license is expired.`);
        }

        // 1. Create Dispatched Trip
        const tripRes = await client.query(
            `INSERT INTO trips (source, destination, cargo_weight, planned_distance, status, vehicle_id, driver_id)
             VALUES ($1, $2, $3, $4, 'Dispatched', $5, $6) RETURNING *`,
            [source, destination, cargo_weight, planned_distance, vehicle_id, driver_id]
        );

        // 2. Automatically change both vehicle and driver status to 'On Trip'
        await client.query("UPDATE vehicles SET status = 'On Trip' WHERE id = $1", [vehicle_id]);
        await client.query("UPDATE drivers SET status = 'On Trip' WHERE id = $1", [driver_id]);

        await client.query('COMMIT');
        res.status(201).json({ trip: tripRes.rows[0], message: 'Trip dispatched successfully. Vehicle and Driver statuses updated to On Trip.' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};

exports.completeTrip = async (req, res, next) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { final_odometer, fuel_consumed, fuel_cost } = req.body;

        const tripCheck = await client.query('SELECT * FROM trips WHERE id = $1 FOR UPDATE', [id]);
        if (tripCheck.rows.length === 0) throw new Error('Trip not found');
        const trip = tripCheck.rows[0];
        if (trip.status === 'Completed') throw new Error('Trip is already completed.');

        // 1. Mark trip completed
        const updatedTrip = await client.query(
            "UPDATE trips SET status = 'Completed', final_odometer = $1, fuel_consumed = $2, completed_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
            [final_odometer || null, fuel_consumed || null, id]
        );

        // 2. Log fuel if entered
        if (fuel_consumed && fuel_cost) {
            await client.query(
                'INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost) VALUES ($1, $2, $3, $4)',
                [trip.vehicle_id, id, fuel_consumed, fuel_cost]
            );
        }

        // 3. Update vehicle odometer and restore status to 'Available'
        await client.query("UPDATE vehicles SET status = 'Available', odometer = COALESCE($1, odometer) WHERE id = $2", [final_odometer || null, trip.vehicle_id]);
        // 4. Restore driver status to 'Available'
        await client.query("UPDATE drivers SET status = 'Available' WHERE id = $1", [trip.driver_id]);

        await client.query('COMMIT');
        res.json({ trip: updatedTrip.rows[0], message: 'Trip completed. Vehicle and Driver restored to Available.' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};

exports.cancelTrip = async (req, res, next) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;

        const tripCheck = await client.query('SELECT * FROM trips WHERE id = $1 FOR UPDATE', [id]);
        if (tripCheck.rows.length === 0) throw new Error('Trip not found');
        const trip = tripCheck.rows[0];
        if (trip.status !== 'Dispatched' && trip.status !== 'Draft') throw new Error('Only active or draft trips can be cancelled.');

        const updatedTrip = await client.query("UPDATE trips SET status = 'Cancelled' WHERE id = $1 RETURNING *", [id]);

        if (trip.status === 'Dispatched') {
            await client.query("UPDATE vehicles SET status = 'Available' WHERE id = $1 AND status = 'On Trip'", [trip.vehicle_id]);
            await client.query("UPDATE drivers SET status = 'Available' WHERE id = $1 AND status = 'On Trip'", [trip.driver_id]);
        }

        await client.query('COMMIT');
        res.json({ trip: updatedTrip.rows[0], message: 'Trip cancelled. Vehicle and Driver restored to Available.' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};
