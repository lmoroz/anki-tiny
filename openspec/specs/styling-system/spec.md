# styling-system Specification

## Purpose

TBD - created by archiving change systemize-styling. Update Purpose after archive.

## Requirements

### Requirement: Unified Color System

The application MUST use a centralized color system defined in CSS variables and exposed through Tailwind configuration.

#### Scenario: Primary color usage

Given a developer is styling a button
When they apply `bg-primary` or use `var(--color-primary)`
Then the color MUST resolve to the centralized `--color-primary` variable
And the value MUST be consistent across all components.

#### Scenario: No hardcoded hex colors

Given a Vue component file (`.vue`)
When I search for hex color values (e.g., `#1a73e8`, `#e9ecef`)
Then NO hardcoded hex colors should be found in `<style scoped>` blocks
And NO hardcoded hex colors should be found in computed class strings
And all colors MUST use CSS variables or Tailwind semantic classes.

### Requirement: Typography System

The application MUST provide standardized typography utilities with consistent font sizes, weights, and line heights.

#### Scenario: Page title typography

Given I render a page title (e.g., "Мои курсы")
When I apply the page title class
Then it MUST use a predefined font size, weight, and color from the typography system
And it MUST NOT use inline style values like `font-size: 32px` or `color: #e9ecef`.

#### Scenario: Body text typography

Given I render body text content
When I apply the body text class
Then it MUST have consistent size (`14px` or `15px`) and line-height (`1.5` or `1.6`)
And the color MUST come from `--color-text-primary` or `--color-text-secondary`.

### Requirement: Spacing System

The application MUST use Tailwind spacing utilities instead of manual padding/margin pixel values.

#### Scenario: Component padding replacement

Given a component like `Card` with manual padding (e.g., `padding: 24px`)
When refactored to use the spacing system
Then it MUST use Tailwind utilities like `p-6` (24px)
And NO manual `padding:` declarations should exist in `<style scoped>`.

### Requirement: Shared UI Component Styling

Shared UI components (`shared/ui/*`) MUST be refactored to eliminate hardcoded styles and use the unified styling system.

#### Scenario: Button component refactoring

Given the `Button.vue` component
When I inspect its implementation
Then hardcoded gradient strings like `from-[#3b82f6] to-[#2563eb]` MUST be removed
And gradient/shadow definitions MUST use Tailwind theme utilities or CSS variables
And NO hex colors should appear in computed class logic.

#### Scenario: Card component refactoring

Given the `Card.vue` component
When I check its `<style scoped>` block
Then manual padding classes (`.card-padding-sm`, `.card-padding-md`) MUST be removed
And replaced with Tailwind utilities (`p-4`, `p-6`, `p-8`)
And hardcoded border colors like `#ffffff80` MUST use CSS variables.

#### Scenario: Input component refactoring

Given the `Input.vue` component
When I inspect its styles
Then colors like `#5f6368`, `#80868b`, `#1a73e8` MUST be replaced
And it MUST use semantic variables (`--color-text-secondary`, `--color-border-focus`, etc.)
And focus states MUST use Tailwind utilities.

#### Scenario: Modal component refactoring

Given the `Modal.vue` component
When I check its background gradient
Then `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)` MUST be replaced
And it MUST use a CSS variable like `--color-bg-modal` or Tailwind dark background classes.

### Requirement: Widget Styling

Widget components (`widgets/*`) MUST be refactored to use semantic color tokens and reduce reliance on `<style scoped>` blocks.

#### Scenario: State badge colors

Given the `CardItem.vue` component with state badges
When I inspect badge styles (`.badge-new`, `.badge-learning`, etc.)
Then hardcoded colors like `#e8f0fe`, `#1a73e8`, `#fef7e0` MUST be replaced
And semantic CSS variables MUST be defined (e.g., `--badge-new-bg`, `--badge-new-text`)
And the variables MUST be used consistently across all badge variants.

#### Scenario: Action button consistency

Given action buttons in `CourseCard.vue` and `CardItem.vue`
When I inspect their hover states
Then they MUST use shared utility classes or consistent CSS variables
And NOT individual hardcoded colors like `#f1f3f4`, `#5f6368`, `#d93025`.

### Requirement: Page Styling

Page components (`pages/*`) MUST minimize `<style scoped>` usage and adopt Tailwind utilities for layout and spacing.

#### Scenario: Page container standardization

Given page containers in `HomePage.vue` and `CoursePage.vue`
When I check their padding styles
Then manual values like `padding: 40px 32px` or `padding: 32px 24px` MUST be replaced
And Tailwind utilities like `p-10 px-8` or `p-8 px-6` MUST be used instead.

#### Scenario: Spinner/loading state consolidation

Given spinner implementations across pages
When I inspect spinner styles
Then hardcoded `border-color: #1a73e8` MUST be removed
And a reusable `Spinner` component or utility class MUST be created
And it MUST use `--color-primary` for the accent color.
