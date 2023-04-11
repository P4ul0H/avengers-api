const express = require('express');
const https = require('https');
const compression = require('compression');
const app = express();
const fs = require('fs');
const bp = require('body-parser');
const api = require('./routes/api/routes.js');
const helmet = require('helmet');
const uuid = require('uuid');
const { xss } = require('express-xss-sanitizer');
app.use(bp.json({ limit: '50mb' }));
app.use(compression());
app.use(xss());
app.disable('x-powered-by');

const options = {
    key: fs.readFileSync('./keys/server-key.pem'),
    cert: fs.readFileSync('./keys/server-cert.pem')
}

app.use((req, res, next) => {
    res.setHeader('x-request-id', uuid.v4());
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('x-xss-protection', '1; mode=block');
    res.setHeader('pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

app.use('/api', api);
app.use(helmet());

app.use((req, res, next) => {
    res.status(404).json('404 Not Found');
    next();
});

https.createServer(options, app).listen(process.env.SERVER_PORT, () => {
    console.log('Server is running on port ' + process.env.SERVER_PORT);
});