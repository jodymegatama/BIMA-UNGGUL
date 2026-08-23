#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

console.log('🚀 Starting BIMA UNGGUL development servers...\n');

// Backend
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(root, 'backend'),
  stdio: 'inherit',
  shell: true,
});

// Wait 2 seconds, then start frontend
setTimeout(() => {
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(root, 'frontend'),
    stdio: 'inherit',
    shell: true,
  });

  frontend.on('error', (err) => {
    console.error('Frontend error:', err);
  });

  frontend.on('exit', (code) => {
    console.log(`Frontend process exited with code ${code}`);
    process.exit(code);
  });
}, 2000);

backend.on('error', (err) => {
  console.error('Backend error:', err);
});

backend.on('exit', (code) => {
  console.log(`Backend process exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down servers...');
  backend.kill();
  process.exit(0);
});
