/*
  # Add NFT Achievement Features

  1. Schema Updates
    - Add `algorand_address` column to users table
    - Create `achievement_nfts` table for NFT metadata
    - Create `user_achievements` table to track user progress

  2. New Tables
    - `achievement_nfts` - Stores NFT metadata and achievement definitions
    - `user_achievements` - Tracks which achievements users have earned

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users

  4. Sample Achievement Data
    - Insert predefined achievements with metadata
*/

-- Add algorand_address to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'algorand_address'
  ) THEN
    ALTER TABLE users ADD COLUMN algorand_address text;
  END IF;
END $$;

-- Create achievement_nfts table for NFT metadata
CREATE TABLE IF NOT EXISTS achievement_nfts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_name text UNIQUE NOT NULL,
  achievement_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  requirement_value integer DEFAULT 1,
  requirement_description text NOT NULL,
  nft_metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user_achievements table to track earned achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_name text REFERENCES achievement_nfts(achievement_name) ON DELETE CASCADE NOT NULL,
  nft_asset_id bigint,
  earned_at timestamptz DEFAULT now(),
  transaction_id text,
  UNIQUE(user_id, achievement_name)
);

-- Enable RLS
ALTER TABLE achievement_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievement_nfts (read-only for all authenticated users)
CREATE POLICY "Anyone can read achievement definitions"
  ON achievement_nfts
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can read own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert predefined achievements
INSERT INTO achievement_nfts (achievement_name, achievement_type, title, description, image_url, requirement_value, requirement_description, nft_metadata) VALUES
-- Meditation achievements
('first_meditation', 'meditation', 'First Steps', 'Completed your first meditation session', 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=400', 1, 'Complete 1 meditation session', '{"category": "meditation", "rarity": "common", "color": "#10b981"}'),
('meditation_streak_3', 'meditation', 'Consistency Builder', 'Meditated for 3 consecutive days', 'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=400', 3, 'Meditate for 3 consecutive days', '{"category": "meditation", "rarity": "uncommon", "color": "#3b82f6"}'),
('meditation_streak_7', 'meditation', 'Week Warrior', 'Meditated for 7 consecutive days', 'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=400', 7, 'Meditate for 7 consecutive days', '{"category": "meditation", "rarity": "rare", "color": "#8b5cf6"}'),
('meditation_streak_30', 'meditation', 'Mindful Master', 'Meditated for 30 consecutive days', 'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=400', 30, 'Meditate for 30 consecutive days', '{"category": "meditation", "rarity": "legendary", "color": "#f59e0b"}'),
('meditation_total_10', 'meditation', 'Dedicated Practitioner', 'Completed 10 meditation sessions', 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=400', 10, 'Complete 10 meditation sessions', '{"category": "meditation", "rarity": "uncommon", "color": "#3b82f6"}'),
('meditation_hours_5', 'meditation', 'Time Keeper', 'Meditated for 5 total hours', 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=400', 300, 'Meditate for 5 total hours (300 minutes)', '{"category": "meditation", "rarity": "rare", "color": "#8b5cf6"}'),

-- Mood tracking achievements
('first_mood', 'mood', 'Emotional Awareness', 'Logged your first mood entry', 'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=400', 1, 'Log 1 mood entry', '{"category": "mood", "rarity": "common", "color": "#10b981"}'),
('mood_entries_7', 'mood', 'Mood Tracker', 'Logged 7 mood entries', 'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=400', 7, 'Log 7 mood entries', '{"category": "mood", "rarity": "uncommon", "color": "#3b82f6"}'),
('mood_entries_30', 'mood', 'Emotional Intelligence', 'Logged 30 mood entries', 'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=400', 30, 'Log 30 mood entries', '{"category": "mood", "rarity": "rare", "color": "#8b5cf6"}'),
('mood_streak_7', 'mood', 'Daily Reflection', 'Logged mood for 7 consecutive days', 'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=400', 7, 'Log mood for 7 consecutive days', '{"category": "mood", "rarity": "rare", "color": "#8b5cf6"}'),

-- AI Chat achievements
('first_chat', 'chat', 'Digital Companion', 'Had your first AI chat conversation', 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400', 1, 'Send 1 AI chat message', '{"category": "chat", "rarity": "common", "color": "#10b981"}'),
('chat_messages_25', 'chat', 'Conversationalist', 'Sent 25 AI chat messages', 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400', 25, 'Send 25 AI chat messages', '{"category": "chat", "rarity": "uncommon", "color": "#3b82f6"}'),
('chat_messages_100', 'chat', 'AI Whisperer', 'Sent 100 AI chat messages', 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400', 100, 'Send 100 AI chat messages', '{"category": "chat", "rarity": "rare", "color": "#8b5cf6"}'),

-- Motivation achievements
('first_quote_like', 'motivation', 'Inspiration Seeker', 'Liked your first motivational quote', 'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=400', 1, 'Like 1 motivational quote', '{"category": "motivation", "rarity": "common", "color": "#10b981"}'),
('quote_likes_10', 'motivation', 'Motivation Collector', 'Liked 10 motivational quotes', 'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=400', 10, 'Like 10 motivational quotes', '{"category": "motivation", "rarity": "uncommon", "color": "#3b82f6"}'),

-- Wellness journey achievements
('wellness_week', 'overall', 'Wellness Explorer', 'Used the app for 7 consecutive days', 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=400', 7, 'Use the app for 7 consecutive days', '{"category": "overall", "rarity": "rare", "color": "#8b5cf6"}'),
('wellness_month', 'overall', 'Wellness Champion', 'Used the app for 30 consecutive days', 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=400', 30, 'Use the app for 30 consecutive days', '{"category": "overall", "rarity": "legendary", "color": "#f59e0b"}');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_name ON user_achievements(achievement_name);
CREATE INDEX IF NOT EXISTS idx_achievement_nfts_type ON achievement_nfts(achievement_type);