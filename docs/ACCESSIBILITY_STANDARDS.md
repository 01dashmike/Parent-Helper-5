# Accessibility Standards

This document captures our current accessibility patterns and conventions to ensure consistency across the codebase.

## Focus Rings

### Pattern
We use a consistent focus ring pattern for all interactive elements:

```tsx
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2
```

### Details
- **Ring width**: `2px` (`ring-2`)
- **Ring color**: Sage with 50% opacity (`ring-sage/50`)
- **Ring offset**: `2px` (`ring-offset-2`)
- **Only on keyboard focus**: Use `focus-visible:` (not `focus:`) to avoid showing rings on mouse clicks

### Examples
- Buttons: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2`
- Links: Same pattern
- Form inputs: May use `focus:ring-2 focus:ring-sage/50` for immediate feedback

### Mobile Considerations
- Touch targets should be minimum `44x44px` (we use `min-h-11 min-w-11` which is 44px)
- On desktop, we reduce to normal sizes: `md:min-h-0 md:min-w-0`

## Aria-Live and Role Usage

### Loading States
Use `role="status"` with `aria-live="polite"` for loading indicators:

```tsx
<div role="status" aria-live="polite" aria-label="Loading">
  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
  <span>Loading...</span>
</div>
```

### Error Messages
Use `aria-live="assertive"` for critical errors that need immediate attention:

```tsx
<div className="sr-only" aria-live="assertive" aria-atomic="true">
  {errorMessage}
</div>
```

Or inline with visible error:

```tsx
<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
  <AlertCircle className="h-4 w-4 shrink-0" role="img" aria-label="Error" />
  <p className="text-sm">{error}</p>
</div>
```

### Toast Notifications
Toasts use `role="status"` with `aria-live="polite"`:

```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {/* Toast content */}
</div>
```

The toast close button should have a descriptive label:
```tsx
<button aria-label="Close notification">
  <X className="h-4 w-4" aria-hidden="true" />
</button>
```

## Icon-Only Buttons

### Decorative Icons
Icons that are purely visual (next to text labels) should be hidden from screen readers:

```tsx
<button aria-label="Share referral link">
  <Share2 className="h-4 w-4" aria-hidden="true" />
</button>
```

### Meaningful Icons
Icons that convey meaning (standalone, no text) should have descriptive labels:

```tsx
<AlertCircle className="h-5 w-5 text-red-600" role="img" aria-label="Error" />
```

### Generic Labels to Avoid
❌ **Don't use**: `aria-label="icon"`, `aria-label="button"`, `aria-label="close"`, `aria-label="open"`, `aria-label="menu"`

✅ **Do use**: `aria-label="Close partner editor drawer"`, `aria-label="Open mobile navigation menu"`, `aria-label="Save changes"`

## Modals and Dialogs

### Required Attributes
All modals must include:

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title-id"
  onClick={(e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }}
>
  <div ref={modalRef} onClick={(e) => e.stopPropagation()}>
    <h2 id="modal-title-id">Modal Title</h2>
    {/* Content */}
  </div>
</div>
```

### Focus Management
1. **Focus trap**: Use `useFocusTrap(true, modalRef)` to trap focus within the modal
2. **Initial focus**: Focus should move to the first focusable element when modal opens
3. **Return focus**: Restore focus to the trigger element when modal closes
4. **Escape key**: Handle `Escape` key to close modal

### Example Implementation
```tsx
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

const modalRef = useRef<HTMLDivElement>(null);
const previousActiveElementRef = useRef<HTMLElement | null>(null);

// Store focus before opening
useEffect(() => {
  if (modalRef.current) {
    previousActiveElementRef.current = document.activeElement as HTMLElement;
  }
  return () => {
    // Restore focus when closing
    if (previousActiveElementRef.current) {
      setTimeout(() => {
        previousActiveElementRef.current?.focus();
      }, 100);
    }
  };
}, []);

// Focus trap
useFocusTrap(true, modalRef);

// Escape key handler
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };
  document.addEventListener("keydown", handleEscape);
  return () => {
    document.removeEventListener("keydown", handleEscape);
  };
}, [onClose]);
```

### Close Button
Modal close buttons should have descriptive labels:

```tsx
<button
  onClick={onClose}
  className="min-h-11 min-w-11 flex items-center justify-center rounded-full p-1 text-slateSoft transition hover:bg-cream md:min-h-0 md:min-w-0"
  aria-label="Close add funds modal"
>
  <X className="h-5 w-5" aria-hidden="true" />
</button>
```

## Color Contrast

### Primary Colors
- **Sage** (`#a3b18a`): Used for primary actions, focus rings, and accents
- **Charcoal** (`#2d3436`): Primary text color
- **Cream** (`#f5f5dc`): Background color
- **SlateSoft** (`#636e72`): Secondary text color

### Contrast Requirements
- **Text on sage**: Ensure sufficient contrast (sage + white text meets WCAG AA)
- **Text on cream**: Charcoal text on cream background meets contrast requirements
- **Focus rings**: Sage at 50% opacity (`sage/50`) provides visible focus indication

### Notes
- Sage + cream combinations: Test contrast ratios, especially for text
- Use `text-charcoal` for primary text on light backgrounds
- Use `text-slateSoft` for secondary/disabled text
- Error states use red (`text-red-600`, `bg-red-50`) which meets contrast requirements

### Testing
- Use browser DevTools or tools like WebAIM Contrast Checker
- Ensure all text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)

## Touch Targets

### Minimum Size
- **Mobile**: Minimum `44x44px` (`min-h-11 min-w-11`)
- **Desktop**: Can be smaller (`md:min-h-0 md:min-w-0`)

### Example
```tsx
<button className="min-h-11 min-w-11 flex items-center justify-center rounded-full p-1 md:min-h-0 md:min-w-0">
  <X className="h-5 w-5" aria-hidden="true" />
</button>
```

## Additional Patterns

### Skip Links
For keyboard navigation, provide skip links for main content:

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50">
  Skip to main content
</a>
```

### Screen Reader Only Text
Use `.sr-only` class for visually hidden but accessible text:

```tsx
<span className="sr-only">Loading search results</span>
```

### Form Labels
Always associate labels with inputs:

```tsx
<label htmlFor="email-input" className="block text-sm font-medium">
  Email
</label>
<input id="email-input" type="email" />
```

Or use `aria-label` for icon-only inputs:

```tsx
<input
  type="search"
  aria-label="Search for classes"
  placeholder="Search..."
/>
```

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

