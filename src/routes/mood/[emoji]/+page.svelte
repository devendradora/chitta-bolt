<script>
  import { page } from '$app/stores'
  import { user } from '$lib/stores/auth.js'
  import { selectedMood, moodCategories, inspirationalQuotes, saveMoodEntry } from '$lib/stores/mood.js'
  import { subscriptionStatus, canUseFeature } from '$lib/stores/subscription.js'
  import { supabase } from '$lib/supabase.js'
  import { ArrowLeft, Send, Sparkles, Video, Play, BookOpen, Brain, History } from '@lucide/svelte'
  import { goto } from '$app/navigation'
  import SubscriptionModal from '$lib/components/SubscriptionModal.svelte'
  import HistoricalMoodEntries from '$lib/components/HistoricalMoodEntries.svelte'
  import WellnessQuiz from '$lib/components/WellnessQuiz.svelte'
  import WellnessFlashcards from '$lib/components/WellnessFlashcards.svelte'

  // Make emoji reactive and mutable
  let emoji = $page.params.emoji
  let selectedCategory = ''
  let description = ''
  let currentQuoteIndex = 0
  let saving = false
  let error = ''
  let success = ''
  
  // Tavus Video Agent state
  let showVideoAgent = false
  let conversationUrl = ''
  let loadingVideoAgent = false
  let videoAgentError = ''
  
  // Subscription modal state
  let showSubscriptionModal = false
  let subscriptionFeature = ''

  // Quiz and flashcards state
  let showQuiz = false
  let showFlashcards = false

  // Historical entries state
  let showHistory = false

  // Reactive variables that update when emoji changes
  $: categories = moodCategories[emoji] || []
  $: quotes = inspirationalQuotes[emoji] || []
  $: canUseTavusAgent = canUseFeature('tavusVideoAgent')
  $: canUseQuizFeatures = canUseFeature('quizFlashcards')

  // Mood options for emoji picker
  const moodOptions = [
    { emoji: '😊', name: 'Happy', description: 'Feeling joyful and content' },
    { emoji: '😌', name: 'Calm', description: 'Peaceful and relaxed' },
    { emoji: '😢', name: 'Sad', description: 'Feeling down or melancholy' },
    { emoji: '😠', name: 'Angry', description: 'Frustrated or irritated' },
    { emoji: '😰', name: 'Anxious', description: 'Worried or nervous' },
    { emoji: '😴', name: 'Tired', description: 'Exhausted or sleepy' },
    { emoji: '🤗', name: 'Loved', description: 'Feeling appreciated and cared for' },
    { emoji: '😤', name: 'Frustrated', description: 'Annoyed or exasperated' }
  ]

  function handleEmojiChange(newEmoji) {
    emoji = newEmoji
    // Reset category when emoji changes
    selectedCategory = ''
    // Reset video agent
    showVideoAgent = false
    conversationUrl = ''
    // Update URL
    goto(`/mood/${newEmoji}`)
  }

  function nextQuote() {
    currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length
  }

  async function handleSaveMoodEntry() {
    if (!$user) {
      error = 'You must be logged in to save mood entries'
      return
    }
    
    saving = true
    error = ''
    success = ''
    
    console.log('Saving mood entry with data:', {
      userId: $user.id,
      emoji,
      moodTitle: getMoodName(),
      description: description.trim() || null,
      category: selectedCategory || null
    })
    
    try {
      const moodTitle = getMoodName()
      const { data, error: saveError } = await saveMoodEntry(
        $user.id,
        emoji,
        moodTitle,
        description.trim() || null,
        selectedCategory || null
      )
      
      if (saveError) {
        console.error('Error saving mood entry:', saveError)
        error = saveError.message || 'Failed to save mood entry. Please try again.'
      } else {
        console.log('Mood entry saved successfully:', data)
        success = 'Mood entry saved successfully!'
        
        // Redirect after a short delay to show success message
        setTimeout(() => {
          goto('/')
        }, 1500)
      }
    } catch (err) {
      console.error('Unexpected error saving mood entry:', err)
      error = 'An unexpected error occurred. Please try again.'
    }
    
    saving = false
  }

  async function handleStartVideoAgent() {
    if (!canUseTavusAgent) {
      subscriptionFeature = 'AI Video Coach'
      showSubscriptionModal = true
      return
    }

    loadingVideoAgent = true
    videoAgentError = ''
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-tavus-conversation`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood: emoji,
          category: selectedCategory,
          context: description.trim() || null
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create video session: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      conversationUrl = result.conversation_url
      showVideoAgent = true
      
    } catch (err) {
      console.error('Error starting video agent:', err)
      videoAgentError = err.message || 'Failed to start video agent'
    } finally {
      loadingVideoAgent = false
    }
  }

  function handleCloseVideoAgent() {
    showVideoAgent = false
    conversationUrl = ''
  }

  function handleQuizStart() {
    if (!canUseQuizFeatures) {
      subscriptionFeature = 'Interactive Learning Tools'
      showSubscriptionModal = true
      return
    }
    showQuiz = true
  }

  function handleFlashcardsStart() {
    if (!canUseQuizFeatures) {
      subscriptionFeature = 'Interactive Learning Tools'
      showSubscriptionModal = true
      return
    }
    showFlashcards = true
  }

  function handleUpgradeRequired() {
    subscriptionFeature = 'Interactive Learning Tools'
    showSubscriptionModal = true
  }

  function getSuggestions() {
    const suggestions = {
      '😊': ['Share your joy with a friend', 'Take a moment to appreciate this feeling', 'Write down what made you happy'],
      '😌': ['Practice deep breathing', 'Take a peaceful walk', 'Listen to calming music'],
      '😢': ['Allow yourself to feel', 'Reach out to someone you trust', 'Practice self-compassion'],
      '😠': ['Take 10 deep breaths', 'Go for a walk', 'Write down your feelings'],
      '😰': ['Try the 5-4-3-2-1 grounding technique', 'Practice progressive muscle relaxation', 'Talk to someone'],
      '😴': ['Take a short nap if possible', 'Ensure good sleep hygiene tonight', 'Consider what\'s draining your energy'],
      '🤗': ['Express gratitude to someone', 'Spread this feeling to others', 'Savor this moment'],
      '😤': ['Step away from the situation', 'Practice patience exercises', 'Focus on what you can control']
    }
    return suggestions[emoji] || []
  }

  function getMoodName() {
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

  function getSelectedMood() {
    return moodOptions.find(mood => mood.emoji === emoji)
  }
</script>

<svelte:head>
  <title>Mood Check-in - Chitta</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <button on:click={() => goto('/')} class="p-3 rounded-2xl hover:bg-white/70 transition-colors">
      <ArrowLeft size={24} class="text-gray-600" />
    </button>
    <h1 class="text-2xl font-semibold text-gray-800">Mood Check-in</h1>
    <button 
      on:click={() => showHistory = !showHistory}
      class="p-3 rounded-2xl hover:bg-white/70 transition-colors"
      title="View mood history"
    >
      <History size={24} class="text-gray-600" />
    </button>
  </div>

  <!-- Historical Mood Entries -->
  {#if showHistory}
    <div class="mb-8">
      <HistoricalMoodEntries />
    </div>
  {/if}

  <!-- Video Agent Modal -->
  {#if showVideoAgent && conversationUrl}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative">
        <!-- Video Agent Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Video size={20} class="text-white" />
            </div>
            <div>
              <h3 class="font-bold text-gray-800">AI Wellness Coach</h3>
              <p class="text-sm text-gray-600">Supporting your {getMoodName().toLowerCase()} mood</p>
            </div>
          </div>
          <button
            on:click={handleCloseVideoAgent}
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} class="text-gray-600" />
          </button>
        </div>

        <!-- Video Container -->
        <div class="relative bg-gray-900" style="height: 400px;">
          <iframe
            src={conversationUrl}
            title="Tavus AI Video Agent"
            class="w-full h-full border-none"
            allow="camera; microphone; autoplay; encrypted-media; fullscreen"
            allowfullscreen
          ></iframe>
        </div>

        <!-- Video Agent Footer -->
        <div class="p-3 bg-gray-50 border-t border-gray-200">
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
    </div>
  {/if}

  <!-- Quiz Modal -->
  {#if showQuiz}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <WellnessQuiz 
        {mood}
        {category}
        on:close={() => showQuiz = false}
      />
    </div>
  {/if}

  <!-- Flashcards Modal -->
  {#if showFlashcards}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <WellnessFlashcards 
        {mood}
        {category}
        on:close={() => showFlashcards = false}
      />
    </div>
  {/if}

  <!-- Emoji Picker Section -->
  <div class="mb-8">
    <h2 class="text-lg font-semibold text-gray-800 mb-4">How are you feeling?</h2>
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-primary-100">
      <div class="grid grid-cols-4 gap-3">
        {#each moodOptions as mood}
          <button
            on:click={() => handleEmojiChange(mood.emoji)}
            class="p-3 rounded-xl transition-all duration-300 {
              emoji === mood.emoji 
                ? 'bg-primary-100 border-2 border-primary-300 shadow-md scale-105' 
                : 'bg-gray-50 border-2 border-gray-200 hover:bg-primary-50 hover:border-primary-200'
            }"
          >
            <div class="text-2xl mb-1">{mood.emoji}</div>
            <div class="text-xs font-medium text-gray-700">{mood.name}</div>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Selected Mood Display -->
  <div class="text-center mb-10">
    <div class="text-9xl mb-6 floating">{emoji}</div>
    <h2 class="text-3xl font-bold text-gray-800 mb-3">You're feeling {getMoodName().toLowerCase()}</h2>
    <p class="text-gray-600 text-lg">Let's explore this feeling together</p>
  </div>

  <!-- Error/Success Messages -->
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
      {error}
    </div>
  {/if}

  {#if success}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl text-sm mb-6">
      {success}
    </div>
  {/if}

  {#if videoAgentError}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
      Video Agent Error: {videoAgentError}
    </div>
  {/if}

  <!-- Categories -->
  <div class="bg-white rounded-3xl p-8 mb-6 shadow-sm border border-primary-100">
    <h3 class="text-xl font-semibold text-gray-800 mb-6">What's this feeling related to?</h3>
    <div class="grid grid-cols-2 gap-4">
      {#each categories as category}
        <button
          on:click={() => selectedCategory = category}
          class="p-4 rounded-2xl border-2 transition-all duration-200 {
            selectedCategory === category 
              ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md' 
              : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25'
          }"
        >
          <span class="font-medium">{category}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Description -->
  <div class="bg-white rounded-3xl p-8 mb-6 shadow-sm border border-primary-100">
    <h3 class="text-xl font-semibold text-gray-800 mb-6">Tell us more</h3>
    <textarea
      bind:value={description}
      placeholder="What's on your mind? Share as much or as little as you'd like..."
      class="w-full p-5 border border-gray-200 rounded-2xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      rows="4"
    ></textarea>
    <p class="text-sm text-gray-500 mt-2">Your thoughts and reflections will be saved securely for your personal tracking.</p>
  </div>

  <!-- Save Button (moved after description) -->
  <div class="mb-6">
    <button
      on:click={handleSaveMoodEntry}
      disabled={saving}
      class="w-full bg-primary-600 text-white py-5 rounded-3xl font-semibold flex items-center justify-center space-x-3 hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
      <Send size={22} />
      <span class="text-lg">{saving ? 'Saving...' : 'Save Mood Entry'}</span>
    </button>
  </div>

  <!-- Quiz and Flashcards Section (Free) -->
  <div class="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 space-y-6 mb-6">
    <div class="flex items-start justify-between">
      <div class="flex items-center space-x-3 mb-3">
        <div class="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
          <Sparkles size={20} class="text-white" />
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-800">Explore & Learn</h3>
          <p class="text-sm text-gray-600">Discover insights about your {getMoodName().toLowerCase()} mood</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Quiz Button -->
      <button
        on:click={handleQuizStart}
        class="p-4 rounded-2xl border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 text-left group relative overflow-hidden"
      >
        <div class="flex items-center space-x-3 mb-3">
          <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <Brain size={24} class="text-white" />
          </div>
          <div>
            <h4 class="font-bold text-gray-800 group-hover:text-primary-700 transition-colors">Wellness Quiz</h4>
            <p class="text-sm text-gray-600 leading-relaxed">
              Test your knowledge and learn new insights about your emotional state
            </p>
          </div>
        </div>
        
        <div class="flex items-center text-sm font-medium text-primary-600 group-hover:text-primary-700 transition-colors mt-3">
          <Play size={16} class="mr-2" />
          <span>Start Quiz</span>
        </div>
      </button>

      <!-- Flashcards Button -->
      <button
        on:click={handleFlashcardsStart}
        class="p-4 rounded-2xl border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 text-left group relative overflow-hidden"
      >
        <div class="flex items-center space-x-3 mb-3">
          <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
            <BookOpen size={24} class="text-white" />
          </div>
          <div>
            <h4 class="font-bold text-gray-800 group-hover:text-primary-700 transition-colors">Technique Cards</h4>
            <p class="text-sm text-gray-600 leading-relaxed">
              Browse curated techniques and tips for your current emotional state
            </p>
          </div>
        </div>
        
        <div class="flex items-center text-sm font-medium text-primary-600 group-hover:text-primary-700 transition-colors mt-3">
          <BookOpen size={16} class="mr-2" />
          <span>Browse Cards</span>
        </div>
      </button>
    </div>
  </div>

  <!-- Inspirational Quote -->
  {#if quotes.length > 0}
    <div class="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl p-8 mb-6 text-white shadow-lg">
      <div class="flex items-center mb-4">
        <Sparkles size={24} class="mr-3" />
        <h3 class="font-semibold text-xl">A thought for you</h3>
      </div>
      <p class="text-sm leading-relaxed mb-6 opacity-95">"{quotes[currentQuoteIndex]}"</p>
      <button
        on:click={nextQuote}
        class="text-sm bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-colors font-medium"
      >
        Next inspiration
      </button>
    </div>
  {/if}

  <!-- AI Video Coach Section (Premium) -->
  <div class="bg-white rounded-3xl p-8 mb-6 shadow-sm border border-primary-100">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-4">
        <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <Video size={32} class="text-white" />
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-800">AI Video Coach</h3>
          <p class="text-gray-600">Get personalized support for your {getMoodName().toLowerCase()} mood</p>
        </div>
      </div>
      
      {#if !canUseTavusAgent}
        <div class="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
          <Sparkles size={14} class="text-white" />
          <span class="text-white text-xs font-bold">Premium</span>
        </div>
      {/if}
    </div>

    {#if canUseTavusAgent}
      <div class="space-y-4">
        <p class="text-gray-600 leading-relaxed">
          Connect with our AI wellness coach through a personalized video session. 
          Share your feelings and get real-time support tailored to your current emotional state.
        </p>
        
        <button
          on:click={handleStartVideoAgent}
          disabled={loadingVideoAgent}
          class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold flex items-center justify-center space-x-3 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {#if loadingVideoAgent}
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Starting Video Session...</span>
          {:else}
            <Video size={20} />
            <span>Talk to AI Coach</span>
          {/if}
        </button>
      </div>
    {:else}
      <div class="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
        <div class="text-center space-y-4">
          <h4 class="font-bold text-gray-800">Premium AI Video Coach</h4>
          <p class="text-gray-600 text-sm leading-relaxed">
            Get personalized video sessions with our AI wellness coach. Experience real-time, 
            face-to-face support tailored to your specific mood and situation.
          </p>
          <ul class="text-gray-600 text-xs space-y-1 text-left max-w-sm mx-auto">
            <li>• Real-time video conversations</li>
            <li>• Mood-specific guidance</li>
            <li>• Personalized wellness techniques</li>
            <li>• Private and secure sessions</li>
          </ul>
          <button
            on:click={() => { subscriptionFeature = 'AI Video Coach'; showSubscriptionModal = true; }}
            class="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-300"
          >
            Upgrade for Video Coach
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Suggestions -->
  <div class="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-primary-100">
    <h3 class="text-xl font-semibold text-gray-800 mb-6">Suggestions for you</h3>
    <div class="space-y-4">
      {#each getSuggestions() as suggestion}
        <div class="flex items-center space-x-4 p-4 bg-primary-50 rounded-2xl border border-primary-100">
          <div class="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0"></div>
          <p class="text-gray-700 font-medium">{suggestion}</p>
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- Subscription Modal -->
<SubscriptionModal 
  bind:isOpen={showSubscriptionModal}
  feature={subscriptionFeature}
  onClose={() => showSubscriptionModal = false}
/>

<style>
  .floating {
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
</style>