-- Add logged_by column to track who created each Mexico event

ALTER TABLE mexico_events 
ADD COLUMN logged_by uuid REFERENCES auth.users(id);

-- Create index for better query performance
CREATE INDEX idx_mexico_events_logged_by ON mexico_events(logged_by);

-- Optional: If you want to backfill existing events, you can set them to a specific user
-- UPDATE mexico_events SET logged_by = 'some-user-uuid' WHERE logged_by IS NULL;
