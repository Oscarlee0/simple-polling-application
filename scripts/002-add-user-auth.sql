-- Add user_id column to polls table
ALTER TABLE polls ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on user_id for better query performance
CREATE INDEX idx_polls_user_id ON polls(user_id);

-- Update existing polls to have a null user_id (they'll be visible to everyone)
-- In a real app, you might want to assign them to a specific user or delete them

-- Enable Row Level Security (RLS)
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- Create policies for polls
-- Users can view their own polls and public polls (where user_id is null)
CREATE POLICY "Users can view own polls and public polls" ON polls
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can insert their own polls
CREATE POLICY "Users can insert own polls" ON polls
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own polls
CREATE POLICY "Users can update own polls" ON polls
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own polls
CREATE POLICY "Users can delete own polls" ON polls
  FOR DELETE USING (user_id = auth.uid());

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'polls' 
ORDER BY ordinal_position;
