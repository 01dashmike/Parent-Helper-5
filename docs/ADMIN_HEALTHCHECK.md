# Admin Health Check Endpoint

## Overview

The `/api/admin/health` endpoint provides a simple health check for monitoring the application and database connectivity. It's designed for use with monitoring tools, uptime checkers, and alerting systems.

## Endpoint

```
GET /api/admin/health
```

## Authentication

**Required Header:**
```
ADMIN_SECRET: <your-admin-secret>
```

The endpoint requires the `ADMIN_SECRET` header to match the `ADMIN_SECRET` environment variable. This ensures only authorized monitoring systems can access the endpoint.

## Response Format

### Success (200 OK)
```json
{
  "ok": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "db": "ok"
}
```

### Database Failure (500 Internal Server Error)
```json
{
  "ok": false,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "db": "fail",
  "error": "Database connection error message"
}
```

### Unauthorized (401 Unauthorized)
```json
{
  "error": "Unauthorized"
}
```

## Database Check

The endpoint performs a simple database connectivity check by executing:
```sql
SELECT id FROM classes LIMIT 1
```

This query:
- Verifies database connectivity
- Checks that the `classes` table is accessible
- Is lightweight and fast (no data returned, just connectivity check)

## Usage in Monitoring

### Uptime Monitoring Services

#### UptimeRobot
1. Create a new monitor
2. Type: HTTP(s)
3. URL: `https://yourdomain.com/api/admin/health`
4. Headers: `ADMIN_SECRET: your-secret-value`
5. Expected Status: 200
6. Expected Response: `"ok":true`

#### Pingdom
1. Create HTTP(S) check
2. URL: `https://yourdomain.com/api/admin/health`
3. Custom Headers: `ADMIN_SECRET: your-secret-value`
4. Expected Response: `"db":"ok"`

#### StatusCake
1. Create new test
2. Test Type: HTTP
3. Website URL: `https://yourdomain.com/api/admin/health`
4. Custom Headers: `ADMIN_SECRET: your-secret-value`
5. Expected Status Code: 200

### cURL Example

```bash
curl -H "ADMIN_SECRET: your-secret-value" \
  https://yourdomain.com/api/admin/health
```

### Monitoring Script Example

```bash
#!/bin/bash
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "ADMIN_SECRET: ${ADMIN_SECRET}" \
  https://yourdomain.com/api/admin/health)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
  DB_STATUS=$(echo "$BODY" | jq -r '.db')
  if [ "$DB_STATUS" = "ok" ]; then
    echo "✅ Health check passed"
    exit 0
  else
    echo "❌ Database check failed: $BODY"
    exit 1
  fi
else
  echo "❌ Health check failed: HTTP $HTTP_CODE - $BODY"
  exit 1
fi
```

### Node.js Monitoring Example

```javascript
async function checkHealth() {
  const response = await fetch('https://yourdomain.com/api/admin/health', {
    headers: {
      'ADMIN_SECRET': process.env.ADMIN_SECRET,
    },
  });

  const data = await response.json();

  if (response.ok && data.ok && data.db === 'ok') {
    console.log('✅ Health check passed');
    return true;
  } else {
    console.error('❌ Health check failed:', data);
    return false;
  }
}

// Run every 60 seconds
setInterval(checkHealth, 60000);
```

## Alerting

### Recommended Alert Conditions

1. **HTTP Status != 200**: Application is down or misconfigured
2. **`db: "fail"`**: Database connectivity issue
3. **Response timeout**: Application is unresponsive
4. **401 Unauthorized**: ADMIN_SECRET misconfigured

### Alert Actions

- **Database Failure**: 
  - Check Supabase dashboard
  - Verify database connection pool
  - Check for connection limits
  
- **Application Down**:
  - Check application logs
  - Verify deployment status
  - Check server resources

## Security Considerations

1. **Keep ADMIN_SECRET Secure**: 
   - Never commit to version control
   - Use environment variables
   - Rotate periodically

2. **Rate Limiting**: 
   - Consider adding rate limiting if exposed publicly
   - Monitor for abuse

3. **IP Whitelisting** (Optional):
   - Restrict access to known monitoring service IPs
   - Use firewall rules if needed

## Environment Variables

Required:
- `ADMIN_SECRET`: Secret key for authentication
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

## Troubleshooting

### 401 Unauthorized
- Verify `ADMIN_SECRET` environment variable is set
- Check that header value matches exactly
- Ensure no extra whitespace in header value

### 500 with db: "fail"
- Check Supabase dashboard for service status
- Verify database connection pool isn't exhausted
- Check application logs for detailed error messages
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct

### Timeout
- Check application server status
- Verify network connectivity
- Check for firewall rules blocking requests

## Related Endpoints

- `/api/health` - Public health check (if exists)
- `/api/admin/*` - Other admin endpoints

## Changelog

- **2024-01-15**: Initial implementation
  - Basic health check with database connectivity test
  - ADMIN_SECRET authentication
  - Returns timestamp and db status

