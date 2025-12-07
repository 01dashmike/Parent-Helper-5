# Admin Documentation Hub

A secure, centralized documentation hub for Parent Helper administrators at `/admin/docs`.

## Overview

The Admin Documentation Hub aggregates content and developer resources from across the repository, providing a single place to access:

- Marketing copy (newsletters, landing pages, TikTok scripts)
- SEND resources
- Blog automation templates
- System health reports
- Provider analytics documentation
- Database schema explorer
- Test suite reports
- Self-heal logs
- Route tree viewer
- AI prompt library
- TODO/Roadmap explorer

## Access

The hub is restricted to admin users only. Access requires:

1. **Admin Secret Cookie**: Set `ph_admin` cookie with value matching `ADMIN_SECRET` environment variable
2. **Route Protection**: All routes are protected server-side

### Setting Admin Access

```bash
# Set ADMIN_SECRET in your .env file
ADMIN_SECRET=your-secret-here
```

Then visit `/admin/docs` - the system will check for the admin cookie.

## Features

### 1. Newsletter Templates

Displays all markdown files from `marketing/newsletter/`:
- Landing page variants
- Signup confirmation emails
- Weekly intro emails
- Banner copy

**Location**: `marketing/newsletter/*.md`

### 2. TikTok / Social Scripts

Shows social media content scripts:
- TikTok/Reels scripts
- Content calendars
- Hashtag suggestions

**Location**: `content/tiktok-reels-scripts.md`

### 3. SEND Resources

Displays SEND (Special Educational Needs and Disabilities) resources:
- Categories and links
- Tags and descriptions
- Support information

**Location**: `marketing/send/resources.json`

### 4. Blog Automation Templates

Shows blog post generation prompts and templates:
- AI prompts for blog generation
- Content templates
- Sample outputs

**Location**: `scripts/blog/*.md`

### 5. System Health Reports

Displays Next.js health check status:
- System health (healthy/warning/broken)
- Health check details
- Status messages

**Source**: `scripts/check-next-health.mjs`

### 6. Self-Heal Logs

Shows recent self-heal script executions:
- Last 5 runs
- Timestamps
- Status messages
- Execution results

**Source**: `.next/self-heal.log`

### 7. Database Schema Explorer

Visual explorer for database schema:
- All tables from migrations
- Columns with types
- Indexes
- RLS policies

**Source**: `supabase/migrations/*.sql`

### 8. Provider Analytics Documentation

Documentation for provider analytics:
- Metrics definitions
- Growth score calculation
- AI recommendation engine
- Weekly email logic

### 9. Test Suite Reports

Displays test results:
- Jest (unit tests): Passed, failed, duration
- Playwright (E2E tests): Passed, failed, duration
- Quick links to rerun tests

**Sources**: 
- `jest-results.json`
- `playwright-report/data.json`

### 10. Route Tree Viewer

Visual map of all app routes:
- Pages, layouts, API routes
- Client vs Server components
- Search and filter functionality
- Direct links to routes

**Source**: Scans `app/` directory

### 11. AI Prompt Library

Stored prompts for Cursor/Composer:
- All prompts from `prompts/` directory
- Markdown rendering
- "Send to Composer" button (copies to clipboard)
- Recent versions with diff view

**Location**: `prompts/*.md`

### 12. Roadmap / TODO Explorer

Extracts all TODO, FIXME, and NOTE comments:
- Grouped by file
- Filter by type and priority
- Search functionality
- Line numbers

**Source**: Scans all `.ts`, `.tsx`, `.js`, `.jsx` files

## Components

All components are located in `components/admin/docs/`:

- `DocsSection.tsx` - Section wrapper with title and description
- `DocsMarkdownView.tsx` - Markdown renderer with syntax highlighting
- `DocsFileList.tsx` - File browser with preview
- `DocsHealthBlock.tsx` - Health status display
- `DocsSchemaView.tsx` - Database schema explorer
- `DocsTestReport.tsx` - Test results display
- `DocsRouteTree.tsx` - Route tree viewer
- `DocsPromptLibrary.tsx` - Prompt library browser
- `DocsTodoExplorer.tsx` - TODO explorer
- `DocsNavigation.tsx` - Sidebar navigation
- `DocsSearch.tsx` - Search functionality

## Utilities

File reading utilities in `lib/docs/readFiles.ts`:

- `readMarkdownFiles(dir)` - Recursively read all `.md` files
- `readJSONFile(path)` - Read and parse JSON files
- `readDirectoryRecursively(dir)` - Get all files in directory
- `getRouteTree(appDir)` - Build route tree from app directory
- `getTestReports()` - Get Jest and Playwright results
- `getHealthStatus()` - Get system health status
- `getTodos()` - Extract TODOs from codebase
- `getSelfHealLogs(limit)` - Get recent self-heal logs

## Security

### Server-Side Only

All file access happens server-side only:
- No file paths exposed to client
- All file reading in Server Components
- Client components only receive processed data

### Authentication

- Admin cookie check on every request
- Redirects to `/admin/login` if not authenticated
- Uses same auth pattern as `/admin/blogs` and `/admin/insights`

### File Access

- Only reads from allowed directories
- Excludes `node_modules`, `.next`, `.git`
- Safe error handling for missing files

## Usage

### For Administrators

1. **Access the Hub**: Navigate to `/admin/docs`
2. **Navigate Sections**: Use sidebar to jump to sections
3. **Search**: Use search bar to find specific content
4. **View Files**: Click files in file lists to view content
5. **Copy Prompts**: Use "Send to Composer" button to copy prompts

### For Developers

**Adding New Sections**:

1. Add section to `sections` array in `app/admin/docs/page.tsx`
2. Create data fetching logic
3. Add component to render section
4. Update navigation

**Adding File Types**:

1. Update `readFiles.ts` utilities
2. Add file reading logic
3. Create display component
4. Add to main page

## Testing

### Unit Tests

```bash
npm run test:unit tests/unit/docs/readFiles.test.ts
```

Tests cover:
- File reading utilities
- Markdown parsing
- TODO extraction
- Error handling

### E2E Tests

```bash
npm run test:e2e tests/e2e/admin-docs.spec.ts
```

Tests verify:
- Admin authentication
- Section rendering
- Navigation functionality
- Mobile responsiveness

## Troubleshooting

**No files showing**:
- Check that files exist in expected directories
- Verify file permissions
- Check server logs for errors

**Health status not updating**:
- Ensure `scripts/check-next-health.mjs` exists
- Check script execution permissions
- Review health check output

**Route tree empty**:
- Verify `app/` directory structure
- Check file extensions (`.tsx`, `.ts`)
- Review route parsing logic

**TODOs not appearing**:
- Check file extensions are included
- Verify comment format: `// TODO: message`
- Check excluded directories

## Future Enhancements

- [ ] Real-time updates via WebSocket
- [ ] Export functionality (PDF, Markdown)
- [ ] Version history for prompts
- [ ] Advanced search with filters
- [ ] Dark mode support
- [ ] Keyboard shortcuts
- [ ] Favorites/bookmarks
- [ ] Activity feed for changes
- [ ] Integration with GitHub issues
- [ ] Automated documentation generation

## Files Created

- `app/admin/docs/page.tsx` - Main docs page
- `lib/docs/readFiles.ts` - File reading utilities
- `components/admin/docs/*.tsx` - All documentation components
- `tests/unit/docs/readFiles.test.ts` - Unit tests
- `tests/e2e/admin-docs.spec.ts` - E2E tests
- `README_AdminDocs.md` - This documentation

## Notes

- All file paths are relative to `process.cwd()`
- Markdown rendering uses `react-markdown` with `remark-gfm`
- Schema extraction is basic - consider SQL parser for production
- Test reports require test runs to generate data
- Self-heal logs require self-heal script execution

