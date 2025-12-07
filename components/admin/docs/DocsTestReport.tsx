"use client";

interface TestResults {
  passed: number;
  failed: number;
  duration?: number;
}

interface DocsTestReportProps {
  jest: TestResults | null;
  playwright: TestResults | null;
}

export default function DocsTestReport({ jest, playwright }: DocsTestReportProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-small font-semibold text-charcoal">Jest (Unit Tests)</h3>
        {jest ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-small text-slateSoft">Passed</span>
              <span className="font-semibold text-green-600">{jest.passed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-small text-slateSoft">Failed</span>
              <span className="font-semibold text-red-600">{jest.failed}</span>
            </div>
            {jest.duration && (
              <div className="flex items-center justify-between">
                <span className="text-small text-slateSoft">Duration</span>
                <span className="text-small text-charcoal">{jest.duration}s</span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <a
                href="#/api/test/jest"
                target="_blank"
                rel="noopener noreferrer"
                className="text-small text-blue-600 hover:underline"
                aria-label="Run Jest tests (opens in new tab)"
              >
                Run Tests →
              </a>
            </div>
          </div>
        ) : (
          <div className="text-small text-slateSoft">No Jest results found</div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-small font-semibold text-charcoal">Playwright (E2E Tests)</h3>
        {playwright ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-small text-slateSoft">Passed</span>
              <span className="font-semibold text-green-600">{playwright.passed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-small text-slateSoft">Failed</span>
              <span className="font-semibold text-red-600">{playwright.failed}</span>
            </div>
            {playwright.duration && (
              <div className="flex items-center justify-between">
                <span className="text-small text-slateSoft">Duration</span>
                <span className="text-small text-charcoal">{playwright.duration}s</span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <a
                href="#/api/test/playwright"
                target="_blank"
                rel="noopener noreferrer"
                className="text-small text-blue-600 hover:underline"
                aria-label="Run Playwright tests (opens in new tab)"
              >
                Run Tests →
              </a>
            </div>
          </div>
        ) : (
          <div className="text-small text-slateSoft">No Playwright results found</div>
        )}
      </div>
    </div>
  );
}

