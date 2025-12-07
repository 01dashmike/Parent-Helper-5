/**
 * Accessibility testing utilities using axe-core
 * 
 * This module provides a test harness for running accessibility checks
 * on React components and pages using @axe-core/react.
 */

import { ReactElement } from "react";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import type { AxeResults } from "axe-core";

/**
 * Options for accessibility testing
 */
export interface A11yTestOptions {
  /**
   * Skip certain rules (e.g., ["color-contrast"])
   */
  skipRules?: string[];
  /**
   * Include certain tags (e.g., ["wcag2a", "wcag2aa"])
   */
  tags?: string[];
  /**
   * Custom timeout for the test
   */
  timeout?: number;
}

/**
 * Test a React component for accessibility violations
 * 
 * @param component - The React component to test
 * @param options - Optional configuration for the accessibility test
 * @returns Promise that resolves when the test completes
 * 
 * @example
 * ```tsx
 * await testA11y(<Header />);
 * ```
 */
export async function testA11y(
  component: ReactElement,
  options: A11yTestOptions = {}
): Promise<void> {
  const { container } = render(component);
  const results = await axe(container, {
    rules: options.skipRules
      ? Object.fromEntries(options.skipRules.map((rule) => [rule, { enabled: false }]))
      : undefined,
    tags: options.tags,
  });

  expect(results).toHaveNoViolations();
}

/**
 * Test a React component for accessibility violations and return detailed results
 * 
 * @param component - The React component to test
 * @param options - Optional configuration for the accessibility test
 * @returns Promise that resolves with the axe results
 * 
 * @example
 * ```tsx
 * const results = await testA11yDetailed(<Header />);
 * console.log(results.violations);
 * ```
 */
export async function testA11yDetailed(
  component: ReactElement,
  options: A11yTestOptions = {}
): Promise<AxeResults> {
  const { container } = render(component);
  return await axe(container, {
    rules: options.skipRules
      ? Object.fromEntries(options.skipRules.map((rule) => [rule, { enabled: false }]))
      : undefined,
    tags: options.tags,
  });
}

/**
 * Test multiple components in a batch
 * 
 * @param components - Array of components to test
 * @param options - Optional configuration for the accessibility test
 * @returns Promise that resolves when all tests complete
 * 
 * @example
 * ```tsx
 * await testA11yBatch([
 *   <Header />,
 *   <Footer />,
 *   <SearchBar />
 * ]);
 * ```
 */
export async function testA11yBatch(
  components: ReactElement[],
  options: A11yTestOptions = {}
): Promise<void> {
  for (const component of components) {
    await testA11y(component, options);
  }
}

