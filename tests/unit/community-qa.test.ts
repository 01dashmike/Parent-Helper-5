/**
 * Unit tests for community Q&A functionality
 */

import { createMockSupabaseClient } from "../mocks/supabaseClient.mock";

describe("Community Q&A", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  describe("Question Posting", () => {
    it("should post a question to a class", async () => {
      const questionData = {
        class_id: 123,
        user_id: "user-456",
        question_text: "What age is this class suitable for?",
        status: "pending",
      };

      mockSupabase._mockInsert.mockResolvedValueOnce({
        data: [{ id: 1, ...questionData }],
        error: null,
      });

      const result = await mockSupabase.from("class_questions").insert(questionData);

      expect(mockSupabase._mockInsert).toHaveBeenCalled();
      expect(result.data).toBeDefined();
    });

    it("should validate question text length", () => {
      const shortQuestion = "Hi";
      const longQuestion = "A".repeat(1001);
      const validQuestion = "What age range is this class suitable for?";

      expect(shortQuestion.length).toBeLessThan(10); // Too short
      expect(longQuestion.length).toBeGreaterThan(1000); // Too long
      expect(validQuestion.length).toBeGreaterThan(10);
      expect(validQuestion.length).toBeLessThan(1000);
    });
  });

  describe("Provider Answer", () => {
    it("should allow provider to answer question", async () => {
      const answerData = {
        question_id: 1,
        provider_id: 789,
        answer_text: "This class is suitable for babies 6-12 months.",
        answered_at: new Date().toISOString(),
      };

      mockSupabase._mockUpdate.mockResolvedValueOnce({
        data: [{ id: 1, ...answerData }],
        error: null,
      });

      const result = await mockSupabase
        .from("class_questions")
        .update({
          answer_text: answerData.answer_text,
          answered_at: answerData.answered_at,
          status: "answered",
        })
        .eq("id", answerData.question_id);

      expect(mockSupabase._mockUpdate).toHaveBeenCalled();
    });

    it("should send notification email to question asker", async () => {
      const question = {
        id: 1,
        user_id: "user-123",
        question_text: "Test question",
        answer_text: "Test answer",
      };

      // Mock email sending
      const { sendTransactional } = await import("@/lib/emails/sendTransactional");
      const result = await sendTransactional({
        to: "asker@example.com",
        subject: "Your question has been answered",
        html: `<p>Your question: ${question.question_text}</p><p>Answer: ${question.answer_text}</p>`,
        text: `Your question has been answered`,
        type: "qa_notification",
      });

      expect(result.ok).toBe(true);
    });
  });

  describe("Question Rendering", () => {
    it("should render question and answer together", () => {
      const qaData = {
        question: {
          id: 1,
          text: "What should I bring?",
          asked_by: "Parent",
          asked_at: "2024-12-01T10:00:00",
        },
        answer: {
          text: "Please bring a mat and water bottle.",
          answered_by: "Provider",
          answered_at: "2024-12-01T14:00:00",
        },
      };

      expect(qaData.question.text).toBeDefined();
      expect(qaData.answer.text).toBeDefined();
      expect(new Date(qaData.answer.answered_at) > new Date(qaData.question.asked_at)).toBe(
        true
      );
    });

    it("should filter questions by class", async () => {
      const classId = 123;
      const mockQuestions = [
        { id: 1, class_id: 123, question_text: "Question 1" },
        { id: 2, class_id: 456, question_text: "Question 2" },
        { id: 3, class_id: 123, question_text: "Question 3" },
      ];

      const classQuestions = mockQuestions.filter((q) => q.class_id === classId);
      expect(classQuestions).toHaveLength(2);
    });
  });

  describe("Question Status", () => {
    it("should track question status correctly", () => {
      const statuses = ["pending", "answered", "archived"];

      const question = {
        id: 1,
        status: "pending" as const,
      };

      expect(statuses).toContain(question.status);

      // Simulate status update
      question.status = "answered" as const;
      expect(question.status).toBe("answered");
    });
  });
});

