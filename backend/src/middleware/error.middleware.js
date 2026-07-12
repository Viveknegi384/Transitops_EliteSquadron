const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.stack || err.message}`);
    
    // Postgres Unique constraint error (e.g., duplicate vehicle reg_number)
    if (err.code === '23505') {
        return res.status(409).json({ error: 'Conflict: A record with this unique value already exists.' });
    }

    // Postgres Foreign key violation
    if (err.code === '23503') {
        return res.status(400).json({ error: 'Bad Request: Referenced foreign key record does not exist or is in use.' });
    }

    res.status(500).json({ error: err.message || 'Internal Server Error' });
};

module.exports = errorHandler;
