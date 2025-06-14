<script>
  import { user } from '$lib/stores/auth.js'
  import { supabase } from '$lib/supabase.js'
  import { subscriptionStatus, canUseService, incrementUsage } from '$lib/stores/subscription.js'
  import SubscriptionModal from '$lib/components/SubscriptionModal.svelte'
  import UsageLimitModal from '$lib/components/UsageLimitModal.svelte'
  import { ArrowLeft, Send, Bot, User as UserIcon, Sparkles, MessageCircle, Loader, Crown } from '@lucide/svelte'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  let messages = []
  let newMessage = ''
  let loading = false
  let error = ''
  let chatContainer = null
  let showSubscriptionModal = false
  let showUsageLimitModal = false
  let usageInfo = { remaining: 0, limit: 0 }

  onMount(async () => {
    if ($user) {
      await loadChatHistory()
    }
  })

  // Watch for user changes
  $: if ($user) {
    loadChatHistory()
  }

  async function loadChatHistory() {
    if (!$user) {
      console.log('No user found, skipping chat history load')
      return
    }

    console.log('Loading chat history for user:', $user.id)

    try {
      const { data, error: fetchError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', $user.id)
        .order('created_at', { ascending: true })
        .limit(50)

      console.log('Chat history fetch result:', { data, fetchError })

      if (fetchError) {
        console.error('Error loading chat history:', fetchError)
        error = `Failed to load chat history: ${fetchError.message}`
      } else {
        messages = data || []
        console.log('Loaded messages:', messages.length)
        scrollToBottom()
      }
    } catch (err) {
      console.error('Unexpected error loading chat:', err)
      error = 'An unexpected error occurred while loading chat history'
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || loading || !$user) {
      console.log('Cannot send message:', { 
        hasMessage: !!newMessage.trim(), 
        loading, 
        hasUser: !!$user 
      })
      return
    }

    // Check usage limits
    const usage = canUseService('aiChat')
    if (!usage.allowed) {
      usageInfo = { remaining: usage.remaining, limit: usage.limit }
      showUsageLimitModal = true
      return
    }

    const userMessage = newMessage.trim()
    newMessage = ''
    loading = true
    error = ''

    console.log('Sending message to chat edge function:', userMessage)

    // Add user message to UI immediately
    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      user_message: userMessage,
      ai_response: '',
      created_at: new Date().toISOString(),
      isTemp: true
    }
    messages = [...messages, tempUserMessage]
    scrollToBottom()

    try {
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      // Call the existing chat edge function
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage })
      })

      console.log('Chat edge function response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Chat edge function error:', errorText)
        throw new Error(`Chat edge function error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('Chat edge function result:', result)

      if (result.error) {
        throw new Error(result.error)
      }

      // Remove temp message and add the real conversation
      messages = messages.filter(m => !m.isTemp)
      
      if (result.conversation) {
        messages = [...messages, result.conversation]
      } else {
        // Fallback: create conversation object from response
        messages = [...messages, {
          id: `edge-${Date.now()}`,
          user_message: userMessage,
          ai_response: result.response,
          created_at: new Date().toISOString(),
          user_id: $user.id
        }]
      }
      
      // Increment usage for free users
      if (!$subscriptionStatus.isPremium && !$subscriptionStatus.isTrialActive) {
        incrementUsage('aiChat')
      }
      
      console.log('Message sent successfully, total messages:', messages.length)
      scrollToBottom()

    } catch (err) {
      console.error('Error sending message:', err)
      error = `Failed to send message: ${err.message}`
      // Remove temp message on error
      messages = messages.filter(m => !m.isTemp)
    }

    loading = false
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }, 100)
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  function clearError() {
    error = ''
  }

  function handleUpgrade() {
    showSubscriptionModal = true
  }

  // Get current usage info
  $: currentUsage = canUseService('aiChat')
</script>

<svelte:head>
  <title>AI Chat - Chitta</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col">
  <!-- Header -->
  <div class="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 px-4 py-4 shadow-lg">
    <div class="flex items-center justify-between max-w-4xl mx-auto">
      <button 
        on:click={() => goto('/')} 
        class="p-3 rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:scale-105"
      >
        <ArrowLeft size={24} class="text-gray-600" />
      </button>
      
      <div class="flex items-center space-x-4">
        <div class="relative">
          <div class="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-lg">
            <Bot size={24} class="text-white" />
          </div>
          <!-- Online indicator -->
          <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-800">AI Wellness Coach</h1>
          <p class="text-sm text-gray-500 flex items-center">
            <span class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Online • Here to support your mental wellness journey
          </p>
        </div>
      </div>
      
      <!-- Usage indicator for free users -->
      {#if !$subscriptionStatus.isPremium && !$subscriptionStatus.isTrialActive}
        <button
          on:click={handleUpgrade}
          class="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg"
        >
          <Crown size={16} />
          <span class="text-sm font-medium">{currentUsage.remaining}/{currentUsage.limit}</span>
        </button>
      {:else}
        <div class="w-12"></div>
      {/if}
    </div>
  </div>

  <!-- Trial/Premium Status Banner -->
  {#if $subscriptionStatus.isTrialActive}
    <div class="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 text-center">
      <p class="text-sm font-medium">
        🎉 Free Trial Active - {$subscriptionStatus.trialDaysLeft} days remaining
      </p>
    </div>
  {:else if $subscriptionStatus.isPremium}
    <div class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 text-center">
      <p class="text-sm font-medium">
        👑 Premium Active - Unlimited AI Chat
      </p>
    </div>
  {/if}

  <!-- Error Banner -->
  {#if error}
    <div class="bg-red-50 border-b border-red-200 px-4 py-3">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span class="text-white text-xs">!</span>
          </div>
          <span class="text-red-700 text-sm font-medium">{error}</span>
        </div>
        <button 
          on:click={clearError}
          class="text-red-500 hover:text-red-700 transition-colors"
        >
          <span class="text-lg">&times;</span>
        </button>
      </div>
    </div>
  {/if}

  <!-- Chat Messages -->
  <div 
    bind:this={chatContainer}
    class="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-4xl mx-auto w-full"
  >
    {#if messages.length === 0 && !loading}
      <!-- Welcome Message -->
      <div class="text-center space-y-8 py-12">
        <div class="relative">
          <div class="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <Sparkles size={36} class="text-white" />
          </div>
          <!-- Floating particles -->
          <div class="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
          <div class="absolute -bottom-2 -left-2 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
        </div>
        
        <div class="space-y-4">
          <h2 class="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Welcome to your AI Wellness Coach
          </h2>
          <p class="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
            I'm here to listen, support, and guide you on your mental wellness journey. 
            Feel free to share what's on your mind, ask questions about mindfulness, 
            or simply check in about how you're feeling today.
          </p>
          
          <!-- Usage info for free users -->
          {#if !$subscriptionStatus.isPremium && !$subscriptionStatus.isTrialActive}
            <div class="bg-orange-50 border border-orange-200 rounded-2xl p-4 max-w-md mx-auto">
              <p class="text-orange-700 text-sm font-medium">
                Free Plan: {currentUsage.remaining} messages remaining today
              </p>
              <button
                on:click={handleUpgrade}
                class="text-orange-600 hover:text-orange-800 text-sm font-medium underline mt-1"
              >
                Upgrade for unlimited access
              </button>
            </div>
          {/if}
        </div>
        
        <!-- Suggested conversation starters -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-12">
          <button 
            on:click={() => newMessage = "I'm feeling anxious today"}
            class="p-6 bg-white rounded-3xl border border-primary-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 text-left group transform hover:-translate-y-1"
          >
            <div class="text-2xl mb-3">💭</div>
            <div class="text-primary-600 font-bold mb-2 group-hover:text-primary-700">Share feelings</div>
            <div class="text-gray-600 text-sm">"I'm feeling anxious today"</div>
          </button>
          
          <button 
            on:click={() => newMessage = "Can you help me with meditation?"}
            class="p-6 bg-white rounded-3xl border border-primary-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 text-left group transform hover:-translate-y-1"
          >
            <div class="text-2xl mb-3">🧘‍♀️</div>
            <div class="text-primary-600 font-bold mb-2 group-hover:text-primary-700">Get guidance</div>
            <div class="text-gray-600 text-sm">"Can you help me with meditation?"</div>
          </button>
          
          <button 
            on:click={() => newMessage = "What are some stress management techniques?"}
            class="p-6 bg-white rounded-3xl border border-primary-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 text-left group transform hover:-translate-y-1"
          >
            <div class="text-2xl mb-3">💡</div>
            <div class="text-primary-600 font-bold mb-2 group-hover:text-primary-700">Learn techniques</div>
            <div class="text-gray-600 text-sm">"What are some stress management techniques?"</div>
          </button>
          
          <button 
            on:click={() => newMessage = "I want to improve my mental wellness"}
            class="p-6 bg-white rounded-3xl border border-primary-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 text-left group transform hover:-translate-y-1"
          >
            <div class="text-2xl mb-3">🌱</div>
            <div class="text-primary-600 font-bold mb-2 group-hover:text-primary-700">Start journey</div>
            <div class="text-gray-600 text-sm">"I want to improve my mental wellness"</div>
          </button>
        </div>
      </div>
    {/if}

    {#each messages as message (message.id || message.created_at)}
      <!-- User Message -->
      <div class="flex justify-end animate-fade-in">
        <div class="max-w-xs lg:max-w-md">
          <div class="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-3xl rounded-br-lg px-6 py-4 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <p class="text-sm leading-relaxed">{message.user_message}</p>
          </div>
          <div class="flex items-center justify-end space-x-2 mt-2 px-2">
            <UserIcon size={14} class="text-gray-400" />
            <span class="text-xs text-gray-500">{formatTime(message.created_at)}</span>
          </div>
        </div>
      </div>

      <!-- AI Response -->
      {#if message.ai_response || message.isTemp}
        <div class="flex justify-start animate-fade-in">
          <div class="max-w-xs lg:max-md">
            <div class="bg-white border border-gray-200 rounded-3xl rounded-bl-lg px-6 py-4 shadow-lg hover:shadow-xl transition-shadow duration-300">
              {#if message.ai_response}
                <p class="text-sm text-gray-800 leading-relaxed">{message.ai_response}</p>
              {:else}
                <!-- Typing indicator -->
                <div class="flex items-center space-x-3">
                  <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  </div>
                  <span class="text-xs text-gray-500 font-medium">AI is thinking...</span>
                </div>
              {/if}
            </div>
            <div class="flex items-center space-x-2 mt-2 px-2">
              <Bot size={14} class="text-primary-500" />
              <span class="text-xs text-gray-500">
                {message.ai_response ? formatTime(message.created_at) : 'Now'}
              </span>
            </div>
          </div>
        </div>
      {/if}
    {/each}
  </div>

  <!-- Message Input -->
  <div class="bg-white/90 backdrop-blur-lg border-t border-gray-200/50 px-4 py-6 shadow-lg">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-end space-x-4">
        <div class="flex-1 relative">
          <textarea
            bind:value={newMessage}
            on:keypress={handleKeyPress}
            placeholder="Share what's on your mind..."
            disabled={loading}
            class="w-full px-6 py-4 pr-16 border border-gray-300 rounded-3xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-white/95 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg"
            rows="1"
            style="min-height: 56px; max-height: 120px;"
          ></textarea>
          
          <!-- Status indicator -->
          <div class="absolute bottom-4 right-4 flex items-center space-x-2">
            {#if loading}
              <Loader size={16} class="animate-spin text-primary-500" />
              <span class="text-xs text-gray-400">Sending...</span>
            {:else}
              <MessageCircle size={16} class="text-gray-400" />
            {/if}
          </div>
        </div>
        
        <button
          on:click={sendMessage}
          disabled={!newMessage.trim() || loading}
          class="p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
        >
          <Send size={20} />
        </button>
      </div>
      
      <div class="flex items-center justify-between mt-4">
        <p class="text-xs text-gray-500">
          Press Enter to send • Shift+Enter for new line
        </p>
        <div class="flex items-center space-x-4">
          {#if !$subscriptionStatus.isPremium && !$subscriptionStatus.isTrialActive}
            <p class="text-xs text-gray-400">
              {currentUsage.remaining}/{currentUsage.limit} messages today
            </p>
          {/if}
          <p class="text-xs text-gray-400">
            {newMessage.length}/500 characters
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Subscription Modal -->
<SubscriptionModal 
  bind:isOpen={showSubscriptionModal}
  feature="Unlimited AI Chat"
  onClose={() => showSubscriptionModal = false}
/>

<!-- Usage Limit Modal -->
<UsageLimitModal 
  bind:isOpen={showUsageLimitModal}
  service="aiChat"
  remaining={usageInfo.remaining}
  limit={usageInfo.limit}
  onClose={() => showUsageLimitModal = false}
/>

<style>
  textarea {
    field-sizing: content;
  }

  .animate-fade-in {
    animation: fadeIn 0.5s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>