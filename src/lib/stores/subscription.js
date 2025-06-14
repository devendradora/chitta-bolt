import { writable } from 'svelte/store'
import { user } from './auth.js'
import { browser } from '$app/environment'

export const subscriptionStatus = writable({
  isActive: false,
  isPremium: false,
  isTrialActive: false,
  trialDaysLeft: 0,
  planType: 'free',
  expiresAt: null,
  features: {
    customMusicUpload: false,
    unlimitedAIChat: false,
    unlimitedMotivationQuotes: false,
    advancedAnalytics: false,
    exportData: false,
    tavusVideoAgent: false,
    quizFlashcards: false
  }
})

export const dailyUsage = writable({
  aiChatMessages: 0,
  motivationQuotesViewed: 0,
  lastResetDate: null
})

// Free tier limits
export const FREE_LIMITS = {
  aiChatMessages: 10, // 10 messages per day
  motivationQuotes: 3, // 3 quotes per day
  meditationStreak: 7 // Need 7-day streak for custom music
}

// Premium features
export const PREMIUM_FEATURES = {
  customMusicUpload: true,
  unlimitedAIChat: true,
  unlimitedMotivationQuotes: true,
  advancedAnalytics: true,
  exportData: true,
  prioritySupport: true,
  tavusVideoAgent: true,
  quizFlashcards: true
}

// Initialize subscription status
export function initializeSubscription() {
  if (!browser) return

  // Check if user has active trial or subscription
  const trialStartDate = localStorage.getItem('chitta-trial-start')
  const subscriptionData = localStorage.getItem('chitta-subscription')
  
  if (subscriptionData) {
    try {
      const subscription = JSON.parse(subscriptionData)
      subscriptionStatus.set(subscription)
    } catch (error) {
      console.error('Error parsing subscription data:', error)
    }
  } else if (trialStartDate) {
    // Check trial status
    const trialStart = new Date(trialStartDate)
    const now = new Date()
    const daysSinceStart = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24))
    const trialDaysLeft = Math.max(0, 7 - daysSinceStart)
    
    if (trialDaysLeft > 0) {
      subscriptionStatus.set({
        isActive: true,
        isPremium: false,
        isTrialActive: true,
        trialDaysLeft,
        planType: 'trial',
        expiresAt: new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        features: PREMIUM_FEATURES
      })
    } else {
      // Trial expired
      subscriptionStatus.set({
        isActive: false,
        isPremium: false,
        isTrialActive: false,
        trialDaysLeft: 0,
        planType: 'free',
        expiresAt: null,
        features: {
          customMusicUpload: false,
          unlimitedAIChat: false,
          unlimitedMotivationQuotes: false,
          advancedAnalytics: false,
          exportData: false,
          tavusVideoAgent: false,
          quizFlashcards: false
        }
      })
    }
  }

  // Initialize daily usage
  initializeDailyUsage()
}

function initializeDailyUsage() {
  const today = new Date().toDateString()
  const storedUsage = localStorage.getItem('chitta-daily-usage')
  
  if (storedUsage) {
    try {
      const usage = JSON.parse(storedUsage)
      
      // Reset if it's a new day
      if (usage.lastResetDate !== today) {
        const resetUsage = {
          aiChatMessages: 0,
          motivationQuotesViewed: 0,
          lastResetDate: today
        }
        dailyUsage.set(resetUsage)
        localStorage.setItem('chitta-daily-usage', JSON.stringify(resetUsage))
      } else {
        dailyUsage.set(usage)
      }
    } catch (error) {
      console.error('Error parsing daily usage:', error)
      resetDailyUsage()
    }
  } else {
    resetDailyUsage()
  }
}

function resetDailyUsage() {
  const today = new Date().toDateString()
  const usage = {
    aiChatMessages: 0,
    motivationQuotesViewed: 0,
    lastResetDate: today
  }
  dailyUsage.set(usage)
  localStorage.setItem('chitta-daily-usage', JSON.stringify(usage))
}

// Start free trial
export function startFreeTrial() {
  if (!browser) return false

  const trialStartDate = localStorage.getItem('chitta-trial-start')
  if (trialStartDate) {
    console.log('Trial already started')
    return false
  }

  const now = new Date()
  localStorage.setItem('chitta-trial-start', now.toISOString())
  
  subscriptionStatus.set({
    isActive: true,
    isPremium: false,
    isTrialActive: true,
    trialDaysLeft: 7,
    planType: 'trial',
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    features: PREMIUM_FEATURES
  })

  return true
}

// Check if feature is available
export function canUseFeature(featureName) {
  let currentStatus
  subscriptionStatus.subscribe(status => currentStatus = status)()
  
  return currentStatus.features[featureName] || false
}

// Check daily usage limits
export function canUseService(serviceName) {
  let currentStatus, currentUsage
  subscriptionStatus.subscribe(status => currentStatus = status)()
  dailyUsage.subscribe(usage => currentUsage = usage)()

  // Premium users have unlimited access
  if (currentStatus.isPremium || currentStatus.isTrialActive) {
    return { allowed: true, remaining: 'unlimited' }
  }

  // Check free tier limits
  switch (serviceName) {
    case 'aiChat':
      const chatRemaining = FREE_LIMITS.aiChatMessages - currentUsage.aiChatMessages
      return {
        allowed: chatRemaining > 0,
        remaining: Math.max(0, chatRemaining),
        limit: FREE_LIMITS.aiChatMessages
      }
    
    case 'motivationQuotes':
      const quotesRemaining = FREE_LIMITS.motivationQuotes - currentUsage.motivationQuotesViewed
      return {
        allowed: quotesRemaining > 0,
        remaining: Math.max(0, quotesRemaining),
        limit: FREE_LIMITS.motivationQuotes
      }
    
    default:
      return { allowed: true, remaining: 'unlimited' }
  }
}

// Increment usage
export function incrementUsage(serviceName) {
  if (!browser) return

  dailyUsage.update(usage => {
    const newUsage = { ...usage }
    
    switch (serviceName) {
      case 'aiChat':
        newUsage.aiChatMessages += 1
        break
      case 'motivationQuotes':
        newUsage.motivationQuotesViewed += 1
        break
    }
    
    localStorage.setItem('chitta-daily-usage', JSON.stringify(newUsage))
    return newUsage
  })
}

// Open RevenueCat subscription page
export function openSubscriptionPage() {
  // In a real implementation, this would integrate with RevenueCat
  // For now, we'll open the RevenueCat dashboard
  window.open('https://app.revenuecat.com/overview', '_blank')
}

// Simulate subscription purchase (for demo)
export function simulateSubscriptionPurchase(planType = 'premium') {
  if (!browser) return

  const now = new Date()
  const subscription = {
    isActive: true,
    isPremium: true,
    isTrialActive: false,
    trialDaysLeft: 0,
    planType,
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
    features: PREMIUM_FEATURES
  }

  subscriptionStatus.set(subscription)
  localStorage.setItem('chitta-subscription', JSON.stringify(subscription))
}

// Initialize when user changes
if (browser) {
  user.subscribe(currentUser => {
    if (currentUser) {
      initializeSubscription()
    }
  })
}