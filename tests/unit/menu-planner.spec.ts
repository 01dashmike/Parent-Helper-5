import { describe, expect, it } from "vitest";
import { createMenuPlan, menuPlannerSchema } from "@/app/tools/menu-planner/actions";

const baseInput = {
  householdSize: 4,
  ages: "4, 7, 35, 36",
  cuisines: ["Mediterranean", "Mexican"],
  dislikes: "mushrooms",
  budget: "balanced",
} as const;

describe("menu planner server action schema", () => {
  it("parses valid form data", () => {
    const parsed = menuPlannerSchema.parse(baseInput);
    expect(parsed.householdSize).toBe(4);
    expect(parsed.cuisines).toEqual(["Mediterranean", "Mexican"]);
  });

  it("rejects household size outside allowed range", () => {
    expect(() =>
      menuPlannerSchema.parse({
        ...baseInput,
        householdSize: 0,
      }),
    ).toThrowErrorMatchingInlineSnapshot('"Number must be greater than or equal to 1"');

    expect(() =>
      menuPlannerSchema.parse({
        ...baseInput,
        householdSize: 15,
      }),
    ).toThrowErrorMatchingInlineSnapshot('"Number must be less than or equal to 10"');
  });

  it("creates a full 7-day plan with shopping list", () => {
    const parsed = menuPlannerSchema.parse(baseInput);
    const plan = createMenuPlan(parsed);

    expect(plan.days).toHaveLength(7);
    expect(plan.shoppingList.length).toBeGreaterThan(0);
    expect(plan.notes.some((note) => note.toLowerCase().includes("allerg"))).toBe(true);
  });
});

