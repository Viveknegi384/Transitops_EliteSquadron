const db = require('../config/db');

exports.getDashboardKpis = async (req, res, next) => {
    try {
        const vehicles = await db.query('SELECT status, COUNT(*) as count FROM vehicles GROUP BY status');
        const trips = await db.query('SELECT status, COUNT(*) as count FROM trips GROUP BY status');
        const drivers = await db.query('SELECT status, COUNT(*) as count FROM drivers GROUP BY status');
        
        let totalVehicles = 0, activeVehicles = 0, availableVehicles = 0, inShop = 0;
        vehicles.rows.forEach(v => {
            totalVehicles += parseInt(v.count);
            if (v.status === 'On Trip') activeVehicles += parseInt(v.count);
            if (v.status === 'Available') availableVehicles += parseInt(v.count);
            if (v.status === 'In Shop') inShop += parseInt(v.count);
        });

        const utilization = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
        res.json({ totalVehicles, activeVehicles, availableVehicles, inShop, utilization, trips: trips.rows, drivers: drivers.rows });
    } catch (err) { next(err); }
};

exports.getReports = async (req, res, next) => {
    try {
        const costs = await db.query('SELECT * FROM v_vehicle_operational_costs ORDER BY total_operational_cost DESC');
        const roi = await db.query('SELECT * FROM v_vehicle_roi ORDER BY roi DESC');
        res.json({ operational_costs: costs.rows, roi_analysis: roi.rows });
    } catch (err) { next(err); }
};
