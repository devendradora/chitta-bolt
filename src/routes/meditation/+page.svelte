<script>
  import { onMount, onDestroy } from 'svelte'
  import { user } from '$lib/stores/auth.js'
  import { 
    meditationSession, 
    predefinedDurations, 
    musicOptions, 
    moodBackgrounds,
    saveMeditationSession 
  } from '$lib/stores/meditation.js'
  import { subscriptionStatus, canUseFeature } from '$lib/stores/subscription.js'
  import { autoCheckAchievements } from '$lib/stores/achievements.js'
  import MeditationAIAssistant from '$lib/components/MeditationAIAssistant.svelte'
  import SubscriptionModal from '$lib/components/SubscriptionModal.svelte'
  import HistoricalMeditationSessions from '$lib/components/HistoricalMeditationSessions.svelte'
  import { 
    ArrowLeft, 
    Play, 
    Pause, 
    Square, 
    Volume2, 
    VolumeX, 
    Settings,
    Timer,
    Music,
    Heart,
    Brain,
    Crown,
    Sparkles,
    Mic,
    MicOff,
    History
  } from '@lucide/svelte'
  import { goto } from '$app/navigation'

  // Session state
  let isSessionActive = false
  let isPaused = false
  let sessionProgress = 0 // 0-100
  let timeRemaining = 0
  let sessionTimer = null
  let audioElement = null
  let isAudioPlaying = false
  let sessionCompleted = false

  // Settings
  let selectedDuration = 10 // minutes
  let selectedMusic = 'silence'
  let moodBefore = ''
  let moodAfter = ''
  let sessionNotes = ''
  let showSettings = true

  // Text-to-speech for meditation guidance
  let guidanceText = ''
  let isGuidancePlaying = false
  let speechSynthesis = null
  let currentUtterance = null

  // UI state
  let showSubscriptionModal = false
  let subscriptionFeature = ''
  let saving = false
  let error = ''
  let success = ''
  let showHistory = false

  // Mood options
  const moodOptions = [
    { emoji: '😊', name: 'Happy' },
    { emoji: '😌', name: 'Calm' },
    { emoji: '😢', name: 'Sad' },
    { emoji: '😠', name: 'Stressed' },
    { emoji: '😰', name: 'Anxious' },
    { emoji: '😴', name: 'Tired' },
    { emoji: '🤗', name: 'Peaceful' },
    { emoji: '😤', name: 'Frustrated' }
  ]

  // Meditation guidance texts for different phases
  const guidanceTexts = {
    start: [
      "Welcome to your meditation session. Find a comfortable position and let's begin this journey together.",
      "Take a moment to settle in. Close your eyes and begin to notice your breath.",
      "Let's start by taking three deep breaths together. Breathe in slowly... and out."
    ],
    middle: [
      "You're doing great. Continue to focus on your breath, letting thoughts come and go naturally.",
      "If your mind wanders, that's perfectly normal. Gently bring your attention back to your breathing.",
      "Notice the sensation of breathing. Feel the air entering and leaving your body."
    ],
    end: [
      "You're approaching the end of your session. Take a moment to appreciate this time you've given yourself.",
      "Begin to bring your awareness back to your surroundings while maintaining that sense of calm.",
      "When you're ready, slowly open your eyes and carry this peace with you."
    ]
  }

  onMount(() => {
    // Load user's last session preferences
    loadSessionPreferences()
    
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis = window.speechSynthesis
    }
  })

  onDestroy(() => {
    if (sessionTimer) {
      clearInterval(sessionTimer)
    }
    if (audioElement) {
      audioElement.pause()
    }
    if (currentUtterance && speechSynthesis) {
      speechSynthesis.cancel()
    }
  })

  function loadSessionPreferences() {
    const saved = localStorage.getItem('chitta-meditation-preferences')
    if (saved) {
      try {
        const prefs = JSON.parse(saved)
        selectedDuration = prefs.duration || 10
        selectedMusic = prefs.music || 'silence'
      } catch (error) {
        console.error('Error loading preferences:', error)
      }
    }
  }

  function saveSessionPreferences() {
    const prefs = {
      duration: selectedDuration,
      music: selectedMusic
    }
    localStorage.setItem('chitta-meditation-preferences', JSON.stringify(prefs))
  }

  function startSession() {
    if (!moodBefore) {
      error = 'Please select how you feel before starting'
      return
    }

    // Check if custom music requires premium
    if (selectedMusic === 'custom' && !canUseFeature('customMusicUpload')) {
      subscriptionFeature = 'Custom Music Upload'
      showSubscriptionModal = true
      return
    }

    saveSessionPreferences()
    
    isSessionActive = true
    isPaused = false
    sessionProgress = 0
    timeRemaining = selectedDuration * 60 // Convert to seconds
    sessionCompleted = false
    error = ''
    showSettings = false // Hide settings during session

    // Start background music
    if (selectedMusic !== 'silence') {
      playBackgroundMusic()
    }

    // Start timer
    sessionTimer = setInterval(() => {
      if (!isPaused) {
        timeRemaining--
        sessionProgress = ((selectedDuration * 60 - timeRemaining) / (selectedDuration * 60)) * 100

        // Provide guidance at different phases
        provideGuidance()

        if (timeRemaining <= 0) {
          completeSession()
        }
      }
    }, 1000)

    // Set meditation session in store
    meditationSession.set({
      duration: selectedDuration,
      music: selectedMusic,
      moodBefore,
      startTime: new Date()
    })

    // Initial guidance
    if (guidanceText) {
      speakGuidance(getRandomGuidance('start'))
    }
  }

  function pauseSession() {
    isPaused = !isPaused
    
    if (audioElement) {
      if (isPaused) {
        audioElement.pause()
      } else {
        audioElement.play()
      }
    }
  }

  function stopSession() {
    if (sessionTimer) {
      clearInterval(sessionTimer)
      sessionTimer = null
    }
    
    if (audioElement) {
      audioElement.pause()
      audioElement = null
    }

    if (currentUtterance && speechSynthesis) {
      speechSynthesis.cancel()
    }

    isSessionActive = false
    isPaused = false
    sessionProgress = 0
    timeRemaining = 0
    isAudioPlaying = false
    isGuidancePlaying = false
    showSettings = true // Show settings again
  }

  function completeSession() {
    stopSession()
    sessionCompleted = true
    
    // Final guidance
    if (guidanceText) {
      speakGuidance(getRandomGuidance('end'))
    }
  }

  async function saveSession() {
    if (!$user) {
      error = 'Please sign in to save your session'
      return
    }

    if (!moodAfter) {
      error = 'Please select how you feel after the session'
      return
    }

    saving = true
    error = ''

    try {
      const sessionData = {
        user_id: $user.id,
        duration_minutes: selectedDuration,
        actual_duration_seconds: (selectedDuration * 60) - timeRemaining,
        background_theme: 'auto', // Auto-determined by mood
        background_music: selectedMusic,
        mood_before: moodBefore,
        mood_after: moodAfter,
        notes: sessionNotes.trim() || null,
        completed: sessionCompleted
      }

      const { data, error: saveError } = await saveMeditationSession(sessionData)

      if (saveError) {
        error = saveError.message || 'Failed to save session'
      } else {
        success = 'Session saved successfully!'
        
        // Check for achievements
        if ($user) {
          await autoCheckAchievements($user.id, 'meditation', {
            totalSessions: 1,
            totalMinutes: selectedDuration,
            currentStreak: 1
          })
        }

        // Reset form
        setTimeout(() => {
          moodBefore = ''
          moodAfter = ''
          sessionNotes = ''
          sessionCompleted = false
          success = ''
        }, 3000)
      }
    } catch (err) {
      console.error('Error saving session:', err)
      error = 'An unexpected error occurred'
    } finally {
      saving = false
    }
  }

  function playBackgroundMusic() {
    if (selectedMusic === 'silence' || selectedMusic === 'custom') return

    // Map music options to actual file names
    const musicFiles = {
      'nature': '/audio/nature-sounds.mp3',
      'ambient': '/audio/ambient-music.mp3',
      'binaural': '/audio/binaural-beats.mp3',
      'bowls': '/audio/tibetan-bowls.mp3',
      'whitenoise': '/audio/white-noise.mp3'
    }

    const musicFile = musicFiles[selectedMusic]
    if (!musicFile) return

    audioElement = new Audio(musicFile)
    audioElement.loop = true
    audioElement.volume = 0.3

    audioElement.play().then(() => {
      isAudioPlaying = true
    }).catch(error => {
      console.warn('Could not play background music:', error)
      // Continue without music
    })
  }

  function toggleMute() {
    if (audioElement) {
      audioElement.muted = !audioElement.muted
    }
  }

  function provideGuidance() {
    if (!guidanceText || !speechSynthesis) return

    const totalSeconds = selectedDuration * 60
    const elapsed = totalSeconds - timeRemaining
    const progressPercent = (elapsed / totalSeconds) * 100

    // Provide guidance at specific intervals
    if (elapsed === 60) { // 1 minute in
      speakGuidance(getRandomGuidance('start'))
    } else if (progressPercent >= 25 && progressPercent < 30) { // 25% through
      speakGuidance(getRandomGuidance('middle'))
    } else if (progressPercent >= 75 && progressPercent < 80) { // 75% through
      speakGuidance(getRandomGuidance('end'))
    }
  }

  function getRandomGuidance(phase) {
    const texts = guidanceTexts[phase] || guidanceTexts.middle
    return texts[Math.floor(Math.random() * texts.length)]
  }

  function speakGuidance(text) {
    if (!speechSynthesis || isGuidancePlaying) return

    // Cancel any existing speech
    speechSynthesis.cancel()

    currentUtterance = new SpeechSynthesisUtterance(text)
    currentUtterance.rate = 0.8 // Slower, more calming pace
    currentUtterance.pitch = 1.0
    currentUtterance.volume = 0.7

    currentUtterance.onstart = () => {
      isGuidancePlaying = true
    }

    currentUtterance.onend = () => {
      isGuidancePlaying = false
    }

    currentUtterance.onerror = () => {
      isGuidancePlaying = false
    }

    speechSynthesis.speak(currentUtterance)
  }

  function toggleGuidance() {
    if (isGuidancePlaying && speechSynthesis) {
      speechSynthesis.cancel()
      isGuidancePlaying = false
    } else if (guidanceText) {
      speakGuidance(getRandomGuidance('middle'))
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function getMoodBackground(mood) {
    return moodBackgrounds[mood] || 'from-primary-400 to-secondary-600'
  }

  function handleUpgrade() {
    showSubscriptionModal = true
  }

  $: canUseCustomMusic = canUseFeature('customMusicUpload')
  $: backgroundGradient = moodBefore ? getMoodBackground(moodBefore) : 'from-primary-400 to-secondary-600'
</script>

<svelte:head>
  <title>Meditation - Chitta</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br {backgroundGradient} relative overflow-hidden">
  <!-- Animated background elements -->
  <div class="absolute inset-0 overflow-hidden">
    <div class="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-white/15 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-bounce" style="animation-delay: 4s"></div>
  </div>

  <!-- Header -->
  <div class="relative z-10 flex items-center justify-between p-4">
    <button 
      on:click={() => goto('/')} 
      class="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
    >
      <ArrowLeft size={24} class="text-white" />
    </button>
    
    <h1 class="text-2xl font-bold text-white">Meditation</h1>
    
    <div class="flex items-center space-x-2">
      <button 
        on:click={() => showHistory = !showHistory}
        class="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
        title="View meditation history"
      >
        <History size={24} class="text-white" />
      </button>
      
      <button 
        on:click={() => showSettings = !showSettings}
        class="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
      >
        <Settings size={24} class="text-white" />
      </button>
    </div>
  </div>

  <div class="relative z-10 px-4 py-6 space-y-8">
    <!-- Historical Meditation Sessions -->
    {#if showHistory}
      <div class="max-w-2xl mx-auto">
        <HistoricalMeditationSessions />
      </div>
    {/if}

    <!-- Error/Success Messages -->
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm max-w-md mx-auto">
        {error}
      </div>
    {/if}

    {#if success}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl text-sm max-w-md mx-auto">
        {success}
      </div>
    {/if}

    {#if !isSessionActive && !sessionCompleted}
      <!-- Pre-Session Setup -->
      <div class="max-w-2xl mx-auto space-y-8">
        <!-- Mood Before -->
        <div class="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <h2 class="text-2xl font-bold text-white mb-6 text-center">How are you feeling right now?</h2>
          <div class="grid grid-cols-4 gap-4">
            {#each moodOptions as mood}
              <button
                on:click={() => moodBefore = mood.emoji}
                class="p-4 rounded-2xl transition-all duration-300 {
                  moodBefore === mood.emoji 
                    ? 'bg-white/30 border-2 border-white/50 shadow-lg scale-105' 
                    : 'bg-white/10 border-2 border-white/20 hover:bg-white/20'
                }"
              >
                <div class="text-3xl mb-2">{mood.emoji}</div>
                <div class="text-white text-sm font-medium">{mood.name}</div>
              </button>
            {/each}
          </div>
        </div>

        <!-- Settings Panel -->
        {#if showSettings}
          <div class="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 space-y-6">
            <h3 class="text-xl font-bold text-white mb-4">Session Settings</h3>
            
            <!-- Duration -->
            <div>
              <label class="block text-white font-medium mb-3">
                <Timer size={20} class="inline mr-2" />
                Duration
              </label>
              <div class="grid grid-cols-3 md:grid-cols-6 gap-3">
                {#each predefinedDurations as duration}
                  <button
                    on:click={() => selectedDuration = duration}
                    class="p-3 rounded-xl transition-all duration-300 {
                      selectedDuration === duration 
                        ? 'bg-white/30 text-white border-2 border-white/50' 
                        : 'bg-white/10 text-white/80 border-2 border-white/20 hover:bg-white/20'
                    }"
                  >
                    {duration}m
                  </button>
                {/each}
              </div>
            </div>

            <!-- Background Music -->
            <div>
              <label class="block text-white font-medium mb-3">
                <Music size={20} class="inline mr-2" />
                Background Music
              </label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each musicOptions as music}
                  <button
                    on:click={() => {
                      if (music.value === 'custom' && !canUseCustomMusic) {
                        subscriptionFeature = 'Custom Music Upload'
                        showSubscriptionModal = true
                        return
                      }
                      selectedMusic = music.value
                    }}
                    class="p-4 rounded-xl transition-all duration-300 text-left relative {
                      selectedMusic === music.value 
                        ? 'bg-white/30 border-2 border-white/50' 
                        : 'bg-white/10 border-2 border-white/20 hover:bg-white/20'
                    }"
                    disabled={music.value === 'custom' && !canUseCustomMusic}
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-white font-medium">{music.name}</div>
                        <div class="text-white/70 text-sm">{music.description}</div>
                      </div>
                      {#if music.value === 'custom' && !canUseCustomMusic}
                        <Crown size={16} class="text-orange-400" />
                      {/if}
                    </div>
                  </button>
                {/each}
              </div>
            </div>

            <!-- Meditation Guidance -->
            <div>
              <label class="block text-white font-medium mb-3">
                <Mic size={20} class="inline mr-2" />
                Voice Guidance (Optional)
              </label>
              <div class="bg-white/10 rounded-xl p-4 border border-white/20">
                <textarea
                  bind:value={guidanceText}
                  placeholder="Enter custom meditation guidance text that will be spoken during your session..."
                  class="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 resize-none focus:ring-2 focus:ring-white/50 focus:border-transparent backdrop-blur-sm"
                  rows="3"
                ></textarea>
                <p class="text-white/70 text-xs mt-2">
                  Leave empty to meditate in silence, or add text for spoken guidance during your session
                </p>
              </div>
            </div>
          </div>
        {/if}

        <!-- AI Assistant -->
        <MeditationAIAssistant 
          sessionDuration={selectedDuration}
          moodBefore={moodBefore}
          isSessionActive={false}
          sessionProgress={0}
          onUpgradeRequired={handleUpgrade}
        />

        <!-- Start Button -->
        {#if moodBefore}
          <div class="text-center">
            <button
              on:click={startSession}
              class="bg-white/20 backdrop-blur-sm text-white px-12 py-6 rounded-3xl font-bold text-xl hover:bg-white/30 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 border border-white/30"
            >
              <Play size={28} class="inline mr-3" />
              Begin Meditation ({selectedDuration} min)
            </button>
          </div>
        {/if}
      </div>
    {:else if isSessionActive}
      <!-- Active Session -->
      <div class="max-w-2xl mx-auto space-y-8 text-center">
        <!-- Progress Circle -->
        <div class="relative w-80 h-80 mx-auto">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <!-- Background circle -->
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgba(255,255,255,0.2)"
              stroke-width="2"
              fill="none"
            />
            <!-- Progress circle -->
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="white"
              stroke-width="3"
              fill="none"
              stroke-dasharray="283"
              stroke-dashoffset={283 - (283 * sessionProgress) / 100}
              stroke-linecap="round"
              class="transition-all duration-1000 ease-out"
            />
          </svg>
          
          <!-- Center content -->
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="text-6xl font-light text-white mb-4">
              {formatTime(timeRemaining)}
            </div>
            <div class="text-white/80 text-lg">
              {Math.round(sessionProgress)}% Complete
            </div>
          </div>
        </div>

        <!-- Session Controls -->
        <div class="flex items-center justify-center space-x-6">
          <button
            on:click={pauseSession}
            class="p-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
          >
            {#if isPaused}
              <Play size={32} class="text-white" />
            {:else}
              <Pause size={32} class="text-white" />
            {/if}
          </button>
          
          {#if audioElement}
            <button
              on:click={toggleMute}
              class="p-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
            >
              {#if audioElement.muted}
                <VolumeX size={24} class="text-white" />
              {:else}
                <Volume2 size={24} class="text-white" />
              {/if}
            </button>
          {/if}

          {#if guidanceText && speechSynthesis}
            <button
              on:click={toggleGuidance}
              class="p-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
            >
              {#if isGuidancePlaying}
                <MicOff size={24} class="text-white" />
              {:else}
                <Mic size={24} class="text-white" />
              {/if}
            </button>
          {/if}
          
          <button
            on:click={stopSession}
            class="p-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
          >
            <Square size={24} class="text-white" />
          </button>
        </div>

        <!-- AI Assistant during session -->
        <MeditationAIAssistant 
          sessionDuration={selectedDuration}
          moodBefore={moodBefore}
          isSessionActive={true}
          sessionProgress={sessionProgress}
          onUpgradeRequired={handleUpgrade}
        />

        <!-- Session Info -->
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-white">{selectedDuration}</div>
              <div class="text-white/70 text-sm">Minutes</div>
            </div>
            <div>
              <div class="text-2xl text-white">{moodBefore}</div>
              <div class="text-white/70 text-sm">Starting Mood</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-white">{selectedMusic === 'silence' ? '🔇' : '🎵'}</div>
              <div class="text-white/70 text-sm">Audio</div>
            </div>
          </div>
        </div>
      </div>
    {:else if sessionCompleted}
      <!-- Post-Session -->
      <div class="max-w-2xl mx-auto">
        <div class="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <h2 class="text-2xl font-bold text-white mb-6 text-center">How do you feel now?</h2>
          <div class="grid grid-cols-4 gap-4 mb-6">
            {#each moodOptions as mood}
              <button
                on:click={() => moodAfter = mood.emoji}
                class="p-4 rounded-2xl transition-all duration-300 {
                  moodAfter === mood.emoji 
                    ? 'bg-white/30 border-2 border-white/50 shadow-lg scale-105' 
                    : 'bg-white/10 border-2 border-white/20 hover:bg-white/20'
                }"
              >
                <div class="text-3xl mb-2">{mood.emoji}</div>
                <div class="text-white text-sm font-medium">{mood.name}</div>
              </button>
            {/each}
          </div>

          <!-- Session Notes -->
          <div class="mb-6">
            <label class="block text-white font-medium mb-3">
              Session Notes (Optional)
            </label>
            <textarea
              bind:value={sessionNotes}
              placeholder="How was your meditation? Any insights or reflections..."
              class="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 resize-none focus:ring-2 focus:ring-white/50 focus:border-transparent backdrop-blur-sm"
              rows="3"
            ></textarea>
          </div>

          <button
            on:click={saveSession}
            disabled={saving}
            class="w-full bg-white/20 backdrop-blur-sm text-white py-4 rounded-2xl font-bold text-lg hover:bg-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if saving}
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline mr-2"></div>
              Saving Session...
            {:else}
              <Heart size={20} class="inline mr-2" />
              Complete Session
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Subscription Modal -->
<SubscriptionModal 
  bind:isOpen={showSubscriptionModal}
  feature={subscriptionFeature}
  onClose={() => showSubscriptionModal = false}
/>

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

  /* Backdrop blur support */
  .backdrop-blur-sm {
    backdrop-filter: blur(4px);
  }

  .backdrop-blur-lg {
    backdrop-filter: blur(16px);
  }
</style>