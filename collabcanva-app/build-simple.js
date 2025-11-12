const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a simple build that only includes essential files
console.log('Building simple version...');

// Copy essential files to a temp directory
const tempDir = 'dist-simple';
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// Copy the existing dist if it exists
if (fs.existsSync('dist')) {
  console.log('Copying existing dist...');
  execSync('cp -r dist/* dist-simple/', { stdio: 'inherit' });
} else {
  console.log('No existing dist found, creating minimal build...');
  // Create minimal HTML
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CollabCanvas</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
  
  fs.writeFileSync(path.join(tempDir, 'index.html'), html);
}

console.log('Simple build complete!');
console.log('Files in dist-simple:', fs.readdirSync(tempDir));
