// api/index.js
const serverless = require('serverless-http');
const app = require('../server2/index'); // import the Express app from a separate file

module.exports.handler = serverless(app);
