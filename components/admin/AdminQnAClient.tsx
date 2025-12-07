"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useMemo } from "react";

interface QuestionRecord {
  id: string;
  body: string;
  status: string;
  created_at: string;
  class_id: number;
  classes?: {
    id: number;
    name: string;
  } | null;
  user_id: string;
  class_answers?: Array<{
    id: string;
    body: string;
    created_at: string;
    provider_id: number;
    providers?: {
      name: string;
    } | null;
  }>;
}

interface Props {
  questions: QuestionRecord[];
}

export default function AdminQnAClient({ questions }: Props) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return questions.filter((q: { status?: string }) => (filterStatus ? q.status === filterStatus : true));
  }, [questions, filterStatus]);

  const handleModerate = async (questionId: string, action: "approve" | "reject") => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/classes/questions/${questionId}/moderate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!response.ok) {
          console.error("Failed to moderate question", await response.text());
          return;
        }
        router.refresh();
      } catch (err) {
        console.error("Error moderating question:", err);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="ph-input w-48"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        {isPending && <span className="text-small text-slateSoft">Updating…</span>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-sage/20 bg-white">
        <table className="min-w-full divide-y divide-sage/20 text-left text-small">
          <thead className="bg-cream/70 text-slateSoft">
            <tr>
              <th className="px-4 py-3">Question</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Answers</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage/10">
            {filtered.map((question) => (
              <tr key={question.id} className="hover:bg-cream/60">
                <td className="px-4 py-3">
                  <p className="text-small text-charcoal line-clamp-2">{question.body}</p>
                  <p className="mt-1 text-small text-slateSoft">
                    {new Date(question.created_at).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {question.classes ? (
                    <a
                      href={`/class/${question.classes.id}`}
                      className="text-small text-sage hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {question.classes.name}
                    </a>
                  ) : (
                    <span className="text-small text-slateSoft">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {question.status === "approved" ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-small text-green-800">Approved</span>
                  ) : question.status === "rejected" ? (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-small text-red-800">Rejected</span>
                  ) : (
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-small text-yellow-800">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-small text-charcoal">
                    {question.class_answers?.length || 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {question.status === "pending" && (
                      <>
                        <button
                          type="button"
                          className="rounded-full bg-green-600 px-3 py-1 text-small font-medium text-white transition hover:bg-green-700"
                          onClick={() => handleModerate(question.id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-red-600 px-3 py-1 text-small font-medium text-white transition hover:bg-red-700"
                          onClick={() => handleModerate(question.id, "reject")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {question.status === "approved" && (
                      <button
                        type="button"
                        className="rounded-full bg-red-600 px-3 py-1 text-small font-medium text-white transition hover:bg-red-700"
                        onClick={() => handleModerate(question.id, "reject")}
                      >
                        Reject
                      </button>
                    )}
                    {question.status === "rejected" && (
                      <button
                        type="button"
                        className="rounded-full bg-green-600 px-3 py-1 text-small font-medium text-white transition hover:bg-green-700"
                        onClick={() => handleModerate(question.id, "approve")}
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-sage/20 bg-white p-8 text-center text-slateSoft">
          No questions found.
        </div>
      )}
    </div>
  );
}

