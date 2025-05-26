const { app, server } = require('./app');

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log('MongoDB connection active');
});
