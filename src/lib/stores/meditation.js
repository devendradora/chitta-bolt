import { writable } from 'svelte/store'
import { supabase, makeAuthenticatedRequest } from '$lib/supabase.js'

export const meditationSession = writable(null)
export const meditationHistory = writable([])

export const predefinedDurations = [3, 6, 9, 15, 24, 39]

export const musicOptions = [
  { 
    name: 'Silence', 
    value: 'silence', 
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-50',
    description: 'Pure silence for deep focus',
    gradient: 'from-gray-500 to-slate-600'
  },
  { 
    name: 'Nature Sounds', 
    value: 'nature', 
    color: 'from-green-400 to-emerald-600',
    bgColor: 'bg-green-50',
    description: 'Forest, rain, and ocean sounds',
    gradient: 'from-green-400 to-emerald-600'
  },
  { 
    name: 'Ambient Music', 
    value: 'ambient', 
    color: 'from-blue-400 to-indigo-600',
    bgColor: 'bg-blue-50',
    description: 'Soft instrumental melodies',
    gradient: 'from-blue-400 to-indigo-600'
  },
  { 
    name: 'Binaural Beats', 
    value: 'binaural', 
    color: 'from-purple-400 to-violet-600',
    bgColor: 'bg-purple-50',
    description: 'Frequency-based meditation aid',
    gradient: 'from-purple-400 to-violet-600'
  },
  { 
    name: 'Tibetan Bowls', 
    value: 'bowls', 
    color: 'from-orange-400 to-amber-600',
    bgColor: 'bg-orange-50',
    description: 'Traditional singing bowls',
    gradient: 'from-orange-400 to-amber-600'
  },
  { 
    name: 'White Noise', 
    value: 'whitenoise', 
    color: 'from-slate-400 to-gray-600',
    bgColor: 'bg-slate-50',
    description: 'Consistent background noise',
    gradient: 'from-slate-400 to-gray-600'
  },
  { 
    name: 'Custom Upload', 
    value: 'custom', 
    color: 'from-pink-400 to-rose-600',
    bgColor: 'bg-pink-50',
    description: 'Upload your own audio file',
    gradient: 'from-pink-400 to-rose-600'
  }
]

export const backgroundThemes = [
  { name: 'Nature', value: 'nature', gradient: 'from-green-400 to-emerald-600' },
  { name: 'Ocean', value: 'ocean', gradient: 'from-blue-400 to-cyan-600' },
  { name: 'Sunset', value: 'sunset', gradient: 'from-orange-400 to-pink-600' },
  { name: 'Forest', value: 'forest', gradient: 'from-emerald-500 to-green-700' },
  { name: 'Mountain', value: 'mountain', gradient: 'from-slate-400 to-gray-600' },
  { name: 'Space', value: 'space', gradient: 'from-indigo-600 to-purple-800' }
]

// Mood-based background gradients
export const moodBackgrounds = {
  '😊': 'from-yellow-400 via-orange-400 to-pink-500', // Happy - warm, bright colors
  '😌': 'from-blue-400 via-cyan-400 to-teal-500', // Calm - cool, peaceful colors
  '😢': 'from-blue-600 via-indigo-600 to-purple-700', // Sad - deeper, cooler tones
  '😠': 'from-red-500 via-orange-600 to-yellow-600', // Angry - fiery colors
  '😰': 'from-purple-500 via-violet-600 to-indigo-700', // Anxious - intense purples
  '😴': 'from-gray-500 via-slate-600 to-gray-700', // Tired - muted, restful colors
  '🤗': 'from-pink-400 via-rose-500 to-red-500', // Loved - warm, loving colors
  '😤': 'from-orange-500 via-red-500 to-pink-600' // Frustrated - energetic colors
}

// Save meditation session to Supabase with enhanced error handling
export const saveMeditationSession = async (sessionData) => {
  console.log('Attempting to save meditation session:', sessionData)
  
  try {
    if (!sessionData.user_id) {
      throw new Error('User ID is required')
    }

    // Validate required fields
    if (typeof sessionData.duration_minutes !== 'number' || sessionData.duration_minutes <= 0) {
      throw new Error('Valid duration is required')
    }

    const sessionToSave = {
      user_id: sessionData.user_id,
      duration_minutes: sessionData.duration_minutes,
      actual_duration_seconds: sessionData.actual_duration_seconds || 0,
      background_theme: sessionData.background_theme || 'nature',
      background_music: sessionData.background_music || 'silence',
      mood_before: sessionData.mood_before || null,
      mood_after: sessionData.mood_after || null,
      notes: sessionData.notes || null,
      completed: sessionData.completed || false
    }

    console.log('Saving session data:', sessionToSave)

    const result = await makeAuthenticatedRequest(async () => {
      const { data, error } = await supabase
        .from('meditation_sessions')
        .insert(sessionToSave)
        .select()
        .single()
      
      if (error) {
        console.error('Database error saving meditation session:', error)
        throw error
      }
      
      return data
    })
    
    console.log('Meditation session saved successfully:', result)
    
    // Refresh meditation history after successful save
    await getMeditationHistory(sessionData.user_id)
    
    return { data: result, error: null }
  } catch (err) {
    console.error('Error saving meditation session:', err)
    return { 
      data: null, 
      error: {
        message: err.message || 'Failed to save meditation session',
        details: err
      }
    }
  }
}

// Get meditation history for user with enhanced error handling
export const getMeditationHistory = async (userId) => {
  console.log('Fetching meditation history for user:', userId)
  
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const result = await makeAuthenticatedRequest(async () => {
      const { data, error } = await supabase
        .from('meditation_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Database error fetching meditation history:', error)
        throw error
      }
      
      return data
    })
    
    console.log('Meditation history fetch result:', result?.length || 0, 'sessions')
    
    if (result) {
      meditationHistory.set(result)
    }
    
    return { data: result, error: null }
  } catch (err) {
    console.error('Error fetching meditation history:', err)
    return { 
      data: null, 
      error: {
        message: err.message || 'Failed to fetch meditation history',
        details: err
      }
    }
  }
}