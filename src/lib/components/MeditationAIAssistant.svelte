<script>
  import { onMount, onDestroy } from 'svelte'
  import { 
    isAIAssistantActive, 
    aiAudioPlaying, 
    aiAudioError, 
    currentAIPrompt,
    isElevenLabsAvailable,
    speakMeditationGuidance,
    stopAIAudio,
    checkElevenLabsStatus
  } from '$lib/stores/elevenlabs.js'
  import { subscriptionStatus } from '$lib/stores/subscription.js'
  import { meditationPrompts, sessionFlow, voiceSettings } from '$lib/config/meditation-prompts.js'
  import { 
    Bot, 
    Volume2, 
    VolumeX, 
    Play, 
    Pause, 
    Crown, 
    AlertCircle,
    Loader,
    Sparkles,
    Mic
  } from '@lucide/svelte'

  export let sessionDuration = 10 // in minutes
  export let moodBefore = ''
  export let isSessionActive = false
  export let sessionProgress = 0 // 0-100
  export let onUpgradeRequired = () => {}

  let aiStatus = { available: false, error: null }
  let currentPhase = 'welcome'
  let lastGuidanceTime = 0
  let guidanceInterval = null
  let mounted = false

  // Reactive statements
  $: canUseAI = isElevenLabsAvailable()
  $: sessionPhase = getCurrentPhase(sessionProgress)
  $: shouldProvideGuidance = isSessionActive && $isAIAssistantActive && canUseAI

  onMount(async () => {
    mounted = true
    await checkAIStatus()
    
    if (shouldProvideGuidance) {
      startAIGuidance()
    }
  })

  onDestroy(() => {
    stopAIGuidance()
  })

  // Watch for session state changes
  $: if (mounted && isSessionActive && $isAIAssistantActive && canUseAI) {
    startAIGuidance()
  } else if (mounted && (!isSessionActive || !$isAIAssistantActive)) {
    stopAIGuidance()
  }

  async function checkAIStatus() {
    try {
      aiStatus = await checkElevenLabsStatus()
    } catch (error) {
      aiStatus = { available: false, error: error.message }
    }
  }

  function getCurrentPhase(progress) {
    let cumulativeProgress = 0
    
    for (const phase of sessionFlow.phases) {
      cumulativeProgress += phase.duration * 100
      if (progress <= cumulativeProgress) {
        return phase.name
      }
    }
    
    return 'closing'
  }

  function getGuidanceText(phase) {
    const prompts = meditationPrompts
    
    switch (phase) {
      case 'welcome':
        const startPrompts = moodBefore ? 
          prompts.moodBased[getMoodKey(moodBefore)] || prompts.sessionStart.general :
          prompts.sessionStart.general
        return getRandomPrompt(startPrompts)
        
      case 'breathing':
        return getRandomPrompt(prompts.breathing.introduction)
        
      case 'main_practice':
        return getRandomPrompt(prompts.mindfulness.presentMoment)
        
      case 'deepening':
        return getRandomPrompt(prompts.transitions.deepening)
        
      case 'closing':
        return getRandomPrompt(prompts.sessionEnd.gratitude)
        
      default:
        return getRandomPrompt(prompts.mindfulness.presentMoment)
    }
  }

  function getMoodKey(mood) {
    const moodMap = {
      '😊': 'happy',
      '😌': 'calm',
      '😢': 'sad',
      '😠': 'stressed',
      '😰': 'anxious',
      '😴': 'calm',
      '🤗': 'happy',
      '😤': 'stressed'
    }
    return moodMap[mood] || 'calm'
  }

  function getRandomPrompt(promptArray) {
    if (!promptArray || promptArray.length === 0) {
      return "Continue to breathe deeply and stay present in this moment."
    }
    return promptArray[Math.floor(Math.random() * promptArray.length)]
  }

  async function startAIGuidance() {
    if (!canUseAI || guidanceInterval) return

    // Provide initial guidance
    await provideGuidance()

    // Set up periodic guidance based on session duration
    const guidanceFrequency = Math.max(60000, (sessionDuration * 60000) / 8) // Every 1-2 minutes
    
    guidanceInterval = setInterval(async () => {
      if (shouldProvideGuidance && !$aiAudioPlaying) {
        await provideGuidance()
      }
    }, guidanceFrequency)
  }

  function stopAIGuidance() {
    if (guidanceInterval) {
      clearInterval(guidanceInterval)
      guidanceInterval = null
    }
    stopAIAudio()
  }

  async function provideGuidance() {
    if (!shouldProvideGuidance || $aiAudioPlaying) return

    try {
      const phase = getCurrentPhase(sessionProgress)
      const guidanceText = getGuidanceText(phase)
      
      // Use premium voice settings if available
      const voice = $subscriptionStatus.isPremium ? voiceSettings.premium : voiceSettings.default
      
      await speakMeditationGuidance(guidanceText, voice)
      lastGuidanceTime = Date.now()
    } catch (error) {
      console.error('Error providing AI guidance:', error)
    }
  }

  function toggleAIAssistant() {
    if (!canUseAI) {
      onUpgradeRequired()
      return
    }
    
    isAIAssistantActive.update(active => !active)
  }

  function formatPhase(phase) {
    return phase.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
</script>

<!-- AI Assistant Control Panel -->
<div class="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-xl">
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
        <Bot size={20} class="text-white" />
      </div>
      <div>
        <h3 class="font-bold text-white text-lg">AI Meditation Guide</h3>
        <p class="text-white/80 text-sm">
          {canUseAI ? 'Premium AI assistance' : 'Premium feature'}
        </p>
      </div>
    </div>
    
    <!-- Premium Badge -->
    {#if !canUseAI}
      <div class="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
        <Crown size={14} class="text-white" />
        <span class="text-white text-xs font-bold">Premium</span>
      </div>
    {/if}
  </div>

  <!-- AI Status and Controls -->
  <div class="space-y-4">
    {#if !canUseAI}
      <!-- Upgrade Prompt -->
      <div class="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-300/30">
        <div class="flex items-center space-x-3 mb-3">
          <Sparkles size={20} class="text-orange-300" />
          <span class="text-white font-medium">AI Meditation Guide</span>
        </div>
        <p class="text-white/80 text-sm mb-3">
          Get personalized, real-time meditation guidance with our AI assistant powered by ElevenLabs.
        </p>
        <ul class="text-white/70 text-xs space-y-1 mb-4">
          <li>• Personalized guidance based on your mood</li>
          <li>• Real-time meditation instructions</li>
          <li>• Soothing AI voice coaching</li>
          <li>• Adaptive session flow</li>
        </ul>
        <button
          on:click={onUpgradeRequired}
          class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-300"
        >
          Upgrade for AI Guide
        </button>
      </div>
    {:else}
      <!-- AI Controls -->
      <div class="space-y-3">
        <!-- Toggle Button -->
        <button
          on:click={toggleAIAssistant}
          class="w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 {
            $isAIAssistantActive 
              ? 'bg-green-500/20 border border-green-400/30' 
              : 'bg-white/10 border border-white/20 hover:bg-white/20'
          }"
        >
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center {
              $isAIAssistantActive ? 'bg-green-500' : 'bg-gray-500'
            }">
              {#if $isAIAssistantActive}
                <Mic size={16} class="text-white" />
              {:else}
                <VolumeX size={16} class="text-white" />
              {/if}
            </div>
            <span class="text-white font-medium">
              {$isAIAssistantActive ? 'AI Guide Active' : 'Enable AI Guide'}
            </span>
          </div>
          
          <div class="w-12 h-6 rounded-full transition-colors duration-300 {
            $isAIAssistantActive ? 'bg-green-500' : 'bg-gray-600'
          }">
            <div class="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 mt-0.5 {
              $isAIAssistantActive ? 'translate-x-6 ml-1' : 'translate-x-1'
            }"></div>
          </div>
        </button>

        <!-- AI Status -->
        {#if $isAIAssistantActive}
          <div class="bg-white/10 rounded-xl p-3 border border-white/20">
            <div class="flex items-center justify-between mb-2">
              <span class="text-white/80 text-sm font-medium">Current Phase</span>
              <span class="text-white text-sm">{formatPhase(sessionPhase)}</span>
            </div>
            
            {#if $aiAudioPlaying}
              <div class="flex items-center space-x-2 text-green-400">
                <Loader size={14} class="animate-spin" />
                <span class="text-sm">Speaking guidance...</span>
              </div>
            {:else if $currentAIPrompt}
              <div class="flex items-center space-x-2 text-blue-400">
                <Loader size={14} class="animate-spin" />
                <span class="text-sm">Preparing guidance...</span>
              </div>
            {:else}
              <div class="flex items-center space-x-2 text-white/60">
                <Volume2 size={14} />
                <span class="text-sm">Ready for guidance</span>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Error Display -->
        {#if $aiAudioError}
          <div class="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
            <div class="flex items-center space-x-2 text-red-400">
              <AlertCircle size={16} />
              <span class="text-sm font-medium">AI Error</span>
            </div>
            <p class="text-red-300 text-xs mt-1">{$aiAudioError}</p>
          </div>
        {/if}

        <!-- AI Status Info -->
        {#if aiStatus.available && $subscriptionStatus.isPremium}
          <div class="bg-blue-500/20 border border-blue-400/30 rounded-xl p-3">
            <div class="flex items-center space-x-2 text-blue-400 mb-2">
              <Crown size={14} />
              <span class="text-sm font-medium">Premium AI Active</span>
            </div>
            <p class="text-blue-300 text-xs">
              Enhanced voice quality and personalized guidance
            </p>
          </div>
        {:else if aiStatus.available}
          <div class="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-3">
            <div class="flex items-center space-x-2 text-yellow-400 mb-2">
              <Sparkles size={14} />
              <span class="text-sm font-medium">Trial AI Active</span>
            </div>
            <p class="text-yellow-300 text-xs">
              {$subscriptionStatus.trialDaysLeft} days remaining
            </p>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Smooth transitions for all interactive elements */
  button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Pulse animation for active states */
  .animate-pulse-gentle {
    animation: pulse-gentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse-gentle {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }
</style>