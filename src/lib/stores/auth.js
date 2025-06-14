import { writable } from 'svelte/store'
import { supabase, getStoredSession, makeAuthenticatedRequest } from '$lib/supabase.js'
import { browser } from '$app/environment'

export const user = writable(null)
export const loading = writable(true)
export const sessionError = writable(null)

let sessionCheckInterval = null
let isInitialized = false
let initTimeout = null

// Initialize auth state with local storage priority
async function initializeAuth() {
  if (isInitialized) return

  console.log('Starting auth initialization...')
  
  // Set a timeout to prevent infinite loading
  initTimeout = setTimeout(() => {
    console.log('Auth initialization timeout - showing login page')
    user.set(null)
    sessionError.set(null)
    loading.set(false)
    isInitialized = true
  }, 15000) // Increased from 5 seconds to 15 seconds
  
  try {
    loading.set(true)
    sessionError.set(null)
    
    // First, check local storage for existing session
    const storedSession = getStoredSession()
    
    if (storedSession && storedSession.user) {
      console.log('Found valid stored session, setting user immediately')
      user.set(storedSession.user)
      sessionError.set(null)
      loading.set(false)
      isInitialized = true
      
      // Clear timeout since we found a session
      if (initTimeout) {
        clearTimeout(initTimeout)
        initTimeout = null
      }
      
      // Validate session in background
      validateStoredSession(storedSession)
      return
    }
    
    console.log('No valid stored session, checking with Supabase...')
    
    // Get current session from Supabase with timeout
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session check timeout')), 10000) // Increased from 3 seconds to 10 seconds
    )
    
    const { data: { session }, error: getSessionError } = await Promise.race([
      sessionPromise,
      timeoutPromise
    ])
    
    if (getSessionError) {
      console.error('Session error:', getSessionError)
      throw getSessionError
    }
    
    if (session?.user) {
      console.log('Valid session found from Supabase, user:', session.user.id)
      console.log('User metadata from session:', session.user.user_metadata) // Debug log for user metadata
      
      // Validate session is not expired
      const now = Date.now()
      const expiresAt = session.expires_at * 1000
      
      if (now < expiresAt) {
        user.set(session.user)
        sessionError.set(null)
        
        // Ensure user profile exists (with timeout)
        try {
          await Promise.race([
            ensureUserProfile(session.user),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile check timeout')), 10000) // Increased from 2 seconds to 10 seconds
            )
          ])
        } catch (profileError) {
          console.warn('Profile check failed, continuing anyway:', profileError)
        }
        
        // Start session monitoring
        startSessionMonitoring()
        
        console.log('Auth initialization successful with user')
      } else {
        console.log('Session expired, clearing user')
        user.set(null)
        await supabase.auth.signOut()
      }
    } else {
      console.log('No valid session found, user not authenticated')
      user.set(null)
      sessionError.set(null)
    }
    
    isInitialized = true
    console.log('Auth initialization completed')
  } catch (error) {
    console.error('Error initializing auth:', error)
    
    // Don't show error for timeout - just show login
    if (error.message === 'Session check timeout' || error.message === 'Profile check timeout') {
      console.log('Auth timeout - showing login page')
      user.set(null)
      sessionError.set(null)
    } else {
      sessionError.set(error.message)
      user.set(null)
    }
    
    isInitialized = true
  } finally {
    if (initTimeout) {
      clearTimeout(initTimeout)
      initTimeout = null
    }
    loading.set(false)
  }
}

// Validate stored session in background
async function validateStoredSession(storedSession) {
  try {
    console.log('Validating stored session in background...')
    
    // Try to get fresh session data with timeout
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Background validation timeout')), 15000) // Increased from 5 seconds to 15 seconds
    )
    
    const { data: { session }, error } = await Promise.race([
      sessionPromise,
      timeoutPromise
    ])
    
    if (error || !session) {
      console.log('Stored session is invalid, signing out')
      await supabase.auth.signOut()
      user.set(null)
      return
    }
    
    // Update user if session data changed
    if (session.user.id === storedSession.user.id) {
      console.log('Session validated successfully')
      user.set(session.user)
      
      // Ensure user profile exists
      try {
        await ensureUserProfile(session.user)
      } catch (profileError) {
        console.warn('Profile check failed during validation:', profileError)
      }
      
      startSessionMonitoring()
    }
  } catch (error) {
    console.error('Error validating stored session:', error)
    // Don't sign out on validation errors, keep the stored session
  }
}

// Ensure user profile exists in database
async function ensureUserProfile(authUser) {
  try {
    console.log('Ensuring user profile exists for:', authUser.id)
    console.log('User metadata:', authUser.user_metadata)
    
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .single()

    if (fetchError && fetchError.code === 'PGRST116') {
      // User doesn't exist, create profile
      console.log('Creating user profile for:', authUser.id)
      
      // Extract name from user_metadata - handle different formats from different providers
      const fullName = 
        authUser.user_metadata?.full_name || 
        authUser.user_metadata?.name || 
        authUser.user_metadata?.user_name || 
        '';
      
      // Extract avatar URL - handle different formats from different providers
      const avatarUrl = 
        authUser.user_metadata?.avatar_url || 
        authUser.user_metadata?.picture || 
        authUser.user_metadata?.profile_image || 
        null;
      
      console.log('Extracted profile data:', { 
        fullName, 
        avatarUrl, 
        email: authUser.email 
      })
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: fullName,
          avatar_url: avatarUrl
        })

      if (insertError) {
        console.error('Error creating user profile:', insertError)
        throw insertError
      } else {
        console.log('User profile created successfully')
      }
    } else if (fetchError) {
      console.error('Error checking user profile:', fetchError)
      throw fetchError
    } else {
      console.log('User profile already exists:', existingUser.id)
    }
  } catch (error) {
    console.error('Error in ensureUserProfile:', error)
    throw error
  }
}

// Listen for auth changes with enhanced error handling
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state change:', event, session?.user?.id)
  
  try {
    if (event === 'SIGNED_IN' && session?.user) {
      console.log('User metadata from SIGNED_IN event:', session.user.user_metadata) // Debug log
      user.set(session.user)
      sessionError.set(null)
      
      // Try to ensure user profile, but don't block on it
      try {
        await ensureUserProfile(session.user)
      } catch (profileError) {
        console.warn('Profile creation failed, continuing anyway:', profileError)
      }
      
      // Start session monitoring
      startSessionMonitoring()
    } else if (event === 'SIGNED_OUT') {
      user.set(null)
      sessionError.set(null)
      stopSessionMonitoring()
      isInitialized = false
    } else if (event === 'TOKEN_REFRESHED' && session?.user) {
      console.log('Token refreshed successfully')
      user.set(session.user)
      sessionError.set(null)
    } else if (event === 'USER_UPDATED' && session?.user) {
      user.set(session.user)
    } else if (event === 'INITIAL_SESSION') {
      console.log('Initial session event received, session:', session?.user?.id || 'undefined')
      
      if (session?.user) {
        // User is authenticated
        console.log('User metadata from INITIAL_SESSION event:', session.user.user_metadata) // Debug log
        user.set(session.user)
        sessionError.set(null)
        
        // Try to ensure user profile, but don't block
        try {
          await ensureUserProfile(session.user)
        } catch (profileError) {
          console.warn('Profile check failed during initial session:', profileError)
        }
        
        startSessionMonitoring()
      } else {
        // No session - show login page
        console.log('No session found, showing login page')
        user.set(null)
        sessionError.set(null)
      }
      
      isInitialized = true
      loading.set(false)
      return // Don't set loading again below
    }
  } catch (error) {
    console.error('Error in auth state change handler:', error)
    // Don't set session error for minor issues
    console.warn('Auth state change error, continuing:', error.message)
  }
  
  // Always set loading to false after handling auth state changes
  if (isInitialized) {
    loading.set(false)
  }
})

// Start session monitoring with longer intervals
function startSessionMonitoring() {
  if (sessionCheckInterval) return
  
  // Check session every 30 minutes
  sessionCheckInterval = setInterval(async () => {
    try {
      // Use stored session first
      const storedSession = getStoredSession()
      if (!storedSession) {
        console.log('No stored session, signing out...')
        await signOut()
      }
    } catch (error) {
      console.error('Session monitoring error:', error)
      // Don't set session error for monitoring issues
      console.warn('Session monitoring failed, will retry next interval')
    }
  }, 30 * 60 * 1000) // Check every 30 minutes
}

// Stop session monitoring
function stopSessionMonitoring() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval)
    sessionCheckInterval = null
  }
}

// Enhanced sign up with better error handling
export const signUp = async (email, password, fullName) => {
  console.log('Attempting signup for:', email)
  
  try {
    loading.set(true)
    sessionError.set(null)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: window.location.origin
      }
    })
    
    console.log('Signup result:', { data, error })
    
    if (error) {
      sessionError.set(error.message)
    }
    
    return { data, error }
  } catch (err) {
    console.error('Signup error:', err)
    sessionError.set(err.message)
    return { data: null, error: err }
  } finally {
    loading.set(false)
  }
}

// Enhanced sign in with session validation
export const signIn = async (email, password) => {
  console.log('Attempting signin for:', email)
  
  try {
    loading.set(true)
    sessionError.set(null)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('Signin result:', { data, error })
    
    if (error) {
      sessionError.set(error.message)
    } else if (data.session) {
      // Validate the new session with timeout
      try {
        const storedSession = getStoredSession()
        if (!storedSession) {
          console.warn('Session not stored properly after signin')
        }
      } catch (validationError) {
        console.warn('Session validation failed, continuing anyway:', validationError)
      }
    }
    
    return { data, error }
  } catch (err) {
    console.error('Signin error:', err)
    sessionError.set(err.message)
    return { data: null, error: err }
  } finally {
    loading.set(false)
  }
}

// Enhanced sign out
export const signOut = async () => {
  try {
    loading.set(true)
    stopSessionMonitoring()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      sessionError.set(error.message)
    } else {
      user.set(null)
      sessionError.set(null)
      isInitialized = false
    }
    
    return { error }
  } catch (err) {
    console.error('Sign out error:', err)
    sessionError.set(err.message)
    return { error: err }
  } finally {
    loading.set(false)
  }
}

// Helper function for making authenticated database requests
export const makeAuthenticatedDbRequest = async (requestFn) => {
  return makeAuthenticatedRequest(requestFn)
}

// Initialize auth on module load (only in browser)
if (browser) {
  // Check local storage immediately
  const storedSession = getStoredSession()
  
  if (storedSession && storedSession.user) {
    console.log('Found stored session on module load, setting user immediately')
    user.set(storedSession.user)
    loading.set(false)
    isInitialized = true
    
    // Validate in background
    setTimeout(() => validateStoredSession(storedSession), 100)
  } else {
    // Set a small delay to allow the auth listener to set up first
    setTimeout(() => {
      if (!isInitialized) {
        console.log('Fallback auth initialization after 1 second')
        initializeAuth()
      }
    }, 1000)
  }
}