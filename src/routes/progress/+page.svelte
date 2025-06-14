<script>
  import { onMount } from 'svelte'
  import { user, loading as authLoading, sessionError, makeAuthenticatedDbRequest } from '$lib/stores/auth.js'
  import { supabase } from '$lib/supabase.js'
  import { 
    ArrowLeft, 
    TrendingUp, 
    Calendar, 
    Brain, 
    Heart, 
    MessageCircle, 
    Clock,
    Target,
    Award,
    BarChart3,
    PieChart,
    Activity,
    Zap
  } from '@lucide/svelte'
  import { goto } from '$app/navigation'

  let activeTab = 'today'
  let loading = true
  let error = ''
  
  let progressData = {
    today: {
      meditations: 0,
      meditationMinutes: 0,
      moodEntries: 0,
      chatMessages: 0,
      quoteLikes: 0
    },
    weekly: {
      meditations: 0,
      meditationMinutes: 0,
      moodEntries: 0,
      chatMessages: 0,
      quoteLikes: 0,
      dailyBreakdown: []
    },
    monthly: {
      meditations: 0,
      meditationMinutes: 0,
      moodEntries: 0,
      chatMessages: 0,
      quoteLikes: 0,
      weeklyBreakdown: []
    }
  }

  let moodDistribution = {}
  let meditationStreak = 0
  let weeklyGoals = {
    meditations: 7,
    meditationMinutes: 105, // 15 minutes per day
    moodEntries: 7
  }

  const tabs = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'weekly', label: 'This Week', icon: BarChart3 },
    { id: 'monthly', label: 'This Month', icon: PieChart }
  ]

  const moodEmojis = {
    '😊': { name: 'Happy', color: 'bg-yellow-400' },
    '😌': { name: 'Calm', color: 'bg-blue-400' },
    '😢': { name: 'Sad', color: 'bg-blue-600' },
    '😠': { name: 'Angry', color: 'bg-red-500' },
    '😰': { name: 'Anxious', color: 'bg-purple-500' },
    '😴': { name: 'Tired', color: 'bg-gray-500' },
    '🤗': { name: 'Loved', color: 'bg-pink-400' },
    '😤': { name: 'Frustrated', color: 'bg-orange-500' }
  }

  onMount(async () => {
    console.log('Progress page mounted')
    
    // Wait for auth to initialize
    if ($authLoading) {
      console.log('Waiting for auth to initialize...')
      const unsubscribe = authLoading.subscribe(isLoading => {
        if (!isLoading) {
          unsubscribe()
          initializeProgress()
        }
      })
    } else {
      initializeProgress()
    }
  })

  async function initializeProgress() {
    if ($sessionError) {
      error = $sessionError
      loading = false
      return
    }

    if (!$user) {
      error = 'Please sign in to view your progress'
      loading = false
      return
    }

    console.log('Initializing progress for user:', $user.id)
    await loadProgressData()
  }

  async function loadProgressData() {
    if (!$user) {
      loading = false
      error = 'Please sign in to view your progress'
      return
    }

    loading = true
    error = ''

    try {
      console.log('Loading progress data for user:', $user.id)
      
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // Load all data concurrently with individual error handling
      await Promise.allSettled([
        loadTodayData(today),
        loadWeeklyData(weekStart),
        loadMonthlyData(monthStart),
        loadMoodDistribution(),
        calculateMeditationStreak()
      ])

      console.log('Progress data loaded successfully')
    } catch (err) {
      console.error('Error loading progress data:', err)
      error = 'Failed to load progress data'
    } finally {
      loading = false
    }
  }

  async function loadTodayData(today) {
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    try {
      const [meditations, moodCount, chatCount, likesCount] = await Promise.allSettled([
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('meditation_sessions')
            .select('duration_minutes')
            .eq('user_id', $user.id)
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString())
        ),
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('mood_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', $user.id)
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString())
        ),
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('chat_conversations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', $user.id)
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString())
        ),
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('quote_interactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', $user.id)
            .eq('interaction_type', 'like')
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString())
        )
      ])

      const meditationData = meditations.status === 'fulfilled' ? meditations.value.data : []
      const moodCountData = moodCount.status === 'fulfilled' ? moodCount.value.count : 0
      const chatCountData = chatCount.status === 'fulfilled' ? chatCount.value.count : 0
      const likesCountData = likesCount.status === 'fulfilled' ? likesCount.value.count : 0

      progressData.today = {
        meditations: meditationData?.length || 0,
        meditationMinutes: meditationData?.reduce((sum, m) => sum + (m.duration_minutes || 0), 0) || 0,
        moodEntries: moodCountData || 0,
        chatMessages: chatCountData || 0,
        quoteLikes: likesCountData || 0
      }
    } catch (err) {
      console.error('Error in loadTodayData:', err)
    }
  }

  async function loadWeeklyData(weekStart) {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    try {
      const [meditations, moods, chats, likes] = await Promise.allSettled([
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('meditation_sessions')
            .select('duration_minutes, created_at')
            .eq('user_id', $user.id)
            .gte('created_at', weekStart.toISOString())
            .lt('created_at', weekEnd.toISOString())
        ),
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('mood_entries')
            .select('created_at')
            .eq('user_id', $user.id)
            .gte('created_at', weekStart.toISOString())
            .lt('created_at', weekEnd.toISOString())
        ),
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('chat_conversations')
            .select('created_at')
            .eq('user_id', $user.id)
            .gte('created_at', weekStart.toISOString())
            .lt('created_at', weekEnd.toISOString())
        ),
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('quote_interactions')
            .select('created_at')
            .eq('user_id', $user.id)
            .eq('interaction_type', 'like')
            .gte('created_at', weekStart.toISOString())
            .lt('created_at', weekEnd.toISOString())
        )
      ])

      const meditationData = meditations.status === 'fulfilled' ? meditations.value.data : []
      const moodData = moods.status === 'fulfilled' ? moods.value.data : []
      const chatData = chats.status === 'fulfilled' ? chats.value.data : []
      const likeData = likes.status === 'fulfilled' ? likes.value.data : []

      progressData.weekly = {
        meditations: meditationData?.length || 0,
        meditationMinutes: meditationData?.reduce((sum, m) => sum + (m.duration_minutes || 0), 0) || 0,
        moodEntries: moodData?.length || 0,
        chatMessages: chatData?.length || 0,
        quoteLikes: likeData?.length || 0,
        dailyBreakdown: generateDailyBreakdown(weekStart, { 
          meditations: meditationData, 
          moods: moodData, 
          chats: chatData, 
          likes: likeData 
        })
      }
    } catch (err) {
      console.error('Error in loadWeeklyData:', err)
    }
  }

  async function loadMonthlyData(monthStart) {
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthStart.getMonth() + 1)

    try {
      const [meditations, moods, chats, likes] = await Promise.allSettled([
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('meditation_sessions')
            .select('duration_minutes, created_at')
            .eq('user_id', $user.id)
            .gte('created_at', monthStart.toISOString())
            .lt('created_at', monthEnd.toISOString())
        ),
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('mood_entries')
            .select('created_at')
            .eq('user_id', $user.id)
            .gte('created_at', monthStart.toISOString())
            .lt('created_at', monthEnd.toISOString())
        ),
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('chat_conversations')
            .select('created_at')
            .eq('user_id', $user.id)
            .gte('created_at', monthStart.toISOString())
            .lt('created_at', monthEnd.toISOString())
        ),
        makeAuthenticatedDbRequest(() => 
          supabase
            .from('quote_interactions')
            .select('created_at')
            .eq('user_id', $user.id)
            .eq('interaction_type', 'like')
            .gte('created_at', monthStart.toISOString())
            .lt('created_at', monthEnd.toISOString())
        )
      ])

      const meditationData = meditations.status === 'fulfilled' ? meditations.value.data : []
      const moodData = moods.status === 'fulfilled' ? moods.value.data : []
      const chatData = chats.status === 'fulfilled' ? chats.value.data : []
      const likeData = likes.status === 'fulfilled' ? likes.value.data : []

      progressData.monthly = {
        meditations: meditationData?.length || 0,
        meditationMinutes: meditationData?.reduce((sum, m) => sum + (m.duration_minutes || 0), 0) || 0,
        moodEntries: moodData?.length || 0,
        chatMessages: chatData?.length || 0,
        quoteLikes: likeData?.length || 0,
        weeklyBreakdown: generateWeeklyBreakdown(monthStart, { 
          meditations: meditationData, 
          moods: moodData, 
          chats: chatData, 
          likes: likeData 
        })
      }
    } catch (err) {
      console.error('Error in loadMonthlyData:', err)
    }
  }

  async function loadMoodDistribution() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    try {
      const moodResult = await makeAuthenticatedDbRequest(() => 
        supabase
          .from('mood_entries')
          .select('mood')
          .eq('user_id', $user.id)
          .gte('created_at', thirtyDaysAgo.toISOString())
      )

      const distribution = {}
      moodResult.data?.forEach(mood => {
        distribution[mood.mood] = (distribution[mood.mood] || 0) + 1
      })

      moodDistribution = distribution
    } catch (err) {
      console.error('Error in loadMoodDistribution:', err)
    }
  }

  async function calculateMeditationStreak() {
    try {
      const meditationResult = await makeAuthenticatedDbRequest(() => 
        supabase
          .from('meditation_sessions')
          .select('created_at')
          .eq('user_id', $user.id)
          .order('created_at', { ascending: false })
      )

      const meditations = meditationResult.data
      if (!meditations || meditations.length === 0) {
        meditationStreak = 0
        return
      }

      const uniqueDates = [...new Set(meditations.map(m => 
        new Date(m.created_at).toDateString()
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

      meditationStreak = streak
    } catch (err) {
      console.error('Error in calculateMeditationStreak:', err)
    }
  }

  function generateDailyBreakdown(weekStart, data) {
    const breakdown = []
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateStr = date.toDateString()
      
      const dayData = {
        day: days[i],
        date: date.getDate(),
        meditations: data.meditations?.filter(m => 
          new Date(m.created_at).toDateString() === dateStr
        ).length || 0,
        meditationMinutes: data.meditations?.filter(m => 
          new Date(m.created_at).toDateString() === dateStr
        ).reduce((sum, m) => sum + (m.duration_minutes || 0), 0) || 0,
        moodEntries: data.moods?.filter(m => 
          new Date(m.created_at).toDateString() === dateStr
        ).length || 0,
        chatMessages: data.chats?.filter(c => 
          new Date(c.created_at).toDateString() === dateStr
        ).length || 0
      }
      
      breakdown.push(dayData)
    }
    
    return breakdown
  }

  function generateWeeklyBreakdown(monthStart, data) {
    const breakdown = []
    const weeksInMonth = Math.ceil(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate() / 7)
    
    for (let week = 0; week < weeksInMonth; week++) {
      const weekStartDate = new Date(monthStart)
      weekStartDate.setDate(monthStart.getDate() + (week * 7))
      const weekEndDate = new Date(weekStartDate)
      weekEndDate.setDate(weekStartDate.getDate() + 7)
      
      const weekData = {
        week: week + 1,
        startDate: weekStartDate.getDate(),
        endDate: Math.min(weekEndDate.getDate() - 1, new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()),
        meditations: data.meditations?.filter(m => {
          const date = new Date(m.created_at)
          return date >= weekStartDate && date < weekEndDate
        }).length || 0,
        meditationMinutes: data.meditations?.filter(m => {
          const date = new Date(m.created_at)
          return date >= weekStartDate && date < weekEndDate
        }).reduce((sum, m) => sum + (m.duration_minutes || 0), 0) || 0,
        moodEntries: data.moods?.filter(m => {
          const date = new Date(m.created_at)
          return date >= weekStartDate && date < weekEndDate
        }).length || 0
      }
      
      breakdown.push(weekData)
    }
    
    return breakdown
  }

  function getProgressPercentage(current, goal) {
    return Math.min((current / goal) * 100, 100)
  }

  function formatDuration(minutes) {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  function getMoodDistributionArray() {
    return Object.entries(moodDistribution)
      .map(([emoji, count]) => ({
        emoji,
        count,
        name: moodEmojis[emoji]?.name || 'Unknown',
        color: moodEmojis[emoji]?.color || 'bg-gray-400'
      }))
      .sort((a, b) => b.count - a.count)
  }

  function getMaxValue(data, key) {
    return Math.max(...data.map(item => item[key]), 1)
  }

  $: currentData = progressData[activeTab]
</script>

<svelte:head>
  <title>Progress - Chitta</title>
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
    <h1 class="text-2xl font-bold text-gray-800">Progress</h1>
    <div class="w-12"></div>
  </div>

  {#if loading || $authLoading}
    <div class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  {:else if error}
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
    <div class="space-y-8 max-w-4xl mx-auto">
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
            </button>
          {/each}
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-white rounded-2xl p-6 shadow-lg border border-primary-100 text-center group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Brain size={24} class="text-white" />
          </div>
          <div class="text-2xl font-bold text-gray-800 mb-1">{currentData.meditations}</div>
          <div class="text-sm text-gray-600">Meditations</div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-lg border border-primary-100 text-center group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Clock size={24} class="text-white" />
          </div>
          <div class="text-2xl font-bold text-gray-800 mb-1">{formatDuration(currentData.meditationMinutes)}</div>
          <div class="text-sm text-gray-600">Meditated</div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-lg border border-primary-100 text-center group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Heart size={24} class="text-white" />
          </div>
          <div class="text-2xl font-bold text-gray-800 mb-1">{currentData.moodEntries}</div>
          <div class="text-sm text-gray-600">Mood Entries</div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-lg border border-primary-100 text-center group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <MessageCircle size={24} class="text-white" />
          </div>
          <div class="text-2xl font-bold text-gray-800 mb-1">{currentData.chatMessages}</div>
          <div class="text-sm text-gray-600">AI Chats</div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-lg border border-primary-100 text-center group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div class="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Heart size={24} class="text-white" />
          </div>
          <div class="text-2xl font-bold text-gray-800 mb-1">{currentData.quoteLikes}</div>
          <div class="text-sm text-gray-600">Quotes Liked</div>
        </div>
      </div>

      <!-- Weekly Goals (only show for weekly tab) -->
      {#if activeTab === 'weekly'}
        <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
          <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Target size={24} class="text-green-500 mr-3" />
            Weekly Goals
          </h3>
          
          <div class="space-y-6">
            <!-- Meditation Sessions Goal -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-700">Meditation Sessions</span>
                <span class="text-sm text-gray-600">{currentData.meditations} / {weeklyGoals.meditations}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                  style="width: {getProgressPercentage(currentData.meditations, weeklyGoals.meditations)}%"
                ></div>
              </div>
              <div class="text-xs text-gray-500">
                {Math.round(getProgressPercentage(currentData.meditations, weeklyGoals.meditations))}% complete
              </div>
            </div>

            <!-- Meditation Minutes Goal -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-700">Meditation Minutes</span>
                <span class="text-sm text-gray-600">{currentData.meditationMinutes} / {weeklyGoals.meditationMinutes}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000 ease-out"
                  style="width: {getProgressPercentage(currentData.meditationMinutes, weeklyGoals.meditationMinutes)}%"
                ></div>
              </div>
              <div class="text-xs text-gray-500">
                {Math.round(getProgressPercentage(currentData.meditationMinutes, weeklyGoals.meditationMinutes))}% complete
              </div>
            </div>

            <!-- Mood Entries Goal -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-700">Mood Check-ins</span>
                <span class="text-sm text-gray-600">{currentData.moodEntries} / {weeklyGoals.moodEntries}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                  style="width: {getProgressPercentage(currentData.moodEntries, weeklyGoals.moodEntries)}%"
                ></div>
              </div>
              <div class="text-xs text-gray-500">
                {Math.round(getProgressPercentage(currentData.moodEntries, weeklyGoals.moodEntries))}% complete
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Charts Section -->
      {#if activeTab === 'weekly' && currentData.dailyBreakdown}
        <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
          <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <BarChart3 size={24} class="text-blue-500 mr-3" />
            Daily Activity
          </h3>
          
          <div class="space-y-8">
            <!-- Meditation Chart -->
            <div>
              <h4 class="font-semibold text-gray-700 mb-4">Meditation Sessions</h4>
              <div class="flex items-end space-x-2 h-32">
                {#each currentData.dailyBreakdown as day}
                  <div class="flex-1 flex flex-col items-center">
                    <div class="w-full bg-gray-200 rounded-t-lg relative overflow-hidden" style="height: 100px;">
                      <div 
                        class="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-1000 ease-out"
                        style="height: {(day.meditations / Math.max(getMaxValue(currentData.dailyBreakdown, 'meditations'), 1)) * 100}%"
                      ></div>
                      {#if day.meditations > 0}
                        <div class="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white">
                          {day.meditations}
                        </div>
                      {/if}
                    </div>
                    <div class="text-xs text-gray-600 mt-2 font-medium">{day.day}</div>
                    <div class="text-xs text-gray-500">{day.date}</div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Mood Entries Chart -->
            <div>
              <h4 class="font-semibold text-gray-700 mb-4">Mood Check-ins</h4>
              <div class="flex items-end space-x-2 h-32">
                {#each currentData.dailyBreakdown as day}
                  <div class="flex-1 flex flex-col items-center">
                    <div class="w-full bg-gray-200 rounded-t-lg relative overflow-hidden" style="height: 100px;">
                      <div 
                        class="absolute bottom-0 w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-1000 ease-out"
                        style="height: {(day.moodEntries / Math.max(getMaxValue(currentData.dailyBreakdown, 'moodEntries'), 1)) * 100}%"
                      ></div>
                      {#if day.moodEntries > 0}
                        <div class="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white">
                          {day.moodEntries}
                        </div>
                      {/if}
                    </div>
                    <div class="text-xs text-gray-600 mt-2 font-medium">{day.day}</div>
                    <div class="text-xs text-gray-500">{day.date}</div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}

      {#if activeTab === 'monthly' && currentData.weeklyBreakdown}
        <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
          <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <PieChart size={24} class="text-green-500 mr-3" />
            Weekly Breakdown
          </h3>
          
          <div class="space-y-6">
            {#each currentData.weeklyBreakdown as week}
              <div class="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="font-semibold text-gray-800">Week {week.week}</h4>
                  <span class="text-sm text-gray-600">{week.startDate}-{week.endDate}</span>
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600 mb-1">{week.meditations}</div>
                    <div class="text-xs text-gray-600">Meditations</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-green-600 mb-1">{formatDuration(week.meditationMinutes)}</div>
                    <div class="text-xs text-gray-600">Minutes</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-purple-600 mb-1">{week.moodEntries}</div>
                    <div class="text-xs text-gray-600">Moods</div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Mood Distribution -->
      {#if Object.keys(moodDistribution).length > 0}
        <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
          <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Heart size={24} class="text-pink-500 mr-3" />
            Mood Distribution (Last 30 Days)
          </h3>
          
          <div class="space-y-4">
            {#each getMoodDistributionArray() as mood}
              <div class="flex items-center space-x-4">
                <div class="text-3xl">{mood.emoji}</div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium text-gray-700">{mood.name}</span>
                    <span class="text-sm text-gray-600">{mood.count} times</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      class="h-full {mood.color} rounded-full transition-all duration-1000 ease-out"
                      style="width: {(mood.count / Math.max(...Object.values(moodDistribution))) * 100}%"
                    ></div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Streak & Achievements -->
      <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
        <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Award size={24} class="text-yellow-500 mr-3" />
          Achievements
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Meditation Streak -->
          <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Zap size={32} class="text-white" />
              </div>
              <div>
                <div class="text-3xl font-bold text-gray-800 mb-1">{meditationStreak}</div>
                <div class="text-sm text-gray-600">Day Meditation Streak</div>
                <div class="text-xs text-gray-500 mt-1">Keep it up! 🔥</div>
              </div>
            </div>
          </div>

          <!-- Total Activity -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Activity size={32} class="text-white" />
              </div>
              <div>
                <div class="text-3xl font-bold text-gray-800 mb-1">
                  {currentData.meditations + currentData.moodEntries + currentData.chatMessages}
                </div>
                <div class="text-sm text-gray-600">Total Activities</div>
                <div class="text-xs text-gray-500 mt-1">
                  {activeTab === 'today' ? 'Today' : activeTab === 'weekly' ? 'This Week' : 'This Month'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>