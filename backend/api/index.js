// Vercel serverless entry
const fs = require('fs');
const path = require('path');

let cachedHandler;

module.exports = async (req, res) => {
  // Debug: check what files exist
  const distPath = path.join(process.cwd(), 'dist');
  const distExists = fs.existsSync(distPath);
  const distApiPath = path.join(__dirname, '..', 'dist');
  const distApiExists = fs.existsSync(distApiPath);

  if (req.url === '/health' || req.url === '/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      status: 'ok',
      debug: {
        cwd: process.cwd(),
        dirname: __dirname,
        distFromCwd: distExists,
        distFromApi: distApiExists,
        cwdFiles: fs.existsSync(process.cwd()) ? fs.readdirSync(process.cwd()).slice(0, 20) : [],
        distFiles: distExists ? fs.readdirSync(distPath).slice(0, 20) : (distApiExists ? fs.readdirSync(distApiPath).slice(0, 20) : []),
      }
    }));
  }

  try {
    if (!cachedHandler) {
      // Try multiple paths
      const paths = [
        path.join(process.cwd(), 'dist', 'serverless'),
        path.join(__dirname, '..', 'dist', 'serverless'),
        path.join(__dirname, 'dist', 'serverless'),
      ];
      for (const p of paths) {
        if (fs.existsSync(p + '.js')) {
          cachedHandler = require(p).default;
          break;
        }
      }
      if (!cachedHandler) {
        throw new Error('Could not find dist/serverless.js in any path: ' + paths.map(p => p + '.js').join(', '));
      }
    }
    return await cachedHandler(req, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message }));
  }
};
