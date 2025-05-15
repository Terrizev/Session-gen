const express = require('express');
const app = express();
const __path = process.cwd();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;

// Import routes
const server = require('./wasiqr'),
      code = require('./pair');

// Configure event listeners
require('events').EventEmitter.defaultMaxListeners = 500;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use(express.static(__path + '/public'));

// Routes
app.use('/wasiqr', server);
app.use('/code', code);

// HTML endpoints
app.use('/pair', (req, res) => {
    res.sendFile(__path + '/pair.html');
});

app.use('/', (req, res) => {
    res.sendFile(__path + '/nteejpage.html');
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════╗
║   Server running on port ${PORT}     ║
║   Don't Forget To Give Star      ║
╚══════════════════════════════════╝
    `);
});

module.exports = app;

/**
 * Powered by NTEEJ TECH
 * Join WhatsApp channel for updates:
 * https://whatsapp.com/channel/0029Vae3GZF9Bb658QgSCl1I
 **/