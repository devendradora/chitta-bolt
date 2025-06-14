<script>
  import { onMount, onDestroy } from 'svelte'
  import { user } from '$lib/stores/auth.js'
  import { supabase, makeAuthenticatedRequest } from '$lib/supabase.js'
  import { 
    ArrowLeft,
    Dumbbell, 
    Play, 
    Pause, 
    Square, 
    Timer, 
    Flame,
    RotateCcw,
    ChevronRight,
    Sun,
    Moon,
    History
  } from '@lucide/svelte'
  import { goto } from '$app/navigation'

  let selectedExercise = null
  let isExercising = false
  let timeRemaining = 0
  let currentRound = 1
  let totalRounds = 1
  let timer = null
  let isPaused = false
  let showHistory = false

  // Exercise categories
  const exercises = {
    'Quick Workouts': [
      {
        name: '7-Minute Workout',
        duration: 420, // 7 minutes
        rounds: 1,
        description: 'High-intensity circuit training',
        exercises: ['Jumping Jacks', 'Wall Sit', 'Push-ups', 'Crunches', 'Step-ups', 'Squats', 'Tricep Dips', 'Plank', 'High Knees', 'Lunges', 'Push-up Rotation', 'Side Plank'],
        calories: 50
      },
      {
        name: 'HIIT Cardio',
        duration: 900, // 15 minutes
        rounds: 3,
        description: '5-minute high-intensity intervals',
        exercises: ['Burpees', 'Mountain Climbers', 'Jump Squats', 'High Knees'],
        calories: 120
      },
      {
        name: 'Core Blast',
        duration: 600, // 10 minutes
        rounds: 2,
        description: 'Strengthen your core muscles',
        exercises: ['Plank', 'Bicycle Crunches', 'Russian Twists', 'Dead Bug', 'Bird Dog'],
        calories: 80
      }
    ],
    'Yoga & Stretching': [
      {
        name: 'Morning Yoga',
        duration: 900, // 15 minutes
        rounds: 1,
        description: 'Gentle morning flow',
        exercises: ['Sun Salutation A', 'Downward Dog', 'Warrior I', 'Tree Pose', 'Child\'s Pose'],
        calories: 60
      },
      {
        name: 'Evening Stretch',
        duration: 600, // 10 minutes
        rounds: 1,
        description: 'Relaxing evening routine',
        exercises: ['Forward Fold', 'Pigeon Pose', 'Spinal Twist', 'Legs Up Wall', 'Savasana'],
        calories: 40
      }
    ],
    'Surya Namaskara': [
      {
        name: 'Surya Namaskara A',
        duration: 300, // 5 minutes
        rounds: 5,
        description: 'Traditional Sun Salutation A',
        exercises: [
          'Mountain Pose (Tadasana)',
          'Upward Salute (Urdhva Hastasana)', 
          'Standing Forward Fold (Uttanasana)',
          'Half Lift (Ardha Uttanasana)',
          'Low Push-up (Chaturanga)',
          'Upward Facing Dog (Urdhva Mukha)',
          'Downward Facing Dog (Adho Mukha)',
          'Standing Forward Fold (Uttanasana)',
          'Mountain Pose (Tadasana)'
        ],
        calories: 45
      },
      {
        name: 'Surya Namaskara B',
        duration: 480, // 8 minutes
        rounds: 4,
        description: 'Traditional Sun Salutation B',
        exercises: [
          'Mountain Pose (Tadasana)',
          'Chair Pose (Utkatasana)',
          'Standing Forward Fold (Uttanasana)',
          'Half Lift (Ardha Uttanasana)',
          'Low Push-up (Chaturanga)',
          'Upward Facing Dog (Urdhva Mukha)',
          'Downward Facing Dog (Adho Mukha)',
          'Warrior I Right (Virabhadrasana I)',
          'Low Push-up (Chaturanga)',
          'Upward Facing Dog (Urdhva Mukha)',
          'Downward Facing Dog (Adho Mukha)',
          'Warrior I Left (Virabhadrasana I)',
          'Low Push-up (Chaturanga)',
          'Upward Facing Dog (Urdhva Mukha)',
          'Downward Facing Dog (Adho Mukha)',
          'Standing Forward Fold (Uttanasana)',
          'Chair Pose (Utkatasana)',
          'Mountain Pose (Tadasana)'
        ],
        calories: 70
      },
      {
        name: '108 Surya Namaskara',
        duration: 3600, // 60 minutes
        rounds: 108,
        description: 'Traditional 108 Sun Salutations',
        exercises: ['Complete Surya Namaskara sequence'],
        calories: 400
      }
    ]
  }

  onDestroy(() => {
    if (timer) clearInterval(timer)
  })

  function selectExercise(exercise) {
    selectedExercise = exercise
    timeRemaining = exercise.duration
    currentRound = 1
    totalRounds = exercise.rounds
  }

  function startExercise() {
    if (!selectedExercise) return
    
    isExercising = true
    isPaused = false
    
    timer = setInterval(() => {
      if (timeRemaining > 0) {
        timeRemaining--
      } else {
        // Round completed
        if (currentRound < totalRounds) {
          currentRound++
          timeRemaining = selectedExercise.duration / totalRounds
        } else {
          // Exercise completed
          completeExercise()
        }
      }
    }, 1000)
  }

  function pauseExercise() {
    isPaused = true
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function resumeExercise() {
    isPaused = false
    startExercise()
  }

  function stopExercise() {
    isExercising = false
    isPaused = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    
    if (selectedExercise) {
      saveExerciseSession()
    }
    
    resetExercise()
  }

  function completeExercise() {
    isExercising = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    
    saveExerciseSession()
    // Keep selectedExercise to show completion
  }

  function resetExercise() {
    selectedExercise = null
    timeRemaining = 0
    currentRound = 1
    totalRounds = 1
  }

  async function saveExerciseSession() {
    if (!$user || !selectedExercise) return

    try {
      const sessionData = {
        user_id: $user.id,
        exercise_name: selectedExercise.name,
        duration_seconds: selectedExercise.duration,
        rounds_completed: currentRound,
        total_rounds: totalRounds,
        calories_burned: selectedExercise.calories,
        exercise_type: getExerciseType(selectedExercise.name)
      }

      await makeAuthenticatedRequest(() => 
        supabase
          .from('exercise_sessions')
          .insert(sessionData)
      )

      console.log('Exercise session saved successfully')
    } catch (error) {
      console.error('Error saving exercise session:', error)
    }
  }

  function getExerciseType(name) {
    if (name.includes('Surya')) return 'yoga'
    if (name.includes('Yoga') || name.includes('Stretch')) return 'yoga'
    if (name.includes('HIIT') || name.includes('Cardio')) return 'cardio'
    return 'strength'
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function getExerciseIcon(name) {
    if (name.includes('Surya')) return Sun
    if (name.includes('Evening') || name.includes('Night')) return Moon
    if (name.includes('HIIT') || name.includes('Cardio')) return Flame
    return Dumbbell
  }

  $: progress = selectedExercise ? ((selectedExercise.duration - timeRemaining) / selectedExercise.duration) * 100 : 0
</script>

<svelte:head>
  <title>Exercise Tracker - Chitta</title>
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
    <h1 class="text-2xl font-bold text-gray-800">Exercise Tracker</h1>
    <button 
      on:click={() => showHistory = !showHistory}
      class="p-3 rounded-2xl hover:bg-white/70 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <History size={24} class="text-gray-600" />
    </button>
  </div>

  <div class="max-w-2xl mx-auto space-y-8">
    {#if showHistory}
      <!-- Historical Exercise Sessions -->
      <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
        <div class="flex items-center space-x-3 mb-6">
          <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <History size={24} class="text-white" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Exercise History</h2>
            <p class="text-gray-600 text-sm">Your recent exercise sessions</p>
          </div>
        </div>
        
        <!-- Historical sessions list would go here -->
        <div class="text-center py-8 text-gray-500">
          <Dumbbell size={48} class="mx-auto mb-4 opacity-50" />
          <p>Coming soon! Your exercise history will appear here.</p>
        </div>
      </div>
    {:else if !selectedExercise}
      <!-- Exercise Selection -->
      <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
        <div class="flex items-center space-x-4 mb-6">
          <div class="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
            <Dumbbell size={32} class="text-white" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-800">Choose Exercise</h2>
            <p class="text-gray-600">Select a workout to begin</p>
          </div>
        </div>

        {#each Object.entries(exercises) as [category, exerciseList]}
          <div class="mb-8">
            <h3 class="text-lg font-bold text-gray-800 mb-4">{category}</h3>
            <div class="space-y-3">
              {#each exerciseList as exercise}
                <button
                  on:click={() => selectExercise(exercise)}
                  class="w-full flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-300 text-left border border-gray-200 hover:border-orange-300"
                >
                  <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svelte:component this={getExerciseIcon(exercise.name)} size={24} class="text-white" />
                  </div>
                  <div class="flex-1">
                    <h4 class="font-bold text-gray-800 mb-1">{exercise.name}</h4>
                    <p class="text-sm text-gray-600 mb-2">{exercise.description}</p>
                    <div class="flex space-x-4">
                      <span class="flex items-center space-x-1 text-xs text-gray-500">
                        <Timer size={12} />
                        <span>{formatTime(exercise.duration)}</span>
                      </span>
                      <span class="flex items-center space-x-1 text-xs text-gray-500">
                        <Flame size={12} />
                        <span>{exercise.calories} cal</span>
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} class="text-gray-400" />
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <!-- Selected Exercise -->
      <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100">
        <!-- Exercise Info -->
        <div class="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-8">
          <div class="flex items-center space-x-4 mb-4">
            <div class="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <svelte:component this={getExerciseIcon(selectedExercise.name)} size={32} class="text-white" />
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-800">{selectedExercise.name}</h3>
              <p class="text-gray-600">{selectedExercise.description}</p>
            </div>
          </div>
          
          <!-- Exercise Details -->
          <div class="flex space-x-6">
            <div class="flex items-center space-x-2 text-sm text-gray-700">
              <Timer size={16} class="text-blue-500" />
              <span>{formatTime(selectedExercise.duration)}</span>
            </div>
            <div class="flex items-center space-x-2 text-sm text-gray-700">
              <RotateCcw size={16} class="text-green-500" />
              <span>{selectedExercise.rounds} rounds</span>
            </div>
            <div class="flex items-center space-x-2 text-sm text-gray-700">
              <Flame size={16} class="text-orange-500" />
              <span>{selectedExercise.calories} calories</span>
            </div>
          </div>
        </div>

        <!-- Timer Display -->
        <div class="flex justify-center mb-8">
          <div class="relative w-48 h-48">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(0,0,0,0.1)"
                stroke-width="4"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#gradient)"
                stroke-width="4"
                fill="none"
                stroke-dasharray="283"
                stroke-dashoffset={283 - (283 * progress) / 100}
                stroke-linecap="round"
                class="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
            
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <div class="text-3xl font-bold text-gray-800">{formatTime(timeRemaining)}</div>
              <div class="text-sm text-gray-600">Round {currentRound}/{totalRounds}</div>
            </div>
          </div>
        </div>

        <!-- Exercise List -->
        {#if selectedExercise.exercises.length > 1}
          <div class="bg-blue-50 rounded-2xl p-6 border border-blue-200 mb-8">
            <h4 class="font-semibold text-gray-800 mb-4">Exercise Sequence</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              {#each selectedExercise.exercises as exercise, index}
                <div class="flex items-center space-x-3 p-3 bg-white rounded-lg">
                  <div class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span class="text-sm text-gray-700">{exercise}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Controls -->
        <div class="text-center">
          {#if !isExercising && timeRemaining === selectedExercise.duration}
            <button
              on:click={startExercise}
              class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
            >
              <Play size={24} class="mr-3" />
              Start Exercise
            </button>
          {:else if isExercising && !isPaused}
            <div class="flex space-x-4 justify-center">
              <button
                on:click={pauseExercise}
                class="flex items-center space-x-2 px-6 py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-all duration-300"
              >
                <Pause size={20} />
                <span>Pause</span>
              </button>
              
              <button
                on:click={stopExercise}
                class="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all duration-300"
              >
                <Square size={20} />
                <span>Stop</span>
              </button>
            </div>
          {:else if isPaused}
            <div class="flex space-x-4 justify-center">
              <button
                on:click={resumeExercise}
                class="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all duration-300"
              >
                <Play size={20} />
                <span>Resume</span>
              </button>
              
              <button
                on:click={stopExercise}
                class="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all duration-300"
              >
                <Square size={20} />
                <span>Stop</span>
              </button>
            </div>
          {:else if timeRemaining === 0}
            <div class="space-y-6">
              <div class="bg-green-50 rounded-2xl p-6 border border-green-200">
                <h3 class="text-xl font-bold text-green-600 mb-2">🎉 Exercise Complete!</h3>
                <p class="text-gray-600">Great job! You burned {selectedExercise.calories} calories.</p>
              </div>
              <button
                on:click={resetExercise}
                class="flex items-center space-x-2 px-8 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all duration-300 mx-auto"
              >
                <RotateCcw size={20} />
                <span>Choose Another</span>
              </button>
            </div>
          {/if}
        </div>

        <!-- Back Button -->
        {#if !isExercising && timeRemaining !== 0}
          <div class="text-center mt-6">
            <button
              on:click={resetExercise}
              class="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              ← Back to exercise selection
            </button>
          </div>
        {/if}
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

  /* Progress circle animation */
  circle {
    transition: stroke-dashoffset 1s ease-out;
  }
</style>