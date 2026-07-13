import { freshEmail, getVerificationLink } from '../src/utils/email';

const email = process.argv[2] ?? freshEmail();
console.log('Looking for email to:', email);

const link = await getVerificationLink(email, 120_000);
console.log('✅ Found link:', link);
