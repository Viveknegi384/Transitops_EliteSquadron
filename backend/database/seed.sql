-- Seed users with different roles for RBAC testing
INSERT INTO users (id, name, email, password_hash, role) VALUES
('11111111-1111-1111-1111-111111111111', 'Fleet Manager Demo', 'manager@transitops.com', '$2a$10$X8q.s3k/0/G.z6Y/0/G.z6Y/0/G.z6Y/0/G.z6Y/0/G.z6Y/0/G.z', 'Fleet Manager'),
('22222222-2222-2222-2222-222222222222', 'Dispatcher Demo', 'dispatch@transitops.com', '$2a$10$X8q.s3k/0/G.z6Y/0/G.z6Y/0/G.z6Y/0/G.z6Y/0/G.z6Y/0/G.z', 'Dispatcher'),
('33333333-3333-3333-3333-333333333333', 'Safety Officer Demo', 'safety@transitops.com', '$2a$10$X8q.s3k/0/G.z6Y/0/G.z6Y/0/G.z6Y/0/G.z6Y/0/G.z6Y/0/G.z', 'Safety Officer'),
('44444444-4444-4444-4444-444444444444', 'Financial Analyst Demo', 'finance@transitops.com', '$2a$10$X8q.s3k/0/G.z6Y/0/G.z6Y/0/G.z6Y/0/G.z6Y/0/G.z6Y/0/G.z', 'Financial Analyst')
ON CONFLICT (email) DO NOTHING;

-- Seed vehicles
INSERT INTO vehicles (id, reg_number, model, type, max_load, odometer, acquisition_cost, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'VAN-05', 'Ford Transit 2023', 'Van', 500.00, 15400, 42000.00, 'Available'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'TRK-102', 'Volvo FH16 Heavy', 'Truck', 8000.00, 89200, 120000.00, 'Available'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'REF-404', 'ThermoKing Chiller', 'Refrigerated Truck', 3500.00, 41000, 85000.00, 'In Shop'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'TRL-09', 'Utility Flatbed', 'Trailer', 12000.00, 198000, 55000.00, 'Retired')
ON CONFLICT (reg_number) DO NOTHING;

-- Seed drivers
INSERT INTO drivers (id, name, license_number, license_category, license_expiry, contact_number, safety_score, status) VALUES
('1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 'Alex Rivera', 'DL-8890-US', 'Class A', '2028-05-20', '+1 555 0192', 9.8, 'Available'),
('2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', 'Sam Chen', 'DL-3341-US', 'Class B', '2027-11-14', '+1 555 8831', 8.5, 'Available'),
('3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 'Jordan Vance', 'DL-0012-US', 'Class A', '2023-01-10', '+1 555 4910', 6.2, 'Suspended')
ON CONFLICT (license_number) DO NOTHING;
