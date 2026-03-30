# SKT-29: Bug: Center Active Block in Desktop View
Last updated: 2026-02-10 11:30 local
Status: **Ready for Testing**

## Problem
The active block (or "No active block" state) on the `/now` page was not properly centered in desktop mode. Specifically:
- Vertically, it was centered in the whole viewport, ignoring the bottom navigation bar on mobile (making it appear low).
- The "No active block" state used `h-full` without a height-constrained parent, causing it to stick to the top.
- Horizontal centering was relative to the content area, which is correct, but the overall layout felt "floaty".

## Solution Implemented
Refactored the application layout to use a robust flex-based centering strategy.

### Changes
1. **`AppLayout` (`src/app/(app)/layout.tsx`)**:
   - Converted `main` into a flex column with `min-h-screen`.
   - Wrapped `children` in a `flex-1 flex flex-col` container that includes the `pb-20` mobile padding.
   - This ensures that children can use `flex-1` to fill the *visible* content area accurately.

2. **`NowView` (`src/components/now-view.tsx`)**:
   - Replaced `min-h-screen` (for active block) and `h-full` (for no active block) with `flex-1`.
   - Both states now use `flex-1`, `flex-col`, `items-center`, and `justify-center`.
   - This centers the content perfectly within the area provided by `AppLayout`.

3. **`SavePage` (`src/app/(app)/save/page.tsx`)**:
   - Updated the main container to use `flex-1` instead of `min-h-screen` for consistency.

## Files Changed
- `src/app/(app)/layout.tsx`
- `src/app/(app)/save/page.tsx`
- `src/components/now-view.tsx`

## Verification Checklist
- [ ] `/now` page with active block: Centered vertically and horizontally in the content area.
- [ ] `/now` page with NO active block: Centered vertically and horizontally in the content area (not at top).
- [ ] `/save` page: Centered vertically and horizontally.
- [ ] Mobile Layout: Content is centered in the space *above* the bottom navigation bar (no longer feels "low").
- [ ] `Blocks` page execution sidebar: Still appears correctly at the top (unaffected by `flex-1` since it's `isCompact`).
