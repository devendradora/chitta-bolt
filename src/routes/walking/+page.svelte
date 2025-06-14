<script>
  import { onMount, onDestroy } from 'svelte'
  import { user } from '$lib/stores/auth.js'
  import { supabase, makeAuthenticatedRequest } from '$lib/supabase.js'
  import { 
    ArrowLeft,
    Footprints, 
    Play, 
    Pause, 
    Square, 
    Target, 
    Clock, 
    MapPin,
    TrendingUp,
    Award,
    Calendar,
    History
  } from '@lucide/svelte'
  import { goto } from '$app/navigation'

  let isWalking =  false
  let steps = 0
  let distance = 0 // in kilometers
  let duration = 0 // in seconds
  let calories = 0
  let startTime = null
  let timer = null
  let dailyGoal = 10000
  let todaySteps = 0
  let showHistory = false

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

<svelte:head>
  <title>Walking Tracker - Chitta</title>
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
    <h1 class="text-2xl font-bold text-gray-800">Walking Tracker</h1>
    <button 
      on:click={() => showHistory = !showHistory}
      class="p-3 rounded-2xl hover:bg-white/70 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <History size={24} class="text-gray-600" />
    </button>
  </div>

  <div class="max-w-2xl mx-auto space-y-8">
    {#if showHistory}
      <!-- Historical Walking Sessions -->
      <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
        <div class="flex items-center space-x-3 mb-6">
          <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <History size={24} class="text-white" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Walking History</h2>
            <p class="text-gray-600 text-sm">Your recent walking sessions</p>
          </div>
        </div>
        
        <!-- Historical sessions list would go here -->
        <div class="text-center py-8 text-gray-500">
          <Footprints size={48} class="mx-auto mb-4 opacity-50" />
          <p>Coming soon! Your walking history will appear here.</p>
        </div>
      </div>
    {:else}
      <!-- Daily Goal Progress -->
      <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
        <div class="flex items-center space-x-4 mb-6">
          <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <Footprints size={32} class="text-white" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-800">Step Tracker</h2>
            <p class="text-gray-600">Track your daily steps and stay active</p>
          </div>
        </div>

        <div class="goal-section mb-8">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <Target size={18} class="text-primary-600" />
              <span class="font-semibold text-gray-800">Daily Goal</span>
            </div>
            <span class="text-sm text-gray-600">{totalSteps.toLocaleString()} / {dailyGoal.toLocaleString()}</span>
          </div>
          
          <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              class="h-full {isGoalReached ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-primary-500 to-secondary-500'} rounded-full transition-all duration-1000 ease-out"
              style="width: {goalProgress}%"
            ></div>
          </div>
          
          <div class="text-center mt-3">
            <span class="text-sm font-medium {isGoalReached ? 'text-green-600' : 'text-gray-600'}">
              {isGoalReached ? '🎉 Goal Reached!' : `${(dailyGoal - totalSteps).toLocaleString()} steps to go`}
            </span>
          </div>
        </div>

        <!-- Current Session Stats -->
        {#if isWalking || steps > 0}
          <div class="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-8">
            <h3 class="font-semibold text-gray-800 mb-4">Current Session</h3>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <Footprints size={20} class="text-blue-500 mx-auto mb-2" />
                <div class="text-2xl font-bold text-gray-800">{steps.toLocaleString()}</div>
                <div class="text-sm text-gray-600">Steps</div>
              </div>
              
              <div class="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <MapPin size={20} class="text-green-500 mx-auto mb-2" />
                <div class="text-2xl font-bold text-gray-800">{formatDistance(distance)}</div>
                <div class="text-sm text-gray-600">Distance</div>
              </div>
              
              <div class="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <Clock size={20} class="text-purple-500 mx-auto mb-2" />
                <div class="text-2xl font-bold text-gray-800">{formatTime(duration)}</div>
                <div class="text-sm text-gray-600">Time</div>
              </div>
              
              <div class="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <TrendingUp size={20} class="text-orange-500 mx-auto mb-2" />
                <div class="text-2xl font-bold text-gray-800">{calories}</div>
                <div class="text-sm text-gray-600">Calories</div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Controls -->
        <div class="text-center">
          {#if !isWalking && steps === 0}
            <button
              on:click={startWalking}
              class="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
            >
              <Play size={24} class="mr-3" />
              Start Walking
            </button>
          {:else if isWalking}
            <div class="flex space-x-4 justify-center">
              <button
                on:click={pauseWalking}
                class="flex items-center space-x-2 px-6 py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-all duration-300"
              >
                <Pause size={20} />
                <span>Pause</span>
              </button>
              
              <button
                on:click={stopWalking}
                class="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all duration-300"
              >
                <Square size={20} />
                <span>Stop</span>
              </button>
            </div>
          {:else}
            <div class="flex space-x-4 justify-center">
              <button
                on:click={resumeWalking}
                class="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all duration-300"
              >
                <Play size={20} />
                <span>Resume</span>
              </button>
              
              <button
                on:click={stopWalking}
                class="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all duration-300"
              >
                <Square size={20} />
                <span>Finish</span>
              </button>
            </div>
          {/if}
        </div>
      </div>

      <!-- Today's Summary -->
      {#if todaySteps > 0}
        <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
          <div class="flex items-center space-x-3 mb-6">
            <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Calendar size={24} class="text-white" />
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-800">Today's Progress</h3>
              <p class="text-gray-600 text-sm">Your walking activity for today</p>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-6">
            <div class="bg-blue-50 rounded-2xl p-6 border border-blue-200 text-center">
              <div class="text-3xl font-bold text-blue-600 mb-2">{todaySteps.toLocaleString()}</div>
              <div class="text-sm text-gray-600">Total Steps</div>
            </div>
            
            <div class="bg-green-50 rounded-2xl p-6 border border-green-200 text-center">
              <div class="text-3xl font-bold text-green-600 mb-2">{Math.round(goalProgress)}%</div>
              <div class="text-sm text-gray-600">Goal Progress</div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Tips Section -->
      <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
        <div class="flex items-center space-x-3 mb-6">
          <div class="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center">
            <Award size={24} class="text-white" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-800">Walking Tips</h3>
            <p class="text-gray-600 text-sm">Get the most from your walking routine</p>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <h4 class="font-semibold text-gray-800 mb-2">Proper Posture</h4>
            <p class="text-gray-600 text-sm">Keep your head up, shoulders relaxed, and back straight. Engage your core and swing your arms naturally.</p>
          </div>
          
          <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <h4 class="font-semibold text-gray-800 mb-2">Optimal Pace</h4>
            <p class="text-gray-600 text-sm">Aim for a brisk pace where you can still talk but feel slightly challenged. This maximizes cardiovascular benefits.</p>
          </div>
          
          <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <h4 class="font-semibold text-gray-800 mb-2">Consistency Matters</h4>
            <p class="text-gray-600 text-sm">Walking daily, even for short periods, is better than occasional long walks. Aim for at least 30 minutes most days.</p>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Custom animations */
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .floating {
    animation: float 3s ease-in-out infinite;
  }

  /* Smooth transitions for all interactive elements */
  button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Progress bar animation */
  .progress-fill {
    transition: width 1s ease-out;
  }
</style>