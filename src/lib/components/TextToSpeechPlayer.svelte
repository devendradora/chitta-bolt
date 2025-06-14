<script>
  import { onMount, onDestroy } from 'svelte'
  import { Volume2, VolumeX, Play, Pause, Settings, Check } from '@lucide/svelte'
  
  export let text = ''
  export let autoPlay = false
  export let showSettings = true
  
  let isPlaying = false
  let isPaused = false
  let isMuted = false
  let utterance = null
  let speechSynthesis = null
  let availableVoices = []
  let selectedVoice = null
  let voiceRate = 1.0
  let voicePitch = 1.0
  let showVoiceSettings = false
  
  onMount(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis = window.speechSynthesis
      
      // Load available voices
      const loadVoices = () => {
        availableVoices = speechSynthesis.getVoices()
        if (availableVoices.length > 0) {
          // Try to find a good default voice
          const preferredVoice = availableVoices.find(voice => 
            voice.name.includes('Female') || 
            voice.name.includes('Samantha') || 
            voice.name.includes('Google') ||
            voice.lang === 'en-US'
          )
          selectedVoice = preferredVoice || availableVoices[0]
        }
      }
      
      // Chrome loads voices asynchronously
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices
      }
      
      loadVoices()
      
      // Auto-play if enabled
      if (autoPlay && text) {
        setTimeout(() => {
          playText()
        }, 500)
      }
    }
  })
  
  onDestroy(() => {
    stopSpeech()
  })
  
  function playText() {
    if (!speechSynthesis || !text || isPlaying) return
    
    // Cancel any ongoing speech
    stopSpeech()
    
    // Create new utterance
    utterance = new SpeechSynthesisUtterance(text)
    
    // Set voice if available
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }
    
    // Set rate and pitch
    utterance.rate = voiceRate
    utterance.pitch = voicePitch
    utterance.volume = isMuted ? 0 : 1
    
    // Set event handlers
    utterance.onstart = () => {
      isPlaying = true
      isPaused = false
    }
    
    utterance.onend = () => {
      isPlaying = false
      isPaused = false
    }
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      isPlaying = false
      isPaused = false
    }
    
    // Start speaking
    speechSynthesis.speak(utterance)
  }
  
  function pauseSpeech() {
    if (!speechSynthesis || !isPlaying) return
    
    if (isPaused) {
      speechSynthesis.resume()
      isPaused = false
    } else {
      speechSynthesis.pause()
      isPaused = true
    }
  }
  
  function stopSpeech() {
    if (!speechSynthesis) return
    
    speechSynthesis.cancel()
    isPlaying = false
    isPaused = false
  }
  
  function toggleMute() {
    isMuted = !isMuted
    
    if (utterance) {
      utterance.volume = isMuted ? 0 : 1
    }
  }
  
  function handleVoiceChange(event) {
    const voiceURI = event.target.value
    selectedVoice = availableVoices.find(voice => voice.voiceURI === voiceURI)
    
    // If currently playing, restart with new voice
    if (isPlaying) {
      const wasPlaying = isPlaying
      stopSpeech()
      if (wasPlaying) {
        setTimeout(() => {
          playText()
        }, 100)
      }
    }
  }
  
  function updateRate(value) {
    voiceRate = parseFloat(value)
    
    // If currently playing, restart with new rate
    if (isPlaying) {
      const wasPlaying = isPlaying
      stopSpeech()
      if (wasPlaying) {
        setTimeout(() => {
          playText()
        }, 100)
      }
    }
  }
  
  function updatePitch(value) {
    voicePitch = parseFloat(value)
    
    // If currently playing, restart with new pitch
    if (isPlaying) {
      const wasPlaying = isPlaying
      stopSpeech()
      if (wasPlaying) {
        setTimeout(() => {
          playText()
        }, 100)
      }
    }
  }
</script>

<div class="text-to-speech-player">
  <!-- Player Controls -->
  <div class="flex items-center justify-between bg-white rounded-xl p-3 shadow-md border border-gray-200">
    <div class="flex items-center space-x-2">
      {#if isPlaying}
        <button
          on:click={pauseSpeech}
          class="p-2 rounded-full bg-primary-100 hover:bg-primary-200 transition-colors"
          title={isPaused ? "Resume" : "Pause"}
        >
          {#if isPaused}
            <Play size={20} class="text-primary-600" />
          {:else}
            <Pause size={20} class="text-primary-600" />
          {/if}
        </button>
        
        <button
          on:click={stopSpeech}
          class="p-2 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
          title="Stop"
        >
          <span class="block w-3 h-3 bg-red-600 rounded-sm"></span>
        </button>
      {:else}
        <button
          on:click={playText}
          class="p-2 rounded-full bg-primary-100 hover:bg-primary-200 transition-colors"
          title="Play"
        >
          <Play size={20} class="text-primary-600" />
        </button>
      {/if}
      
      <button
        on:click={toggleMute}
        class="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {#if isMuted}
          <VolumeX size={20} class="text-gray-600" />
        {:else}
          <Volume2 size={20} class="text-gray-600" />
        {/if}
      </button>
    </div>
    
    {#if showSettings}
      <button
        on:click={() => showVoiceSettings = !showVoiceSettings}
        class="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        title="Voice Settings"
      >
        <Settings size={20} class="text-gray-600" />
      </button>
    {/if}
  </div>
  
  <!-- Voice Settings Panel -->
  {#if showVoiceSettings && showSettings}
    <div class="mt-3 bg-white rounded-xl p-4 shadow-md border border-gray-200 space-y-4">
      <h3 class="font-medium text-gray-800">Voice Settings</h3>
      
      <!-- Voice Selection -->
      <div>
        <label for="voice-select" class="block text-sm font-medium text-gray-700 mb-1">Voice</label>
        <select 
          id="voice-select"
          on:change={handleVoiceChange}
          class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {#each availableVoices as voice}
            <option 
              value={voice.voiceURI} 
              selected={selectedVoice && selectedVoice.voiceURI === voice.voiceURI}
            >
              {voice.name} ({voice.lang})
            </option>
          {/each}
        </select>
      </div>
      
      <!-- Rate Control -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Speed: {voiceRate.toFixed(1)}x</label>
        <input 
          type="range" 
          min="0.5" 
          max="2" 
          step="0.1" 
          value={voiceRate}
          on:input={(e) => updateRate(e.target.value)}
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      
      <!-- Pitch Control -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Pitch: {voicePitch.toFixed(1)}</label>
        <input 
          type="range" 
          min="0.5" 
          max="2" 
          step="0.1" 
          value={voicePitch}
          on:input={(e) => updatePitch(e.target.value)}
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      
      <!-- Apply Button -->
      <button
        on:click={() => showVoiceSettings = false}
        class="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
      >
        <Check size={16} />
        <span>Apply Settings</span>
      </button>
    </div>
  {/if}
</div>

<style>
  /* Custom range input styling */
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    outline: none;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: #10b981;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: #10b981;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: background 0.2s;
  }
  
  input[type="range"]::-webkit-slider-thumb:hover {
    background: #059669;
  }
  
  input[type="range"]::-moz-range-thumb:hover {
    background: #059669;
  }
</style>