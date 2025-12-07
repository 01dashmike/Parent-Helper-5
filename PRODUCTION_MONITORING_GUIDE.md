# Production Monitoring Guide

This guide outlines key metrics, SLOs, and alerts to watch in production to catch issues early.

## Key Metrics to Monitor

### 1. Search Usage & Errors

**Metrics to Track:**
- **Search request volume**: Total requests to `/api/search` per hour/day
- **Search success rate**: Percentage of successful (200) vs failed (500) responses
- **Search response time**: P50, P95, P99 latencies for `/api/search` endpoint
- **Search error rate**: Count of 500 errors, database connection failures
- **Cache hit rate**: Ratio of cache hits vs misses (check `x-cache` header)
- **Geospatial vs text search ratio**: Monitor which search path is used
- **Zero result searches**: Searches that return empty results (could indicate data issues)

**Logs to Watch:**
- `/api/search` endpoint errors (check for `console.error` with `[/api/search]` prefix)
- Supabase connection errors during search
- Geospatial query failures with fallback to text search
- Cache miss patterns (unexpected cache misses for common queries)

### 2. Bookings Started vs Completed

**Metrics to Track:**
- **Booking requests created**: Count of new `booking_requests` records per hour/day
- **Booking conversion rate**: `(confirmed_bookings / booking_requests) * 100`
- **Booking completion rate**: Bookings with `status = 'confirmed'` and `payment_status = 'paid'`
- **Payment intent creation success**: Successful Stripe Payment Intent creation
- **Payment intent confirmation rate**: Payment Intents that reach `succeeded` status
- **Booking abandonment**: Booking requests that expire without completion
- **Average time to confirmation**: Time from request creation to booking confirmation

**Key Funnels:**
1. Booking request created → Payment intent created → Payment succeeded → Booking confirmed
2. Track drop-off at each stage

**Logs to Watch:**
- Booking request creation failures
- Stripe Payment Intent creation errors
- Payment confirmation webhook errors
- Booking status transition failures (pending → confirmed)
- Errors when creating `bookings` records from `booking_requests`

### 3. Wallet Read Errors

**Metrics to Track:**
- **Wallet balance read success rate**: Successful responses from `/api/wallet/balance` and `/api/wallet/get`
- **Wallet read error rate**: 401 (unauthorized), 500 (server error) responses
- **Wallet query latency**: Response times for wallet balance queries
- **Missing wallet errors**: Frequency of wallet creation on-demand (indicates potential data issues)
- **Database query failures**: Errors when querying `user_wallets` or `wallet_accounts` tables

**Logs to Watch:**
- `[/api/wallet/get]` error logs (check for `console.error` with wallet prefix)
- `Error fetching wallet` messages
- `Error creating wallet` messages
- Supabase RLS (Row Level Security) errors preventing wallet access
- Database connection errors during wallet reads

### 4. Provider Dashboard Load Failures

**Metrics to Track:**
- **Dashboard page load success rate**: Successful loads of provider dashboard pages
- **Dashboard API endpoint success rate**: Any API endpoints used by provider dashboards
- **Provider authentication failures**: 401 errors on provider routes
- **Data fetch timeouts**: Slow queries loading provider data, bookings, analytics
- **Provider session validity**: Percentage of valid provider sessions

**Logs to Watch:**
- Provider dashboard page load errors
- Provider authentication failures
- Supabase query timeouts when loading provider data
- Errors loading provider metrics, bookings, or analytics data
- RLS policy violations preventing provider data access

### 5. Additional Critical Metrics

**Database Health:**
- Supabase connection pool exhaustion
- Query timeouts (> 10 seconds)
- Database connection errors
- RLS policy violations

**API Health:**
- Overall API error rate (all endpoints)
- Response time degradation
- 5xx error spikes
- Rate limiting hits

**External Dependencies:**
- Stripe API errors (payment processing)
- Supabase API errors
- Third-party API failures (geocoding, etc.)

## Suggested SLOs (Service Level Objectives)

### Search Functionality
- **SLO**: 95% of `/api/search` requests complete without error (5xx) within 2 seconds
  - **Error Budget**: Allow up to 5% of requests to fail or exceed 2s
  - **Measurement Window**: Rolling 30-day window

### Booking Flow
- **SLO**: 90% of booking requests that reach payment intent creation complete successfully
  - **Error Budget**: Up to 10% can fail after payment intent creation
  - **Measurement Window**: Rolling 7-day window
- **SLO**: 99% of booking confirmations process without error
  - **Error Budget**: Critical path, allow minimal failures
  - **Measurement Window**: Rolling 7-day window

### Wallet Operations
- **SLO**: 99% of wallet balance reads succeed within 500ms
  - **Error Budget**: Wallet reads are frequent and should be fast
  - **Measurement Window**: Rolling 30-day window

### Provider Dashboard
- **SLO**: 98% of provider dashboard page loads succeed within 3 seconds
  - **Error Budget**: Providers need reliable access to their data
  - **Measurement Window**: Rolling 7-day window

### Overall Availability
- **SLO**: 99.5% uptime for all API endpoints
  - **Error Budget**: ~3.6 hours downtime per month
  - **Measurement Window**: Rolling 30-day window

## Simple Alert Ideas

### Critical Alerts (Immediate Response Required)

1. **Booking Confirmation Errors Spike**
   - **Trigger**: > 5 booking confirmation errors in 10 minutes
   - **Action**: 
     - Check Stripe webhook delivery status
     - Verify booking status update queries in database
     - Check for database connection issues
     - Review recent code deployments
   - **Check**: Stripe Dashboard → Webhooks, Database logs, Application logs

2. **Search API Completely Down**
   - **Trigger**: > 50% error rate on `/api/search` for 5 minutes
   - **Action**:
     - Check Supabase connection status
     - Verify database is accessible
     - Check for query timeout issues
     - Review geospatial query performance
   - **Check**: Supabase Dashboard, Database logs, Application error logs

3. **Payment Intent Creation Failures**
   - **Trigger**: > 10 failed Payment Intent creations in 15 minutes
   - **Action**:
     - Check Stripe API status
     - Verify Stripe API keys are valid
     - Check for rate limiting from Stripe
     - Review recent booking request data for anomalies
   - **Check**: Stripe Dashboard → API Logs, Application error logs

### Warning Alerts (Investigate Within 1 Hour)

4. **Wallet Read Errors Increasing**
   - **Trigger**: > 10% error rate on `/api/wallet/*` endpoints for 15 minutes
   - **Action**:
     - Check Supabase RLS policies for wallet tables
     - Verify database connection pool health
     - Check for missing wallet accounts (data integrity issue)
   - **Check**: Application error logs, Database query logs, RLS policy status

5. **Provider Dashboard Load Failures**
   - **Trigger**: > 20% error rate on provider dashboard pages for 10 minutes
   - **Action**:
     - Check provider authentication flow
     - Verify Supabase queries for provider data
     - Check for RLS policy issues
     - Review recent changes to provider routes
   - **Check**: Provider dashboard error logs, Authentication logs, Database logs

6. **Search Response Time Degradation**
   - **Trigger**: P95 latency > 5 seconds for `/api/search` for 30 minutes
   - **Action**:
     - Check database query performance
     - Verify geospatial index health
     - Review cache hit rates
     - Check for slow Supabase queries
   - **Check**: Database slow query logs, Cache metrics, Application performance logs

7. **Booking Conversion Rate Drop**
   - **Trigger**: Booking conversion rate drops below 50% (vs 7-day average) for 2 hours
   - **Action**:
     - Check payment flow for issues
     - Verify Stripe webhook delivery
     - Review booking request data for anomalies
     - Check for UI/UX issues preventing completion
   - **Check**: Booking funnel metrics, Stripe webhook logs, User session recordings (if available)

8. **Cache Hit Rate Drop**
   - **Trigger**: Cache hit rate < 50% for `/api/search` for 1 hour (if normally > 70%)
   - **Action**:
     - Check cache service health
     - Verify cache key generation logic
     - Review for unusual search patterns
   - **Check**: Cache service logs, Search query patterns

### Informational Alerts (Review Daily)

9. **Zero Result Searches Spike**
   - **Trigger**: > 30% of searches return zero results for 1 hour
   - **Action**: Review search query patterns, verify data coverage

10. **Booking Abandonment Rate Increase**
    - **Trigger**: > 60% booking abandonment (requests not completed) for 4 hours
    - **Action**: Review booking flow UX, check for technical blockers

11. **Database Connection Pool Pressure**
    - **Trigger**: Connection pool utilization > 80% for 30 minutes
    - **Action**: Review query patterns, consider pool size increase

12. **Supabase API Rate Limit Approaching**
    - **Trigger**: API rate limit usage > 80%
    - **Action**: Review API usage patterns, optimize queries

## Monitoring Implementation Notes

### What to Log

**Search Endpoints:**
- Request parameters (query, town, age filters)
- Response status codes
- Response times
- Cache hit/miss status
- Error messages with context

**Booking Flow:**
- Booking request creation with ID
- Payment intent creation status
- Payment confirmation events
- Booking status transitions
- Any errors with booking IDs for traceability

**Wallet Operations:**
- User ID (hashed for privacy)
- Wallet operation type (read, write)
- Success/failure status
- Error codes and messages

**Provider Dashboard:**
- Provider ID
- Dashboard page/endpoint accessed
- Load success/failure
- Data fetch times

### Log Aggregation

Ensure all logs include:
- Timestamp
- Request ID or trace ID for correlation
- User/Provider ID (where applicable, hashed for privacy)
- Error stack traces
- Contextual information (query parameters, booking IDs, etc.)

### Dashboards to Create

1. **Search Health Dashboard**
   - Request volume, error rate, response times
   - Cache hit rates
   - Search result distribution

2. **Booking Funnel Dashboard**
   - Requests → Payment Intents → Confirmed Bookings
   - Drop-off at each stage
   - Conversion rates over time

3. **System Health Dashboard**
   - API error rates by endpoint
   - Database connection health
   - External service status (Stripe, Supabase)

4. **Provider Dashboard Health**
   - Page load success rates
   - Average load times
   - Authentication success rates

## Escalation Path

1. **Immediate (P0)**: Booking confirmations failing, payment processing down, complete API outage
   - On-call engineer responds within 15 minutes

2. **High Priority (P1)**: Search errors, wallet read failures, provider dashboard issues
   - Investigate within 1 hour

3. **Medium Priority (P2)**: Performance degradation, increased error rates
   - Review within 4 hours

4. **Low Priority (P3)**: Informational alerts, trends
   - Review during business hours

