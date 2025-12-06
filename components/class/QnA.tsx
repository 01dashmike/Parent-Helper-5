"use client";

import { useState, useCallback, memo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatDate } from "@/lib/utils/date";
import { isClassQAEnabled } from "@/lib/env";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { announce, announceFormSuccess, announceFormError } from "@/lib/a11y/announce";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/ui/errormessage";

type Question = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  answers?: Answer[];
};

type Answer = {
  id: string;
  body: string;
  created_at: string;
  provider_id: number;
  providers?: {
    name: string;
  };
};

type QnAProps = {
  classId: number;
  providerId?: number | null;
  currentUserId?: string | null;
  initialQuestions?: Question[];
};

const QnA = memo(function QnA({ classId, providerId, currentUserId, initialQuestions = [] }: QnAProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await fetch(`/api/classes/${classId}/questions`);
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      const data = await response.json();
      setQuestions(data?.questions || []);
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const handleSubmitQuestion = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    announce("Submitting question…");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Please sign in to ask a question");
        setSubmitting(false);
        announceFormError("Please sign in to ask a question");
        return;
      }

      const response = await fetch(`/api/classes/${classId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: questionText }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to submit question");
      }

      setQuestionText("");
      setError(null);
      announceFormSuccess("Question submitted successfully");
      // Refresh questions after a delay (question will be pending)
      setTimeout(() => {
        fetchQuestions();
      }, 1000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit question";
      setError(errorMessage);
      announceFormError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [classId, questionText, submitting]);

  const handleSubmitAnswer = useCallback(async (questionId: string) => {
    const answerText = answerTexts[questionId];
    if (!answerText?.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    announce("Submitting answer…");

    try {
      const response = await fetch(`/api/classes/questions/${questionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: answerText }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to submit answer");
      }

      setAnswerTexts((prev) => ({ ...prev, [questionId]: "" }));
      setError(null);
      announceFormSuccess("Answer submitted successfully");
      fetchQuestions();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit answer";
      setError(errorMessage);
      announceFormError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [answerTexts, submitting, fetchQuestions]);

  if (!isClassQAEnabled()) {
    return null;
  }

  const isProvider = providerId !== null && providerId !== undefined;

  return (
      <section className="mt-8 rounded-2xl bg-white shadow-soft p-4 border border-slate-200/60">
      <h2 className="mb-heading text-title font-semibold text-charcoal">Questions & Answers</h2>

      {error && (
        <ErrorMessage
          error={error}
          onRetry={() => setError(null)}
          className="mb-4"
        />
      )}

      {/* Ask Question Form */}
      {currentUserId && (
        <form onSubmit={handleSubmitQuestion} className="mb-8 space-y-3" aria-busy={submitting ? "true" : "false"}>
          <label htmlFor="question-text" className="block text-small font-medium text-charcoal">
            Ask a question
          </label>
          <Textarea
            id="question-text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Have a question about this class? Ask the provider..."
            className="w-full"
            rows={3}
            required
            minLength={10}
            maxLength={1000}
            disabled={submitting}
          />
          <Button
            type="submit"
            loading={submitting}
            loadingLabel="Submitting question"
            disabled={submitting || !questionText.trim()}
          >
            {submitting ? "Submitting..." : "Ask Question"}
          </Button>
          <p className="text-small opacity-70 text-slateSoft">
            Your question will be reviewed before being published.
          </p>
        </form>
      )}

      {/* Questions List */}
      {loading ? (
        <div aria-busy="true" aria-label="Loading questions" className="space-y-4">
          <div className="skeleton h-20" aria-hidden="true"></div>
          <div className="skeleton h-20" aria-hidden="true"></div>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-small text-slateSoft" role="status" aria-live="polite">No questions yet. Be the first to ask!</div>
      ) : (
        <div className="space-y-6" aria-busy="false">
          {questions.map((question) => (
            <div key={question.id} className="border-t border-sage/20 pt-6 first:border-t-0 first:pt-0">
              <div className="mb-3">
                <p className="text-body text-charcoal line-clamp-3" lang="en">{question.body}</p>
                <p className="mt-1 text-small opacity-70 text-slateSoft">
                  Asked {formatDate(question.created_at, "date")}
                </p>
              </div>

              {/* Answers */}
              {question.answers && question.answers.length > 0 && (
                <div className="ml-4 space-y-4 border-l-2 border-sage/30 pl-4">
                  {question.answers.map((answer) => (
                    <div key={answer.id}>
                      <div className="flex items-start gap-2">
                        <span className="text-small font-semibold text-sage truncate" lang="en">
                          {answer.providers?.name || "Provider"}
                        </span>
                        <span className="text-small opacity-70 text-slateSoft">answered</span>
                      </div>
                      <p className="mt-1 text-small text-charcoal line-clamp-3" lang="en">{answer.body}</p>
                      <p className="mt-1 text-small opacity-70 text-slateSoft">
                        {formatDate(answer.created_at, "date")}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Provider Answer Form */}
              {isProvider && !question.answers?.length && (
                <div className="ml-4 mt-4 space-y-2 border-l-2 border-sage/30 pl-4">
                  <VisuallyHidden as="label" htmlFor={`answer-${question.id}`}>
                    Answer this question
                  </VisuallyHidden>
                  <Textarea
                    id={`answer-${question.id}`}
                    value={answerTexts[question.id] || ""}
                    onChange={(e) =>
                      setAnswerTexts((prev) => ({ ...prev, [question.id]: e.target.value }))
                    }
                    placeholder="Answer this question..."
                    className="w-full text-small"
                    rows={2}
                    minLength={10}
                    maxLength={2000}
                    disabled={submitting}
                  />
                  <Button
                    type="button"
                    onClick={() => handleSubmitAnswer(question.id)}
                    variant="default"
                    size="default"
                    className="bg-sage text-white hover:bg-sage/90"
                    disabled={submitting || !answerTexts[question.id]?.trim()}
                  >
                    {submitting ? "Submitting..." : "Answer"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
});

QnA.displayName = "QnA";

export default QnA;

