import { writable } from 'svelte/store'
import { supabase, makeAuthenticatedRequest } from '$lib/supabase.js'

export const selectedMood = writable(null)
export const moodHistory = writable([])

export const moods = [
  { emoji: '😊', name: 'Happy', color: 'bg-yellow-400', description: 'Feeling joyful and content' },
  { emoji: '😌', name: 'Calm', color: 'bg-blue-400', description: 'Peaceful and relaxed' },
  { emoji: '😢', name: 'Sad', color: 'bg-blue-600', description: 'Feeling down or melancholy' },
  { emoji: '😠', name: 'Angry', color: 'bg-red-500', description: 'Frustrated or irritated' },
  { emoji: '😰', name: 'Anxious', color: 'bg-purple-500', description: 'Worried or nervous' },
  { emoji: '😴', name: 'Tired', color: 'bg-gray-500', description: 'Exhausted or sleepy' },
  { emoji: '🤗', name: 'Loved', color: 'bg-pink-400', description: 'Feeling appreciated and cared for' },
  { emoji: '😤', name: 'Frustrated', color: 'bg-orange-500', description: 'Annoyed or exasperated' }
]

export const moodCategories = {
  '😊': ['Achievement', 'Love', 'Friendship', 'Success', 'Celebration'],
  '😌': ['Meditation', 'Nature', 'Rest', 'Peace', 'Mindfulness'],
  '😢': ['Loss', 'Disappointment', 'Loneliness', 'Heartbreak', 'Grief'],
  '😠': ['Injustice', 'Betrayal', 'Conflict', 'Frustration', 'Stress'],
  '😰': ['Work', 'Relationships', 'Future', 'Health', 'Performance'],
  '😴': ['Work', 'Study', 'Insomnia', 'Overwork', 'Burnout'],
  '🤗': ['Family', 'Romance', 'Friendship', 'Support', 'Gratitude'],
  '😤': ['Work', 'Technology', 'Traffic', 'Waiting', 'Miscommunication']
}

export const inspirationalQuotes = {
  '😊': [
    "Happiness is not something ready made. It comes from your own actions. - Dalai Lama",
    "The purpose of our lives is to be happy. - Dalai Lama",
    "Happiness is a choice, not a result."
  ],
  '😌': [
    "Peace comes from within. Do not seek it without. - Buddha",
    "In the midst of movement and chaos, keep stillness inside of you.",
    "Calm mind brings inner strength and self-confidence."
  ],
  '😢': [
    "The wound is the place where the Light enters you. - Rumi",
    "Tears are words that need to be written.",
    "It's okay to not be okay. Tomorrow is a new day."
  ],
  '😠': [
    "Anger is an acid that can do more harm to the vessel in which it is stored than to anything on which it is poured.",
    "For every minute you are angry you lose sixty seconds of happiness.",
    "The best fighter is never angry. - Lao Tzu"
  ],
  '😰': [
    "Anxiety is the dizziness of freedom. - Søren Kierkegaard",
    "You are braver than you believe, stronger than you seem, and smarter than you think.",
    "Breathe in peace, breathe out stress."
  ],
  '😴': [
    "Rest when you're weary. Refresh and renew yourself.",
    "Sleep is the best meditation. - Dalai Lama",
    "Take time to rest; a field that has rested gives a beautiful harvest."
  ],
  '🤗': [
    "Love is the bridge between you and everything. - Rumi",
    "Being deeply loved by someone gives you strength.",
    "Love yourself first and everything else falls into line."
  ],
  '😤': [
    "Frustration is the first step towards improvement.",
    "Every problem is a gift—without problems we would not grow.",
    "Patience is not the ability to wait, but the ability to keep a good attitude while waiting."
  ]
}

// Save mood entry to Supabase with enhanced error handling and description support
export const saveMoodEntry = async (userId, mood, moodTitle, description = null, category = null) => {
  console.log('Attempting to save mood entry:', { userId, mood, moodTitle, description, category })
  
  try {
    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required')
    }
    
    if (!mood) {
      throw new Error('Mood is required')
    }
    
    if (!moodTitle) {
      throw new Error('Mood title is required')
    }

    const moodEntryData = {
      user_id: userId,
      mood: mood,
      mood_title: moodTitle,
      description: description ? description.trim() : null,
      category: category || null
    }

    console.log('Saving mood entry data:', moodEntryData)

    const result = await makeAuthenticatedRequest(async () => {
      const { data, error } = await supabase
        .from('mood_entries')
        .insert(moodEntryData)
        .select()
        .single()
      
      if (error) {
        console.error('Database error saving mood entry:', error)
        throw error
      }
      
      return data
    })
    
    console.log('Mood entry saved successfully:', result)
    
    // Refresh mood history after successful save
    await getMoodHistory(userId)
    
    return { data: result, error: null }
  } catch (err) {
    console.error('Error saving mood entry:', err)
    return { 
      data: null, 
      error: {
        message: err.message || 'Failed to save mood entry',
        details: err
      }
    }
  }
}

// Get mood history for user with enhanced error handling
export const getMoodHistory = async (userId) => {
  console.log('Fetching mood history for user:', userId)
  
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const result = await makeAuthenticatedRequest(async () => {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Database error fetching mood history:', error)
        throw error
      }
      
      return data
    })
    
    console.log('Mood history fetch result:', result?.length || 0, 'entries')
    
    if (result) {
      moodHistory.set(result)
    }
    
    return { data: result, error: null }
  } catch (err) {
    console.error('Error fetching mood history:', err)
    return { 
      data: null, 
      error: {
        message: err.message || 'Failed to fetch mood history',
        details: err
      }
    }
  }
}