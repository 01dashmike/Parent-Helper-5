/**
 * Wellness Plan Email Template
 * 
 * Email templates for sending wellness plans (meal, exercise, supplement)
 */

import type { MealPlan, ExercisePlan, SupplementResult } from "@/lib/wellness/types";

/**
 * Generate HTML email for meal plan
 */
export function getMealPlanEmailTemplate(plan: MealPlan, audience: string) {
  const subject = `Your Personalized Meal Plan - Parent Helper Wellness`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Meal Plan</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2D3748; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #6B9080; font-size: 28px; margin-bottom: 10px; }
    h2 { color: #6B9080; font-size: 22px; margin-top: 30px; }
    h3 { color: #2D3748; font-size: 18px; margin-top: 20px; }
    .day { background: #F7FAFC; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #6B9080; }
    .meal { margin: 15px 0; }
    .meal-name { font-weight: bold; color: #6B9080; }
    .ingredients { margin: 10px 0; padding-left: 20px; }
    .method { margin: 10px 0; padding-left: 20px; }
    .shopping-list { background: #EDF2F7; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .category { margin: 15px 0; }
    .category-name { font-weight: bold; color: #2D3748; }
    .tips { background: #FFF5E6; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; text-align: center; color: #718096; font-size: 14px; }
    ul { margin: 5px 0; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
  <h1>🥗 Your Personalized Meal Plan</h1>
  <p>Here's your custom meal plan designed for ${audience}. Save this email for easy reference!</p>
  
  ${plan.weekPlan.map(day => `
    <div class="day">
      <h3>${day.day}</h3>
      
      <div class="meal">
        <div class="meal-name">Breakfast: ${day.breakfast.name}</div>
        <p><strong>Prep time:</strong> ${day.breakfast.prepTime} | <strong>Cook time:</strong> ${day.breakfast.cookTime}</p>
        ${day.breakfast.nutritionInfo ? `<p><em>${day.breakfast.nutritionInfo.calories || ''} ${day.breakfast.nutritionInfo.protein || ''}</em></p>` : ''}
        <div class="ingredients">
          <strong>Ingredients:</strong>
          <ul>
            ${day.breakfast.ingredients.map(ing => `<li>${ing}</li>`).join('')}
          </ul>
        </div>
      </div>
      
      <div class="meal">
        <div class="meal-name">Lunch: ${day.lunch.name}</div>
        <p><strong>Prep time:</strong> ${day.lunch.prepTime} | <strong>Cook time:</strong> ${day.lunch.cookTime}</p>
        ${day.lunch.nutritionInfo ? `<p><em>${day.lunch.nutritionInfo.calories || ''} ${day.lunch.nutritionInfo.protein || ''}</em></p>` : ''}
      </div>
      
      <div class="meal">
        <div class="meal-name">Dinner: ${day.dinner.name}</div>
        <p><strong>Prep time:</strong> ${day.dinner.prepTime} | <strong>Cook time:</strong> ${day.dinner.cookTime}</p>
        ${day.dinner.nutritionInfo ? `<p><em>${day.dinner.nutritionInfo.calories || ''} ${day.dinner.nutritionInfo.protein || ''}</em></p>` : ''}
      </div>
      
      ${day.snacks.length > 0 ? `
        <div class="meal">
          <strong>Snacks:</strong> ${day.snacks.join(', ')}
        </div>
      ` : ''}
    </div>
  `).join('')}
  
  <div class="shopping-list">
    <h2>🛒 Shopping List</h2>
    <p><strong>Estimated Cost:</strong> £${plan.estimatedCost.min} - £${plan.estimatedCost.max}</p>
    ${plan.shoppingList.map(category => `
      <div class="category">
        <div class="category-name">${category.category}</div>
        <ul>
          ${category.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `).join('')}
  </div>
  
  ${plan.tips && plan.tips.length > 0 ? `
    <div class="tips">
      <h3>💡 Helpful Tips</h3>
      <ul>
        ${plan.tips.map(tip => `<li>${tip}</li>`).join('')}
      </ul>
    </div>
  ` : ''}
  
  <div class="footer">
    <p><strong>Parent Helper Wellness</strong></p>
    <p>This plan was generated based on your preferences. Consult your GP before making significant dietary changes.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://parenthelper.co.uk'}/wellness">Create another plan</a></p>
  </div>
</body>
</html>
  `;

  const text = `
Your Personalized Meal Plan - ${audience}

${plan.weekPlan.map(day => `
${day.day}
---------
Breakfast: ${day.breakfast.name} (${day.breakfast.prepTime}, ${day.breakfast.cookTime})
Lunch: ${day.lunch.name} (${day.lunch.prepTime}, ${day.lunch.cookTime})
Dinner: ${day.dinner.name} (${day.dinner.prepTime}, ${day.dinner.cookTime})
${day.snacks.length > 0 ? `Snacks: ${day.snacks.join(', ')}` : ''}
`).join('\n')}

Shopping List (£${plan.estimatedCost.min} - £${plan.estimatedCost.max})
${plan.shoppingList.map(cat => `
${cat.category}:
${cat.items.map(item => `- ${item}`).join('\n')}
`).join('\n')}

${plan.tips && plan.tips.length > 0 ? `
Tips:
${plan.tips.map(tip => `- ${tip}`).join('\n')}
` : ''}

---
Parent Helper Wellness
Visit: ${process.env.NEXT_PUBLIC_APP_URL || 'https://parenthelper.co.uk'}/wellness
  `.trim();

  return { subject, html, text };
}

/**
 * Generate HTML email for exercise plan
 */
export function getExercisePlanEmailTemplate(plan: ExercisePlan, audience: string) {
  const subject = `Your Personalized Exercise Plan - Parent Helper Wellness`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Exercise Plan</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2D3748; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #6B9080; font-size: 28px; margin-bottom: 10px; }
    h2 { color: #6B9080; font-size: 22px; margin-top: 30px; }
    h3 { color: #2D3748; font-size: 18px; margin-top: 20px; }
    .session { background: #F7FAFC; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #6B9080; }
    .exercise { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
    .exercise-name { font-weight: bold; color: #6B9080; }
    .tips { background: #FFF5E6; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0; }
    .safety { background: #FEE2E2; padding: 15px; border-radius: 8px; border-left: 4px solid #EF4444; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; text-align: center; color: #718096; font-size: 14px; }
    ul { margin: 5px 0; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
  <h1>💪 Your Personalized Exercise Plan</h1>
  <p>Here's your custom workout plan designed for ${audience}. Save this email for easy reference!</p>
  
  ${plan.weekPlan.map(session => `
    <div class="session">
      <h3>${session.day} - ${session.focus}</h3>
      <p><strong>Estimated time:</strong> ${session.estimatedTime}</p>
      
      ${session.warmup.length > 0 ? `
        <h4>Warmup</h4>
        ${session.warmup.map(ex => `
          <div class="exercise">
            <div class="exercise-name">${ex.name}</div>
            <p>${ex.duration || ex.reps || ''}</p>
            <p><em>${ex.description}</em></p>
          </div>
        `).join('')}
      ` : ''}
      
      <h4>Main Workout</h4>
      ${session.mainWorkout.map(ex => `
        <div class="exercise">
          <div class="exercise-name">${ex.name}</div>
          <p>${ex.sets ? `${ex.sets} sets × ` : ''}${ex.reps || ex.duration || ''}</p>
          <p><em>${ex.description}</em></p>
          ${ex.formTips && ex.formTips.length > 0 ? `
            <p><strong>Form tips:</strong></p>
            <ul>
              ${ex.formTips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
      
      ${session.cooldown.length > 0 ? `
        <h4>Cooldown</h4>
        ${session.cooldown.map(ex => `
          <div class="exercise">
            <div class="exercise-name">${ex.name}</div>
            <p>${ex.duration || ''}</p>
          </div>
        `).join('')}
      ` : ''}
      
      ${session.notes && session.notes.length > 0 ? `
        <p><strong>Notes:</strong></p>
        <ul>
          ${session.notes.map(note => `<li>${note}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `).join('')}
  
  ${plan.progressionTips.length > 0 ? `
    <div class="tips">
      <h3>📈 Progression Tips</h3>
      <ul>
        ${plan.progressionTips.map(tip => `<li>${tip}</li>`).join('')}
      </ul>
    </div>
  ` : ''}
  
  ${plan.safetyReminders.length > 0 ? `
    <div class="safety">
      <h3>⚠️ Safety Reminders</h3>
      <ul>
        ${plan.safetyReminders.map(reminder => `<li>${reminder}</li>`).join('')}
      </ul>
    </div>
  ` : ''}
  
  <div class="footer">
    <p><strong>Parent Helper Wellness</strong></p>
    <p>This plan was generated based on your preferences. Consult your GP before starting a new exercise program.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://parenthelper.co.uk'}/wellness">Create another plan</a></p>
  </div>
</body>
</html>
  `;

  const text = `
Your Personalized Exercise Plan - ${audience}

${plan.weekPlan.map(session => `
${session.day} - ${session.focus}
Time: ${session.estimatedTime}
---------
${session.mainWorkout.map(ex => `
${ex.name}
${ex.sets ? `${ex.sets} sets × ` : ''}${ex.reps || ex.duration || ''}
${ex.description}
`).join('\n')}
`).join('\n')}

Progression Tips:
${plan.progressionTips.map(tip => `- ${tip}`).join('\n')}

Safety Reminders:
${plan.safetyReminders.map(reminder => `- ${reminder}`).join('\n')}

---
Parent Helper Wellness
Visit: ${process.env.NEXT_PUBLIC_APP_URL || 'https://parenthelper.co.uk'}/wellness
  `.trim();

  return { subject, html, text };
}

/**
 * Generate HTML email for supplement recommendations
 */
export function getSupplementEmailTemplate(result: SupplementResult, audience: string) {
  const subject = `Your Personalized Supplement Guide - Parent Helper Wellness`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Supplement Guide</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2D3748; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #6B9080; font-size: 28px; margin-bottom: 10px; }
    h2 { color: #6B9080; font-size: 22px; margin-top: 30px; }
    .supplement { background: #F7FAFC; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #6B9080; }
    .supplement-name { font-weight: bold; color: #6B9080; font-size: 18px; }
    .warning { background: #FEE2E2; padding: 10px; border-radius: 4px; margin: 10px 0; color: #991B1B; }
    .disclaimer { background: #FFF5E6; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; text-align: center; color: #718096; font-size: 14px; }
    ul { margin: 5px 0; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
  <h1>💊 Your Personalized Supplement Guide</h1>
  <p>Here are supplement recommendations based on your health goals and needs (${audience}).</p>
  
  <div class="disclaimer">
    <strong>⚕️ Important:</strong> ${result.disclaimer}
  </div>
  
  <h2>Recommendations</h2>
  ${result.suggestions.map(supp => `
    <div class="supplement">
      <div class="supplement-name">${supp.name}</div>
      <p><strong>Why:</strong> ${supp.reason}</p>
      <p><strong>Dosage:</strong> ${supp.dosageGuidance}</p>
      
      ${supp.qualityMarkers.length > 0 ? `
        <p><strong>Quality markers to look for:</strong></p>
        <ul>
          ${supp.qualityMarkers.map(marker => `<li>${marker}</li>`).join('')}
        </ul>
      ` : ''}
      
      ${supp.ukBrands.length > 0 ? `
        <p><strong>UK brands to consider:</strong> ${supp.ukBrands.join(', ')}</p>
      ` : ''}
      
      ${supp.bestTakenWith ? `
        <p><strong>Best taken with:</strong> ${supp.bestTakenWith}</p>
      ` : ''}
      
      ${supp.warnings.length > 0 ? `
        <div class="warning">
          <strong>⚠️ Warnings:</strong>
          <ul>
            ${supp.warnings.map(warning => `<li>${warning}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('')}
  
  ${result.generalAdvice.length > 0 ? `
    <h2>General Advice</h2>
    <ul>
      ${result.generalAdvice.map(advice => `<li>${advice}</li>`).join('')}
    </ul>
  ` : ''}
  
  <div class="disclaimer">
    <p><strong>${result.consultationReminder}</strong></p>
  </div>
  
  <div class="footer">
    <p><strong>Parent Helper Wellness</strong></p>
    <p>This guide was generated based on your preferences. Always consult healthcare professionals.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://parenthelper.co.uk'}/wellness">Create another plan</a></p>
  </div>
</body>
</html>
  `;

  const text = `
Your Personalized Supplement Guide - ${audience}

IMPORTANT: ${result.disclaimer}

Recommendations:
${result.suggestions.map(supp => `
${supp.name}
Why: ${supp.reason}
Dosage: ${supp.dosageGuidance}
${supp.ukBrands.length > 0 ? `UK brands: ${supp.ukBrands.join(', ')}` : ''}
${supp.warnings.length > 0 ? `Warnings: ${supp.warnings.join('; ')}` : ''}
`).join('\n')}

General Advice:
${result.generalAdvice.map(advice => `- ${advice}`).join('\n')}

${result.consultationReminder}

---
Parent Helper Wellness
Visit: ${process.env.NEXT_PUBLIC_APP_URL || 'https://parenthelper.co.uk'}/wellness
  `.trim();

  return { subject, html, text };
}
