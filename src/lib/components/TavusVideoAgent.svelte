<script>
  import { onMount, onDestroy } from 'svelte'
  import { Video, Loader, X, Maximize2, Minimize2 } from '@lucide/svelte'

  export let conversationUrl = ''
  export let onClose = () => {}
  export let mood = ''

  let iframeElement = null
  let isLoading = true
  let isFullscreen = false
  let error = ''

  onMount(() => {
    if (conversationUrl) {
      // Add event listener for iframe load
      if (iframeElement) {
        iframeElement.addEventListener('load', handleIframeLoad)
        iframeElement.addEventListener('error', handleIframeError)
      }
    }
  })

  onDestroy(() => {
    if (iframeElement) {
      iframeElement.removeEventListener('load', handleIframeLoad)
      iframeElement.removeEventListener('error', handleIframeError)
    }
  })

  function handleIframeLoad() {
    isLoading = false
    error = ''
  }

  function handleIframeError() {
    isLoading = false
    error = 'Failed to load video agent. Please try again.'
  }

  function toggleFullscreen() {
    isFullscreen = !isFullscreen
  }

  function getMoodName(emoji) {
    const moodNames = {
      '😊': 'Happy',
      '😌': 'Calm',
      '😢': 'Sad',
      '😠': 'Angry',
      '😰': 'Anxious',
      '😴': 'Tired',
      '🤗': 'Loved',
      '😤': 'Frustrated'
    }
    return moodNames[emoji] || 'Reflective'
  }
</script>

<div class="tavus-video-agent {isFullscreen ? 'fullscreen' : ''}" class:error>
  <!-- Header -->
  <div class="agent-header">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
        <Video size={20} class="text-white" />
      </div>
      <div>
        <h3 class="font-bold text-gray-800">AI Wellness Coach</h3>
        <p class="text-sm text-gray-600">
          Supporting your {getMoodName(mood).toLowerCase()} mood
        </p>
      </div>
    </div>
    
    <div class="flex items-center space-x-2">
      <button
        on:click={toggleFullscreen}
        class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {#if isFullscreen}
          <Minimize2 size={18} class="text-gray-600" />
        {:else}
          <Maximize2 size={18} class="text-gray-600" />
        {/if}
      </button>
      
      <button
        on:click={onClose}
        class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Close video agent"
      >
        <X size={18} class="text-gray-600" />
      </button>
    </div>
  </div>

  <!-- Video Container -->
  <div class="video-container">
    {#if isLoading}
      <div class="loading-state">
        <Loader size={48} class="text-purple-500 animate-spin mb-4" />
        <h4 class="text-lg font-semibold text-gray-800 mb-2">Connecting to your AI coach...</h4>
        <p class="text-gray-600 text-sm">This may take a few moments</p>
      </div>
    {/if}

    {#if error}
      <div class="error-state">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <X size={32} class="text-red-500" />
        </div>
        <h4 class="text-lg font-semibold text-gray-800 mb-2">Connection Error</h4>
        <p class="text-gray-600 text-sm mb-4">{error}</p>
        <button
          on:click={() => window.location.reload()}
          class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    {:else if conversationUrl}
      <iframe
        bind:this={iframeElement}
        src={conversationUrl}
        title="Tavus AI Video Agent"
        class="video-iframe"
        class:hidden={isLoading}
        allow="camera; microphone; autoplay; encrypted-media; fullscreen"
        allowfullscreen
      ></iframe>
    {/if}
  </div>

  <!-- Footer -->
  <div class="agent-footer">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span class="text-sm text-gray-600">Live AI Coach</span>
      </div>
      
      <div class="flex items-center space-x-4 text-xs text-gray-500">
        <span>Powered by Tavus</span>
        <span>•</span>
        <span>Secure & Private</span>
      </div>
    </div>
  </div>
</div>

<style>
  .tavus-video-agent {
    @apply bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden;
    width: 100%;
    max-width: 600px;
    height: 500px;
    display: flex;
    flex-direction: column;
  }

  .tavus-video-agent.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    max-width: none;
    height: 100vh;
    border-radius: 0;
  }

  .agent-header {
    @apply flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50;
    flex-shrink: 0;
  }

  .video-container {
    @apply relative flex-1 bg-gray-900;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .video-iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: #000;
  }

  .loading-state,
  .error-state {
    @apply text-center p-8;
    color: white;
  }

  .agent-footer {
    @apply p-3 bg-gray-50 border-t border-gray-200;
    flex-shrink: 0;
  }

  .hidden {
    display: none;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .tavus-video-agent {
      height: 400px;
    }
    
    .tavus-video-agent.fullscreen {
      height: 100vh;
    }
  }
</style>