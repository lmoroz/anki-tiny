# Global Interleaved Practice (Global Queue)

## Summary

Implement a "Global Training" mode that gathers due cards from all courses, mixes them using an interleaving strategy, and respects both global and course-specific limits.

## Why

Currently, users can only study one course at a time. Modern learning science (Interleaved Practice) suggests that mixing subjects improves retention and cognitive flexibility. Additionally, users often want a "Study All" button to complete their daily goals continuously without manually switching contexts.

## Goals

1. Allow users to review all due cards from all courses in a single session.
2. Implement an intelligent mixing algorithm that:
   - Respects Global Limits (e.g., max 300 reviews/day).
   - Respects Course Limits (e.g., max 20 new cards for "English").
   - Prioritizes urgent cards (highest overdue).
   - Interleaves subjects (shuffles the final queue).
3. Add a "Start Global Training" entry point on the Home Page.
4. Display visual indicator of which course the current card belongs to during training.

## Non-Goals

- Complex priority settings in UI (we rely on due dates and limits).

## User Story

As a learner with multiple decks (English, Python, History), I want to click one button "Train All" to review everything due today, mixed together, so that I can save time and improve my learning efficiency.
