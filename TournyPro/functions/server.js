const serverless = require('serverless-http');
const app = require('../backend/server');

// For local testing
if (process.env.NODE_ENV === 'development') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export handler for Netlify Functions
exports.handler = serverless(app, {
  basePath: '/api'
});