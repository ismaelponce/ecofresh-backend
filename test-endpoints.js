import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';
const TEST_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImEwODA2N2Q4M2YwY2Y5YzcxNjQyNjUwYzUyMWQ0ZWZhNWI2YTNlMDkiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZWNvZnJlc2g2IiwiYXVkIjoiZWNvZnJlc2g2IiwiYXV0aF90aW1lIjoxNzQxNzk2MDAwLCJ1c2VyX2lkIjoiZGp1OHRWNnhjVmNybFpaU1NGUUtrajhlWmU2MyIsInN1YiI6ImRqdTh0VjZ4Y1ZjcmxaWlNTRlFLa2o4ZVplNjMiLCJpYXQiOjE3NDE3OTYwMDAsImV4cCI6MTc0MTc5OTYwMCwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbInRlc3RAZXhhbXBsZS5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.GvqaKfv1m7QR-baDcFcFkqdkhv1bC1m-vKRUXesQAFjG2ne-5ic7lvuhw5A2T-XM45WyAv9XrkZ8VS9VXiW6QzOLk3bh17F_2AP5Rfpy4F3FUKlKwQNG91nmFEwZ51ic-DLwiTKVHINrr0F7QuCW0fmddIA5VgGblrbvRE8CuhiaUzYJ-x0HXIv4_dQ3gi4W3sDpWGf34rUpRi9XdnYKY_uOHMzayA9y9R3Z3oO3dUynmxcifMltMsDi4PT2Doqukqn8JyloewKm3cHODNKynDCeQi454N1NXpWKosA3GpzsUxK6jY4DqwdOW_Vb41LZnDblGJUq0fMz0hqFquwIDg';

async function testEndpoints() {
  try {
    // 1. Test health endpoint
    console.log('\nTesting health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    console.log('Health Status:', await healthResponse.json());

    // 2. Test registration
    console.log('\nTesting registration endpoint...');
    const registrationResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        firebaseUid: 'dju8tV6xcVcrlZZSSFQKkj8eZe63',
        phone: '+1234567890',
      }),
    });
    console.log('Registration Response:', await registrationResponse.json());

    // 3. Test profile endpoint with valid token
    console.log('\nTesting profile endpoint...');
    const profileResponse = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('Profile Response:', await profileResponse.json());

  } catch (error) {
    console.error('Error testing endpoints:', error);
  }
}

testEndpoints(); 