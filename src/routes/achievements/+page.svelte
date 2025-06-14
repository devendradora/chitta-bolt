<script>
  import { onMount } from 'svelte'
  import { user } from '$lib/stores/auth.js'
  import { 
    userAchievements, 
    availableAchievements, 
    loading,
    loadUserAchievements,
    loadAvailableAchievements,
    getAchievementProgress,
    hasAchievement,
    checkAchievements
  } from '$lib/stores/achievements.js'
  import { algorandAddress } from '$lib/stores/algorand.js'
  import { getMeditationHistory } from '$lib/stores/meditation.js'
  import { getMoodHistory } from '$lib/stores/mood.js'
  import { supabase, makeAuthenticatedRequest } from '$lib/supabase.js'
  import AchievementCard from '$lib/components/AchievementCard.svelte'
  import WalletConnection from '$lib/components/WalletConnection.svelte'
  import { ArrowLeft, Trophy, Target, Sparkles, Award, Filter, Zap, Gift, Star } from '@lucide/svelte'
  import { goto } from '$app/navigation'

  let activeTab = 'all'
  let progressData = {}
  let loadingProgress = true
  let showWalletSetup = false
  let autoCheckingAchievements = false
  let achievementsLoaded = false
  let achievementsError = ''

  const tabs = [
    { id: 'all', label: 'All', icon: Trophy },
    { id: 'earned', label: 'Earned', icon: Award },
    { id: 'available', label: 'Available', icon: Target }
  ]

  const categoryFilters = [
    { id: 'all', label: 'All Categories', emoji: '🏆' },
    { id: 'meditation', label: 'Meditation', emoji: '🧘‍♀️' },
    { id: 'mood', label: 'Mood', emoji: '😊' },
    { id: 'chat', label: 'AI Chat', emoji: '💬' },
    { id: 'motivation', label: 'Motivation', emoji: '✨' },
    { id: 'overall', label: 'Overall', emoji: '🌟' }
  ]

  let selectedCategory = 'all'

  onMount(async () => {
    console.log('Achievements page mounted, user:', $user?.id)
    
    // Always load available achievements first
    await loadAchievementsData()
    
    if ($user) {
      await Promise.all([
        loadUserAchievements($user.id),
        loadProgressData()
      ])
      
      // Auto-check for new achievements if wallet is connected
      if ($algorandAddress) {
        await autoCheckAchievements()
      }
    }
  })

  async function loadAchievementsData() {
    console.log('Loading available achievements...')
    achievementsError = ''
    
    try {
      const result = await loadAvailableAchievements()
      
      if (result.error) {
        console.error('Error loading achievements:', result.error)
        achievementsError = result.error.message || 'Failed to load achievements'
      } else {
        console.log('Available achievements loaded:', result.data?.length || 0)
        achievementsLoaded = true
      }
    } catch (error) {
      console.error('Unexpected error loading achievements:', error)
      achievementsError = 'Failed to load achievements'
    }
  }

  // Watch for user changes but don't block loading
  $: if ($user && achievementsLoaded) {
    console.log('User authenticated, loading user achievements')
    loadUserAchievements($user.id)
  }

  async function loadProgressData() {
    if (!$user) return

    loadingProgress = true
    
    try {
      // Load meditation data
      const { data: meditationData } = await getMeditationHistory($user.id)
      const totalMeditationMinutes = meditationData?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0
      const meditationStreak = calculateMeditationStreak(meditationData || [])

      // Load mood data
      const { data: moodData } = await getMoodHistory($user.id)
      const moodStreak = calculateMoodStreak(moodData || [])

      // Load chat data
      const chatResult = await makeAuthenticatedRequest(() => 
        supabase
          .from('chat_conversations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', $user.id)
      )

      // Load motivation data
      const motivationResult = await makeAuthenticatedRequest(() => 
        supabase
          .from('quote_interactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', $user.id)
          .eq('interaction_type', 'like')
      )

      // Calculate overall usage streak
      const overallStreak = calculateOverallStreak()

      progressData = {
        meditation: {
          totalSessions: meditationData?.length || 0,
          totalMinutes: totalMeditationMinutes,
          currentStreak: meditationStreak
        },
        mood: {
          totalEntries: moodData?.length || 0,
          currentStreak: moodStreak
        },
        chat: {
          totalMessages: chatResult.count || 0
        },
        motivation: {
          totalLikes: motivationResult.count || 0
        },
        overall: {
          consecutiveDays: overallStreak
        }
      }

      console.log('Progress data loaded:', progressData)
    } catch (error) {
      console.error('Error loading progress data:', error)
    } finally {
      loadingProgress = false
    }
  }

  async function autoCheckAchievements() {
    if (!$user || !$algorandAddress || autoCheckingAchievements) return
    
    autoCheckingAchievements = true
    
    try {
      console.log('Auto-checking for new achievements...')
      const result = await checkAchievements($user.id, progressData)
      
      if (result.newAchievements && result.newAchievements.length > 0) {
        console.log('New achievements earned:', result.newAchievements)
        // Refresh the achievements list
        await loadUserAchievements($user.id)
      }
    } catch (error) {
      console.error('Error auto-checking achievements:', error)
    } finally {
      autoCheckingAchievements = false
    }
  }

  function calculateMeditationStreak(sessions) {
    if (!sessions || sessions.length === 0) return 0

    const uniqueDates = [...new Set(sessions.map(s => 
      new Date(s.created_at).toDateString()
    ))].sort((a, b) => new Date(b) - new Date(a))

    let streak = 0
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      streak = 1
      for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i])
        const previousDate = new Date(uniqueDates[i - 1])
        const diffDays = (previousDate - currentDate) / (1000 * 60 * 60 * 24)

        if (diffDays === 1) {
          streak++
        } else {
          break
        }
      }
    }

    return streak
  }

  function calculateMoodStreak(entries) {
    if (!entries || entries.length === 0) return 0

    const uniqueDates = [...new Set(entries.map(e => 
      new Date(e.created_at).toDateString()
    ))].sort((a, b) => new Date(b) - new Date(a))

    let streak = 0
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      streak = 1
      for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i])
        const previousDate = new Date(uniqueDates[i - 1])
        const diffDays = (previousDate - currentDate) / (1000 * 60 * 60 * 24)

        if (diffDays === 1) {
          streak++
        } else {
          break
        }
      }
    }

    return streak
  }

  function calculateOverallStreak() {
    // This would calculate consecutive days of app usage
    // For now, return a placeholder value
    return Math.max(
      progressData.meditation?.currentStreak || 0,
      progressData.mood?.currentStreak || 0
    )
  }

  $: filteredAchievements = $availableAchievements.filter(achievement => {
    // Filter by category
    if (selectedCategory !== 'all' && achievement.achievement_type !== selectedCategory) {
      return false
    }

    // Filter by tab
    if (activeTab === 'earned') {
      return hasAchievement(achievement.achievement_name, $userAchievements)
    } else if (activeTab === 'available') {
      return !hasAchievement(achievement.achievement_name, $userAchievements)
    }

    return true
  })

  $: earnedCount = $userAchievements?.length || 0
  $: totalCount = $availableAchievements?.length || 0
  $: completionPercentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0
  
  // Check if user has any progress that would earn achievements
  $: hasProgress = (
    (progressData.meditation?.totalSessions || 0) > 0 ||
    (progressData.mood?.totalEntries || 0) > 0 ||
    (progressData.chat?.totalMessages || 0) > 0 ||
    (progressData.motivation?.totalLikes || 0) > 0
  )
</script>

<svelte:head>
  <title>Achievements - Chitta</title>
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
    <h1 class="text-2xl font-bold text-gray-800">Achievements</h1>
    <div class="w-12"></div>
  </div>

  <div class="space-y-8 max-w-6xl mx-auto">
    <!-- Error Display -->
    {#if achievementsError}
      <div class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <div class="text-red-600 mb-4">
          <Trophy size={48} class="mx-auto mb-2 opacity-50" />
          <h3 class="text-lg font-bold">Failed to Load Achievements</h3>
          <p class="text-sm mt-2">{achievementsError}</p>
        </div>
        <button 
          on:click={loadAchievementsData}
          class="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    {/if}

    <!-- Hero Section - Blockchain Benefits Without Complexity -->
    {#if !$algorandAddress}
      <div class="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <!-- Animated background elements -->
        <div class="absolute inset-0 overflow-hidden">
          <div class="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>
        </div>
        
        <div class="relative z-10 text-center space-y-6">
          <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto">
            <Zap size={40} class="text-white" />
          </div>
          
          <div>
            <h2 class="text-3xl font-bold mb-3">Unlock Your Digital Wellness Certificates</h2>
            <p class="text-white/90 text-lg leading-relaxed max-w-2xl mx-auto">
              Your wellness achievements become permanent, verifiable certificates that you truly own. 
              Each milestone in your mental health journey is secured forever.
            </p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div class="text-3xl mb-3">🏆</div>
              <h3 class="font-bold mb-2">Permanent Proof</h3>
              <p class="text-white/80 text-sm">Your achievements are permanently recorded and can never be lost or faked</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div class="text-3xl mb-3">💎</div>
              <h3 class="font-bold mb-2">True Ownership</h3>
              <p class="text-white/80 text-sm">You own your wellness certificates - they're yours forever, not locked in any platform</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div class="text-3xl mb-3">🌟</div>
              <h3 class="font-bold mb-2">Shareable Success</h3>
              <p class="text-white/80 text-sm">Show your wellness journey to friends, family, or healthcare providers with verifiable proof</p>
            </div>
          </div>
          
          <button
            on:click={() => showWalletSetup = true}
            class="bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Get Started - It's Free!
          </button>
          
          <p class="text-white/70 text-sm">
            ✨ No technical knowledge required • 🧪 Safe testing environment • 💰 No real money involved
          </p>
        </div>
      </div>
    {/if}

    <!-- Wallet Connection (only show if not connected) -->
    {#if showWalletSetup || !$algorandAddress}
      <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
        <div class="text-center mb-6">
          <h3 class="text-2xl font-bold text-gray-800 mb-2">Quick Setup (2 minutes)</h3>
          <p class="text-gray-600">Connect your Lute Wallet to start earning permanent wellness certificates</p>
        </div>
        
        <WalletConnection />
        
        {#if !showWalletSetup && !$algorandAddress}
          <div class="mt-6 text-center">
            <button
              on:click={() => showWalletSetup = false}
              class="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              I'll set this up later
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Progress Overview -->
    <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
      <div class="flex items-center space-x-4 mb-6">
        <div class="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
          <Trophy size={32} class="text-white" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Your Wellness Journey</h2>
          <p class="text-gray-600">
            {$algorandAddress 
              ? 'Track your achievements and earn permanent certificates' 
              : 'Start your journey to unlock achievements'}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Completion Rate -->
        <div class="text-center">
          <div class="text-4xl font-bold text-primary-600 mb-2">{completionPercentage}%</div>
          <div class="text-gray-600">Completion Rate</div>
          <div class="text-sm text-gray-500 mt-1">{earnedCount} of {totalCount} achievements</div>
        </div>

        <!-- Earned Achievements -->
        <div class="text-center">
          <div class="text-4xl font-bold text-green-600 mb-2">{earnedCount}</div>
          <div class="text-gray-600">
            {$algorandAddress ? 'Certificates Earned' : 'Achievements Available'}
          </div>
          <div class="text-sm text-gray-500 mt-1">
            {$algorandAddress ? 'Permanent digital certificates' : 'Ready to be unlocked'}
          </div>
        </div>

        <!-- Current Streak -->
        <div class="text-center">
          <div class="text-4xl font-bold text-orange-600 mb-2">
            {Math.max(progressData.meditation?.currentStreak || 0, progressData.mood?.currentStreak || 0)}
          </div>
          <div class="text-gray-600">Current Streak</div>
          <div class="text-sm text-gray-500 mt-1">Consecutive days</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="mt-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">Overall Progress</span>
          <span class="text-sm text-gray-600">{earnedCount}/{totalCount}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-1000 ease-out"
            style="width: {completionPercentage}%"
          ></div>
        </div>
      </div>
      
      <!-- Auto-checking indicator -->
      {#if autoCheckingAchievements}
        <div class="mt-4 flex items-center justify-center space-x-2 text-primary-600">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          <span class="text-sm font-medium">Checking for new achievements...</span>
        </div>
      {/if}
    </div>

    <!-- Motivation Section for Users Without Progress -->
    {#if !hasProgress && !$algorandAddress}
      <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl p-8 border border-green-200">
        <div class="text-center space-y-6">
          <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
            <Gift size={32} class="text-white" />
          </div>
          
          <div>
            <h3 class="text-2xl font-bold text-gray-800 mb-3">Start Your Wellness Journey</h3>
            <p class="text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Begin using Chitta to track your mood, meditate, or chat with our AI wellness coach. 
              Each activity brings you closer to earning your first achievement!
            </p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
            <button
              on:click={() => goto('/meditation')}
              class="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              🧘‍♀️ Start Meditating
            </button>
            <button
              on:click={() => goto('/mood/😊')}
              class="bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              😊 Track Your Mood
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Tabs -->
    <div class="bg-white rounded-2xl p-2 shadow-lg border border-primary-100">
      <div class="flex space-x-2">
        {#each tabs as tab}
          <button
            on:click={() => activeTab = tab.id}
            class="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-300 {
              activeTab === tab.id 
                ? 'bg-primary-600 text-white shadow-lg' 
                : 'text-gray-600 hover:bg-primary-50'
            }"
          >
            <svelte:component this={tab.icon} size={18} />
            <span class="font-medium">{tab.label}</span>
            {#if tab.id === 'earned'}
              <span class="bg-white/20 text-xs px-2 py-1 rounded-full font-bold">
                {earnedCount}
              </span>
            {:else if tab.id === 'available'}
              <span class="bg-white/20 text-xs px-2 py-1 rounded-full font-bold">
                {totalCount - earnedCount}
              </span>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- Category Filter -->
    <div class="bg-white rounded-2xl p-4 shadow-lg border border-primary-100">
      <div class="flex items-center space-x-2 mb-3">
        <Filter size={20} class="text-gray-600" />
        <span class="font-medium text-gray-700">Filter by Category</span>
      </div>
      <div class="flex flex-wrap gap-2">
        {#each categoryFilters as category}
          <button
            on:click={() => selectedCategory = category.id}
            class="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 {
              selectedCategory === category.id
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-primary-50'
            }"
          >
            <span class="text-lg">{category.emoji}</span>
            <span class="font-medium">{category.label}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Achievements Grid -->
    {#if $loading || loadingProgress}
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    {:else if !achievementsLoaded}
      <div class="text-center py-20">
        <Sparkles size={64} class="text-gray-300 mx-auto mb-4" />
        <h3 class="text-xl font-bold text-gray-600 mb-2">Loading achievements...</h3>
        <p class="text-gray-500">Please wait while we load your achievements</p>
      </div>
    {:else if filteredAchievements.length === 0}
      <div class="text-center py-20">
        <Sparkles size={64} class="text-gray-300 mx-auto mb-4" />
        <h3 class="text-xl font-bold text-gray-600 mb-2">No achievements found</h3>
        <p class="text-gray-500">
          {activeTab === 'earned' 
            ? 'You haven\'t earned any achievements yet. Keep using the app to unlock them!'
            : 'No achievements match your current filter. Try selecting a different category.'}
        </p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredAchievements as achievement}
          {@const isEarned = hasAchievement(achievement.achievement_name, $userAchievements)}
          {@const progress = getAchievementProgress(achievement.achievement_name, progressData)}
          {@const userAchievement = $userAchievements?.find(a => a.achievement_name === achievement.achievement_name)}
          
          <AchievementCard 
            achievement={{
              ...achievement,
              ...userAchievement
            }}
            {isEarned}
            {progress}
            showProgress={!isEarned}
          />
        {/each}
      </div>
    {/if}

    <!-- Benefits Reminder (only show if wallet not connected) -->
    {#if !$algorandAddress && hasProgress}
      <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
            <Star size={24} class="text-white" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-bold text-yellow-800 mb-1">You're Making Great Progress!</h3>
            <p class="text-yellow-700 text-sm mb-3">
              Connect your Lute Wallet to turn your achievements into permanent, verifiable certificates that you truly own.
            </p>
            <button
              on:click={() => showWalletSetup = true}
              class="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors text-sm"
            >
              Secure My Achievements
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>