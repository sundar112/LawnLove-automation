// Debug gate: prove the email pipeline finds a link for a given address.
// Usage: npx tsx scripts/check-email-flow.ts [address] [link-pattern]
//   e.g. npx tsx scripts/check-email-flow.ts sundarasqa+abc@gmail.com reset-password
import { freshEmail, getVerificationLink } from '../src/utils/email';

const email = process.argv[2] ?? freshEmail();
const pattern = process.argv[3] ? new RegExp(process.argv[3], 'i') : undefined;
console.log('Looking for email to:', email, pattern ? `(pattern: ${pattern})` : '');

const link = await getVerificationLink(email, 120_000, pattern);
console.log('✅ Found link:', link);
