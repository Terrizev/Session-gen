const express = require('express');
const app = express();
const __path = process.cwd();
const fs = require('fs');
const path = require('path');
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;

// Import routes
const server = require('./wasiqr');
const code = require('./pair');

// Cleanup temp directory on start
const cleanup = () => {
  try {
    fs.rmSync(path.join(__dirname, 'temp'), { 
      recursive: true, 
      force: true 
    });
  } catch (err) {
    console.error('Cleanup error:', err);
  }
};
cleanup();

// Configure server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__path + '/public'));

// Routes
app.use('/wasiqr', server);
app.use('/code', code);
app.use('/pair', (req, res) => res.sendFile(__path + '/pair.html'));
app.use('/', (req, res) => res.sendFile(__path + '/nteejpage.html'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Server Error');
});

// Start
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
