# Legacy Scripts

This directory contains one-off historical scripts and scrapers used during the initial development and data population phases of the project.

## Status
These scripts are **DEPRECATED** and are not part of the active product. They are preserved here for reference purposes only.

### Important Notes
- **NOT** imported by any application code (`app/`, `lib/`, `components/`)
- **NOT** referenced in `package.json` scripts
- **NOT** required for production deployment
- Historical only - used for one-time data population and testing

## Safe to Delete After
These scripts can be safely deleted after **March 2026** if not needed for historical reference.

## Contents

### Mock Data (Superseded)
- `mock-classes.js` - Mock class data (superseded by real Supabase data)

### Web Scrapers (One-time Use)
All scrapers were used for initial data population and are no longer needed:
- `*-pricing-scraper.js` - Various pricing data collection scripts
- `*-scheduling-scraper.js` - Schedule/timetable collection scripts  
- `*-baby-sensory-scraper.js` - Baby Sensory franchise location scrapers
- `*-water-babies-scraper.js` - Water Babies franchise location scrapers
- `*-expansion.js` - Geographic expansion scripts for new cities
- `franchise-scraper-system.js` - Generic franchise scraping framework

### Import Scripts (One-time Use)
- `import-classes.js` - Class data import utilities
- `import-outscraper.js` - Outscraper data import helpers

### Why These Are Preserved
- Historical record of data sources
- Reference for understanding data provenance
- Potential future adaptation if similar data collection needed
- Audit trail for initial data population

## Active Scripts
The following scripts in the project root **ARE** still in active use:
- `add-missing-andover-businesses.js` - Active business data maintenance
- `scripts/debug-error.js` - Active debugging utility

Any other scripts in the project root may also be active - check `package.json` before removing.

