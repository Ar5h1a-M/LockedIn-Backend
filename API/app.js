const express = require('express');
const app = express();

app.use(express.json());

// example route
app.get('/health', (_req, res) => res.json({ ok: true }));

module.exports = app;   // <-- IMPORTANT: export the app instance