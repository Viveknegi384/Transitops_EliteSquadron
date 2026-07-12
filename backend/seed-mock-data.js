const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/transitops' });

async function seedData() {
  try {
    // We will use the VAN-05 and TRK-102 vehicles which were seeded in seed.sql
    // VAN-05: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
    // TRK-102: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
    // Driver Alex: 1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a

    console.log('Seeding mock trips, fuel logs, and expenses...');

    // 1. Insert a few completed trips
    await pool.query(`
      INSERT INTO trips (id, source, destination, cargo_weight, planned_distance, status, vehicle_id, driver_id, final_odometer, fuel_consumed, created_at, completed_at)
      VALUES 
      ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'Pune Depot', 'Mumbai Hub', 400.00, 150.00, 'Completed', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 15550, 15.00, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
      ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'Ahmedabad', 'Surat', 7500.00, 280.00, 'Completed', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', 89480, 45.00, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '2 days')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Insert fuel logs for those trips
    await pool.query(`
      INSERT INTO fuel_logs (id, vehicle_id, trip_id, liters, cost, date)
      VALUES 
      ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 15.00, 1500.00, CURRENT_DATE - INTERVAL '4 days'),
      ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 45.00, 4500.00, CURRENT_DATE - INTERVAL '2 days')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 3. Insert some maintenance logs
    await pool.query(`
      INSERT INTO maintenance_logs (id, vehicle_id, issue, cost, status, scheduled_date, resolved_date)
      VALUES 
      ('33c3c3c3-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Oil Change & Filter', 2500.00, 'Closed', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '9 days'),
      ('44d4d4d4-4d4d-4d4d-4d4d-4d4d4d4d4d4d', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Cooling System Repair', 12000.00, 'In Shop', CURRENT_DATE, NULL)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 4. Insert some general expenses
    await pool.query(`
      INSERT INTO expenses (id, vehicle_id, type, cost, date, description)
      VALUES 
      ('55e5e5e5-5e5e-5e5e-5e5e-5e5e5e5e5e5e', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Toll', 450.00, CURRENT_DATE - INTERVAL '2 days', 'Highway Toll'),
      ('66f6f6f6-6f6f-6f6f-6f6f-6f6f6f6f6f6f', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Other', 200.00, CURRENT_DATE - INTERVAL '4 days', 'Parking')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('✅ Mock historical data seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedData();
