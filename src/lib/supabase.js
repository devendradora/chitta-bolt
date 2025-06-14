import { createClient } from '@supabase/supabase-js'
import { browser } from '$app/environment'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: browser,
    autoRefreshToken: browser,
    detectSessionInUrl: browser,
    storage: browser ? window.localStorage : undefined,
    storageKey: 'chitta-auth-token',
    flowType: 'pkce',
    // Set access token expiry to 24 hours (86400 seconds)
    expiryMargin: 60, // Refresh 1 minute before expiry
    refreshThreshold: 3600 // Refresh when 1 hour remaining
  },
  global: {
    headers: {
      'X-Client-Info': 'chitta-app'
    }
  },
  // Configure session settings for 24-hour expiry
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Get session from local storage immediately
export function getStoredSession() {
  if (!browser) return null
  
  try {
    const storedData = localStorage.getItem('chitta-auth-token')
    if (!storedData) return null
    
    const sessionData = JSON.parse(storedData)
    
    // Check if session is expired (24 hours = 86400 seconds)
    if (sessionData.expires_at && sessionData.expires_at * 1000 < Date.now()) {
      console.log('Stored session is expired, clearing')
      localStorage.removeItem('chitta-auth-token')
      return null
    }
    
    return sessionData
  } catch (error) {
    console.error('Error reading stored session:', error)
    localStorage.removeItem('chitta-auth-token')
    return null
  }
}

// Enhanced session management with 24-hour token support
let refreshPromise = null

export async function ensureValidSession() {
  if (!browser) return null

  try {
    // First check local storage
    const storedSession = getStoredSession()
    if (storedSession && storedSession.user) {
      console.log('Using stored session for user:', storedSession.user.id)
      return storedSession
    }

    // Get current session with timeout
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session check timeout')), 10000) // Increased from 3 seconds to 10 seconds
    )
    
    const { data: { session }, error } = await Promise.race([
      sessionPromise,
      timeoutPromise
    ])
    
    if (error) {
      console.error('Error getting session:', error)
      return null
    }

    if (!session) {
      console.log('No active session found')
      return null
    }

    // Check if token needs refresh (refresh 1 hour before expiry for 24-hour tokens)
    const expiresAt = session.expires_at * 1000
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const timeUntilExpiry = expiresAt - now

    if (timeUntilExpiry < oneHour) {
      console.log('Token expiring soon, refreshing...')
      
      if (!refreshPromise) {
        refreshPromise = refreshSession()
      }
      
      const refreshedSession = await refreshPromise
      refreshPromise = null
      return refreshedSession
    }

    return session
  } catch (err) {
    console.error('Error in ensureValidSession:', err)
    return null
  }
}

async function refreshSession() {
  try {
    console.log('Attempting to refresh session...')
    
    const refreshPromise = supabase.auth.refreshSession()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session refresh timeout')), 15000) // Increased from 5 seconds to 15 seconds
    )
    
    const { data: { session }, error } = await Promise.race([
      refreshPromise,
      timeoutPromise
    ])
    
    if (error) {
      console.error('Error refreshing session:', error)
      await supabase.auth.signOut()
      return null
    }

    if (session) {
      console.log('Session refreshed successfully')
      return session
    }

    return null
  } catch (err) {
    console.error('Error in refreshSession:', err)
    return null
  }
}

// Helper function to make authenticated requests with 24-hour session support
export async function makeAuthenticatedRequest(requestFn) {
  try {
    // Use stored session if available
    const storedSession = getStoredSession()
    
    if (storedSession && storedSession.user) {
      console.log('Using stored session for authenticated request')
      
      // Execute the request function with timeout (increased to 30 seconds)
      const requestPromise = requestFn()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000) // Increased from 20 seconds to 30 seconds
      )
      
      try {
        return await Promise.race([requestPromise, timeoutPromise])
      } catch (requestError) {
        // If request fails, try to refresh session and retry once
        if (requestError.message?.includes('JWT') || 
            requestError.message?.includes('expired') || 
            requestError.message?.includes('invalid') ||
            requestError.message?.includes('401')) {
          
          console.log('Auth error with stored session, trying fresh session...')
          const freshSession = await ensureValidSession()
          
          if (freshSession) {
            const retryPromise = requestFn()
            const retryTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Retry request timeout')), 30000) // Increased from 20 seconds to 30 seconds
            )
            
            return await Promise.race([retryPromise, retryTimeoutPromise])
          }
        }
        
        throw requestError
      }
    }
    
    // Fallback to ensuring valid session
    const session = await ensureValidSession()
    
    if (!session) {
      throw new Error('No valid session available')
    }

    // Execute the request function with timeout (increased to 30 seconds)
    const requestPromise = requestFn()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 30000) // Increased from 20 seconds to 30 seconds
    )
    
    return await Promise.race([requestPromise, timeoutPromise])
  } catch (error) {
    console.error('Error in makeAuthenticatedRequest:', error)
    throw error
  }
}