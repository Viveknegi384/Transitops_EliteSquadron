CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reg_number VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Van', 'Truck', 'Trailer', 'Refrigerated Truck')),
    max_load DECIMAL(10, 2) NOT NULL CHECK (max_load > 0),
    odometer INTEGER NOT NULL DEFAULT 0,
    acquisition_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'In Shop', 'Retired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. DRIVERS
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    license_number VARCHAR(80) UNIQUE NOT NULL,
    license_category VARCHAR(20) NOT NULL,
    license_expiry DATE NOT NULL,
    contact_number VARCHAR(30),
    safety_score DECIMAL(3, 1) DEFAULT 10.0 CHECK (safety_score >= 0.0 AND safety_score <= 10.0),
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'Off Duty', 'Suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRIPS
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    cargo_weight DECIMAL(10, 2) NOT NULL CHECK (cargo_weight > 0),
    planned_distance DECIMAL(10, 2) NOT NULL CHECK (planned_distance > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES drivers(id) ON DELETE RESTRICT,
    final_odometer INTEGER,
    fuel_consumed DECIMAL(8, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 5. MAINTENANCE LOGS
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    issue VARCHAR(255) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'In Shop' CHECK (status IN ('In Shop', 'Closed')),
    scheduled_date DATE NOT NULL,
    resolved_date DATE
);

-- 6. FUEL LOGS
CREATE TABLE IF NOT EXISTS fuel_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    liters DECIMAL(8, 2) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 7. GENERAL EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Toll', 'Maintenance', 'Fuel', 'Other')),
    cost DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT
);

-- 8. OPERATIONAL COST VIEW (Fuel + Maintenance + General Expenses)
CREATE OR REPLACE VIEW v_vehicle_operational_costs AS
SELECT 
    v.id AS vehicle_id,
    v.reg_number,
    v.model,
    v.status,
    COALESCE(SUM(f.cost), 0) AS total_fuel_cost,
    COALESCE(SUM(m.cost), 0) AS total_maintenance_cost,
    COALESCE(SUM(e.cost), 0) AS total_other_expense_cost,
    (COALESCE(SUM(f.cost), 0) + COALESCE(SUM(m.cost), 0) + COALESCE(SUM(e.cost), 0)) AS total_operational_cost
FROM vehicles v
LEFT JOIN fuel_logs f ON v.id = f.vehicle_id
LEFT JOIN maintenance_logs m ON v.id = m.vehicle_id
LEFT JOIN expenses e ON v.id = e.vehicle_id
GROUP BY v.id, v.reg_number, v.model, v.status;

-- 9. ROI VIEW: (Revenue - Total Cost) / Acquisition Cost
CREATE OR REPLACE VIEW v_vehicle_roi AS
SELECT 
    v.id AS vehicle_id,
    v.reg_number,
    v.model,
    v.acquisition_cost,
    COALESCE(SUM(t.planned_distance * 3.50), 0) AS total_revenue,
    voc.total_operational_cost,
    CASE 
        WHEN v.acquisition_cost > 0 THEN 
            ROUND(((COALESCE(SUM(t.planned_distance * 3.50), 0) - voc.total_operational_cost) / v.acquisition_cost), 4)
        ELSE 0 
    END AS roi
FROM vehicles v
LEFT JOIN trips t ON v.id = t.vehicle_id AND t.status = 'Completed'
LEFT JOIN v_vehicle_operational_costs voc ON v.id = voc.vehicle_id
GROUP BY v.id, v.reg_number, v.model, v.acquisition_cost, voc.total_operational_cost;
