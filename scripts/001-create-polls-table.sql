-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop table if it exists (for development purposes)
DROP TABLE IF EXISTS polls;

-- Create the polls table
CREATE TABLE polls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question TEXT NOT NULL CHECK (length(trim(question)) >= 5),
  options TEXT[] NOT NULL CHECK (array_length(options, 1) >= 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for better query performance
CREATE INDEX idx_polls_created_at ON polls(created_at DESC);

-- Insert some sample data
INSERT INTO polls (question, options) VALUES 
  ('What is your favorite programming language?', ARRAY['JavaScript', 'Python', 'TypeScript', 'Go']),
  ('Which framework do you prefer for web development?', ARRAY['React', 'Vue', 'Angular', 'Svelte']),
  ('What is the best time to have meetings?', ARRAY['Morning (9-11 AM)', 'Afternoon (1-3 PM)', 'Late afternoon (3-5 PM)']);

-- Verify the table was created and data was inserted
SELECT COUNT(*) as total_polls FROM polls;
SELECT * FROM polls ORDER BY created_at DESC;
