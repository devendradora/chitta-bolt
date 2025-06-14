/*
  # Fix Chat Conversations RLS Policies

  1. Security Updates
    - Fix RLS policies to use auth.uid() instead of uid()
    - Ensure proper authentication checks for chat conversations

  2. Policy Updates
    - Update INSERT policy for chat conversations
    - Update SELECT policy for chat conversations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can read own conversations" ON chat_conversations;

-- Create corrected policies with auth.uid()
CREATE POLICY "Users can insert own conversations"
  ON chat_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own conversations"
  ON chat_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);