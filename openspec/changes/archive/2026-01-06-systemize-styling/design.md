# Styling System Design

## Architecture

We will use **Tailwind CSS v4** as the primary styling engine, backed by **CSS Variables** for dynamic theming (supporting potential future dark/light mode switching).

### 1. Color System

Colors will be defined loosely in `styles.css` using CSS variables, for example:

```css
:root {
  /* Semantic Tokens */
  --color-primary: #1a73e8;
  --color-primary-hover: #1557b0;
  
  --color-bg-base: #f8f9fa;
  --color-bg-card: #ffffff;
  
  --color-text-main: #212529;
  --color-text-muted: #868e96;
  
  /* Status */
  --color-success: ...;
  --color-error: ...;
}
```

Tailwind will be configured to use these variables.

### 2. Typography

We will standardize on a few text styles:
- **Headings**: H1, H2, H3
- **Body**: Body Large, Body Medium, Body Small
- **Utility**: Caption, Label

### 3. Component Styling Rules

- **Prefer Tailwind Utilities**: Use `flex`, `p-4`, `rounded-xl` directly in the template.
- **Avoid Scoped Styles**: Only use `<style scoped>` for complex animations or pseudo-elements that Tailwind doesn't handle gracefully (though v4 handles most).
- **No Hardcoded Hex**: All colors must use `bg-[--color-name]` or standard Tailwind colors mapped to our theme.

## Refactoring Strategy

### Pages (`frontend/src/pages/**`)

**Current state:**
- Heavy use of `<style scoped>` with hardcoded hex colors
- Manual padding (`padding: 40px 32px`, `padding: 32px 24px`)
- Typography inconsistency (multiple font-size/color combinations)
- Examples: `HomePage.vue` (213 lines, 85 lines of styles), `CoursePage.vue` (377 lines, 102 lines of styles)

**Issues found:**
- Colors: `#e9ecef`, `#e9ecef88`, `#5f6368`, `#e8eaed`, `#1a73e8`, `#ffffff`, hardcoded in 15+ places
- Font sizes: `32px`, `24px`, `20px`, `15px`, `14px`, `13px`, `12px` scattered throughout
- Spinners with hardcoded `border-color: #1a73e8`

**Strategy:**
- Replace all hex colors with CSS variables: `--color-text-primary`, `--color-text-secondary`, `--color-bg-surface`
- Convert manual padding to Tailwind utilities: `p-10`, `p-8`, etc.
- Define typography classes: `.text-page-title`, `.text-section-title`, `.text-body`, `.text-caption`
- Extract common patterns (spinners, loading states) into reusable components or utility classes

---

### Shared UI Components (`frontend/src/shared/ui/**`)

**Current state:**
- Mix of Tailwind utilities and `<style scoped>`
- Complex computed class logic with hardcoded color strings
- Examples: `Button.vue` (173 lines), `Card.vue` (78 lines), `Input.vue` (164 lines), `Modal.vue` (164 lines)

**Issues found:**
- **Button.vue**: Hardcoded gradients `from-[#3b82f6] to-[#2563eb]`, shadow colors `rgba(37,99,235,0.6)` in computed classes
- **Card.vue**: Manual padding classes in `<style>`, hardcoded border colors `#ffffff80`, `#dee2e6`
- **Input.vue**: Colors like `#5f6368`, `#80868b`, `#1a73e8`, `#d93025` scattered in styles
- **Modal.vue**: Gradient backgrounds `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`, hardcoded grays

**Strategy:**
- **Button**: Move gradient/shadow definitions to Tailwind theme or use standard `bg-primary` classes
- **Card**: Replace `card-padding-sm/md/lg` with Tailwind `p-4`, `p-6`, `p-8`
- **Input**: Use semantic color variables for borders, text, placeholders
- **Modal**: Replace gradient with theme variable or standard dark background
- Remove all hex values from `<style scoped>` and computed class strings

---

### Widgets (`frontend/src/widgets/**`)

**Current state:**
- Most complex styling issues
- Heavy `<style scoped>` usage (QuickAddCard: 99 lines of styles, CardItem: 177 lines)
- Extensive hardcoded colors and manual sizing

**Issues found:**
- **QuickAddCard.vue**: Hardcoded badge colors (`#dadce080`, `#1a73e8`), typography sizes, complex gradients
- **CardItem.vue**: State badges with 8+ hardcoded colors (`#e8f0fe`, `#1a73e8`, `#fef7e0`, `#f9ab00`)
- **CourseCard.vue**: Action buttons with `#f1f3f4`, `#5f6368`, `#d93025`
- Typography scattered: font sizes from `11px` to `20px`

**Strategy:**
- Create semantic badge variants: `badge-new`, `badge-learning`, `badge-review` using CSS variables
- Replace action button styles with shared utility classes
- Standardize card layouts using Tailwind flex/grid utilities
- Consolidate typography into predefined classes
- Move complex gradients/shadows to theme configuration

---

### Features (`frontend/src/features/**`)

**Current state:** No `.vue` files found (empty directory)

**Strategy:** Monitor for future additions and enforce new styling system from the start

