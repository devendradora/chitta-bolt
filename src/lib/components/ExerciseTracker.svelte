<script>
  import { onMount, onDestroy } from 'svelte'
  import { user } from '$lib/stores/auth.js'
  import { supabase, makeAuthenticatedRequest } from '$lib/supabase.js'
  import { 
    Dumbbell, 
    Play, 
    Pause, 
    Square, 
    Timer, 
    Flame,
    RotateCcw,
    ChevronRight,
    Sun,
    Moon
  } from '@lucide/svelte'

  let selectedExercise = null
  let isExercising = false
  let timeRemaining = 0
  let currentRound = 1
  let totalRounds = 1
  let timer = null
  let isPaused = false

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

<div class="exercise-tracker">
  <!-- Header -->
  <div class="flex items-center space-x-3 mb-6">
    <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
      <Dumbbell size={24} class="text-white" />
    </div>
    <div>
      <h2 class="text-xl font-bold text-gray-800">Exercise Tracker</h2>
      <p class="text-gray-600 text-sm">Choose your workout and stay fit</p>
    </div>
  </div>

  {#if !selectedExercise}
    <!-- Exercise Selection -->
    <div class="exercise-selection">
      {#each Object.entries(exercises) as [category, exerciseList]}
        <div class="category-section">
          <h3 class="category-title">{category}</h3>
          <div class="exercise-grid">
            {#each exerciseList as exercise}
              <button
                on:click={() => selectExercise(exercise)}
                class="exercise-card"
              >
                <div class="exercise-icon">
                  <svelte:component this={getExerciseIcon(exercise.name)} size={24} class="text-white" />
                </div>
                <div class="exercise-info">
                  <h4 class="exercise-name">{exercise.name}</h4>
                  <p class="exercise-description">{exercise.description}</p>
                  <div class="exercise-meta">
                    <span class="meta-item">
                      <Timer size={12} />
                      {formatTime(exercise.duration)}
                    </span>
                    <span class="meta-item">
                      <Flame size={12} />
                      {exercise.calories} cal
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
    <div class="selected-exercise">
      <!-- Exercise Info -->
      <div class="exercise-header">
        <div class="flex items-center space-x-3 mb-4">
          <div class="exercise-icon-large">
            <svelte:component this={getExerciseIcon(selectedExercise.name)} size={32} class="text-white" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-800">{selectedExercise.name}</h3>
            <p class="text-gray-600">{selectedExercise.description}</p>
          </div>
        </div>
        
        <!-- Exercise Details -->
        <div class="exercise-details">
          <div class="detail-item">
            <Timer size={16} class="text-blue-500" />
            <span>{formatTime(selectedExercise.duration)}</span>
          </div>
          <div class="detail-item">
            <RotateCcw size={16} class="text-green-500" />
            <span>{selectedExercise.rounds} rounds</span>
          </div>
          <div class="detail-item">
            <Flame size={16} class="text-orange-500" />
            <span>{selectedExercise.calories} calories</span>
          </div>
        </div>
      </div>

      <!-- Timer Display -->
      <div class="timer-display">
        <div class="timer-circle">
          <svg class="timer-svg" viewBox="0 0 100 100">
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
              class="progress-circle"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
              </linearGradient>
            </defs>
          </svg>
          
          <div class="timer-content">
            <div class="timer-time">{formatTime(timeRemaining)}</div>
            <div class="timer-round">Round {currentRound}/{totalRounds}</div>
          </div>
        </div>
      </div>

      <!-- Exercise List -->
      {#if selectedExercise.exercises.length > 1}
        <div class="exercise-list">
          <h4 class="font-semibold text-gray-800 mb-3">Exercise Sequence</h4>
          <div class="sequence-grid">
            {#each selectedExercise.exercises as exercise, index}
              <div class="sequence-item">
                <span class="sequence-number">{index + 1}</span>
                <span class="sequence-name">{exercise}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Controls -->
      <div class="exercise-controls">
        {#if !isExercising && timeRemaining === selectedExercise.duration}
          <button
            on:click={startExercise}
            class="start-button"
          >
            <Play size={24} class="mr-3" />
            Start Exercise
          </button>
        {:else if isExercising && !isPaused}
          <div class="active-controls">
            <button
              on:click={pauseExercise}
              class="control-button pause"
            >
              <Pause size={20} />
              Pause
            </button>
            
            <button
              on:click={stopExercise}
              class="control-button stop"
            >
              <Square size={20} />
              Stop
            </button>
          </div>
        {:else if isPaused}
          <div class="paused-controls">
            <button
              on:click={resumeExercise}
              class="control-button resume"
            >
              <Play size={20} />
              Resume
            </button>
            
            <button
              on:click={stopExercise}
              class="control-button stop"
            >
              <Square size={20} />
              Stop
            </button>
          </div>
        {:else if timeRemaining === 0}
          <div class="completed-controls">
            <div class="completion-message">
              <h3 class="text-xl font-bold text-green-600 mb-2">🎉 Exercise Complete!</h3>
              <p class="text-gray-600">Great job! You burned {selectedExercise.calories} calories.</p>
            </div>
            <button
              on:click={resetExercise}
              class="control-button reset"
            >
              <RotateCcw size={20} />
              Choose Another
            </button>
          </div>
        {/if}
      </div>

      <!-- Back Button -->
      <div class="text-center mt-4">
        <button
          on:click={resetExercise}
          class="text-gray-500 hover:text-gray-700 text-sm underline"
        >
          ← Back to exercise selection
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .exercise-tracker {
    @apply bg-white rounded-3xl p-6 shadow-lg border border-gray-200 space-y-6;
  }

  .category-section {
    @apply mb-6;
  }

  .category-title {
    @apply text-lg font-bold text-gray-800 mb-4;
  }

  .exercise-grid {
    @apply space-y-3;
  }

  .exercise-card {
    @apply w-full flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-300 text-left border border-gray-200 hover:border-orange-300;
  }

  .exercise-icon {
    @apply w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0;
  }

  .exercise-icon-large {
    @apply w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center;
  }

  .exercise-info {
    @apply flex-1;
  }

  .exercise-name {
    @apply font-bold text-gray-800 mb-1;
  }

  .exercise-description {
    @apply text-sm text-gray-600 mb-2;
  }

  .exercise-meta {
    @apply flex space-x-4;
  }

  .meta-item {
    @apply flex items-center space-x-1 text-xs text-gray-500;
  }

  .exercise-header {
    @apply bg-gray-50 rounded-2xl p-4 border border-gray-200;
  }

  .exercise-details {
    @apply flex space-x-6;
  }

  .detail-item {
    @apply flex items-center space-x-2 text-sm text-gray-700;
  }

  .timer-display {
    @apply flex justify-center;
  }

  .timer-circle {
    @apply relative w-48 h-48;
  }

  .timer-svg {
    @apply w-full h-full transform -rotate-90;
  }

  .progress-circle {
    @apply transition-all duration-1000 ease-out;
  }

  .timer-content {
    @apply absolute inset-0 flex flex-col items-center justify-center;
  }

  .timer-time {
    @apply text-3xl font-bold text-gray-800;
  }

  .timer-round {
    @apply text-sm text-gray-600;
  }

  .exercise-list {
    @apply bg-blue-50 rounded-2xl p-4 border border-blue-200;
  }

  .sequence-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-2;
  }

  .sequence-item {
    @apply flex items-center space-x-3 p-2 bg-white rounded-lg;
  }

  .sequence-number {
    @apply w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold;
  }

  .sequence-name {
    @apply text-sm text-gray-700;
  }

  .exercise-controls {
    @apply text-center;
  }

  .start-button {
    @apply w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center;
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

  .control-button.reset {
    @apply bg-blue-500 text-white hover:bg-blue-600;
  }

  .completed-controls {
    @apply space-y-4;
  }

  .completion-message {
    @apply text-center;
  }

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .exercise-details {
      @apply flex-col space-y-2 space-x-0;
    }
    
    .timer-circle {
      @apply w-40 h-40;
    }
    
    .timer-time {
      @apply text-2xl;
    }
    
    .sequence-grid {
      @apply grid-cols-1;
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