const { spawn } = require('child_process');
const path = require('path');

// Function to start a process with given command and working directory
function startProcess(command, args, cwd, name) {
  console.log(`Starting ${name}...`);
  
  const process = spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'pipe'
  });
  
  process.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });
  
  process.stderr.on('data', (data) => {
    console.error(`[${name} ERROR] ${data.toString().trim()}`);
  });
  
  process.on('close', (code) => {
    console.log(`${name} process exited with code ${code}`);
  });
  
  return process;
}

// Start the server
const serverProcess = startProcess(
  'npm',
  ['run', 'dev'],
  path.join(__dirname, 'server'),
  'SERVER'
);

// Wait a bit before starting the client to ensure server is up
setTimeout(() => {
  const clientProcess = startProcess(
    'npm',
    ['start'],
    path.join(__dirname, 'client'),
    'CLIENT'
  );
  
  // Handle application shutdown
  const cleanup = () => {
    console.log('Shutting down all processes...');
    serverProcess.kill();
    clientProcess.kill();
    process.exit(0);
  };
  
  // Listen for termination signals
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}, 5000);

console.log('Starting Fruits Click Game Dashboard...');
console.log('Press Ctrl+C to stop all processes');
