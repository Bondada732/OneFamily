interface OtpRecord {
  otp: string;
  email: string;
  familyName?: string;
  headName?: string;
  expiresAt: number;
  attempts: number;
}

// In-memory OTP storage with TTL
const otpStore = new Map<string, OtpRecord>();

// Clean expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 60 * 1000);

/**
 * Generate a random 6-digit numeric OTP
 */
function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send an OTP to the given email address for Family Creation Registration
 */
export async function sendEmailOtp(
  email: string,
  familyName: string,
  headName: string
): Promise<{ success: boolean; message: string; devOtp?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const otp = generate6DigitOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

  otpStore.set(normalizedEmail, {
    otp,
    email: normalizedEmail,
    familyName,
    headName,
    expiresAt,
    attempts: 0,
  });

  // Log prominently to server console
  console.log(`
╔═════════════════════════════════════════════════════════════════════════╗
║                   ONE FAMILY - EMAIL OTP VERIFICATION                   ║
╠═════════════════════════════════════════════════════════════════════════╣
║  To:          ${normalizedEmail.padEnd(54)}║
║  Family:      ${(familyName || 'New Family').padEnd(54)}║
║  Family Head: ${(headName || 'Head').padEnd(54)}║
║  OTP CODE:    ${otp.padEnd(54)}║
║  Valid for:   10 Minutes                                                ║
╚═════════════════════════════════════════════════════════════════════════╝
`);

  return {
    success: true,
    message: `Verification code sent to ${normalizedEmail}`,
    devOtp: otp, // Returned for instant testing and in-app dev preview
  };
}

/**
 * Verify the submitted OTP for the given email
 */
export function verifyEmailOtp(
  email: string,
  enteredOtp: string
): { success: boolean; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return {
      success: false,
      error: 'No OTP found or code has expired. Please request a new code.',
    };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      error: 'OTP has expired. Please request a new code.',
    };
  }

  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      error: 'Too many incorrect attempts. Please request a new OTP.',
    };
  }

  if (record.otp !== enteredOtp.trim()) {
    record.attempts += 1;
    return {
      success: false,
      error: `Invalid verification code. Please check and try again. (${5 - record.attempts} attempts remaining)`,
    };
  }

  // Verification successful - consume OTP
  otpStore.delete(normalizedEmail);
  return { success: true };
}
