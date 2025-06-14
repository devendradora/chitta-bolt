import { writable } from 'svelte/store'
import { supabase, makeAuthenticatedRequest } from '$lib/supabase.js'

export const userAchievements = writable([])
export const availableAchievements = writable([])
export const loading = writable(false)
export const error = writable('')
export const newAchievementEarned = writable(null) // For showing celebration

// Load all available achievements
export const loadAvailableAchievements = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('achievement_nfts')
      .select('*')
      .order('achievement_type', { ascending: true })

    if (fetchError) {
      console.error('Error loading achievements:', fetchError)
      error.set(fetchError.message)
      return { data: null, error: fetchError }
    }

    availableAchievements.set(data || [])
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error loading achievements:', err)
    error.set('Failed to load achievements')
    return { data: null, error: err }
  }
}

// Load user's earned achievements
export const loadUserAchievements = async (userId) => {
  if (!userId) {
    console.log('No user ID provided')
    return { data: null, error: null }
  }

  try {
    const result = await makeAuthenticatedRequest(async () => {
      const { data, error: fetchError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement_nfts (*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })

      if (fetchError) {
        console.error('Error loading user achievements:', fetchError)
        throw fetchError
      }

      return data
    })

    userAchievements.set(result || [])
    return { data: result, error: null }
  } catch (err) {
    console.error('Error loading user achievements:', err)
    error.set('Failed to load user achievements')
    return { data: null, error: err }
  }
}

// Check if user has earned a specific achievement
export const hasAchievement = (achievementName, achievements = null) => {
  let currentAchievements = achievements
  if (!currentAchievements) {
    userAchievements.subscribe(value => currentAchievements = value)()
  }
  return currentAchievements?.some(a => a.achievement_name === achievementName) || false
}

// Mint achievement NFT
export const mintAchievementNFT = async (achievementName) => {
  loading.set(true)
  error.set('')

  try {
    console.log('Minting NFT for achievement:', achievementName)

    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('No active session')
    }

    // Call the mint NFT edge function
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mint-achievement-nft`
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ achievement_name: achievementName })
    })

    console.log('Mint NFT response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Mint NFT error:', errorText)
      throw new Error(`Failed to mint NFT: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('NFT minted successfully:', result)

    // Set the new achievement for celebration
    newAchievementEarned.set(result.achievement)

    // Refresh user achievements
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await loadUserAchievements(user.id)
    }

    return { data: result, error: null }
  } catch (err) {
    console.error('Error minting achievement NFT:', err)
    error.set(err.message || 'Failed to mint achievement NFT')
    return { data: null, error: err }
  } finally {
    loading.set(false)
  }
}

// Check and award achievements based on user progress
export const checkAchievements = async (userId, progressData) => {
  if (!userId || !progressData) return { newAchievements: [], results: [] }

  try {
    console.log('Checking achievements for user:', userId, progressData)

    // Load current achievements to avoid duplicates
    const { data: currentAchievements } = await loadUserAchievements(userId)
    const earnedAchievements = new Set(currentAchievements?.map(a => a.achievement_name) || [])

    const achievementsToMint = []

    // Check meditation achievements
    if (progressData.meditation) {
      const { totalSessions, totalMinutes, currentStreak } = progressData.meditation

      if (totalSessions >= 1 && !earnedAchievements.has('first_meditation')) {
        achievementsToMint.push('first_meditation')
      }
      if (totalSessions >= 10 && !earnedAchievements.has('meditation_total_10')) {
        achievementsToMint.push('meditation_total_10')
      }
      if (totalMinutes >= 300 && !earnedAchievements.has('meditation_hours_5')) {
        achievementsToMint.push('meditation_hours_5')
      }
      if (currentStreak >= 3 && !earnedAchievements.has('meditation_streak_3')) {
        achievementsToMint.push('meditation_streak_3')
      }
      if (currentStreak >= 7 && !earnedAchievements.has('meditation_streak_7')) {
        achievementsToMint.push('meditation_streak_7')
      }
      if (currentStreak >= 30 && !earnedAchievements.has('meditation_streak_30')) {
        achievementsToMint.push('meditation_streak_30')
      }
    }

    // Check mood achievements
    if (progressData.mood) {
      const { totalEntries, currentStreak } = progressData.mood

      if (totalEntries >= 1 && !earnedAchievements.has('first_mood')) {
        achievementsToMint.push('first_mood')
      }
      if (totalEntries >= 7 && !earnedAchievements.has('mood_entries_7')) {
        achievementsToMint.push('mood_entries_7')
      }
      if (totalEntries >= 30 && !earnedAchievements.has('mood_entries_30')) {
        achievementsToMint.push('mood_entries_30')
      }
      if (currentStreak >= 7 && !earnedAchievements.has('mood_streak_7')) {
        achievementsToMint.push('mood_streak_7')
      }
    }

    // Check chat achievements
    if (progressData.chat) {
      const { totalMessages } = progressData.chat

      if (totalMessages >= 1 && !earnedAchievements.has('first_chat')) {
        achievementsToMint.push('first_chat')
      }
      if (totalMessages >= 25 && !earnedAchievements.has('chat_messages_25')) {
        achievementsToMint.push('chat_messages_25')
      }
      if (totalMessages >= 100 && !earnedAchievements.has('chat_messages_100')) {
        achievementsToMint.push('chat_messages_100')
      }
    }

    // Check motivation achievements
    if (progressData.motivation) {
      const { totalLikes } = progressData.motivation

      if (totalLikes >= 1 && !earnedAchievements.has('first_quote_like')) {
        achievementsToMint.push('first_quote_like')
      }
      if (totalLikes >= 10 && !earnedAchievements.has('quote_likes_10')) {
        achievementsToMint.push('quote_likes_10')
      }
    }

    // Check overall wellness achievements
    if (progressData.overall) {
      const { consecutiveDays } = progressData.overall

      if (consecutiveDays >= 7 && !earnedAchievements.has('wellness_week')) {
        achievementsToMint.push('wellness_week')
      }
      if (consecutiveDays >= 30 && !earnedAchievements.has('wellness_month')) {
        achievementsToMint.push('wellness_month')
      }
    }

    // Mint new achievements (only if wallet is connected)
    const results = []
    for (const achievementName of achievementsToMint) {
      console.log('Attempting to mint achievement:', achievementName)
      const result = await mintAchievementNFT(achievementName)
      results.push({ achievementName, result })
    }

    return { newAchievements: achievementsToMint, results }
  } catch (err) {
    console.error('Error checking achievements:', err)
    return { newAchievements: [], results: [] }
  }
}

// Get achievement progress for display
export const getAchievementProgress = (achievementName, progressData) => {
  const progressMap = {
    // Meditation achievements
    'first_meditation': progressData.meditation?.totalSessions || 0,
    'meditation_total_10': progressData.meditation?.totalSessions || 0,
    'meditation_hours_5': progressData.meditation?.totalMinutes || 0,
    'meditation_streak_3': progressData.meditation?.currentStreak || 0,
    'meditation_streak_7': progressData.meditation?.currentStreak || 0,
    'meditation_streak_30': progressData.meditation?.currentStreak || 0,
    
    // Mood achievements
    'first_mood': progressData.mood?.totalEntries || 0,
    'mood_entries_7': progressData.mood?.totalEntries || 0,
    'mood_entries_30': progressData.mood?.totalEntries || 0,
    'mood_streak_7': progressData.mood?.currentStreak || 0,
    
    // Chat achievements
    'first_chat': progressData.chat?.totalMessages || 0,
    'chat_messages_25': progressData.chat?.totalMessages || 0,
    'chat_messages_100': progressData.chat?.totalMessages || 0,
    
    // Motivation achievements
    'first_quote_like': progressData.motivation?.totalLikes || 0,
    'quote_likes_10': progressData.motivation?.totalLikes || 0,
    
    // Overall achievements
    'wellness_week': progressData.overall?.consecutiveDays || 0,
    'wellness_month': progressData.overall?.consecutiveDays || 0,
  }

  return progressMap[achievementName] || 0
}

// Clear new achievement notification
export const clearNewAchievement = () => {
  newAchievementEarned.set(null)
}

// Check achievements automatically when user completes activities
export const autoCheckAchievements = async (userId, activityType, activityData) => {
  // This function can be called from other parts of the app
  // when users complete activities (meditation, mood entry, etc.)
  
  if (!userId) return

  try {
    // Build progress data based on activity type
    let progressData = {}
    
    switch (activityType) {
      case 'meditation':
        progressData.meditation = activityData
        break
      case 'mood':
        progressData.mood = activityData
        break
      case 'chat':
        progressData.chat = activityData
        break
      case 'motivation':
        progressData.motivation = activityData
        break
      default:
        return
    }

    const result = await checkAchievements(userId, progressData)
    
    if (result.newAchievements.length > 0) {
      console.log('Auto-check found new achievements:', result.newAchievements)
    }
    
    return result
  } catch (error) {
    console.error('Error in auto-check achievements:', error)
    return { newAchievements: [], results: [] }
  }
}