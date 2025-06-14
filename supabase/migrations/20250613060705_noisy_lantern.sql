/*
  # Add Tavus Video Agent Integration

  1. New Tables
    - `tavus_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `conversation_id` (text, Tavus conversation ID)
      - `mood` (text, user's mood emoji)
      - `category` (text, optional mood category)
      - `context` (text, optional additional context)
      - `conversation_url` (text, Tavus conversation URL)
      - `status` (text, conversation status)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on tavus_conversations table
    - Add policies for authenticated users to manage their own conversations

  3. Indexes
    - Add indexes for better query performance
*/

-- Create tavus_conversations table
CREATE TABLE IF NOT EXISTS tavus_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id text NOT NULL,
  mood text NOT NULL,
  category text,
  context text,
  conversation_url text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on tavus_conversations
ALTER TABLE tavus_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for tavus_conversations
CREATE POLICY "Users can read own conversations"
  ON tavus_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON tavus_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON tavus_conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tavus_conversations_user_id ON tavus_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_tavus_conversations_created_at ON tavus_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tavus_conversations_mood ON tavus_conversations(mood);
CREATE INDEX IF NOT EXISTS idx_tavus_conversations_status ON tavus_conversations(status);