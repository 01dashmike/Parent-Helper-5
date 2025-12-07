# How to Test Each Feature

## 1. Marketing Booster (SEO & Ads)

### Test SEO Score
```bash
curl -X POST http://localhost:3000/api/provider/seo-score \
  -H "Content-Type: application/json" \
  -d '{"providerId": 1, "forceRefresh": true}'
```

### Test Ads Advice
```bash
curl -X POST http://localhost:3000/api/provider/ads-advice \
  -H "Content-Type: application/json" \
  -d '{"providerId": 1, "platform": "meta"}'
```

### Test UI
1. Navigate to `/provider/marketing`
2. Click "Generate New Insights" on each card
3. Verify SEO score displays
4. Verify ad advice displays

---

## 2. Family Recommendations

### Test Recommendations API
```bash
# Requires authentication
curl -X GET http://localhost:3000/api/family/recommendations?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Profile API
```bash
# Create/update profile
curl -X POST http://localhost:3000/api/family/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "home_town": "London",
    "home_postcode": "SW1A 1AA",
    "interests": ["music", "swimming"]
  }'
```

### Test Children API
```bash
# Add child
curl -X POST http://localhost:3000/api/family/children \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "first_name": "Emma",
    "age_years": 2,
    "age_months": 6,
    "interests": ["music"]
  }'
```

---

## 3. Saved Searches & Alerts

### Test Saved Searches
```bash
# Create saved search
curl -X POST http://localhost:3000/api/member/saved-searches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "q=music&loc=london",
    "town": "London",
    "alertFrequency": "weekly"
  }'

# List searches
curl -X GET http://localhost:3000/api/member/saved-searches \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Alerts
```bash
curl -X POST http://localhost:3000/api/member/alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{}'
```

---

## 4. Provider Next Action

### Test Next Action API
```bash
curl -X POST http://localhost:3000/api/provider/next-action \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"providerId": 1}'
```

---

## 5. Parents Landing Page

### Test Page Load
1. Navigate to `/parents`
2. Verify all sections render
3. Test search form submission
4. Verify schema.org metadata in page source

### Run E2E Tests
```bash
npm run test:e2e tests/e2e/parents-page.spec.ts
```

---

## 6. Newsletter Signup

### Test Newsletter API
```bash
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Test UI
1. Navigate to `/parents`
2. Scroll to newsletter section
3. Enter email and submit
4. Verify success message

---

## 7. Weekly Email Cron

### Test Marketing Summary Cron
```bash
curl -X POST http://localhost:3000/api/cron/provider-marketing-summary \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Manual Testing Checklist

### Family Features
- [ ] Create family profile
- [ ] Add children
- [ ] Get recommendations
- [ ] Verify recommendations are cached
- [ ] Update child information
- [ ] Delete child

### Saved Searches
- [ ] Create saved search
- [ ] List saved searches
- [ ] Update saved search
- [ ] Delete saved search
- [ ] Trigger alerts check
- [ ] Verify alerts are sent

### Provider Features
- [ ] Calculate SEO score
- [ ] Generate ad advice
- [ ] Get next best action
- [ ] View marketing dashboard

### Parents Page
- [ ] Page loads correctly
- [ ] Search form works
- [ ] All sections display
- [ ] Links navigate correctly
- [ ] Newsletter signup works

---

## Database Verification

### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'family_profiles',
  'children',
  'saved_recommendations',
  'saved_searches',
  'provider_seo_score',
  'provider_ad_advice'
);
```

### Check Indexes
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN (
  'family_profiles',
  'children',
  'saved_searches'
);
```

---

## Build Health Check

```bash
# Run build
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Run linter
npm run lint

# Run tests
npm run test
```

---

## Performance Testing

### API Response Times
- SEO score calculation: < 2s
- Recommendations generation: < 3s
- Saved searches list: < 500ms
- Next action generation: < 2s

### Database Queries
- Verify indexes are used
- Check query execution plans
- Monitor slow queries

