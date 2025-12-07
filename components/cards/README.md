# Card Components System

Unified card component system for consistent styling and accessibility across the Parent Helper application.

## Components

### CardContainer
Main wrapper component that provides consistent styling for all cards.

**Features:**
- `rounded-2xl` border radius
- `shadow-soft` shadow
- `border border-charcoal/10` border
- Hover/focus states with `ring-sage/50`
- `role="group"` for interactive cards
- Accessible `aria-label` support

**Props:**
- `interactive?: boolean` - Whether the card is clickable
- `ariaLabel?: string` - Accessible label for interactive cards
- `selected?: boolean` - Whether the card is selected/highlighted
- `variant?: "default" | "elevated" | "outlined"` - Visual variant
- `bgVariant?: "white" | "cream"` - Background color
- `as?: ElementType` - Render as different element (e.g., motion.div, Link)

### CardHeader
Header section with consistent padding and optional border separator.

**Props:**
- `withBorder?: boolean` - Add bottom border separator

### CardBody
Main content section with configurable padding.

**Props:**
- `padding?: "none" | "sm" | "default" | "lg"` - Padding variant

### CardFooter
Footer section with consistent padding and optional border separator.

**Props:**
- `withBorder?: boolean` - Add top border separator

## Usage Examples

### Basic Card
```tsx
import { CardContainer, CardHeader, CardBody } from '@/components/cards';

<CardContainer>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardBody>
    <p>Card content</p>
  </CardBody>
</CardContainer>
```

### Interactive Card
```tsx
<CardContainer
  interactive
  ariaLabel="View class details"
  onClick={handleClick}
>
  <CardBody>
    <h3>Clickable Card</h3>
  </CardBody>
</CardContainer>
```

### Card with Motion
```tsx
import { motion } from 'framer-motion';

<CardContainer
  as={motion.div}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <CardBody>Animated card</CardBody>
</CardContainer>
```

### Card as Link
```tsx
<CardContainer
  as={Link}
  href="/class/123"
  interactive
  ariaLabel="View class details"
>
  <CardBody>
    <h3>Class Title</h3>
  </CardBody>
</CardContainer>
```

### Cream Background Card
```tsx
<CardContainer bgVariant="cream">
  <CardBody>
    <p>Card with cream background</p>
  </CardBody>
</CardContainer>
```

## Styling Standards

All cards follow these standards:
- **Border radius**: `rounded-2xl`
- **Shadow**: `shadow-soft`
- **Border**: `border border-charcoal/10`
- **Padding**: Consistent via CardBody/CardHeader/CardFooter
- **Hover states**: `hover:ring-2 hover:ring-sage/50 hover:shadow-md`
- **Focus states**: `focus-visible:ring-2 focus-visible:ring-sage/50`

## Accessibility

- Interactive cards automatically get `role="group"`
- `aria-label` is required for interactive cards
- Focus management via `tabIndex={0}` for interactive cards
- Keyboard navigation support (Enter/Space)

## Migration

Cards have been migrated in:
- ✅ `components/home/CompleteFamilyProfileCard.tsx`
- ✅ `components/home/SavedSearchesBlock.tsx`
- ✅ `components/home/EarnRewardsBanner.tsx`
- ✅ `components/home/PersonalizedRecommendations.tsx`
- ✅ `components/search/ResultsSplit.tsx`
- ✅ `components/blog/PostCard.tsx`

