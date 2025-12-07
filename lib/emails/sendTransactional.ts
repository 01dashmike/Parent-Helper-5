"use server";

import sgMail from "@sendgrid/mail";
import { hasSupabaseServerEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import { getEmailFailureAlertTemplate } from "@/lib/emails/templates/emailFailureAlert";

export type SendOpts = {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
    type?: string;
    meta?: {
        skipErrorAlert?: boolean;
    };
    attachments?: Array<{
        filename: string;
        type?: string;
        content: string;
        disposition?: "attachment" | "inline";
        contentId?: string;
    }>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const toArray = (value?: string | string[]) => {
    if (!value) return [] as string[];
    if (Array.isArray(value)) {
        return value
            .map((item) => item?.split(",") ?? [])
            .flat()
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
};

const validAll = (addresses: string[]) => addresses.every((addr) => EMAIL_RE.test(addr));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const stripHtml = (value: string) =>
    value
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const logPreview = (
    reason: string,
    subject: string,
    to: string[],
    cc: string[],
    bcc: string[],
    text: string
) => {
    console.warn(`[sendTransactional] Skipping real send (${reason}).`);
    console.info(`[sendTransactional] To: ${to.join(", ")}`);
    if (cc.length) console.info(`[sendTransactional] Cc: ${cc.join(", ")}`);
    if (bcc.length) console.info(`[sendTransactional] Bcc: ${bcc.join(", ")}`);
    console.info(`[sendTransactional] Subject: ${subject}`);
    console.info(
        `[sendTransactional] Text preview: ${text.slice(0, 240)}${text.length > 240 ? "…" : ""}`
    );
};

/**
 * Send a transactional email using SendGrid with safe fallbacks for development.
 */
export async function sendTransactional(
    opts: SendOpts
): Promise<{ ok: true } | { ok: false; error: string }> {
    const {
        to,
        subject,
        html,
        text,
        cc,
        bcc,
        replyTo,
        attachments,
        type,
        meta,
    } = opts;

    const toList = toArray(to);
    const ccList = toArray(cc);
    const bccList = toArray(bcc);
    const emailType = type ?? "general";

    const recordEmailLog = async (
        status: string,
        errorMessage?: string
    ) => {
        if (!hasSupabaseServerEnv()) return;
        try {
            const supabase = createServerClient();
            await supabase.from("email_logs").insert({
                to_address: toList.join(", "),
                subject,
                status,
                type: emailType,
                error: errorMessage ? errorMessage.slice(0, 2000) : null,
            });
        } catch (logError) {
            console.warn("[sendTransactional] Failed to record email log:", logError);
        }
    };
    const sendErrorAlert = async (errorMessage: string) => {
        try {
            const adminEmail = process.env.ADMIN_EMAIL;
            if (!adminEmail || meta?.skipErrorAlert) return;

            const timestamp = new Date().toISOString();
            const template = getEmailFailureAlertTemplate({
                to: toList.join(", ") || "(missing)",
                subject,
                type: emailType,
                error: errorMessage,
                timestamp,
            });

            const attempts = [0, 500, 1500];
            for (let idx = 0; idx < attempts.length; idx++) {
                if (attempts[idx] > 0) {
                    await sleep(attempts[idx]);
                }
                const result = await sendTransactional({
                    to: adminEmail,
                    subject: template.subject,
                    html: template.html,
                    text: template.text,
                    type: "admin_alert",
                    meta: { skipErrorAlert: true },
                });
                if (result.ok) {
                    return;
                }
            }

            console.warn("[sendTransactional] Admin alert emails failed after retries.");
        } catch (alertError) {
            console.warn("[sendTransactional] Failed to dispatch admin alert email:", alertError);
        }
    };

    const triggerErrorAlert = (errorMessage: string) => {
        if (!meta?.skipErrorAlert) {
            void sendErrorAlert(errorMessage);
        }
    };

    if (toList.length === 0) {
        const errorMessage = "Missing recipient.";
        void recordEmailLog("failed", errorMessage);
        triggerErrorAlert(errorMessage);
        return { ok: false, error: errorMessage } as const;
    }

    if (
        !validAll(toList) ||
        !validAll(ccList) ||
        !validAll(bccList) ||
        (replyTo && !EMAIL_RE.test(replyTo))
    ) {
        const errorMessage = "Invalid email address format.";
        void recordEmailLog("failed", errorMessage);
        triggerErrorAlert(errorMessage);
        return { ok: false, error: errorMessage } as const;
    }

    const fromEnv = process.env.EMAIL_FROM || "no-reply@localhost";
    if (!process.env.EMAIL_FROM) {
        console.warn("[sendTransactional] EMAIL_FROM missing. Falling back to no-reply@localhost.");
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    const isProd = process.env.NODE_ENV === "production";
    const debug = String(process.env.EMAIL_DEBUG || "").toLowerCase() === "true";

    const fallbackText =
        text && text.trim().length > 0 ? text : stripHtml(String(html ?? "")) || "(no content)";

    if (!isProd || !apiKey) {
        const reason = !isProd ? "non-production environment" : "missing SENDGRID_API_KEY";
        logPreview(reason, subject, toList, ccList, bccList, fallbackText);
        void recordEmailLog("preview");
        return { ok: true } as const;
    }

    sgMail.setApiKey(apiKey);

    const message: Parameters<typeof sgMail.send>[0] = {
        from: fromEnv,
        to: toList,
        subject,
        html,
        text: fallbackText,
        ...(ccList.length ? { cc: ccList } : {}),
        ...(bccList.length ? { bcc: bccList } : {}),
        ...(replyTo ? { replyTo } : {}),
        ...(attachments?.length ? { attachments } : {}),
        mailSettings: {
            sandboxMode: { enable: false },
        },
        trackingSettings: {
            clickTracking: { enable: false, enableText: false },
            openTracking: { enable: false },
        },
    };

    const delays = [250, 750, 1500];

    for (let attempt = 0; attempt < delays.length; attempt++) {
        try {
            let timeoutHandle: NodeJS.Timeout | null = null;
            const timeoutPromise = new Promise<never>((_, reject) => {
                timeoutHandle = setTimeout(() => {
                    reject(new Error("SendGrid request timed out."));
                }, 10_000);
            });

            await Promise.race([sgMail.send(message), timeoutPromise]);
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }

            if (debug) {
                console.info(
                    `[sendTransactional] Sent: ${subject} → ${toList.join(", ")}`
                );
            }

            void recordEmailLog("sent");
            
            // Log activity if enabled
            if (process.env.LOG_EMAIL_ACTIVITY === "true") {
                const { logActivity } = await import("@/lib/activityLog");
                void logActivity({
                    eventType: "email.sent",
                    scope: "email",
                    level: "info",
                    title: `Email sent: ${subject}`,
                    description: `To: ${toList.join(", ")}`,
                    metadata: {
                        templateId: emailType,
                        to: toList,
                        category: emailType,
                    },
                });
            }
            
            return { ok: true } as const;
        } catch (error: any) {
            const status = error?.code || error?.response?.statusCode;
            const body = error?.response?.body;
            const messageDetail = body ? JSON.stringify(body) : String(error);
            const retryable = status === undefined || (typeof status === "number" && status >= 500);

            if (!retryable) {
                const errorMessage = `SendGrid error ${status ?? ""} ${messageDetail}`.trim();
                void recordEmailLog("failed", errorMessage);
                triggerErrorAlert(errorMessage);
                
                // Log activity for email failures
                if (process.env.LOG_EMAIL_ACTIVITY === "true") {
                    const { logActivity } = await import("@/lib/activityLog");
                    void logActivity({
                        eventType: "email.failed",
                        scope: "email",
                        level: "error",
                        title: `Email failed: ${subject}`,
                        description: errorMessage,
                        metadata: {
                            to: toList,
                            error: errorMessage,
                        },
                    });
                }
                
                return {
                    ok: false,
                    error: errorMessage,
                } as const;
            }

            if (attempt < delays.length - 1) {
                await sleep(delays[attempt]);
                continue;
            }

            const errorMessage = `SendGrid retry failed: ${status ?? ""} ${messageDetail}`.trim();
            void recordEmailLog("failed", errorMessage);
            triggerErrorAlert(errorMessage);
            
            // Log activity for email failures
            if (process.env.LOG_EMAIL_ACTIVITY === "true") {
                const { logActivity } = await import("@/lib/activityLog");
                void logActivity({
                    eventType: "email.failed",
                    scope: "email",
                    level: "error",
                    title: `Email failed: ${subject}`,
                    description: errorMessage,
                    metadata: {
                        to: toList,
                        error: errorMessage,
                    },
                });
            }
            
            return {
                ok: false,
                error: errorMessage,
            } as const;
        }
    }

    const errorMessage = "Unknown send failure.";
    void recordEmailLog("failed", errorMessage);
    triggerErrorAlert(errorMessage);
    return { ok: false, error: errorMessage } as const;
}
