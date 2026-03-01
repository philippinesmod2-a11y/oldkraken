// Vercel serverless entry — imports from compiled NestJS dist
const path = require('path');

let handler;

module.exports = async (req, res) => {
  try {
    if (!handler) {
      const serverlessPath = path.join(__dirname, '..', 'dist', 'serverless');
      handler = require(serverlessPath).default;
    }
    return await handler(req, res);
  } catch (error) {
    console.error('Serverless bootstrap error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
};
