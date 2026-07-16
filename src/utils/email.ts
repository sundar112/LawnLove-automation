import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { env } from '../config/env';
import { childLogger } from './logger';
import { retry } from './retry';
import { testRunId } from './unique';

const log = childLogger('email');

const POLL_INTERVAL_MS = 5_000;
const LINK_PATTERN = /verify|confirm|activate|token/i;

const requireGmailEnv = (): void => {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    throw new Error(
      'GMAIL_USER / GMAIL_APP_PASSWORD are not set in .env — required for email-verification tests. See .env.example.',
    );
  }
};

/**
 * Fresh Gmail `+` alias per call — delivers to the QA inbox but the app
 * treats it as a brand-new user.
 */
export const freshEmail = (): string => {
  requireGmailEnv();
  const [local, domain] = env.GMAIL_USER.split('@');
  return `${local}+${testRunId()}@${domain}`;
};

/**
 * Polls the QA inbox over IMAP until an email addressed to `toAddress`
 * arrives, then returns its first link matching `linkPattern` (defaults to
 * LINK_PATTERN, which fits verification emails — pass /reset-password/i for
 * password-reset emails). Matches the To header client-side — Gmail's
 * server-side IMAP SEARCH does not reliably match `+` aliases.
 */
export const getVerificationLink = async (
  toAddress: string,
  timeoutMs = 90_000,
  linkPattern: RegExp = LINK_PATTERN,
): Promise<string> => {
  requireGmailEnv();

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
    logger: false,
  });

  await client.connect();
  try {
    const attempts = Math.max(1, Math.ceil(timeoutMs / POLL_INTERVAL_MS));
    const wanted = toAddress.toLowerCase();

    return await retry(
      async () => {
        // Re-select INBOX each attempt so the message count is fresh.
        const box = await client.mailboxOpen('INBOX');
        if (box.exists === 0) {
          throw new Error(`inbox empty — no email for ${toAddress} yet`);
        }

        // Check the To header of the 20 newest messages ourselves.
        const start = Math.max(1, box.exists - 19);
        let matchSeq: number | undefined;
        for await (const msg of client.fetch(`${start}:*`, { envelope: true })) {
          const recipients = msg.envelope?.to ?? [];
          if (recipients.some((r) => r.address?.toLowerCase() === wanted)) {
            matchSeq = msg.seq; // keep the newest match
          }
        }
        if (!matchSeq) {
          throw new Error(`no email addressed to ${toAddress} yet`);
        }

        const { content } = await client.download(String(matchSeq));
        const parsed = await simpleParser(content);
        const body = parsed.html || parsed.text || '';

        const urls = body.match(/https?:\/\/[^\s"'<>)\]]+/g) ?? [];
        const link = urls.find((u) => linkPattern.test(u));
        if (!link) {
          throw new Error(`email for ${toAddress} contains no link matching ${linkPattern}`);
        }

        log.info({ toAddress }, 'verification link found');
        return link;
      },
      { attempts, baseDelayMs: POLL_INTERVAL_MS, factor: 1, label: 'verification-email' },
    );
  } finally {
    await client.logout();
  }
};
