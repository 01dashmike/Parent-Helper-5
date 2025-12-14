# AI Tools for Providers - Overview

## 🎯 Purpose

The AI Tools system helps class providers on Parent Helper:
- Write better listings
- Optimize for SEO
- Understand their analytics
- Communicate with parents
- Plan and improve their classes

---

## 🛠️ Available Tools

### 1. AI Class Copy Assistant

**Location:** Class management pages, Onboarding Wizard

**Features:**
- **Create from scratch**: Generate complete class descriptions based on age, category, style, city
- **Improve existing text**: Enhance current descriptions with better clarity and engagement
- **Change tone**: Adjust tone (calm, exciting, professional, friendly)

**Output:**
- Title
- Subtitle
- Description
- Bullet points
- Safety notes (age-appropriate, no medical advice)

---

### 2. AI Schedule & Pricing Suggestions

**Location:** Class management pages

**Features:**
- Suggests optimal days and times based on parent behavior patterns
- Recommends session length (30/45/60 minutes)
- Provides price range benchmarks (not financial advice)

**Output:**
- 3-5 schedule suggestions with reasoning
- Typical price range with context

---

### 3. AI SEO Optimiser

**Location:** Class management pages, SEO pages

**Features:**
- Generate SEO-optimized titles and H1s
- Create meta descriptions
- City/area-specific hooks
- Suggested tags/keywords
- Quick Fix: Before/after comparison

**Output:**
- SEO title (max 60 chars)
- SEO H1 (max 80 chars)
- Meta description (max 160 chars)
- City hooks
- Suggested tags
- Improved description (if current provided)

---

### 4. AI Review Reply Assistant

**Location:** Review management pages

**Features:**
- Generate polite, professional replies to reviews
- Multiple tones: Grateful, Neutral, Professional, Apologetic
- Safety checks: No medical/legal claims, encourages offline resolution

**Output:**
- Suggested reply text (editable)

---

### 5. AI Parent Communication Assistant

**Location:** Communications/announcements area

**Features:**
- Generate email copy for:
  - Class updates
  - Schedule changes
  - Term announcements
  - Holiday specials (Easter, Summer, Christmas, Half-term)
  - New class announcements

**Output:**
- 3 subject line options
- Email body
- SMS-friendly short version

---

### 6. AI Insight Coach

**Location:** Provider Dashboard

**Features:**
- Analyzes provider analytics (views, bookings, revenue, trends)
- Provides plain-language summaries
- Actionable suggestions with impact estimates
- Some insights gated behind Premium Analytics

**Output:**
- Performance summary
- Key changes/trends
- Actionable suggestions (some blurred for free users)

---

### 7. AI Content Blocks for Onboarding

**Location:** Onboarding Wizard steps

**Features:**
- Step 2: "Suggest a tagline"
- Step 3: "Generate a class description"
- Step 4: "Suggest captions for my photos"

**Output:**
- Generated text that populates form fields (editable)

---

## 🔒 Permissions & Safety

### Access Control
- Only authenticated providers can use AI tools
- Server-side validation ensures provider membership
- All AI calls run server-side (no client-side API keys)

### Safety Guidelines
AI tools are designed to:
- ✅ Use inclusive, body-positive language
- ✅ Avoid medical/health guarantees
- ✅ Never promise specific outcomes
- ✅ Encourage offline resolution for issues
- ✅ Stay family-friendly and appropriate

**What AI tools will NOT do:**
- ❌ Provide medical advice
- ❌ Make health guarantees
- ❌ Create legal claims
- ❌ Use discriminatory language
- ❌ Promise specific outcomes ("your child will definitely...")

---

## 💰 Pricing & Limits

### Free Tier
- **20 AI calls per day** per provider
- All tools available
- Some insights blurred (requires Premium Analytics)

### Premium Analytics
- Unlimited AI calls
- Full insight visibility
- Advanced analytics features

---

## 📍 Where Tools Appear

### Onboarding Wizard
- Step 2 (Business Basics): Tagline generator
- Step 3 (Class Template): Description generator
- Step 4 (Media): Caption suggestions

### Provider Dashboard
- Insight Coach panel (below hero metrics)
- Refresh insights button

### Class Management
- AI Assistant section with:
  - Class Copy Assistant
  - SEO Optimiser
  - Schedule Suggestions

### Review Management
- Review Reply Assistant for each review

### Communications
- Parent Communication Assistant for announcements

---

## 🚀 Getting Started

1. **Navigate to a class page** or **start onboarding**
2. **Look for AI assistant buttons** (sparkle icon ✨)
3. **Fill in context** (age, category, city, etc.)
4. **Click "Generate"**
5. **Review and apply** suggestions to your content

---

## 📊 Usage Tracking

All AI usage is tracked in `ai_usage_events` table for:
- Rate limiting
- Analytics
- Future monetisation
- Safety monitoring

---

## 🔄 Caching

AI suggestions are cached in `ai_cached_suggestions` for:
- Quick regeneration (no additional cost)
- Better UX (instant results for identical inputs)
- Reduced API costs

---

## 🆘 Troubleshooting

### "You've reached today's AI usage limit"
- Wait until tomorrow, or
- Upgrade to Premium Analytics for unlimited access

### "Failed to generate"
- Check your internet connection
- Try again in a moment
- Contact support if issue persists

### Suggestions not applying
- Make sure you're editing the correct field
- Check that the form is in edit mode
- Refresh the page if needed

---

## 📚 Related Documentation

- [AI Tools Technical Guide](./AI_TOOLS_TECHNICAL.md)
- [AI Tools QA Checklist](./AI_TOOLS_QA_CHECKLIST.md)
- [Monetisation Layer](./MONETISATION_LAYER_IMPLEMENTATION.md)








