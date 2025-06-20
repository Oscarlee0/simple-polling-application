-- Fix table dependencies by dropping and recreating in the correct order
-- This script handles the foreign key constraints properly and is idempotent

-- First, drop dependent objects in the correct order (CASCADE handles dependencies)
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS polls CASCADE;

-- Drop any existing functions (IF EXISTS prevents errors)
DROP FUNCTION IF EXISTS get_poll_statistics(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_poll_total_votes(UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_share_token() CASCADE;

-- Drop any existing indexes that might conflict
DROP INDEX IF EXISTS idx_polls_created_at;
DROP INDEX IF EXISTS idx_polls_user_id;
DROP INDEX IF EXISTS idx_polls_share_token;
DROP INDEX IF EXISTS idx_votes_poll_id;
DROP INDEX IF EXISTS idx_votes_created_at;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Recreate the polls table with all columns
CREATE TABLE polls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question TEXT NOT NULL CHECK (length(trim(question)) >= 5),
  options TEXT[] NOT NULL CHECK (array_length(options, 1) >= 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  share_token VARCHAR(32) UNIQUE
);

-- Create indexes for polls table
CREATE INDEX idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX idx_polls_user_id ON polls(user_id);
CREATE INDEX idx_polls_share_token ON polls(share_token) WHERE share_token IS NOT NULL;

-- Create votes table with proper foreign key constraints
CREATE TABLE votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  voter_ip VARCHAR(45),
  voter_session VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one vote per session per poll
  UNIQUE(poll_id, voter_session)
);

-- Create indexes for votes table
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_created_at ON votes(created_at DESC);

-- Enable Row Level Security (RLS) for polls
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own polls and public polls" ON polls;
DROP POLICY IF EXISTS "Users can view own polls, public polls, and shared polls" ON polls;
DROP POLICY IF EXISTS "Users can insert own polls" ON polls;
DROP POLICY IF EXISTS "Users can update own polls" ON polls;
DROP POLICY IF EXISTS "Users can delete own polls" ON polls;

-- Create policies for polls
CREATE POLICY "Users can view own polls and shared polls" ON polls
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IS NULL OR 
    (is_public = true AND share_token IS NOT NULL)
  );

CREATE POLICY "Users can insert own polls" ON polls
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own polls" ON polls
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own polls" ON polls
  FOR DELETE USING (user_id = auth.uid());

-- Enable RLS for votes (allow public voting)
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Drop existing vote policies if they exist
DROP POLICY IF EXISTS "Anyone can view votes for public polls" ON votes;
DROP POLICY IF EXISTS "Anyone can insert votes for public polls" ON votes;

-- Create policies for votes
CREATE POLICY "Anyone can view votes for public polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND (polls.is_public = true OR polls.user_id = auth.uid())
    )
  );

CREATE POLICY "Anyone can insert votes for public polls" ON votes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.is_public = true
    )
  );

-- Function to generate a random share token
CREATE OR REPLACE FUNCTION generate_share_token() RETURNS VARCHAR(32) AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to get vote statistics for a poll
CREATE OR REPLACE FUNCTION get_poll_statistics(poll_uuid UUID)
RETURNS TABLE(
  option_index INTEGER,
  vote_count BIGINT,
  percentage NUMERIC(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH vote_counts AS (
    SELECT 
      v.option_index,
      COUNT(*) as count
    FROM votes v
    WHERE v.poll_id = poll_uuid
    GROUP BY v.option_index
  ),
  total_votes AS (
    SELECT COALESCE(SUM(count), 0) as total
    FROM vote_counts
  )
  SELECT 
    vc.option_index,
    vc.count as vote_count,
    CASE 
      WHEN tv.total > 0 THEN ROUND((vc.count::NUMERIC / tv.total::NUMERIC) * 100, 2)
      ELSE 0::NUMERIC(5,2)
    END as percentage
  FROM vote_counts vc
  CROSS JOIN total_votes tv
  ORDER BY vc.option_index;
END;
$$ LANGUAGE plpgsql;

-- Function to get total votes for a poll
CREATE OR REPLACE FUNCTION get_poll_total_votes(poll_uuid UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM votes
    WHERE poll_id = poll_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data (only if no polls exist)
INSERT INTO polls (question, options) 
SELECT * FROM (VALUES 
  ('What is your favorite programming language?', ARRAY['JavaScript', 'Python', 'TypeScript', 'Go']),
  ('Which framework do you prefer for web development?', ARRAY['React', 'Vue', 'Angular', 'Svelte']),
  ('What is the best time to have meetings?', ARRAY['Morning (9-11 AM)', 'Afternoon (1-3 PM)', 'Late afternoon (3-5 PM)'])
) AS new_polls(question, options)
WHERE NOT EXISTS (SELECT 1 FROM polls LIMIT 1);

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as total_polls FROM polls;
SELECT COUNT(*) as total_votes FROM votes;

-- Show table structure
SELECT 
  table_name,
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('polls', 'votes')
ORDER BY table_name, ordinal_position;
