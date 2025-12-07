"use client";

import { memo } from "react";
import PersonalizedRecommendations from "./PersonalizedRecommendations";

const PersonalizedRecommendationsClient = memo(function PersonalizedRecommendationsClient() {
  return <PersonalizedRecommendations />;
});

PersonalizedRecommendationsClient.displayName = "PersonalizedRecommendationsClient";

export default PersonalizedRecommendationsClient;

