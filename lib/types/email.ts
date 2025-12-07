export type EmailLog = {
  id: string;
  to_address: string;
  subject: string;
  status: "sent" | "failed" | "preview";
  type: string;
  error: string | null;
  created_at: string;
};


