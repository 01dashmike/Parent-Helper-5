# Self-Healing Accessibility Framework

This framework automatically detects and fixes accessibility (a11y) issues across the Parent Helper application.

## Overview

The accessibility framework consists of:

1. **Core Audit Library** (`lib/a11y/audit.ts`) - Comprehensive TypeScript audit functions
2. **Auto-Fix Script** (`scripts/fix-a11y.mjs`) - Automatically fixes HTML files
3. **Dev Overlay** (`components/system/A11yOverlay.tsx`) - Runtime fixes in development
4. **ESLint Rules** - Static analysis during development
5. **Playwright Tests** - E2E accessibility testing with axe-core

## Features

### Automatic Fixes

The framework automatically fixes:

- ✅ Missing `alt` attributes on images
- ✅ Inputs without labels or `aria-label`
- ✅ Textareas without accessible names
- ✅ Buttons with icons but no text
- ✅ Links with icons but no text
- ✅ Missing `lang` attribute on `<html>`
- ✅ Heading order violations (detected, not auto-fixed)
- ✅ Duplicate IDs (detected, not auto-fixed)
- ✅ Missing form labels
- ✅ Interactive elements without proper roles

### Detection Only

These issues are detected but require manual fixes:

- ⚠️ Heading order violations
- ⚠️ Duplicate IDs
- ⚠️ Contrast ratio issues (use axe-core for accurate checks)
- ⚠️ Missing main landmark

## Usage

### Check Accessibility

```bash
npm run check:a11y
```

Runs Playwright tests with axe-core to check WCAG 2.1 AA compliance.

### Auto-Fix Issues

```bash
npm run fix:a11y
```

Scans HTML files in `.next/server/app`, `public`, and `app` directories and automatically fixes common issues. Results are logged to `tests/reports/a11y-fixes.log`.

### Self-Healing Workflow

```bash
npm run heal:a11y
```

Runs accessibility tests, and if they fail, automatically attempts to fix issues.

### Development Mode

In development, the `A11yOverlay` component automatically fixes issues at runtime and logs warnings to the console. This helps catch issues during development.

## Configuration

### ESLint

Accessibility rules are enabled via `eslint-plugin-jsx-a11y` in `.eslintrc.cjs`:

```json
{
  "extends": [
    "plugin:jsx-a11y/recommended"
  ]
}
```

### VSCode Settings

The `.vscode/settings.json` file includes:

- Auto-fix on save
- ESLint validation for JS/TS/TSX files
- File watcher exclusions for build directories

## Reports

All fixes are logged to `tests/reports/a11y-fixes.log` with:

- File path
- Number of issues fixed
- Detailed issue descriptions
- Applied fixes

## Integration

### Build Process

The framework can be integrated into the build process:

```json
{
  "scripts": {
    "prebuild": "npm run fix:a11y && npm run build:next"
  }
}
```

### CI/CD

Add to your CI pipeline:

```yaml
- name: Check Accessibility
  run: npm run check:a11y
```

## Testing

Accessibility tests are located in `tests/a11y/accessibility.spec.ts` and use:

- **axe-core** via `@axe-core/playwright`
- **WCAG 2.1 AA** compliance standards
- Tests for major pages and components

## Best Practices

1. **Fix at Source**: Use ESLint rules to catch issues during development
2. **Test Regularly**: Run `npm run check:a11y` before commits
3. **Review Logs**: Check `tests/reports/a11y-fixes.log` after auto-fixes
4. **Manual Review**: Some issues (like contrast) require manual verification
5. **Keep Updated**: Regularly update axe-core and jsx-a11y plugins

## Limitations

- Contrast checking requires axe-core (not implemented in audit.ts)
- Some fixes are heuristic-based and may need manual review
- HTML files must exist (run `npm run build` first)
- Source file checking is limited to first 50 files

## Future Enhancements

- [ ] Real contrast ratio calculation
- [ ] ARIA attribute validation
- [ ] Keyboard navigation testing
- [ ] Screen reader testing integration
- [ ] Automated WCAG AAA compliance checks

