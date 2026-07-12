const express = require('express');
const cors = require('cors');
require('dotenv').config();

const errorHandler = require('./middleware/error.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Base Route Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date(), service: 'TransitOps API' });
});

// Member 1 Routes (Auth, Vehicles, Drivers)
// Team Member 1 will create these route files in src/routes/
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/vehicles', require('./routes/vehicles.routes'));
app.use('/api/drivers', require('./routes/drivers.routes'));

// Member 2 Routes (Trips, Maintenance, Expenses, Analytics, GenAI)
// Team Member 2 will create these route files in src/routes/
app.use('/api/trips', require('./routes/trips.routes'));
app.use('/api/maintenance', require('./routes/maintenance.routes'));
app.use('/api/expenses', require('./routes/expenses.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/ai', require('./routes/ai.routes'));

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`[TransitOps Backend] Server running on http://localhost:${PORT}`);
});
