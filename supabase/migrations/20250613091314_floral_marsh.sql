/*
  # Add activity tracking tables

  1. New Tables
    - `walking_sessions` - Track walking/step data
    - `exercise_sessions` - Track exercise workouts
    - `user_preferences` - Store user preferences like step goals

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add indexes for better query performance
*/

-- Create walking_sessions table
CREATE TABLE IF NOT EXISTS walking_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  steps integer NOT NULL DEFAULT 0,
  distance_km decimal(8,3) DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  calories_burned integer DEFAULT 0,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create exercise_sessions table
CREATE TABLE IF NOT EXISTS exercise_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_name text NOT NULL,
  exercise_type text DEFAULT 'general',
  duration_seconds integer NOT NULL DEFAULT 0,
  rounds_completed integer DEFAULT 1,
  total_rounds integer DEFAULT 1,
  calories_burned integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  daily_step_goal integer DEFAULT 10000,
  preferred_exercise_duration integer DEFAULT 1800, -- 30 minutes in seconds
  notification_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE walking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for walking_sessions
CREATE POLICY "Users can read own walking sessions"
  ON walking_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own walking sessions"
  ON walking_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own walking sessions"
  ON walking_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own walking sessions"
  ON walking_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for exercise_sessions
CREATE POLICY "Users can read own exercise sessions"
  ON exercise_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise sessions"
  ON exercise_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise sessions"
  ON exercise_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise sessions"
  ON exercise_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_walking_sessions_user_id ON walking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_walking_sessions_created_at ON walking_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_walking_sessions_user_id_created_at ON walking_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_sessions_user_id ON exercise_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sessions_created_at ON exercise_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_sessions_user_id_created_at ON exercise_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_sessions_exercise_type ON exercise_sessions(exercise_type);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_preferences updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_preferences_updated_at'
  ) THEN
    CREATE TRIGGER update_user_preferences_updated_at
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_user_preferences_updated_at();
  END IF;
END $$;