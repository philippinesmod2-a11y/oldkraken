// Vercel serverless entry for NestJS
let cachedHandler;

module.exports = async (req, res) => {
  try {
    if (!cachedHandler) {
      const mod = require('../dist/serverless');
      cachedHandler = mod.default || mod;
    }
    return await cachedHandler(req, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message, stack: error.stack }));
  }
};
