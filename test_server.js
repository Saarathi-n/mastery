const { exec } = require('child_process');

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
setTimeout(() => {
  console.log('\nTesting JEE endpoint...');
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  
  fetch('http://localhost:5001/api/screentest/questions?exam=JEE')
    .then(res => res.json())
    .then(data => {
      console.log('JEE: Total questions =', data.length);
      if (data.length > 0) {
        console.log('  First question subject:', data[0].subject);
      }
    })
    .catch(err => console.error('JEE Error:', err.message));
  
  console.log('\nTesting NEET endpoint...');
  fetch('http://localhost:5001/api/screentest/questions?exam=NEET')
    .then(res => res.json())
    .then(data => {
      console.log('NEET: Total questions =', data.length);
      if (data.length > 0) {
        console.log('  First question subject:', data[0].subject);
      }
    })
    .catch(err => console.error('NEET Error:', err.message));
    
  // Stop server after testing
  setTimeout(() => {
    console.log('\nStopping server...');
    server.kill();
  }, 5000);
}, 10000);