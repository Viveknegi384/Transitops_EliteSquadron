const { Client, Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const getBaseConnectionUrl = (dbUrl) => {
    if (!dbUrl) return 'postgresql://postgres:root@localhost:5432/postgres';
    try {
        const parsed = new URL(dbUrl);
        parsed.pathname = '/postgres'; // connect to default postgres maintenance database
        return parsed.toString();
    } catch (e) {
        return 'postgresql://postgres:root@localhost:5432/postgres';
    }
};

const getTargetDbName = (dbUrl) => {
    if (!dbUrl) return 'transitops';
    try {
        const parsed = new URL(dbUrl);
        return parsed.pathname.replace('/', '') || 'transitops';
    } catch (e) {
        return 'transitops';
    }
};

const initDatabase = async () => {
    console.log('====================================================');
    console.log('🚀 TRANSITOPS DATABASE INITIALIZATION SCRIPT');
    console.log('====================================================\n');

    const targetDbUrl = process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/transitops';
    const baseConnUrl = getBaseConnectionUrl(targetDbUrl);
    const targetDbName = getTargetDbName(targetDbUrl);

    // Step 1: Ensure Target Database Exists
    console.log(`[Step 1] Checking if database "${targetDbName}" exists...`);
    const baseClient = new Client({ connectionString: baseConnUrl });
    try {
        await baseClient.connect();
        const checkRes = await baseClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDbName]);
        if (checkRes.rows.length === 0) {
            console.log(`Database "${targetDbName}" not found. Creating now...`);
            await baseClient.query(`CREATE DATABASE "${targetDbName}"`);
            console.log(`✅ Database "${targetDbName}" created successfully!`);
        } else {
            console.log(`✅ Database "${targetDbName}" already exists.`);
        }
    } catch (err) {
        console.error(`❌ Failed to connect or create database "${targetDbName}":`, err.message);
        console.error('\n⚠️ Ensure PostgreSQL is running and check DATABASE_URL in backend/.env.');
        process.exit(1);
    } finally {
        await baseClient.end();
    }

    // Step 2: Apply DDL Schema
    console.log(`\n[Step 2] Connecting to "${targetDbName}" and executing database/schema.sql...`);
    const pool = new Pool({ connectionString: targetDbUrl });
    try {
        const schemaSql = fs.readFileSync(path.join(__dirname, 'database/schema.sql'), 'utf8');
        await pool.query(schemaSql);
        console.log('✅ All tables, constraints, functions, and views applied successfully!');
    } catch (err) {
        console.error('❌ Error executing schema.sql:', err.message);
        process.exit(1);
    }

    // Step 3: Apply Seed Data
    console.log('\n[Step 3] Executing database/seed.sql to insert demo data...');
    try {
        const seedSql = fs.readFileSync(path.join(__dirname, 'database/seed.sql'), 'utf8');
        await pool.query(seedSql);
        console.log('✅ Demo users, vehicles, and drivers seeded successfully!');
    } catch (err) {
        console.error('❌ Error executing seed.sql:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }

    console.log('\n====================================================');
    console.log('🎉 INITIALIZATION COMPLETE! Your database is ready.');
    console.log('====================================================\n');
};

initDatabase();
