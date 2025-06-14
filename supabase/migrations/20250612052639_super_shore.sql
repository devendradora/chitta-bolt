/*
  # Create motivation quotes feature

  1. New Tables
    - `motivation_quotes`
      - `id` (uuid, primary key)
      - `quote` (text, the motivational quote)
      - `author` (text, quote author)
      - `category` (text, quote category)
      - `created_at` (timestamp)
    - `quote_interactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `quote_id` (uuid, foreign key to motivation_quotes)
      - `interaction_type` (text, 'like' or 'share')
      - `created_at` (timestamp)
    - `quote_comments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `quote_id` (uuid, foreign key to motivation_quotes)
      - `comment` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read quotes
    - Add policies for users to manage their own interactions and comments

  3. Sample Data
    - Insert 100 motivational quotes across different categories
*/

-- Create motivation_quotes table
CREATE TABLE IF NOT EXISTS motivation_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote text NOT NULL,
  author text DEFAULT 'Unknown',
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

-- Create quote_interactions table
CREATE TABLE IF NOT EXISTS quote_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES motivation_quotes(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'share')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, quote_id, interaction_type)
);

-- Create quote_comments table
CREATE TABLE IF NOT EXISTS quote_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES motivation_quotes(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE motivation_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for motivation_quotes
CREATE POLICY "Anyone can read quotes"
  ON motivation_quotes
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for quote_interactions
CREATE POLICY "Users can read all interactions"
  ON quote_interactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own interactions"
  ON quote_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions"
  ON quote_interactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for quote_comments
CREATE POLICY "Users can read all comments"
  ON quote_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON quote_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON quote_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON quote_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample motivational quotes
INSERT INTO motivation_quotes (quote, author, category) VALUES
-- Health quotes
('The greatest wealth is health.', 'Virgil', 'health'),
('Take care of your body. It''s the only place you have to live.', 'Jim Rohn', 'health'),
('Health is not about the weight you lose, but about the life you gain.', 'Unknown', 'health'),
('Your body can stand almost anything. It''s your mind that you have to convince.', 'Unknown', 'health'),
('A healthy outside starts from the inside.', 'Robert Urich', 'health'),
('The first wealth is health.', 'Ralph Waldo Emerson', 'health'),
('To keep the body in good health is a duty... otherwise we shall not be able to keep our mind strong and clear.', 'Buddha', 'health'),
('Health is a state of complete harmony of the body, mind and spirit.', 'B.K.S. Iyengar', 'health'),
('The groundwork for all happiness is good health.', 'Leigh Hunt', 'health'),
('A fit body, a calm mind, a house full of love. These things cannot be bought – they must be earned.', 'Naval Ravikant', 'health'),

-- Love quotes
('Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day.', 'Unknown', 'love'),
('The best thing to hold onto in life is each other.', 'Audrey Hepburn', 'love'),
('Love is composed of a single soul inhabiting two bodies.', 'Aristotle', 'love'),
('Where there is love there is life.', 'Mahatma Gandhi', 'love'),
('Love yourself first and everything else falls into line.', 'Lucille Ball', 'love'),
('The greatest happiness of life is the conviction that we are loved.', 'Victor Hugo', 'love'),
('Love is the bridge between you and everything.', 'Rumi', 'love'),
('To love and be loved is to feel the sun from both sides.', 'David Viscott', 'love'),
('Love is not finding someone to live with. It''s finding someone you can''t live without.', 'Rafael Ortiz', 'love'),
('The best love is the kind that awakens the soul and makes us reach for more.', 'Nicholas Sparks', 'love'),

-- Brother quotes
('A brother is a friend given by nature.', 'Jean Baptiste Legouve', 'brother'),
('Brothers are what best friends can never be.', 'Unknown', 'brother'),
('There is no love like the love for a brother. There is no love like the love from a brother.', 'Astrid Alauda', 'brother'),
('Brothers don''t necessarily have to say anything to each other – they can sit in a room and be together and just be completely comfortable with each other.', 'Leonardo DiCaprio', 'brother'),
('A brother is a little bit of childhood that can never be lost.', 'Marion C. Garretty', 'brother'),
('Brothers are like streetlights along the road, they don''t make distance any shorter but they light up the path and make the walk worthwhile.', 'Unknown', 'brother'),
('The bond between brothers is unbreakable, forged by love, strengthened by time.', 'Unknown', 'brother'),
('Brothers may not always agree, but they will always be there for each other.', 'Unknown', 'brother'),
('A brother shares childhood memories and grown-up dreams.', 'Unknown', 'brother'),
('Brothers are the best kind of friends.', 'Unknown', 'brother'),

-- Mother quotes
('A mother''s love is the fuel that enables a normal human being to do the impossible.', 'Marion C. Garretty', 'mother'),
('Motherhood: All love begins and ends there.', 'Robert Browning', 'mother'),
('The influence of a mother in the lives of her children is beyond calculation.', 'James E. Faust', 'mother'),
('A mother is she who can take the place of all others but whose place no one else can take.', 'Cardinal Mermillod', 'mother'),
('Mother''s love is peace. It need not be acquired, it need not be deserved.', 'Erich Fromm', 'mother'),
('The heart of a mother is a deep abyss at the bottom of which you will always find forgiveness.', 'Honoré de Balzac', 'mother'),
('A mother''s arms are more comforting than anyone else''s.', 'Princess Diana', 'mother'),
('Mothers hold their children''s hands for a short while, but their hearts forever.', 'Unknown', 'mother'),
('There is no way to be a perfect mother, and a million ways to be a great one.', 'Jill Churchill', 'mother'),
('A mother''s love endures through all.', 'Washington Irving', 'mother'),

-- Father quotes
('A father is someone you look up to no matter how tall you grow.', 'Unknown', 'father'),
('The quality of a father can be seen in the goals, dreams and aspirations he sets not only for himself, but for his family.', 'Reed Markham', 'father'),
('A father''s love is forever imprinted on his child''s heart.', 'Jennifer Williamson', 'father'),
('Dads are most ordinary men turned by love into heroes, adventurers, story-tellers, and singers of song.', 'Pam Brown', 'father'),
('A father is neither an anchor to hold us back nor a sail to take us there, but a guiding light whose love shows us the way.', 'Unknown', 'father'),
('The greatest gift I ever had came from God; I call him Dad!', 'Unknown', 'father'),
('A father''s smile has been known to light up a child''s entire day.', 'Susan Gale', 'father'),
('Any man can be a father, but it takes someone special to be a dad.', 'Anne Geddes', 'father'),
('A father is someone who carries pictures in his wallet where his money used to be.', 'Steve Martin', 'father'),
('The older I get, the smarter my father seems to get.', 'Tim Russert', 'father'),

-- General quotes
('The only way to do great work is to love what you do.', 'Steve Jobs', 'general'),
('Life is what happens to you while you''re busy making other plans.', 'John Lennon', 'general'),
('The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt', 'general'),
('It is during our darkest moments that we must focus to see the light.', 'Aristotle', 'general'),
('The only impossible journey is the one you never begin.', 'Tony Robbins', 'general'),
('In the end, we will remember not the words of our enemies, but the silence of our friends.', 'Martin Luther King Jr.', 'general'),
('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', 'general'),
('The only person you are destined to become is the person you decide to be.', 'Ralph Waldo Emerson', 'general'),
('Believe you can and you''re halfway there.', 'Theodore Roosevelt', 'general'),
('Don''t watch the clock; do what it does. Keep going.', 'Sam Levenson', 'general'),

-- Spiritual quotes
('The soul becomes dyed with the color of its thoughts.', 'Marcus Aurelius', 'spiritual'),
('Peace comes from within. Do not seek it without.', 'Buddha', 'spiritual'),
('The best way to find yourself is to lose yourself in the service of others.', 'Mahatma Gandhi', 'spiritual'),
('Your task is not to seek for love, but merely to seek and find all the barriers within yourself that you have built against it.', 'Rumi', 'spiritual'),
('The present moment is the only time over which we have dominion.', 'Thích Nhất Hạnh', 'spiritual'),
('What lies behind us and what lies before us are tiny matters compared to what lies within us.', 'Ralph Waldo Emerson', 'spiritual'),
('The cave you fear to enter holds the treasure you seek.', 'Joseph Campbell', 'spiritual'),
('Be yourself; everyone else is already taken.', 'Oscar Wilde', 'spiritual'),
('The only way out is through.', 'Robert Frost', 'spiritual'),
('When you realize there is nothing lacking, the whole world belongs to you.', 'Lao Tzu', 'spiritual'),

-- Additional motivational quotes
('Don''t be afraid to give up the good to go for the great.', 'John D. Rockefeller', 'general'),
('The way to get started is to quit talking and begin doing.', 'Walt Disney', 'general'),
('Innovation distinguishes between a leader and a follower.', 'Steve Jobs', 'general'),
('Life is really simple, but we insist on making it complicated.', 'Confucius', 'general'),
('If you want to lift yourself up, lift up someone else.', 'Booker T. Washington', 'general'),
('I have not failed. I''ve just found 10,000 ways that won''t work.', 'Thomas A. Edison', 'general'),
('A person who never made a mistake never tried anything new.', 'Albert Einstein', 'general'),
('The person who says it cannot be done should not interrupt the person who is doing it.', 'Chinese Proverb', 'general'),
('It does not matter how slowly you go as long as you do not stop.', 'Confucius', 'general'),
('Everything you''ve ever wanted is on the other side of fear.', 'George Addair', 'general'),

-- Success and motivation
('Success is not the key to happiness. Happiness is the key to success.', 'Albert Schweitzer', 'general'),
('The only limit to our realization of tomorrow will be our doubts of today.', 'Franklin D. Roosevelt', 'general'),
('Do something today that your future self will thank you for.', 'Sean Patrick Flanery', 'general'),
('The difference between ordinary and extraordinary is that little extra.', 'Jimmy Johnson', 'general'),
('You are never too old to set another goal or to dream a new dream.', 'C.S. Lewis', 'general'),
('The only thing standing between you and your goal is the story you keep telling yourself as to why you can''t achieve it.', 'Jordan Belfort', 'general'),
('If you want something you''ve never had, you must be willing to do something you''ve never done.', 'Thomas Jefferson', 'general'),
('The greatest glory in living lies not in never falling, but in rising every time we fall.', 'Nelson Mandela', 'general'),
('Your limitation—it''s only your imagination.', 'Unknown', 'general'),
('Great things never come from comfort zones.', 'Unknown', 'general'),

-- Wisdom and life
('The journey of a thousand miles begins with one step.', 'Lao Tzu', 'spiritual'),
('Yesterday is history, tomorrow is a mystery, today is a gift of God, which is why we call it the present.', 'Bill Keane', 'spiritual'),
('Be the change that you wish to see in the world.', 'Mahatma Gandhi', 'spiritual'),
('In three words I can sum up everything I''ve learned about life: it goes on.', 'Robert Frost', 'general'),
('Life is 10% what happens to you and 90% how you react to it.', 'Charles R. Swindoll', 'general'),
('The purpose of our lives is to be happy.', 'Dalai Lama', 'spiritual'),
('Life is short, and it''s up to you to make it sweet.', 'Sarah Louise Delany', 'general'),
('The biggest adventure you can take is to live the life of your dreams.', 'Oprah Winfrey', 'general'),
('Life is what we make it, always has been, always will be.', 'Grandma Moses', 'general'),
('Turn your wounds into wisdom.', 'Oprah Winfrey', 'general');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_motivation_quotes_category ON motivation_quotes(category);
CREATE INDEX IF NOT EXISTS idx_quote_interactions_quote_id ON quote_interactions(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_interactions_user_id ON quote_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_comments_quote_id ON quote_comments(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_comments_user_id ON quote_comments(user_id);