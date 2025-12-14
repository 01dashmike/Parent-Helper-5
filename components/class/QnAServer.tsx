'use server';

import { createSupabaseServerComponentClient } from "@/lib/supabase/ssr";
import { isClassQAEnabled } from "@/lib/env";
import QnAClient from "./QnAClient";

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

type QnAServerProps = {
  classId: number;
  providerId?: number | null;
  currentUserId?: string | null;
};

/**
 * Server component that fetches Q&A data
 * Passes data to client component for interactivity
 */
export default async function QnAServer({ classId, providerId, currentUserId }: QnAServerProps) {
  if (!isClassQAEnabled()) {
    return null;
  }

  let questions: Question[] = [];

  try {
    const supabase = createSupabaseServerComponentClient();
    
    // Fetch approved questions with their answers
    const { data, error } = await supabase
      .from("class_questions")
      .select(
        `
        id,
        body,
        created_at,
        user_id,
        class_answers (
          id,
          body,
          created_at,
          provider_id,
          providers ( name )
        )
      `
      )
      .eq("class_id", classId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      questions = data as Question[];
    }
  } catch (error) {
    // Silently handle error - Q&A section should still render
    console.error("[QnAServer] Error fetching questions:", error);
  }

  return (
    <QnAClient
      classId={classId}
      providerId={providerId}
      currentUserId={currentUserId}
      initialQuestions={questions}
    />
  );
}







