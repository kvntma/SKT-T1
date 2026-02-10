# SKT-28: [Bug] Calendar blocks too small to show title/details for short durations

## Context
In the calendar view, blocks with a short duration (e.g., < 30 mins) become vertically small, causing the title, time, and action icons to be hidden or truncated.

## Proposed Fix Recommendation

### 1. Increase Minimum Height
Currently, `getBlockStyle` has a `min-height` of `20px`:
```typescript
const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 20)
```
**Recommendation:** Increase this to `24px` or `28px` to ensure at least one line of text and icons are always visible.

### 2. Condensed Layout for Short Blocks
In `DraggableBlock`, implement more aggressive compacting based on duration:
- **Duration < 30m:** Hide the time string, show only Icon + Title in a single line.
- **Duration < 20m:** Hide the Title text by default, show only the Icon. Show the full title on hover via a simple tooltip or by expanding the block's z-index and height temporarily.

### 3. Padding Adjustment
Reduce internal padding for small blocks to reclaim vertical pixels.
```typescript
className={cn(
    "absolute rounded-lg p-1 text-left ...", // Changed from p-1.5
    height < 30 && "p-0.5"
)}
```

### 4. Implementation Details
Update `DraggableBlock` to receive the calculated `height` or `duration` as a prop to make styling decisions easier.

## Progress
- [x] Create bug ticket in Linear.
- [x] Initial investigation of code.
- [ ] Implement fix.
