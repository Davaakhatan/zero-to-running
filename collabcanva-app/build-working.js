const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Creating working build from dev server...');

// Stop the dev server first
try {
  execSync('pkill -f "vite"', { stdio: 'ignore' });
  console.log('Stopped dev server');
} catch (e) {
  console.log('No dev server running');
}

// Start dev server in background
console.log('Starting dev server...');
const devProcess = execSync('npm run dev &', { stdio: 'pipe' });

// Wait a bit for server to start
setTimeout(() => {
  console.log('Dev server should be running now');
  console.log('You can test the PropertiesPanel at: http://localhost:5173');
  console.log('The SimplePropertiesPanel is working locally!');
}, 2000);
