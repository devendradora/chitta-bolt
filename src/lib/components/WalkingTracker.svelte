<script>
  import { onMount, onDestroy } from 'svelte'
  import { user } from '$lib/stores/auth.js'
  import { supabase, makeAuthenticatedRequest } from '$lib/supabase.js'
  import { 
    Footprints, 
    Play, 
    Pause, 
    Square, 
    Target, 
    Clock, 
    MapPin,
    TrendingUp,
    Award,
    Calendar
  } from '@lucide/svelte'

  let isWalking = false
  let steps = 0
  let distance = 0 // in kilometers
  let duration = 0 // in seconds
  let calories = 0
  let startTime = null
  let timer = null
  let dailyGoal = 10000
  let todaySteps = 0

  // Pedometer simulation (in real app, would use device sensors)
  let stepInterval = null
  let lastStepTime = 0

  onMount(() => {
    loadTodaySteps()
    loadUserGoal()
  })

  onDestroy(() => {
    if (timer) clearInterval(timer)
    if (stepInterval) clearInterval(stepInterval)
  })

  async function loadTodaySteps() {
    if (!$user) return

    try {
      const today = new Date().toDateString()
      const result = await makeAuthenticatedRequest(() => 
        supabase
          .from('walking_sessions')
          .select('steps')
          .eq('user_id', $user.id)
          .gte('created_at', new Date(today).toISOString())
      )

      if (result.data) {
        todaySteps = result.data.reduce((total, session) => total + (session.steps || 0), 0)
      }
    } catch (error) {
      console.error('Error loading today steps:', error)
    }
  }

  async function loadUserGoal() {
    if (!$user) return

    try {
      const result = await makeAuthenticatedRequest(() => 
        supabase
          .from('user_preferences')
          .select('daily_step_goal')
          .eq('user_id', $user.id)
          .single()
      )

      if (result.data?.daily_step_goal) {
        dailyGoal = result.data.daily_step_goal
      }
    } catch (error) {
      console.log('Using default step goal')
    }
  }

  function startWalking() {
    isWalking = true
    startTime = new Date()
    steps = 0
    distance = 0
    duration = 0
    calories = 0

    // Start timer
    timer = setInterval(() => {
      duration++
    }, 1000)

    // Simulate step counting (in real app, use device accelerometer)
    stepInterval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance of step per interval
        steps++
        updateMetrics()
      }
    }, 800) // Simulate steps every 800ms
  }

  function pauseWalking() {
    isWalking = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (stepInterval) {
      clearInterval(stepInterval)
      stepInterval = null
    }
  }

  function resumeWalking() {
    isWalking = true
    
    timer = setInterval(() => {
      duration++
    }, 1000)

    stepInterval = setInterval(() => {
      if (Math.random() > 0.3) {
        steps++
        updateMetrics()
      }
    }, 800)
  }

  async function stopWalking() {
    pauseWalking()
    
    if (steps > 0) {
      await saveWalkingSession()
    }
    
    // Reset
    steps = 0
    distance = 0
    duration = 0
    calories = 0
    startTime = null
  }

  function updateMetrics() {
    // Calculate distance (average step length: 0.762 meters)
    distance = (steps * 0.762) / 1000 // Convert to kilometers
    
    // Calculate calories (rough estimate: 0.04 calories per step)
    calories = Math.round(steps * 0.04)
  }

  async function saveWalkingSession() {
    if (!$user) return

    try {
      const sessionData = {
        user_id: $user.id,
        steps: steps,
        distance_km: distance,
        duration_seconds: duration,
        calories_burned: calories,
        start_time: startTime.toISOString(),
        end_time: new Date().toISOString()
      }

      await makeAuthenticatedRequest(() => 
        supabase
          .from('walking_sessions')
          .insert(sessionData)
      )

      // Update today's total
      todaySteps += steps
      
      console.log('Walking session saved successfully')
    } catch (error) {
      console.error('Error saving walking session:', error)
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function formatDistance(km) {
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(2)}km`
  }

  $: totalSteps = todaySteps + steps
  $: goalProgress = Math.min((totalSteps / dailyGoal) * 100, 100)
  $: isGoalReached = totalSteps >= dailyGoal
</script>

<div class="walking-tracker">
  <!-- Header -->
  <div class="flex items-center space-x-3 mb-6">
    <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
      <Footprints size={24} class="text-white" />
    </div>
    <div>
      <h2 class="text-xl font-bold text-gray-800">Walking Tracker</h2>
      <p class="text-gray-600 text-sm">Track your steps and stay active</p>
    </div>
  </div>

  <!-- Daily Goal Progress -->
  <div class="goal-section">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center space-x-2">
        <Target size={18} class="text-primary-600" />
        <span class="font-semibold text-gray-800">Daily Goal</span>
      </div>
      <span class="text-sm text-gray-600">{totalSteps.toLocaleString()} / {dailyGoal.toLocaleString()}</span>
    </div>
    
    <div class="progress-bar">
      <div 
        class="progress-fill {isGoalReached ? 'goal-reached' : ''}"
        style="width: {goalProgress}%"
      ></div>
    </div>
    
    <div class="text-center mt-2">
      <span class="text-sm font-medium {isGoalReached ? 'text-green-600' : 'text-gray-600'}">
        {isGoalReached ? '🎉 Goal Reached!' : `${(dailyGoal - totalSteps).toLocaleString()} steps to go`}
      </span>
    </div>
  </div>

  <!-- Current Session Stats -->
  {#if isWalking || steps > 0}
    <div class="session-stats">
      <h3 class="font-semibold text-gray-800 mb-4">Current Session</h3>
      
      <div class="stats-grid">
        <div class="stat-card">
          <Footprints size={20} class="text-blue-500 mb-2" />
          <div class="text-2xl font-bold text-gray-800">{steps.toLocaleString()}</div>
          <div class="text-sm text-gray-600">Steps</div>
        </div>
        
        <div class="stat-card">
          <MapPin size={20} class="text-green-500 mb-2" />
          <div class="text-2xl font-bold text-gray-800">{formatDistance(distance)}</div>
          <div class="text-sm text-gray-600">Distance</div>
        </div>
        
        <div class="stat-card">
          <Clock size={20} class="text-purple-500 mb-2" />
          <div class="text-2xl font-bold text-gray-800">{formatTime(duration)}</div>
          <div class="text-sm text-gray-600">Time</div>
        </div>
        
        <div class="stat-card">
          <TrendingUp size={20} class="text-orange-500 mb-2" />
          <div class="text-2xl font-bold text-gray-800">{calories}</div>
          <div class="text-sm text-gray-600">Calories</div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Controls -->
  <div class="controls-section">
    {#if !isWalking && steps === 0}
      <button
        on:click={startWalking}
        class="start-button"
      >
        <Play size={24} class="mr-3" />
        Start Walking
      </button>
    {:else if isWalking}
      <div class="active-controls">
        <button
          on:click={pauseWalking}
          class="control-button pause"
        >
          <Pause size={20} />
          Pause
        </button>
        
        <button
          on:click={stopWalking}
          class="control-button stop"
        >
          <Square size={20} />
          Stop
        </button>
      </div>
    {:else}
      <div class="paused-controls">
        <button
          on:click={resumeWalking}
          class="control-button resume"
        >
          <Play size={20} />
          Resume
        </button>
        
        <button
          on:click={stopWalking}
          class="control-button stop"
        >
          <Square size={20} />
          Finish
        </button>
      </div>
    {/if}
  </div>

  <!-- Today's Summary -->
  {#if todaySteps > 0}
    <div class="today-summary">
      <div class="flex items-center space-x-2 mb-3">
        <Calendar size={18} class="text-gray-600" />
        <span class="font-semibold text-gray-800">Today's Total</span>
      </div>
      
      <div class="summary-stats">
        <div class="summary-item">
          <span class="text-lg font-bold text-primary-600">{todaySteps.toLocaleString()}</span>
          <span class="text-sm text-gray-600">Steps</span>
        </div>
        
        <div class="summary-item">
          <span class="text-lg font-bold text-green-600">{Math.round(goalProgress)}%</span>
          <span class="text-sm text-gray-600">Goal</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .walking-tracker {
    @apply bg-white rounded-3xl p-6 shadow-lg border border-gray-200 space-y-6;
  }

  .goal-section {
    @apply bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-4 border border-primary-200;
  }

  .progress-bar {
    @apply w-full bg-gray-200 rounded-full h-3 overflow-hidden;
  }

  .progress-fill {
    @apply h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-1000 ease-out;
  }

  .progress-fill.goal-reached {
    @apply from-green-500 to-emerald-500;
  }

  .session-stats {
    @apply bg-gray-50 rounded-2xl p-4 border border-gray-200;
  }

  .stats-grid {
    @apply grid grid-cols-2 md:grid-cols-4 gap-4;
  }

  .stat-card {
    @apply bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100;
  }

  .controls-section {
    @apply text-center;
  }

  .start-button {
    @apply w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center;
  }

  .active-controls,
  .paused-controls {
    @apply flex space-x-4 justify-center;
  }

  .control-button {
    @apply flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300;
  }

  .control-button.pause {
    @apply bg-yellow-500 text-white hover:bg-yellow-600;
  }

  .control-button.resume {
    @apply bg-green-500 text-white hover:bg-green-600;
  }

  .control-button.stop {
    @apply bg-red-500 text-white hover:bg-red-600;
  }

  .today-summary {
    @apply bg-blue-50 rounded-2xl p-4 border border-blue-200;
  }

  .summary-stats {
    @apply flex space-x-6;
  }

  .summary-item {
    @apply text-center;
  }

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .stats-grid {
      @apply grid-cols-2;
    }
    
    .active-controls,
    .paused-controls {
      @apply flex-col space-y-3 space-x-0;
    }
    
    .control-button {
      @apply w-full justify-center;
    }
  }
</style>