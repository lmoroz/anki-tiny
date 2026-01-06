# Systemize Frontend Styling

**Change ID**: `systemize-styling`

## Problem

The frontend styling is currently inconsistent and difficult to maintain.
- **Mixed Approaches**: Components use a mix of Tailwind CSS utility classes and manual inline `<style scoped>` blocks.
- **Hardcoded Colors**: Colors are defined in multiple places: CSS variables in `styles.css`, hardcoded hex values in Vue components (e.g., `Button.vue`), and arbitrary Tailwind classes.
- **Lack of Typography System**: There is no centralized definition for font sizes, weights, and line heights for headings, body text, and captions.

## Solution

We will establish a unified design system using Tailwind CSS v4 and CSS variables.

1.  **Unified Color System**: Consolidate all colors into a set of semantic CSS variables (e.g., `--color-primary`, `--color-bg-surface`, `--color-text-body`) defined in `styles.css`. Configure Tailwind to usage these variables.
2.  **Typography System**: Define semantic typography classes (e.g., `.text-h1`, `.text-body-md`) or Tailwind theme extensions.
3.  **Refactor Components**: Systematically refactor `shared/ui` components to use these new tokens and remove ad-hoc `<style scoped>` blocks where possible, replacing them with Tailwind utilities.
4.  **Standardize Manual Styles**: Audit the codebase for other manual styles and replace them with standard utility classes.

## Scope

- **Files**:
    - `frontend/src/app/assets/css/styles.css`: Definition of variables and theme.
    - `frontend/src/shared/ui/**`: All shared components (`Button.vue`, `Card.vue`, etc.).
    - `frontend/src/features/**`: Feature-specific styles (on a best-effort basis).
    - `frontend/src/widgets/**`: Widget-specific styles.
    - `frontend/src/pages/**`: Page-specific styles.

## Risks

- **Visual Regressions**: Changing fundamental styles might slightly alter the look of existing components. Visual verification is required.
- **Merge Conflicts**: Extensive changes to common components might cause conflicts if other branches are modifying them.
