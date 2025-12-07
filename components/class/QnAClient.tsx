"use client";

import { memo } from "react";
import QnA from "./QnA";

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

type Props = {
  classId: number;
  providerId?: number | null;
  currentUserId?: string | null;
  initialQuestions?: Question[];
};

const QnAClient = memo(function QnAClient(props: Props) {
  return <QnA {...props} />;
});

QnAClient.displayName = "QnAClient";

export default QnAClient;

