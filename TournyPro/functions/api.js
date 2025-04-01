const { createRequestHandler } = require('@netlify/next');

module.exports.handler = createRequestHandler({
  // If you have custom Next.js configuration, you can provide it here
  // next: {
  //   compression: false,
  // }
});