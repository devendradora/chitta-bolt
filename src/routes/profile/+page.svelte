<script>
  import { user, loading as authLoading, sessionError, makeAuthenticatedDbRequest } from '$lib/stores/auth.js'
  import { subscriptionStatus, openSubscriptionPage, simulateSubscriptionPurchase } from '$lib/stores/subscription.js'
  import { supabase } from '$lib/supabase.js'
  import { 
    ArrowLeft, 
    User, 
    Mail, 
    Calendar, 
    Settings, 
    LogOut, 
    Edit3, 
    Save, 
    X,
    Heart,
    Brain,
    MessageCircle,
    Sparkles,
    Trophy,
    Target,
    Clock,
    TrendingUp,
    Crown,
    Gift,
    Star
  } from '@lucide/svelte'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  let userProfile = null
  let loading = true
  let editing = false
  let editForm = {
    full_name: '',
    email: ''
  }
  let saving = false
  let error = ''
  let success = ''
  let stats = {
    totalMeditations: 0,
    totalMeditationMinutes: 0,
    moodEntries: 0,
    chatMessages: 0,
    quoteLikes: 0,
    quoteComments: 0,
    currentStreak: 0,
    longestStreak: 0
  }

  onMount(async () => {
    console.log('Profile page mounted')
    
    // Wait for auth to initialize
    if ($authLoading) {
      console.log('Waiting for auth to initialize...')
      const unsubscribe = authLoading.subscribe(isLoading => {
        if (!isLoading) {
          unsubscribe()
          initializeProfile()
        }
      })
    } else {
      initializeProfile()
    }
  })

  async function initializeProfile() {
    if ($sessionError) {
      error = $sessionError
      loading = false
      return
    }

    if (!$user) {
      error = 'Please sign in to view your profile'
      loading = false
      return
    }

    console.log('Initializing profile for user:', $user.id)
    console.log('User metadata:', $user.user_metadata)
    await loadUserProfile()
    await loadUserStats()
  }

  async function loadUserProfile() {
    if (!$user) {
      loading = false
      error = 'Please sign in to view your profile'
      return
    }

    try {
      console.log('Loading profile for user:', $user.id)
      
      const profileData = await makeAuthenticatedDbRequest(async () => {
        const { data, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', $user.id)
          .single()

        if (profileError) {
          throw profileError
        }
        return data
      })

      userProfile = profileData
      editForm = {
        full_name: profileData.full_name || '',
        email: profileData.email || ''
      }
      
      console.log('Profile loaded successfully:', profileData)
    } catch (err) {
      console.error('Error loading profile:', err)
      
      // If user doesn't exist in users table, create them
      if (err.code === 'PGRST116') {
        console.log('User not found in users table, creating...')
        try {
          // Extract name from user_metadata - handle different formats from different providers
          const fullName = 
            $user.user_metadata?.full_name || 
            $user.user_metadata?.name || 
            $user.user_metadata?.user_name || 
            '';
          
          // Extract avatar URL - handle different formats from different providers
          const avatarUrl = 
            $user.user_metadata?.avatar_url || 
            $user.user_metadata?.picture || 
            $user.user_metadata?.profile_image || 
            null;
            
          console.log('Creating user with data:', { 
            id: $user.id, 
            email: $user.email, 
            fullName, 
            avatarUrl 
          })

          const newUserData = await makeAuthenticatedDbRequest(async () => {
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                id: $user.id,
                email: $user.email,
                full_name: fullName,
                avatar_url: avatarUrl
              })
              .select()
              .single()

            if (createError) {
              throw createError
            }
            return newUser
          })

          userProfile = newUserData
          editForm = {
            full_name: newUserData.full_name || '',
            email: newUserData.email || ''
          }
          console.log('User profile created successfully:', newUserData)
        } catch (createErr) {
          console.error('Error creating user profile:', createErr)
          error = 'Failed to create user profile'
        }
      } else {
        error = 'Failed to load profile'
      }
    } finally {
      loading = false
    }
  }

  async function loadUserStats() {
    if (!$user) return

    try {
      console.log('Loading stats for user:', $user.id)

      // Load all stats with individual error handling
      const [meditations, moodCount, chatCount, interactions, commentsCount] = await Promise.allSettled([
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('meditation_sessions')
            .select('duration_minutes, created_at')
            .eq('user_id', $user.id)
        ),
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('mood_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', $user.id)
        ),
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('chat_conversations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', $user.id)
        ),
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('quote_interactions')
            .select('interaction_type')
            .eq('user_id', $user.id)
        ),
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('quote_comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', $user.id)
        )
      ])

      // Process results with fallbacks
      const meditationData = meditations.status === 'fulfilled' ? meditations.value.data : []
      const moodCountData = moodCount.status === 'fulfilled' ? moodCount.value.count : 0
      const chatCountData = chatCount.status === 'fulfilled' ? chatCount.value.count : 0
      const interactionData = interactions.status === 'fulfilled' ? interactions.value.data : []
      const commentsCountData = commentsCount.status === 'fulfilled' ? commentsCount.value.count : 0

      // Calculate stats
      const totalMeditations = meditationData?.length || 0
      const totalMinutes = meditationData?.reduce((sum, m) => sum + (m.duration_minutes || 0), 0) || 0
      const quoteLikes = interactionData?.filter(i => i.interaction_type === 'like').length || 0
      const streak = calculateMeditationStreak(meditationData || [])

      stats = {
        totalMeditations,
        totalMeditationMinutes: totalMinutes,
        moodEntries: moodCountData || 0,
        chatMessages: chatCountData || 0,
        quoteLikes,
        quoteComments: commentsCountData || 0,
        currentStreak: streak.current,
        longestStreak: streak.longest
      }

      console.log('Stats loaded:', stats)
    } catch (err) {
      console.error('Error loading stats:', err)
      // Don't show error for stats, just use defaults
    }
  }

  function calculateMeditationStreak(meditations) {
    if (!meditations || meditations.length === 0) {
      return { current: 0, longest: 0 }
    }

    // Sort by date
    const sortedDates = meditations
      .map(m => new Date(m.created_at).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
      .sort((a, b) => new Date(b) - new Date(a))

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    // Check if streak is still active
    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      currentStreak = 1
      tempStreak = 1

      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i])
        const previousDate = new Date(sortedDates[i - 1])
        const diffDays = (previousDate - currentDate) / (1000 * 60 * 60 * 24)

        if (diffDays === 1) {
          currentStreak++
          tempStreak++
        } else {
          break
        }
      }
    }

    // Calculate longest streak
    tempStreak = 1
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i])
      const previousDate = new Date(sortedDates[i - 1])
      const diffDays = (previousDate - currentDate) / (1000 * 60 * 60 * 24)

      if (diffDays === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    return { current: currentStreak, longest: longestStreak }
  }

  function startEditing() {
    editing = true
    editForm = {
      full_name: userProfile?.full_name || '',
      email: userProfile?.email || ''
    }
  }

  function cancelEditing() {
    editing = false
    error = ''
    success = ''
  }

  async function saveProfile() {
    if (!editForm.full_name.trim()) {
      error = 'Full name is required'
      return
    }

    saving = true
    error = ''
    success = ''

    try {
      const updatedProfile = await makeAuthenticatedDbRequest(async () => {
        const { data, error: updateError } = await supabase
          .from('users')
          .update({
            full_name: editForm.full_name.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', $user.id)
          .select()
          .single()

        if (updateError) {
          throw updateError
        }
        return data
      })

      userProfile = updatedProfile
      editing = false
      success = 'Profile updated successfully!'
      setTimeout(() => success = '', 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      error = err.message || 'An unexpected error occurred'
    } finally {
      saving = false
    }
  }

  async function handleSignOut() {
    const { signOut } = await import('$lib/stores/auth.js')
    const { error: signOutError } = await signOut()
    if (!signOutError) {
      goto('/')
    }
  }

  function formatJoinDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function getInitials(name) {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function formatDuration(minutes) {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  function handleSubscribe() {
    openSubscriptionPage()
  }

  function handleSimulateSubscription() {
    simulateSubscriptionPurchase()
    success = 'Premium subscription activated! (Demo mode)'
    setTimeout(() => success = '', 3000)
  }
</script>

<svelte:head>
  <title>Profile - Chitta</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <button 
      on:click={() => goto('/')} 
      class="p-3 rounded-2xl hover:bg-white/70 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <ArrowLeft size={24} class="text-gray-600" />
    </button>
    <h1 class="text-2xl font-bold text-gray-800">Profile</h1>
    <div class="w-12"></div>
  </div>

  {#if loading || $authLoading}
    <div class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  {:else if error && !userProfile}
    <div class="text-center py-20">
      <p class="text-red-600 mb-4">{error}</p>
      <button 
        on:click={() => goto('/')}
        class="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
      >
        Go Home
      </button>
    </div>
  {:else}
    <div class="space-y-8 max-w-2xl mx-auto">
      <!-- Subscription Status Card -->
      {#if $subscriptionStatus.isTrialActive}
        <div class="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl p-6 text-white shadow-lg">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Gift size={32} class="text-white" />
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold">Free Trial Active</h3>
              <p class="text-white/90">{$subscriptionStatus.trialDaysLeft} days remaining</p>
              <p class="text-white/80 text-sm">Enjoying unlimited access to all features</p>
            </div>
            <button
              on:click={handleSubscribe}
              class="px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors font-medium"
            >
              Subscribe
            </button>
          </div>
        </div>
      {:else if $subscriptionStatus.isPremium}
        <div class="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl p-6 text-white shadow-lg">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Crown size={32} class="text-white" />
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold">Premium Active</h3>
              <p class="text-white/90">Unlimited access to all features</p>
              <p class="text-white/80 text-sm">Thank you for supporting Chitta!</p>
            </div>
            <Star size={24} class="text-yellow-300" />
          </div>
        </div>
      {:else}
        <div class="bg-gradient-to-r from-gray-500 to-gray-600 rounded-3xl p-6 text-white shadow-lg">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User size={32} class="text-white" />
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold">Free Plan</h3>
              <p class="text-white/90">Limited daily usage</p>
              <p class="text-white/80 text-sm">Upgrade for unlimited access</p>
            </div>
            <div class="flex flex-col space-y-2">
              <button
                on:click={handleSubscribe}
                class="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl hover:from-orange-600 hover:to-red-600 transition-colors font-medium text-sm"
              >
                Start Trial
              </button>
              <button
                on:click={handleSimulateSubscription}
                class="px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors font-medium text-xs"
              >
                Demo Premium
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Profile Card -->
      <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100 relative overflow-hidden">
        <!-- Background decoration -->
        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full blur-3xl opacity-50"></div>
        
        <div class="relative z-10">
          {#if error}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          {/if}

          {#if success}
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl text-sm mb-6">
              {success}
            </div>
          {/if}

          <div class="flex items-start space-x-6">
            <!-- Avatar -->
            <div class="relative">
              <div class="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-xl">
                <span class="text-white text-2xl font-bold">
                  {getInitials(userProfile?.full_name || $user?.user_metadata?.full_name || $user?.user_metadata?.name || $user?.email)}
                </span>
              </div>
              <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <span class="text-white text-xs">✓</span>
              </div>
              <!-- Premium badge -->
              {#if $subscriptionStatus.isPremium || $subscriptionStatus.isTrialActive}
                <div class="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <Crown size={16} class="text-white" />
                </div>
              {/if}
            </div>

            <!-- Profile Info -->
            <div class="flex-1">
              {#if editing}
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      bind:value={editForm.full_name}
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      bind:value={editForm.email}
                      disabled
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p class="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div class="flex space-x-3">
                    <button
                      on:click={saveProfile}
                      disabled={saving}
                      class="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>{saving ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      on:click={cancelEditing}
                      class="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      <X size={16} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              {:else}
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h2 class="text-2xl font-bold text-gray-800">
                      {userProfile?.full_name || $user?.user_metadata?.full_name || $user?.user_metadata?.name || 'User'}
                    </h2>
                    <button
                      on:click={startEditing}
                      class="p-2 rounded-xl hover:bg-gray-100 transition-colors group"
                    >
                      <Edit3 size={18} class="text-gray-500 group-hover:text-primary-600" />
                    </button>
                  </div>
                  
                  <div class="flex items-center space-x-2 text-gray-600">
                    <Mail size={16} />
                    <span>{userProfile?.email || $user?.email}</span>
                  </div>
                  
                  <div class="flex items-center space-x-2 text-gray-600">
                    <Calendar size={16} />
                    <span>Joined {formatJoinDate(userProfile?.created_at || $user?.created_at)}</span>
                  </div>
                  
                  <!-- Subscription status -->
                  <div class="flex items-center space-x-2">
                    {#if $subscriptionStatus.isPremium}
                      <Crown size={16} class="text-yellow-500" />
                      <span class="text-yellow-600 font-medium">Premium Member</span>
                    {:else if $subscriptionStatus.isTrialActive}
                      <Gift size={16} class="text-orange-500" />
                      <span class="text-orange-600 font-medium">Free Trial ({$subscriptionStatus.trialDaysLeft} days left)</span>
                    {:else}
                      <User size={16} class="text-gray-500" />
                      <span class="text-gray-600">Free Plan</span>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl p-6 shadow-lg border border-primary-100 text-center group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Brain size={24} class="text-white" />
          </div>
          <div class="text-2xl font-bold text-gray-800 mb-1">{stats.totalMeditations}</div>
          <div class="text-sm text-gray-600">Meditations</div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-lg border border-primary-100 text-center group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Clock size={24} class="text-white" />
          </div>
          <div class="text-2xl font-bold text-gray-800 mb-1">{formatDuration(stats.totalMeditationMinutes)}</div>
          <div class="text-sm text-gray-600">Meditated</div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-lg border border-primary-100 text-center group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Heart size={24} class="text-white" />
          </div>
          <div class="text-2xl font-bold text-gray-800 mb-1">{stats.moodEntries}</div>
          <div class="text-sm text-gray-600">Mood Entries</div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-lg border border-primary-100 text-center group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <MessageCircle size={24} class="text-white" />
          </div>
          <div class="text-2xl font-bold text-gray-800 mb-1">{stats.chatMessages}</div>
          <div class="text-sm text-gray-600">AI Chats</div>
        </div>
      </div>

      <!-- Achievements -->
      <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
        <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Trophy size={24} class="text-yellow-500 mr-3" />
          Achievements
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Current Streak -->
          <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Target size={24} class="text-white" />
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-800">{stats.currentStreak} days</div>
                <div class="text-sm text-gray-600">Current Streak</div>
              </div>
            </div>
          </div>

          <!-- Longest Streak -->
          <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} class="text-white" />
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-800">{stats.longestStreak} days</div>
                <div class="text-sm text-gray-600">Longest Streak</div>
              </div>
            </div>
          </div>

          <!-- Quote Interactions -->
          <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Sparkles size={24} class="text-white" />
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-800">{stats.quoteLikes}</div>
                <div class="text-sm text-gray-600">Quotes Liked</div>
              </div>
            </div>
          </div>

          <!-- Comments -->
          <div class="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 border border-green-200">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <MessageCircle size={24} class="text-white" />
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-800">{stats.quoteComments}</div>
                <div class="text-sm text-gray-600">Comments Posted</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
        <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Settings size={24} class="text-gray-600 mr-3" />
          Quick Actions
        </h3>
        
        <div class="space-y-4">
          <button
            on:click={() => goto('/progress')}
            class="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-primary-300 hover:bg-primary-25 transition-all duration-300 group"
          >
            <div class="flex items-center space-x-4">
              <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} class="text-white" />
              </div>
              <div class="text-left">
                <div class="font-semibold text-gray-800">View Progress</div>
                <div class="text-sm text-gray-600">See your wellness journey</div>
              </div>
            </div>
            <ArrowLeft size={20} class="text-gray-400 group-hover:text-primary-600 transform rotate-180 group-hover:translate-x-1 transition-all" />
          </button>

          {#if !$subscriptionStatus.isPremium && !$subscriptionStatus.isTrialActive}
            <button
              on:click={handleSubscribe}
              class="w-full flex items-center justify-between p-4 rounded-2xl border border-orange-200 hover:border-orange-300 hover:bg-orange-25 transition-all duration-300 group"
            >
              <div class="flex items-center space-x-4">
                <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Crown size={20} class="text-white" />
                </div>
                <div class="text-left">
                  <div class="font-semibold text-gray-800">Upgrade to Premium</div>
                  <div class="text-sm text-gray-600">Unlock unlimited features</div>
                </div>
              </div>
              <ArrowLeft size={20} class="text-gray-400 group-hover:text-orange-600 transform rotate-180 group-hover:translate-x-1 transition-all" />
            </button>
          {/if}

          <button
            on:click={handleSignOut}
            class="w-full flex items-center justify-between p-4 rounded-2xl border border-red-200 hover:border-red-300 hover:bg-red-25 transition-all duration-300 group"
          >
            <div class="flex items-center space-x-4">
              <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <LogOut size={20} class="text-white" />
              </div>
              <div class="text-left">
                <div class="font-semibold text-gray-800">Sign Out</div>
                <div class="text-sm text-gray-600">Log out of your account</div>
              </div>
            </div>
            <ArrowLeft size={20} class="text-gray-400 group-hover:text-red-600 transform rotate-180 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>