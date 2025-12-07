import { randomUUID } from "crypto";
import type { SendOpts } from "./sendTransactional";

type MockResult = {
  ok: true;
  simulated: true;
  previewId: string;
  sentAt: string;
  envelope: {
    to: string[];
    subject: string;
    type?: string;
  };
  snippets: {
    html: string;
    text: string;
  };
};

const toArray = (value: SendOpts["to"]): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};

const stripHtml = (value: string): string =>
  value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Lightweight mock for sendTransactional used by dev-only utilities.
 * Generates a deterministic preview payload without talking to SendGrid.
 */
export async function sendTransactionalMock(opts: SendOpts): Promise<MockResult> {
  const toList = toArray(opts.to);
  const textFallback =
    opts.text && opts.text.trim().length > 0 ? opts.text : stripHtml(String(opts.html ?? ""));

  return {
    ok: true,
    simulated: true,
    previewId: randomUUID(),
    sentAt: new Date().toISOString(),
    envelope: {
      to: toList,
      subject: opts.subject,
      type: opts.type,
    },
    snippets: {
      html: String(opts.html ?? "").slice(0, 500),
      text: textFallback.slice(0, 500),
    },
  };
}


