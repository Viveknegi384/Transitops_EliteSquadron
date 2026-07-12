const { GoogleGenAI } = require('@google/genai');
const db = require('../config/db');
require('dotenv').config();

exports.copilotChat = async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required.' });

        // 1. Gather quick context from DB
        const vCount = await db.query("SELECT status, COUNT(*) FROM vehicles GROUP BY status");
        const dCount = await db.query("SELECT status, COUNT(*) FROM drivers GROUP BY status");
        const tCount = await db.query("SELECT status, COUNT(*) FROM trips GROUP BY status");
        
        if (!process.env.GEMINI_API_KEY) {
            return res.json({
                reply: `[AI Copilot Mock Mode] Fleet Status Summary:\nVehicles: ${JSON.stringify(vCount.rows)}\nDrivers: ${JSON.stringify(dCount.rows)}\nTrips: ${JSON.stringify(tCount.rows)}\nTo activate live Gemini natural language reasoning, add your GEMINI_API_KEY to backend/.env.`
            });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are TransitOps AI Copilot. User asks: "${message}". Current database vehicle summary: ${JSON.stringify(vCount.rows)}. Driver summary: ${JSON.stringify(dCount.rows)}. Trip summary: ${JSON.stringify(tCount.rows)}. Answer helpfully and concisely.`
        });
        res.json({ reply: response.text });
    } catch (err) { next(err); }
};

exports.smartDispatch = async (req, res, next) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

        const availableVehicles = await db.query("SELECT * FROM vehicles WHERE status = 'Available'");
        const availableDrivers = await db.query("SELECT * FROM drivers WHERE status = 'Available' AND license_expiry >= CURRENT_DATE ORDER BY safety_score DESC");

        if (!process.env.GEMINI_API_KEY) {
            // Mock extraction via regex/keywords
            const weightMatch = prompt.match(/(\d+)\s*kg/i);
            const weight = weightMatch ? parseInt(weightMatch[1]) : 300;
            const matchVehicle = availableVehicles.rows.find(v => v.max_load >= weight) || availableVehicles.rows[0];
            return res.json({
                source: "Warehouse 1 (Extracted)",
                destination: "Delivery Point X (Extracted)",
                cargo_weight: weight,
                planned_distance: 120,
                recommended_vehicle_id: matchVehicle ? matchVehicle.id : null,
                recommended_driver_id: availableDrivers.rows.length > 0 ? availableDrivers.rows[0].id : null,
                reasoning: `[Mock AI Mode] Selected vehicle ${matchVehicle ? matchVehicle.reg_number : 'N/A'} (Capacity: ${matchVehicle ? matchVehicle.max_load : 0}kg) for ${weight}kg cargo.`
            });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Parse this transport dispatch request: "${prompt}".
            Available Vehicles: ${JSON.stringify(availableVehicles.rows)}
            Available Drivers: ${JSON.stringify(availableDrivers.rows)}
            Return ONLY valid JSON with keys: source (string), destination (string), cargo_weight (number in kg), planned_distance (number in km), recommended_vehicle_id (uuid string), recommended_driver_id (uuid string), reasoning (short string why).`
        });
        res.json(JSON.parse(response.text.replace(/```json|```/g, '').trim()));
    } catch (err) { next(err); }
};
