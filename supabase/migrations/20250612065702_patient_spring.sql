/*
  # Add missing tables for mood entries and meditation sessions

  1. New Tables
    - `mood_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `mood` (text, the emoji)
      - `mood_title` (text, the mood name)
      - `description` (text, optional description)
      - `category` (text, optional category)
      - `created_at` (timestamp)
    
    - `meditation_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `duration_minutes` (integer)
      - `actual_duration_seconds` (integer)
      - `background_theme` (text)
      - `background_music` (text)
      - `mood_before` (text)
      - `mood_after` (text)
      - `notes` (text)
      - `completed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add indexes for better query performance
*/

-- Create mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood text NOT NULL,
  mood_title text NOT NULL,
  description text,
  category text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on mood_entries
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for mood_entries
CREATE POLICY "Users can read own mood entries"
  ON mood_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries"
  ON mood_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood entries"
  ON mood_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create meditation_sessions table
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 0,
  actual_duration_seconds integer DEFAULT 0,
  background_theme text DEFAULT 'nature',
  background_music text DEFAULT 'silence',
  mood_before text,
  mood_after text,
  notes text,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on meditation_sessions
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for meditation_sessions
CREATE POLICY "Users can read own meditation sessions"
  ON meditation_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meditation sessions"
  ON meditation_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meditation sessions"
  ON meditation_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meditation sessions"
  ON meditation_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at ON mood_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id_created_at ON mood_entries(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_created_at ON meditation_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_id_created_at ON meditation_sessions(user_id, created_at DESC);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_meditation_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for meditation_sessions updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_meditation_sessions_updated_at'
  ) THEN
    CREATE TRIGGER update_meditation_sessions_updated_at
      BEFORE UPDATE ON meditation_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_meditation_sessions_updated_at();
  END IF;
END $$;