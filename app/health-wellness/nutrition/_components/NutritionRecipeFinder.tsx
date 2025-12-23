"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { generateNutritionRecipes, type NutritionRecipe } from "@/lib/wellness/actions";
import type { NutritionStage } from "@/lib/wellness/types";

interface NutritionRecipeFinderProps {
  stage: NutritionStage;
}

export default function NutritionRecipeFinder({ stage }: NutritionRecipeFinderProps) {
  const [ingredients, setIngredients] = useState("");
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<NutritionRecipe[] | null>(null);
  const [tips, setTips] = useState<string[] | null>(null);
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setRecipes(null);
    setTips(null);

    try {
      const result = await generateNutritionRecipes(
        stage,
        ingredients || undefined,
        preferences || undefined
      );

      if (result.success && result.data) {
        setRecipes(result.data.recipes);
        setTips(result.data.tips);
      } else {
        setError(result.error || "Failed to generate recipes");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stageLabels: Record<NutritionStage, string> = {
    pregnancy: "pregnancy",
    breastfeeding: "breastfeeding",
    "bottle-feeding": "busy parents",
    weaning: "weaning",
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="ingredients"
            className="mb-2 block text-sm font-medium text-charcoal"
          >
            Ingredients you have (optional)
          </label>
          <input
            id="ingredients"
            type="text"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g., chicken, spinach, sweet potato"
            className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
          />
          <p className="mt-1 text-xs text-charcoal/50">
            Leave blank for general recipe suggestions
          </p>
        </div>

        <div>
          <label
            htmlFor="preferences"
            className="mb-2 block text-sm font-medium text-charcoal"
          >
            Preferences or restrictions (optional)
          </label>
          <input
            id="preferences"
            type="text"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="e.g., vegetarian, quick meals, batch cooking"
            className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-sage py-3 px-6 font-semibold text-white transition-all hover:bg-sage/90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Finding recipes...
            </>
          ) : (
            `Find ${stageLabels[stage]} recipes`
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Results */}
      {recipes && recipes.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-charcoal">
            {recipes.length} recipes found
          </h3>

          <div className="space-y-4">
            {recipes.map((recipe, index) => (
              <article
                key={index}
                className="rounded-2xl border border-sage/20 bg-white shadow-sm overflow-hidden"
              >
                {/* Recipe Header */}
                <button
                  onClick={() =>
                    setExpandedRecipe(expandedRecipe === index ? null : index)
                  }
                  className="w-full p-4 text-left hover:bg-sage/5 transition-colors"
                  aria-expanded={expandedRecipe === index}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-charcoal">
                        {recipe.name}
                      </h4>
                      <p className="mt-1 text-sm text-charcoal/70">
                        {recipe.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-sage/10 px-2 py-1 text-sage">
                          ⏱️ Prep: {recipe.prepTime}
                        </span>
                        <span className="rounded-full bg-sage/10 px-2 py-1 text-sage">
                          🍳 Cook: {recipe.cookTime}
                        </span>
                        <span className="rounded-full bg-sage/10 px-2 py-1 text-sage">
                          👥 Serves: {recipe.servings}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-sage transition-transform ${
                        expandedRecipe === index ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ▼
                    </span>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedRecipe === index && (
                  <div className="border-t border-sage/10 p-4 space-y-4">
                    {/* Safety Notes */}
                    {recipe.safetyNotes && recipe.safetyNotes.length > 0 && (
                      <div className="rounded-lg bg-amber-50 p-3">
                        <p className="text-xs font-medium text-amber-800 mb-1">
                          ⚠️ Safety Notes
                        </p>
                        <ul className="text-xs text-amber-700 space-y-1">
                          {recipe.safetyNotes.map((note, i) => (
                            <li key={i}>• {note}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Nutrition Highlights */}
                    {recipe.nutritionHighlights &&
                      recipe.nutritionHighlights.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {recipe.nutritionHighlights.map((highlight, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
                            >
                              ✓ {highlight}
                            </span>
                          ))}
                        </div>
                      )}

                    {/* Ingredients */}
                    <div>
                      <h5 className="font-medium text-charcoal mb-2">
                        Ingredients
                      </h5>
                      <ul className="text-sm text-charcoal/80 space-y-1">
                        {recipe.ingredients.map((ingredient, i) => (
                          <li key={i}>• {ingredient}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Method */}
                    <div>
                      <h5 className="font-medium text-charcoal mb-2">Method</h5>
                      <ol className="text-sm text-charcoal/80 space-y-2">
                        {recipe.method.map((step, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/10 text-xs font-medium text-sage">
                              {i + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* Tips */}
          {tips && tips.length > 0 && (
            <div className="rounded-xl bg-sage/10 p-4">
              <h4 className="font-medium text-charcoal mb-2">💡 Tips</h4>
              <ul className="text-sm text-charcoal/80 space-y-1">
                {tips.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-charcoal/50 text-center">
        Recipes are AI-generated suggestions. Always check ingredients are safe
        for your specific stage and consult your healthcare provider if unsure.
      </p>
    </div>
  );
}

