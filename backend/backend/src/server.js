require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const https = require('https');
const fs = require('fs');
const path = require('path');

const connectDB = require('./config/db');

const app = express();

// --- Core middleware ---
app.use(helmet());
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- Health check route ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// --- Routes ---
app.use('/api/auth', require('./routes/auth.routes'));

// --- 404 handler (no matching route) ---
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// --- Central error handler (must be last) ---
app.use((err, req, res, next) => {
  console.error(err.stack); // server-side only, never sent to client
  res.status(err.status || 500).json({ message: 'Something went wrong' });
});

// --- Start server over HTTPS ---
const PORT = process.env.PORT || 5000;

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '..', 'certs', 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '..', 'certs', 'localhost.pem')),
};

const start = async () => {
  await connectDB();
  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
  });
};

start();
