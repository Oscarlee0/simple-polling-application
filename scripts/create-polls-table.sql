-- Create the polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL CHECK (length(question) >= 5),
  options TEXT[] NOT NULL CHECK (array_length(options, 1) >= 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);

-- Insert some sample data
INSERT INTO polls (question, options) VALUES 
  ('What is your favorite programming language?', ARRAY['JavaScript', 'Python', 'TypeScript', 'Go']),
  ('Which framework do you prefer for web development?', ARRAY['React', 'Vue', 'Angular', 'Svelte']),
  ('What is the best time to have meetings?', ARRAY['Morning (9-11 AM)', 'Afternoon (1-3 PM)', 'Late afternoon (3-5 PM)'])
ON CONFLICT DO NOTHING;
