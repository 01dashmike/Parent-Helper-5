"use client";

import type { NutritionBreakdown as NutritionBreakdownType, PersonNutrition } from "@/lib/wellness/types";

interface NutritionBreakdownProps {
  nutrition: NutritionBreakdownType;
}

function PersonCard({ person }: { person: PersonNutrition }) {
  return (
    <div className="rounded-xl bg-sage/5 p-4">
      <h5 className="mb-3 font-semibold text-charcoal">{person.label}</h5>
      
      {/* Daily Calories */}
      <div className="mb-3">
        <div className="text-2xl font-bold text-sage">
          {person.dailyCalories.toLocaleString()}
        </div>
        <div className="text-xs text-charcoal/60">calories/day</div>
      </div>
      
      {/* Macros */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-charcoal/70">Protein</span>
          <span className="font-medium text-charcoal">
            {person.macros.protein}g ({person.macros.proteinPercent}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-charcoal/70">Carbs</span>
          <span className="font-medium text-charcoal">
            {person.macros.carbs}g ({person.macros.carbsPercent}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-charcoal/70">Fat</span>
          <span className="font-medium text-charcoal">
            {person.macros.fat}g ({person.macros.fatPercent}%)
          </span>
        </div>
      </div>
      
      {/* Macro bar visual */}
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-charcoal/10">
        <div className="flex h-full">
          <div 
            className="bg-blue-400" 
            style={{ width: `${person.macros.proteinPercent}%` }}
            title="Protein"
          />
          <div 
            className="bg-amber-400" 
            style={{ width: `${person.macros.carbsPercent}%` }}
            title="Carbs"
          />
          <div 
            className="bg-rose-400" 
            style={{ width: `${person.macros.fatPercent}%` }}
            title="Fat"
          />
        </div>
      </div>
      
      {/* Per meal breakdown */}
      <div className="border-t border-charcoal/10 pt-3">
        <div className="text-xs font-medium text-charcoal/60 mb-2">Per meal target:</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-charcoal/60">Breakfast</span>
            <span className="font-medium">{person.mealCalories.breakfast} cal</span>
          </div>
          <div className="flex justify-between">
            <span className="text-charcoal/60">Lunch</span>
            <span className="font-medium">{person.mealCalories.lunch} cal</span>
          </div>
          <div className="flex justify-between">
            <span className="text-charcoal/60">Dinner</span>
            <span className="font-medium">{person.mealCalories.dinner} cal</span>
          </div>
          <div className="flex justify-between">
            <span className="text-charcoal/60">Snacks</span>
            <span className="font-medium">{person.mealCalories.snacks} cal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NutritionBreakdown({ nutrition }: NutritionBreakdownProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-xl font-semibold text-charcoal">
          📊 Calorie & Macro Calculator
        </h4>
        <div className="text-right">
          <div className="text-lg font-bold text-sage">
            {nutrition.totalDailyCalories.toLocaleString()}
          </div>
          <div className="text-xs text-charcoal/60">total family cal/day</div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-blue-400" />
          <span>Protein</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-amber-400" />
          <span>Carbs</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-rose-400" />
          <span>Fat</span>
        </div>
      </div>
      
      {/* Person cards grid */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {nutrition.people.map((person, index) => (
          <PersonCard key={index} person={person} />
        ))}
      </div>
      
      {/* Family totals */}
      <div className="mb-4 rounded-xl bg-sage/10 p-4">
        <h5 className="mb-3 font-semibold text-charcoal">Family Daily Totals</h5>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-xl font-bold text-sage">
              {nutrition.totalDailyCalories.toLocaleString()}
            </div>
            <div className="text-xs text-charcoal/60">Calories</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600">
              {nutrition.totalMacros.protein}g
            </div>
            <div className="text-xs text-charcoal/60">Protein</div>
          </div>
          <div>
            <div className="text-xl font-bold text-amber-600">
              {nutrition.totalMacros.carbs}g
            </div>
            <div className="text-xs text-charcoal/60">Carbs</div>
          </div>
          <div>
            <div className="text-xl font-bold text-rose-600">
              {nutrition.totalMacros.fat}g
            </div>
            <div className="text-xs text-charcoal/60">Fat</div>
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <p className="text-xs text-charcoal/50 italic">
        {nutrition.disclaimer}
      </p>
    </div>
  );
}
