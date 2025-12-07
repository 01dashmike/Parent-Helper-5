# AI Tools - Technical Documentation

## 🏗️ Architecture

### Data Flow

```
Provider UI Component
    ↓
Server Action (app/provider/ai-actions.ts)
    ↓
AI Tool Function (lib/ai/providerTools.ts)
    ↓
AI Client (lib/ai/client.ts)
    ↓
External AI API (OpenAI/OpenRouter/etc.)
    ↓
Response → Cache → Log → Return to UI
```

---

## 📊 Database Schema

### Tables

#### `ai_usage_events`
Tracks all AI API calls for metering and safety.

```sql
- id (bigserial)
- user_id (uuid, nullable)
- provider_id (integer, nullable)
- tool_type (text) -- enum: class_copy, schedule, seo, etc.
- input_tokens (integer, nullable)
- output_tokens (integer, nullable)
- prompt_hash (text, nullable)
- created_at (timestamp)
```

**Indexes:**
- `user_id + created_at` (for user usage tracking)
- `provider_id + created_at` (for provider usage tracking)
- `tool_type + created_at` (for tool analytics)
- `prompt_hash` (for deduplication)

#### `ai_cached_suggestions`
Caches AI responses for quick regeneration.

```sql
- id (bigserial)
- user_id (uuid, nullable)
- provider_id (integer, nullable)
- context_type (text) -- enum: class, provider_profile, etc.
- context_id (integer, nullable)
- tool_type (text)
- input_fingerprint (text) -- hash of input
- output_json (jsonb)
- created_at (timestamp)
- last_used_at (timestamp)
```

**Indexes:**
- `provider_id` (for provider cache lookup)
- `context_type + context_id` (for context-based lookup)
- `input_fingerprint` (for exact match lookup)
- `last_used_at` (for cache cleanup)

---

## 🔌 AI Client Abstraction

### File: `lib/ai/client.ts`

**Purpose:** Unified interface for AI model calls

**Functions:**

#### `callAIModel(options)`
Calls the AI API with:
- System prompt
- User prompt
- Optional JSON schema for structured output
- Streaming support (future)

**Configuration:**
- `AI_PROVIDER` - Provider name (openai, openrouter, anthropic)
- `AI_MODEL` - Model name (default: gpt-4o-mini)
- `AI_PROVIDER_API_KEY` or `OPENAI_API_KEY` - API key
- `AI_BASE_URL` - Custom base URL (optional)
- `AI_MAX_TOKENS` - Max tokens (default: 2000)
- `AI_TEMPERATURE` - Temperature (default: 0.7)

#### `hashPrompt(prompt)`
Generates hash for prompt deduplication.

---

## 🛠️ Provider Tools

### File: `lib/ai/providerTools.ts`

**Functions:**

1. **`generateClassCopy(params)`**
   - Creates class copy from scratch
   - Returns: title, subtitle, description, bullets, safetyNotes

2. **`improveClassCopy(params)`**
   - Improves existing text
   - Returns: improved text, list of changes

3. **`generateScheduleSuggestions(params)`**
   - Suggests optimal schedules
   - Returns: schedule suggestions, price range

4. **`generateSeoSuggestions(params)`**
   - Optimizes for SEO
   - Returns: seoTitle, seoH1, metaDescription, cityHooks, suggestedTags, improvedDescription

5. **`generateReviewReply(params)`**
   - Generates review replies
   - Returns: reply text

6. **`generateParentEmailCopy(params)`**
   - Generates email/SMS copy
   - Returns: subjectLines, emailBody, smsVariant

7. **`generateInsightSummary(params)`**
   - Analyzes provider performance
   - Returns: summary, keyChanges, suggestions

8. **`generateOnboardingText(params)`**
   - Generates onboarding text
   - Returns: text

### Safety & Rate Limiting

**Rate Limiting:**
- `AI_DAILY_LIMIT_PER_PROVIDER` (default: 20)
- Enforced via `checkRateLimit()`
- Checks `ai_usage_events` for today's count

**Caching:**
- `getCachedSuggestion()` - Check cache before API call
- `cacheSuggestion()` - Store result for future use
- Uses `input_fingerprint` for exact match lookup

**Logging:**
- `logAIUsage()` - Logs all API calls
- Tracks tokens, prompt hash, tool type

---

## 🎯 Server Actions

### File: `app/provider/ai-actions.ts`

All actions:
1. Verify provider authentication
2. Parse and validate input (Zod)
3. Call appropriate AI tool function
4. Return structured result or error

**Actions:**
- `aiGenerateClassCopy(formData)`
- `aiImproveClassCopy(formData)`
- `aiGenerateScheduleSuggestions(formData)`
- `aiGenerateSeoSuggestions(formData)`
- `aiSuggestReviewReply(formData)`
- `aiGenerateParentEmailCopy(formData)`
- `aiExplainMyPerformance(formData)`
- `aiGenerateOnboardingText(formData)`

---

## 🎨 UI Components

### Location: `components/provider/ai/`

#### `ClassCopyAssistant.tsx`
- Tabs: Create, Improve, Change Tone
- Form inputs for context
- Result display with "Apply" buttons

#### `ScheduleSuggestionPanel.tsx`
- Form for age/category/city
- Schedule cards with "Apply" buttons
- Price range display (benchmark only)

#### `SeoAssistant.tsx`
- Shows current content
- SEO suggestions with character counts
- Before/after comparison
- Tag suggestions

#### `ReviewReplyAssistant.tsx`
- Review display
- Tone selector
- Reply textarea (editable)
- Copy/Apply buttons

#### `ParentCommsAssistant.tsx`
- Event type selector
- Tone selector
- Key points textarea
- Subject lines + email body + SMS variant

#### `InsightCoachPanel.tsx`
- Time range selector
- Performance summary
- Key changes
- Actionable suggestions (some blurred)

#### `OnboardingAiHelpers.tsx`
- Small inline button
- Generates text for specific wizard step
- Calls `onGenerated` callback

---

## 🔗 Integration Points

### Onboarding Wizard

**Step 2 (Business Basics):**
```tsx
<OnboardingAiHelpers
  step="tagline"
  existingData={{ businessName, category, city }}
  onGenerated={(text) => setTagline(text)}
/>
```

**Step 3 (Class Template):**
```tsx
<OnboardingAiHelpers
  step="description"
  existingData={{ ageRange, category, style }}
  onGenerated={(text) => setDescription(text)}
/>
```

**Step 4 (Media):**
```tsx
<OnboardingAiHelpers
  step="captions"
  existingData={{ category, ageRange }}
  onGenerated={(text) => setCaption(text)}
/>
```

### Provider Dashboard

```tsx
<InsightCoachPanel
  providerId={providerId}
  hasPremiumAnalytics={entitlements.premiumAnalytics}
/>
```

### Class Management Page

```tsx
<ClassCopyAssistant
  onApply={(data) => {
    // Update form fields
  }}
/>

<SeoAssistant
  currentTitle={class.title}
  currentDescription={class.description}
  category={class.category}
  city={class.town}
  ageRange={class.ageRange}
  onApply={(data) => {
    // Update SEO fields
  }}
/>

<ScheduleSuggestionPanel
  onApply={(suggestion) => {
    // Update schedule fields
  }}
/>
```

---

## 🔐 Security

### Authentication
- All server actions verify provider membership
- Uses `getProviderContext()` to get user + provider ID
- Returns `{ error: "Unauthorized" }` if not authenticated

### API Keys
- Never exposed to client
- Stored in environment variables
- Server-side only

### Input Validation
- All inputs validated with Zod schemas
- Prevents injection attacks
- Type-safe

### Rate Limiting
- Per-provider daily limit
- Prevents abuse
- Configurable via env var

---

## 🚀 Production Setup

### Environment Variables

```bash
# AI Provider Configuration
AI_PROVIDER=openai  # or openrouter, anthropic
AI_MODEL=gpt-4o-mini
AI_PROVIDER_API_KEY=sk-...
AI_BASE_URL=  # Optional, for custom endpoints
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7

# Rate Limiting
AI_DAILY_LIMIT_PER_PROVIDER=20
```

### Database Migration

```bash
# Apply migration
supabase migration up
# or
psql $DATABASE_URL -f supabase/migrations/20250222000400_ai_tools.sql
```

### Testing

1. **Test rate limiting:**
   - Make 20+ AI calls
   - Verify 21st call is blocked

2. **Test caching:**
   - Generate same suggestion twice
   - Verify second call uses cache

3. **Test safety:**
   - Try generating medical advice
   - Verify AI refuses politely

---

## 🔧 Customization

### Adding a New Tool

1. **Add tool type to enum:**
   - Update `ai_usage_events.tool_type` check constraint
   - Update `ai_cached_suggestions.tool_type` check constraint

2. **Create function in `lib/ai/providerTools.ts`:**
   ```typescript
   export async function generateNewTool(params: {...}) {
     // Implementation
   }
   ```

3. **Create server action:**
   ```typescript
   export async function aiGenerateNewTool(formData: FormData) {
     // Validation + call
   }
   ```

4. **Create UI component:**
   ```tsx
   export default function NewToolAssistant() {
     // UI implementation
   }
   ```

### Changing AI Provider

Update `lib/ai/client.ts`:
- Modify `callAIModel()` to support new provider
- Update environment variable handling
- Test API compatibility

### Adjusting Rate Limits

Set `AI_DAILY_LIMIT_PER_PROVIDER` environment variable.

---

## 📈 Monitoring

### Metrics to Track

1. **Usage:**
   - Calls per provider per day
   - Calls per tool type
   - Cache hit rate

2. **Performance:**
   - Average response time
   - Token usage
   - Error rate

3. **Business:**
   - Conversion to Premium Analytics
   - Tool popularity
   - User satisfaction

### Queries

```sql
-- Daily usage per provider
SELECT provider_id, COUNT(*) as calls
FROM ai_usage_events
WHERE created_at >= CURRENT_DATE
GROUP BY provider_id;

-- Cache hit rate
SELECT 
  COUNT(*) FILTER (WHERE cached) / COUNT(*)::float as hit_rate
FROM (
  SELECT 
    CASE WHEN EXISTS (
      SELECT 1 FROM ai_cached_suggestions 
      WHERE input_fingerprint = hash_prompt(...)
    ) THEN true ELSE false END as cached
  FROM ai_usage_events
) sub;
```

---

## 🐛 Troubleshooting

### Common Issues

1. **"AI_PROVIDER_API_KEY not set"**
   - Check environment variables
   - Ensure key is set in production

2. **Rate limit errors**
   - Check `ai_usage_events` table
   - Verify limit configuration
   - Consider increasing limit for Premium users

3. **Cache not working**
   - Check `input_fingerprint` generation
   - Verify cache lookup logic
   - Check database indexes

4. **Slow responses**
   - Check AI provider status
   - Monitor token usage
   - Consider caching more aggressively

---

## 📚 Related Files

- `lib/ai/client.ts` - AI client abstraction
- `lib/ai/providerTools.ts` - Tool functions
- `app/provider/ai-actions.ts` - Server actions
- `components/provider/ai/*` - UI components
- `shared/schema.ts` - Database schema
- `supabase/migrations/20250222000400_ai_tools.sql` - Migration





