-- Create votes table to track individual votes
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  voter_ip VARCHAR(45), -- Store IP for anonymous voting (optional)
  voter_session VARCHAR(255), -- Store session ID for anonymous voting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one vote per session per poll
  UNIQUE(poll_id, voter_session)
);

-- Create index for better query performance
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_created_at ON votes(created_at DESC);

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

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'votes' 
ORDER BY ordinal_position;
