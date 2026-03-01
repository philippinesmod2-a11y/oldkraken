// OldKraken API — Vercel Serverless Function
// This placeholder is overwritten by vercel-build (ncc bundle)
module.exports = (req, res) => {
  res.statusCode = 503;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify({
    error: 'Build incomplete',
    message: 'The vercel-build step did not complete. Check that Root Directory is set to "backend" in Vercel Project Settings.',
  }));
};
