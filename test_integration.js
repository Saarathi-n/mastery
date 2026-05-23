import { exec } from 'child_process';
import { setTimeout as wait } from 'timers/promises';

// Start server
console.log('Starting server...');
const server = exec('node server.js');

server.stdout.on('data', (data) => {
  process.stdout.write(data);
});

server.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Wait for server to start, then test
wait(10000).then(async () => {
  console.log('\nTesting JEE endpoint...');
  try {
    const fetch = (...args) => (await import('node-fetch')).default(...args);
    const response = await fetch('http://localhost:5001/api/screentest/questions?exam=JEE');
    const data = await response.json();
    console.log('JEE: Total questions =', data.length);
    if (data.length > 0) {
      console.log('  First question subject:', data[0].subject);
    }
  } catch (err) {
    console.error('JEE Error:', err.message);
  }
  
  console.log('\nTesting NEET endpoint...');
  try {
    const fetch = (...args) => (await import('node-fetch')).default(...args);
    const response = await fetch('http://localhost:5001/api/screentest/questions?exam=NEET');
    const data = await response.json();
    console.log('NEET: Total questions =', data.length);
    if (data.length > 0) {
      console.log('  First question subject:', data[0].subject);
    }
  } catch (err) {
    console.error('NEET Error:', err.message);
  }
    
  // Stop server after testing
  wait(5000).then(() => {
    console.log('\nStopping server...');
    server.kill();
  });
});