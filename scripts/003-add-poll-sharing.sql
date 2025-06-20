-- Add sharing columns to polls table
ALTER TABLE polls ADD COLUMN is_public BOOLEAN DEFAULT false;
ALTER TABLE polls ADD COLUMN share_token VARCHAR(32) UNIQUE;

-- Create index on share_token for better query performance
CREATE INDEX idx_polls_share_token ON polls(share_token) WHERE share_token IS NOT NULL;

-- Update RLS policies to allow public access to shared polls
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own polls and public polls" ON polls;

-- Create new policy that includes shared polls
CREATE POLICY "Users can view own polls, public polls, and shared polls" ON polls
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IS NULL OR 
    (is_public = true AND share_token IS NOT NULL)
  );

-- Function to generate a random share token
CREATE OR REPLACE FUNCTION generate_share_token() RETURNS VARCHAR(32) AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'polls' 
ORDER BY ordinal_position;
