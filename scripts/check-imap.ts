import { ImapFlow } from 'imapflow';
import { env } from '../src/config/env';

const client = new ImapFlow({
  host: 'imap.gmail.com',
  port: 993,
  secure: true,
  auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
  logger: false,
});

await client.connect();
const box = await client.mailboxOpen('INBOX');
console.log('✅ IMAP OK — messages in inbox:', box.exists);
await client.logout();
