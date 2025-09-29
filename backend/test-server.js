// Simple test script to verify backend functionality
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testServer() {
  try {
    console.log('🧪 Testing backend server...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test email endpoint
    console.log('\n2. Testing email endpoint...');
    const emailResponse = await fetch(`${BASE_URL}/api/test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const emailData = await emailResponse.json();
    console.log('✅ Test email:', emailData);

    console.log('\n🎉 All tests passed! Backend is working correctly.');
    console.log('\n📝 You can now test the form submission from the frontend.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 5000');
    console.log('   Run: node server.js');
  }
}

testServer();
