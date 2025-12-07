/**
 * Card Components
 * 
 * Unified card system for consistent styling and accessibility across the application.
 * 
 * @example
 * ```tsx
 * import { CardContainer, CardHeader, CardBody, CardFooter } from '@/components/cards';
 * 
 * <CardContainer interactive ariaLabel="View details">
 *   <CardHeader>
 *     <h3>Title</h3>
 *   </CardHeader>
 *   <CardBody>
 *     <p>Content</p>
 *   </CardBody>
 *   <CardFooter withBorder>
 *     <button>Action</button>
 *   </CardFooter>
 * </CardContainer>
 * ```
 */

export { CardContainer } from "./CardContainer";
export type { CardContainerProps } from "./CardContainer";

export { CardHeader } from "./CardHeader";
export type { CardHeaderProps } from "./CardHeader";

export { CardBody } from "./CardBody";
export type { CardBodyProps } from "./CardBody";

export { CardFooter } from "./CardFooter";
export type { CardFooterProps } from "./CardFooter";

