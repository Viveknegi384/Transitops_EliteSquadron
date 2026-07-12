const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/transitops' });

async function clearData() {
  console.log('=============================================');
  console.log('🧹 CLEARING DATABASE');
  console.log('=============================================\n');

  try {
    // We wipe all the transactional tables using CASCADE 
    // to automatically handle any foreign key constraints.
    console.log('Wiping all trips, maintenance logs, fuel logs, and expenses...');
    await pool.query(`TRUNCATE trips, maintenance_logs, fuel_logs, expenses CASCADE`);
    console.log('✅ Transactional data successfully wiped.');

    // If you want to also wipe all your vehicles and drivers, 
    // you can uncomment the following two lines:
    await pool.query(`TRUNCATE vehicles, drivers CASCADE`);
    console.log('✅ Vehicles and drivers successfully wiped.');

    console.log('\n=============================================');
    console.log('🎉 Data clearance complete!');
    console.log('=============================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to clear data:', err.message);
    process.exit(1);
  }
}

clearData();
