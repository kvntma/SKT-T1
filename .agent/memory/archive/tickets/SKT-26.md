# SKT-26: Responsive Design System (useBreakpoint Hook)

## Context
Implement responsive behavior to distinguish between Mobile and Desktop experiences. Standard breakpoints: `mobile: < 768px`, `desktop: >= 768px`.

## Goal
Ensure the app feels native on both form factors without complex separate codebases.

## Requirements
- [x] **useBreakpoint Hook**: Create a reusable React hook to detect screen width/device type.
- [x] **Layout Adjustments**:
    - Mobile: Single-column, bottom navigation, touch targets.
    - Desktop: Side-by-side Calendar + Execution view, sidebar navigation.
- [x] **Component Adaptation**: Ensure critical components (Timer, Block Card) render appropriately.

## Progress
- [x] Initial investigation of existing layout and navigation.
- [x] Implement `useBreakpoint` hook.
- [x] Update Layout for responsive navigation (Sidebar for desktop).
- [x] Update Main views for side-by-side desktop layout.
- [x] Refactor `NowPage` into reusable `NowView`.

## Decisions
- **Unified Dashboard:** On desktop, `/blocks` serves as a unified dashboard showing both the schedule (Calendar/List) and the current execution state (`NowView`).
- **Sidebar Navigation:** Use a persistent sidebar on desktop for better use of horizontal space.
- **Compact NowView:** Introduced `isCompact` mode for `NowView` to fit elegantly in the desktop side panel.