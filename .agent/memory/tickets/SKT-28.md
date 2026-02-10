# SKT-28: [Bug] Calendar blocks too small to show title/details for short durations

## Context
In the calendar view, blocks with a short duration (e.g., < 30 mins) become vertically small, causing the title, time, and action icons to be hidden or truncated.

## Proposed Fix Recommendation

### 1. Increase Minimum Height
Currently, `getBlockStyle` has a `min-height` of `20px`:
```typescript
const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 26) // Increased to 26
```

### 2. Condensed Layout for Short Blocks
In `DraggableBlock`, implement more aggressive compacting based on duration:
- **Duration < 30m:** Hide the time string, show only Icon + Title in a single line.
- **Duration < 20m:** Hide the Title text by default, show only the Icon. (Actually kept title but used text-10px and p-0.5)

### 3. Padding Adjustment
Reduce internal padding for small blocks to reclaim vertical pixels.
```typescript
className={cn(
    "absolute rounded-lg p-1.5 text-left ...",
    isSmallHeight && "p-1",
    height < 28 && "p-0.5"
)}
```

### 4. Implementation Details
Update `DraggableBlock` to handle small height logic internally by parsing `style.height`.

## Progress
- [x] Create bug ticket in Linear.
- [x] Initial investigation of code.
- [x] Implement fix in `src/components/calendar-view.tsx`.
    - Increased min-height to 26px.
    - Added `isSmallHeight` and `isCompact` logic based on height.
    - Reduced padding for small blocks.
    - Vertically centered content with `justify-center`.
    - Hid time string for height < 40px.