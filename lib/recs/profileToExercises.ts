import { Child } from "@/shared/schema";

const MEAL_EXERCISE_EXPERIMENT = process.env.MEAL_EXERCISE_EXPERIMENT === "true";

export interface Exercise {
    name: string;
    description: string;
    duration: string;
    ageAppropriate: boolean;
    intensity: "gentle" | "moderate" | "active";
}

/**
 * Generate age-safe activities list based on child profile
 * This is a stub implementation - in production, this would use a curated exercise database
 */
export function profileToExercises(child: Child): Exercise[] | null {
    if (!MEAL_EXERCISE_EXPERIMENT) {
        return null;
    }

    if (!child || !child.birthdate) {
        return null;
    }

    // Calculate age in months
    const birth = new Date(child.birthdate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    const ageMonths = years * 12 + months;

    // Get preferences
    const preferences = child.child_preferences?.[0];
    const intensity = (preferences?.intensity as "gentle" | "moderate" | "active") || "gentle";
    const interests = child.interests || [];

    // Age-appropriate activities (placeholder)
    const allActivities: Exercise[] = [];

    if (ageMonths < 6) {
        allActivities.push(
            { name: "Tummy Time", description: "Supervised tummy time to strengthen neck and core muscles", duration: "3-5 minutes", ageAppropriate: true, intensity: "gentle" },
            { name: "Reaching Games", description: "Encourage reaching for toys to develop motor skills", duration: "5-10 minutes", ageAppropriate: true, intensity: "gentle" },
        );
    } else if (ageMonths < 12) {
        allActivities.push(
            { name: "Crawling Practice", description: "Encourage crawling on soft surfaces", duration: "10-15 minutes", ageAppropriate: true, intensity: "gentle" },
            { name: "Sitting Games", description: "Play games while sitting to improve balance", duration: "10 minutes", ageAppropriate: true, intensity: "gentle" },
            { name: "Baby Yoga", description: "Gentle stretching and movement exercises", duration: "10 minutes", ageAppropriate: true, intensity: "gentle" },
        );
    } else if (ageMonths < 24) {
        allActivities.push(
            { name: "Walking Practice", description: "Encourage walking with support or independently", duration: "15-20 minutes", ageAppropriate: true, intensity: "moderate" },
            { name: "Dancing", description: "Move to music to develop rhythm and coordination", duration: "10-15 minutes", ageAppropriate: true, intensity: "moderate" },
            { name: "Ball Play", description: "Rolling and throwing soft balls", duration: "15 minutes", ageAppropriate: true, intensity: "moderate" },
            { name: "Climbing", description: "Safe climbing on soft play equipment", duration: "15 minutes", ageAppropriate: true, intensity: "moderate" },
        );
    } else {
        allActivities.push(
            { name: "Running Games", description: "Simple running and chasing games", duration: "20-30 minutes", ageAppropriate: true, intensity: "active" },
            { name: "Jumping", description: "Jumping on soft surfaces or trampoline", duration: "15 minutes", ageAppropriate: true, intensity: "active" },
            { name: "Balance Activities", description: "Walking on lines or balance beams", duration: "15 minutes", ageAppropriate: true, intensity: "moderate" },
            { name: "Obstacle Course", description: "Simple obstacle course with crawling, climbing, and jumping", duration: "20 minutes", ageAppropriate: true, intensity: "active" },
        );
    }

    // Filter by intensity preference
    let filtered = allActivities;
    if (intensity === "gentle") {
        filtered = allActivities.filter((a) => a.intensity === "gentle");
    } else if (intensity === "moderate") {
        filtered = allActivities.filter((a) => a.intensity !== "active");
    }
    // If "active", include all activities

    // Prioritize activities matching interests
    if (interests.length > 0) {
        filtered = filtered.sort((a, b) => {
            const aMatches = interests.some((i) => a.name.toLowerCase().includes(i.toLowerCase()) || a.description.toLowerCase().includes(i.toLowerCase()));
            const bMatches = interests.some((i) => b.name.toLowerCase().includes(i.toLowerCase()) || b.description.toLowerCase().includes(i.toLowerCase()));
            if (aMatches && !bMatches) return -1;
            if (!aMatches && bMatches) return 1;
            return 0;
        });
    }

    return filtered.slice(0, 10); // Return top 10 activities
}

