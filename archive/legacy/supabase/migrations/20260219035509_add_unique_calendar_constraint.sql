-- Migration: Add unique constraint for calendar sync
-- This is required for ON CONFLICT (user_id, calendar_id) to work during upserts

-- Create the unique index first
CREATE UNIQUE INDEX IF NOT EXISTS idx_blocks_user_calendar 
ON blocks(user_id, calendar_id) 
WHERE calendar_id IS NOT NULL;

-- Add the constraint explicitly using the index
ALTER TABLE blocks 
DROP CONSTRAINT IF EXISTS unique_user_calendar_block;

ALTER TABLE blocks 
ADD CONSTRAINT unique_user_calendar_block 
UNIQUE USING INDEX idx_blocks_user_calendar;
