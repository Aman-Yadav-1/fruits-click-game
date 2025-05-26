/**
 * Main entry point for the Fruits Click Game server
 * This file simply requires the app.js file which contains all the server logic
 */

console.log('Starting Fruits Click Game server from index.js');
console.log('Loading app.js...');

// Load the app.js file which contains the complete server setup
try {
  require('./app.js');
  console.log('Successfully loaded app.js');
} catch (error) {
  console.error('Error loading app.js:', error);
  process.exit(1);
}
