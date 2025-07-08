#!/usr/bin/env node

const API_BASE = 'http://localhost:3001/api';

async function testAPIEndpoints() {
  console.log('🌐 Testing API endpoints...\n');

  try {
    // Test 1: Generate a puzzle
    console.log('1. Testing puzzle generation endpoint...');
    const generateResponse = await fetch(`${API_BASE}/puzzle/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date: '2024-01-21' })
    });

    const generateResult = await generateResponse.json();
    console.log(`Status: ${generateResponse.status}`);
    console.log(`Response:`, generateResult);

    if (generateResult.success) {
      console.log('✅ Puzzle generation API working\n');
    } else {
      console.log('❌ Puzzle generation API failed\n');
      return;
    }

    // Test 2: Retrieve the puzzle
    console.log('2. Testing puzzle retrieval endpoint...');
    const retrieveResponse = await fetch(`${API_BASE}/puzzle/2024-01-21`);
    const retrieveResult = await retrieveResponse.json();
    
    console.log(`Status: ${retrieveResponse.status}`);
    console.log(`Response:`, JSON.stringify(retrieveResult, null, 2));

    if (retrieveResult.success) {
      console.log('✅ Puzzle retrieval API working\n');
    } else {
      console.log('❌ Puzzle retrieval API failed\n');
    }

    // Test 3: Test idempotency
    console.log('3. Testing idempotency...');
    const idempotentResponse = await fetch(`${API_BASE}/puzzle/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date: '2024-01-21' })
    });

    const idempotentResult = await idempotentResponse.json();
    console.log(`Status: ${idempotentResponse.status}`);
    console.log(`Response:`, idempotentResult);

    if (idempotentResult.success && idempotentResult.message.includes('already exists')) {
      console.log('✅ Idempotency test passed\n');
    } else {
      console.log('❌ Idempotency test failed\n');
    }

    // Test 4: Test error handling (invalid date)
    console.log('4. Testing error handling...');
    const errorResponse = await fetch(`${API_BASE}/puzzle/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date: 'invalid-date' })
    });

    const errorResult = await errorResponse.json();
    console.log(`Status: ${errorResponse.status}`);
    console.log(`Response:`, errorResult);

    if (errorResponse.status === 400) {
      console.log('✅ Error handling working\n');
    } else {
      console.log('❌ Error handling not working as expected\n');
    }

    console.log('🎉 API endpoint tests completed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n💡 Make sure the development server is running:');
    console.log('   npm run dev');
  }
}

// Run the test
testAPIEndpoints();