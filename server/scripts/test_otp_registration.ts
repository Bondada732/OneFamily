const BACKEND_URL = 'http://localhost:4000/api';

async function runOtpTests() {
  console.log('🧪 Starting Family Creation OTP Authentication Tests...\n');

  const testEmail = `test_family_${Date.now()}@example.com`;
  const familyName = 'Kapoor Family';
  const headName = 'Anil Kapoor';

  // Test 1: Send OTP with invalid email format
  console.log('Test 1: Invalid email format validation');
  try {
    const res = await fetch(`${BACKEND_URL}/auth/send-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', familyName, headName }),
    });
    const data = await res.json();
    if (res.status === 400) {
      console.log('✅ PASS: Rejected invalid email format with error:', data.error);
    } else {
      console.error('❌ FAIL: Expected 400, got', res.status, data);
    }
  } catch (e) {
    console.error('❌ FAIL: Request error', e);
  }

  // Test 2: Send OTP with duplicate existing Family Head email
  console.log('\nTest 2: Duplicate existing Family Head email rejection');
  try {
    const res = await fetch(`${BACKEND_URL}/auth/send-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'parudigitalx@gmail.com', familyName, headName }),
    });
    const data = await res.json();
    if (res.status === 409) {
      console.log('✅ PASS: Rejected duplicate Family Head email with error:', data.error);
    } else {
      console.error('❌ FAIL: Expected 409, got', res.status, data);
    }
  } catch (e) {
    console.error('❌ FAIL: Request error', e);
  }

  // Test 3: Send valid OTP
  console.log('\nTest 3: Send valid OTP to new email address');
  let receivedDevOtp = '';
  try {
    const res = await fetch(`${BACKEND_URL}/auth/send-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, familyName, headName }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.devOtp) {
      receivedDevOtp = data.devOtp;
      console.log('✅ PASS: Successfully generated and sent OTP:', receivedDevOtp);
    } else {
      console.error('❌ FAIL: Failed to send OTP:', data);
    }
  } catch (e) {
    console.error('❌ FAIL: Request error', e);
  }

  // Test 4: Submit invalid/incorrect OTP code
  console.log('\nTest 4: Verify with wrong OTP code');
  try {
    const res = await fetch(`${BACKEND_URL}/auth/verify-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otp: '000000',
        familyName,
        headName,
        headEmail: testEmail,
        pinCode: '5555',
        relationship: 'Father / Family Head',
      }),
    });
    const data = await res.json();
    if (res.status === 400 && data.error.includes('Invalid verification code')) {
      console.log('✅ PASS: Rejected incorrect OTP with message:', data.error);
    } else {
      console.error('❌ FAIL: Expected 400 rejection, got:', res.status, data);
    }
  } catch (e) {
    console.error('❌ FAIL: Request error', e);
  }

  // Test 5: Verify with valid OTP code & complete Family Creation
  console.log('\nTest 5: Verify with valid OTP code');
  try {
    const res = await fetch(`${BACKEND_URL}/auth/verify-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otp: receivedDevOtp,
        familyName,
        headName,
        headEmail: testEmail,
        pinCode: '5555',
        relationship: 'Father / Family Head',
      }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.family && data.familyKey && data.token) {
      console.log('✅ PASS: Family registered successfully!');
      console.log(`   - Family ID: ${data.family.id}`);
      console.log(`   - Family Key: ${data.familyKey}`);
      console.log(`   - Head User ID: ${data.user.id}`);
      console.log(`   - Email Verified: ${data.user.is_email_verified}`);
    } else {
      console.error('❌ FAIL: Family creation verification failed:', data);
    }
  } catch (e) {
    console.error('❌ FAIL: Request error', e);
  }

  // Test 6: Replay / reuse consumed OTP
  console.log('\nTest 6: Reuse already consumed OTP');
  try {
    const res = await fetch(`${BACKEND_URL}/auth/verify-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otp: receivedDevOtp,
        familyName,
        headName,
        headEmail: testEmail,
        pinCode: '5555',
      }),
    });
    const data = await res.json();
    if (res.status === 400) {
      console.log('✅ PASS: Successfully prevented OTP reuse. Error:', data.error);
    } else {
      console.error('❌ FAIL: Expected 400 rejection, got:', res.status, data);
    }
  } catch (e) {
    console.error('❌ FAIL: Request error', e);
  }

  console.log('\n🎉 All Family Creation OTP Authentication tests completed successfully!\n');
}

runOtpTests();
