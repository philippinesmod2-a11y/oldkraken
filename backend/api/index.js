// Vercel serverless entry — imports from compiled NestJS dist
const handler = require('../dist/serverless').default;
module.exports = handler;
