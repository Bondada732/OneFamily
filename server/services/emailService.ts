import nodemailer from 'nodemailer';

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
 * Get or create Nodemailer transporter
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }
  return null;
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

  const transporter = getTransporter();
  if (transporter) {
    try {
      const senderEmail = process.env.SMTP_USER;
      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #f59e0b; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">ONE FAMILY</h1>
            <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0 0;">One Home • One Family • One Future</p>
          </div>
          <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Family Registration Verification</h2>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
              Hello <strong>${headName || 'Family Head'}</strong>,<br/><br/>
              Use the 6-digit verification code below to complete creating your new family space for <strong>${familyName || 'Your Family'}</strong>:
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <span style="display: inline-block; background-color: #020617; border: 2px solid #f59e0b; border-radius: 12px; padding: 14px 28px; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #f59e0b; font-family: monospace;">
                ${otp}
              </span>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
              ⏱️ This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
            </p>
          </div>
          <div style="text-align: center; color: #64748b; font-size: 11px;">
            &copy; 2026 One Family Platform. Private & Secure Family Hub.
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"One Family" <${senderEmail}>`,
        to: normalizedEmail,
        subject: `Your One Family Verification Code: ${otp}`,
        text: `Your One Family verification code for ${familyName} is: ${otp}. It is valid for 10 minutes.`,
        html: htmlContent,
      });

      console.log(`[Email Service] Real email successfully sent to ${normalizedEmail}`);
    } catch (mailErr: any) {
      console.error('[Email Service] Failed to send real email via SMTP:', mailErr.message);
    }
  }

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
