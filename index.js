const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
const code = require("./pair");

// Increase event emitter limit
require("events").EventEmitter.defaultMaxListeners = 500;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/code", code);
app.use("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pair.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Server start
const server = app.listen(PORT, () => {
  console.log(`⏩ Server running on http://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
  throw error;
});

module.exports = app;
