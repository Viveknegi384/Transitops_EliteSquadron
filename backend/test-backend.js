const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./src/config/db');
const errorHandler = require('./src/middleware/error.middleware');

const PORT = 5001; // Use test port 5001
const BASE_URL = `http://localhost:${PORT}/api`;

// Helper for HTTP requests
const request = (method, endpoint, body = null, token = null) => {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BASE_URL}${endpoint}`);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };

        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try { parsed = JSON.parse(data); } catch (e) {}
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

const runTests = async () => {
    console.log('====================================================');
    console.log('🚀 TRANSITOPS BACKEND AUTOMATED VERIFICATION SUITE');
    console.log('====================================================\n');

    // Step 1: Check Database Connection & Initialize Schema
    console.log('--- Step 1: Checking PostgreSQL Connection & Schema ---');
    try {
        const client = await db.pool.connect();
        console.log('✅ PostgreSQL Connected Successfully');
        
        console.log('Applying database/schema.sql...');
        const schemaSql = fs.readFileSync(path.join(__dirname, 'database/schema.sql'), 'utf8');
        await client.query(schemaSql);
        
        console.log('Applying database/seed.sql...');
        const seedSql = fs.readFileSync(path.join(__dirname, 'database/seed.sql'), 'utf8');
        await client.query(seedSql);
        
        client.release();
        console.log('✅ Database Schema & Seeds initialized.\n');
    } catch (err) {
        console.error('❌ Database Connection Error:', err.message);
        console.error('\n⚠️ Please check that PostgreSQL is running and DATABASE_URL in backend/.env is correct!');
        console.error(`Current DATABASE_URL: ${process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/transitops'}\n`);
        process.exit(1);
    }

    // Step 2: Start Express Server
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/auth', require('./src/routes/auth.routes'));
    app.use('/api/vehicles', require('./src/routes/vehicles.routes'));
    app.use('/api/drivers', require('./src/routes/drivers.routes'));
    app.use('/api/trips', require('./src/routes/trips.routes'));
    app.use('/api/maintenance', require('./src/routes/maintenance.routes'));
    app.use('/api/expenses', require('./src/routes/expenses.routes'));
    app.use('/api/analytics', require('./src/routes/analytics.routes'));
    app.use('/api/ai', require('./src/routes/ai.routes'));
    app.use(errorHandler);

    const server = app.listen(PORT, async () => {
        let passCount = 0;
        let failCount = 0;
        const assert = (name, condition, details = '') => {
            if (condition) {
                console.log(`PASS ✅ | ${name} ${details ? `(${details})` : ''}`);
                passCount++;
            } else {
                console.log(`FAIL ❌ | ${name} ${details ? `(${details})` : ''}`);
                failCount++;
            }
        };

        try {
            console.log('--- Step 2: Running API Endpoints & Business Rule Tests ---\n');

            // Test 1: Authentication & RBAC
            const loginRes = await request('POST', '/auth/login', { email: 'manager@transitops.com', password: 'demo123' });
            assert('Login with valid demo credentials', loginRes.status === 200 && loginRes.data.token, `Role: ${loginRes.data.user?.role}`);
            const token = loginRes.data.token;

            // Test 2: Fetch Vehicles & Check Unique Constraint
            const vRes = await request('GET', '/vehicles?status=Available', null, token);
            assert('Get Available Vehicles', vRes.status === 200 && Array.isArray(vRes.data.vehicles), `Found ${vRes.data.vehicles.length} available`);
            
            const dupRes = await request('POST', '/vehicles', { reg_number: 'VAN-05', model: 'Duplicate Test', type: 'Van', max_load: 500 }, token);
            assert('Unique reg_number rule enforcement (rejection of duplicate VAN-05)', dupRes.status === 409, `HTTP ${dupRes.status}: ${dupRes.data.error}`);

            // Test 3: Register New Vehicle
            const newV = await request('POST', '/vehicles', { reg_number: 'TEST-999', model: 'Test Volvo', type: 'Truck', max_load: 1000 }, token);
            assert('Register new vehicle TEST-999', newV.status === 201 && newV.data.vehicle.id, `Capacity: ${newV.data.vehicle.max_load}kg`);
            const vehicleId = newV.data.vehicle.id;

            // Test 4: Register New Driver
            const newD = await request('POST', '/drivers', { name: 'Test Driver Bob', license_number: 'DL-TEST-999', license_category: 'Class A', license_expiry: '2029-01-01' }, token);
            assert('Register new driver Bob', newD.status === 201 && newD.data.driver.id, `Safety Score: ${newD.data.driver.safety_score}`);
            const driverId = newD.data.driver.id;

            // Test 5: Validate Trip (Valid capacity vs Exceeded capacity)
            const validTripCheck = await request('POST', '/trips/validate', { vehicle_id: vehicleId, driver_id: driverId, cargo_weight: 800 }, token);
            assert('Validate trip with cargo (800 <= 1000kg max_load)', validTripCheck.status === 200 && validTripCheck.data.valid, validTripCheck.data.message);

            const invalidTripCheck = await request('POST', '/trips/validate', { vehicle_id: vehicleId, driver_id: driverId, cargo_weight: 1200 }, token);
            assert('Load capacity violation check (rejection of 1200kg > 1000kg max_load)', invalidTripCheck.status === 400, `HTTP 400: ${invalidTripCheck.data.error}`);

            // Test 6: Dispatch Trip (Atomic Status Update)
            const dispatchRes = await request('POST', '/trips/dispatch', { source: 'City A', destination: 'City B', cargo_weight: 750, planned_distance: 200, vehicle_id: vehicleId, driver_id: driverId }, token);
            assert('Dispatch trip', dispatchRes.status === 201 && dispatchRes.data.trip.id, `Trip status: ${dispatchRes.data.trip.status}`);
            const tripId = dispatchRes.data.trip.id;

            // Verify both Vehicle & Driver automatically became 'On Trip'
            const allVehicles = await request('GET', '/vehicles', null, token);
            const checkV = allVehicles.data.vehicles.find(v => v.id === vehicleId);
            const allDrivers = await request('GET', '/drivers', null, token);
            const checkD = allDrivers.data.drivers.find(d => d.id === driverId);
            assert("Automatic status change: Vehicle status == 'On Trip'", checkV?.status === 'On Trip');
            assert("Automatic status change: Driver status == 'On Trip'", checkD?.status === 'On Trip');

            // Test 7: Complete Trip (Atomic Status Restoration + Fuel Log)
            const completeRes = await request('POST', `/trips/${tripId}/complete`, { final_odometer: 15000, fuel_consumed: 50, fuel_cost: 175.50 }, token);
            assert('Complete trip & record fuel', completeRes.status === 200, completeRes.data.message);

            const afterVehicles = await request('GET', '/vehicles', null, token);
            const checkVAfter = afterVehicles.data.vehicles.find(v => v.id === vehicleId);
            const afterDrivers = await request('GET', '/drivers', null, token);
            const checkDAfter = afterDrivers.data.drivers.find(d => d.id === driverId);
            assert("Automatic status restoration: Vehicle status == 'Available'", checkVAfter?.status === 'Available', `Odometer: ${checkVAfter?.odometer}`);
            assert("Automatic status restoration: Driver status == 'Available'", checkDAfter?.status === 'Available');

            // Test 8: Maintenance Workflow (Automatic 'In Shop' status)
            const maintRes = await request('POST', '/maintenance', { vehicle_id: vehicleId, issue: 'Routine Engine Check', cost: 450.00 }, token);
            assert('Create maintenance log', maintRes.status === 201, maintRes.data.message);

            const shopVehicles = await request('GET', '/vehicles', null, token);
            const checkVShop = shopVehicles.data.vehicles.find(v => v.id === vehicleId);
            assert("Automatic status change: Vehicle status == 'In Shop'", checkVShop?.status === 'In Shop');

            // Test 9: Close Maintenance Log
            const maintId = maintRes.data.log.id;
            const closeRes = await request('PUT', `/maintenance/${maintId}/close`, {}, token);
            assert('Close maintenance log', closeRes.status === 200, closeRes.data.message);

            const finalVehicles = await request('GET', '/vehicles', null, token);
            const checkVFinal = finalVehicles.data.vehicles.find(v => v.id === vehicleId);
            assert("Maintenance closed: Vehicle restored to 'Available'", checkVFinal?.status === 'Available');

            // Test 10: Reports & Analytics Views
            const reportRes = await request('GET', '/analytics/reports', null, token);
            assert('Analytics & ROI view computations', reportRes.status === 200 && reportRes.data.roi_analysis.length > 0, `Analyzed ${reportRes.data.roi_analysis.length} vehicles`);

            // Test 11: GenAI Copilot (Mock Fallback check)
            const aiRes = await request('POST', '/ai/copilot', { message: 'How many vehicles do we have?' }, token);
            assert('AI Copilot query response', aiRes.status === 200 && aiRes.data.reply, aiRes.data.reply.substring(0, 50) + '...');

            console.log('\n====================================================');
            console.log(`🏁 TEST SUMMARY: ${passCount} PASSED | ${failCount} FAILED`);
            console.log('====================================================\n');

        } catch (err) {
            console.error('❌ Test Suite Exception:', err);
        } finally {
            server.close();
            await db.pool.end();
            process.exit(failCount > 0 ? 1 : 0);
        }
    });
};

runTests();
