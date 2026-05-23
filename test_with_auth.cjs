const { spawn } = require('child_process');
const { setTimeout } = require('timers/promises');

let server = null;

(async () => {
  try {
    console.log('Starting server...');
    server = spawn('node', ['server.js'], { stdio: ['ignore', 'pipe', 'pipe'] });

    server.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    server.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    await setTimeout(15000); // wait for server to start

    console.log('\n--- Testing with authentication ---');
    // Step 1: Register a user (if not exists) or login
    let token = null;
    try {
      const regRes = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'testuser',
          email: 'test@example.com',
          password: 'testpass'
        })
      });
      if (regRes.ok) {
        const regData = await regRes.json();
        token = regData.token || regData.accessToken;
        console.log('Registered and got token');
      } else {
        console.log('Registration failed, trying login...');
      }
    } catch (e) {
      console.log('Registration error:', e.message);
    }

    if (!token) {
      try {
        const loginRes = await fetch('http://localhost:5001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'testpass'
          })
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          token = loginData.token || loginData.accessToken;
          console.log('Logged in and got token');
        } else {
          throw new Error('Login failed');
        }
      } catch (e) {
        console.log('Login error:', e.message);
        throw new Error('Could not obtain token');
      }
    }

    // Step 2: Test JEE endpoint
    console.log('\n--- Testing JEE ---');
    const jeeRes = await fetch('http://localhost:5001/api/screentest/questions?exam=JEE', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const jeeData = await jeeRes.json();
    console.log('JEE: Total questions =', jeeData.length);
    if (jeeData.length > 0) {
      console.log('  First question subject:', jeeData[0].subject);
      console.log('  First question:', jeeData[0].question);
    }

    // Step 3: Test NEET endpoint
    console.log('\n--- Testing NEET ---');
    const neetRes = await fetch('http://localhost:5001/api/screentest/questions?exam=NEET', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const neetData = await neetRes.json();
    console.log('NEET: Total questions =', neetData.length);
    if (neetData.length > 0) {
      console.log('  First question subject:', neetData[0].subject);
      console.log('  First question:', neetData[0].question);
    }

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    if (server) {
      console.log('\nStopping server...');
      server.kill();
    }
  }
})();