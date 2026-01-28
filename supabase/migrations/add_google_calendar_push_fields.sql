-- Migration: Add Google Calendar Push Fields
-- Run this in Supabase SQL Editor

-- Add google_event_id to blocks table for tracking pushed events
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Add push_calendar_id to profiles table to store the Push To Start calendar ID
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_calendar_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_blocks_google_event_id ON blocks(google_event_id) WHERE google_event_id IS NOT NULL;
